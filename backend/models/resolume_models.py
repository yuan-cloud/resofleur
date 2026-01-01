from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timezone


class ResolumeConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""  # Required for multi-tenancy
    name: str
    host: str = "127.0.0.1"
    port: int = 8080
    is_active: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ResolumeConfigCreate(BaseModel):
    name: str
    host: str = "127.0.0.1"
    port: int = 8080


class PresetScene(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""  # Required for multi-tenancy
    name: str
    description: Optional[str] = None
    state: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PresetSceneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    state: Dict[str, Any]


class ToggleMapping(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""  # Required for multi-tenancy
    slider_id: str
    resolume_param: str
    lighting_param: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ToggleMappingCreate(BaseModel):
    slider_id: str
    resolume_param: str
    lighting_param: Optional[str] = None

