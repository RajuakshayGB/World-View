"""
Worldview Compass — System-Wide Automated Validation Suite (validate_system.py)
Document Class: Quality Assurance Specification & Release Engineering Constitution
Governed Specification: Part 10 (part-10-validation-suite-and-release-gate.md)

Four-Level Hierarchical Validation Gate:
  Level 1: Syntax, Parsing & Static Hygiene Gate
  Level 2: Schema, Cardinality & Referential Integrity Gate
  Level 3: Mathematical Invariants, Scale Bounds & Spatial Proofs
  Level 4: Cross-File Layer Isolation, AST Inspection & End-to-End Execution
"""

from __future__ import annotations

import ast
import json
import math
import os
import re
import sys
import time
from typing import Any, Dict, List, Set, Tuple

# Base paths
ARTIFACTS_DIR = "/workspace/artifacts"
SCRATCH_DIR = "/workspace/scratch"

def find_file(filename: str) -> str:
    """Find file in artifacts or scratch."""
    p1 = os.path.join(ARTIFACTS_DIR, filename)
    if os.path.exists(p1):
        return p1
    p2 = os.path.join(SCRATCH_DIR, filename)
    if os.path.exists(p2):
        return p2
    raise FileNotFoundError(f"Cannot find required system file: {filename}")


class ValidationFailure(Exception):
    """Raised when an automated quality gate fails."""
    pass


class SystemValidator:
    def __init__(self) -> None:
        self.wv_data_path = find_file("worldview_data.json")
        self.q_data_path = find_file("question_data.json")
        self.brain_path = find_file("worldview_brain.py")
        self.api_path = find_file("worldview_api.py")
        
        self.wv_data: Dict[str, Any] = {}
        self.q_data: Dict[str, Any] = {}
        self.brain_module: Any = None
        self.api_module: Any = None

        self.passed_checks = 0
        self.failed_checks = 0

    def log_check(self, name: str, passed: bool, details: str = "") -> None:
        if passed:
            self.passed_checks += 1
            print(f"  [PASS] {name} {details}")
        else:
            self.failed_checks += 1
            print(f"  [FAIL] {name} {details}")
            raise ValidationFailure(f"Gate failure on: {name}. Details: {details}")

    # =========================================================================
    # LEVEL 1: Syntax, Parsing & Static Hygiene Gate
    # =========================================================================
    def run_level_1(self) -> None:
        print("\n" + "="*70)
        print("LEVEL 1: SYNTAX, PARSING & STATIC HYGIENE GATE")
        print("="*70)

        # 1. JSON parseability and UTF-8 hygiene
        for path, label in [(self.wv_data_path, "worldview_data.json"), (self.q_data_path, "question_data.json")]:
            with open(path, "rb") as f:
                raw_bytes = f.read()
            
            # Check UTF-8 decoding
            try:
                raw_text = raw_bytes.decode("utf-8")
                self.log_check(f"{label} UTF-8 Decoding", True, f"({len(raw_bytes):,} bytes)")
            except UnicodeDecodeError as e:
                self.log_check(f"{label} UTF-8 Decoding", False, str(e))

            # Check for Unicode replacement character (\uFFFD)
            has_replacement = "\uFFFD" in raw_text
            self.log_check(f"{label} Unicode Cleanliness (no \\uFFFD)", not has_replacement)

            # Strict JSON parsing
            try:
                parsed = json.loads(raw_text)
                self.log_check(f"{label} Strict RFC 8259 JSON Syntax", True)
                if label == "worldview_data.json":
                    self.wv_data = parsed
                else:
                    self.q_data = parsed
            except json.JSONDecodeError as e:
                self.log_check(f"{label} Strict RFC 8259 JSON Syntax", False, str(e))

        # 2. Devanagari character verification
        def check_devanagari(obj: Any) -> int:
            count = 0
            if isinstance(obj, str):
                for ch in obj:
                    if "\u0900" <= ch <= "\u097F":
                        count += 1
            elif isinstance(obj, dict):
                for v in obj.values():
                    count += check_devanagari(v)
            elif isinstance(obj, list):
                for item in obj:
                    count += check_devanagari(item)
            return count

        wv_hi_count = check_devanagari(self.wv_data)
        q_hi_count = check_devanagari(self.q_data)
        self.log_check("worldview_data.json Devanagari Hindi Presence", wv_hi_count > 10000, f"({wv_hi_count:,} chars)")
        self.log_check("question_data.json Devanagari Hindi Presence", q_hi_count > 10000, f"({q_hi_count:,} chars)")

        # 3. Python AST parsing & Zero external dependency check
        for path, label in [(self.brain_path, "worldview_brain.py"), (self.api_path, "worldview_api.py")]:
            with open(path, "r", encoding="utf-8") as f:
                code_text = f.read()
            
            try:
                tree = ast.parse(code_text, filename=path)
                self.log_check(f"{label} Python AST Syntax Check", True)
            except SyntaxError as e:
                self.log_check(f"{label} Python AST Syntax Check", False, str(e))

            # Inspect imports for zero-dependency policy in runtime path
            forbidden_modules = {"numpy", "scipy", "pandas", "flask", "fastapi", "django", "torch", "sklearn"}
            imported_modules = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imported_modules.add(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imported_modules.add(node.module.split(".")[0])
            
            leaked_deps = imported_modules.intersection(forbidden_modules)
            self.log_check(f"{label} Zero External Dependencies (Standard Library Only)", len(leaked_deps) == 0, f"Imports: {imported_modules}")

        # Dynamic import of brain and api
        sys.path.insert(0, os.path.dirname(self.brain_path))
        sys.path.insert(0, os.path.dirname(self.api_path))
        import worldview_brain
        import worldview_api
        self.brain_module = worldview_brain
        self.api_module = worldview_api
        self.log_check("Module Ingestion (worldview_brain & worldview_api)", True)

    # =========================================================================
    # LEVEL 2: Schema, Cardinality & Referential Integrity Gate
    # =========================================================================
    def run_level_2(self) -> None:
        print("\n" + "="*70)
        print("LEVEL 2: SCHEMA, CARDINALITY & REFERENTIAL INTEGRITY GATE")
        print("="*70)

        # 1. Exact Cardinality Invariants
        dims = self.wv_data.get("dimensions", [])
        clusters = self.wv_data.get("clusters", [])
        worldviews = self.wv_data.get("worldviews", [])
        bin_pool = self.q_data.get("binary_pool", [])
        dil_pool = self.q_data.get("dilemma_pool", [])

        self.log_check("Dimensions Cardinality (|D| == 25)", len(dims) == 25, f"Count = {len(dims)}")
        self.log_check("Clusters Cardinality (|C| == 25)", len(clusters) == 25, f"Count = {len(clusters)}")
        self.log_check("Worldviews Cardinality (|W| == 250)", len(worldviews) == 250, f"Count = {len(worldviews)}")
        self.log_check("Question Bank Pool A (|Q_bin| == 250)", len(bin_pool) == 250, f"Count = {len(bin_pool)}")
        self.log_check("Question Bank Pool B (|Q_dil| == 500)", len(dil_pool) == 500, f"Count = {len(dil_pool)}")
        self.log_check("Total Question Bank Items (|Q| == 750)", (len(bin_pool) + len(dil_pool)) == 750)

        # 2. Identifier pattern integrity
        dim_ids = [d["id"] for d in dims]
        expected_dim_ids = [f"D{i:02d}" for i in range(1, 26)]
        self.log_check("Dimension IDs Exact Sequence (D01..D25)", dim_ids == expected_dim_ids)

        cluster_ids = [c["id"] for c in clusters]
        expected_cluster_ids = [f"C{i:02d}" for i in range(1, 26)]
        self.log_check("Cluster IDs Exact Sequence (C01..C25)", cluster_ids == expected_cluster_ids)

        wv_ids = [w["id"] for w in worldviews]
        expected_wv_ids = [f"W{i:03d}" for i in range(1, 251)]
        self.log_check("Worldview IDs Exact Sequence (W001..W250)", wv_ids == expected_wv_ids)

        # 3. 25D Coordinate Completeness & Continuous Range [-1.0, +1.0]
        coord_count = 0
        min_c = 1.0
        max_c = -1.0
        bounds_valid = True
        no_nulls = True

        for w in worldviews:
            vec = w.get("vector", {})
            if len(vec) != 25:
                bounds_valid = False
            for d_id in expected_dim_ids:
                if d_id not in vec or vec[d_id] is None or math.isnan(float(vec[d_id])):
                    no_nulls = False
                val = float(vec.get(d_id, 0.0))
                coord_count += 1
                if val < min_c: min_c = val
                if val > max_c: max_c = val
                if val < -1.0000 or val > 1.0000:
                    bounds_valid = False

        self.log_check("Total Spatial Coordinates Count (250 x 25 = 6,250)", coord_count == 6250, f"Total = {coord_count}")
        self.log_check("Coordinate Completeness (Zero Nulls / NaNs)", no_nulls)
        self.log_check("Continuous Hypercube Bounds ([-1.0000, +1.0000])", bounds_valid, f"Observed [{min_c:.4f}, {max_c:.4f}]")

        # 4. Bidirectional Cluster Membership & Allocation
        membership_balanced = True
        cluster_wv_map = {c_id: [] for c_id in expected_cluster_ids}
        for w in worldviews:
            c_id = w.get("cluster_id")
            if c_id in cluster_wv_map:
                cluster_wv_map[c_id].append(w["id"])

        for c in clusters:
            c_id = c["id"]
            declared_members = c.get("worldview_members", c.get("worldview_ids", []))
            actual_members = cluster_wv_map.get(c_id, [])
            if len(actual_members) != 10 or set(declared_members) != set(actual_members):
                membership_balanced = False

        self.log_check("Cluster Allocation Parity (Exactly 10 Profiles per Cluster)", membership_balanced)

        # 5. Anti-Acquiescence Polarity Invariant (Track 1 Binary Pool)
        polarity_balanced = True
        bin_dim_counts: Dict[str, Dict[str, int]] = {d: {"pos": 0, "neg": 0} for d in expected_dim_ids}
        for q in bin_pool:
            d = q.get("dimension")
            pol = float(q.get("polarity", 0.0))
            if d in bin_dim_counts:
                if pol > 0:
                    bin_dim_counts[d]["pos"] += 1
                elif pol < 0:
                    bin_dim_counts[d]["neg"] += 1

        for d, counts in bin_dim_counts.items():
            if counts["pos"] != 5 or counts["neg"] != 5:
                polarity_balanced = False
                break

        self.log_check("Anti-Acquiescence Balanced Polarity (5 Pos / 5 Neg per Dimension in Pool A)", polarity_balanced)

        # 6. Dilemma 6-Option Geometry & Multi-Axis Trade-Offs (Pool B)
        dilemma_structure_valid = True
        for q in dil_pool:
            options = q.get("options", [])
            if len(options) != 6:
                dilemma_structure_valid = False
                break
            opt_ids = [opt.get("option_id") for opt in options]
            if opt_ids != ["OPT_1", "OPT_2", "OPT_3", "OPT_4", "OPT_5", "OPT_6"]:
                dilemma_structure_valid = False
                break

        self.log_check("Pool B 6-Option Geometry (OPT_1..OPT_6 present across all 500 dilemmas)", dilemma_structure_valid)

    # =========================================================================
    # LEVEL 3: Mathematical Invariants, Scale Bounds & Spatial Proofs
    # =========================================================================
    def run_level_3(self) -> None:
        print("\n" + "="*70)
        print("LEVEL 3: MATHEMATICAL INVARIANTS, SCALE BOUNDS & SPATIAL PROOFS")
        print("="*70)

        brain = self.brain_module

        # 1. Determinism Proof (100 executions identical to 10 decimal places)
        sample_responses = {
            "Q_BIN_D01_001": 1,
            "Q_BIN_D01_006": -1,
            "Q_BIN_D02_001": 1,
            "Q_BIN_D02_006": 1
        }
        res_first = brain.evaluate_assessment(sample_responses, "track_1", self.q_data, self.wv_data)
        coords_str_first = json.dumps(res_first["user_coordinates"], sort_keys=True)

        is_deterministic = True
        for _ in range(100):
            res_repeat = brain.evaluate_assessment(sample_responses, "track_1", self.q_data, self.wv_data)
            if json.dumps(res_repeat["user_coordinates"], sort_keys=True) != coords_str_first:
                is_deterministic = False
                break

        self.log_check("Bit-for-Bit Determinism (100 consecutive evaluations match identically)", is_deterministic)

        # 2. Boundary Clamping & Saturation Limits
        extreme_pos_responses = {}
        for q in self.q_data["binary_pool"]:
            if q["dimension"] == "D01":
                extreme_pos_responses[q["question_id"]] = 1 if q["polarity"] == 1.0 else -1

        res_pos = brain.evaluate_assessment(extreme_pos_responses, "track_1", self.q_data, self.wv_data)
        d01_pos = res_pos["user_coordinates"]["D01"]["position"]
        self.log_check("Positive Saturation Ceiling Clamping (u_d == +1.0000)", d01_pos == 1.0000, f"Position = {d01_pos}")

        extreme_neg_responses = {}
        for q in self.q_data["binary_pool"]:
            if q["dimension"] == "D01":
                extreme_neg_responses[q["question_id"]] = -1 if q["polarity"] == 1.0 else 1

        res_neg = brain.evaluate_assessment(extreme_neg_responses, "track_1", self.q_data, self.wv_data)
        d01_neg = res_neg["user_coordinates"]["D01"]["position"]
        self.log_check("Negative Saturation Floor Clamping (u_d == -1.0000)", d01_neg == -1.0000, f"Position = {d01_neg}")

        # 3. Triad Diagnostic Proofs:
        # A. Synthetic All-Agree Bias (Stratified Track 1: 1 Pos + 1 Neg per dimension across all 25 dims = 50 items)
        stratified_agree = {}
        for d_idx in range(1, 26):
            d_id = f"D{d_idx:02d}"
            pos_items = [q for q in self.q_data["binary_pool"] if q["dimension"] == d_id and q["polarity"] == 1.0]
            neg_items = [q for q in self.q_data["binary_pool"] if q["dimension"] == d_id and q["polarity"] == -1.0]
            stratified_agree[pos_items[0]["question_id"]] = 1
            stratified_agree[neg_items[0]["question_id"]] = 1

        res_agree = brain.evaluate_assessment(stratified_agree, "track_1", self.q_data, self.wv_data)
        all_coords_zero = all(c["position"] == 0.0000 for c in res_agree["user_coordinates"].values())
        all_conflict_high = all(c["conflict"] == 1.0000 for c in res_agree["user_coordinates"].values())
        all_coverage_full = all(c["coverage"] == 1.0000 for c in res_agree["user_coordinates"].values())
        self.log_check("Triad All-Agree Neutralization (u_d = 0.0000, K_d = 1.0000 across all 25 dimensions)", all_coords_zero and all_conflict_high and all_coverage_full)

        # B. Dialectical Conflict Detection in Track 3
        # Select OPT_1 (+1.0) and OPT_4 (-1.0) on D01
        t3_conflict_q = self.q_data["dilemma_pool"][0]["question_id"]
        t3_conflict_responses = {t3_conflict_q: ["OPT_1", "OPT_4"]}
        res_t3 = brain.evaluate_assessment(t3_conflict_responses, "track_3", self.q_data, self.wv_data)
        d01_t3_pos = res_t3["user_coordinates"]["D01"]["position"]
        d01_t3_conf = res_t3["user_coordinates"]["D01"]["conflict"]
        self.log_check("Track 3 Dialectical Conflict Detection (u_d = 0.0000, K_d >= 0.9900)", d01_t3_pos == 0.0 and d01_t3_conf >= 0.99)

        # 4. Spatial Distinctiveness & Pairwise Separation Proof
        worldviews = self.wv_data["worldviews"]
        min_wv_dist = 999.0
        closest_pair = ("", "")
        vectors = [[w["vector"][f"D{i:02d}"] for i in range(1, 26)] for w in worldviews]

        for i in range(len(vectors)):
            for j in range(i + 1, len(vectors)):
                dist = math.sqrt(sum((a - b)**2 for a, b in zip(vectors[i], vectors[j])))
                if dist < min_wv_dist:
                    min_wv_dist = dist
                    closest_pair = (worldviews[i]["id"], worldviews[j]["id"])

        self.log_check("Pairwise Worldview Separation (Zero Duplicates; min D_E >= 0.5905)", min_wv_dist >= 0.5905, f"min D_E = {min_wv_dist:.4f} between {closest_pair}")

        # 5. Dynamic Cluster Centroid Separation Test
        centroids = brain.compute_dynamic_centroids(worldviews)
        min_c_dist = 999.0
        closest_c_pair = ("", "")
        c_keys = [f"C{i:02d}" for i in range(1, 26)]

        for i in range(len(c_keys)):
            for j in range(i + 1, len(c_keys)):
                dist = math.sqrt(sum((a - b)**2 for a, b in zip(centroids[c_keys[i]], centroids[c_keys[j]])))
                if dist < min_c_dist:
                    min_c_dist = dist
                    closest_c_pair = (c_keys[i], c_keys[j])

        self.log_check("Cluster Centroid Separation (min D_E(C_a, C_b) >= 1.5915)", min_c_dist >= 1.5915, f"min D_E = {min_c_dist:.4f} between {closest_c_pair}")

        # 6. Pearson Cross-Dimensional Orthogonality Test (|r| < 0.85)
        max_r = 0.0
        max_r_pair = ("", "")
        for d1 in range(25):
            v1 = [vectors[w][d1] for w in range(250)]
            mean1 = sum(v1) / 250.0
            std1 = math.sqrt(sum((x - mean1)**2 for x in v1))
            for d2 in range(d1 + 1, 25):
                v2 = [vectors[w][d2] for w in range(250)]
                mean2 = sum(v2) / 250.0
                std2 = math.sqrt(sum((x - mean2)**2 for x in v2))
                if std1 > 0 and std2 > 0:
                    cov = sum((v1[w] - mean1) * (v2[w] - mean2) for w in range(250))
                    r = abs(cov / (std1 * std2))
                    if r > max_r:
                        max_r = r
                        max_r_pair = (f"D{d1+1:02d}", f"D{d2+1:02d}")

        self.log_check("Cross-Dimensional Orthogonality (max |r| < 0.85)", max_r < 0.85, f"max |r| = {max_r:.4f} between {max_r_pair}")

    # =========================================================================
    # LEVEL 4: Cross-File Layer Isolation, AST Inspection & End-to-End Execution
    # =========================================================================
    def run_level_4(self) -> None:
        print("\n" + "="*70)
        print("LEVEL 4: LAYER ISOLATION, FIREWALL SECURITY & END-TO-END EXECUTION")
        print("="*70)

        api = self.api_module

        # 1. API Firewall Rejection Gates
        # A. Malformed / Unsupported Schema Version
        invalid_ver_req = {
            "assessment_track": "track_1",
            "schema_version": "1.0.0",
            "responses": {"Q_BIN_D01_001": 1}
        }
        code, err = api.handle_evaluate(invalid_ver_req, self.q_data, self.wv_data)
        self.log_check("API Firewall: Rejects Unsupported Schema Version (HTTP 422)", code == 422 and err["error_code"] == "UNSUPPORTED_SCHEMA_VERSION")

        # B. Missing Required Fields
        missing_field_req = {
            "assessment_track": "track_1",
            "responses": {"Q_BIN_D01_001": 1}
        }
        code, err = api.handle_evaluate(missing_field_req, self.q_data, self.wv_data)
        self.log_check("API Firewall: Rejects Missing Required Fields (HTTP 422)", code == 422 and err["error_code"] == "MISSING_REQUIRED_FIELD")

        # C. Unknown Question Identifier
        unknown_q_req = {
            "assessment_track": "track_1",
            "schema_version": "2.0.0",
            "responses": {"Q_BIN_D99_999": 1}
        }
        code, err = api.handle_evaluate(unknown_q_req, self.q_data, self.wv_data)
        self.log_check("API Firewall: Rejects Unknown Question Identifier (HTTP 422)", code == 422 and err["error_code"] == "UNKNOWN_QUESTION_IDENTIFIER")

        # D. Track 3 Option Selection Cardinality Violation (Must be exactly 2 distinct options)
        invalid_t3_req = {
            "assessment_track": "track_3",
            "schema_version": "2.0.0",
            "responses": {"Q_DIL_D01_001": ["OPT_1"]}  # Only 1 option
        }
        code, err = api.handle_evaluate(invalid_t3_req, self.q_data, self.wv_data)
        self.log_check("API Firewall: Rejects Track 3 Single-Selection (HTTP 422)", code == 422 and err["error_code"] == "INVALID_OPTION_CARDINALITY")

        invalid_t3_dup = {
            "assessment_track": "track_3",
            "schema_version": "2.0.0",
            "responses": {"Q_DIL_D01_001": ["OPT_1", "OPT_1"]}  # Duplicate option
        }
        code, err = api.handle_evaluate(invalid_t3_dup, self.q_data, self.wv_data)
        self.log_check("API Firewall: Rejects Track 3 Duplicate Options (HTTP 422)", code == 422 and err["error_code"] == "DUPLICATE_OPTIONS_SUBMITTED")

        # 2. End-to-End Live Evaluation across All Three Tracks
        # A. Track 1 Execution
        t1_req = {
            "assessment_track": "track_1",
            "schema_version": "2.0.0",
            "language": "en",
            "responses": {q["question_id"]: 1 for q in self.q_data["binary_pool"][:50]}
        }
        start = time.perf_counter()
        code1, resp1 = api.handle_evaluate(t1_req, self.q_data, self.wv_data)
        dur1_ms = (time.perf_counter() - start) * 1000.0
        self.log_check("Track 1 Live Assessment End-to-End Evaluation", code1 == 200 and resp1["status"] == "success", f"Latency: {dur1_ms:.2f} ms")

        # B. Track 2 Execution
        t2_req = {
            "assessment_track": "track_2",
            "schema_version": "2.0.0",
            "language": "hi",
            "responses": {self.q_data["dilemma_pool"][i*20]["question_id"]: "OPT_2" for i in range(25)}
        }
        start = time.perf_counter()
        code2, resp2 = api.handle_evaluate(t2_req, self.q_data, self.wv_data)
        dur2_ms = (time.perf_counter() - start) * 1000.0
        self.log_check("Track 2 Live Assessment End-to-End Evaluation", code2 == 200 and resp2["status"] == "success", f"Latency: {dur2_ms:.2f} ms")

        # C. Track 3 Execution
        t3_req = {
            "assessment_track": "track_3",
            "schema_version": "2.0.0",
            "language": "en",
            "responses": {self.q_data["dilemma_pool"][i*5]["question_id"]: ["OPT_1", "OPT_5"] for i in range(25)}
        }
        start = time.perf_counter()
        code3, resp3 = api.handle_evaluate(t3_req, self.q_data, self.wv_data)
        dur3_ms = (time.perf_counter() - start) * 1000.0
        self.log_check("Track 3 Live Assessment End-to-End Evaluation", code3 == 200 and resp3["status"] == "success", f"Latency: {dur3_ms:.2f} ms")

        # 3. System API Discovery Endpoints
        code_meta, meta_resp = api.handle_metadata(self.q_data, self.wv_data)
        self.log_check("API Metadata Endpoint (/api/metadata)", code_meta == 200 and meta_resp["worldviews_count"] == 250)

        code_health, health_resp = api.handle_health(self.q_data, self.wv_data)
        self.log_check("API Health & Readiness Probe (/api/health)", code_health == 200 and health_resp["status"] == "healthy")


def main() -> int:
    print("*"*70)
    print("WORLDVIEW COMPASS — SYSTEM-WIDE ARCHITECTURAL RELEASE HARNESS")
    print("Automated Level 1–4 Validation Gate")
    print("*"*70)

    start_total = time.perf_counter()
    validator = SystemValidator()

    try:
        validator.run_level_1()
        validator.run_level_2()
        validator.run_level_3()
        validator.run_level_4()
    except ValidationFailure as e:
        print("\n" + "!"*70)
        print("RELEASE GATE BLOCKED: VALIDATION FAILURE DETECTED")
        print(f"Error: {e}")
        print("!"*70)
        return 1

    total_time = (time.perf_counter() - start_total) * 1000.0
    print("\n" + "="*70)
    print("SYSTEM VALIDATION CERTIFICATION: 100% PASS")
    print(f"Total Checks Executed: {validator.passed_checks}")
    print(f"Total Failures: {validator.failed_checks}")
    print(f"Total Execution Time: {total_time:.2f} ms")
    print("STATUS: WORLDVIEW COMPASS PRODUCTION BUILD IS CERTIFIED VALID & RELEASE READY")
    print("="*70 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
