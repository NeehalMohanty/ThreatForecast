import pandas as pd

from ml.Forecast_engine import ForecastEngine


# =========================================================
# LOAD CYBERFORECAST ENGINE
# =========================================================

engine = None
engine_load_error = None


try:

    engine = ForecastEngine()

    print(
        "CyberForecast prediction engine ready."
    )

except Exception as error:

    engine_load_error = str(error)

    print(
        "Failed to load CyberForecast engine:"
    )

    print(error)


# =========================================================
# ENGINE STATUS
# =========================================================

def get_engine_status():

    if engine is not None:

        return {
            "ready": True,
            "status": "ready",
            "model_status": "loaded",
            "error": None
        }


    return {
        "ready": False,
        "status": "unavailable",
        "model_status": "failed",
        "error": engine_load_error
    }


# =========================================================
# RISK SCORE
# =========================================================

def calculate_risk_score(
    risk,
    confidence
):

    confidence = float(
        confidence or 0
    )


    if risk == "CRITICAL":
        return 90.0


    if risk == "HIGH":
        return 75.0


    if risk == "MEDIUM":
        return 50.0


    # LOW risk uses model confidence
    # instead of a fixed category score.

    return round(
        confidence,
        2
    )


# =========================================================
# RECOMMENDED ACTION
# =========================================================

def get_recommended_action(
    risk
):

    if risk == "CRITICAL":

        return (
            "Immediately investigate the affected "
            "host, isolate suspicious systems, "
            "inspect possible exfiltration activity "
            "and preserve logs for incident response."
        )


    if risk == "HIGH":

        return (
            "Investigate the detected activity, "
            "review affected hosts and monitor "
            "for further attack progression."
        )


    if risk == "MEDIUM":

        return (
            "Increase monitoring and inspect "
            "the detected behavioural indicators "
            "for suspicious activity."
        )


    return (
        "Continue normal monitoring. "
        "No immediate response is required."
    )


# =========================================================
# PREDICT NETWORK ATTACK
# =========================================================

def predict_network_attack(
    data
):

    # -----------------------------------------------------
    # ENGINE AVAILABILITY
    # -----------------------------------------------------

    if engine is None:

        raise RuntimeError(
            "CyberForecast ML engine is unavailable. "
            f"{engine_load_error or ''}"
        )


    try:

        # -------------------------------------------------
        # CONVERT PYDANTIC INPUT TO DICTIONARY
        # -------------------------------------------------

        telemetry = (
            data.model_dump()
            if hasattr(
                data,
                "model_dump"
            )
            else dict(data)
        )


        # -------------------------------------------------
        # BUILD DATAFRAME
        # -------------------------------------------------

        dataframe = pd.DataFrame(
            [telemetry]
        )


        # -------------------------------------------------
        # RUN ML + PROGRESSION ENGINE
        # -------------------------------------------------

        result = engine.forecast(
            dataframe
        )


        # -------------------------------------------------
        # CURRENT ATTACK STATUS
        # -------------------------------------------------

        current_stage = str(
            result.get(
                "current_stage",
                "Benign"
            )
        )


        current_confidence = float(
            result.get(
                "current_confidence",
                0
            )
        )


        next_stage = str(
            result.get(
                "next_stage",
                "Benign"
            )
        )


        next_confidence = float(
            result.get(
                "next_confidence",
                0
            )
        )


        risk = str(
            result.get(
                "risk",
                "LOW"
            )
        ).upper()


        evidence = result.get(
            "evidence",
            []
        )


        transition_probabilities = (
            result.get(
                "transition_probabilities",
                {}
            )
        )


        # -------------------------------------------------
        # NORMALIZE TRANSITION VALUES
        # -------------------------------------------------

        normalized_probabilities = {}


        for (
            stage,
            probability
        ) in transition_probabilities.items():

            normalized_probabilities[
                str(stage)
            ] = float(
                probability
            )


        # -------------------------------------------------
        # ATTACK BOOLEAN
        # -------------------------------------------------

        predicted_attack = (
            current_stage != "Benign"
        )


        predicted_attack_type = (
            current_stage
            if predicted_attack
            else None
        )


        # -------------------------------------------------
        # RISK SCORE
        # -------------------------------------------------

        risk_score = (
            calculate_risk_score(
                risk,
                next_confidence
            )
        )


        # -------------------------------------------------
        # ACTION
        # -------------------------------------------------

        recommended_action = (
            get_recommended_action(
                risk
            )
        )


        # -------------------------------------------------
        # FINAL API RESPONSE
        # -------------------------------------------------

        return {

            "current_stage":
                current_stage,

            "current_confidence":
                current_confidence,

            "next_stage":
                next_stage,

            "next_confidence":
                next_confidence,

            "risk":
                risk,

            "evidence":
                [
                    str(item)
                    for item in evidence
                ],

            "transition_probabilities":
                normalized_probabilities,

            "predicted_attack":
                predicted_attack,

            "predicted_attack_type":
                predicted_attack_type,

            "risk_score":
                risk_score,

            "forecast_window":
                "Next likely attack stage",

            "recommended_action":
                recommended_action
        }


    except Exception as error:

        print(
            "Prediction service error:"
        )

        print(error)


        raise RuntimeError(
            "CyberForecast prediction failed: "
            f"{error}"
        )