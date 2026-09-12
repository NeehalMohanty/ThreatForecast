import numpy as np


# =========================================================
# CYBERFORECAST ATTACK PROGRESSION MODEL
# =========================================================

STAGES = [
    "Benign",
    "Reconnaissance",
    "Initial Access",
    "Execution",
    "Privilege Escalation",
    "Lateral Movement",
    "Exfiltration"
]


# =========================================================
# BASE TRANSITION KNOWLEDGE
# =========================================================
#
# These are baseline progression probabilities.
# They are NOT learned from CICIoT23 timestamps.
#
# Behavioural evidence is used later to adjust them.
# =========================================================

TRANSITIONS = {

    "Benign": {
        "Benign": 0.60,
        "Reconnaissance": 0.30,
        "Initial Access": 0.10
    },

    "Reconnaissance": {
        "Reconnaissance": 0.35,
        "Initial Access": 0.45,
        "Execution": 0.20
    },

    "Initial Access": {
        "Initial Access": 0.20,
        "Execution": 0.60,
        "Privilege Escalation": 0.20
    },

    "Execution": {
        "Execution": 0.20,
        "Privilege Escalation": 0.60,
        "Lateral Movement": 0.20
    },

    "Privilege Escalation": {
        "Privilege Escalation": 0.20,
        "Lateral Movement": 0.65,
        "Exfiltration": 0.15
    },

    "Lateral Movement": {
        "Lateral Movement": 0.25,
        "Exfiltration": 0.65,
        "Privilege Escalation": 0.10
    },

    "Exfiltration": {
        "Exfiltration": 0.90,
        "Lateral Movement": 0.10
    }
}


# =========================================================
# PROGRESSION MODEL
# =========================================================

class ProgressionModel:

    def __init__(self):

        self.stages = STAGES

        self.transitions = TRANSITIONS

    # -----------------------------------------------------
    # BASE PROBABILITIES
    # -----------------------------------------------------

    def get_base_probabilities(
        self,
        current_stage
    ):

        probabilities = {
            stage: 0.0
            for stage in self.stages
        }

        if current_stage in self.transitions:

            for stage, probability in (
                self.transitions[
                    current_stage
                ].items()
            ):

                probabilities[
                    stage
                ] = probability

        else:

            probabilities[
                "Benign"
            ] = 1.0

        return probabilities

    # -----------------------------------------------------
    # BEHAVIOURAL ADJUSTMENT
    # -----------------------------------------------------

    def adjust_for_behaviour(
        self,
        probabilities,
        behaviour
    ):

        probabilities = probabilities.copy()

        # ---------------------------------------------
        # Reconnaissance indicators
        # ---------------------------------------------

        port_scans = behaviour.get(
            "port_scans",
            0
        )

        if port_scans >= 10:

            probabilities[
                "Initial Access"
            ] *= 1.5

        # ---------------------------------------------
        # Initial access / authentication indicators
        # ---------------------------------------------

        failed_logins = behaviour.get(
            "failed_logins",
            0
        )

        if failed_logins >= 10:

            probabilities[
                "Initial Access"
            ] *= 1.4

            probabilities[
                "Execution"
            ] *= 1.2

        # ---------------------------------------------
        # Execution indicators
        # ---------------------------------------------

        process_creation = behaviour.get(
            "process_creation",
            0
        )

        if process_creation >= 10:

            probabilities[
                "Execution"
            ] *= 1.5

            probabilities[
                "Privilege Escalation"
            ] *= 1.4

        # ---------------------------------------------
        # Privilege escalation indicators
        # ---------------------------------------------

        privilege_changes = behaviour.get(
            "privilege_changes",
            0
        )

        if privilege_changes >= 5:

            probabilities[
                "Privilege Escalation"
            ] *= 1.7

            probabilities[
                "Lateral Movement"
            ] *= 1.3

        # ---------------------------------------------
        # Lateral movement indicators
        # ---------------------------------------------

        internal_connections = behaviour.get(
            "internal_connections",
            0
        )

        if internal_connections >= 10:

            probabilities[
                "Lateral Movement"
            ] *= 1.6

            probabilities[
                "Exfiltration"
            ] *= 1.2

        # ---------------------------------------------
        # Exfiltration indicators
        # ---------------------------------------------

        outbound_bytes = behaviour.get(
            "outbound_bytes",
            0
        )

        if outbound_bytes >= 10000:

            probabilities[
                "Exfiltration"
            ] *= 1.8

        # ---------------------------------------------
        # Trends
        # ---------------------------------------------

        port_trend = behaviour.get(
            "port_scans_trend",
            0
        )

        if port_trend > 5:

            probabilities[
                "Initial Access"
            ] *= 1.3

        privilege_trend = behaviour.get(
            "privilege_changes_trend",
            0
        )

        if privilege_trend > 2:

            probabilities[
                "Privilege Escalation"
            ] *= 1.3

        connection_trend = behaviour.get(
            "internal_connections_trend",
            0
        )

        if connection_trend > 5:

            probabilities[
                "Lateral Movement"
            ] *= 1.3

        outbound_trend = behaviour.get(
            "outbound_bytes_trend",
            0
        )

        if outbound_trend > 5000:

            probabilities[
                "Exfiltration"
            ] *= 1.4

        return probabilities

    # -----------------------------------------------------
    # NORMALIZE
    # -----------------------------------------------------

    def normalize(
        self,
        probabilities
    ):

        total = sum(
            probabilities.values()
        )

        if total <= 0:

            return {
                stage: 0.0
                for stage in self.stages
            }

        return {
            stage:
                probability / total
            for stage, probability
            in probabilities.items()
        }

    # -----------------------------------------------------
    # FORECAST
    # -----------------------------------------------------

    def forecast(
        self,
        current_stage,
        behaviour
    ):

        probabilities = (
            self.get_base_probabilities(
                current_stage
            )
        )

        probabilities = (
            self.adjust_for_behaviour(
                probabilities,
                behaviour
            )
        )

        probabilities = (
            self.normalize(
                probabilities
            )
        )

        # Don't recommend staying in the
        # same stage when another stage has
        # a stronger probability.

        ranked = sorted(
            probabilities.items(),
            key=lambda x: x[1],
            reverse=True
        )

        next_stage = ranked[0][0]
        confidence = ranked[0][1]

        # Persistence is a valid next state, including benign traffic.

        return {
            "next_stage": next_stage,
            "confidence": confidence,
            "probabilities": probabilities
        }


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("CYBERFORECAST PROGRESSION MODEL")
    print("=" * 60)

    model = ProgressionModel()

    behaviour = {

        "failed_logins": 12,
        "port_scans": 15,
        "process_creation": 8,
        "privilege_changes": 2,
        "internal_connections": 7,
        "outbound_bytes": 3000,

        "port_scans_trend": 8,
        "privilege_changes_trend": 1,
        "internal_connections_trend": 3,
        "outbound_bytes_trend": 1000
    }

    result = model.forecast(
        "Reconnaissance",
        behaviour
    )

    print("\nCurrent stage:")
    print("Reconnaissance")

    print("\nNext predicted stage:")
    print(
        result["next_stage"]
    )

    print("\nConfidence:")
    print(
        f"{result['confidence'] * 100:.2f}%"
    )

    print("\nAll transition probabilities:")

    for stage, probability in sorted(
        result["probabilities"].items(),
        key=lambda x: x[1],
        reverse=True
    ):

        print(
            f"{stage}: "
            f"{probability * 100:.2f}%"
        )

    print("\n" + "=" * 60)
    print("PROGRESSION MODEL TEST COMPLETE")
    print("=" * 60)
