import { useEffect, useState } from 'react'

import {
  Brain,
  TrendingUp,
  ShieldAlert,
  Clock,
} from 'lucide-react'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

import { predictThreat } from '../services/api'


// =========================================================
// BUILD RISK TREND
// =========================================================

const buildForecastData = (riskScore = 0) => {
  const safeRisk = Math.max(
    0,
    Math.min(100, Number(riskScore) || 0)
  )

  return [
    {
      time: 'Now',
      risk: Math.max(0, safeRisk - 20),
    },

    {
      time: '+4h',
      risk: Math.max(0, safeRisk - 15),
    },

    {
      time: '+8h',
      risk: Math.max(0, safeRisk - 10),
    },

    {
      time: '+12h',
      risk: Math.max(0, safeRisk - 5),
    },

    {
      time: '+16h',
      risk: safeRisk,
    },

    {
      time: '+20h',
      risk: Math.min(100, safeRisk + 3),
    },

    {
      time: '+24h',
      risk: Math.min(100, safeRisk + 5),
    },
  ]
}


// =========================================================
// SCENARIO SUMMARY
// =========================================================

const getScenarioSummary = (prediction) => {
  if (!prediction) {
    return null
  }

  const risk = prediction.risk


  if (risk === 'LOW') {
    return {
      title: 'Low Risk Activity',

      description:
        'Traffic behaviour appears mostly normal with limited suspicious indicators and no strong signs of attack progression.',
    }
  }


  if (risk === 'MEDIUM') {
    return {
      title: 'Suspicious Activity Detected',

      description:
        'The system detected multiple warning indicators and predicts a possible progression to the next attack stage. Increased monitoring is recommended.',
    }
  }


  if (risk === 'HIGH') {
    return {
      title: 'High Risk Activity',

      description:
        'Strong malicious behaviour has been detected. The attack may be progressing into execution, privilege escalation, or lateral movement.',
    }
  }


  if (risk === 'CRITICAL') {
    return {
      title: 'Critical Threat Detected',

      description:
        'Multiple severe indicators suggest an advanced or rapidly progressing attack. Immediate investigation and containment are recommended.',
    }
  }


  return {
    title: 'Threat Analysis',

    description:
      'CyberForecast analysed the submitted telemetry and generated a threat assessment.',
  }
}


// =========================================================
// FORECAST PAGE
// =========================================================

function Forecast() {
  const [prediction, setPrediction] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(null)

  const [
    selectedPreset,
    setSelectedPreset,
  ] = useState('reconnaissance')


  // =======================================================
  // INITIAL FORM DATA
  // =======================================================

  const [formData, setFormData] =
    useState({
      flow_duration: 2.5,
      header_length: 54,
      protocol_type: 6,
      duration: 64,

      rate: 25,
      srate: 20,
      drate: 5,

      syn_flag_number: 1,
      rst_flag_number: 0,
      psh_flag_number: 1,
      ack_flag_number: 1,

      ack_count: 2,
      syn_count: 3,
      fin_count: 0,

      http: 0,
      https: 1,
      dns: 0,
      ssh: 1,

      tcp: 1,
      udp: 0,

      tot_sum: 1000,
      min: 40,
      max: 500,
      avg: 180,
      std: 50,

      tot_size: 1200,
      iat: 0.5,
      number: 10,

      magnitude: 20,
      radius: 15,
      covariance: 5,
      variance: 25,
      weight: 1,

      failed_logins: 12,
      port_scans: 15,
      process_creation: 3,
      privilege_changes: 0,
      internal_connections: 5,
      outbound_bytes: 1000,

      port_scans_trend: 8,
      privilege_changes_trend: 0,
      internal_connections_trend: 2,
      outbound_bytes_trend: 500,
    })


  // =======================================================
  // PRESETS
  // =======================================================

  const presets = {

    normal: {
      flow_duration: 1,
      header_length: 40,
      protocol_type: 6,
      duration: 32,

      rate: 5,
      srate: 4,
      drate: 1,

      syn_flag_number: 0,
      rst_flag_number: 0,
      psh_flag_number: 0,
      ack_flag_number: 1,

      ack_count: 1,
      syn_count: 0,
      fin_count: 0,

      http: 0,
      https: 1,
      dns: 0,
      ssh: 0,

      tcp: 1,
      udp: 0,

      tot_sum: 300,
      min: 40,
      max: 100,
      avg: 60,
      std: 10,

      tot_size: 400,
      iat: 1.2,
      number: 5,

      magnitude: 5,
      radius: 3,
      covariance: 1,
      variance: 4,
      weight: 1,

      failed_logins: 0,
      port_scans: 0,
      process_creation: 1,
      privilege_changes: 0,
      internal_connections: 2,
      outbound_bytes: 300,

      port_scans_trend: 0,
      privilege_changes_trend: 0,
      internal_connections_trend: 0,
      outbound_bytes_trend: 0,
    },


    reconnaissance: {
      flow_duration: 2.5,
      header_length: 54,
      protocol_type: 6,
      duration: 64,

      rate: 25,
      srate: 20,
      drate: 5,

      syn_flag_number: 1,
      rst_flag_number: 0,
      psh_flag_number: 1,
      ack_flag_number: 1,

      ack_count: 2,
      syn_count: 3,
      fin_count: 0,

      http: 0,
      https: 1,
      dns: 0,
      ssh: 1,

      tcp: 1,
      udp: 0,

      tot_sum: 1000,
      min: 40,
      max: 500,
      avg: 180,
      std: 50,

      tot_size: 1200,
      iat: 0.5,
      number: 10,

      magnitude: 20,
      radius: 15,
      covariance: 5,
      variance: 25,
      weight: 1,

      failed_logins: 12,
      port_scans: 15,
      process_creation: 3,
      privilege_changes: 0,
      internal_connections: 5,
      outbound_bytes: 1000,

      port_scans_trend: 8,
      privilege_changes_trend: 0,
      internal_connections_trend: 2,
      outbound_bytes_trend: 500,
    },


    suspicious: {
      flow_duration: 5,
      header_length: 80,
      protocol_type: 6,
      duration: 120,

      rate: 60,
      srate: 50,
      drate: 10,

      syn_flag_number: 1,
      rst_flag_number: 1,
      psh_flag_number: 1,
      ack_flag_number: 1,

      ack_count: 6,
      syn_count: 10,
      fin_count: 2,

      http: 0,
      https: 1,
      dns: 0,
      ssh: 1,

      tcp: 1,
      udp: 0,

      tot_sum: 4000,
      min: 40,
      max: 1000,
      avg: 350,
      std: 150,

      tot_size: 5000,
      iat: 0.2,
      number: 30,

      magnitude: 40,
      radius: 35,
      covariance: 15,
      variance: 80,
      weight: 2,

      failed_logins: 20,
      port_scans: 30,
      process_creation: 15,
      privilege_changes: 7,
      internal_connections: 20,
      outbound_bytes: 20000,

      port_scans_trend: 15,
      privilege_changes_trend: 5,
      internal_connections_trend: 10,
      outbound_bytes_trend: 10000,
    },
  }


  // =======================================================
  // SAVE LATEST ONLY
  // USED FOR AUTOMATIC PAGE-LOAD PREDICTION
  // =======================================================

  const saveLatestOnly = (
    predictionData,
    presetName = null
  ) => {

    const dataToSave = {
      ...predictionData,

      timestamp:
        new Date().toISOString(),

      scenario:
        presetName ||
        selectedPreset ||
        'custom',
    }


    localStorage.setItem(
      'latestCyberForecast',
      JSON.stringify(dataToSave)
    )


    return dataToSave
  }


  // =======================================================
  // SAVE LATEST + HISTORY
  // USED ONLY WHEN USER RUNS AN ANALYSIS
  // =======================================================

  const savePredictionToHistory = (
    predictionData,
    presetName = null
  ) => {

    const timestamp =
      new Date().toISOString()


    const dataToSave = {
      ...predictionData,

      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      timestamp,

      scenario:
        presetName ||
        selectedPreset ||
        'custom',
    }


    // =============================================
    // SAVE LATEST FOR DASHBOARD
    // =============================================

    localStorage.setItem(
      'latestCyberForecast',
      JSON.stringify(dataToSave)
    )


    // =============================================
    // READ EXISTING HISTORY
    // =============================================

    let existingHistory = []


    try {

      const savedHistory =
        localStorage.getItem(
          'cyberForecastHistory'
        )


      if (savedHistory) {

        const parsedHistory =
          JSON.parse(savedHistory)


        existingHistory =
          Array.isArray(parsedHistory)
            ? parsedHistory
            : []

      }

    } catch (historyError) {

      console.error(
        'Failed to read prediction history:',
        historyError
      )

      existingHistory = []

    }


    // =============================================
    // DUPLICATE PROTECTION
    // =============================================

    const newestRecord =
      existingHistory[0]


    if (newestRecord) {

      const oldTime =
        new Date(
          newestRecord.timestamp
        ).getTime()


      const newTime =
        new Date(
          timestamp
        ).getTime()


      const timeDifference =
        Math.abs(
          newTime - oldTime
        )


      const samePrediction =
        newestRecord.scenario ===
          dataToSave.scenario &&

        newestRecord.current_stage ===
          dataToSave.current_stage &&

        newestRecord.next_stage ===
          dataToSave.next_stage &&

        newestRecord.risk ===
          dataToSave.risk &&

        Number(
          newestRecord.risk_score
        ) ===
          Number(
            dataToSave.risk_score
          )


      if (
        samePrediction &&
        timeDifference < 2000
      ) {

        console.log(
          'Duplicate prediction ignored.'
        )


        localStorage.setItem(
          'latestCyberForecast',
          JSON.stringify(
            newestRecord
          )
        )


        return newestRecord

      }

    }


    // =============================================
    // ADD NEW HISTORY RECORD
    // =============================================

    const updatedHistory = [
      dataToSave,
      ...existingHistory,
    ]


    const limitedHistory =
      updatedHistory.slice(
        0,
        100
      )


    localStorage.setItem(
      'cyberForecastHistory',
      JSON.stringify(
        limitedHistory
      )
    )


    return dataToSave
  }


  // =======================================================
  // INITIAL PREDICTION
  // =======================================================

  useEffect(() => {

    const loadPrediction =
      async () => {

        try {

          setLoading(true)


          const data =
            await predictThreat(
              formData
            )


          setPrediction(
            data
          )


          // Important:
          // page load updates latest result,
          // but DOES NOT create history.

          saveLatestOnly(
            data,
            'reconnaissance'
          )


          setError(null)

        } catch (err) {

          console.error(
            'Prediction failed:',
            err
          )


          setError(
            'Unable to get prediction from backend.'
          )

        } finally {

          setLoading(false)

        }

      }


    loadPrediction()


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // =======================================================
  // INPUT CHANGE
  // =======================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target


    setFormData(
      (previousData) => ({

        ...previousData,

        [name]:
          value === ''
            ? 0
            : Number(value),

      })
    )


    setSelectedPreset(
      null
    )
  }


  // =======================================================
  // PRESET + AUTO PREDICT
  // =======================================================

  const applyPreset = async (
    presetName
  ) => {

    const presetData =
      presets[presetName]


    setSelectedPreset(
      presetName
    )


    setFormData(
      presetData
    )


    try {

      setLoading(true)

      setError(null)


      const data =
        await predictThreat(
          presetData
        )


      setPrediction(
        data
      )


      // User intentionally clicked a preset.
      // Store exactly one history record.

      savePredictionToHistory(
        data,
        presetName
      )

    } catch (err) {

      console.error(
        'Preset prediction failed:',
        err
      )


      setError(
        'Unable to get prediction from backend.'
      )

    } finally {

      setLoading(false)

    }

  }


  // =======================================================
  // MANUAL PREDICTION
  // =======================================================

  const handlePrediction = async (
    event
  ) => {

    event.preventDefault()


    try {

      setLoading(true)

      setError(null)


      const data =
        await predictThreat(
          formData
        )


      setPrediction(
        data
      )


      savePredictionToHistory(
        data,
        selectedPreset ||
        'custom'
      )

    } catch (err) {

      console.error(
        'Prediction failed:',
        err
      )


      setError(
        'Unable to get prediction from backend.'
      )

    } finally {

      setLoading(false)

    }

  }


  // =======================================================
  // DISPLAY DATA
  // =======================================================

  const forecastData =
    buildForecastData(
      prediction?.risk_score || 0
    )


  const scenarioSummary =
    getScenarioSummary(
      prediction
    )


  const transitionData =
    prediction
      ?.transition_probabilities

      ? Object.entries(
          prediction
            .transition_probabilities
        ).map(
          ([stage, probability]) => ({

            stage,

            probability:
              Number(
                probability
              ) || 0,

          })
        )

      : []


  // =======================================================
  // PAGE
  // =======================================================

  return (
    <>

      {/* HEADER */}

      <div className="page-header">

        <h1>
          AI Threat Forecast
        </h1>

        <p>
          Predictive cyber-threat analysis
          using network telemetry and
          attack progression modelling
        </p>

      </div>


      {/* INPUT CARD */}

      <div className="prediction-card">

        <div className="chart-header">

          <h3>
            Network Traffic Input
          </h3>

          <p>
            Enter network telemetry values
            or select a test scenario
          </p>

        </div>


        {/* PRESETS */}

        <div className="preset-buttons">

          <button
            type="button"

            className={
              selectedPreset === 'normal'
                ? 'preset-active'
                : ''
            }

            onClick={() =>
              applyPreset('normal')
            }

            disabled={loading}
          >
            Normal Traffic
          </button>


          <button
            type="button"

            className={
              selectedPreset ===
              'reconnaissance'
                ? 'preset-active'
                : ''
            }

            onClick={() =>
              applyPreset(
                'reconnaissance'
              )
            }

            disabled={loading}
          >
            Reconnaissance
          </button>


          <button
            type="button"

            className={
              selectedPreset ===
              'suspicious'
                ? 'preset-active'
                : ''
            }

            onClick={() =>
              applyPreset(
                'suspicious'
              )
            }

            disabled={loading}
          >
            Suspicious Activity
          </button>

        </div>


        <form
          className="forecast-input-form"
          onSubmit={handlePrediction}
        >

          {/* NETWORK */}

          <h4 className="forecast-section-title">
            Network Flow Features
          </h4>


          <div className="forecast-input-grid">

            <InputField
              label="Flow Duration"
              name="flow_duration"
              value={formData.flow_duration}
              onChange={handleChange}
            />

            <InputField
              label="Header Length"
              name="header_length"
              value={formData.header_length}
              onChange={handleChange}
            />

            <InputField
              label="Protocol Type"
              name="protocol_type"
              value={formData.protocol_type}
              onChange={handleChange}
            />

            <InputField
              label="Duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            />

            <InputField
              label="Rate"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
            />

            <InputField
              label="Source Rate"
              name="srate"
              value={formData.srate}
              onChange={handleChange}
            />

            <InputField
              label="Destination Rate"
              name="drate"
              value={formData.drate}
              onChange={handleChange}
            />

            <InputField
              label="SYN Flag"
              name="syn_flag_number"
              value={formData.syn_flag_number}
              onChange={handleChange}
            />

            <InputField
              label="RST Flag"
              name="rst_flag_number"
              value={formData.rst_flag_number}
              onChange={handleChange}
            />

            <InputField
              label="PSH Flag"
              name="psh_flag_number"
              value={formData.psh_flag_number}
              onChange={handleChange}
            />

            <InputField
              label="ACK Flag"
              name="ack_flag_number"
              value={formData.ack_flag_number}
              onChange={handleChange}
            />

            <InputField
              label="ACK Count"
              name="ack_count"
              value={formData.ack_count}
              onChange={handleChange}
            />

            <InputField
              label="SYN Count"
              name="syn_count"
              value={formData.syn_count}
              onChange={handleChange}
            />

            <InputField
              label="FIN Count"
              name="fin_count"
              value={formData.fin_count}
              onChange={handleChange}
            />

          </div>


          {/* PROTOCOL */}

          <h4 className="forecast-section-title">
            Protocol Features
          </h4>


          <div className="forecast-input-grid">

            <InputField
              label="HTTP"
              name="http"
              value={formData.http}
              onChange={handleChange}
            />

            <InputField
              label="HTTPS"
              name="https"
              value={formData.https}
              onChange={handleChange}
            />

            <InputField
              label="DNS"
              name="dns"
              value={formData.dns}
              onChange={handleChange}
            />

            <InputField
              label="SSH"
              name="ssh"
              value={formData.ssh}
              onChange={handleChange}
            />

            <InputField
              label="TCP"
              name="tcp"
              value={formData.tcp}
              onChange={handleChange}
            />

            <InputField
              label="UDP"
              name="udp"
              value={formData.udp}
              onChange={handleChange}
            />

          </div>


          {/* PACKET STATS */}

          <h4 className="forecast-section-title">
            Packet Statistics
          </h4>


          <div className="forecast-input-grid">

            <InputField
              label="Total Sum"
              name="tot_sum"
              value={formData.tot_sum}
              onChange={handleChange}
            />

            <InputField
              label="Minimum"
              name="min"
              value={formData.min}
              onChange={handleChange}
            />

            <InputField
              label="Maximum"
              name="max"
              value={formData.max}
              onChange={handleChange}
            />

            <InputField
              label="Average"
              name="avg"
              value={formData.avg}
              onChange={handleChange}
            />

            <InputField
              label="Standard Deviation"
              name="std"
              value={formData.std}
              onChange={handleChange}
            />

            <InputField
              label="Total Size"
              name="tot_size"
              value={formData.tot_size}
              onChange={handleChange}
            />

            <InputField
              label="IAT"
              name="iat"
              value={formData.iat}
              onChange={handleChange}
            />

            <InputField
              label="Number"
              name="number"
              value={formData.number}
              onChange={handleChange}
            />

            <InputField
              label="Magnitude"
              name="magnitude"
              value={formData.magnitude}
              onChange={handleChange}
            />

            <InputField
              label="Radius"
              name="radius"
              value={formData.radius}
              onChange={handleChange}
            />

            <InputField
              label="Covariance"
              name="covariance"
              value={formData.covariance}
              onChange={handleChange}
            />

            <InputField
              label="Variance"
              name="variance"
              value={formData.variance}
              onChange={handleChange}
            />

            <InputField
              label="Weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
            />

          </div>


          {/* BEHAVIOUR */}

          <h4 className="forecast-section-title">
            Behavioural Indicators
          </h4>


          <div className="forecast-input-grid">

            <InputField
              label="Failed Logins"
              name="failed_logins"
              value={formData.failed_logins}
              onChange={handleChange}
            />

            <InputField
              label="Port Scans"
              name="port_scans"
              value={formData.port_scans}
              onChange={handleChange}
            />

            <InputField
              label="Process Creation"
              name="process_creation"
              value={formData.process_creation}
              onChange={handleChange}
            />

            <InputField
              label="Privilege Changes"
              name="privilege_changes"
              value={formData.privilege_changes}
              onChange={handleChange}
            />

            <InputField
              label="Internal Connections"
              name="internal_connections"
              value={formData.internal_connections}
              onChange={handleChange}
            />

            <InputField
              label="Outbound Bytes"
              name="outbound_bytes"
              value={formData.outbound_bytes}
              onChange={handleChange}
            />

          </div>


          <button
            className="run-prediction-btn"
            type="submit"
            disabled={loading}
          >

            {
              loading
                ? 'Running Prediction...'
                : 'Run Prediction'
            }

          </button>

        </form>

      </div>


      {/* LIVE PREDICTION */}

      <div className="prediction-card">

        <div className="chart-header">

          <h3>
            Live ML Prediction
          </h3>

          <p>
            Prediction generated by the
            CyberForecast ML engine
          </p>

        </div>


        {loading && (
          <p>
            Running prediction...
          </p>
        )}


        {error && (
          <p>
            {error}
          </p>
        )}


        {
          !loading &&
          !error &&
          prediction && (

            <div className="live-prediction-grid">

              <PredictionItem
                label="Current Stage"
                value={
                  prediction.current_stage
                }
              />

              <PredictionItem
                label="Current Confidence"
                value={
                  `${prediction.current_confidence}%`
                }
              />

              <PredictionItem
                label="Next Stage"
                value={
                  prediction.next_stage
                }
              />

              <PredictionItem
                label="Next Confidence"
                value={
                  `${prediction.next_confidence}%`
                }
              />

              <PredictionItem
                label="Risk Level"
                value={
                  prediction.risk
                }
              />

              <PredictionItem
                label="Risk Score"
                value={
                  `${Math.round(
                    Number(
                      prediction.risk_score
                    )
                  )}%`
                }
              />

              <PredictionItem
                label="Attack Detected"
                value={
                  prediction.predicted_attack
                    ? 'Yes'
                    : 'No'
                }
              />

              <PredictionItem
                label="Attack Type"
                value={
                  prediction.predicted_attack_type ||
                  'None'
                }
              />

            </div>

          )
        }


        {
          !loading &&
          !error &&
          prediction && (

            <div className="recommended-action">

              <span>
                Recommended Action
              </span>

              <p>
                {
                  prediction.recommended_action
                }
              </p>

            </div>

          )
        }

      </div>


      {/* SCENARIO SUMMARY */}

      {
        prediction &&
        scenarioSummary && (

          <div className="scenario-summary-card">

            <div className="scenario-summary-header">

              <ShieldAlert
                size={24}
              />

              <div>

                <span>
                  AI Analysis Summary
                </span>

                <h3>
                  {
                    scenarioSummary.title
                  }
                </h3>

              </div>

            </div>


            <p className="scenario-summary-description">

              {
                scenarioSummary.description
              }

            </p>


            <div className="scenario-summary-details">

              <div>

                <span>
                  Current Stage
                </span>

                <strong>
                  {
                    prediction.current_stage
                  }
                </strong>

              </div>


              <div>

                <span>
                  Predicted Next Stage
                </span>

                <strong>
                  {
                    prediction.next_stage
                  }
                </strong>

              </div>


              <div>

                <span>
                  Risk
                </span>

                <strong>
                  {
                    prediction.risk
                  }
                </strong>

              </div>


              <div>

                <span>
                  Next Stage Confidence
                </span>

                <strong>
                  {
                    prediction.next_confidence
                  }%
                </strong>

              </div>

            </div>


            {
              prediction.evidence?.length > 0 && (

                <div className="scenario-reason">

                  <span>
                    Main Detection Reason
                  </span>

                  <strong>
                    {
                      prediction.evidence[0]
                    }
                  </strong>

                </div>

              )
            }

          </div>

        )
      }


      {/* SUMMARY CARDS */}

      <div className="forecast-summary">

        <div className="forecast-card">

          <Brain size={26} />

          <div>

            <p>
              AI Risk Score
            </p>

            <h2>

              {
                prediction
                  ? `${Math.round(
                      Number(
                        prediction.risk_score
                      )
                    )}%`
                  : '--'
              }

            </h2>

            <span>

              {
                prediction
                  ? prediction.risk
                  : 'Waiting for prediction'
              }

            </span>

          </div>

        </div>


        <div className="forecast-card">

          <TrendingUp size={26} />

          <div>

            <p>
              Current Stage
            </p>

            <h2>

              {
                prediction
                  ? prediction.current_stage
                  : '--'
              }

            </h2>

            <span>

              {
                prediction
                  ? `Confidence: ${prediction.current_confidence}%`
                  : 'Waiting for prediction'
              }

            </span>

          </div>

        </div>


        <div className="forecast-card">

          <ShieldAlert size={26} />

          <div>

            <p>
              Predicted Attack
            </p>

            <h2>

              {
                prediction
                  ? (
                    prediction.predicted_attack
                      ? 'Detected'
                      : 'None'
                  )
                  : '--'
              }

            </h2>

            <span>

              {
                prediction
                  ?.predicted_attack_type ||
                'No attack type'
              }

            </span>

          </div>

        </div>


        <div className="forecast-card">

          <Clock size={26} />

          <div>

            <p>
              Next Stage
            </p>

            <h2>

              {
                prediction
                  ? prediction.next_stage
                  : '--'
              }

            </h2>

            <span>

              {
                prediction
                  ? `Confidence: ${prediction.next_confidence}%`
                  : 'Waiting for prediction'
              }

            </span>

          </div>

        </div>

      </div>


      {/* RISK TREND */}

      <div className="forecast-chart-card">

        <div className="chart-header">

          <h3>
            Predicted Risk Trend
          </h3>

          <p>
            Risk trend visualization based
            on the current ML risk score
          </p>

        </div>


        <div className="forecast-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={forecastData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
              />

              <YAxis
                domain={[0, 100]}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="risk"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
                strokeWidth={3}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* PROGRESSION */}

      <div className="prediction-card">

        <div className="chart-header">

          <h3>
            Attack Progression Forecast
          </h3>

          <p>
            Current and predicted attack
            stages generated by the model
          </p>

        </div>


        {
          prediction && (

            <div className="prediction-list">

              <div className="prediction-row">

                <div>

                  <h4>
                    Current Stage
                  </h4>

                  <p>
                    Detected current
                    attack behaviour
                  </p>

                </div>


                <div className="prediction-info">

                  <strong>
                    {
                      prediction.current_stage
                    }
                  </strong>

                  <span className="severity medium">

                    {
                      prediction.current_confidence
                    }%

                  </span>

                </div>

              </div>


              <div className="prediction-row">

                <div>

                  <h4>
                    Next Predicted Stage
                  </h4>

                  <p>
                    Most likely next stage
                    of attack progression
                  </p>

                </div>


                <div className="prediction-info">

                  <strong>
                    {
                      prediction.next_stage
                    }
                  </strong>

                  <span className="severity high">

                    {
                      prediction.next_confidence
                    }%

                  </span>

                </div>

              </div>


              <div className="prediction-row">

                <div>

                  <h4>
                    Overall Risk
                  </h4>

                  <p>
                    Risk calculated from
                    attack progression
                    and behaviour
                  </p>

                </div>


                <div className="prediction-info">

                  <strong>
                    {
                      prediction.risk
                    }
                  </strong>

                  <span
                    className={
                      `severity ${
                        prediction.risk
                          ?.toLowerCase() ||
                        'low'
                      }`
                    }
                  >

                    {
                      Math.round(
                        Number(
                          prediction.risk_score
                        )
                      )
                    }%

                  </span>

                </div>

              </div>

            </div>

          )
        }

      </div>


      {/* EVIDENCE */}

      <div className="prediction-card">

        <div className="chart-header">

          <h3>
            Detection Evidence
          </h3>

          <p>
            Behavioural indicators used
            to explain the forecast
          </p>

        </div>


        {
          prediction?.evidence?.length

            ? (

              <div className="evidence-list">

                {
                  prediction.evidence.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="evidence-item"

                        key={
                          `${item}-${index}`
                        }
                      >

                        <ShieldAlert
                          size={18}
                        />

                        <span>
                          {item}
                        </span>

                      </div>

                    )
                  )
                }

              </div>

            )

            : (

              <p>
                No strong threat indicators detected.
              </p>

            )
        }

      </div>


      {/* PROBABILITY CHART */}

      <div className="forecast-chart-card">

        <div className="chart-header">

          <h3>
            Attack Stage Probabilities
          </h3>

          <p>
            Probability distribution
            for the next possible
            attack stage
          </p>

        </div>


        <div className="forecast-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={transitionData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="stage"
                interval={0}
              />

              <YAxis
                domain={[0, 100]}
              />

              <Tooltip />

              <Bar
                dataKey="probability"
                fill="#8b5cf6"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </>
  )
}


// =========================================================
// INPUT FIELD
// =========================================================

function InputField({
  label,
  name,
  value,
  onChange,
}) {

  return (

    <div className="forecast-input">

      <label>
        {label}
      </label>

      <input
        type="number"
        step="any"
        name={name}
        value={value}
        onChange={onChange}
      />

    </div>

  )
}


// =========================================================
// PREDICTION ITEM
// =========================================================

function PredictionItem({
  label,
  value,
}) {

  return (

    <div className="live-prediction-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  )
}


export default Forecast