import { useState } from 'react'
import { ArrowUpRight, Play, RotateCcw, Radar, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { cachePrediction } from '../services/history'
import { scenarios, indicators } from '../services/scenarios'
import ForecastResult from '../components/ForecastResult'

export default function Forecast() {
  const [selected, setSelected] = useState('reconnaissance')
  const [form, setForm] = useState({ ...scenarios[1].data })
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [edited, setEdited] = useState(false)

  function preset(scenario) {
    setSelected(scenario.id); setForm({ ...scenario.data }); setResult(null); setError(''); setSaved(''); setEdited(false)
  }
  async function run(event) {
    event.preventDefault(); setBusy(true); setError(''); setSaved(''); setResult(null)
    try {
      const response = await api.post('/analyses', { source: 'synthetic_demo', network_data: [form] })
      const p = response.data.result.predictions[0].prediction
      setResult(p)
      const cached = cachePrediction(p, edited ? 'custom' : selected)
      setSaved(cached ? 'Saved to analysis history and browser threat log.' : 'Saved to analysis history. Browser cache is unavailable.')
    } catch (e) {
      const detail = e.response?.data?.detail
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(' · ') : detail || 'Could not analyse telemetry. Check that the API is running.')
    } finally { setBusy(false) }
  }
  return <section className="studio">
    <header className="page-hero"><div><p className="eyebrow">PREDICTIVE INTELLIGENCE</p><h1>Forecast studio<span>.</span></h1><p>Explore how observed behaviour changes the next likely attack state.</p></div><Link className="quiet-link" to="/workspace">Import your telemetry <ArrowUpRight size={17} /></Link></header>
    <div className="studio-grid">
      <form className="surface studio-controls" onSubmit={run}>
        <div className="panel-heading"><div><p className="eyebrow">01 / CONFIGURE</p><h2>Choose a scenario</h2></div><SlidersHorizontal size={20} /></div>
        <p className="subtle">Synthetic inputs for exploration. Scenario names describe inputs, not guaranteed predictions.</p>
        <div className="scenario-options">{scenarios.map(s => <button disabled={busy} type="button" key={s.id} aria-pressed={selected === s.id} className={selected === s.id ? 'scenario-option selected' : 'scenario-option'} onClick={() => preset(s)}><span className="scenario-dot" /><span><strong>{s.name}</strong><small>{s.description}</small></span></button>)}</div>
        <div className="panel-heading"><h3>Behavioural signals</h3><button className="icon-control" title="Reset scenario" aria-label="Reset scenario" disabled={busy} type="button" onClick={() => preset(scenarios.find(s => s.id === selected))}><RotateCcw size={16} /></button></div>
        <div className="signal-inputs">{indicators.map(([key, label, unit]) => <label key={key}><span>{label}</span><div><input aria-label={label} type="number" min="0" max="1000000000000000" step="any" required disabled={busy} value={form[key]} onChange={e => { setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) }); setResult(null); setSaved(''); setEdited(true) }} /><small>{unit}</small></div></label>)}</div>
        <details className="advanced-inputs"><summary>Flow features & observed trends</summary><p className="subtle">All classifier fields are supplied by this synthetic preset. Edit them to explore sensitivity.</p><div className="signal-inputs">{Object.entries(form).filter(([key]) => !indicators.some(([k]) => k === key)).map(([key, value]) => <label key={key}><span>{key.replaceAll('_', ' ')}</span><input aria-label={key} type="number" step="any" min={key.endsWith('_trend') ? undefined : 0} max="1000000000000000" required disabled={busy} value={value} onChange={e => { setForm({ ...form, [key]: e.target.value === '' ? '' : Number(e.target.value) }); setResult(null); setSaved(''); setEdited(true) }} /></label>)}</div></details>
        <button className="primary-action" disabled={busy}><Play size={16} />{busy ? 'Analysing signals…' : 'Run forecast'}</button>
        <p className="subtle">Classifier-weighted rules · independent observation · no elapsed-time forecast</p>
      </form>
      <div className="surface studio-output"><div className="panel-heading"><div><p className="eyebrow">02 / INTERPRET</p><h2>Forecast intelligence</h2></div><Radar size={22} /></div>
        {error && <p role="alert" className="workspace-error">{error}</p>}
        {saved && <p role="status" className="saved-notice">{saved}</p>}
        {result ? <ForecastResult prediction={result} /> : <div className="forecast-empty"><div className="radar-art"><Radar size={74} strokeWidth={1} /></div><h3>See what could happen next</h3><p>Choose a scenario, adjust the signals, and run a forecast to compare possible next states.</p><div className="empty-steps"><span>Classify</span><span>Compare</span><span>Investigate</span></div></div>}
      </div>
    </div>
  </section>
}
