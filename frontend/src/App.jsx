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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="card max-w-2xl w-full">
        <h1 className="text-5xl font-bold mb-4 gradient-text">VaidyaSetu</h1>
        <p className="text-gray-400 mb-8 text-lg">
          Phase 0: Foundation & Environment Setup Complete
        </p>

        <div className="mt-8 flex flex-col items-center">
          <button 
            onClick={checkHealth}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all"
            style={{
               background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
               boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
            }}
          >
            {loading ? 'Verifying Neural Links...' : '🚀 Test End-to-End Connectivity'}
          </button>
        </div>

        {healthStatus && (
          <div className="mt-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800 text-left overflow-auto max-h-[400px]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-blue-400 font-semibold uppercase tracking-wider text-sm">System Diagnostics</h3>
               <span className={`px-2 py-1 rounded text-xs ${healthStatus.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                 {healthStatus.status === 'healthy' ? 'STABLE' : 'ERROR'}
               </span>
            </div>
            <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <footer className="mt-12 text-gray-600 text-sm tracking-widest uppercase">
        Bridge of the Healer • Allopathy • Ayurveda • Homeopathy
      </footer>
    </div>
  )
}

export default App
