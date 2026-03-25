from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.models.report import Report, ReportStatus
from app.models.attachment import Attachment
from app.models.system_setting import SystemSetting
from app.schemas.report import ReportCreate, ReportUpdate, ReportRead
from app.api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.post("/", response_model=ReportRead)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    today = date.today()
    existing = db.query(Report).filter(Report.user_id == current_user.id, Report.date == today).first()
    if existing:
        raise HTTPException(status_code=400, detail="Report for today already exists")
    
    is_late = False
    cutoff_setting = db.query(SystemSetting).filter(SystemSetting.key == "report_cutoff_time").first()
    if cutoff_setting and cutoff_setting.value:
        try:
            cutoff_time = datetime.strptime(cutoff_setting.value, "%H:%M").time()
            if datetime.now().time() > cutoff_time:
                is_late = True
        except ValueError:
            pass

    report = Report(
        user_id=current_user.id,
        date=today,
        tasks=report_in.tasks,
        blockers=report_in.blockers,
        status=report_in.status,
        is_late=is_late
    )
    
    if hasattr(report_in, 'attachments') and report_in.attachments:
        report.attachments = [
            Attachment(
                file_url=att.file_url,
                file_name=att.file_name
            ) for att in report_in.attachments
        ]

    db.add(report)
    db.commit()
    db.refresh(report)

    return report

@router.get("/me", response_model=List[ReportRead])
def read_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reports = db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.date.desc()).all()
    return reports

@router.get("/", response_model=List[ReportRead])
def read_all_reports(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    reports = db.query(Report).order_by(Report.date.desc()).all()
    return reports

@router.get("/{report_id}", response_model=ReportRead)
def read_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role != RoleEnum.admin and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return report

@router.patch("/{report_id}", response_model=ReportRead)
def update_report(
    report_id: int,
    report_in: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    if report.status == ReportStatus.submitted:
        raise HTTPException(status_code=400, detail="Cannot edit a submitted report")
    
    if report_in.tasks is not None:
        report.tasks = report_in.tasks
    if report_in.blockers is not None:
        report.blockers = report_in.blockers
    if report_in.status is not None:
        report.status = report_in.status
        
    db.commit()
    db.refresh(report)
    return report

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Allow users to delete their own report ONLY if it's from today (to fix mistakes)
    if report.user_id == current_user.id:
        if report.date != date.today():
             raise HTTPException(status_code=400, detail="Can only delete today's report.")
    elif current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")

    db.delete(report)
    db.commit()
    return None
