"""
Worldview Compass — API Service Gateway & Contract Firewall (worldview_api.py)
Document Class: Service Gateway Specification & API Security Architecture
Governed Specification: Part 7 (part-07-api-service-gateway-and-firewall.md)

Core Axioms:
1. "API validates and serializes; it never calculates, never caches, and never persists."
2. Pure statelessness: Zero server-side session persistence.
3. Zero stack-trace leakage: All internal exceptions are converted to standardized error codes.
4. Sub-5ms latency budget.
"""

from __future__ import annotations

import datetime
import json
import re
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from urllib.parse import parse_qs, urlparse

# Import mathematical authority
import worldview_brain

API_VERSION = "v1.0.0"
SCHEMA_MAJOR_VERSION = "2"
MAX_PAYLOAD_BYTES = 128 * 1024  # 128 KB limit

# Regular expressions for validation
SCHEMA_VERSION_PATTERN = re.compile(r"^2\.[0-9]+\.[0-9]+$")
QUESTION_ID_PATTERN = re.compile(r"^Q_(BIN|DIL)_D(0[1-9]|1[0-9]|2[0-5])_[0-9]{3}$")

VALID_TRACKS = {"track_1", "track_2", "track_3"}
VALID_LANGUAGES = {"en", "hi"}
TRACK_MAX_COUNTS = {
    "track_1": 50,
    "track_2": 25,
    "track_3": 100
}


class ApiException(Exception):
    """Base API exception carrying HTTP status and structured error details."""
    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        invalid_field: Optional[str] = None
    ):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.invalid_field = invalid_field

    def to_dict(self) -> Dict[str, Any]:
        err = {
            "status": "error",
            "error_code": self.error_code,
            "message": self.message,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        if self.invalid_field:
            err["invalid_field"] = self.invalid_field
        return err


def get_current_iso_timestamp() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ============================================================================
# 5-STAGE UNTRUSTED CLIENT FIREWALL & INGESTION GATE
# ============================================================================

def validate_evaluation_request(
    payload: Any,
    question_bank: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes the 5-Stage Security Firewall against untrusted client evaluation requests.
    Raises ApiException on any contract violation.
    """
    # Stage 1: Payload structure
    if not isinstance(payload, dict):
        raise ApiException(
            HTTPStatus.BAD_REQUEST,
            "MALFORMED_JSON",
            "Request body must be a valid JSON object."
        )

    # Stage 2: Envelope & Schema Version Gate
    if "assessment_track" not in payload:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "MISSING_REQUIRED_FIELD",
            "Missing required field 'assessment_track'.",
            invalid_field="assessment_track"
        )
    if "schema_version" not in payload:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "MISSING_REQUIRED_FIELD",
            "Missing required field 'schema_version'.",
            invalid_field="schema_version"
        )
    if "responses" not in payload:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "MISSING_REQUIRED_FIELD",
            "Missing required field 'responses'.",
            invalid_field="responses"
        )

    track = payload.get("assessment_track")
    if track not in VALID_TRACKS:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "INVALID_TRACK_SPECIFIED",
            f"Field 'assessment_track' must be one of: {sorted(list(VALID_TRACKS))}.",
            invalid_field="assessment_track"
        )

    schema_ver = str(payload.get("schema_version", ""))
    if not SCHEMA_VERSION_PATTERN.match(schema_ver):
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "UNSUPPORTED_SCHEMA_VERSION",
            f"Client schema version '{schema_ver}' is not supported. Required format: ^2.x.x.",
            invalid_field="schema_version"
        )

    language = payload.get("language", "en")
    if language not in VALID_LANGUAGES:
        language = "en"  # fallback default

    responses = payload.get("responses")
    if not isinstance(responses, dict):
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "INVALID_RESPONSE_TYPE",
            "Field 'responses' must be a key-value mapping of question IDs to answers.",
            invalid_field="responses"
        )

    # Stage 3: Track Cardinality Gate
    item_count = len(responses)
    max_count = TRACK_MAX_COUNTS.get(track, 100)
    if item_count < 1 or item_count > max_count:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "INVALID_ITEM_COUNT",
            f"Track '{track}' requires between 1 and {max_count} responses. Received: {item_count}.",
            invalid_field="responses"
        )

    # Build known question map if bank supplied
    known_questions = None
    if question_bank:
        known_questions = set()
        for q in question_bank.get("binary_pool", []):
            known_questions.add(q["question_id"])
        for q in question_bank.get("dilemma_pool", []):
            known_questions.add(q["question_id"])

    # Stage 4 & 5: Token Integrity, Response Types & Selection Bounds
    for q_id, resp in responses.items():
        if not QUESTION_ID_PATTERN.match(q_id):
            raise ApiException(
                HTTPStatus.UNPROCESSABLE_ENTITY,
                "UNKNOWN_QUESTION_IDENTIFIER",
                f"Question ID '{q_id}' violates canonical token pattern.",
                invalid_field=f"responses.{q_id}"
            )
        if known_questions is not None and q_id not in known_questions:
            raise ApiException(
                HTTPStatus.UNPROCESSABLE_ENTITY,
                "UNKNOWN_QUESTION_IDENTIFIER",
                f"Question ID '{q_id}' does not exist in question bank.",
                invalid_field=f"responses.{q_id}"
            )

        if track == "track_1":
            if not isinstance(resp, int) or resp not in (-1, 1):
                raise ApiException(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_RESPONSE_TYPE",
                    f"Question '{q_id}' in Track 1 requires integer +1 or -1. Received: {type(resp).__name__} ({resp}).",
                    invalid_field=f"responses.{q_id}"
                )
        elif track == "track_2":
            if not isinstance(resp, str) or resp not in ("OPT_1", "OPT_2", "OPT_3", "OPT_4"):
                raise ApiException(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_OPTION_TOKEN",
                    f"Question '{q_id}' in Track 2 requires option token OPT_1..OPT_4. Received: {resp}.",
                    invalid_field=f"responses.{q_id}"
                )
        elif track == "track_3":
            if not isinstance(resp, (list, tuple)):
                raise ApiException(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_RESPONSE_TYPE",
                    f"Question '{q_id}' in Track 3 requires an array of 2 options.",
                    invalid_field=f"responses.{q_id}"
                )
            if len(resp) != 2:
                raise ApiException(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_OPTION_CARDINALITY",
                    f"Question '{q_id}' in Track 3 requires exactly 2 distinct selected options. Received: {len(resp)}.",
                    invalid_field=f"responses.{q_id}"
                )
            if len(set(resp)) != 2:
                raise ApiException(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    "DUPLICATE_OPTIONS_SUBMITTED",
                    f"Question '{q_id}' contains duplicate options: {resp}.",
                    invalid_field=f"responses.{q_id}"
                )
            for opt in resp:
                if not isinstance(opt, str) or opt not in ("OPT_1", "OPT_2", "OPT_3", "OPT_4", "OPT_5", "OPT_6"):
                    raise ApiException(
                        HTTPStatus.UNPROCESSABLE_ENTITY,
                        "INVALID_OPTION_TOKEN",
                        f"Question '{q_id}' contains invalid option token: {opt}.",
                        invalid_field=f"responses.{q_id}"
                    )

    return {
        "assessment_track": track,
        "schema_version": schema_ver,
        "language": language,
        "responses": responses
    }


# ============================================================================
# API CONTROLLER & ENDPOINTS
# ============================================================================

def handle_evaluate(
    request_data: Any,
    question_bank: Dict[str, Any],
    worldview_data: Union[Dict[str, Any], List[Dict[str, Any]]]
) -> Tuple[int, Dict[str, Any]]:
    """
    POST /api/evaluate Controller
    Ingests untrusted client payload, executes firewall, invokes brain, and shapes response.
    """
    try:
        validated = validate_evaluation_request(request_data, question_bank)

        # Delegate evaluation strictly to worldview_brain
        raw_result = worldview_brain.evaluate_assessment(
            responses=validated["responses"],
            track=validated["assessment_track"],
            question_bank=question_bank,
            worldview_data=worldview_data
        )

        # Shape response according to Part 7 contract
        response_payload = {
            "status": "success",
            "timestamp": get_current_iso_timestamp(),
            "engine_version": raw_result.get("engine_version", worldview_brain.ENGINE_VERSION),
            "api_version": API_VERSION,
            "assessment_track": validated["assessment_track"],
            "language": validated["language"],
            "summary": raw_result["summary"],
            "user_coordinates": raw_result["user_coordinates"],
            "radar_series": raw_result["radar_series"],
            "top_matches": raw_result["top_matches"],
            "cluster_proximities": raw_result["cluster_proximities"],
            "diagnostic_alerts": raw_result["diagnostic_alerts"]
        }

        return HTTPStatus.OK, response_payload

    except ApiException as api_err:
        return api_err.status_code, api_err.to_dict()
    except worldview_brain.BrainValidationError as b_err:
        err = ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "BRAIN_VALIDATION_ERROR",
            str(b_err)
        )
        return err.status_code, err.to_dict()
    except Exception as exc:
        # Error Shielding: Log internally, shield stack trace from public response
        sys.stderr.write(f"[API ERROR SHIELD] Unhandled exception: {exc}\n")
        err = ApiException(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_CALCULATION_ERROR",
            "An unexpected internal computational error occurred while processing the assessment."
        )
        return err.status_code, err.to_dict()


def handle_metadata(
    question_bank: Optional[Dict[str, Any]] = None,
    worldview_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
) -> Tuple[int, Dict[str, Any]]:
    """
    GET /api/metadata Controller
    Returns system metadata, registries, versions, and track parameters.
    """
    q_count = 0
    if question_bank:
        q_count = len(question_bank.get("binary_pool", [])) + len(question_bank.get("dilemma_pool", []))

    wv_count = 0
    if isinstance(worldview_data, dict):
        wv_count = len(worldview_data.get("worldviews", []))
    elif isinstance(worldview_data, list):
        wv_count = len(worldview_data)

    payload = {
        "engine_version": worldview_brain.ENGINE_VERSION,
        "api_version": API_VERSION,
        "dataset_version": "worldview_data_v2.0.0",
        "question_bank_version": "question_data_v2.0.0",
        "dimensions_count": len(worldview_brain.CANONICAL_DIMENSIONS),
        "clusters_count": len(worldview_brain.CANONICAL_CLUSTERS),
        "worldviews_count": wv_count if wv_count > 0 else 250,
        "total_questions_in_bank": q_count if q_count > 0 else 750,
        "tracks": {
            "track_1": {
                "name": "Quick Baseline",
                "question_count": 50,
                "format": "binary",
                "selection_rule": "Select exactly 1 (+1 Agree / -1 Disagree)"
            },
            "track_2": {
                "name": "Nuanced Stances",
                "question_count": 25,
                "format": "single_choice_dilemma",
                "selection_rule": "Select exactly 1 (Options 1–4)"
            },
            "track_3": {
                "name": "Scenario Trade-offs",
                "question_count": 100,
                "format": "dual_choice_dilemma",
                "selection_rule": "Select exactly 2 of 6 (Options 1–6)"
            }
        },
        "dimensions": [
            {
                "id": d_id,
                "name": worldview_brain.DIMENSION_NAMES.get(d_id, d_id)
            }
            for d_id in worldview_brain.CANONICAL_DIMENSIONS
        ]
    }
    return HTTPStatus.OK, payload


def handle_health(
    question_bank: Optional[Dict[str, Any]] = None,
    worldview_data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
) -> Tuple[int, Dict[str, Any]]:
    """
    GET /api/health Controller
    High-performance probe for container orchestration.
    """
    q_loaded = bool(question_bank and ("binary_pool" in question_bank or "dilemma_pool" in question_bank))
    wv_loaded = bool(worldview_data)

    q_count = 0
    if question_bank:
        q_count = len(question_bank.get("binary_pool", [])) + len(question_bank.get("dilemma_pool", []))

    wv_count = 0
    if isinstance(worldview_data, dict):
        wv_count = len(worldview_data.get("worldviews", []))
    elif isinstance(worldview_data, list):
        wv_count = len(worldview_data)

    payload = {
        "status": "healthy",
        "timestamp": get_current_iso_timestamp(),
        "checks": {
            "worldview_data_loaded": wv_loaded,
            "question_data_loaded": q_loaded,
            "brain_math_engine": "operational",
            "worldview_count": wv_count,
            "question_count": q_count
        }
    }
    return HTTPStatus.OK, payload


# ============================================================================
# STANDALONE HTTP SERVER & WSGI GATEWAY
# ============================================================================

def make_wsgi_app(
    question_bank: Dict[str, Any],
    worldview_data: Union[Dict[str, Any], List[Dict[str, Any]]]
) -> Callable:
    """
    Creates a standard WSGI application callable for production hosting.
    """
    def wsgi_app(environ: Dict[str, Any], start_response: Callable) -> List[bytes]:
        method = environ.get("REQUEST_METHOD", "GET").upper()
        path = environ.get("PATH_INFO", "/")

        if method == "POST" and path == "/api/evaluate":
            try:
                content_length = int(environ.get("CONTENT_LENGTH", 0))
            except ValueError:
                content_length = 0

            if content_length > MAX_PAYLOAD_BYTES:
                status_code = HTTPStatus.BAD_REQUEST
                resp_data = ApiException(
                    HTTPStatus.BAD_REQUEST,
                    "PAYLOAD_TOO_LARGE",
                    f"Payload size exceeds limit of {MAX_PAYLOAD_BYTES} bytes."
                ).to_dict()
            else:
                try:
                    body = environ["wsgi.input"].read(content_length).decode("utf-8")
                    payload = json.loads(body)
                    status_code, resp_data = handle_evaluate(payload, question_bank, worldview_data)
                except UnicodeDecodeError:
                    status_code = HTTPStatus.BAD_REQUEST
                    resp_data = ApiException(
                        HTTPStatus.BAD_REQUEST,
                        "MALFORMED_JSON",
                        "Payload is not valid UTF-8 text."
                    ).to_dict()
                except json.JSONDecodeError:
                    status_code = HTTPStatus.BAD_REQUEST
                    resp_data = ApiException(
                        HTTPStatus.BAD_REQUEST,
                        "MALFORMED_JSON",
                        "Payload is not valid JSON."
                    ).to_dict()

        elif method == "GET" and path == "/api/metadata":
            status_code, resp_data = handle_metadata(question_bank, worldview_data)
        elif method == "GET" and path == "/api/health":
            status_code, resp_data = handle_health(question_bank, worldview_data)
        else:
            status_code = HTTPStatus.NOT_FOUND
            resp_data = {
                "status": "error",
                "error_code": "ENDPOINT_NOT_FOUND",
                "message": f"Endpoint '{method} {path}' does not exist."
            }

        resp_bytes = json.dumps(resp_data, indent=2).encode("utf-8")
        status_line = f"{status_code} {HTTPStatus(status_code).phrase}"
        headers = [
            ("Content-Type", "application/json; charset=utf-8"),
            ("Content-Length", str(len(resp_bytes))),
            ("Access-Control-Allow-Origin", "*"),
            ("Access-Control-Allow-Headers", "Content-Type, Accept"),
            ("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        ]
        start_response(status_line, headers)
        return [resp_bytes]

    return wsgi_app


class WorldviewApiHandler(BaseHTTPRequestHandler):
    """Standard HTTP server handler for local development, testing, and microservices."""
    question_bank: Dict[str, Any] = {}
    worldview_data: Union[Dict[str, Any], List[Dict[str, Any]]] = {}

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/metadata":
            status_code, resp_data = handle_metadata(self.question_bank, self.worldview_data)
        elif path == "/api/health":
            status_code, resp_data = handle_health(self.question_bank, self.worldview_data)
        else:
            status_code = HTTPStatus.NOT_FOUND
            resp_data = {
                "status": "error",
                "error_code": "ENDPOINT_NOT_FOUND",
                "message": f"Endpoint 'GET {path}' does not exist."
            }

        self._send_json_response(status_code, resp_data)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path != "/api/evaluate":
            self._send_json_response(HTTPStatus.NOT_FOUND, {
                "status": "error",
                "error_code": "ENDPOINT_NOT_FOUND",
                "message": f"Endpoint 'POST {path}' does not exist."
            })
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            content_length = 0

        if content_length > MAX_PAYLOAD_BYTES:
            self._send_json_response(HTTPStatus.BAD_REQUEST, ApiException(
                HTTPStatus.BAD_REQUEST,
                "PAYLOAD_TOO_LARGE",
                f"Payload size exceeds limit of {MAX_PAYLOAD_BYTES} bytes."
            ).to_dict())
            return

        raw_body = self.rfile.read(content_length)
        try:
            body_str = raw_body.decode("utf-8")
            payload = json.loads(body_str)
        except UnicodeDecodeError:
            self._send_json_response(HTTPStatus.BAD_REQUEST, ApiException(
                HTTPStatus.BAD_REQUEST,
                "MALFORMED_JSON",
                "Payload is not valid UTF-8 text."
            ).to_dict())
            return
        except json.JSONDecodeError:
            self._send_json_response(HTTPStatus.BAD_REQUEST, ApiException(
                HTTPStatus.BAD_REQUEST,
                "MALFORMED_JSON",
                "Payload is not valid JSON syntax."
            ).to_dict())
            return

        status_code, resp_data = handle_evaluate(payload, self.question_bank, self.worldview_data)
        self._send_json_response(status_code, resp_data)

    def _send_json_response(self, status_code: int, data: Dict[str, Any]) -> None:
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        # Override to suppress default console noise during automated testing
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Worldview Compass API Server starting on port {port}...")
    server = HTTPServer(("0.0.0.0", port), WorldviewApiHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        server.server_close()
