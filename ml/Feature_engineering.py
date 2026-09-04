import pandas as pd
import numpy as np


def clean_column_names(df):
    """Standardize column names."""

    df = df.copy()

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
        .str.replace("/", "_")
    )

    return df


def clean_data(df):
    """Clean invalid and missing values."""

    df = df.copy()

    # Replace infinite values
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Remove completely empty rows
    df.dropna(how="all", inplace=True)

    return df


def convert_numeric_columns(df):
    """Convert columns to numeric where possible."""

    df = df.copy()

    for column in df.columns:

        if df[column].dtype == "object":

            converted = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            # Only replace the column if conversion
            # produced useful numeric values
            if converted.notna().sum() > 0:
                df[column] = converted

    return df


def create_trend_features(df):
    """
    Create temporal trend features.

    These help us understand whether network
    behaviour is increasing or decreasing.
    """

    df = df.copy()

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns

    for column in numeric_columns:

        df[f"{column}_trend"] = df[column].diff()

    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    df.fillna(0, inplace=True)

    return df


def engineer_features(df):
    """
    Complete feature-engineering pipeline.
    """

    df = clean_column_names(df)

    df = convert_numeric_columns(df)

    df = clean_data(df)

    df = create_trend_features(df)

    return df


# ---------------------------------------------------------
# TEST
# ---------------------------------------------------------

if __name__ == "__main__":

    print("Testing feature engineering...")

    test_data = pd.DataFrame({
        "Packet Count": [100, 150, 220],
        "Bytes Sent": [1000, 1500, 3000],
        "Failed Logins": [2, 4, 10]
    })

    result = engineer_features(test_data)

    print("\nOriginal data:")
    print(test_data)

    print("\nEngineered data:")
    print(result)

    print("\nFeature engineering test successful!")