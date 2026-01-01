"""Payment models for Stripe integration"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
from uuid import uuid4


# Subscription tiers
SUBSCRIPTION_TIERS = {
    "free": {
        "name": "Free",
        "price": 0.0,
        "max_configs": 1,
        "features": ["1 configuration", "Basic controls"]
    },
    "pro": {
        "name": "Pro",
        "price": 5.0,
        "max_configs": 100,
        "features": ["Unlimited configurations", "Priority support", "Advanced controls"]
    }
}


class CheckoutRequest(BaseModel):
    tier: str = "pro"  # Only pro tier for now


class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    user_email: str
    session_id: str
    amount: float
    currency: str = "usd"
    tier: str
    status: str = "pending"  # pending, paid, failed, expired
    metadata: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
