from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, OrderStatus

class UserBase(BaseModel):
    phone: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str
    car_model: Optional[str] = None
    car_plate: Optional[str] = None

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    passenger_id: int
    pickup_lat: float
    pickup_lon: float
    dropoff_lat: float
    dropoff_lon: float

class OrderOut(BaseModel):
    id: int
    passenger_id: int
    driver_id: Optional[int]
    status: OrderStatus
    created_at: datetime
    class Config:
        from_attributes = True

class LocationUpdate(BaseModel):
    lat: float
    lon: float
