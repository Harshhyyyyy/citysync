from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    return {
        "active_issues": db.execute(text("SELECT COUNT(*) FROM issues WHERE status <> 'Resolved'")).scalar(),
        "total_issues": db.execute(text("SELECT COUNT(*) FROM issues")).scalar(),
        "parking_spaces": db.execute(text("SELECT COALESCE(SUM(available),0) FROM parking")).scalar(),
        "logistics_hubs": db.execute(text("SELECT COUNT(*) FROM logistics_hubs")).scalar(),
        "congested_roads": db.execute(text("SELECT COUNT(*) FROM traffic WHERE congestion_level='High'")).scalar()
    }
