import logging
import pandas as pd
from ml.Forecast_engine import ForecastEngine
logger = logging.getLogger(__name__)
engine = None
engine_load_error = None

def load_engine():
    global engine, engine_load_error
    try:
        engine = ForecastEngine()
        engine_load_error = None
    except Exception:
        engine = None
        engine_load_error = "Classifier unavailable; check server logs and model directory."
        logger.exception("Could not load classifier")

def get_engine_status():
    return {"ready": engine is not None, "status": "ready" if engine else "unavailable",
            "model_status": "loaded" if engine else "failed", "error": engine_load_error,
            "forecast_method": "heuristic_transition_rules", "calibrated": False}

def calculate_risk_score(risk, confidence=0):
    # Severity index, not a probability of attack.
    return {"LOW": 20.0, "MEDIUM": 50.0, "HIGH": 75.0, "CRITICAL": 90.0}[risk]

def get_recommended_action(risk):
    return {
        "LOW": "Continue monitoring and validate the telemetry source.",
        "MEDIUM": "Review authentication and network logs for the affected asset.",
        "HIGH": "Investigate the affected host and review access, processes and internal connections.",
        "CRITICAL": "Investigate urgently, preserve logs and consider containment after analyst review.",
    }[risk]

def predict_network_attack(data):
    if engine is None:
        raise RuntimeError(engine_load_error or "Classifier unavailable")
    telemetry = data.model_dump() if hasattr(data, "model_dump") else dict(data)
    result = engine.forecast(pd.DataFrame([telemetry]))
    missing = sorted(set(engine.features) - set(getattr(data, "model_fields_set", telemetry)))
    return {**result, "predicted_attack": result["current_stage"] != "Benign",
            "data_quality": {"supplied_features": len(engine.features) - len(missing),
                             "expected_features": len(engine.features),
                             "coverage_percent": round(100 * (len(engine.features) - len(missing)) / len(engine.features), 1)},
            "predicted_attack_type": result["current_stage"] if result["current_stage"] != "Benign" else None,
            "risk_score": calculate_risk_score(result["risk"]),
            "forecast_window": "Next observation; elapsed time is not estimated",
            "recommended_action": get_recommended_action(result["risk"]),
            "forecast_method": "heuristic_transition_rules", "calibrated": False,
            "missing_features": missing,
            "warnings": ([f"{len(missing)} classifier features were omitted and filled with zero."] if missing else []) +
                        (["The top two next-stage scores are within 10 points; consider both alternatives."] if result['uncertainty']['margin'] < 10 else []) +
                        (["Classifier confidence is below 60%; review the input before acting."] if result['current_confidence'] < 60 else []) +
                        ["Stage labels are dataset proxies. Transition scores are uncalibrated rules, not measured future attack probabilities."]}
