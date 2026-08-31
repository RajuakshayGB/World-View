"""
Worldview Compass — Computational Engine (worldview_brain.py)
Document Class: Sole Mathematical Authority & Algorithmic Core
Governed Specification: Part 6 (part-06-computational-engine-and-mathematics.md)

Core Invariant:
"Data describes -> Brain computes -> API communicates -> Frontend presents"
Pure functional statelessness: Brain computes; it never stores, never presents, and never translates.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple, Union

ENGINE_VERSION = "brain_v2.0.0"

CANONICAL_DIMENSIONS = [
    "D01", "D02", "D03", "D04", "D05",
    "D06", "D07", "D08", "D09", "D10",
    "D11", "D12", "D13", "D14", "D15",
    "D16", "D17", "D18", "D19", "D20",
    "D21", "D22", "D23", "D24", "D25"
]

CANONICAL_CLUSTERS = [f"C{i:02d}" for i in range(1, 26)]

DIMENSION_NAMES = {
    "D01": "Individual vs. Collective Identity",
    "D02": "Autonomy vs. Authority",
    "D03": "Human Plasticity vs. Fixed Nature",
    "D04": "Self-Interest vs. Mutual Obligation",
    "D05": "Immanent Fulfillment vs. Transcendence",
    "D06": "Egalitarianism vs. Functional Hierarchy",
    "D07": "Personal Liberty vs. Social Order",
    "D08": "Traditional Continuity vs. Radical Reform",
    "D09": "Centralized Cohesion vs. Subsidiarity",
    "D10": "Universal Standardization vs. Local Particularity",
    "D11": "Empiricism vs. Transcendent Metaphysics",
    "D12": "Systematic Reason vs. Intuitive Gnosis",
    "D13": "Materialism vs. Idealism / Panpsychism",
    "D14": "Epistemic Fallibilism vs. Dogmatic Certainty",
    "D15": "Atomistic Reductionism vs. Emergent Holism",
    "D16": "Consequentialism vs. Deontological Duty",
    "D17": "Relational Care vs. Impartial Justice",
    "D18": "Moral Objectivism vs. Moral Relativism",
    "D19": "External Law vs. Self-Authored Ethics",
    "D20": "Anthropocentric vs. Ecocentric Valuation",
    "D21": "Technological Progressivism vs. Primitivism",
    "D22": "Constructed Meaning vs. Discovered Teleology",
    "D23": "Historical Optimism vs. Tragic Realism",
    "D24": "Promethean Mastery vs. Harmonious Integration",
    "D25": "Metaphysical Agency vs. Determinism / Fatalism"
}

TRACK_SATURATION_CAPS = {
    "track_1": 2.0,   # 2 binary items drawn per dimension
    "track_2": 1.0,   # 1 single-choice dilemma drawn per dimension
    "track_3": 4.60   # 4 dilemmas drawn with dual selections + trade-off weights
}

MAX_HYPERCUBE_DISTANCE = 10.0000  # sqrt(25 * (2.0)^2) = sqrt(100.0) = 10.0


class BrainValidationError(ValueError):
    """Raised when an input response payload violates computational contracts."""
    pass


def validate_responses(
    responses: Dict[str, Any],
    track: str,
    question_bank: Dict[str, Any]
) -> None:
    """
    Stage 1: Validates response dictionary format against track rules and question bank.
    Pure structural validation. Raises BrainValidationError on illegal payload.
    """
    if track not in TRACK_SATURATION_CAPS:
        raise BrainValidationError(f"Invalid track '{track}'. Must be one of: {list(TRACK_SATURATION_CAPS.keys())}")

    if not isinstance(responses, dict) or len(responses) == 0:
        raise BrainValidationError("Responses payload must be a non-empty dictionary.")

    # Build question lookup map from question_bank
    q_map = {}
    if "binary_pool" in question_bank:
        for q in question_bank["binary_pool"]:
            q_map[q["question_id"]] = q
    if "dilemma_pool" in question_bank:
        for q in question_bank["dilemma_pool"]:
            q_map[q["question_id"]] = q

    for q_id, resp in responses.items():
        if q_id not in q_map:
            raise BrainValidationError(f"Question ID '{q_id}' does not exist in question bank.")

        q_data = q_map[q_id]

        if track == "track_1":
            if not isinstance(resp, int) or resp not in (-1, 1):
                raise BrainValidationError(f"Track 1 item '{q_id}' requires integer value +1 or -1. Received: {resp}")
        elif track == "track_2":
            if not isinstance(resp, str) or resp not in ("OPT_1", "OPT_2", "OPT_3", "OPT_4"):
                raise BrainValidationError(f"Track 2 item '{q_id}' requires option token OPT_1..OPT_4. Received: {resp}")
        elif track == "track_3":
            if not isinstance(resp, (list, tuple)) or len(resp) != 2:
                raise BrainValidationError(f"Track 3 item '{q_id}' requires a list of exactly 2 option tokens. Received: {resp}")
            if len(set(resp)) != 2:
                raise BrainValidationError(f"Track 3 item '{q_id}' contains duplicate options: {resp}")
            for opt in resp:
                if opt not in ("OPT_1", "OPT_2", "OPT_3", "OPT_4", "OPT_5", "OPT_6"):
                    raise BrainValidationError(f"Track 3 item '{q_id}' contains invalid option token: {opt}")


def accumulate_evidence(
    responses: Dict[str, Any],
    track: str,
    question_bank: Dict[str, Any]
) -> Tuple[Dict[str, float], Dict[str, float], Dict[str, int]]:
    """
    Stage 2: Directional Evidence Accumulation.
    Accumulates positive evidence mass (E_pos), negative evidence mass (E_neg),
    and counts of responses per dimension.
    """
    E_pos = {d: 0.0 for d in CANONICAL_DIMENSIONS}
    E_neg = {d: 0.0 for d in CANONICAL_DIMENSIONS}
    counts = {d: 0 for d in CANONICAL_DIMENSIONS}

    q_map = {}
    if "binary_pool" in question_bank:
        for q in question_bank["binary_pool"]:
            q_map[q["question_id"]] = q
    if "dilemma_pool" in question_bank:
        for q in question_bank["dilemma_pool"]:
            q_map[q["question_id"]] = q

    for q_id, resp in responses.items():
        if q_id not in q_map:
            continue
        q_data = q_map[q_id]

        if track == "track_1":
            # Binary proposition
            dim = q_data.get("dimension")
            if dim in CANONICAL_DIMENSIONS:
                polarity = float(q_data.get("polarity", 1.0))
                user_choice = float(resp)
                delta_v = user_choice * polarity
                if delta_v > 0:
                    E_pos[dim] += abs(delta_v)
                elif delta_v < 0:
                    E_neg[dim] += abs(delta_v)
                counts[dim] += 1

        elif track == "track_2":
            # Single dilemma option (OPT_1..OPT_4)
            options_dict = {opt["option_id"]: opt for opt in q_data.get("options", [])}
            selected_opt = options_dict.get(resp)
            if selected_opt:
                for vec in selected_opt.get("vectors", []):
                    dim = vec.get("dimension")
                    weight = float(vec.get("weight", 0.0))
                    if dim in CANONICAL_DIMENSIONS:
                        if weight > 0:
                            E_pos[dim] += abs(weight)
                        elif weight < 0:
                            E_neg[dim] += abs(weight)
                        counts[dim] += 1

        elif track == "track_3":
            # Dual dilemma options (select 2 of 6)
            options_dict = {opt["option_id"]: opt for opt in q_data.get("options", [])}
            for opt_key in resp:
                selected_opt = options_dict.get(opt_key)
                if selected_opt:
                    for vec in selected_opt.get("vectors", []):
                        dim = vec.get("dimension")
                        weight = float(vec.get("weight", 0.0))
                        if dim in CANONICAL_DIMENSIONS:
                            if weight > 0:
                                E_pos[dim] += abs(weight)
                            elif weight < 0:
                                E_neg[dim] += abs(weight)
                            counts[dim] += 1

    return E_pos, E_neg, counts


def normalize_coordinates(
    E_pos: Dict[str, float],
    E_neg: Dict[str, float],
    track: str
) -> Tuple[Dict[str, float], Dict[str, float], Dict[str, float]]:
    """
    Stages 3 & 4: Coordinate Normalization and Triad Diagnostics.
    Returns:
      - user_coordinates (u_d in [-1.0000, +1.0000])
      - evidence_coverage (C_d in [0.0000, 1.0000])
      - epistemic_conflict (K_d in [0.0000, 1.0000])
    """
    M_d = TRACK_SATURATION_CAPS.get(track, 2.0)
    epsilon = 1e-7

    u_coords = {}
    coverage = {}
    conflict = {}

    for d in CANONICAL_DIMENSIONS:
        pos = E_pos.get(d, 0.0)
        neg = E_neg.get(d, 0.0)
        total = pos + neg

        if total <= 0.0:
            u_coords[d] = 0.0
            coverage[d] = 0.0
            conflict[d] = 0.0
            continue

        # Position u_d clamped to [-1.0, +1.0]
        raw_u = (pos - neg) / M_d
        clamped_u = max(-1.0, min(1.0, raw_u))
        u_coords[d] = round(clamped_u, 4)

        # Coverage C_d
        cov = min(1.0, total / M_d)
        coverage[d] = round(cov, 4)

        # Conflict K_d
        conf = (2.0 * min(pos, neg)) / (total + epsilon)
        conflict[d] = round(max(0.0, min(1.0, conf)), 4)

    return u_coords, coverage, conflict


def calculate_euclidean_distance(
    u_vec: Union[List[float], Dict[str, float]],
    w_vec: Union[List[float], Dict[str, float]]
) -> float:
    """
    Computes exact Euclidean distance across all 25 dimensions:
    D_E = sqrt( sum_{d=1}^{25} (u_d - w_d)^2 )
    """
    if isinstance(u_vec, dict):
        u_vals = [u_vec.get(d, 0.0) for d in CANONICAL_DIMENSIONS]
    else:
        u_vals = u_vec

    if isinstance(w_vec, dict):
        w_vals = [w_vec.get(d, 0.0) for d in CANONICAL_DIMENSIONS]
    else:
        w_vals = w_vec

    sum_sq = sum((u - w) ** 2 for u, w in zip(u_vals, w_vals))
    return math.sqrt(sum_sq)


def calculate_similarity_score(distance: float) -> float:
    """
    Converts Euclidean distance into normalized percentage match:
    S_E = 1.0000 - (D_E / 10.0000)
    """
    sim = 1.0 - (distance / MAX_HYPERCUBE_DISTANCE)
    return round(max(0.0, min(1.0, sim)), 4)


def compute_dynamic_centroids(
    worldviews: List[Dict[str, Any]]
) -> Dict[str, List[float]]:
    """
    Computes runtime cluster centroids dynamically from canonical worldviews:
    μ_k = (1 / n_k) * sum( W_j ) for W_j in C_k
    """
    cluster_vectors: Dict[str, List[List[float]]] = {c: [] for c in CANONICAL_CLUSTERS}

    for wv in worldviews:
        c_id = wv.get("cluster_id")
        if c_id in cluster_vectors:
            vec = wv.get("vector", {})
            if isinstance(vec, dict):
                v_list = [float(vec.get(d, 0.0)) for d in CANONICAL_DIMENSIONS]
            else:
                v_list = [float(x) for x in vec]
            cluster_vectors[c_id].append(v_list)

    centroids: Dict[str, List[float]] = {}
    for c_id, v_lists in cluster_vectors.items():
        n = len(v_lists)
        if n == 0:
            centroids[c_id] = [0.0] * 25
            continue
        centroid = []
        for dim_idx in range(25):
            dim_avg = sum(v[dim_idx] for v in v_lists) / n
            centroid.append(round(dim_avg, 4))
        centroids[c_id] = centroid

    return centroids


def compute_cluster_cohesion_spread(
    worldviews: List[Dict[str, Any]],
    centroids: Dict[str, List[float]]
) -> Dict[str, float]:
    """
    Computes mean internal dispersion (cohesion spread) of member worldviews:
    σ_k = (1 / n_k) * sum( ||W_j - μ_k|| )
    """
    cluster_wvs: Dict[str, List[List[float]]] = {c: [] for c in CANONICAL_CLUSTERS}
    for wv in worldviews:
        c_id = wv.get("cluster_id")
        if c_id in cluster_wvs:
            vec = wv.get("vector", {})
            if isinstance(vec, dict):
                v_list = [float(vec.get(d, 0.0)) for d in CANONICAL_DIMENSIONS]
            else:
                v_list = [float(x) for x in vec]
            cluster_wvs[c_id].append(v_list)

    spreads = {}
    for c_id, v_lists in cluster_wvs.items():
        n = len(v_lists)
        if n == 0:
            spreads[c_id] = 0.0
            continue
        mu = centroids.get(c_id, [0.0] * 25)
        total_dist = sum(calculate_euclidean_distance(v, mu) for v in v_lists)
        spreads[c_id] = round(total_dist / n, 4)

    return spreads


def match_worldviews(
    u_coords: Dict[str, float],
    worldviews: List[Dict[str, Any]],
    top_n: int = 5
) -> List[Dict[str, Any]]:
    """
    Stage 5: Global 250-Worldview Normalized Euclidean Matching.
    Applies deterministic 3-tier tie-breaking:
      1. Proximity on Core Defining Dimensions (weight == 1.0)
      2. Lower residual variance across all dimensions
      3. Lexicographical ID order
    """
    u_vals = [u_coords.get(d, 0.0) for d in CANONICAL_DIMENSIONS]
    candidates = []

    for wv in worldviews:
        wv_id = wv.get("id", wv.get("worldview_id", "W000"))
        vec = wv.get("vector", {})
        if isinstance(vec, dict):
            w_vals = [float(vec.get(d, 0.0)) for d in CANONICAL_DIMENSIONS]
        else:
            w_vals = [float(x) for x in vec]

        dist = calculate_euclidean_distance(u_vals, w_vals)
        sim = calculate_similarity_score(dist)

        # Core dimension distance for tie-breaking
        doctrinal_weights = wv.get("doctrinal_weights", {})
        core_sq_sum = 0.0
        core_count = 0
        residuals = []

        for idx, d in enumerate(CANONICAL_DIMENSIONS):
            diff = u_vals[idx] - w_vals[idx]
            residuals.append(abs(diff))
            w_weight = doctrinal_weights.get(d, 1.0 if abs(w_vals[idx]) >= 0.7 else 0.5)
            if w_weight >= 0.8:
                core_sq_sum += diff ** 2
                core_count += 1

        core_dist = math.sqrt(core_sq_sum) if core_count > 0 else dist
        mean_res = sum(residuals) / 25.0
        var_res = sum((r - mean_res) ** 2 for r in residuals) / 25.0

        candidates.append({
            "worldview_id": wv_id,
            "name_en": wv.get("name_en", wv_id),
            "name_hi": wv.get("name_hi", ""),
            "cluster_id": wv.get("cluster_id", "C01"),
            "cluster_name": wv.get("cluster_name", ""),
            "similarity_score": sim,
            "euclidean_distance": round(dist, 4),
            "core_dimension_alignment": round(max(0.0, 1.0 - (core_dist / 5.0)), 4),
            "core_dist": core_dist,
            "var_res": var_res
        })

    # Sort hierarchy:
    # 1. similarity_score DESC (distance ASC)
    # 2. core_dist ASC
    # 3. var_res ASC
    # 4. worldview_id ASC
    candidates.sort(key=lambda x: (
        -x["similarity_score"],
        x["core_dist"],
        x["var_res"],
        x["worldview_id"]
    ))

    result = []
    for rank, cand in enumerate(candidates[:top_n], start=1):
        cand["rank"] = rank
        # Clean internal sorting keys
        cand.pop("core_dist", None)
        cand.pop("var_res", None)
        result.append(cand)

    return result


def rank_clusters(
    u_coords: Dict[str, float],
    centroids: Dict[str, List[float]],
    cluster_metadata: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Computes user alignment to all 25 dynamic cluster centroids.
    """
    u_vals = [u_coords.get(d, 0.0) for d in CANONICAL_DIMENSIONS]
    ranked = []

    for c_id in CANONICAL_CLUSTERS:
        mu = centroids.get(c_id, [0.0] * 25)
        dist = calculate_euclidean_distance(u_vals, mu)
        sim = calculate_similarity_score(dist)

        meta = (cluster_metadata or {}).get(c_id, {})
        ranked.append({
            "cluster_id": c_id,
            "name": meta.get("name_en", f"Cluster {c_id}"),
            "name_hi": meta.get("name_hi", ""),
            "similarity_score": sim,
            "distance_to_centroid": round(dist, 4)
        })

    ranked.sort(key=lambda x: -x["similarity_score"])
    for rank, item in enumerate(ranked, start=1):
        item["rank"] = rank

    return ranked


def generate_diagnostics(
    u_coords: Dict[str, float],
    coverage: Dict[str, float],
    conflict: Dict[str, float]
) -> List[Dict[str, Any]]:
    """
    Extracts high dialectical tension alerts (K_d >= 0.5) and low coverage flags (C_d < 0.4).
    """
    alerts = []

    for d in CANONICAL_DIMENSIONS:
        k = conflict.get(d, 0.0)
        c = coverage.get(d, 0.0)
        name = DIMENSION_NAMES.get(d, d)

        if k >= 0.50:
            alerts.append({
                "type": "HIGH_DIALECTICAL_TENSION",
                "dimension_id": d,
                "dimension_name": name,
                "conflict_score": k,
                "explanation": f"You endorsed strong principles favoring opposing poles on {name} across different scenarios."
            })
        elif c > 0.0 and c < 0.40:
            alerts.append({
                "type": "LOW_EVIDENCE_COVERAGE",
                "dimension_id": d,
                "dimension_name": name,
                "coverage_score": c,
                "explanation": f"Fewer items were evaluated for {name}; this coordinate leans toward provisional baseline."
            })

    return alerts


def evaluate_assessment(
    responses: Dict[str, Any],
    track: str,
    question_bank: Dict[str, Any],
    worldview_data: Union[Dict[str, Any], List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Master Evaluation Pipeline (Stages 1 through 6).
    Coordinates stateless evaluation across raw inputs and canonical contracts.
    """
    # Stage 1: Validation
    validate_responses(responses, track, question_bank)

    # Normalize worldview data format
    if isinstance(worldview_data, dict) and "worldviews" in worldview_data:
        worldviews_list = worldview_data["worldviews"]
        cluster_meta = {c["id"]: c for c in worldview_data.get("clusters", [])}
    elif isinstance(worldview_data, list):
        worldviews_list = worldview_data
        cluster_meta = {}
    else:
        worldviews_list = []
        cluster_meta = {}

    # Stage 2: Evidence Accumulation
    E_pos, E_neg, counts = accumulate_evidence(responses, track, question_bank)

    # Stages 3 & 4: Coordinate Normalization & Triad Computation
    u_coords, coverage, conflict = normalize_coordinates(E_pos, E_neg, track)

    # Stage 5: Global Worldview Matching
    top_matches = match_worldviews(u_coords, worldviews_list, top_n=5) if worldviews_list else []

    # Stage 6: Centroids & Diagnostics
    centroids = compute_dynamic_centroids(worldviews_list) if worldviews_list else {}
    cluster_proximities = rank_clusters(u_coords, centroids, cluster_meta) if centroids else []
    diagnostics = generate_diagnostics(u_coords, coverage, conflict)

    # Format user coordinates detailed
    coord_details = {}
    for d in CANONICAL_DIMENSIONS:
        pos = u_coords[d]
        cov = coverage[d]
        conf = conflict[d]

        if conf >= 0.50:
            status = "high_conflict"
        elif cov < 0.40 and cov > 0.0:
            status = "low_coverage"
        elif cov == 0.0:
            status = "unmeasured"
        elif abs(pos) >= 0.50:
            status = "decisive"
        else:
            status = "moderate"

        coord_details[d] = {
            "name": DIMENSION_NAMES.get(d, d),
            "position": pos,
            "coverage": cov,
            "conflict": conf,
            "status": status
        }

    # Format radar series (normalized to [0.0, 1.0] where 0.5 is center)
    radar_series = []
    for idx, d in enumerate(CANONICAL_DIMENSIONS):
        pos = u_coords[d]
        norm_val = round((pos + 1.0) / 2.0, 4)
        radar_series.append({
            "dimension_id": d,
            "axis_index": idx,
            "normalized_value": norm_val
        })

    # Summary metrics
    active_dims = sum(1 for d in CANONICAL_DIMENSIONS if coverage[d] > 0.0)
    mean_cov = round(sum(coverage.values()) / 25.0, 4)
    highest_k_dim = max(CANONICAL_DIMENSIONS, key=lambda d: conflict[d])

    return {
        "status": "success",
        "engine_version": ENGINE_VERSION,
        "assessment_track": track,
        "summary": {
            "total_questions_evaluated": len(responses),
            "dimensions_with_evidence": active_dims,
            "mean_confidence_coverage": mean_cov,
            "highest_conflict_dimension": highest_k_dim
        },
        "user_coordinates": coord_details,
        "radar_series": radar_series,
        "top_matches": top_matches,
        "cluster_proximities": cluster_proximities,
        "diagnostic_alerts": diagnostics
    }
