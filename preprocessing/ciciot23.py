import pandas as pd
import os


# =========================================================
# CONFIGURATION
# =========================================================

INPUT_FILE = "data/raw/CICIOT23/train/train.csv"

OUTPUT_DIR = "data/processed"

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "ciciot23_train_processed.csv"
)


# =========================================================
# 1. LOAD DATA
# =========================================================

def load_data():

    print("Loading CICIoT23 dataset...")

    df = pd.read_csv(INPUT_FILE)

    print(f"Rows loaded: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    return df


# =========================================================
# 2. CLEAN COLUMN NAMES
# =========================================================

def clean_column_names(df):

    df = df.copy()

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
    )

    return df


# =========================================================
# 3. CLEAN DATA
# =========================================================

def clean_data(df):

    df = df.copy()

    print("\nCleaning data...")

    # Replace infinite values
    df.replace(
        [float("inf"), float("-inf")],
        pd.NA,
        inplace=True
    )

    # Remove completely empty rows
    df.dropna(
        how="all",
        inplace=True
    )

    # Remove duplicate rows
    before = len(df)

    df.drop_duplicates(
        inplace=True
    )

    removed = before - len(df)

    print(f"Duplicate rows removed: {removed:,}")

    return df


# =========================================================
# 4. CLEAN LABELS
# =========================================================

def clean_labels(df):

    df = df.copy()

    df["label"] = (
        df["label"]
        .astype(str)
        .str.strip()
    )

    return df


# =========================================================
# 5. CREATE ATTACK CATEGORY
# =========================================================

def create_attack_category(df):

    df = df.copy()

    def categorize(label):

        label_lower = label.lower()

        if label_lower == "benigntraffic":
            return "Benign"

        if label_lower.startswith("recon"):
            return "Reconnaissance"

        if "bruteforce" in label_lower:
            return "Initial Access"

        if "vulnerabilityscan" in label_lower:
            return "Reconnaissance"

        if any(
            x in label_lower
            for x in [
                "commandinjection",
                "sqlinjection",
                "xss"
            ]
        ):
            return "Execution"

        if "browserhijacking" in label_lower:
            return "Execution"

        if "mitm" in label_lower:
            return "Lateral Movement"

        if "spoofing" in label_lower:
            return "Lateral Movement"

        if any(
            x in label_lower
            for x in [
                "ddos",
                "dos",
                "mirai"
            ]
        ):
            return "Execution"

        return "Other"

    df["attack_category"] = (
        df["label"].apply(categorize)
    )

    return df


# =========================================================
# 6. SAVE PROCESSED DATA
# =========================================================

def save_data(df):

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nProcessed dataset saved to:"
    )

    print(
        OUTPUT_FILE
    )


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("CICIoT23 PREPROCESSING")
    print("=" * 60)

    df = load_data()

    df = clean_column_names(df)

    df = clean_data(df)

    df = clean_labels(df)

    df = create_attack_category(df)

    print("\nAttack category distribution:")

    print(
        df["attack_category"]
        .value_counts()
    )

    save_data(df)

    print("\n" + "=" * 60)
    print("CICIoT23 PREPROCESSING COMPLETE")
    print("=" * 60)