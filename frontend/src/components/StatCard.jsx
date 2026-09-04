function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <p className="stat-title">{title}</p>
      <h2>{value}</h2>
      <p className="stat-subtitle">{subtitle}</p>
    </div>
  )
}

export default StatCard