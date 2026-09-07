from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(30), default="citizen")

class Road(Base):
    __tablename__ = "roads"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    road_type: Mapped[str] = mapped_column(String(50), default="arterial")
    status: Mapped[str] = mapped_column(String(40), default="open")
    geometry = mapped_column(Geometry("LINESTRING", srid=4326))

class Issue(Base):
    __tablename__ = "issues"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(20), default="Medium")
    status: Mapped[str] = mapped_column(String(30), default="Open")
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, server_default=func.now())
    geometry = mapped_column(Geometry("POINT", srid=4326))

class Parking(Base):
    __tablename__ = "parking"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    capacity: Mapped[int] = mapped_column(Integer)
    available: Mapped[int] = mapped_column(Integer)
    geometry = mapped_column(Geometry("POINT", srid=4326))

class Construction(Base):
    __tablename__ = "construction"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_name: Mapped[str] = mapped_column(String(180))
    start_date: Mapped[str] = mapped_column(String(20))
    end_date: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(40))
    geometry = mapped_column(Geometry("POLYGON", srid=4326))

class LogisticsHub(Base):
    __tablename__ = "logistics_hubs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    capacity: Mapped[int] = mapped_column(Integer)
    geometry = mapped_column(Geometry("POINT", srid=4326))

class DeliveryZone(Base):
    __tablename__ = "delivery_zones"
    id: Mapped[int] = mapped_column(primary_key=True)
    zone_name: Mapped[str] = mapped_column(String(160))
    restrictions: Mapped[str] = mapped_column(Text, default="")
    geometry = mapped_column(Geometry("POLYGON", srid=4326))

class Traffic(Base):
    __tablename__ = "traffic"
    id: Mapped[int] = mapped_column(primary_key=True)
    road_id: Mapped[int] = mapped_column(ForeignKey("roads.id"))
    congestion_level: Mapped[str] = mapped_column(String(20))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, server_default=func.now())
    speed: Mapped[float] = mapped_column(Float)
