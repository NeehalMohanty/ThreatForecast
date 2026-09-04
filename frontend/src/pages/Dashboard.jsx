import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ShieldAlert,
  Activity,
  Brain,
  TrendingUp,
  Database,
  AlertTriangle,
} from 'lucide-react'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

import StatCard from '../components/StatCard'

import {
  getHealth,
} from '../services/api'


// =========================================================
// FORMAT TIME
// =========================================================

const formatTime = (
  timestamp
) => {

  if (!timestamp) {
    return 'Unknown'
  }


  const date =
    new Date(timestamp)


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown'
  }


  return date.toLocaleString()
}


// =========================================================
// DASHBOARD
// =========================================================

function Dashboard() {
  const [
    health,
    setHealth,
  ] = useState(null)

  const [
    prediction,
    setPrediction,
  ] = useState(null)

  const [
    history,
    setHistory,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState(null)


  // =======================================================
  // LOAD DASHBOARD
  // =======================================================

  useEffect(() => {

    const loadDashboard =
      async () => {

        try {

          setLoading(true)


          const healthData =
            await getHealth()


          setHealth(
            healthData
          )


          // =============================================
          // LATEST PREDICTION
          // =============================================

          const savedPrediction =
            localStorage.getItem(
              'latestCyberForecast'
            )


          if (savedPrediction) {

            try {

              setPrediction(
                JSON.parse(
                  savedPrediction
                )
              )

            } catch (
              parseError
            ) {

              console.error(
                'Latest prediction parse error:',
                parseError
              )

            }

          }


          // =============================================
          // HISTORY
          // =============================================

          const savedHistory =
            localStorage.getItem(
              'cyberForecastHistory'
            )


          if (savedHistory) {

            try {

              const parsedHistory =
                JSON.parse(
                  savedHistory
                )


              if (
                Array.isArray(
                  parsedHistory
                )
              ) {

                setHistory(
                  parsedHistory
                )

              }

            } catch (
              parseError
            ) {

              console.error(
                'History parse error:',
                parseError
              )

            }

          }


          setError(null)

        } catch (err) {

          console.error(
            'Dashboard loading failed:',
            err
          )


          setError(
            'Unable to connect to CyberForecast backend.'
          )

        } finally {

          setLoading(false)

        }

      }


    loadDashboard()

  }, [])


  // =======================================================
  // ANALYTICS
  // =======================================================

  const totalAnalyses =
    history.length


  const detectedThreats =
    useMemo(
      () =>
        history.filter(
          (item) =>
            item.predicted_attack
        ).length,

      [history]
    )


  const criticalAlerts =
    useMemo(
      () =>
        history.filter(
          (item) =>
            item.risk ===
            'CRITICAL'
        ).length,

      [history]
    )


  const attackRate =
    totalAnalyses > 0

      ? Math.round(
          (
            detectedThreats /
            totalAnalyses
          ) * 100
        )

      : 0


  const riskScore =
    Math.round(
      Number(
        prediction
          ?.risk_score
      ) || 0
    )


  // =======================================================
  // HISTORY CHART DATA
  // =======================================================

  const historyChartData =
    useMemo(() => {

      return history
        .slice(
          0,
          10
        )
        .reverse()
        .map(
          (
            item,
            index
          ) => ({

            analysis:
              `#${index + 1}`,

            risk:
              Number(
                item.risk_score
              ) || 0,

          })
        )

    }, [history])


  // =======================================================
  // RISK DISTRIBUTION
  // =======================================================

  const riskDistribution =
    useMemo(() => {

      const riskLevels = [
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
      ]


      return riskLevels.map(
        (risk) => ({

          risk,

          count:
            history.filter(
              (item) =>
                item.risk ===
                risk
            ).length,

        })
      )

    }, [history])


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="page-header">

        <h1>
          CyberForecast Dashboard
        </h1>

        <p>
          Loading system analytics...
        </p>

      </div>

    )
  }


  // =======================================================
  // ERROR
  // =======================================================

  if (error) {

    return (

      <div className="page-header">

        <h1>
          CyberForecast Dashboard
        </h1>

        <p>
          {error}
        </p>

      </div>

    )
  }


  // =======================================================
  // PAGE
  // =======================================================

  return (
    <>

      {/* HEADER */}

      <div className="page-header">

        <h1>
          CyberForecast Dashboard
        </h1>

        <p>
          AI-driven cyber threat
          monitoring, forecasting and
          historical threat analytics
        </p>

      </div>


      {/* SYSTEM STATUS */}

      <div className="dashboard-status">

        <span
          className={
            health?.status ===
            'healthy'

              ? 'status-dot online'

              : 'status-dot offline'
          }
        />


        <span>

          Backend:
          {' '}

          {
            health?.status ||
            'offline'
          }

        </span>


        <span className="dashboard-model-status">

          ML Model:
          {' '}

          {
            health
              ?.model_status ||
            'unknown'
          }

        </span>

      </div>


      {/* PRIMARY STATS */}

      <div className="stats-grid">

        <StatCard
          title="Latest Risk"

          value={
            `${riskScore}%`
          }

          icon={Brain}
        />


        <StatCard
          title="Total Analyses"

          value={
            totalAnalyses
          }

          icon={Database}
        />


        <StatCard
          title="Detected Threats"

          value={
            detectedThreats
          }

          icon={ShieldAlert}
        />


        <StatCard
          title="Critical Alerts"

          value={
            criticalAlerts
          }

          icon={AlertTriangle}
        />

      </div>


      {/* SECONDARY STATS */}

      <div className="dashboard-secondary-stats">

        <div className="dashboard-mini-stat">

          <span>
            Attack Detection Rate
          </span>

          <strong>
            {attackRate}%
          </strong>

        </div>


        <div className="dashboard-mini-stat">

          <span>
            Current Stage
          </span>

          <strong>
            {
              prediction
                ?.current_stage ||
              'Unknown'
            }
          </strong>

        </div>


        <div className="dashboard-mini-stat">

          <span>
            Predicted Next Stage
          </span>

          <strong>
            {
              prediction
                ?.next_stage ||
              'Unknown'
            }
          </strong>

        </div>


        <div className="dashboard-mini-stat">

          <span>
            Latest Risk Level
          </span>

          <strong>
            {
              prediction
                ?.risk ||
              'Unknown'
            }
          </strong>

        </div>

      </div>


      {/* LATEST ANALYSIS */}

      {
        prediction && (

          <div className="prediction-card">

            <div className="chart-header">

              <h3>
                Latest Threat Assessment
              </h3>

              <p>
                Most recent analysis
                generated by CyberForecast
              </p>

            </div>


            <div className="live-prediction-grid">

              <DashboardDetail
                label="Current Stage"

                value={
                  prediction
                    .current_stage
                }
              />


              <DashboardDetail
                label="Current Confidence"

                value={
                  `${prediction
                    .current_confidence}%`
                }
              />


              <DashboardDetail
                label="Next Stage"

                value={
                  prediction
                    .next_stage
                }
              />


              <DashboardDetail
                label="Next Confidence"

                value={
                  `${prediction
                    .next_confidence}%`
                }
              />


              <DashboardDetail
                label="Risk"

                value={
                  prediction.risk
                }
              />


              <DashboardDetail
                label="Risk Score"

                value={
                  `${riskScore}%`
                }
              />


              <DashboardDetail
                label="Threat Status"

                value={
                  prediction
                    .predicted_attack

                    ? 'Detected'

                    : 'Clear'
                }
              />


              <DashboardDetail
                label="Last Updated"

                value={
                  formatTime(
                    prediction
                      .timestamp
                  )
                }
              />

            </div>


            <div className="recommended-action">

              <span>
                Recommended Action
              </span>

              <p>
                {
                  prediction
                    .recommended_action
                }
              </p>

            </div>

          </div>

        )
      }


      {/* ANALYTICS GRID */}

      <div className="dashboard-chart-grid">

        {/* HISTORY */}

        <div className="forecast-chart-card">

          <div className="chart-header">

            <h3>
              Recent Risk History
            </h3>

            <p>
              Risk score from the latest
              ten analyses
            </p>

          </div>


          <div className="dashboard-chart">

            {
              historyChartData.length > 0

                ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={
                        historyChartData
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="analysis"
                      />

                      <YAxis
                        domain={[
                          0,
                          100,
                        ]}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"

                        dataKey="risk"

                        stroke="#8b5cf6"

                        strokeWidth={3}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                )

                : (

                  <div className="dashboard-empty-chart">
                    Run Forecast analyses
                    to build risk history.
                  </div>

                )
            }

          </div>

        </div>


        {/* DISTRIBUTION */}

        <div className="forecast-chart-card">

          <div className="chart-header">

            <h3>
              Risk Distribution
            </h3>

            <p>
              Historical analyses grouped
              by risk category
            </p>

          </div>


          <div className="dashboard-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  riskDistribution
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="risk"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Bar
                  dataKey="count"

                  fill="#8b5cf6"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      {/* EVIDENCE */}

      <div className="prediction-card">

        <div className="chart-header">

          <h3>
            Latest Detection Evidence
          </h3>

          <p>
            Behavioural indicators behind
            the current assessment
          </p>

        </div>


        {
          prediction
            ?.evidence
            ?.length

            ? (

              <div className="evidence-list">

                {
                  prediction
                    .evidence
                    .map(
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

                          <Activity
                            size={17}
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
                No strong detection
                evidence available.
              </p>

            )
        }

      </div>

    </>
  )
}


// =========================================================
// DETAIL COMPONENT
// =========================================================

function DashboardDetail({
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


export default Dashboard