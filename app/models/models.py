from enum import Enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from app.db.session import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    DRIVER = "driver"
    PASSENGER = "passenger"

class OrderStatus(str, Enum):
    PENDING = "pending"      # Ожидает принятия
    ACCEPTED = "accepted"    # Принят водителем, едет к пассажиру
    ON_WAY = "on_way"        # Пассажир в машине, едут к цели
    COMPLETED = "completed"  # Поездка завершена
    CANCELLED = "cancelled"  # Отменен

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Integer, default=1)
    
    # Для водителей
    car_model = Column(String, nullable=True)
    car_plate = Column(String, nullable=True)
    
    # Связи
    orders_as_passenger = relationship("Order", foreign_keys="Order.passenger_id")
    orders_as_driver = relationship("Order", foreign_keys="Order.driver_id")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Геопозиции: Point(longitude latitude)
    pickup_location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    dropoff_location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    price = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DriverLocation(Base):
    __tablename__ = "driver_locations"

    driver_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    coords = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
