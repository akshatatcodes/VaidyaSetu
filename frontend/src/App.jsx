import { useState } from 'react'
import axios from 'axios'

function App() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:5000/api/health')
      setHealthStatus(response.data)
    } catch (error) {
      console.error('Health check failed:', error)
      setHealthStatus({ status: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <h1>🌉 VaidyaSetu</h1>
      <p>Phase 0: Foundation & Environment Setup</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={checkHealth}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Testing Connection...' : 'Run End-to-End Health Check'}
        </button>
      </div>

      {healthStatus && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem',
          textAlign: 'left',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <h3>Results:</h3>
          <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
        </div>
      )}

      <footer style={{ marginTop: '4rem', color: '#6b7280', fontSize: '0.875rem' }}>
        VaidyaSetu - Bridging Allopathy, Ayurveda & Homeopathy
      </footer>
    </div>
  )
}

export default App
