import logging
import json
from uuid import UUID
from typing import Annotated, Literal
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from .schemas import NetworkTrafficInput, PredictionResponse, BatchPredictionInput
from .services import predict_network_attack, get_engine_status
from . import storage
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check():
    status = get_engine_status()
    return {"status": "healthy" if status["ready"] else "degraded", "model_status": status["model_status"]}

@router.get("/ready")
def ready():
    if not get_engine_status()["ready"]:
        raise HTTPException(503, "Classifier unavailable")
    return {"ready": True}

@router.get("/api/info")
def api_information():
    return {"name": "ThreatForecast", "version": "2.1.0", "problem_statement": "SIH26153"}

@router.get("/system/status")
def system_status():
    status = get_engine_status()
    return {"system": "ThreatForecast", "backend": {"status": "online", "version": "2.1.0"},
            "ml_engine": status, "prediction_service": {"status": "available" if status["ready"] else "unavailable"},
            "overall_status": "operational" if status["ready"] else "degraded"}

@router.get("/forecast/summary")
def forecast_summary():
    status = get_engine_status()
    return {"system_status": "ready" if status["ready"] else "degraded", "model_status": status["model_status"],
            "prediction_ready": status["ready"], "forecast_method": status["forecast_method"],
            "message": "Traffic classifier with classifier-weighted heuristic progression; no calibrated lead-time estimate."}

@router.post("/predict", response_model=PredictionResponse)
def predict(data: NetworkTrafficInput):
    try:
        return predict_network_attack(data)
    except RuntimeError as error:
        raise HTTPException(503, "Classifier unavailable; check server configuration.") from error
    except Exception as error:
        logger.exception("Inference failed")
        raise HTTPException(500, "Prediction failed; check server logs.") from error

@router.post("/predict/batch")
def predict_batch(data: BatchPredictionInput):
    results = [predict(record) for record in data.network_data]
    attacks = sum(result["predicted_attack"] for result in results)
    return {"summary": {"submitted_records": len(results), "successful_predictions": len(results),
                        "failed_predictions": 0, "detected_attacks": attacks,
                        "attack_rate": round(100 * attacks / len(results), 2),
                        "average_risk_score": round(sum(r["risk_score"] for r in results) / len(results), 2)},
            "predictions": [{"index": i, "status": "success", "prediction": r} for i, r in enumerate(results)]}

class AnalysisInput(BatchPredictionInput):
    source: Literal["synthetic_demo", "imported_telemetry"] = "imported_telemetry"

@router.post("/analyses", status_code=201)
def analyse(data: AnalysisInput):
    return storage.save(data.source, predict_batch(data))

@router.get("/analyses")
def analyses(limit: Annotated[int, Query(ge=1, le=100)] = 50):
    return {"analyses": storage.recent(limit)}


@router.get('/analyses/{record_id}/export')
def export_analysis(record_id: UUID):
    record = storage.find(str(record_id))
    if record is None:
        raise HTTPException(404, 'Analysis not found or expired')
    return Response(json.dumps(record, indent=2), media_type='application/json',
                    headers={'Content-Disposition': f'attachment; filename="threatforecast-{record_id}.json"'})
