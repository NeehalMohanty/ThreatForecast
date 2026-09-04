import pandas as pd
import numpy as np
import os


# =========================================================
# CONFIGURATION
# =========================================================

OUTPUT_FILE = "data/processed/attack_progression_sequences.csv"

RANDOM_SEED = 42

SEQUENCES_PER_STAGE = 1000


# =========================================================
# ATTACK PROGRESSION
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
# SIMULATED BEHAVIOUR PROFILES
# =========================================================

PROFILES = {

    "Benign": {
        "failed_logins": (1, 2),
        "port_scans": (0, 2),
        "process_creation": (1, 3),
        "privilege_changes": (0, 1),
        "internal_connections": (1, 4),
        "outbound_bytes": (100, 1000)
    },

    "Reconnaissance": {
        "failed_logins": (1, 5),
        "port_scans": (8, 20),
        "process_creation": (1, 4),
        "privilege_changes": (0, 1),
        "internal_connections": (3, 8),
        "outbound_bytes": (100, 1500)
    },

    "Initial Access": {
        "failed_logins": (5, 20),
        "port_scans": (3, 12),
        "process_creation": (2, 8),
        "privilege_changes": (0, 2),
        "internal_connections": (3, 10),
        "outbound_bytes": (200, 2500)
    },

    "Execution": {
        "failed_logins": (2, 15),
        "port_scans": (1, 8),
        "process_creation": (10, 30),
        "privilege_changes": (1, 5),
        "internal_connections": (5, 15),
        "outbound_bytes": (500, 5000)
    },

    "Privilege Escalation": {
        "failed_logins": (2, 10),
        "port_scans": (1, 5),
        "process_creation": (8, 25),
        "privilege_changes": (8, 20),
        "internal_connections": (5, 15),
        "outbound_bytes": (500, 6000)
    },

    "Lateral Movement": {
        "failed_logins": (5, 20),
        "port_scans": (3, 15),
        "process_creation": (8, 25),
        "privilege_changes": (3, 12),
        "internal_connections": (15, 40),
        "outbound_bytes": (1000, 10000)
    },

    "Exfiltration": {
        "failed_logins": (1, 10),
        "port_scans": (1, 8),
        "process_creation": (5, 20),
        "privilege_changes": (2, 10),
        "internal_connections": (10, 30),
        "outbound_bytes": (10000, 50000)
    }
}


# =========================================================
# GENERATE BEHAVIOUR
# =========================================================

def generate_behaviour(stage, rng):

    profile = PROFILES[stage]

    return {
        feature: rng.uniform(
            low,
            high
        )
        for feature, (low, high)
        in profile.items()
    }


# =========================================================
# BUILD TEMPORAL SEQUENCES
# =========================================================

def build_sequences():

    print("=" * 60)
    print("CYBERFORECAST TEMPORAL SEQUENCE BUILDER")
    print("=" * 60)

    rng = np.random.default_rng(
        RANDOM_SEED
    )

    rows = []

    sequence_id = 0

    print("\nCreating attack progression scenarios...")

    for _ in range(SEQUENCES_PER_STAGE):

        # -------------------------------------------------
        # Create a progression
        # -------------------------------------------------

        progression = STAGES.copy()

        # Each stage becomes one observation.
        #
        # Example:
        #
        # t1 → Benign
        # t2 → Reconnaissance
        # t3 → Initial Access
        # t4 → Execution
        # t5 → Privilege Escalation
        # t6 → Lateral Movement
        # t7 → Exfiltration

        for index, stage in enumerate(
            progression
        ):

            behaviour = generate_behaviour(
                stage,
                rng
            )

            row = {
                "sequence_id": sequence_id,
                "time_step": index,
                "current_stage": stage,
                "next_stage": (
                    progression[index + 1]
                    if index + 1 < len(progression)
                    else "Completed"
                )
            }

            row.update(
                behaviour
            )

            rows.append(row)

        sequence_id += 1

    df = pd.DataFrame(rows)

    # -----------------------------------------------------
    # Add trend features
    # -----------------------------------------------------

    print("\nCalculating behavioural trends...")

    trend_features = [
        "failed_logins",
        "port_scans",
        "process_creation",
        "privilege_changes",
        "internal_connections",
        "outbound_bytes"
    ]

    for feature in trend_features:

        df[f"{feature}_trend"] = (
            df.groupby("sequence_id")[feature]
            .diff()
            .fillna(0)
        )

    return df


# =========================================================
# SAVE
# =========================================================

def save_sequences(df):

    os.makedirs(
        os.path.dirname(OUTPUT_FILE),
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nSaved sequences to:"
    )

    print(
        OUTPUT_FILE
    )

    print(
        f"Total observations: {len(df):,}"
    )


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    df = build_sequences()

    print("\nCurrent-stage distribution:")

    print(
        df["current_stage"].value_counts()
    )

    print("\nNext-stage distribution:")

    print(
        df["next_stage"].value_counts()
    )

    save_sequences(df)

    print("\n" + "=" * 60)
    print("TEMPORAL SEQUENCE BUILDING COMPLETE")
    print("=" * 60)