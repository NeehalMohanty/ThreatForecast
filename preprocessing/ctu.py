import pandas as pd
import os
import glob


# =========================================================
# CONFIGURATION
# =========================================================

INPUT_DIR = "data/raw/CTU"

OUTPUT_DIR = "data/processed"

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "ctu_processed.parquet"
)


# =========================================================
# 1. CLASSIFY TRAFFIC
# =========================================================

def classify_traffic(label):

    label = str(label).lower()

    # Botnet traffic
    if "from-botnet" in label:
        return "Malicious"

    # Normal traffic
    if "from-normal" in label:
        return "Benign"

    # Background traffic
    if "background" in label:
        return "Benign"

    # Anything else
    return "Unknown"


# =========================================================
# 2. PROCESS ONE FILE
# =========================================================

def process_file(file_path):

    print(f"\nProcessing: {os.path.basename(file_path)}")

    df = pd.read_parquet(file_path)

    print(f"Rows: {len(df):,}")

    # Standardize column names
    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    # Clean label
    if "label" in df.columns:

        df["label"] = (
            df["label"]
            .astype(str)
            .str.strip()
        )

        # Create binary traffic classification
        df["traffic_type"] = (
            df["label"]
            .apply(classify_traffic)
        )

    # Keep track of original file
    df["source_file"] = os.path.basename(file_path)

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

    print(
        f"Duplicates removed: {removed:,}"
    )

    return df


# =========================================================
# 3. PROCESS ALL CTU FILES
# =========================================================

def process_all_files():

    files = glob.glob(
        os.path.join(
            INPUT_DIR,
            "*.parquet"
        )
    )

    if not files:

        print("No parquet files found.")

        return None

    print(
        f"Found {len(files)} CTU parquet files."
    )

    processed_data = []

    for file_path in files:

        df = process_file(file_path)

        processed_data.append(df)

    print("\nCombining files...")

    combined = pd.concat(
        processed_data,
        ignore_index=True
    )

    return combined


# =========================================================
# 4. SAVE DATA
# =========================================================

def save_data(df):

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    df.to_parquet(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nProcessed CTU dataset saved to:"
    )

    print(
        OUTPUT_FILE
    )

    print(
        f"Total rows: {len(df):,}"
    )


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("CTU DATASET PREPROCESSING")
    print("=" * 60)

    df = process_all_files()

    if df is not None:

        print("\nTraffic distribution:")

        print(
            df["traffic_type"]
            .value_counts()
        )

        save_data(df)

    print("\n" + "=" * 60)
    print("CTU PREPROCESSING COMPLETE")
    print("=" * 60)