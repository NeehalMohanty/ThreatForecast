import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Activity,
  Wifi,
  Network,
  ShieldCheck,
  ShieldAlert,
  Server,
  Radio,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'


// =========================================================
// RANDOM HELPERS
// =========================================================

const randomBetween = (
  minimum,
  maximum
) => {
  return Math.floor(
    Math.random() *
    (maximum - minimum + 1)
  ) + minimum
}


const formatTime = () => {
  return new Date().toLocaleTimeString()
}


// =========================================================
// INITIAL TRAFFIC HISTORY
// =========================================================

const createInitialTraffic = () => {
  return Array.from(
    { length: 12 },
    (_, index) => ({
      time: `${index + 1}`,

      incoming:
        randomBetween(
          30,
          75
        ),

      outgoing:
        randomBetween(
          15,
          55
        ),
    })
  )
}


// =========================================================
// MONITORING PAGE
// =========================================================

function Monitoring() {
  const [
    monitoring,
    setMonitoring,
  ] = useState(true)

  const [
    trafficData,
    setTrafficData,
  ] = useState(
    createInitialTraffic()
  )

  const [
    networkStats,
    setNetworkStats,
  ] = useState({
    incoming: 52,
    outgoing: 31,
    connections: 148,
    packets: 28450,
  })

  const [
    activityFeed,
    setActivityFeed,
  ] = useState([])

  const [
    latestPrediction,
    setLatestPrediction,
  ] = useState(null)

  const [
    history,
    setHistory,
  ] = useState([])


  // =======================================================
  // LOAD CYBERFORECAST DATA
  // =======================================================

  useEffect(() => {
    const loadStoredData = () => {
      try {
        const savedPrediction =
          localStorage.getItem(
            'latestCyberForecast'
          )

        const savedHistory =
          localStorage.getItem(
            'cyberForecastHistory'
          )


        if (savedPrediction) {
          setLatestPrediction(
            JSON.parse(
              savedPrediction
            )
          )
        }


        if (savedHistory) {
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
        }

      } catch (error) {
        console.error(
          'Unable to load monitoring data:',
          error
        )
      }
    }


    loadStoredData()
  }, [])


  // =======================================================
  // SIMULATED LIVE NETWORK FEED
  // =======================================================

  useEffect(() => {
    if (!monitoring) {
      return
    }


    const interval =
      setInterval(() => {

        const newIncoming =
          randomBetween(
            35,
            95
          )

        const newOutgoing =
          randomBetween(
            20,
            70
          )

        const newConnections =
          randomBetween(
            120,
            230
          )


        setNetworkStats(
          (previous) => ({
            incoming:
              newIncoming,

            outgoing:
              newOutgoing,

            connections:
              newConnections,

            packets:
              previous.packets +
              randomBetween(
                300,
                1200
              ),
          })
        )


        setTrafficData(
          (previous) => {

            const updated = [
              ...previous.slice(-11),

              {
                time:
                  formatTime(),

                incoming:
                  newIncoming,

                outgoing:
                  newOutgoing,
              },
            ]


            return updated
          }
        )


        const possibleEvents = [
          {
            type: 'Network',
            message:
              `${newConnections} active connections observed`,
          },

          {
            type: 'Traffic',
            message:
              `Incoming traffic ${newIncoming} Mbps`,
          },

          {
            type: 'Traffic',
            message:
              `Outgoing traffic ${newOutgoing} Mbps`,
          },

          {
            type: 'System',
            message:
              'Network telemetry processed successfully',
          },
        ]


        const selectedEvent =
          possibleEvents[
            randomBetween(
              0,
              possibleEvents.length - 1
            )
          ]


        const event = {
          id:
            `${Date.now()}-${Math.random()}`,

          time:
            formatTime(),

          ...selectedEvent,
        }


        setActivityFeed(
          (previous) => [
            event,
            ...previous,
          ].slice(
            0,
            8
          )
        )

      }, 3000)


    return () =>
      clearInterval(
        interval
      )

  }, [monitoring])


  // =======================================================
  // THREAT STATISTICS
  // =======================================================

  const detectedThreats =
    useMemo(() => {

      return history.filter(
        (item) =>
          item.predicted_attack
      ).length

    }, [history])


  const criticalThreats =
    useMemo(() => {

      return history.filter(
        (item) =>
          item.risk ===
          'CRITICAL'
      ).length

    }, [history])


  const latestRisk =
    latestPrediction?.risk ||
    'UNKNOWN'


  const latestRiskScore =
    Math.round(
      Number(
        latestPrediction
          ?.risk_score
      ) || 0
    )


  // =======================================================
  // SECURITY STATUS
  // =======================================================

  const securityStatus =
    latestRisk === 'CRITICAL'
      ? 'Critical Threat'
      : latestRisk === 'HIGH'
        ? 'High Risk'
        : latestRisk === 'MEDIUM'
          ? 'Elevated'
          : 'Stable'


  // =======================================================
  // PAGE
  // =======================================================

  return (
    <>

      {/* HEADER */}

      <div className="page-header monitoring-page-header">

        <div>

          <h1>
            Network Monitoring
          </h1>

          <p>
            Real-time demonstration of
            network telemetry and
            CyberForecast threat status
          </p>

        </div>


        <button
          className={
            monitoring
              ? 'monitor-toggle active'
              : 'monitor-toggle'
          }

          onClick={() =>
            setMonitoring(
              (current) =>
                !current
            )
          }
        >

          <Radio
            size={17}
          />

          {
            monitoring
              ? 'Monitoring Active'
              : 'Monitoring Paused'
          }

        </button>

      </div>


      {/* LIVE STATUS */}

      <div className="monitor-live-strip">

        <div className="monitor-live-left">

          <span
            className={
              monitoring
                ? 'monitor-pulse'
                : 'monitor-pulse paused'
            }
          />

          <strong>
            {
              monitoring
                ? 'LIVE TELEMETRY'
                : 'MONITORING PAUSED'
            }
          </strong>

        </div>


        <span>
          Demo telemetry simulation
        </span>

      </div>


      {/* STAT CARDS */}

      <div className="monitor-stats-grid">

        <MonitorStatCard
          title="Incoming Traffic"

          value={
            `${networkStats.incoming} Mbps`
          }

          icon={ArrowDown}

          description="Current simulated inbound traffic"
        />


        <MonitorStatCard
          title="Outgoing Traffic"

          value={
            `${networkStats.outgoing} Mbps`
          }

          icon={ArrowUp}

          description="Current simulated outbound traffic"
        />


        <MonitorStatCard
          title="Active Connections"

          value={
            networkStats.connections
          }

          icon={Network}

          description="Observed network sessions"
        />


        <MonitorStatCard
          title="Packets Processed"

          value={
            networkStats.packets
              .toLocaleString()
          }

          icon={Activity}

          description="Telemetry packets processed"
        />

      </div>


      {/* SECURITY STATUS */}

      <div className="monitor-security-grid">

        <div className="monitor-security-card">

          <div className="monitor-security-icon">

            {
              latestRisk === 'CRITICAL' ||
              latestRisk === 'HIGH'

                ? (
                  <ShieldAlert
                    size={26}
                  />
                )

                : (
                  <ShieldCheck
                    size={26}
                  />
                )
            }

          </div>


          <div>

            <span>
              CyberForecast Status
            </span>

            <h3>
              {securityStatus}
            </h3>

            <p>
              Latest AI risk level:
              {' '}
              <strong>
                {latestRisk}
              </strong>
            </p>

          </div>

        </div>


        <div className="monitor-security-card">

          <Server
            size={25}
          />

          <div>

            <span>
              Latest Risk Score
            </span>

            <h3>
              {latestRiskScore}%
            </h3>

            <p>
              Based on latest
              CyberForecast analysis
            </p>

          </div>

        </div>


        <div className="monitor-security-card">

          <ShieldAlert
            size={25}
          />

          <div>

            <span>
              Detected Analyses
            </span>

            <h3>
              {detectedThreats}
            </h3>

            <p>
              Historical attack-positive
              predictions
            </p>

          </div>

        </div>


        <div className="monitor-security-card">

          <Wifi
            size={25}
          />

          <div>

            <span>
              Critical Alerts
            </span>

            <h3>
              {criticalThreats}
            </h3>

            <p>
              Critical-risk predictions
              in history
            </p>

          </div>

        </div>

      </div>


      {/* TRAFFIC CHART */}

      <div className="forecast-chart-card">

        <div className="chart-header">

          <h3>
            Live Network Activity
          </h3>

          <p>
            Simulated incoming and
            outgoing traffic for
            demonstration
          </p>

        </div>


        <div className="monitor-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={
                trafficData
              }
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
              />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"

                dataKey="incoming"

                stroke="#8b5cf6"

                strokeWidth={2}

                dot={false}
              />

              <Line
                type="monotone"

                dataKey="outgoing"

                stroke="#22c55e"

                strokeWidth={2}

                dot={false}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>


        <div className="monitor-chart-legend">

          <span>
            <i className="legend-dot incoming" />
            Incoming
          </span>

          <span>
            <i className="legend-dot outgoing" />
            Outgoing
          </span>

        </div>

      </div>


      {/* BOTTOM GRID */}

      <div className="monitor-bottom-grid">

        {/* LIVE EVENT FEED */}

        <div className="prediction-card">

          <div className="chart-header">

            <h3>
              Live Activity Feed
            </h3>

            <p>
              Recent monitoring events
            </p>

          </div>


          <div className="monitor-feed">

            {
              activityFeed.length > 0

                ? activityFeed.map(
                    (event) => (

                      <div
                        className="monitor-feed-item"

                        key={
                          event.id
                        }
                      >

                        <div className="monitor-feed-icon">

                          <Activity
                            size={15}
                          />

                        </div>


                        <div className="monitor-feed-content">

                          <strong>
                            {
                              event.type
                            }
                          </strong>

                          <span>
                            {
                              event.message
                            }
                          </span>

                        </div>


                        <small>
                          {
                            event.time
                          }
                        </small>

                      </div>

                    )
                  )

                : (

                  <div className="monitor-feed-empty">

                    Waiting for
                    telemetry events...

                  </div>

                )
            }

          </div>

        </div>


        {/* LATEST AI RESULT */}

        <div className="prediction-card">

          <div className="chart-header">

            <h3>
              Latest AI Assessment
            </h3>

            <p>
              Shared with Forecast and
              Dashboard
            </p>

          </div>


          {
            latestPrediction

              ? (

                <div className="monitor-ai-details">

                  <MonitorDetail
                    label="Current Stage"

                    value={
                      latestPrediction
                        .current_stage
                    }
                  />


                  <MonitorDetail
                    label="Next Stage"

                    value={
                      latestPrediction
                        .next_stage
                    }
                  />


                  <MonitorDetail
                    label="Next Confidence"

                    value={
                      `${latestPrediction
                        .next_confidence}%`
                    }
                  />


                  <MonitorDetail
                    label="Risk"

                    value={
                      latestPrediction
                        .risk
                    }
                  />


                  <div className="monitor-ai-action">

                    <span>
                      Recommended Action
                    </span>

                    <p>
                      {
                        latestPrediction
                          .recommended_action
                      }
                    </p>

                  </div>

                </div>

              )

              : (

                <p>
                  Run a Forecast analysis
                  to populate this section.
                </p>

              )
          }

        </div>

      </div>

    </>
  )
}


// =========================================================
// STAT CARD COMPONENT
// =========================================================

function MonitorStatCard({
  title,
  value,
  icon: Icon,
  description,
}) {

  return (

    <div className="monitor-stat-card">

      <div className="monitor-stat-top">

        <div className="monitor-stat-icon">

          <Icon
            size={21}
          />

        </div>


        <span>
          {title}
        </span>

      </div>


      <h2>
        {value}
      </h2>


      <p>
        {description}
      </p>

    </div>

  )
}


// =========================================================
// DETAIL COMPONENT
// =========================================================

function MonitorDetail({
  label,
  value,
}) {

  return (

    <div className="monitor-ai-detail">

      <span>
        {label}
      </span>

      <strong>
        {value || 'Unknown'}
      </strong>

    </div>

  )
}


export default Monitoring