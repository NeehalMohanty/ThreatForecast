"""Build next-observation examples from actual, timestamped campaign telemetry.
No stage sorting, proxy behaviour fabrication, or cross-campaign windows.
Run: python -m ml.real_sequence_builder input.csv --output data/processed/observed_sequences.csv
"""
import argparse
from pathlib import Path
import pandas as pd
import numpy as np
from .progression_model import STAGES

BEHAVIOURS = ["failed_logins", "port_scans", "process_creation", "privilege_changes",
              "internal_connections", "outbound_bytes"]

def build_sequences(frame):
    required = ["sequence_id", "timestamp", "stage", *BEHAVIOURS]
    missing = sorted(set(required) - set(frame.columns))
    if missing:
        raise ValueError(f"Missing observed telemetry columns: {missing}")
    frame = frame[required].copy()
    if frame.isna().any().any():
        raise ValueError("Missing observations are not permitted")
    if not frame["stage"].isin(STAGES).all():
        raise ValueError("Unknown stage label")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True, errors="raise")
    if frame.duplicated(["sequence_id", "timestamp"]).any():
        raise ValueError("Timestamps must be unique within each sequence")
    for name in BEHAVIOURS:
        frame[name] = pd.to_numeric(frame[name], errors="raise")
        if not np.isfinite(frame[name]).all() or (frame[name] < 0).any():
            raise ValueError(f"{name} must contain finite non-negative observations")
    frame = frame.sort_values(["sequence_id", "timestamp"])
    grouped = frame.groupby("sequence_id", sort=False)
    frame["current_stage"] = frame["stage"]
    frame["next_stage"] = grouped["stage"].shift(-1)
    frame["next_timestamp"] = grouped["timestamp"].shift(-1)
    for name in BEHAVIOURS:
        frame[name + "_trend"] = grouped[name].diff().fillna(0)
    frame["horizon_seconds"] = (frame["next_timestamp"] - frame["timestamp"]).dt.total_seconds()
    # Retain persistence examples. The terminal observation has no future label.
    return frame.dropna(subset=["next_stage"]).drop(columns=["stage", "next_timestamp"])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/processed/observed_sequences.csv"))
    args = parser.parse_args()
    result = build_sequences(pd.read_csv(args.input))
    if result.empty:
        raise ValueError("Need at least two observations in a sequence")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(args.output, index=False)
    print(f"Saved {len(result)} observed transitions to {args.output}")

if __name__ == "__main__":
    main()
