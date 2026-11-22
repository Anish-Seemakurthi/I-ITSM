"""
Comprehensive Automated Test Suite for I-ITSM Platform
CS F213 / MAC F212 Object-Oriented Programming

Covers 18 test cases across:
- Normal Operations
- Boundary Conditions
- Invalid Inputs
- Exceptions
- Authorization & Security
- Business Rules & SLA Engine
- Design Patterns (Strategy, State, Factory, Observer)
- Intelligent AI Features
"""
import unittest
import uuid
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
import models
from models.user import User, UserRole
from models.incident import (
    Incident,
    IncidentStatus,
    IncidentPriority,
    IncidentImpact,
    IncidentUrgency,
    IncidentCategory,
    BusinessCriticality,
)
from patterns.strategy import (
    BasicPriorityStrategy,
    WeightedPriorityStrategy,
    SkillBasedAssignment,
    LoadBasedAssignment,
    RoundRobinAssignment,
    PriorityBasedAssignment,
)
from patterns.state import IncidentStateMachine, InvalidStateTransitionError
from patterns.factory import UserFactory, IncidentFactory
from patterns.observer import IncidentEventPublisher, NotificationObserver
from services.priority_service import PriorityService
from services.assignment_service import AssignmentService
from services.sla_service import SLAService
from services.intelligent_service import IntelligentService
from utils.auth import hash_password, verify_password, create_access_token, decode_token


class TestITSMPlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use an in-memory SQLite database for test isolation
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    # -------------------------------------------------------------------------
    # TEST 1: Normal Operation — User Authentication & Password Hashing
    # -------------------------------------------------------------------------
    def test_01_user_authentication_and_password_hashing(self):
        password = "SecurePassword123!"
        hashed = hash_password(password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        token = create_access_token({"sub": "user-uuid-1", "role": "ADMIN"})
        decoded = decode_token(token)
        self.assertEqual(decoded["sub"], "user-uuid-1")
        self.assertEqual(decoded["role"], "ADMIN")

    # -------------------------------------------------------------------------
    # TEST 2: Factory Pattern — User Creation for Different Roles
    # -------------------------------------------------------------------------
    def test_02_user_factory_pattern(self):
        emp = UserFactory.create_employee("John Emp", "emp@test.com", "pass123")
        tech = UserFactory.create_technician("Bob Tech", "tech@test.com", "pass123", ["Network"], 5)
        admin = UserFactory.create_admin("Alice Admin", "admin@test.com", "pass123")

        self.assertEqual(emp.role, UserRole.EMPLOYEE)
        self.assertEqual(tech.role, UserRole.TECHNICIAN)
        self.assertEqual(admin.role, UserRole.ADMIN)
        self.assertEqual(tech.skills, ["Network"])
        self.assertEqual(tech.max_workload, 5)

    # -------------------------------------------------------------------------
    # TEST 3: Factory Pattern — Incident Creation
    # -------------------------------------------------------------------------
    def test_03_incident_factory_creation(self):
        inc = IncidentFactory.create(
            title="Database Latency High",
            description="Queries timing out after 30 seconds on production",
            reporter_id="user-123",
            sequence=42,
            impact=IncidentImpact.HIGH,
            urgency=IncidentUrgency.CRITICAL,
        )
        self.assertEqual(inc.incident_number, "INC-0042")
        self.assertEqual(inc.status, IncidentStatus.NEW)
        self.assertEqual(inc.impact, IncidentImpact.HIGH)
        self.assertEqual(inc.urgency, IncidentUrgency.CRITICAL)

    # -------------------------------------------------------------------------
    # TEST 4: Strategy Pattern — Basic Priority Calculation
    # -------------------------------------------------------------------------
    def test_04_basic_priority_strategy(self):
        service = PriorityService(strategy=BasicPriorityStrategy())

        # HIGH (3) * CRITICAL (4) * HIGH (3) = 36 -> P1
        res_p1 = service.calculate_priority(
            impact=IncidentImpact.HIGH,
            urgency=IncidentUrgency.CRITICAL,
            business_criticality=BusinessCriticality.HIGH,
        )
        self.assertEqual(res_p1["priority"], "P1")
        self.assertEqual(res_p1["priority_score"], 36.0)

        # LOW (1) * LOW (1) * LOW (1) = 1 -> P4
        res_p4 = service.calculate_priority(
            impact=IncidentImpact.LOW,
            urgency=IncidentUrgency.LOW,
            business_criticality=BusinessCriticality.LOW,
        )
        self.assertEqual(res_p4["priority"], "P4")
        self.assertEqual(res_p4["priority_score"], 1.0)

    # -------------------------------------------------------------------------
    # TEST 5: Strategy Pattern — Weighted Priority Calculation with User Count
    # -------------------------------------------------------------------------
    def test_05_weighted_priority_strategy(self):
        service = PriorityService(strategy=WeightedPriorityStrategy())

        # MEDIUM (2) * MEDIUM (2) * MEDIUM (2) = 8 + user_bonus (50 users -> +10) = 18 -> P2
        res = service.calculate_priority(
            impact=IncidentImpact.MEDIUM,
            urgency=IncidentUrgency.MEDIUM,
            business_criticality=BusinessCriticality.MEDIUM,
            affected_users_count=50,
        )
        self.assertEqual(res["priority"], "P2")
        self.assertEqual(res["priority_score"], 18.0)

    # -------------------------------------------------------------------------
    # TEST 6: Strategy Pattern — Skill-Based Technician Assignment
    # -------------------------------------------------------------------------
    def test_06_skill_based_assignment_strategy(self):
        strategy = SkillBasedAssignment()
        technicians = [
            {"id": "1", "name": "Net Specialist", "skills": ["Network", "Router"], "current_workload": 1},
            {"id": "2", "name": "DB Guru", "skills": ["Database", "SQL"], "current_workload": 0},
        ]
        incident = {"category": "DATABASE", "title": "SQL connection drop"}

        selected = strategy.assign(technicians, incident)
        self.assertIsNotNone(selected)
        self.assertEqual(selected["name"], "DB Guru")

    # -------------------------------------------------------------------------
    # TEST 7: Strategy Pattern — Load-Based Technician Assignment
    # -------------------------------------------------------------------------
    def test_07_load_based_assignment_strategy(self):
        strategy = LoadBasedAssignment()
        technicians = [
            {"id": "1", "name": "Busy Tech", "current_workload": 4},
            {"id": "2", "name": "Free Tech", "current_workload": 0},
            {"id": "3", "name": "Moderate Tech", "current_workload": 2},
        ]
        incident = {"title": "Generic Bug"}

        selected = strategy.assign(technicians, incident)
        self.assertEqual(selected["name"], "Free Tech")

    # -------------------------------------------------------------------------
    # TEST 8: Strategy Pattern — Round-Robin Assignment
    # -------------------------------------------------------------------------
    def test_08_round_robin_assignment_strategy(self):
        strategy = RoundRobinAssignment()
        technicians = [
            {"id": "1", "name": "Tech A"},
            {"id": "2", "name": "Tech B"},
            {"id": "3", "name": "Tech C"},
        ]
        incident = {"title": "Any"}

        first = strategy.assign(technicians, incident)
        second = strategy.assign(technicians, incident)
        third = strategy.assign(technicians, incident)
        fourth = strategy.assign(technicians, incident)

        self.assertEqual(first["name"], "Tech A")
        self.assertEqual(second["name"], "Tech B")
        self.assertEqual(third["name"], "Tech C")
        self.assertEqual(fourth["name"], "Tech A")  # Cycles back

    # -------------------------------------------------------------------------
    # TEST 9: State Pattern — Valid Full Lifecycle Progression
    # -------------------------------------------------------------------------
    def test_09_state_machine_valid_full_lifecycle(self):
        sm = IncidentStateMachine(IncidentStatus.NEW)
        self.assertEqual(sm.transition(IncidentStatus.CLASSIFIED), IncidentStatus.CLASSIFIED)
        self.assertEqual(sm.transition(IncidentStatus.ASSIGNED), IncidentStatus.ASSIGNED)
        self.assertEqual(sm.transition(IncidentStatus.ACKNOWLEDGED), IncidentStatus.ACKNOWLEDGED)
        self.assertEqual(sm.transition(IncidentStatus.IN_PROGRESS), IncidentStatus.IN_PROGRESS)
        self.assertEqual(sm.transition(IncidentStatus.RESOLVED), IncidentStatus.RESOLVED)
        self.assertEqual(sm.transition(IncidentStatus.VERIFIED), IncidentStatus.VERIFIED)
        self.assertEqual(sm.transition(IncidentStatus.CLOSED), IncidentStatus.CLOSED)

    # -------------------------------------------------------------------------
    # TEST 10: Exception Handling — Invalid State Transitions
    # -------------------------------------------------------------------------
    def test_10_invalid_state_transition_raises_exception(self):
        sm = IncidentStateMachine(IncidentStatus.NEW)
        # Cannot jump from NEW straight to CLOSED
        with self.assertRaises(InvalidStateTransitionError):
            sm.transition(IncidentStatus.CLOSED)

        # Cannot jump from NEW straight to RESOLVED
        with self.assertRaises(InvalidStateTransitionError):
            sm.transition(IncidentStatus.RESOLVED)

    # -------------------------------------------------------------------------
    # TEST 11: SLA Management — Deadline Calculation for Priorities
    # -------------------------------------------------------------------------
    def test_11_sla_deadline_calculation(self):
        now = datetime.utcnow()
        resp_dl, res_dl = SLAService.calculate_deadlines(
            db=self.db,
            priority=IncidentPriority.P1,
            base_time=now,
        )
        # P1 target: 5 mins response, 30 mins resolution
        self.assertEqual(int((resp_dl - now).total_seconds() / 60), 5)
        self.assertEqual(int((res_dl - now).total_seconds() / 60), 30)

    # -------------------------------------------------------------------------
    # TEST 12: SLA Violation Detection
    # -------------------------------------------------------------------------
    def test_12_sla_violation_detection(self):
        past_time = datetime.utcnow() - timedelta(minutes=60)
        expired_incident = Incident(
            id=str(uuid.uuid4()),
            incident_number="INC-TEST-SLA",
            title="Expired Incident",
            description="Incident that breached its SLA deadline",
            reporter_id="emp-1",
            status=IncidentStatus.IN_PROGRESS,
            priority=IncidentPriority.P1,
            sla_resolution_deadline=past_time,
            sla_violated=False,
        )
        self.db.add(expired_incident)
        self.db.commit()

        violated = SLAService.check_sla_violations(self.db)
        self.assertTrue(any(i.id == expired_incident.id for i in violated))

        # Reload
        reloaded = self.db.query(Incident).filter(Incident.id == expired_incident.id).first()
        self.assertTrue(reloaded.sla_violated)

    # -------------------------------------------------------------------------
    # TEST 13: SLA Early Warning Risk Detection (> 80% Time Elapsed)
    # -------------------------------------------------------------------------
    def test_13_sla_at_risk_detection(self):
        created = datetime.utcnow() - timedelta(minutes=25)
        deadline = datetime.utcnow() + timedelta(minutes=5)  # 25m out of 30m elapsed = 83%
        at_risk_incident = Incident(
            id=str(uuid.uuid4()),
            incident_number="INC-TEST-RISK",
            title="At Risk Incident",
            description="Over 80% of SLA time elapsed",
            reporter_id="emp-1",
            status=IncidentStatus.IN_PROGRESS,
            created_at=created,
            sla_resolution_deadline=deadline,
            sla_violated=False,
        )
        self.db.add(at_risk_incident)
        self.db.commit()

        at_risk_list = SLAService.get_at_risk_incidents(self.db, threshold_percent=0.8)
        self.assertTrue(any(i.id == at_risk_incident.id for i in at_risk_list))

    # -------------------------------------------------------------------------
    # TEST 14: Intelligent Features — Automated Keyword Categorization
    # -------------------------------------------------------------------------
    def test_14_auto_categorization_nlp_taxonomy(self):
        text_network = "Office router dropped connection latency is high"
        res_network = IntelligentService.auto_categorize(text_network)
        self.assertEqual(res_network["suggested_category"], IncidentCategory.NETWORK.value)

        text_db = "Postgres query execution deadlock on orders table"
        res_db = IntelligentService.auto_categorize(text_db)
        self.assertEqual(res_db["suggested_category"], IncidentCategory.DATABASE.value)

        text_auth = "Users getting invalid token and access denied on SSO login portal"
        res_auth = IntelligentService.auto_categorize(text_auth)
        self.assertEqual(res_auth["suggested_category"], IncidentCategory.AUTHENTICATION.value)

    # -------------------------------------------------------------------------
    # TEST 15: Intelligent Features — Duplicate Incident Detection
    # -------------------------------------------------------------------------
    def test_15_duplicate_incident_detection(self):
        inc_original = Incident(
            id=str(uuid.uuid4()),
            incident_number="INC-ORIG",
            title="Payment gateway unavailable on checkout",
            description="Customers unable to complete credit card checkout",
            reporter_id="emp-1",
            status=IncidentStatus.IN_PROGRESS,
            category=IncidentCategory.APPLICATION,
        )
        self.db.add(inc_original)
        self.db.commit()

        duplicates = IntelligentService.detect_duplicates(
            db=self.db,
            title="Payment gateway returning error during checkout",
            description="Users cannot complete transaction payments",
            category="APPLICATION",
            threshold=0.25,
        )
        self.assertTrue(len(duplicates) > 0)
        self.assertEqual(duplicates[0]["incident_id"], inc_original.id)

    # -------------------------------------------------------------------------
    # TEST 16: Observer Pattern — Multi-Channel Notification Dispatch
    # -------------------------------------------------------------------------
    def test_16_observer_pattern_event_publishing(self):
        publisher = IncidentEventPublisher()
        captured_events = []

        class MockObserver(NotificationObserver):
            def update(self, event: str, data: dict):
                captured_events.append((event, data))

        observer = MockObserver()
        publisher.subscribe(observer)

        publisher.notify("INCIDENT_RESOLVED", {"incident_number": "INC-0099", "status": "RESOLVED"})
        self.assertEqual(len(captured_events), 1)
        self.assertEqual(captured_events[0][0], "INCIDENT_RESOLVED")
        self.assertEqual(captured_events[0][1]["incident_number"], "INC-0099")

        # Unsubscribe test
        publisher.unsubscribe(observer)
        publisher.notify("INCIDENT_CLOSED", {})
        self.assertEqual(len(captured_events), 1)  # Did not receive second event

    # -------------------------------------------------------------------------
    # TEST 17: Boundary Condition — Technician Max Capacity Enforcement
    # -------------------------------------------------------------------------
    def test_17_technician_capacity_boundary(self):
        assignment = AssignmentService()
        busy_tech = User(
            id=str(uuid.uuid4()),
            name="Maxed Tech",
            email="busy@test.com",
            password_hash="pass",
            role=UserRole.TECHNICIAN,
            availability=True,
            max_workload=3,
            current_workload=3,  # Already at capacity
        )
        self.db.add(busy_tech)
        self.db.commit()

        available = assignment.get_available_technicians(self.db)
        self.assertFalse(any(t.id == busy_tech.id for t in available))

    # -------------------------------------------------------------------------
    # TEST 18: Intelligent Features — Smart Technician Recommendation Ranking
    # -------------------------------------------------------------------------
    def test_18_smart_technician_recommendation(self):
        tech_network = User(
            id=str(uuid.uuid4()),
            name="Dave Network",
            email="dave@test.com",
            password_hash="pass",
            role=UserRole.TECHNICIAN,
            skills=["Network", "Firewall"],
            availability=True,
            current_workload=1,
            max_workload=5,
        )
        tech_hardware = User(
            id=str(uuid.uuid4()),
            name="Frank Hardware",
            email="frank@test.com",
            password_hash="pass",
            role=UserRole.TECHNICIAN,
            skills=["Hardware", "Printer"],
            availability=True,
            current_workload=1,
            max_workload=5,
        )
        self.db.add_all([tech_network, tech_hardware])
        self.db.commit()

        incident = Incident(
            id=str(uuid.uuid4()),
            incident_number="INC-REC",
            title="Router firewall dropped packets",
            description="Packet drop on core network switch",
            reporter_id="emp-1",
            category=IncidentCategory.NETWORK,
        )

        recommendations = IntelligentService.recommend_technicians(self.db, incident)
        self.assertGreater(len(recommendations), 0)
        # Network tech should be ranked higher than Hardware tech for Network incident
        top_rec = recommendations[0]
        self.assertEqual(top_rec["name"], "Dave Network")


if __name__ == "__main__":
    unittest.main()

