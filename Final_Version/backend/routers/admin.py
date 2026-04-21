"""
admin.py — Admin panel API endpoints.

Permission matrix:
  superadmin : can delete admins + users, view breach alerts, all actions
  admin      : can delete users only (not admins/superadmins), add users (user/admin roles)
  user       : no delete permissions

Ban / Role-change removed per requirements.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.scan_history import ScanHistory
from models.login_log import LoginLog
from models.breach_alert import BreachAlert
from schemas.admin_schema import AddUserRequest
from utils.auth_utils import require_admin, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _is_superadmin(user: User) -> bool:
    return user.role == "superadmin"


# ── STATS ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    dist = db.query(ScanHistory.rule_label, func.count(ScanHistory.id))\
             .group_by(ScanHistory.rule_label).all()
    return {
        "total_users":    db.query(User).count(),
        "total_scans":    db.query(ScanHistory).count(),
        "total_breached": db.query(ScanHistory).filter_by(is_breached=True).count(),
        "total_banned":   db.query(User).filter_by(is_active=False).count(),
        "distribution":   {label: count for label, count in dist},
    }


# ── GET ALL USERS ─────────────────────────────────────────────────────────────
@router.get("/users")
def get_users(search: str = Query(""), db: Session = Depends(get_db),
              current_user: User = Depends(require_admin)):
    query = db.query(User)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    users = query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        scan_count = db.query(ScanHistory).filter_by(user_id=u.id).count()
        result.append({**u.to_dict(), "scan_count": scan_count})
    return {"users": result, "total": len(result)}


# ── ADD USER ──────────────────────────────────────────────────────────────────
@router.post("/users/add")
def add_user(data: AddUserRequest, db: Session = Depends(get_db),
             current_user: User = Depends(require_admin)):
    if len(data.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(409, "Email already registered")
    if db.query(User).filter(User.name.ilike(data.name)).first():
        raise HTTPException(409, "Name already taken")

    # Admins can only add user/admin roles — not superadmin
    allowed_roles = ["user", "admin"]
    role = data.role if data.role in allowed_roles else "user"

    user = User(name=data.name.strip(), email=data.email.lower(),
                password_hash=hash_password(data.password), role=role)
    db.add(user); db.commit(); db.refresh(user)
    return {"message": f"User {user.name} created!", "user": user.to_dict()}


# ── DELETE USER ───────────────────────────────────────────────────────────────
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(require_admin)):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete your own account")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")

    # Admin can only delete 'user' role — superadmin can delete admin + user
    if current_user.role == "admin" and target.role != "user":
        raise HTTPException(403, "Admins can only delete regular users")
    if target.role == "superadmin":
        raise HTTPException(403, "Superadmin accounts cannot be deleted")

    db.query(ScanHistory).filter_by(user_id=user_id).delete()
    db.query(LoginLog).filter_by(user_id=user_id).delete()
    db.query(BreachAlert).filter_by(user_id=user_id).delete()
    db.delete(target); db.commit()
    return {"message": f"User {target.name} deleted"}


# ── DELETE SINGLE SCAN (admin can delete any user's scan) ────────────────────
@router.delete("/scans/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(require_admin)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    db.delete(scan); db.commit()
    return {"message": "Scan deleted"}


# ── USER SCANS ────────────────────────────────────────────────────────────────
@router.get("/users/{user_id}/scans")
def get_user_scans(user_id: int, page: int = Query(1, ge=1),
                   db: Session = Depends(get_db),
                   current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    total   = db.query(ScanHistory).filter_by(user_id=user_id).count()
    records = (db.query(ScanHistory).filter_by(user_id=user_id)
               .order_by(ScanHistory.scanned_at.desc())
               .offset((page - 1) * 10).limit(10).all())
    return {
        "user":  user.to_dict(),
        "total": total,
        "pages": (total + 9) // 10,
        "page":  page,
        "items": [r.to_dict() for r in records],
    }


# ── SECURITY LOGS ─────────────────────────────────────────────────────────────
@router.get("/security")
def get_security(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    flagged = db.query(LoginLog).filter_by(is_flagged=True).order_by(LoginLog.attempt_at.desc()).limit(100).all()
    failed  = db.query(LoginLog).filter_by(status="failed").order_by(LoginLog.attempt_at.desc()).limit(50).all()
    return {
        "flagged_count": len(flagged),
        "flagged_logs":  [l.to_dict() for l in flagged],
        "failed_logs":   [l.to_dict() for l in failed],
    }


# ── DELETE SINGLE LOGIN LOG ───────────────────────────────────────────────────
@router.delete("/security/logs/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(require_admin)):
    log = db.query(LoginLog).filter(LoginLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Log not found")
    db.delete(log); db.commit()
    return {"message": "Log deleted"}


# ── BREACH ALERTS — SUPER ADMIN ONLY ─────────────────────────────────────────
@router.get("/breach-alerts")
def get_breach_alerts(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if not _is_superadmin(current_user):
        raise HTTPException(403, "Super Admin access only")
    alerts = db.query(BreachAlert).order_by(BreachAlert.detected_at.desc()).all()
    return {"total": len(alerts), "alerts": [a.to_dict() for a in alerts]}


@router.delete("/breach-alerts/{alert_id}")
def delete_breach_alert(alert_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(require_admin)):
    if not _is_superadmin(current_user):
        raise HTTPException(403, "Super Admin access only")
    alert = db.query(BreachAlert).filter(BreachAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    db.delete(alert); db.commit()
    return {"message": f"Breach alert for {alert.user_name} deleted"}


@router.delete("/breach-alerts")
def delete_all_breach_alerts(db: Session = Depends(get_db),
                             current_user: User = Depends(require_admin)):
    if not _is_superadmin(current_user):
        raise HTTPException(403, "Super Admin access only")
    count = db.query(BreachAlert).count()
    db.query(BreachAlert).delete(); db.commit()
    return {"message": f"All {count} breach alerts deleted"}
