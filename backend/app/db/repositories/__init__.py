from app.db.repositories.base_repository import BaseRepository
from app.db.repositories.geography_repository import GeographyRepository
from app.db.repositories.demographics_repository import DemographicsRepository
from app.db.repositories.infrastructure_repository import InfrastructureRepository
from app.db.repositories.investment_repository import InvestmentRepository
from app.db.repositories.citizen_request_repository import CitizenRequestRepository
from app.db.repositories.embedding_repository import EmbeddingRepository
from app.db.repositories.demand_cluster_repository import DemandClusterRepository
from app.db.repositories.hotspot_repository import HotspotRepository
from app.db.repositories.silent_need_repository import SilentNeedRepository
from app.db.repositories.evidence_repository import EvidenceRepository
from app.db.repositories.policy_scenario_repository import PolicyScenarioRepository
from app.db.repositories.impact_repository import ImpactRepository
from app.db.repositories.learning_repository import LearningRepository

__all__ = [
    "BaseRepository",
    "GeographyRepository",
    "DemographicsRepository",
    "InfrastructureRepository",
    "InvestmentRepository",
    "CitizenRequestRepository",
    "EmbeddingRepository",
    "DemandClusterRepository",
    "HotspotRepository",
    "SilentNeedRepository",
    "EvidenceRepository",
    "PolicyScenarioRepository",
    "ImpactRepository",
    "LearningRepository"
]

