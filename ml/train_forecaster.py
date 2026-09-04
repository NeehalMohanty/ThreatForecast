import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


INPUT_FILE = "data/processed/attack_progression_sequences.csv"
MODEL_DIR = "ml/models"
OUTPUT_MODEL = os.path.join(MODEL_DIR, "forecaster.joblib")


FEATURES = [
    "failed_logins",
    "port_scans",
    "process_creation",
    "privilege_changes",
    "internal_connections",
    "outbound_bytes",
    "failed_logins_trend",
    "port_scans_trend",
    "process_creation_trend",
    "privilege_changes_trend",
    "internal_connections_trend",
    "outbound_bytes_trend"
]


def main():

    print("=" * 60)
    print("CYBERFORECAST TEMPORAL FORECASTER")
    print("=" * 60)

    df = pd.read_csv(INPUT_FILE)

    print(f"\nRows loaded: {len(df):,}")

    # Remove final "Completed" target because it is not an attack stage
    df = df[df["next_stage"] != "Completed"].copy()

    # -----------------------------------------------------
    # Encode current stage
    # -----------------------------------------------------

    current_stage = pd.get_dummies(
        df["current_stage"],
        prefix="current_stage",
        dtype=int
    )

    X = df[FEATURES].copy()

    X = pd.concat(
        [X, current_stage],
        axis=1
    )

    y = df["next_stage"]

    X = X.fillna(0)

    # -----------------------------------------------------
    # IMPORTANT:
    # Split by SEQUENCE ID, not individual rows.
    #
    # This prevents observations from the same attack
    # progression appearing in both training and testing.
    # -----------------------------------------------------

    sequence_ids = df["sequence_id"].unique()

    split = int(len(sequence_ids) * 0.8)

    train_ids = sequence_ids[:split]
    test_ids = sequence_ids[split:]

    train_mask = df["sequence_id"].isin(train_ids)
    test_mask = df["sequence_id"].isin(test_ids)

    X_train = X[train_mask]
    X_test = X[test_mask]

    y_train = y[train_mask]
    y_test = y[test_mask]

    print(f"Training observations: {len(X_train):,}")
    print(f"Testing observations: {len(X_test):,}")

    print("\nTraining forecasting model...")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )

    print("\nForecasting model trained.")

    # -----------------------------------------------------
    # Evaluation
    # -----------------------------------------------------

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    print("\n" + "=" * 60)
    print("FORECASTING EVALUATION")
    print("=" * 60)

    print(
        f"\nAccuracy: {accuracy:.2%}"
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    package = {
        "model": model,
        "features": X.columns.tolist()
    }

    joblib.dump(
        package,
        OUTPUT_MODEL
    )

    print("\nForecaster saved to:")
    print(OUTPUT_MODEL)

    print("\n" + "=" * 60)
    print("FORECASTER TRAINING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()