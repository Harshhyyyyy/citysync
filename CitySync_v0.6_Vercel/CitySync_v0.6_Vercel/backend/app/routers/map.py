from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(prefix="/api/map", tags=["map"])


def feature_collection(rows):
    return {"type": "FeatureCollection", "features": rows}


@router.get("/health")
def map_health(db: Session = Depends(get_db)):
    return {"postgis": db.execute(text("SELECT PostGIS_Version()")).scalar()}


@router.get("/layers")
def layer_summary(db: Session = Depends(get_db)):
    tables = ["roads", "issues", "parking", "construction", "logistics_hubs", "delivery_zones", "traffic"]
    return {t: db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar() for t in tables}


@router.get("/data")
def map_data(db: Session = Depends(get_db)):
    roads = db.execute(text("""
        SELECT r.id, r.name, r.road_type, r.status,
               COALESCE(t.congestion_level, 'Unknown') AS congestion_level,
               t.speed,
               ST_AsGeoJSON(r.geometry) AS geometry
        FROM roads r
        LEFT JOIN LATERAL (
            SELECT congestion_level, speed
            FROM traffic
            WHERE traffic.road_id = r.id
            ORDER BY timestamp DESC NULLS LAST, id DESC
            LIMIT 1
        ) t ON TRUE
        ORDER BY r.id
    """)).mappings().all()

    parking = db.execute(text("""
        SELECT id, name, capacity, available, ST_AsGeoJSON(geometry) AS geometry
        FROM parking ORDER BY id
    """)).mappings().all()

    hubs = db.execute(text("""
        SELECT id, name, capacity, ST_AsGeoJSON(geometry) AS geometry
        FROM logistics_hubs ORDER BY id
    """)).mappings().all()

    construction = db.execute(text("""
        SELECT id, project_name, start_date, end_date, status,
               ST_AsGeoJSON(geometry) AS geometry
        FROM construction ORDER BY id
    """)).mappings().all()

    delivery_zones = db.execute(text("""
        SELECT id, zone_name, restrictions, ST_AsGeoJSON(geometry) AS geometry
        FROM delivery_zones ORDER BY id
    """)).mappings().all()

    issues = db.execute(text("""
        SELECT id, category, description, severity, status, reported_at,
               ST_X(geometry) AS longitude, ST_Y(geometry) AS latitude,
               ST_AsGeoJSON(geometry) AS geometry
        FROM issues ORDER BY reported_at DESC, id DESC
    """)).mappings().all()

    def make_features(rows, props):
        return [
            {
                "type": "Feature",
                "geometry": __import__("json").loads(row["geometry"]),
                "properties": {key: row[key] for key in props},
            }
            for row in rows
        ]

    return {
        "roads": feature_collection(make_features(roads, [
            "id", "name", "road_type", "status", "congestion_level", "speed"
        ])),
        "parking": feature_collection(make_features(parking, [
            "id", "name", "capacity", "available"
        ])),
        "logistics_hubs": feature_collection(make_features(hubs, [
            "id", "name", "capacity"
        ])),
        "construction": feature_collection(make_features(construction, [
            "id", "project_name", "start_date", "end_date", "status"
        ])),
        "delivery_zones": feature_collection(make_features(delivery_zones, [
            "id", "zone_name", "restrictions"
        ])),
        "issues": feature_collection(make_features(issues, [
            "id", "category", "description", "severity", "status",
            "reported_at", "longitude", "latitude"
        ])),
    }
