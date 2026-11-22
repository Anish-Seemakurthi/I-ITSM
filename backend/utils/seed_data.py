"""
Database seeding — creates default users, services, SLA policies, and sample incidents.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.user import User, UserRole
from models.incident import Incident, IncidentStatus, IncidentPriority, IncidentCategory, IncidentImpact, IncidentUrgency, BusinessCriticality
from models.service import ITService
from models.sla import SLAPolicy
from models.audit import AuditLog
from utils.auth import hash_password


def seed_database(db: Session) -> None:
    """Idempotent seed — skips if data already exists."""
    if db.query(User).filter(User.email == "admin@itsm.com").first():
        return  # Already seeded

    # -------------------------------------------------------------------
    # Admin
    # -------------------------------------------------------------------
    admin = User(
        id=str(uuid.uuid4()),
        name="System Administrator",
        email="admin@itsm.com",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)

    # -------------------------------------------------------------------
    # Technicians
    # -------------------------------------------------------------------
    technicians_data = [
        {"name": "Alice Network", "email": "tech1@itsm.com", "skills": ["Network", "Infrastructure"]},
        {"name": "Bob Database", "email": "tech2@itsm.com", "skills": ["Database", "SQL", "Storage"]},
        {"name": "Carol Cloud", "email": "tech3@itsm.com", "skills": ["Application", "Software", "Cloud"]},
        {"name": "Dave Security", "email": "tech4@itsm.com", "skills": ["Security", "Authentication"]},
        {"name": "Eve Hardware", "email": "tech5@itsm.com", "skills": ["Hardware", "Infrastructure"]},
    ]
    technicians = []
    for td in technicians_data:
        tech = User(
            id=str(uuid.uuid4()),
            name=td["name"],
            email=td["email"],
            password_hash=hash_password("tech123"),
            role=UserRole.TECHNICIAN,
            is_active=True,
            skills=td["skills"],
            availability=True,
            max_workload=5,
            current_workload=0,
        )
        db.add(tech)
        technicians.append(tech)

    # -------------------------------------------------------------------
    # Employees
    # -------------------------------------------------------------------
    employees_data = [
        {"name": "Employee One", "email": "emp1@itsm.com"},
        {"name": "Employee Two", "email": "emp2@itsm.com"},
        {"name": "Employee Three", "email": "emp3@itsm.com"},
    ]
    employees = []
    for ed in employees_data:
        emp = User(
            id=str(uuid.uuid4()),
            name=ed["name"],
            email=ed["email"],
            password_hash=hash_password("emp123"),
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        db.add(emp)
        employees.append(emp)

    db.flush()

    # -------------------------------------------------------------------
    # IT Services
    # -------------------------------------------------------------------
    services_data = [
        {"name": "Payment Gateway", "description": "Processes all payment transactions", "category": "Finance", "is_critical": True, "owner": "Finance Team"},
        {"name": "Email System", "description": "Corporate email and communication", "category": "Communication", "is_critical": True, "owner": "IT Team"},
        {"name": "Database Server", "description": "Central database infrastructure", "category": "Infrastructure", "is_critical": True, "owner": "DBA Team"},
        {"name": "Network Infrastructure", "description": "Core networking and connectivity", "category": "Infrastructure", "is_critical": True, "owner": "Network Team"},
        {"name": "Authentication Service", "description": "SSO and identity management", "category": "Security", "is_critical": True, "owner": "Security Team"},
        {"name": "Cloud Storage", "description": "File storage and backups", "category": "Storage", "is_critical": False, "owner": "IT Team"},
        {"name": "HR Application", "description": "Human resources management system", "category": "HR", "is_critical": False, "owner": "HR Team"},
        {"name": "ERP System", "description": "Enterprise resource planning", "category": "Business", "is_critical": True, "owner": "Operations Team"},
    ]
    services = []
    for sd in services_data:
        svc = ITService(
            id=str(uuid.uuid4()),
            name=sd["name"],
            description=sd["description"],
            category=sd["category"],
            is_critical=sd["is_critical"],
            owner=sd["owner"],
        )
        db.add(svc)
        services.append(svc)

    db.flush()

    # -------------------------------------------------------------------
    # SLA Policies (default, service-agnostic)
    # -------------------------------------------------------------------
    sla_defaults = [
        {"priority": IncidentPriority.P1, "response_time_minutes": 15, "resolution_time_minutes": 240},
        {"priority": IncidentPriority.P2, "response_time_minutes": 60, "resolution_time_minutes": 480},
        {"priority": IncidentPriority.P3, "response_time_minutes": 240, "resolution_time_minutes": 1440},
        {"priority": IncidentPriority.P4, "response_time_minutes": 480, "resolution_time_minutes": 2880},
    ]
    for sp in sla_defaults:
        policy = SLAPolicy(
            id=str(uuid.uuid4()),
            service_id=None,
            priority=sp["priority"],
            response_time_minutes=sp["response_time_minutes"],
            resolution_time_minutes=sp["resolution_time_minutes"],
        )
        db.add(policy)

    db.flush()

    # -------------------------------------------------------------------
    # Sample Incidents
    # -------------------------------------------------------------------
    now = datetime.utcnow()

    sample_incidents = [
        {
            "id": str(uuid.uuid4()),
            "incident_number": "INC-0001",
            "title": "Payment Gateway Down",
            "description": "The payment gateway is not processing transactions. All payment requests are failing with timeout errors.",
            "category": IncidentCategory.APPLICATION,
            "impact": IncidentImpact.HIGH,
            "urgency": IncidentUrgency.CRITICAL,
            "priority": IncidentPriority.P1,
            "status": IncidentStatus.IN_PROGRESS,
            "reporter_id": employees[0].id,
            "technician_id": technicians[2].id,
            "service_id": services[0].id,
            "affected_users_count": 500,
            "business_criticality": BusinessCriticality.HIGH,
            "priority_score": 36.0,
            "sla_response_deadline": now + timedelta(minutes=15),
            "sla_resolution_deadline": now + timedelta(hours=4),
            "investigation_notes": "Investigating connectivity to payment processor.",
        },
        {
            "id": str(uuid.uuid4()),
            "incident_number": "INC-0002",
            "title": "Email Server Slow Response",
            "description": "Users are reporting very slow email delivery. Some emails are taking over 30 minutes to arrive.",
            "category": IncidentCategory.APPLICATION,
            "impact": IncidentImpact.MEDIUM,
            "urgency": IncidentUrgency.HIGH,
            "priority": IncidentPriority.P2,
            "status": IncidentStatus.ASSIGNED,
            "reporter_id": employees[1].id,
            "technician_id": technicians[2].id,
            "service_id": services[1].id,
            "affected_users_count": 100,
            "business_criticality": BusinessCriticality.MEDIUM,
            "priority_score": 18.0,
            "sla_response_deadline": now + timedelta(hours=1),
            "sla_resolution_deadline": now + timedelta(hours=8),
        },
        {
            "id": str(uuid.uuid4()),
            "incident_number": "INC-0003",
            "title": "VPN Connection Issues",
            "description": "Remote employees cannot connect to VPN. Getting authentication errors when trying to establish VPN connection.",
            "category": IncidentCategory.NETWORK,
            "impact": IncidentImpact.HIGH,
            "urgency": IncidentUrgency.HIGH,
            "priority": IncidentPriority.P2,
            "status": IncidentStatus.RESOLVED,
            "reporter_id": employees[2].id,
            "technician_id": technicians[0].id,
            "service_id": services[3].id,
            "affected_users_count": 50,
            "business_criticality": BusinessCriticality.HIGH,
            "priority_score": 27.0,
            "resolved_at": now - timedelta(hours=2),
            "resolution_notes": "Updated VPN certificates. All users can now connect successfully.",
            "feedback_rating": 4,
            "feedback_comment": "Quick resolution, thanks!",
        },
        {
            "id": str(uuid.uuid4()),
            "incident_number": "INC-0004",
            "title": "Database Backup Failure",
            "description": "Nightly database backup jobs have been failing for the past 3 days. Need immediate investigation.",
            "category": IncidentCategory.DATABASE,
            "impact": IncidentImpact.HIGH,
            "urgency": IncidentUrgency.MEDIUM,
            "priority": IncidentPriority.P2,
            "status": IncidentStatus.ACKNOWLEDGED,
            "reporter_id": employees[0].id,
            "technician_id": technicians[1].id,
            "service_id": services[2].id,
            "affected_users_count": 10,
            "business_criticality": BusinessCriticality.HIGH,
            "priority_score": 18.0,
            "sla_response_deadline": now + timedelta(hours=2),
            "sla_resolution_deadline": now + timedelta(hours=8),
        },
        {
            "id": str(uuid.uuid4()),
            "incident_number": "INC-0005",
            "title": "Printer Not Working in HR Department",
            "description": "The main printer in the HR department is offline. Documents cannot be printed.",
            "category": IncidentCategory.HARDWARE,
            "impact": IncidentImpact.LOW,
            "urgency": IncidentUrgency.LOW,
            "priority": IncidentPriority.P4,
            "status": IncidentStatus.NEW,
            "reporter_id": employees[1].id,
            "technician_id": None,
            "service_id": None,
            "affected_users_count": 5,
            "business_criticality": BusinessCriticality.LOW,
            "priority_score": 1.0,
        },
    ]

    for inc_data in sample_incidents:
        incident = Incident(**inc_data, is_duplicate=False, sla_violated=False)
        db.add(incident)

    db.flush()

    # Audit log for first incident
    audit = AuditLog(
        id=str(uuid.uuid4()),
        incident_id=sample_incidents[0]["id"],
        user_id=admin.id,
        action="INCIDENT_CREATED",
        previous_state=None,
        new_state=IncidentStatus.NEW,
        description="Incident INC-0001 created by employee",
    )
    db.add(audit)

    db.commit()
    print("[Seed] Database seeded successfully.")
