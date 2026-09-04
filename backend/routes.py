from typing import List

from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import BaseModel

from .schemas import (
    NetworkTrafficInput,
    PredictionResponse
)

from .services import (
    predict_network_attack,
    get_engine_status
)


router = APIRouter()


# =========================================================
# BATCH REQUEST MODEL
# =========================================================

class BatchPredictionRequest(
    BaseModel
):

    network_data: List[
        NetworkTrafficInput
    ]


# =========================================================
# ROOT API INFORMATION
# =========================================================

@router.get(
    "/api/info"
)
def api_information():

    return {
        "name": "CyberForecast API",
        "version": "1.0.0",
        "description": (
            "AI-driven cyberattack "
            "progression forecasting "
            "and early warning system"
        ),
        "status": "running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@router.get(
    "/health"
)
def health_check():

    engine_status = (
        get_engine_status()
    )


    return {
        "status": (
            "healthy"
            if engine_status[
                "ready"
            ]
            else "degraded"
        ),

        "service":
            "CyberForecast Backend",

        "model_status":
            engine_status[
                "model_status"
            ]
    }


# =========================================================
# COMPLETE SYSTEM STATUS
# =========================================================

@router.get(
    "/system/status"
)
def system_status():

    engine_status = (
        get_engine_status()
    )


    system_ready = (
        engine_status[
            "ready"
        ]
    )


    return {

        "system":
            "CyberForecast",

        "backend": {
            "status":
                "online",

            "api":
                "FastAPI",

            "version":
                "1.0.0"
        },

        "ml_engine": {
            "status":
                engine_status[
                    "status"
                ],

            "model_status":
                engine_status[
                    "model_status"
                ],

            "ready":
                engine_status[
                    "ready"
                ]
        },

        "prediction_service": {
            "status":
                (
                    "available"
                    if system_ready
                    else "unavailable"
                )
        },

        "overall_status":
            (
                "operational"
                if system_ready
                else "degraded"
            )
    }


# =========================================================
# SINGLE PREDICTION
# =========================================================

@router.post(
    "/predict",
    response_model=PredictionResponse
)
def predict(
    data: NetworkTrafficInput
):

    try:

        return (
            predict_network_attack(
                data
            )
        )


    except RuntimeError as error:

        raise HTTPException(
            status_code=503,
            detail=str(error)
        )


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected prediction "
                f"error: {error}"
            )
        )


# =========================================================
# BATCH PREDICTION
# =========================================================

@router.post(
    "/predict/batch"
)
def predict_batch(
    data: BatchPredictionRequest
):

    network_data = (
        data.network_data
    )


    # -----------------------------------------------------
    # EMPTY BATCH PROTECTION
    # -----------------------------------------------------

    if not network_data:

        raise HTTPException(
            status_code=400,
            detail=(
                "network_data must contain "
                "at least one telemetry record."
            )
        )


    predictions = []


    attack_count = 0

    total_risk_score = 0.0


    # -----------------------------------------------------
    # RUN EACH PREDICTION
    # -----------------------------------------------------

    for index, record in enumerate(
        network_data
    ):

        try:

            result = (
                predict_network_attack(
                    record
                )
            )


            predictions.append(
                {
                    "index":
                        index,

                    "status":
                        "success",

                    "prediction":
                        result
                }
            )


            if result.get(
                "predicted_attack",
                False
            ):

                attack_count += 1


            total_risk_score += float(
                result.get(
                    "risk_score",
                    0
                )
            )


        except Exception as error:

            predictions.append(
                {
                    "index":
                        index,

                    "status":
                        "failed",

                    "error":
                        str(error)
                }
            )


    # -----------------------------------------------------
    # SUCCESSFUL PREDICTIONS
    # -----------------------------------------------------

    successful_predictions = [
        prediction

        for prediction in predictions

        if prediction[
            "status"
        ] == "success"
    ]


    success_count = len(
        successful_predictions
    )


    failed_count = (
        len(network_data) -
        success_count
    )


    # -----------------------------------------------------
    # SAFE AVERAGE
    # -----------------------------------------------------

    average_risk = (

        round(
            total_risk_score /
            success_count,
            2
        )

        if success_count > 0

        else 0.0

    )


    # -----------------------------------------------------
    # ATTACK RATE
    # -----------------------------------------------------

    attack_rate = (

        round(
            (
                attack_count /
                success_count
            ) * 100,
            2
        )

        if success_count > 0

        else 0.0

    )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "summary": {

            "submitted_records":
                len(
                    network_data
                ),

            "successful_predictions":
                success_count,

            "failed_predictions":
                failed_count,

            "detected_attacks":
                attack_count,

            "attack_rate":
                attack_rate,

            "average_risk_score":
                average_risk
        },

        "predictions":
            predictions
    }


# =========================================================
# FORECAST SUMMARY
# =========================================================

@router.get(
    "/forecast/summary"
)
def forecast_summary():

    engine_status = (
        get_engine_status()
    )


    if not engine_status[
        "ready"
    ]:

        return {

            "system_status":
                "degraded",

            "model_status":
                "unavailable",

            "prediction_ready":
                False,

            "message":
                (
                    "CyberForecast backend "
                    "is online but the ML "
                    "engine is unavailable."
                ),

            "prediction_endpoint":
                "/predict",

            "batch_endpoint":
                "/predict/batch",

            "system_endpoint":
                "/system/status"
        }


    return {

        "system_status":
            "monitoring",

        "model_status":
            "real_ml_model",

        "prediction_ready":
            True,

        "capabilities": [

            "Current attack stage classification",

            "Next attack stage prediction",

            "Behaviour-based risk assessment",

            "Attack progression probability",

            "Evidence generation",

            "Recommended response generation",

            "Single traffic prediction",

            "Batch traffic prediction"
        ],

        "prediction_endpoint":
            "/predict",

        "batch_endpoint":
            "/predict/batch",

        "system_endpoint":
            "/system/status",

        "message":
            (
                "CyberForecast prediction "
                "engine is operational and "
                "ready to analyse telemetry."
            )
    }