import { ArrowRight, ShieldCheck, CircleAlert, GitBranch } from 'lucide-react'

export default function ForecastResult({ prediction: p }) {
  const ranked = Object.entries(p.transition_probabilities || {}).sort((a, b) => b[1] - a[1])
  return <div className="forecast-result">
    <div className="result-heading"><span className={`severity ${p.risk.toLowerCase()}`}>{p.risk} SEVERITY</span><span className="subtle">Next observation · no time estimate</span></div>
    <div className="stage-journey"><div><span>OBSERVED STATE</span><h3>{p.current_stage}</h3><p>{p.current_confidence}% classifier confidence</p></div><ArrowRight size={24} /><div><span>LEADING NEXT STATE</span><h3>{p.next_stage}</h3><p>{p.next_confidence}% heuristic score</p></div></div>
    <div className="quality-strip"><div><strong>{p.data_quality?.coverage_percent ?? '—'}%</strong><span>Feature coverage</span></div><div><strong>{p.uncertainty?.margin ?? '—'} pts</strong><span>Top-two margin</span></div><div><strong>{p.risk_score}/100</strong><span>Severity index</span></div></div>
    <h4 className="section-label"><GitBranch size={16} /> Possible next states</h4>
    <div className="ranked-stages">{ranked.map(([stage, score], i) => <div className="ranked-stage" key={stage}><span className="rank-number">0{i + 1}</span><span>{stage}</span><div className="score-track"><div style={{ width: `${score}%` }} /></div><strong>{score}%</strong></div>)}</div>
    <div className="evidence-columns"><div><h4 className="section-label"><CircleAlert size={16} /> Supporting indicators</h4><ul>{p.evidence.map(e => <li key={e}>{e}</li>)}</ul></div><div><h4 className="section-label"><ShieldCheck size={16} /> Analyst next step</h4><p>{p.recommended_action}</p></div></div>
    <details className="method-details"><summary>Method, uncertainty & input quality</summary><p>{p.forecast_basis || 'Heuristic transition rules'}. Each possible current state contributes to the forecast in proportion to the classifier score. Scores are uncalibrated.</p><ul>{p.warnings.map(w => <li key={w}>{w}</li>)}</ul>{p.missing_features.length > 0 && <p>Omitted features: {p.missing_features.join(', ')}</p>}</details>
  </div>
}
