import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.config import settings
from app.core.logging import logger
from app.db.bigquery_client import demand_cluster_repo, citizen_request_repo
from app.services.embedding_service import embedding_service

class DemandClusteringService:
    """
    Semantic Demand Clustering Service for JANSETU Phase 4.
    Synthesizes related multilingual citizen requests into cohesive demand clusters
    constrained by geographic administrative area (geo_id) and infrastructure sector (category).
    Ensures deterministic cluster IDs, true request counts, and idempotent processing.
    """
    def __init__(self):
        self.similarity_threshold = getattr(settings, "AI_SIMILARITY_THRESHOLD", 0.72)
        # Track cluster memberships: cluster_id -> set of request_ids
        self._cluster_members: Dict[str, set] = {}

    def assign_to_cluster(
        self,
        request_id: str,
        geo_id: str,
        category: str,
        specific_issue: str,
        embedding: List[float],
        severity: int
    ) -> Dict[str, Any]:
        """
        Assigns a citizen request to an existing semantic demand cluster in the same
        geo_id and sector if similarity >= threshold, or deterministically creates a new cluster.
        Idempotent: rerunning with the same request_id does not duplicate or inflate counts.
        """
        existing_clusters = demand_cluster_repo.list_by_geo_id(geo_id=geo_id, category=category)

        matched_cluster = None
        best_similarity = 0.0

        for cluster in existing_clusters:
            rep_vec = cluster.get("representative_embedding")
            if rep_vec:
                sim = embedding_service.cosine_similarity(embedding, rep_vec)
                if sim > best_similarity:
                    best_similarity = sim
                    if sim >= self.similarity_threshold:
                        matched_cluster = cluster

        # Case 1: Match found in existing cluster
        if matched_cluster:
            cluster_id = matched_cluster["cluster_id"]
            members = self._cluster_members.setdefault(cluster_id, set())

            # Only increment count and update average if this request is newly assigned
            if request_id not in members:
                members.add(request_id)
                current_cnt = matched_cluster.get("request_count", 1)
                curr_sev = matched_cluster.get("average_severity", float(severity))
                new_cnt = current_cnt + 1
                new_sev = round(((curr_sev * current_cnt) + severity) / new_cnt, 2)

                matched_cluster["request_count"] = new_cnt
                matched_cluster["average_severity"] = new_sev
                matched_cluster["latest_reported_at"] = datetime.utcnow().isoformat()
                demand_cluster_repo.upsert_cluster(matched_cluster)
                logger.info(f"Assigned request {request_id} to cluster {cluster_id} (count={new_cnt}, similarity={best_similarity:.3f})")
            else:
                logger.debug(f"Request {request_id} already member of cluster {cluster_id}. Skipping count increment.")

            res = dict(matched_cluster)
            res["request_ids"] = list(members)
            return res

        # Case 2: Create new semantic demand cluster
        new_cluster_id = self._generate_cluster_id(category, geo_id, specific_issue)

        human_title = specific_issue.replace("_", " ").title()
        now_str = datetime.utcnow().isoformat()

        new_cluster = {
            "cluster_id": new_cluster_id,
            "geo_id": geo_id,
            "category": category,
            "cluster_label": human_title,
            "cluster_title": human_title,
            "representative_issue": specific_issue,
            "cluster_summary": f"Aggregated community reports regarding {human_title.lower()} in administrative unit {geo_id}.",
            "request_count": 1,
            "average_severity": float(severity),
            "first_reported_at": now_str,
            "latest_reported_at": now_str,
            "growth_velocity_7d": 0.0,
            "representative_embedding": embedding,
            "status": "emerging",
            "created_at": now_str,
            "updated_at": now_str
        }

        demand_cluster_repo.upsert_cluster(new_cluster)
        members = self._cluster_members.setdefault(new_cluster_id, set())
        members.add(request_id)
        logger.info(f"Created new semantic demand cluster {new_cluster_id} for request {request_id} (category={category}, geo={geo_id})")
        res = dict(new_cluster)
        res["request_ids"] = list(members)
        return res

    def _generate_cluster_id(self, category: str, geo_id: str, specific_issue: str) -> str:
        """Generates deterministic cluster ID: CLS-{CAT}-{GEO}-{HASH}."""
        cat_prefix = category.upper()[:4]
        geo_clean = geo_id.upper()
        issue_hash = hashlib.md5(f"{geo_id}_{category}_{specific_issue}".encode("utf-8")).hexdigest()[:6].upper()
        return f"CLS-{cat_prefix}-{geo_clean}-{issue_hash}"

    def assign_or_create_cluster(
        self,
        request_id: str,
        geo_id: str,
        category: str,
        subcategory: Optional[str] = None,
        summary: Optional[str] = None,
        specific_issue: Optional[str] = None,
        urgency: Optional[float] = None,
        severity: int = 3,
        cohort: Optional[str] = None,
        embedding: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """Convenience alias for assign_to_cluster supporting varied keyword arguments."""
        issue = specific_issue or summary or subcategory or category
        emb = embedding if embedding is not None else [0.0] * 768
        return self.assign_to_cluster(
            request_id=request_id,
            geo_id=geo_id,
            category=category,
            specific_issue=issue,
            embedding=emb,
            severity=severity
        )


    def get_cluster(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves cluster details including member request identifiers."""
        cluster = demand_cluster_repo.get_by_cluster_id(cluster_id)
        if not cluster:
            return None
        result = dict(cluster)
        members = list(self._cluster_members.get(cluster_id, []))
        result["member_request_ids"] = members
        result["actual_member_count"] = len(members) if members else cluster.get("request_count", 1)
        return result

    def list_clusters(self, geo_id: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists clusters with optional geographic and category filters."""
        if geo_id:
            return demand_cluster_repo.list_by_geo_id(geo_id=geo_id, category=category)
        if category:
            return demand_cluster_repo.list_by_category(category=category)
        return demand_cluster_repo.get_all_clusters()

clustering_service = DemandClusteringService()
