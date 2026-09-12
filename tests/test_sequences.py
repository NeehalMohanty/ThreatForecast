import pandas as pd
import pytest
from ml.real_sequence_builder import build_sequences, BEHAVIOURS

def data():
    return pd.DataFrame([
        {"sequence_id": group, "timestamp": f"2026-01-01T00:0{i}:00Z",
         "stage": "Benign" if i < 2 else "Reconnaissance",
         **{key: i for key in BEHAVIOURS}}
        for group in ["a", "b"] for i in range(3)
    ])

def test_group_boundaries_persistence_and_past_only_trends():
    result = build_sequences(data().sample(frac=1, random_state=4))
    assert len(result) == 4
    assert result.groupby("sequence_id").size().tolist() == [2, 2]
    assert result["next_stage"].tolist() == ["Benign", "Reconnaissance"] * 2
    assert result["failed_logins_trend"].tolist() == [0, 1, 0, 1]
    assert result["horizon_seconds"].tolist() == [60] * 4

def test_reject_missing_observed_features():
    with pytest.raises(ValueError, match="Missing observed"):
        build_sequences(data().drop(columns=["failed_logins"]))

def test_reject_ambiguous_time_order():
    frame = data()
    frame.loc[1, "timestamp"] = frame.loc[0, "timestamp"]
    with pytest.raises(ValueError, match="unique"):
        build_sequences(frame)
