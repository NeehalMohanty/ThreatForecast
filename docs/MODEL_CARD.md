# ThreatForecast model card

## Intended use

ThreatForecast is a Smart India Hackathon research prototype for exploring whether network-flow classifications and correlated behaviour indicators can help an analyst reason about a possible next attack stage. It supports demonstrations, software integration work and controlled evaluation. It is not an autonomous containment system, a production intrusion-detection replacement or evidence of compromise by itself.

## Active inference

The current-stage model is a tracked `RandomForestClassifier` trained from CICIoT2023-derived records. It expects 46 numeric features and exposes five proxy classes: Benign, Reconnaissance, Initial Access, Execution and Lateral Movement.

The next-stage layer is not a trained temporal model. It combines hand-authored stage-transition weights with behavioural multipliers. Version 2.1 computes a mixture across the full current-stage classifier distribution instead of conditioning only on the winning class. This prevents a low-confidence winner from being treated as certain. The API reports all current and next-state weights, normalized entropy, the top-two margin and input-field coverage.

The tracked `forecaster.joblib` is experimental and is not loaded by the API.

## Inputs and outputs

Inputs are CICIoT2023-style numeric flow features plus optional correlated behavioural observations. Missing classifier fields are filled with zero and reported. Feature coverage measures only whether a field was supplied. It does not measure data quality, sensor trust or domain similarity.

Classifier confidence is the Random Forest vote fraction. Next-stage values are normalized heuristic weights. Risk score is an ordinal severity index. None of these values is a calibrated probability of attack or a time-to-event prediction.

## Known limitations

- Training labels are proxy mappings from attack categories, not verified campaign-stage annotations.
- The bundled classifier does not emit Privilege Escalation or Exfiltration as current classes.
- Existing training code uses an exploratory random row split and class balancing before the split, which may overstate generalization.
- Behaviour thresholds are hand-authored and require validation on genuine correlated host and network telemetry.
- No held-out campaign, cross-dataset, calibration, lead-time or live-throughput benchmark is included.
- Missing, shifted or adversarial data may produce confident-looking but unreliable output.

## Evaluation required

Partition complete campaigns before sampling. Report class support, per-class precision/recall, macro-F1, confusion matrix, benign false-positive rate, calibration and Brier score. Compare persistence and empirical-transition baselines with any trained sequence model at declared horizons. Measure lead time only from timestamped future observations. Preserve dataset, feature pipeline, model and code versions with every result.

## Human oversight

Analysts should inspect the ranked alternatives, score margin, input coverage and supporting telemetry before acting. Suggested responses are prompts for investigation. Containment requires human authorization and corroborating evidence.
