// Compatibility bridge for the original browser-local Threats view.
export function cachePrediction(prediction, scenario) {
  const item = { ...prediction, id: crypto.randomUUID(), timestamp: new Date().toISOString(), scenario }
  try {
    const parsed = JSON.parse(localStorage.getItem('cyberForecastHistory') || '[]')
    localStorage.setItem('latestCyberForecast', JSON.stringify(item))
    localStorage.setItem('cyberForecastHistory', JSON.stringify([item, ...(Array.isArray(parsed) ? parsed : [])].slice(0, 200)))
    return true
  } catch { return false }
}
