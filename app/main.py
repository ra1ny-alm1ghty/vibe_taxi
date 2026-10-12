from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Order, DriverLocation, OrderStatus, UserRole
from app.schemas.schemas import UserCreate, UserOut, OrderCreate, OrderOut, LocationUpdate
from sqlalchemy import func
from geoalchemy2.elements import WKTElement

app = FastAPI(title="Vibe Taxi API")

# --- Эндпоинты пользователей ---

@app.post("/users/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        phone=user.phone,
        full_name=user.full_name,
        role=user.role,
        hashed_password=user.password, # В продакшене обязательно хешировать!
        car_model=user.car_model,
        car_plate=user.car_plate
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Эндпоинты заказов ---

@app.post("/orders/", response_model=OrderOut)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Создаем точку через WKT (Well-Known Text)
    pickup = WKTElement(f'POINT({order.pickup_lon} {order.pickup_lat})', srid=4326)
    dropoff = WKTElement(f'POINT({order.dropoff_lon} {order.dropoff_lat})', srid=4326)
    
    db_order = Order(
        passenger_id=order.passenger_id,
        pickup_location=pickup,
        dropoff_location=dropoff,
        status=OrderStatus.PENDING
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

# --- Геопозиционирование таксистов ---

@app.post("/drivers/location/")
def update_location(loc: LocationUpdate, driver_id: int, db: Session = Depends(get_db)):
    point = WKTElement(f'POINT({loc.lon} {loc.lat})', srid=4326)
    
    db_loc = db.query(DriverLocation).filter(DriverLocation.driver_id == driver_id).first()
    if db_loc:
        db_loc.coords = point
    else:
        db_loc = DriverLocation(driver_id=driver_id, coords=point)
        db.add(db_loc)
    
    db.commit()
    return {"status": "updated"}

# --- Администратор: Наблюдение ---

@app.get("/admin/orders/")
def get_all_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.patch("/admin/orders/{order_id}")
def admin_change_status(order_id: int, status: OrderStatus, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return order

# --- WebSocket для real-time обновления (Заготовка) ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/taxi_tracking")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Здесь будет логика рассылки координат конкретного водителя пассажиру
            await manager.broadcast(f"Location update: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
