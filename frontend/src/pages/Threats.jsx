import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ShieldAlert,
  Trash2,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Brain,
  Clock,
} from 'lucide-react'


// =========================================================
// FORMAT SCENARIO
// =========================================================

const formatScenario = (
  scenario
) => {

  if (scenario === 'normal') {
    return 'Normal Traffic'
  }


  if (
    scenario ===
    'reconnaissance'
  ) {
    return 'Reconnaissance'
  }


  if (
    scenario ===
    'suspicious'
  ) {
    return 'Suspicious Activity'
  }


  return 'Custom Analysis'
}


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
// ARE RECORDS DUPLICATES?
// =========================================================

const areDuplicateThreats = (
  firstThreat,
  secondThreat
) => {

  if (
    !firstThreat ||
    !secondThreat
  ) {
    return false
  }


  const samePrediction =
    firstThreat.scenario ===
      secondThreat.scenario &&

    firstThreat.current_stage ===
      secondThreat.current_stage &&

    firstThreat.next_stage ===
      secondThreat.next_stage &&

    firstThreat.risk ===
      secondThreat.risk &&

    Number(
      firstThreat.risk_score
    ) ===
      Number(
        secondThreat.risk_score
      )


  if (!samePrediction) {
    return false
  }


  const firstTime =
    new Date(
      firstThreat.timestamp
    ).getTime()


  const secondTime =
    new Date(
      secondThreat.timestamp
    ).getTime()


  if (
    Number.isNaN(firstTime) ||
    Number.isNaN(secondTime)
  ) {
    return false
  }


  const timeDifference =
    Math.abs(
      firstTime -
      secondTime
    )


  return (
    timeDifference < 3000
  )
}


// =========================================================
// CLEAN DUPLICATES
// =========================================================

const cleanDuplicateHistory = (
  history
) => {

  const cleanedHistory = []


  history.forEach(
    (threat) => {

      const duplicate =
        cleanedHistory.some(
          (existingThreat) =>
            areDuplicateThreats(
              existingThreat,
              threat
            )
        )


      if (!duplicate) {

        cleanedHistory.push(
          threat
        )

      }

    }
  )


  return cleanedHistory
}


// =========================================================
// THREATS PAGE
// =========================================================

function Threats() {
  const [threats, setThreats] =
    useState([])

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const [
    riskFilter,
    setRiskFilter,
  ] = useState('ALL')

  const [
    scenarioFilter,
    setScenarioFilter,
  ] = useState('ALL')

  const [
    expandedThreat,
    setExpandedThreat,
  ] = useState(null)


  // =======================================================
  // LOAD + CLEAN HISTORY
  // =======================================================

  useEffect(() => {

    const loadHistory = () => {

      try {

        const savedHistory =
          localStorage.getItem(
            'cyberForecastHistory'
          )


        if (!savedHistory) {

          setThreats([])

          return

        }


        const parsedHistory =
          JSON.parse(
            savedHistory
          )


        if (
          !Array.isArray(
            parsedHistory
          )
        ) {

          setThreats([])

          return

        }


        // Remove any duplicates
        // already saved before this fix.

        const cleanedHistory =
          cleanDuplicateHistory(
            parsedHistory
          )


        setThreats(
          cleanedHistory
        )


        // Replace old storage with
        // the cleaned version.

        localStorage.setItem(
          'cyberForecastHistory',
          JSON.stringify(
            cleanedHistory
          )
        )

      } catch (error) {

        console.error(
          'Failed to read threat history:',
          error
        )


        setThreats([])

      }

    }


    loadHistory()

  }, [])


  // =======================================================
  // COUNTS
  // =======================================================

  const totalThreats =
    threats.length


  const criticalCount =
    threats.filter(
      (threat) =>
        threat.risk ===
        'CRITICAL'
    ).length


  const highCount =
    threats.filter(
      (threat) =>
        threat.risk ===
        'HIGH'
    ).length


  const mediumCount =
    threats.filter(
      (threat) =>
        threat.risk ===
        'MEDIUM'
    ).length


  const lowCount =
    threats.filter(
      (threat) =>
        threat.risk ===
        'LOW'
    ).length


  // =======================================================
  // FILTER DATA
  // =======================================================

  const filteredThreats =
    useMemo(() => {

      return threats.filter(
        (threat) => {

          const scenario =
            formatScenario(
              threat.scenario
            ).toLowerCase()


          const currentStage =
            (
              threat.current_stage ||
              ''
            ).toLowerCase()


          const nextStage =
            (
              threat.next_stage ||
              ''
            ).toLowerCase()


          const risk =
            (
              threat.risk ||
              ''
            ).toLowerCase()


          const search =
            searchTerm
              .trim()
              .toLowerCase()


          const matchesSearch =
            search === '' ||

            scenario.includes(
              search
            ) ||

            currentStage.includes(
              search
            ) ||

            nextStage.includes(
              search
            ) ||

            risk.includes(
              search
            )


          const matchesRisk =
            riskFilter === 'ALL' ||

            threat.risk ===
              riskFilter


          const matchesScenario =
            scenarioFilter ===
              'ALL' ||

            threat.scenario ===
              scenarioFilter


          return (
            matchesSearch &&
            matchesRisk &&
            matchesScenario
          )

        }
      )

    }, [
      threats,
      searchTerm,
      riskFilter,
      scenarioFilter,
    ])


  // =======================================================
  // SAVE HISTORY
  // =======================================================

  const saveHistory = (
    updatedThreats
  ) => {

    setThreats(
      updatedThreats
    )


    localStorage.setItem(
      'cyberForecastHistory',
      JSON.stringify(
        updatedThreats
      )
    )
  }


  // =======================================================
  // DELETE ONE
  // =======================================================

  const deleteThreat = (
    threatId
  ) => {

    const updatedThreats =
      threats.filter(
        (threat) =>
          threat.id !==
          threatId
      )


    saveHistory(
      updatedThreats
    )


    if (
      expandedThreat ===
      threatId
    ) {

      setExpandedThreat(
        null
      )

    }

  }


  // =======================================================
  // CLEAR ALL
  // =======================================================

  const clearHistory = () => {

    localStorage.removeItem(
      'cyberForecastHistory'
    )


    setThreats([])


    setExpandedThreat(
      null
    )
  }


  // =======================================================
  // EXPAND / COLLAPSE
  // =======================================================

  const toggleThreatDetails = (
    threatId
  ) => {

    setExpandedThreat(
      (
        currentExpanded
      ) =>

        currentExpanded ===
        threatId

          ? null

          : threatId
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
          Threat Intelligence
        </h1>

        <p>
          Historical CyberForecast
          predictions, detected activity
          and AI threat analysis
        </p>

      </div>


      {/* SUMMARY CARDS */}

      <div className="threat-stats-grid">

        <ThreatStat
          title="Total Analyses"
          value={totalThreats}
          icon={Activity}
        />


        <ThreatStat
          title="Critical"
          value={criticalCount}
          icon={ShieldAlert}
          type="critical"
        />


        <ThreatStat
          title="High Risk"
          value={highCount}
          icon={AlertTriangle}
          type="high"
        />


        <ThreatStat
          title="Medium"
          value={mediumCount}
          icon={Brain}
          type="medium"
        />


        <ThreatStat
          title="Low Risk"
          value={lowCount}
          icon={Activity}
          type="low"
        />

      </div>


      {/* FILTER PANEL */}

      <div className="threat-filter-panel">

        <div className="threat-search">

          <Search
            size={17}
          />


          <input
            type="text"

            placeholder="Search stage, scenario or risk..."

            value={
              searchTerm
            }

            onChange={
              (event) =>
                setSearchTerm(
                  event.target.value
                )
            }
          />

        </div>


        <div className="threat-filter">

          <Filter
            size={16}
          />


          <select
            value={
              riskFilter
            }

            onChange={
              (event) =>
                setRiskFilter(
                  event.target.value
                )
            }
          >

            <option value="ALL">
              All Risks
            </option>

            <option value="CRITICAL">
              Critical
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="LOW">
              Low
            </option>

          </select>

        </div>


        <div className="threat-filter">

          <select
            value={
              scenarioFilter
            }

            onChange={
              (event) =>
                setScenarioFilter(
                  event.target.value
                )
            }
          >

            <option value="ALL">
              All Scenarios
            </option>

            <option value="normal">
              Normal Traffic
            </option>

            <option value="reconnaissance">
              Reconnaissance
            </option>

            <option value="suspicious">
              Suspicious Activity
            </option>

            <option value="custom">
              Custom Analysis
            </option>

          </select>

        </div>


        {
          threats.length > 0 && (

            <button
              className="clear-history-btn"

              onClick={
                clearHistory
              }
            >

              <Trash2
                size={16}
              />

              Clear All

            </button>

          )
        }

      </div>


      {/* RESULT COUNT */}

      {
        threats.length > 0 && (

          <div className="threat-results-info">

            Showing

            <strong>
              {' '}
              {
                filteredThreats.length
              }
              {' '}
            </strong>

            of

            <strong>
              {' '}
              {
                threats.length
              }
              {' '}
            </strong>

            predictions

          </div>

        )
      }


      {/* EMPTY HISTORY */}

      {
        threats.length === 0 && (

          <div className="prediction-card threat-empty-state">

            <ShieldAlert
              size={40}
            />

            <h3>
              No Threat History Yet
            </h3>

            <p>
              Run an analysis from
              the Forecast page.
              CyberForecast will record
              the prediction here
              automatically.
            </p>

          </div>

        )
      }


      {/* NO FILTER MATCH */}

      {
        threats.length > 0 &&
        filteredThreats.length === 0 && (

          <div className="prediction-card threat-empty-state">

            <Search
              size={34}
            />

            <h3>
              No Matching Threats
            </h3>

            <p>
              Try changing your search
              term or filters.
            </p>

          </div>

        )
      }


      {/* HISTORY TABLE */}

      {
        filteredThreats.length > 0 && (

          <div className="threat-table-card">

            <div className="threat-table-wrapper">

              <table className="threat-table">

                <thead>

                  <tr>

                    <th>
                      Scenario
                    </th>

                    <th>
                      Current Stage
                    </th>

                    <th>
                      Next Stage
                    </th>

                    <th>
                      Risk
                    </th>

                    <th>
                      Score
                    </th>

                    <th>
                      Attack
                    </th>

                    <th>
                      Time
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {
                    filteredThreats.map(
                      (
                        threat,
                        index
                      ) => {

                        const threatKey =
                          threat.id ||
                          `${threat.timestamp}-${index}`


                        return (

                          <ThreatRow
                            key={
                              threatKey
                            }

                            threat={
                              threat
                            }

                            threatKey={
                              threatKey
                            }

                            expanded={
                              expandedThreat ===
                              threatKey
                            }

                            onToggle={() =>
                              toggleThreatDetails(
                                threatKey
                              )
                            }

                            onDelete={() =>
                              deleteThreat(
                                threat.id
                              )
                            }
                          />

                        )

                      }
                    )
                  }

                </tbody>

              </table>

            </div>

          </div>

        )
      }

    </>
  )
}


// =========================================================
// THREAT ROW
// =========================================================

function ThreatRow({
  threat,
  expanded,
  onToggle,
  onDelete,
}) {

  return (
    <>

      <tr className="threat-main-row">

        <td>

          <strong>
            {
              formatScenario(
                threat.scenario
              )
            }
          </strong>

        </td>


        <td>

          {
            threat.current_stage ||
            'Unknown'
          }

        </td>


        <td>

          {
            threat.next_stage ||
            'Unknown'
          }

        </td>


        <td>

          <span
            className={
              `severity ${
                threat.risk
                  ?.toLowerCase() ||
                'low'
              }`
            }
          >

            {
              threat.risk ||
              'UNKNOWN'
            }

          </span>

        </td>


        <td>

          {
            Math.round(
              Number(
                threat.risk_score
              ) || 0
            )
          }%

        </td>


        <td>

          <span
            className={
              threat.predicted_attack
                ? 'attack-status detected'
                : 'attack-status clear'
            }
          >

            {
              threat.predicted_attack
                ? 'Detected'
                : 'Clear'
            }

          </span>

        </td>


        <td>

          <div className="threat-time">

            <Clock
              size={14}
            />

            {
              formatTime(
                threat.timestamp
              )
            }

          </div>

        </td>


        <td>

          <div className="threat-row-actions">

            <button
              className="threat-expand-btn"

              onClick={
                onToggle
              }

              title="View analysis"
            >

              {
                expanded

                  ? (
                    <ChevronUp
                      size={17}
                    />
                  )

                  : (
                    <ChevronDown
                      size={17}
                    />
                  )
              }

            </button>


            <button
              className="threat-delete-btn"

              onClick={
                onDelete
              }

              title="Delete record"
            >

              <Trash2
                size={16}
              />

            </button>

          </div>

        </td>

      </tr>


      {/* EXPANDED DETAILS */}

      {
        expanded && (

          <tr className="threat-detail-row">

            <td colSpan="8">

              <div className="threat-details">

                {/* CONFIDENCE */}

                <div className="threat-detail-section">

                  <h4>
                    Prediction Confidence
                  </h4>


                  <div className="threat-detail-grid">

                    <div>

                      <span>
                        Current Stage
                      </span>

                      <strong>
                        {
                          threat.current_stage
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Current Confidence
                      </span>

                      <strong>
                        {
                          threat.current_confidence
                        }%
                      </strong>

                    </div>


                    <div>

                      <span>
                        Predicted Stage
                      </span>

                      <strong>
                        {
                          threat.next_stage
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Next Confidence
                      </span>

                      <strong>
                        {
                          threat.next_confidence
                        }%
                      </strong>

                    </div>

                  </div>

                </div>


                {/* EVIDENCE */}

                <div className="threat-detail-section">

                  <h4>
                    Detection Evidence
                  </h4>


                  {
                    threat.evidence
                      ?.length

                      ? (

                        <div className="threat-detail-evidence">

                          {
                            threat.evidence.map(
                              (
                                evidence,
                                index
                              ) => (

                                <div
                                  key={
                                    `${evidence}-${index}`
                                  }
                                >

                                  <ShieldAlert
                                    size={15}
                                  />

                                  <span>
                                    {
                                      evidence
                                    }
                                  </span>

                                </div>

                              )
                            )
                          }

                        </div>

                      )

                      : (

                        <p className="muted-text">
                          No strong behavioural
                          indicators detected.
                        </p>

                      )
                  }

                </div>


                {/* ACTION */}

                <div className="threat-detail-section">

                  <h4>
                    Recommended Response
                  </h4>


                  <div className="threat-recommendation">

                    <ShieldAlert
                      size={18}
                    />

                    <p>

                      {
                        threat
                          .recommended_action ||

                        'Continue monitoring network activity.'
                      }

                    </p>

                  </div>

                </div>


                {/* PROBABILITIES */}

                {
                  threat
                    .transition_probabilities && (

                    <div className="threat-detail-section">

                      <h4>
                        Attack Stage Probabilities
                      </h4>


                      <div className="threat-probabilities">

                        {
                          Object.entries(
                            threat
                              .transition_probabilities
                          ).map(
                            (
                              [
                                stage,
                                probability,
                              ]
                            ) => (

                              <div
                                className="threat-probability"

                                key={
                                  stage
                                }
                              >

                                <div>

                                  <span>
                                    {stage}
                                  </span>

                                  <strong>
                                    {
                                      probability
                                    }%
                                  </strong>

                                </div>


                                <div className="probability-track">

                                  <div
                                    className="probability-fill"

                                    style={{
                                      width:
                                        `${
                                          Math.min(
                                            100,
                                            Number(
                                              probability
                                            ) || 0
                                          )
                                        }%`,
                                    }}
                                  />

                                </div>

                              </div>

                            )
                          )
                        }

                      </div>

                    </div>

                  )
                }

              </div>

            </td>

          </tr>

        )
      }

    </>
  )
}


// =========================================================
// STAT CARD
// =========================================================

function ThreatStat({
  title,
  value,
  icon: Icon,
  type = '',
}) {

  return (

    <div
      className={
        `threat-stat-card ${type}`
      }
    >

      <div className="threat-stat-icon">

        <Icon
          size={21}
        />

      </div>


      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>

  )
}


export default Threats