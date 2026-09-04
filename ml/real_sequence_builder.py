import os
import pandas as pd
import numpy as np


INPUT_FILE = "data/processed/ciciot23_train_processed.csv"
OUTPUT_FILE = "data/processed/real_temporal_sequences.csv"

WINDOW_SIZE = 20
STEP_SIZE = 10


# =========================================================
# CICIoT23 → CYBERFORECAST STAGE MAPPING
# =========================================================

STAGE_MAP = {
    "Benign": "Benign",
    "Reconnaissance": "Reconnaissance",
    "Initial Access": "Initial Access",
    "Execution": "Execution",
    "Lateral Movement": "Lateral Movement",
    "Privilege Escalation": "Privilege Escalation",
    "Exfiltration": "Exfiltration",
    "Other": "Execution"
}


# =========================================================
# MAIN
# =========================================================

def main():

    print("=" * 65)
    print("CYBERFORECAST REAL-DATA TEMPORAL BUILDER")
    print("=" * 65)

    print("\nLoading CICIoT23 processed dataset...")

    df = pd.read_csv(INPUT_FILE)

    print(
        f"Rows loaded: {len(df):,}"
    )

    # -----------------------------------------------------
    # Check stage column
    # -----------------------------------------------------

    if "attack_category" not in df.columns:

        print(
            "\nERROR: attack_category column not found."
        )

        print(
            "\nAvailable columns:"
        )

        print(
            df.columns.tolist()
        )

        return

    # -----------------------------------------------------
    # Map attack categories to CyberForecast stages
    # -----------------------------------------------------

    df["stage"] = (
        df["attack_category"]
        .map(STAGE_MAP)
        .fillna("Other")
    )

    print("\nStage distribution:")

    print(
        df["stage"].value_counts()
    )

    # =====================================================
    # DERIVE BEHAVIOURAL FEATURES FROM REAL NETWORK DATA
    # =====================================================

    print(
        "\nDeriving behavioural indicators..."
    )

    # Helper function
    def numeric_column(
        name,
        default=0
    ):

        if name in df.columns:

            return pd.to_numeric(
                df[name],
                errors="coerce"
            ).fillna(0)

        return pd.Series(
            default,
            index=df.index,
            dtype=float
        )

    # -----------------------------------------------------
    # Failed login proxy
    # -----------------------------------------------------

    df["failed_logins"] = (
        numeric_column("syn_flag_number")
        +
        numeric_column("rst_flag_number")
    )

    # -----------------------------------------------------
    # Port scanning proxy
    # -----------------------------------------------------

    df["port_scans"] = (
        numeric_column("Number")
        +
        numeric_column("Rate")
    )

    # -----------------------------------------------------
    # Process creation proxy
    # -----------------------------------------------------

    df["process_creation"] = (
        numeric_column("Srate")
        +
        numeric_column("Drate")
    )

    # -----------------------------------------------------
    # Privilege-change proxy
    # -----------------------------------------------------

    df["privilege_changes"] = (
        numeric_column("SSH")
        +
        numeric_column("Telnet")
    )

    # -----------------------------------------------------
    # Internal connection proxy
    # -----------------------------------------------------

    df["internal_connections"] = (
        numeric_column("TCP")
        +
        numeric_column("UDP")
        +
        numeric_column("ICMP")
    )

    # -----------------------------------------------------
    # Outbound data proxy
    # -----------------------------------------------------

    df["outbound_bytes"] = (
        numeric_column("Tot size")
        +
        numeric_column("Tot sum")
    )

    behaviour_features = [
        "failed_logins",
        "port_scans",
        "process_creation",
        "privilege_changes",
        "internal_connections",
        "outbound_bytes"
    ]

    # -----------------------------------------------------
    # Clean numerical values
    # -----------------------------------------------------

    for feature in behaviour_features:

        df[feature] = (
            df[feature]
            .replace(
                [np.inf, -np.inf],
                np.nan
            )
            .fillna(0)
        )

    print(
        "\nBehaviour indicators created:"
    )

    for feature in behaviour_features:

        print(
            f"  ✓ {feature}"
        )

    # =====================================================
    # BALANCED SAMPLE
    # =====================================================

    samples_per_stage = 5000

    parts = []

    for stage in df["stage"].unique():

        subset = df[
            df["stage"] == stage
        ]

        if len(subset) > samples_per_stage:

            subset = subset.sample(
                n=samples_per_stage,
                random_state=42
            )

        parts.append(
            subset
        )

    df = pd.concat(
        parts,
        ignore_index=True
    )

    print(
        f"\nRows used for temporal experiment: "
        f"{len(df):,}"
    )

    # =====================================================
    # BUILD TEMPORAL WINDOWS
    # =====================================================

    print(
        "\nBuilding temporal windows..."
    )

    sequences = []

    sequence_id = 0

    for start in range(
        0,
        len(df) - (WINDOW_SIZE * 2),
        STEP_SIZE
    ):

        current_window = df.iloc[
            start:
            start + WINDOW_SIZE
        ]

        next_window = df.iloc[
            start + WINDOW_SIZE:
            start + (WINDOW_SIZE * 2)
        ]

        if (
            len(current_window)
            < WINDOW_SIZE
            or
            len(next_window)
            < WINDOW_SIZE
        ):

            continue

        current_stage = (
            current_window["stage"]
            .mode()[0]
        )

        next_stage = (
            next_window["stage"]
            .mode()[0]
        )

        # -------------------------------------------------
        # We only want actual transitions
        # -------------------------------------------------

        if current_stage == next_stage:

            continue

        row = {

            "sequence_id":
                sequence_id,

            "current_stage":
                current_stage,

            "next_stage":
                next_stage
        }

        # -------------------------------------------------
        # Behaviour statistics
        # -------------------------------------------------

        for feature in behaviour_features:

            values = (
                current_window[
                    feature
                ].values
            )

            row[feature] = float(
                np.mean(values)
            )

            row[
                feature + "_trend"
            ] = float(
                values[-1]
                -
                values[0]
            )

        sequences.append(
            row
        )

        sequence_id += 1

    result = pd.DataFrame(
        sequences
    )

    # =====================================================
    # RESULTS
    # =====================================================

    print(
        f"\nTransition windows created: "
        f"{len(result):,}"
    )

    if len(result) == 0:

        print(
            "\nWARNING: No stage transitions were found."
        )

        print(
            "The dataset does not contain a reliable "
            "attack timeline for this experiment."
        )

        return

    print(
        "\nCurrent → Next transitions:"
    )

    print(
        result[
            [
                "current_stage",
                "next_stage"
            ]
        ].value_counts()
    )

    # =====================================================
    # SAVE
    # =====================================================

    os.makedirs(
        "data/processed",
        exist_ok=True
    )

    result.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        "\nSaved to:"
    )

    print(
        OUTPUT_FILE
    )

    print(
        "\n" + "=" * 65
    )

    print(
        "REAL TEMPORAL BUILD COMPLETE"
    )

    print(
        "=" * 65
    )


if __name__ == "__main__":

    main()