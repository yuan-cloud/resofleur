# 🌸 Resofleur

### *The VJ remote control that actually works.*

> Control Resolume Arena from your phone, tablet, or anywhere in the venue. No cables. No limitations. Just beautiful, responsive control.

[![Live Demo](https://img.shields.io/badge/Live-Demo-FF6B6B?style=for-the-badge)](https://resofleur-production.up.railway.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-FF6B6B?style=flat-square)]()

---

## 🎯 The Problem

**Resolume's REST API is notoriously difficult.** Most developers give up after:

- ❌ Getting stuck on basic composition queries
- ❌ Failing to control anything beyond layer 1
- ❌ Realizing PUT/POST endpoints return 404s
- ❌ Not understanding the undocumented parameter-by-ID pattern

**The result?** VJs are still chained to their laptops during performances.

---

## ✅ The Solution

I reverse-engineered the Resolume API and built the remote control that should have shipped with the software.

| Feature | Description |
|---------|-------------|
| **4-Layer Control** | Full access to layers 1-4, not just the first one |
| **9 Clips Per Layer** | Trigger any clip with live thumbnail preview |
| **Video Scrubbing** | Drag the timeline, see it update instantly |
| **BPM Sync** | Match your visuals to the DJ's tempo |
| **Opacity Control** | Blend layers smoothly in real-time |
| **Mobile-First** | Responsive UI tested on iOS, Android, iPad |
| **Multi-User** | Each user connects to their own Resolume instance |

---

## 🏆 Technical Highlights

### Cracking the Resolume API

After extensive reverse-engineering, I discovered that Resolume's REST API requires a two-step pattern:

```
1. GET /composition → fetch parameter IDs
2. PUT /parameter/by-id/{id} → change values
```

**This is undocumented.** The official Swagger docs show endpoints that return 404. I discovered the real pattern through packet inspection and systematic testing.

### Type-Safe Architecture

One of the **only TypeScript implementations** of a Resolume controller:

```typescript
// Fully typed clip model
interface ClipViewModel {
  readonly id: number;
  readonly name: string;
  readonly isConnected: boolean;
  readonly thumbnailUrl: string;
}

// Type-safe API client
class ResolumeApiClient {
  async triggerClip(layer: LayerIndex, clip: ClipIndex): Promise<void>
  async setLayerOpacity(layer: LayerIndex, opacity: number): Promise<void>
  async setBpm(value: number): Promise<void>
}
```

### Mobile-First Design

| Device | Experience |
|--------|------------|
| **iPhone** | Touch-optimized with 44px tap targets, no accidental triggers |
| **iPad** | Landscape mode transforms into a full control surface |
| **Desktop** | Hover states with keyboard shortcuts (roadmap) |

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 18 + TypeScript | Type safety, modern hooks, excellent DX |
| **Styling** | Tailwind CSS | Rapid iteration, consistent design system |
| **Backend** | FastAPI (Python) | Async-first, auto-generated OpenAPI docs |
| **Database** | MongoDB | Flexible schemas for user configurations |
| **Auth** | JWT + bcrypt | Industry standard, stateless authentication |
| **Payments** | Stripe | Subscription billing infrastructure |
| **Tunnel** | ngrok | Secure localhost-to-cloud bridging |

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER DEVICES                          │
│   📱 iPhone    📱 Android    📱 iPad    💻 Desktop           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESOFLEUR CLOUD                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   React     │──│   FastAPI   │──│   MongoDB   │          │
│  │  Frontend   │  │   Backend   │  │   Atlas     │          │
│  └─────────────┘  └──────┬──────┘  └─────────────┘          │
└──────────────────────────┼──────────────────────────────────┘
                           │ Authenticated Proxy
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      NGROK TUNNEL                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESOLUME ARENA/AVENUE                      │
│                   (Running locally on VJ's machine)          │
└─────────────────────────────────────────────────────────────┘
```

**Key insight:** Each user's Resolume stays on their machine. Resofleur provides secure remote access without exposing local networks.

---

## 🚀 Quick Start

### Prerequisites
- Resolume Arena/Avenue 7+ (REST API enabled)
- ngrok account (free tier)
- Node.js 18+, Python 3.11+

### Setup

```bash
# Clone the repository
git clone https://github.com/yuan-cloud/resofleur.git
cd resofleur

# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --port 8001

# Frontend (new terminal)
cd frontend
yarn install
yarn start

# Enable Resolume REST API: Preferences → Webserver → Enable
# Start ngrok: ngrok http 8080
# Open http://localhost:3000 and add your ngrok URL
```

---

## 📁 Project Structure

```
resofleur/
├── backend/
│   ├── server.py              # FastAPI application (~550 LOC)
│   ├── models/                # Pydantic schemas
│   │   ├── user_models.py
│   │   ├── resolume_models.py
│   │   └── payment_models.py
│   └── tests/                 # pytest test suite
│
├── frontend/
│   └── src/
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks (connection, clips, controls)
│       ├── context/           # Authentication context
│       ├── services/          # Type-safe API client
│       ├── pages/             # Route pages
│       └── types/             # TypeScript definitions
│
└── README.md
```

---

## 🔐 Security

- ✅ JWT authentication with 24-hour token expiration
- ✅ bcrypt password hashing (work factor 12)
- ✅ User-scoped configurations (complete data isolation)
- ✅ HTTPS enforced in production
- ✅ Input validation via Pydantic models
- ✅ CORS configured for production origins

---

## 🗺 Roadmap

- [ ] Keyboard shortcuts for clip triggering
- [ ] OSC protocol bridge
- [ ] Effect parameter controls
- [ ] Cue list / show programming
- [ ] Multi-composition switching

---

## 💡 Key Learnings

1. **Read the packets, not the docs** — Resolume's Swagger documentation is incomplete
2. **Parameter IDs are everything** — The undocumented key to actual control
3. **Mobile-first is mandatory** — VJs need to move; the app should move with them
4. **Proxy architecture enables scale** — User isolation becomes natural

---

## 🙋 FAQ

**Q: Why not use OSC?**  
A: OSC requires static IPs and network configuration. Resofleur works over the internet from anywhere.

**Q: What's the latency?**  
A: ~50-100ms via ngrok—imperceptible for manual control.

**Q: Can multiple people control one Resolume?**  
A: Yes. Share the same configuration for collaborative VJing.

**Q: Which Resolume versions are supported?**  
A: Arena 7+ and Avenue 7+ with REST API enabled.

---

## 📄 License

Proprietary software. All rights reserved.

---

<div align="center">

**Built by a full-stack engineer who actually VJs.**

*Because performers deserve better tools.* 🌸

</div>
