import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# =========================================================
# CONFIGURATION
# =========================================================

INPUT_FILE = "data/processed/ciciot23_train_processed.csv"

MODEL_DIR = "ml/models"

MAX_ROWS_PER_CLASS = 10000

FEATURES = [
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
    "magnitue",
    "radius",
    "covariance",
    "variance",
    "weight"
]

TARGET = "attack_category"


# =========================================================
# LOAD BALANCED SAMPLE
# =========================================================

def load_data():

    print("=" * 60)
    print("LOADING REAL CICIoT23 DATA")
    print("=" * 60)

    print("\nReading dataset...")

    df = pd.read_csv(INPUT_FILE)

    print(f"Total rows available: {len(df):,}")

    print("\nOriginal class distribution:")
    print(df[TARGET].value_counts())

    # -----------------------------------------------------
    # Remove categories we don't want for the first model
    # -----------------------------------------------------

    valid_categories = [
        "Benign",
        "Reconnaissance",
        "Initial Access",
        "Execution",
        "Lateral Movement"
    ]

    df = df[
        df[TARGET].isin(valid_categories)
    ].copy()

    # -----------------------------------------------------
    # Balanced sampling
    # -----------------------------------------------------

    print("\nCreating balanced training sample...")

    sampled_groups = []

    for category in valid_categories:

        category_data = df[
            df[TARGET] == category
        ]

        if len(category_data) > MAX_ROWS_PER_CLASS:

            category_data = category_data.sample(
                n=MAX_ROWS_PER_CLASS,
                random_state=42
            )

        sampled_groups.append(category_data)

        print(
            f"{category}: "
            f"{len(category_data):,} rows"
        )

    balanced_df = pd.concat(
        sampled_groups,
        ignore_index=True
    )

    # Shuffle everything
    balanced_df = balanced_df.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    print(
        f"\nFinal training dataset: "
        f"{len(balanced_df):,} rows"
    )

    return balanced_df


# =========================================================
# PREPARE FEATURES
# =========================================================

def prepare_features(df):

    print("\nPreparing features...")

    X = df[FEATURES].copy()

    y = df[TARGET].copy()

    # Convert everything to numeric
    X = X.apply(
        pd.to_numeric,
        errors="coerce"
    )

    # Replace invalid values
    X = X.replace(
        [float("inf"), float("-inf")],
        0
    )

    X = X.fillna(0)

    return X, y


# =========================================================
# TRAIN CURRENT-STAGE MODEL
# =========================================================

def train_model(X, y):

    print("\nSplitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print(
        f"Training rows: {len(X_train):,}"
    )

    print(
        f"Testing rows: {len(X_test):,}"
    )

    print("\nTraining Random Forest...")

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=15,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )

    print("\nModel training complete.")

    # -----------------------------------------------------
    # Evaluation
    # -----------------------------------------------------

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
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

    print("\nConfusion Matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )

    return model


# =========================================================
# SAVE MODEL
# =========================================================

def save_model(model):

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    output_file = os.path.join(
        MODEL_DIR,
        "stage_classifier.joblib"
    )

    joblib.dump(
        model,
        output_file
    )

    print(
        f"\nModel saved to:"
    )

    print(
        output_file
    )


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("CYBERFORECAST - REAL DATA TRAINING")
    print("=" * 60)

    df = load_data()

    X, y = prepare_features(df)

    model = train_model(
        X,
        y
    )

    save_model(
        model
    )

    print("\n" + "=" * 60)
    print("REAL MODEL TRAINING COMPLETE")
    print("=" * 60)