import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { time: '00:00', threats: 22 },
  { time: '04:00', threats: 35 },
  { time: '08:00', threats: 48 },
  { time: '12:00', threats: 31 },
  { time: '16:00', threats: 58 },
  { time: '20:00', threats: 72 },
  { time: '24:00', threats: 51 },
]

function ThreatChart() {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Threat Activity</h3>
        <p>Threat detections over the last 24 hours</p>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="time" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="threats"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ThreatChart