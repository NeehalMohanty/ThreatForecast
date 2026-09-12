import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Activity, ShieldAlert, Layers, Radar, RefreshCw } from 'lucide-react'
import api from '../services/api'
import ForecastResult from '../components/ForecastResult'

export default function Dashboard() {
  const [records, setRecords] = useState([])
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    Promise.all([api.get('/analyses?limit=100'), api.get('/health')]).then(([saved, status]) => {
      if (active) { setRecords(saved.data.analyses); setHealth(status.data); setError('') }
    }).catch(() => { if (active) setError('Unable to connect. Start the API, then refresh.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])
  const predictions = records.flatMap(r => r.result.predictions.map(x => x.prediction))
  const threats = predictions.filter(p => p.predicted_attack).length
  const elevated = predictions.filter(p => ['HIGH', 'CRITICAL'].includes(p.risk)).length
  const latest = records[0]?.result.predictions[0]?.prediction
  const stats = [
    ['Analyses saved', records.length, 'Latest 100 reports', Layers],
    ['Records reviewed', predictions.length, 'Across these reports', Activity],
    ['Non-benign states', threats, 'Classifier outputs', Radar],
    ['Elevated severity', elevated, 'High + critical', ShieldAlert],
  ]
  return <section className="overview">
    <header className="page-hero"><div><p className="eyebrow">NETWORK DEFENCE / COMMAND CENTER</p><h1>Stay ahead of the next move<span>.</span></h1><p>Turn network observations into clear, reviewable threat intelligence.</p></div><Link className="primary-action" to="/workspace">New analysis <ArrowUpRight size={18} /></Link></header>
    <div className="overview-status"><span className={health?.status === 'healthy' ? 'status-dot online' : 'status-dot'} /><span>{loading ? 'Connecting to inference service…' : health?.status === 'healthy' ? 'Inference service ready' : 'Inference service unavailable'}</span><span className="subtle">Random Forest + weighted transition rules</span><button className="icon-control" aria-label="Refresh dashboard" onClick={() => { setLoading(true); setRefresh(r => r + 1) }}><RefreshCw size={16} /></button></div>
    {error && <p role="alert" className="workspace-error">{error}</p>}
    <div className="overview-stats">{stats.map(([title, value, note, Icon]) => <div className="surface overview-stat" key={title}><div><span>{title}</span><Icon size={19} /></div><strong>{loading ? '—' : value.toLocaleString()}</strong><small>{note}</small></div>)}</div>
    <div className="overview-grid"><div className="surface"><div className="panel-heading"><div><p className="eyebrow">LATEST OBSERVATION</p><h2>Threat outlook</h2></div><Link className="quiet-link" to="/forecast">Explore <ArrowUpRight size={16} /></Link></div>{latest ? <><p className="subtle">{records[0].source.replaceAll('_', ' ')} · first record in latest report</p><ForecastResult prediction={latest} /></> : <div className="forecast-empty"><Radar size={64} strokeWidth={1} /><h3>Your intelligence starts here</h3><p>Import a flow-feature file or explore a synthetic scenario. Results will appear after your first saved analysis.</p><Link className="quiet-link" to="/forecast">Open forecast studio <ArrowUpRight size={16} /></Link></div>}</div>
      <div className="surface recent-reports"><div className="panel-heading"><div><p className="eyebrow">ANALYSIS HISTORY</p><h2>Recent reports</h2></div><span className="count-badge">{records.length}</span></div>{records.length === 0 ? <p className="subtle">No saved reports yet.</p> : records.slice(0, 8).map(record => <div className="report-row" key={record.id}><div className="report-icon"><Layers size={17} /></div><div><strong>{record.source === 'synthetic_demo' ? 'Scenario analysis' : 'Imported telemetry'}</strong><small>{new Date(record.created).toLocaleString()}</small><span>{record.result.summary.submitted_records} records · {record.result.summary.detected_attacks} non-benign</span></div></div>)}<Link className="quiet-link" to="/workspace">Review saved analyses <ArrowUpRight size={16} /></Link><div className="scope-note"><strong>Know the scope</strong><p>Reports describe submitted observations. Traffic simulation is synthetic; forecast scores are not calibrated future attack probabilities.</p></div></div></div>
  </section>
}
