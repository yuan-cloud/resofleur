"""
Resofleur API Server
A cloud-based control interface for Resolume Arena & Avenue

Architecture:
- FastAPI with async MongoDB (motor)
- JWT authentication with bcrypt password hashing
- Proxy layer to Resolume REST API via ngrok
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
import httpx
from datetime import datetime, timedelta, timezone
from uuid import uuid4

# =============================================================================
# CONFIGURATION
# =============================================================================

VERSION = "2.0.0"
BUILD = "2024-12-22"

class Config:
    """Application configuration from environment variables."""
    MONGO_URL: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.environ.get("DB_NAME", "resofleur")
    JWT_SECRET: str = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    CORS_ORIGINS: list = ["*"]

config = Config()

# =============================================================================
# LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("resofleur")

# =============================================================================
# DATABASE & HTTP CLIENT (Singleton Pattern)
# =============================================================================

class Database:
    """MongoDB connection manager."""
    _instance: Optional["Database"] = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def db(self):
        if self._db is None:
            client = AsyncIOMotorClient(
                config.MONGO_URL,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000
            )
            self._db = client[config.DB_NAME]
            logger.info(f"Connected to MongoDB: {config.DB_NAME}")
        return self._db

class HttpClient:
    """HTTP client for Resolume proxy requests."""
    _instance: Optional["HttpClient"] = None
    _client: Optional[httpx.AsyncClient] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0, verify=False)
        return self._client

db = Database()
http = HttpClient()

# =============================================================================
# SECURITY
# =============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    """Dependency: Extract and validate JWT from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResolumeConfigCreate(BaseModel):
    name: str
    host: str
    port: int = 443
    is_active: bool = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# =============================================================================
# APPLICATION FACTORY
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    logger.info(f"🌸 Resofleur v{VERSION} starting...")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="Resofleur API",
    description="Cloud-based control interface for Resolume",
    version=VERSION,
    lifespan=lifespan
)

# =============================================================================
# MIDDLEWARE
# =============================================================================

ALLOWED_HEADERS = "Content-Type, Authorization, Accept, Origin, X-Requested-With, ngrok-skip-browser-warning"

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    """Custom CORS middleware with preflight handling."""
    if request.method == "OPTIONS":
        return Response(
            content="",
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": ALLOWED_HEADERS,
                "Access-Control-Max-Age": "86400",
            }
        )
    
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = ALLOWED_HEADERS
    return response

# =============================================================================
# HEALTH ENDPOINTS
# =============================================================================

@app.get("/")
def root():
    return {"service": "resofleur", "version": VERSION, "status": "running"}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "version": VERSION}

# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

@app.post("/api/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Create a new user account."""
    existing = await db.db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    user_id = str(uuid4())
    user_doc = {
        "id": user_id,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "full_name": req.full_name,
        "subscription_tier": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.db.users.insert_one(user_doc)
    
    token = create_access_token(user_id, req.email)
    user_response = {k: v for k, v in user_doc.items() if k not in ["_id", "hashed_password"]}
    
    logger.info(f"User registered: {req.email}")
    return AuthResponse(access_token=token, user=user_response)

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate and return access token."""
    user = await db.db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"], user["email"])
    user_response = {k: v for k, v in user.items() if k not in ["_id", "hashed_password"]}
    
    logger.info(f"User logged in: {req.email}")
    return AuthResponse(access_token=token, user=user_response)

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    user = await db.db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# =============================================================================
# RESOLUME CONFIGURATION ENDPOINTS
# =============================================================================

@app.get("/api/resolume/config")
async def get_config(current_user: dict = Depends(get_current_user)):
    """Get user's active Resolume configuration."""
    config_doc = await db.db.configurations.find_one(
        {"user_id": current_user["sub"], "is_active": True},
        {"_id": 0}
    )
    return config_doc or {}

@app.get("/api/resolume/configs")
async def get_configs(current_user: dict = Depends(get_current_user)):
    """Get all user's Resolume configurations."""
    configs = await db.db.configurations.find(
        {"user_id": current_user["sub"]},
        {"_id": 0}
    ).to_list(100)
    return configs

@app.post("/api/resolume/config")
async def create_config(cfg: ResolumeConfigCreate, current_user: dict = Depends(get_current_user)):
    """Create a new Resolume configuration."""
    user_id = current_user["sub"]
    
    # Deactivate existing configs
    await db.db.configurations.update_many(
        {"user_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    config_doc = {
        "id": str(uuid4()),
        "user_id": user_id,
        "name": cfg.name,
        "host": cfg.host,
        "port": cfg.port,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.db.configurations.insert_one(config_doc)
    
    return {k: v for k, v in config_doc.items() if k != "_id"}

@app.delete("/api/resolume/config/{config_id}")
async def delete_config(config_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a Resolume configuration."""
    result = await db.db.configurations.delete_one({
        "id": config_id,
        "user_id": current_user["sub"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"success": True}

@app.put("/api/resolume/config/{config_id}/activate")
async def activate_config(config_id: str, current_user: dict = Depends(get_current_user)):
    """Activate a specific configuration."""
    user_id = current_user["sub"]
    
    # Verify ownership
    cfg = await db.db.configurations.find_one({"id": config_id, "user_id": user_id})
    if not cfg:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Deactivate all, activate selected
    await db.db.configurations.update_many({"user_id": user_id}, {"$set": {"is_active": False}})
    await db.db.configurations.update_one({"id": config_id}, {"$set": {"is_active": True}})
    
    return {"success": True}

# =============================================================================
# RESOLUME PROXY LAYER
# =============================================================================

async def get_user_config(user_id: str) -> dict:
    """Get active Resolume config for user."""
    cfg = await db.db.configurations.find_one(
        {"user_id": user_id, "is_active": True},
        {"_id": 0}
    )
    if not cfg:
        raise HTTPException(status_code=400, detail="No Resolume configuration. Add one in Settings.")
    return cfg

async def proxy_to_resolume(method: str, path: str, user_id: str, body: dict = None):
    """Proxy request to user's Resolume instance."""
    cfg = await get_user_config(user_id)
    
    # Build URL (ngrok uses HTTPS on 443)
    host, port = cfg["host"], cfg.get("port", 443)
    base = f"https://{host}" if port == 443 else f"http://{host}:{port}"
    url = f"{base}/api/v1{path}"
    
    headers = {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    logger.info(f"Proxy {method} -> {url}")
    
    try:
        client = http.client
        if method == "GET":
            resp = await client.get(url, headers=headers)
        elif method == "POST":
            resp = await client.post(url, json=body, headers=headers)
        elif method == "PUT":
            resp = await client.put(url, json=body, headers=headers)
        else:
            resp = await client.request(method, url, json=body, headers=headers)
        
        if resp.status_code == 204:
            return {"success": True}
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=f"Resolume: {resp.text}")
        
        try:
            return resp.json()
        except ValueError:
            return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        raise HTTPException(status_code=502, detail=f"Cannot reach Resolume: {e}")

# =============================================================================
# RESOLUME STATUS & CONTROL ENDPOINTS
# =============================================================================

@app.get("/api/resolume/status")
async def get_status(current_user: dict = Depends(get_current_user)):
    """Check Resolume connection status."""
    user_id = current_user["sub"]
    cfg = await db.db.configurations.find_one(
        {"user_id": user_id, "is_active": True},
        {"_id": 0}
    )
    
    if not cfg:
        return {"connected": False, "config": None, "message": "No configuration set"}
    
    # Try to connect
    try:
        host, port = cfg["host"], cfg.get("port", 443)
        base = f"https://{host}" if port == 443 else f"http://{host}:{port}"
        resp = await http.client.get(
            f"{base}/api/v1/composition",
            headers={"ngrok-skip-browser-warning": "true"}
        )
        connected = resp.status_code == 200
    except Exception:
        connected = False
    
    return {
        "connected": connected,
        "config": cfg,
        "message": "Connected to Resolume" if connected else "Cannot reach Resolume"
    }

@app.get("/api/resolume/composition/tempo/bpm")
async def get_bpm(current_user: dict = Depends(get_current_user)):
    """Get current BPM from Resolume."""
    try:
        result = await proxy_to_resolume("GET", "/composition", current_user["sub"])
        bpm = result.get("tempocontroller", {}).get("tempo", {}).get("value", 120)
        return {"value": bpm}
    except Exception:
        return {"value": 120}

@app.post("/api/resolume/composition/tempo/bpm")
async def set_bpm(bpm: float = 120, current_user: dict = Depends(get_current_user)):
    """Set BPM using Resolume's parameter-by-id API."""
    user_id = current_user["sub"]
    
    # Get tempo parameter ID
    comp = await proxy_to_resolume("GET", "/composition", user_id)
    tempo_id = comp.get("tempocontroller", {}).get("tempo", {}).get("id")
    
    if not tempo_id:
        raise HTTPException(status_code=500, detail="Cannot find tempo parameter")
    
    await proxy_to_resolume("PUT", f"/parameter/by-id/{tempo_id}", user_id, {"value": bpm})
    return {"success": True, "value": bpm}

@app.get("/api/resolume/composition/layers/{layer}/video/opacity")
async def get_opacity(layer: int, current_user: dict = Depends(get_current_user)):
    """Get layer opacity."""
    result = await proxy_to_resolume("GET", f"/composition/layers/{layer}", current_user["sub"])
    opacity = result.get("video", {}).get("opacity", {}).get("value", 1.0)
    return {"value": opacity}

@app.post("/api/resolume/composition/layers/{layer}/video/opacity")
async def set_opacity(layer: int, opacity: float = 1.0, current_user: dict = Depends(get_current_user)):
    """Set layer opacity using parameter-by-id API."""
    user_id = current_user["sub"]
    
    result = await proxy_to_resolume("GET", f"/composition/layers/{layer}", user_id)
    opacity_id = result.get("video", {}).get("opacity", {}).get("id")
    
    if not opacity_id:
        raise HTTPException(status_code=500, detail="Cannot find opacity parameter")
    
    await proxy_to_resolume("PUT", f"/parameter/by-id/{opacity_id}", user_id, {"value": opacity})
    return {"success": True, "value": opacity}

@app.get("/api/resolume/composition/layers/{layer}/clips")
async def get_clips(layer: int, current_user: dict = Depends(get_current_user)):
    """Get clips for a layer."""
    result = await proxy_to_resolume("GET", f"/composition/layers/{layer}", current_user["sub"])
    clips = result.get("clips", [])
    clip_list = [
        {
            "id": i + 1,
            "name": c.get("name", {}).get("value", ""),
            "isConnected": c.get("connected", {}).get("value", False) or c.get("connected", {}).get("value", "") in ["Connected", "Connected & previewing"],
            "thumbnailUrl": "",
            "transport": c.get("transport", {})
        }
        for i, c in enumerate(clips[:9])
    ]
    return {"clips": clip_list}

@app.post("/api/resolume/composition/layers/{layer}/clips/{clip}/connect")
async def trigger_clip(layer: int, clip: int, current_user: dict = Depends(get_current_user)):
    """Trigger (connect) a clip."""
    await proxy_to_resolume("POST", f"/composition/layers/{layer}/clips/{clip}/connect", current_user["sub"])
    return {"success": True}

@app.post("/api/resolume/composition/layers/{layer}/clips/{clip}/transport/position")
async def set_position(layer: int, clip: int, position: float = 0, current_user: dict = Depends(get_current_user)):
    """Set clip playback position using parameter-by-id API."""
    user_id = current_user["sub"]
    
    result = await proxy_to_resolume("GET", f"/composition/layers/{layer}/clips/{clip}", user_id)
    pos_id = result.get("transport", {}).get("position", {}).get("id")
    
    if not pos_id:
        raise HTTPException(status_code=500, detail="Cannot find position parameter")
    
    await proxy_to_resolume("PUT", f"/parameter/by-id/{pos_id}", user_id, {"value": position})
    return {"success": True, "value": position}

@app.post("/api/resolume/composition/layers/{layer}/clear")
async def clear_layer(layer: int, current_user: dict = Depends(get_current_user)):
    """Clear all clips on a layer."""
    await proxy_to_resolume("POST", f"/composition/layers/{layer}/clear", current_user["sub"])
    return {"success": True}

@app.get("/api/resolume/composition/layers/{layer}/clips/{clip}/thumbnail")
async def get_thumbnail(layer: int, clip: int):
    """Proxy thumbnail image from Resolume."""
    # Get any active config (thumbnails don't need auth)
    cfg = await db.db.configurations.find_one({"is_active": True}, {"_id": 0})
    if not cfg:
        raise HTTPException(status_code=400, detail="No configuration")
    
    host, port = cfg["host"], cfg.get("port", 443)
    base = f"https://{host}" if port == 443 else f"http://{host}:{port}"
    url = f"{base}/api/v1/composition/layers/{layer}/clips/{clip}/thumbnail"
    
    try:
        resp = await http.client.get(url, headers={"ngrok-skip-browser-warning": "true"})
        if resp.status_code == 200:
            return Response(content=resp.content, media_type=resp.headers.get("content-type", "image/png"))
        raise HTTPException(status_code=resp.status_code, detail="Thumbnail not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# =============================================================================
# DEBUG ENDPOINTS (Development only)
# =============================================================================

@app.get("/api/debug/routes")
def list_routes():
    """List all registered routes (for debugging)."""
    return {
        "routes": [
            {"path": r.path, "methods": list(r.methods - {"HEAD", "OPTIONS"})}
            for r in app.routes
            if hasattr(r, "methods")
        ]
    }

logger.info("✅ Resofleur API ready")
