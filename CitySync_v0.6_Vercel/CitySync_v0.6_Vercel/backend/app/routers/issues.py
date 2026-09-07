from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from geoalchemy2 import WKTElement
from ..database import get_db
from ..models import Issue
from ..schemas import IssueCreate, IssueOut

router = APIRouter(prefix="/api/issues", tags=["issues"])


@router.get("")
def list_issues(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, category, description, severity, status, reported_at,
               ST_X(geometry) AS longitude, ST_Y(geometry) AS latitude
        FROM issues
        ORDER BY reported_at DESC, id DESC
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.post("", response_model=IssueOut, status_code=201)
def create_issue(payload: IssueCreate, db: Session = Depends(get_db)):
    if not (-90 <= payload.latitude <= 90 and -180 <= payload.longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")
    issue = Issue(
        category=payload.category,
        description=payload.description,
        severity=payload.severity,
        geometry=WKTElement(f"POINT({payload.longitude} {payload.latitude})", srid=4326),
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return {
        "id": issue.id,
        "category": issue.category,
        "description": issue.description,
        "severity": issue.severity,
        "status": issue.status,
        "reported_at": issue.reported_at,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
    }


@router.patch("/{issue_id}/status")
def update_status(issue_id: int, status: str, db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = status
    db.commit()
    return {"id": issue.id, "status": issue.status}
