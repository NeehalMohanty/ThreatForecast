import streamlit as st
import pandas as pd
import numpy as np
import sys
import os

# Allow dashboard to import files from ml/
sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)

from ml.Forecast_engine import ForecastEngine


# =========================================================
# PAGE CONFIGURATION
# =========================================================

st.set_page_config(
    page_title="CyberForecast",
    page_icon="🛡️",
    layout="wide"
)


# =========================================================
# TITLE
# =========================================================

st.title("🛡️ CyberForecast")

st.subheader(
    "AI-Driven Cyberattack Progression "
    "Forecasting & Early Warning System"
)

st.caption(
    "Detect current threat behaviour • "
    "Forecast likely next stage • "
    "Generate explainable early warnings"
)


# =========================================================
# LOAD ENGINE
# =========================================================

@st.cache_resource
def load_engine():

    return ForecastEngine()


try:

    engine = load_engine()

except Exception as e:

    st.error(
        f"Could not load CyberForecast models: {e}"
    )

    st.stop()


# =========================================================
# SIDEBAR
# =========================================================

st.sidebar.header("⚙️ Controls")

scenario = st.sidebar.selectbox(
    "Select threat scenario",
    [
        "Reconnaissance",
        "Initial Access",
        "Execution",
        "Privilege Escalation",
        "Lateral Movement",
        "Exfiltration"
    ]
)


# =========================================================
# SCENARIO BEHAVIOUR
# =========================================================

SCENARIOS = {

    "Reconnaissance": {

        "failed_logins": 3,
        "port_scans": 15,
        "process_creation": 3,
        "privilege_changes": 0,
        "internal_connections": 5,
        "outbound_bytes": 1000,

        "failed_logins_trend": 1,
        "port_scans_trend": 8,
        "process_creation_trend": 1,
        "privilege_changes_trend": 0,
        "internal_connections_trend": 2,
        "outbound_bytes_trend": 300
    },

    "Initial Access": {

        "failed_logins": 15,
        "port_scans": 8,
        "process_creation": 6,
        "privilege_changes": 1,
        "internal_connections": 7,
        "outbound_bytes": 2000,

        "failed_logins_trend": 6,
        "port_scans_trend": 2,
        "process_creation_trend": 3,
        "privilege_changes_trend": 1,
        "internal_connections_trend": 3,
        "outbound_bytes_trend": 700
    },

    "Execution": {

        "failed_logins": 8,
        "port_scans": 4,
        "process_creation": 20,
        "privilege_changes": 4,
        "internal_connections": 10,
        "outbound_bytes": 4000,

        "failed_logins_trend": 2,
        "port_scans_trend": 1,
        "process_creation_trend": 10,
        "privilege_changes_trend": 2,
        "internal_connections_trend": 4,
        "outbound_bytes_trend": 1500
    },

    "Privilege Escalation": {

        "failed_logins": 5,
        "port_scans": 3,
        "process_creation": 18,
        "privilege_changes": 12,
        "internal_connections": 12,
        "outbound_bytes": 6000,

        "failed_logins_trend": 0,
        "port_scans_trend": 0,
        "process_creation_trend": 5,
        "privilege_changes_trend": 7,
        "internal_connections_trend": 5,
        "outbound_bytes_trend": 2000
    },

    "Lateral Movement": {

        "failed_logins": 12,
        "port_scans": 10,
        "process_creation": 18,
        "privilege_changes": 8,
        "internal_connections": 30,
        "outbound_bytes": 9000,

        "failed_logins_trend": 5,
        "port_scans_trend": 4,
        "process_creation_trend": 4,
        "privilege_changes_trend": 3,
        "internal_connections_trend": 15,
        "outbound_bytes_trend": 3000
    },

    "Exfiltration": {

        "failed_logins": 5,
        "port_scans": 3,
        "process_creation": 12,
        "privilege_changes": 5,
        "internal_connections": 20,
        "outbound_bytes": 30000,

        "failed_logins_trend": 1,
        "port_scans_trend": 1,
        "process_creation_trend": 2,
        "privilege_changes_trend": 2,
        "internal_connections_trend": 8,
        "outbound_bytes_trend": 15000
    }
}


# =========================================================
# CREATE INPUT DATA
# =========================================================

behaviour_data = pd.DataFrame(
    [SCENARIOS[scenario]]
)


# =========================================================
# NETWORK INPUT
# =========================================================

network_features = (
    engine.stage_model.feature_names_in_
)

network_data = pd.DataFrame(
    0.0,
    index=[0],
    columns=network_features
)


# Put representative network values into
# matching CICIoT23 features.

network_values = {

    "Rate": behaviour_data.loc[
        0, "internal_connections"
    ],

    "Srate": behaviour_data.loc[
        0, "port_scans"
    ],

    "Drate": behaviour_data.loc[
        0, "failed_logins"
    ],

    "Tot size": behaviour_data.loc[
        0, "outbound_bytes"
    ],

    "Number": behaviour_data.loc[
        0, "process_creation"
    ]
}


for feature, value in network_values.items():

    if feature in network_data.columns:

        network_data.loc[
            0,
            feature
        ] = value


# =========================================================
# RUN FORECAST
# =========================================================

result = engine.forecast(
    network_data,
    behaviour_data
)


# =========================================================
# TOP METRICS
# =========================================================

col1, col2, col3, col4 = st.columns(4)

with col1:

    st.metric(
        "Current Stage",
        result["current_stage"]
    )

with col2:

    st.metric(
        "Current Confidence",
        f"{result['current_confidence']}%"
    )

with col3:

    st.metric(
        "Next Likely Stage",
        result["next_stage"]
    )

with col4:

    st.metric(
        "Forecast Confidence",
        f"{result['next_confidence']}%"
    )


# =========================================================
# RISK
# =========================================================

st.divider()

st.header("🚨 Early Warning")

risk = result["risk"]

if risk == "CRITICAL":

    st.error(
        f"CRITICAL RISK — "
        f"Predicted next stage: {result['next_stage']}"
    )

elif risk == "HIGH":

    st.warning(
        f"HIGH RISK — "
        f"Predicted next stage: {result['next_stage']}"
    )

elif risk == "MEDIUM":

    st.info(
        f"MEDIUM RISK — "
        f"Predicted next stage: {result['next_stage']}"
    )

else:

    st.success(
        f"LOW RISK — "
        f"Predicted next stage: {result['next_stage']}"
    )


# =========================================================
# TWO-COLUMN SECTION
# =========================================================

left, right = st.columns(2)


# ---------------------------------------------------------
# EVIDENCE
# ---------------------------------------------------------

with left:

    st.subheader("🔍 Detection Evidence")

    for evidence in result["evidence"]:

        st.write(
            f"• {evidence}"
        )


# ---------------------------------------------------------
# CURRENT TELEMETRY
# ---------------------------------------------------------

with right:

    st.subheader("📊 Behaviour Telemetry")

    telemetry = pd.DataFrame({

        "Indicator": [
            "Failed Logins",
            "Port Scans",
            "Process Creation",
            "Privilege Changes",
            "Internal Connections",
            "Outbound Bytes"
        ],

        "Current": [

            behaviour_data.loc[
                0,
                "failed_logins"
            ],

            behaviour_data.loc[
                0,
                "port_scans"
            ],

            behaviour_data.loc[
                0,
                "process_creation"
            ],

            behaviour_data.loc[
                0,
                "privilege_changes"
            ],

            behaviour_data.loc[
                0,
                "internal_connections"
            ],

            behaviour_data.loc[
                0,
                "outbound_bytes"
            ]
        ]
    })

    st.dataframe(
        telemetry,
        use_container_width=True,
        hide_index=True
    )


# =========================================================
# ATTACK PROGRESSION
# =========================================================

st.divider()

st.header("📈 Attack Progression")

st.write(
    "Expected progression model:"
)

st.write(
    "Benign → Reconnaissance → Initial Access "
    "→ Execution → Privilege Escalation "
    "→ Lateral Movement → Exfiltration"
)


st.progress(
    (
        [
            "Benign",
            "Reconnaissance",
            "Initial Access",
            "Execution",
            "Privilege Escalation",
            "Lateral Movement",
            "Exfiltration"
        ].index(
            scenario
        ) + 1
    ) / 7
)


# =========================================================
# EXPLANATION
# =========================================================

st.divider()

st.header("🧠 AI Explanation")

st.write(
    f"""
The system currently identifies the observed behaviour
as **{result['current_stage']}** with
**{result['current_confidence']}% confidence**.

Based on the behavioural indicators, the forecasting
model predicts **{result['next_stage']}** as the next
likely threat state with **{result['next_confidence']}%**
confidence.

The resulting risk level is **{result['risk']}**.
"""
)


# =========================================================
# FOOTER
# =========================================================

st.divider()

st.caption(
    "CyberForecast — AI-driven cyberattack early-warning prototype"
)

st.caption(
    "Real cybersecurity datasets are used for behaviour "
    "detection; controlled temporal scenarios demonstrate "
    "the forecasting layer."
)