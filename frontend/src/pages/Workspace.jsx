import { useEffect, useState } from 'react'
import api from '../services/api'
import ForecastResult from '../components/ForecastResult'
import { cachePrediction } from '../services/history'

const example = [{ flow_duration: 2.5, header_length: 54, protocol_type: 6,
  rate: 25, srate: 20, drate: 5, tcp: 1, https: 1, tot_size: 1200,
  magnitude: 20, failed_logins: 12, port_scans: 15, outbound_bytes: 1000 }]

function errorText(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(item => `${item.loc.join('.')}: ${item.msg}`).join('\n')
  return detail || error.message || 'Request failed'
}

function download(value) {
  const link = document.createElement('a')
  link.href = `${api.defaults.baseURL.replace(/\/$/, '')}/analyses/${value.id}/export`
  link.download = 'threatforecast-analysis.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export default function Workspace() {
  const [input, setInput] = useState(JSON.stringify(example, null, 2))
  const [source, setSource] = useState('synthetic_demo')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState(null)

  async function refresh() {
    const [saved, health] = await Promise.all([api.get('/analyses'), api.get('/system/status')])
    setHistory(saved.data.analyses)
    setStatus(health.data)
  }
  useEffect(() => {
    let active = true
    Promise.all([api.get('/analyses'), api.get('/system/status')]).then(([saved, health]) => {
      if (active) { setHistory(saved.data.analyses); setStatus(health.data) }
    }).catch(e => { if (active) setError(errorText(e)) })
    return () => { active = false }
  }, [])

  async function importFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a file smaller than 1 MB (up to 100 records).')
      const text = (await file.text()).replace(/^\uFEFF/, '')
      let rows
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Numeric feature CSV only; quoted cells may contain numbers, not delimiters.
        const lines = text.trim().split(/\r?\n/)
        const cells = line => line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'))
        const headers = cells(lines.shift()).map(h => h.toLowerCase().replace(/[ -]/g, '_'))
        if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error('CSV headers must be unique and non-empty.')
        rows = lines.filter(line => line.trim()).map((line, index) => {
          const values = cells(line)
          if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has an incorrect column count.`)
          return Object.fromEntries(headers.map((key, i) => {
            if (values[i] === '' || !Number.isFinite(Number(values[i]))) throw new Error(`Row ${index + 2}, ${key}: expected a finite number.`)
            return [key, Number(values[i])]
          }))
        })
      } else {
        rows = JSON.parse(text)
      }
      if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100) throw new Error('Provide a JSON array or CSV with 1–100 telemetry records.')
      setInput(JSON.stringify(rows, null, 2))
      setSource('imported_telemetry')
      setRecord(null)
    } catch (e) { setError(errorText(e)) }
    event.target.value = ''
  }

  async function analyse(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setRecord(null)
    try {
      const rows = JSON.parse(input)
      if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100) throw new Error('Provide an array with 1–100 records.')
      const response = await api.post('/analyses', { network_data: rows, source })
      setRecord(response.data)
      response.data.result.predictions.forEach(item => cachePrediction(item.prediction, source === 'synthetic_demo' ? 'custom' : 'imported'))
      await refresh()
    } catch (e) { setError(errorText(e)) }
    finally { setBusy(false) }
  }

  return <section className="workspace">
    <div className="workspace-heading"><div><p className="eyebrow">SIH26153 / ANALYST WORKSPACE</p>
      <h1>Analysis workspace<span>.</span></h1><p>Bring your observations. Leave with actionable context.</p></div>
      <span className="workspace-status">{status?.ml_engine?.ready ? 'Classifier ready' : 'Classifier unavailable'}</span></div>
    <div className="prototype-notice">Research prototype · Random Forest classification + classifier-weighted heuristic progression. Scores are uncalibrated; no time-to-attack prediction or live packet capture.</div>
    {error && <pre role="alert" className="workspace-error">{error}</pre>}
    <div className="workspace-grid">
      <form className="workspace-panel" onSubmit={analyse}>
        <h2>1. Supply telemetry</h2>
        <p>Numeric feature CSV or JSON array, up to 100 records. Use normalized CICIoT23 feature names. Each row is analysed independently.</p>
        <div className="workspace-actions">
          <label className="workspace-button">Import CSV / JSON<input type="file" accept=".csv,.json" onChange={importFile} disabled={busy} /></label>
          <button type="button" disabled={busy} onClick={() => { setInput(JSON.stringify(example, null, 2)); setSource('synthetic_demo'); setRecord(null) }}>Load demo</button>
        </div>
        <label htmlFor="source">Input provenance</label>
        <select id="source" value={source} onChange={e => setSource(e.target.value)} disabled={busy}>
          <option value="synthetic_demo">Synthetic demo / manually constructed</option>
          <option value="imported_telemetry">Imported telemetry (user supplied)</option>
        </select>
        <label htmlFor="telemetry">Telemetry JSON</label>
        <textarea id="telemetry" value={input} onChange={e => { setInput(e.target.value); setRecord(null) }} spellCheck="false" disabled={busy} />
        <button className="workspace-primary" disabled={busy || !status?.ml_engine?.ready}>{busy ? 'Analysing…' : 'Analyse and save'}</button>
      </form>
      <div className="workspace-panel">
        <h2>2. Review evidence</h2>
        {!record ? <div className="workspace-empty">Your analysis will appear here.<p>The sample is synthetic. Omitted features are reported, not hidden.</p></div> : <>
          <div className="workspace-actions"><span>{record.source.replaceAll('_', ' ')} · {new Date(record.created).toLocaleString()}</span><button onClick={() => download(record)}>Export report</button></div>
          <p>{record.result.summary.successful_predictions} records · {record.result.summary.detected_attacks} non-benign classifications · average severity {record.result.summary.average_risk_score}/100</p>
          <div className="workspace-results">{record.result.predictions.map(({ index, prediction: p }) => <details key={index} open={index === 0}>
            <summary>Record {index + 1} · {p.current_stage} → {p.next_stage} <span className={`severity ${p.risk.toLowerCase()}`}>{p.risk}</span></summary>
            <ForecastResult prediction={p} />
          </details>)}</div>
        </>}
      </div>
    </div>
    <div className="workspace-panel"><h2>Saved analyses</h2><p>Shared on this installation; latest 50 shown, up to 1,000 retained. Summaries persist across restarts. Raw telemetry is not saved.</p>
      {history.length === 0 ? <p>No saved analyses yet.</p> : <div className="workspace-history">{history.map(item => <button key={item.id} onClick={() => setRecord(item)}><strong>{new Date(item.created).toLocaleString()}</strong><span>{item.source.replaceAll('_', ' ')} · {item.result.summary.submitted_records} records</span></button>)}</div>}
    </div>
  </section>
}
