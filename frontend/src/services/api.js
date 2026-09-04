import axios from 'axios'


const api = axios.create({
  baseURL:
    'http://127.0.0.1:8000',

  timeout: 10000,
})


// =========================================================
// HEALTH
// =========================================================

export const getHealth =
  async () => {

    const response =
      await api.get(
        '/health'
      )

    return response.data
  }


// =========================================================
// COMPLETE SYSTEM STATUS
// =========================================================

export const getSystemStatus =
  async () => {

    const response =
      await api.get(
        '/system/status'
      )

    return response.data
  }


// =========================================================
// FORECAST SUMMARY
// =========================================================

export const getForecastSummary =
  async () => {

    const response =
      await api.get(
        '/forecast/summary'
      )

    return response.data
  }


// =========================================================
// SINGLE PREDICTION
// =========================================================

export const predictThreat =
  async (
    networkData = {}
  ) => {

    const response =
      await api.post(
        '/predict',
        networkData
      )

    return response.data
  }


// =========================================================
// BATCH PREDICTION
// =========================================================

export const predictThreatBatch =
  async (
    networkData = []
  ) => {

    const response =
      await api.post(
        '/predict/batch',
        {
          network_data:
            networkData,
        }
      )

    return response.data
  }


// =========================================================
// AXIOS INSTANCE
// =========================================================

export default api