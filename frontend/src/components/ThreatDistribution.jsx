import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Malware', value: 35 },
  { name: 'Phishing', value: 25 },
  { name: 'DDoS', value: 20 },
  { name: 'Brute Force', value: 12 },
  { name: 'Other', value: 8 },
]

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#3b82f6',
  '#8b5cf6',
]

function ThreatDistribution() {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Threat Distribution</h3>
        <p>Threats grouped by attack type</p>
      </div>

      <div className="pie-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ThreatDistribution