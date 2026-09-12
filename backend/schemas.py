from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator, model_validator


# =========================================================
# NETWORK TRAFFIC INPUT
# =========================================================

class NetworkTrafficInput(BaseModel):

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    @field_validator('*', mode='after')
    @classmethod
    def validate_numbers(cls, value, info):
        if not info.field_name.endswith('_trend') and value < 0:
            raise ValueError('Telemetry counters and measurements must be non-negative')
        if abs(value) > 1e15:
            raise ValueError('Telemetry magnitude exceeds supported range')
        return value

    @model_validator(mode='after')
    def require_network_measurement(self):
        if not self.model_fields_set.intersection({'flow_duration', 'rate', 'tot_size', 'header_length', 'protocol_type'}):
            raise ValueError('Provide at least one network measurement: flow_duration, rate, tot_size, header_length or protocol_type')
        return self

    # -----------------------------------------------------
    # CICIoT23 network features
    # -----------------------------------------------------

    flow_duration: float = 0
    header_length: float = 0
    protocol_type: float = 0
    duration: float = 0

    rate: float = 0
    srate: float = 0
    drate: float = 0

    fin_flag_number: float = 0
    syn_flag_number: float = 0
    rst_flag_number: float = 0
    psh_flag_number: float = 0
    ack_flag_number: float = 0
    ece_flag_number: float = 0
    cwr_flag_number: float = 0

    ack_count: float = 0
    syn_count: float = 0
    fin_count: float = 0
    urg_count: float = 0
    rst_count: float = 0

    http: float = 0
    https: float = 0
    dns: float = 0
    telnet: float = 0
    smtp: float = 0
    ssh: float = 0
    irc: float = 0

    tcp: float = 0
    udp: float = 0
    dhcp: float = 0
    arp: float = 0
    icmp: float = 0
    ipv: float = 0
    llc: float = 0

    tot_sum: float = 0
    min: float = 0
    max: float = 0
    avg: float = 0
    std: float = 0

    tot_size: float = 0
    iat: float = 0
    number: float = 0
    magnitue: float = Field(default=0, validation_alias=AliasChoices('magnitue', 'magnitude'))
    radius: float = 0
    covariance: float = 0
    variance: float = 0
    weight: float = 0

    # -----------------------------------------------------
    # Behavioural indicators
    # -----------------------------------------------------

    failed_logins: float = 0
    port_scans: float = 0
    process_creation: float = 0
    privilege_changes: float = 0
    internal_connections: float = 0
    outbound_bytes: float = 0

    # -----------------------------------------------------
    # Behaviour trends
    # -----------------------------------------------------

    port_scans_trend: float = 0
    failed_logins_trend: float = 0
    process_creation_trend: float = 0
    privilege_changes_trend: float = 0
    internal_connections_trend: float = 0
    outbound_bytes_trend: float = 0


# =========================================================
# PREDICTION RESPONSE
# =========================================================

class PredictionResponse(BaseModel):

    forecast_method: str
    calibrated: bool
    missing_features: List[str]
    warnings: List[str]
    current_stage_probabilities: dict
    forecast_basis: str
    uncertainty: dict
    data_quality: dict

    current_stage: str

    current_confidence: float

    next_stage: str

    next_confidence: float

    risk: str

    evidence: List[str]

    transition_probabilities: dict

    # Compatibility fields for frontend
    predicted_attack: bool

    predicted_attack_type: Optional[str] = None

    risk_score: float

    forecast_window: str

    recommended_action: str


# =========================================================
# BATCH INPUT
# =========================================================

class BatchPredictionInput(BaseModel):

    model_config = ConfigDict(extra="forbid")
    network_data: List[NetworkTrafficInput] = Field(min_length=1, max_length=100)
