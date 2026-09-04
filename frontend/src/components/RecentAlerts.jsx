const alerts = [
  {
    id: 1,
    type: 'Malware',
    severity: 'Critical',
    source: '192.168.1.24',
  },
  {
    id: 2,
    type: 'Phishing',
    severity: 'High',
    source: 'Email Gateway',
  },
  {
    id: 3,
    type: 'Brute Force',
    severity: 'Medium',
    source: '192.168.1.56',
  },
  {
    id: 4,
    type: 'DDoS',
    severity: 'High',
    source: 'External Network',
  },
]

function RecentAlerts() {
  return (
    <div className="alerts-card">
      <div className="chart-header">
        <h3>Recent Alerts</h3>
        <p>Latest detected security events</p>
      </div>

      <div className="alerts-list">
        {alerts.map((alert) => (
          <div className="alert-item" key={alert.id}>
            <div>
              <h4>{alert.type}</h4>
              <p>{alert.source}</p>
            </div>

            <span
              className={`severity ${alert.severity.toLowerCase()}`}
            >
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentAlerts