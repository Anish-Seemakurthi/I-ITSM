"""
Intelligent Features Service:
- Duplicate Incident Detection (keyword tokenization & Jaccard similarity)
- Auto-Categorization (NLP/keyword taxonomy)
- Smart Technician Recommendation
- Suggested Resolutions from Historical Incidents
- Automatic Escalation for unacknowledged critical incidents
"""
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from models.incident import (
    Incident,
    IncidentStatus,
    IncidentPriority,
    IncidentCategory,
)
from models.user import User, UserRole

# Keyword taxonomy for automated category suggestion
CATEGORY_KEYWORDS = {
    IncidentCategory.NETWORK: [
        "network", "wifi", "ethernet", "router", "switch", "vpn", "dns", "ping", "latency",
        "packet", "connection", "firewall", "bandwidth", "ip address", "subnet"
    ],
    IncidentCategory.DATABASE: [
        "database", "db", "sql", "postgres", "mysql", "oracle", "mongodb", "deadlock",
        "query", "slow query", "table", "index", "replication", "backup failed"
    ],
    IncidentCategory.CLOUD: [
        "cloud", "aws", "azure", "gcp", "s3", "ec2", "kubernetes", "k8s", "container",
        "docker", "pod", "cluster", "lambda", "serverless", "bucket"
    ],
    IncidentCategory.SECURITY: [
        "security", "malware", "phishing", "virus", "breach", "unauthorized", "vulnerability",
        "attack", "ransomware", "cert", "ssl", "tls", "compromised", "exploit"
    ],
    IncidentCategory.AUTHENTICATION: [
        "login", "sign in", "password", "auth", "sso", "ldap", "active directory", "oauth",
        "2fa", "mfa", "token", "session expired", "access denied", "locked out"
    ],
    IncidentCategory.APPLICATION: [
        "app", "application", "ui", "frontend", "backend", "crash", "bug", "payment",
        "checkout", "portal", "error 500", "null pointer", "transaction", "service unavailable"
    ],
    IncidentCategory.STORAGE: [
        "storage", "disk", "hard drive", "ssd", "nas", "san", "volume", "out of space",
        "full disk", "file system", "quota exceeded", "corrupt file"
    ],
    IncidentCategory.HARDWARE: [
        "hardware", "cpu", "ram", "server", "motherboard", "power supply", "fan",
        "monitor", "printer", "keyboard", "cable", "overheating", "beep"
    ],
    IncidentCategory.SOFTWARE: [
        "software", "os", "windows", "linux", "update", "patch", "installation", "driver",
        "license", "office", "browser", "registry"
    ],
}


class IntelligentService:
    @staticmethod
    def _tokenize(text: str) -> set:
        """Tokenize text into lowercase alphanumeric words."""
        if not text:
            return set()
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        stopwords = {
            "the", "and", "for", "with", "that", "this", "from", "have", "not", "are",
            "was", "were", "been", "some", "what", "there", "their", "user", "users"
        }
        return {w for w in words if w not in stopwords}

    @staticmethod
    def detect_duplicates(
        db: Session,
        title: str,
        description: str,
        category: Optional[str] = None,
        service_id: Optional[str] = None,
        threshold: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Calculates Jaccard similarity between the new incident and active incidents.
        Returns potential duplicate incidents with similarity score.
        """
        input_tokens = IntelligentService._tokenize(f"{title} {description}")
        if not input_tokens:
            return []

        active_statuses = [
            IncidentStatus.NEW,
            IncidentStatus.CLASSIFIED,
            IncidentStatus.ASSIGNED,
            IncidentStatus.ACKNOWLEDGED,
            IncidentStatus.IN_PROGRESS,
        ]

        query = db.query(Incident).filter(Incident.status.in_(active_statuses))
        if service_id:
            # Check same service first or all
            pass

        active_incidents = query.all()
        duplicates = []

        for inc in active_incidents:
            target_tokens = IntelligentService._tokenize(f"{inc.title} {inc.description}")
            if not target_tokens:
                continue

            intersection = len(input_tokens.intersection(target_tokens))
            union = len(input_tokens.union(target_tokens))
            similarity = intersection / union if union > 0 else 0.0

            # Boost similarity if identical service or category
            if service_id and inc.service_id == service_id:
                similarity += 0.15
            if category and inc.category and inc.category.value == category:
                similarity += 0.10

            if similarity >= threshold:
                duplicates.append({
                    "incident_id": inc.id,
                    "incident_number": inc.incident_number,
                    "title": inc.title,
                    "status": inc.status.value,
                    "priority": inc.priority.value if inc.priority else None,
                    "similarity_score": round(min(1.0, similarity), 3),
                })

        duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return duplicates[:5]

    @staticmethod
    def auto_categorize(text: str) -> Dict[str, Any]:
        """
        Analyzes title + description and suggests the best matching category with confidence.
        """
        tokens = IntelligentService._tokenize(text)
        scores: Dict[IncidentCategory, int] = {}

        for cat, keywords in CATEGORY_KEYWORDS.items():
            match_count = 0
            for kw in keywords:
                if " " in kw and kw in text.lower():
                    match_count += 3
                elif kw in tokens:
                    match_count += 1
            if match_count > 0:
                scores[cat] = match_count

        if not scores:
            return {
                "suggested_category": IncidentCategory.APPLICATION.value,
                "confidence": 0.5,
                "rationale": "Default category assigned based on standard incident classification",
            }

        sorted_cats = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        best_cat, best_score = sorted_cats[0]
        confidence = min(0.98, round(best_score / (sum(scores.values()) + 1) + 0.3, 2))

        return {
            "suggested_category": best_cat.value,
            "confidence": confidence,
            "rationale": f"Matched {best_score} domain-specific keywords for {best_cat.value}",
        }

    @staticmethod
    def get_suggested_resolutions(
        db: Session,
        incident_id: str,
        category: Optional[str] = None,
        service_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Finds previous resolved/closed incidents with resolutions for similar issues.
        """
        current_inc = db.query(Incident).filter(Incident.id == incident_id).first()
        target_tokens = IntelligentService._tokenize(f"{current_inc.title} {current_inc.description}") if current_inc else set()

        query = db.query(Incident).filter(
            Incident.status.in_([IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.CLOSED]),
            Incident.resolution_notes.isnot(None),
            Incident.id != incident_id,
        )

        if category:
            query = query.filter(Incident.category == category)
        elif current_inc and current_inc.category:
            query = query.filter(Incident.category == current_inc.category)

        resolved_incidents = query.order_by(Incident.resolved_at.desc()).limit(15).all()
        results = []

        for past in resolved_incidents:
            past_tokens = IntelligentService._tokenize(f"{past.title} {past.description}")
            similarity = 0.5
            if target_tokens and past_tokens:
                intersection = len(target_tokens.intersection(past_tokens))
                union = len(target_tokens.union(past_tokens))
                similarity = intersection / union if union > 0 else 0.2

            results.append({
                "incident_number": past.incident_number,
                "title": past.title,
                "category": past.category.value if past.category else None,
                "resolution": past.resolution_notes,
                "resolved_at": past.resolved_at.isoformat() if past.resolved_at else None,
                "relevance_score": round(similarity, 2),
            })

        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:4]

    @staticmethod
    def check_escalations(db: Session, unacknowledged_minutes: int = 10) -> List[Incident]:
        """
        Identifies critical (P1) incidents that have been assigned but not acknowledged within threshold.
        """
        threshold_time = datetime.utcnow() - timedelta(minutes=unacknowledged_minutes)
        critical_unacknowledged = db.query(Incident).filter(
            Incident.priority == IncidentPriority.P1,
            Incident.status == IncidentStatus.ASSIGNED,
            Incident.updated_at < threshold_time,
        ).all()
        return critical_unacknowledged

    @staticmethod
    def recommend_technicians(
        db: Session,
        incident: Incident,
    ) -> List[Dict[str, Any]]:
        """
        Smart recommendation ranking for technicians based on skill overlap, current workload, and availability.
        """
        techs = db.query(User).filter(
            User.role == UserRole.TECHNICIAN,
            User.is_active == True,
            User.availability == True,
        ).all()

        recommendations = []
        cat_str = (incident.category.value if incident.category else "").lower()

        for t in techs:
            skills = [s.lower() for s in (t.skills or [])]
            skill_score = sum(3 for s in skills if s in cat_str or cat_str in s)
            workload_penalty = (t.current_workload or 0) * 1.5
            capacity_score = max(0, (t.max_workload or 5) - (t.current_workload or 0)) * 2

            total_score = skill_score + capacity_score - workload_penalty

            recommendations.append({
                "id": t.id,
                "name": t.name,
                "email": t.email,
                "skills": t.skills or [],
                "current_workload": t.current_workload or 0,
                "max_workload": t.max_workload or 5,
                "suitability_score": round(max(0.1, total_score), 1),
                "is_recommended": total_score > 3,
            })

        recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
        return recommendations

