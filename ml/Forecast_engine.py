import joblib
import pandas as pd
import os
import math
from pathlib import Path

from .progression_model import ProgressionModel


# =========================================================
# CYBERFORECAST INTEGRATED FORECAST ENGINE
# =========================================================

class ForecastEngine:

    def __init__(self):

        print("Loading CyberForecast models...")

        # -------------------------------------------------
        # Real-data current-stage classifier
        # -------------------------------------------------

        self.stage_model = joblib.load(
            Path(os.getenv("THREATFORECAST_MODEL_DIR", str(Path(__file__).resolve().parent / "models"))) / "stage_classifier.joblib"
        )

        # -------------------------------------------------
        # Progression / next-stage model
        # -------------------------------------------------

        self.progression_model = ProgressionModel()

        # -------------------------------------------------
        # Features used by the real CICIoT23 classifier
        # -------------------------------------------------

        self.features = [
            "flow_duration",
            "header_length",
            "protocol_type",
            "duration",
            "rate",
            "srate",
            "drate",

            "fin_flag_number",
            "syn_flag_number",
            "rst_flag_number",
            "psh_flag_number",
            "ack_flag_number",
            "ece_flag_number",
            "cwr_flag_number",

            "ack_count",
            "syn_count",
            "fin_count",
            "urg_count",
            "rst_count",

            "http",
            "https",
            "dns",
            "telnet",
            "smtp",
            "ssh",
            "irc",

            "tcp",
            "udp",
            "dhcp",
            "arp",
            "icmp",
            "ipv",
            "llc",

            "tot_sum",
            "min",
            "max",
            "avg",
            "std",

            "tot_size",
            "iat",
            "number",

            # CICIoT23 dataset/model uses this spelling
            "magnitue",

            "radius",
            "covariance",
            "variance",
            "weight"
        ]

        print("Models loaded successfully.")

    # =====================================================
    # PREPARE MODEL FEATURES
    # =====================================================

    def prepare_features(self, data):

        """
        Prepare incoming data for the CICIoT23 stage classifier.

        This method:
        1. Converts input to DataFrame.
        2. Handles magnitude -> magnitue naming difference.
        3. Creates any missing model features with value 0.
        4. Converts everything to numeric values.
        5. Removes NaN and infinite values.
        """

        if not isinstance(data, pd.DataFrame):
            data = pd.DataFrame(data)

        data = data.copy()

        # -------------------------------------------------
        # Fix API / dataset spelling difference
        # -------------------------------------------------

        if "magnitue" not in data.columns:

            if "magnitude" in data.columns:
                data["magnitue"] = data["magnitude"]

            else:
                data["magnitue"] = 0

        # -------------------------------------------------
        # Add any missing classifier features
        # -------------------------------------------------

        for feature in self.features:

            if feature not in data.columns:
                data[feature] = 0

        # -------------------------------------------------
        # Select only features required by trained model
        # -------------------------------------------------

        X = data[self.features].copy()

        # -------------------------------------------------
        # Convert everything to numeric
        # -------------------------------------------------

        X = X.apply(
            pd.to_numeric,
            errors="coerce"
        )

        # -------------------------------------------------
        # Remove infinite values
        # -------------------------------------------------

        X = X.replace(
            [float("inf"), float("-inf")],
            0
        )

        # -------------------------------------------------
        # Replace missing values
        # -------------------------------------------------

        X = X.fillna(0)

        return X

    # =====================================================
    # CURRENT STAGE
    # =====================================================

    def predict_current_stage(self, data):

        # Prepare all 47 CICIoT23 features
        X = self.prepare_features(data)

        # -------------------------------------------------
        # Predict current attack stage
        # -------------------------------------------------

        prediction = self.stage_model.predict(X)[0]

        # -------------------------------------------------
        # Prediction probabilities
        # -------------------------------------------------

        probabilities = self.stage_model.predict_proba(X)[0]

        confidence = max(probabilities)

        return prediction, confidence

    # =====================================================
    # BEHAVIOURAL INDICATORS
    # =====================================================

    def extract_behaviour(self, data):

        if not isinstance(data, pd.DataFrame):
            data = pd.DataFrame(data)

        row = data.iloc[0]

        behaviour = {

            "failed_logins": row.get(
                "failed_logins",
                0
            ),

            "port_scans": row.get(
                "port_scans",
                0
            ),

            "process_creation": row.get(
                "process_creation",
                0
            ),

            "privilege_changes": row.get(
                "privilege_changes",
                0
            ),

            "internal_connections": row.get(
                "internal_connections",
                0
            ),

            "outbound_bytes": row.get(
                "outbound_bytes",
                0
            ),

            "port_scans_trend": row.get(
                "port_scans_trend",
                0
            ),

            "privilege_changes_trend": row.get(
                "privilege_changes_trend",
                0
            ),

            "internal_connections_trend": row.get(
                "internal_connections_trend",
                0
            ),

            "outbound_bytes_trend": row.get(
                "outbound_bytes_trend",
                0
            )
        }

        # -------------------------------------------------
        # Convert behaviour values to numbers
        # -------------------------------------------------

        for key in behaviour:

            try:
                behaviour[key] = float(
                    behaviour[key]
                )

            except (TypeError, ValueError):
                behaviour[key] = 0.0

        return behaviour

    # =====================================================
    # NEXT STAGE
    # =====================================================

    def predict_next_stage(
        self,
        current_stage,
        behaviour
    ):

        result = self.progression_model.forecast(
            current_stage,
            behaviour
        )

        return (
            result["next_stage"],
            result["confidence"],
            result["probabilities"]
        )

    # =====================================================
    # RISK LEVEL
    # =====================================================

    def calculate_risk(
        self,
        current_stage,
        next_stage,
        confidence,
        behaviour
    ):

        # -------------------------------------------------
        # Behaviour severity score
        # -------------------------------------------------

        suspicious_score = 0

        if behaviour.get("failed_logins", 0) >= 10:
            suspicious_score += 1

        if behaviour.get("port_scans", 0) >= 10:
            suspicious_score += 1

        if behaviour.get("process_creation", 0) >= 10:
            suspicious_score += 1

        if behaviour.get("privilege_changes", 0) >= 5:
            suspicious_score += 2

        if behaviour.get("internal_connections", 0) >= 10:
            suspicious_score += 1

        if behaviour.get("outbound_bytes", 0) >= 10000:
            suspicious_score += 2


        # -------------------------------------------------
        # CRITICAL
        # -------------------------------------------------

        if current_stage == "Exfiltration" or next_stage == "Exfiltration":

            return "CRITICAL"


        # Very strong behavioural evidence
        if suspicious_score >= 7:

            return "CRITICAL"


        # -------------------------------------------------
        # HIGH
        # -------------------------------------------------

        high_risk_stages = [
            "Execution",
            "Privilege Escalation",
            "Lateral Movement"
        ]

        if (
            current_stage in high_risk_stages
            or
            next_stage in high_risk_stages
        ):

            return "HIGH"


        # Multiple strong indicators
        if suspicious_score >= 4:

            return "HIGH"


        # -------------------------------------------------
        # MEDIUM
        # -------------------------------------------------

        if suspicious_score >= 2:

            return "MEDIUM"


        if current_stage != "Benign" or next_stage != "Benign":

            return "MEDIUM"


        # -------------------------------------------------
        # LOW
        # -------------------------------------------------

        return "LOW"

    # =====================================================
    # EVIDENCE
    # =====================================================

    def generate_evidence(
        self,
        data
    ):

        if not isinstance(data, pd.DataFrame):
            data = pd.DataFrame(data)

        evidence = []

        row = data.iloc[0]

        # -------------------------------------------------
        # Helper for safe numeric values
        # -------------------------------------------------

        def get_number(name):

            try:
                return float(
                    row.get(name, 0)
                )

            except (TypeError, ValueError):
                return 0.0

        # -------------------------------------------------
        # Failed logins
        # -------------------------------------------------

        failed_logins = get_number(
            "failed_logins"
        )

        if failed_logins >= 10:

            evidence.append(
                "High number of failed login attempts"
            )

        # -------------------------------------------------
        # Port scanning
        # -------------------------------------------------

        port_scans = get_number(
            "port_scans"
        )

        if port_scans >= 10:

            evidence.append(
                "Increased port scanning activity"
            )

        # -------------------------------------------------
        # Process creation
        # -------------------------------------------------

        process_creation = get_number(
            "process_creation"
        )

        if process_creation >= 10:

            evidence.append(
                "High process creation activity"
            )

        # -------------------------------------------------
        # Privilege changes
        # -------------------------------------------------

        privilege_changes = get_number(
            "privilege_changes"
        )

        if privilege_changes >= 5:

            evidence.append(
                "Multiple privilege changes detected"
            )

        # -------------------------------------------------
        # Internal connections
        # -------------------------------------------------

        internal_connections = get_number(
            "internal_connections"
        )

        if internal_connections >= 10:

            evidence.append(
                "Increased internal network connections"
            )

        # -------------------------------------------------
        # Outbound traffic
        # -------------------------------------------------

        outbound_bytes = get_number(
            "outbound_bytes"
        )

        if outbound_bytes >= 10000:

            evidence.append(
                "Large amount of outbound data detected"
            )

        # -------------------------------------------------
        # Default evidence
        # -------------------------------------------------

        if not evidence:

            evidence.append(
                "No strong suspicious indicators detected"
            )

        return evidence

    # =====================================================
    # COMPLETE FORECAST
    # =====================================================

    def forecast(self, data):

        # -------------------------------------------------
        # Convert input to DataFrame
        # -------------------------------------------------

        if not isinstance(
            data,
            pd.DataFrame
        ):

            data = pd.DataFrame(data)

        data = data.copy()

        # -------------------------------------------------
        # Current attack stage
        # -------------------------------------------------

        raw_scores = self.stage_model.predict_proba(self.prepare_features(data))[0]
        current_scores = dict(zip(map(str, self.stage_model.classes_), map(float, raw_scores)))
        current_stage = max(current_scores, key=current_scores.get)
        current_confidence = current_scores[current_stage]

        # -------------------------------------------------
        # Behaviour indicators
        # -------------------------------------------------

        behaviour = self.extract_behaviour(
            data
        )

        # -------------------------------------------------
        # Predict next attack stage
        # -------------------------------------------------

        (
            next_stage,
            next_confidence,
            probabilities
        ) = self.predict_weighted_next_stage(
            current_scores,
            behaviour
        )

        # -------------------------------------------------
        # Calculate overall risk
        # -------------------------------------------------

        risk = self.calculate_risk(
            current_stage,
            next_stage,
            next_confidence,
            behaviour
        )

        # -------------------------------------------------
        # Generate evidence
        # -------------------------------------------------

        evidence = self.generate_evidence(
            data
        )

        # -------------------------------------------------
        # Final response
        # -------------------------------------------------

        return {
            "current_stage_probabilities": {stage: round(score * 100, 2) for stage, score in current_scores.items()},
            "forecast_basis": "Classifier-weighted heuristic transitions",
            "uncertainty": {
                "entropy": round(-sum(p * math.log(p) for p in probabilities.values() if p > 0) / math.log(len(probabilities)), 3),
                "margin": round((sorted(probabilities.values(), reverse=True)[0] - sorted(probabilities.values(), reverse=True)[1]) * 100, 2),
            },

            "current_stage":
                str(current_stage),

            "current_confidence":
                round(
                    float(current_confidence) * 100,
                    2
                ),

            "next_stage":
                str(next_stage),

            "next_confidence":
                round(
                    float(next_confidence) * 100,
                    2
                ),

            "risk":
                risk,

            "evidence":
                evidence,

            "transition_probabilities":
                {
                    str(stage):
                    round(
                        float(probability) * 100,
                        2
                    )

                    for stage, probability
                    in probabilities.items()
                }
        }

    def predict_weighted_next_stage(self, current_scores, behaviour):
        """Marginalize over classifier states instead of treating its argmax as certain.

        These remain heuristic weights; this does not calibrate the classifier or
        establish measured forecasting accuracy.
        """
        probabilities = {stage: 0.0 for stage in self.progression_model.stages}
        for current, weight in current_scores.items():
            forecast = self.progression_model.forecast(current, behaviour)
            for stage, score in forecast['probabilities'].items():
                probabilities[stage] += weight * score
        probabilities = self.progression_model.normalize(probabilities)
        next_stage = max(probabilities, key=probabilities.get)
        return next_stage, probabilities[next_stage], probabilities


# =========================================================
# END-TO-END TEST
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("CYBERFORECAST END-TO-END TEST")
    print("=" * 60)

    # -----------------------------------------------------
    # Realistic CICIoT23-style test record
    # -----------------------------------------------------

    test_data = pd.DataFrame({

        "flow_duration": [2.5],
        "header_length": [54],
        "protocol_type": [6],
        "duration": [64],
        "rate": [25.0],
        "srate": [20.0],
        "drate": [5.0],

        "fin_flag_number": [0],
        "syn_flag_number": [1],
        "rst_flag_number": [0],
        "psh_flag_number": [1],
        "ack_flag_number": [1],
        "ece_flag_number": [0],
        "cwr_flag_number": [0],

        "ack_count": [2],
        "syn_count": [3],
        "fin_count": [0],
        "urg_count": [0],
        "rst_count": [0],

        "http": [0],
        "https": [1],
        "dns": [0],
        "telnet": [0],
        "smtp": [0],
        "ssh": [1],
        "irc": [0],

        "tcp": [1],
        "udp": [0],
        "dhcp": [0],
        "arp": [0],
        "icmp": [0],
        "ipv": [1],
        "llc": [0],

        "tot_sum": [1000],
        "min": [40],
        "max": [500],
        "avg": [180],
        "std": [50],

        "tot_size": [1200],
        "iat": [0.5],
        "number": [10],

        # API-friendly spelling.
        # prepare_features() converts this to "magnitue".
        "magnitude": [20],

        "radius": [15],
        "covariance": [5],
        "variance": [25],
        "weight": [1],

        # -------------------------------------------------
        # Behavioural indicators
        # -------------------------------------------------

        "failed_logins": [12],
        "port_scans": [15],
        "process_creation": [3],
        "privilege_changes": [0],
        "internal_connections": [5],
        "outbound_bytes": [1000],

        "port_scans_trend": [8],
        "privilege_changes_trend": [0],
        "internal_connections_trend": [2],
        "outbound_bytes_trend": [500]
    })

    # -----------------------------------------------------
    # Start Forecast Engine
    # -----------------------------------------------------

    engine = ForecastEngine()

    result = engine.forecast(
        test_data
    )

    # -----------------------------------------------------
    # Display result
    # -----------------------------------------------------

    print("\nCURRENT STAGE:")

    print(
        f"{result['current_stage']} "
        f"({result['current_confidence']}%)"
    )

    print("\nNEXT LIKELY STAGE:")

    print(
        f"{result['next_stage']} "
        f"({result['next_confidence']}%)"
    )

    print("\nRISK:")

    print(
        result["risk"]
    )

    print("\nEVIDENCE:")

    for item in result["evidence"]:

        print(
            f"• {item}"
        )

    print("\nTRANSITION PROBABILITIES:")

    for stage, probability in sorted(
        result[
            "transition_probabilities"
        ].items(),
        key=lambda x: x[1],
        reverse=True
    ):

        print(
            f"{stage}: "
            f"{probability}%"
        )

    print("\n" + "=" * 60)
    print("END-TO-END TEST COMPLETE")
    print("=" * 60)
