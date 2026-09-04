from typing import Optional, List

from pydantic import BaseModel


# =========================================================
# NETWORK TRAFFIC INPUT
# =========================================================

class NetworkTrafficInput(BaseModel):

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
    magnitue: float = 0
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
    privilege_changes_trend: float = 0
    internal_connections_trend: float = 0
    outbound_bytes_trend: float = 0


# =========================================================
# PREDICTION RESPONSE
# =========================================================

class PredictionResponse(BaseModel):

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

    network_data: List[NetworkTrafficInput]