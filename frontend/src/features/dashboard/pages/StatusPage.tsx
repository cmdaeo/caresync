import { useState, useEffect } from 'react'
import { client } from '../../../shared/api/client'
import { useAuthStore } from '../../../shared/store/authStore'

interface StatusHistoryEntry {
  status: string
  latencyMs: number | null
  timestamp: string
}

interface StatusData {
  status: string
  timestamp: string
  history: StatusHistoryEntry[]
}

interface DetailedStatus {
  status: string
  uptime: { seconds: number; human: string }
  database: { status: string; latencyMs: number | null; dialect: string; provider: string }
  security: Record<string, boolean | string>
  environment: {
    nodeEnv: string
    nodeVersion: string
    platform: string
    isServerless: boolean
    criticalEnvVarsLoaded: Record<string, boolean>
  }
  version: string
  timestamp: string
}

export function StatusPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const [publicStatus, setPublicStatus] = useState<StatusData | null>(null)
  const [detailed, setDetailed] = useState<DetailedStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await client.get('/status')
        setPublicStatus(res.data.data)

        if (isAdmin) {
          try {
            const detailRes = await client.get('/status/detailed')
            setDetailed(detailRes.data.data)
          } catch {
            // Admin endpoint might fail if user isn't actually admin server-side
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch status')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  const statusColor = (status: string) => {
    if (status === 'ok' || status === 'connected') return 'text-emerald-400'
    if (status === 'degraded') return 'text-amber-400'
    return 'text-red-400'
  }

  const statusDot = (status: string) => {
    if (status === 'ok' || status === 'connected') return 'bg-emerald-400'
    if (status === 'degraded') return 'bg-amber-400'
    return 'bg-red-400'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Status</h1>
        <p className="text-slate-400 mt-1">Real-time health monitoring for CareSync services</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Public Status Card */}
      {publicStatus && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${statusDot(publicStatus.status)} animate-pulse`} />
            <h2 className={`text-xl font-semibold ${statusColor(publicStatus.status)}`}>
              {publicStatus.status === 'ok' ? 'All Systems Operational' : 'Service Degraded'}
            </h2>
          </div>

          {/* History Timeline */}
          {publicStatus.history && publicStatus.history.length > 0 && (
            <div className="mt-6">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Uptime History</p>
              <div className="flex items-end gap-1 h-12">
                {publicStatus.history.map((entry, idx) => (
                  <div
                    key={idx}
                    title={`${new Date(entry.timestamp).toLocaleTimeString()} - ${entry.status}`}
                    className={`flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80 ${
                      entry.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{
                      height: entry.status === 'ok' ? '100%' : '50%'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-slate-400 text-sm mt-4">
            Last checked: {new Date(publicStatus.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Admin Detailed View */}
      {isAdmin && detailed && (
        <>
          {/* Uptime & Version */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Uptime</p>
              <p className="text-white text-lg font-mono">{detailed.uptime.human}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Version</p>
              <p className="text-white text-lg font-mono">v{detailed.version}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Environment</p>
              <p className="text-white text-lg font-mono">{detailed.environment.nodeEnv}</p>
            </div>
          </div>

          {/* Database Health */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Database</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase">Status</p>
                <p className={`font-medium ${statusColor(detailed.database.status)}`}>
                  {detailed.database.status}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Latency</p>
                <p className="text-white font-mono">
                  {detailed.database.latencyMs !== null ? `${detailed.database.latencyMs}ms` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Dialect</p>
                <p className="text-white">{detailed.database.dialect}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase">Provider</p>
                <p className="text-white">{detailed.database.provider}</p>
              </div>
            </div>
          </div>

          {/* Security Posture */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Security Posture</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(detailed.security).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {typeof value === 'boolean' ? (
                    <span className={`text-sm ${value ? 'text-emerald-400' : 'text-red-400'}`}>
                      {value ? '✓' : '✗'}
                    </span>
                  ) : null}
                  <span className="text-slate-300 text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </span>
                  {typeof value === 'string' && (
                    <span className="text-slate-400 text-xs font-mono ml-auto">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Critical Environment Variables</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(detailed.environment.criticalEnvVarsLoaded).map(([key, loaded]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`text-sm ${loaded ? 'text-emerald-400' : 'text-red-400'}`}>
                    {loaded ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-300 text-sm font-mono">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isAdmin && (
        <p className="text-slate-500 text-sm text-center">
          Detailed system information is available to administrators only.
        </p>
      )}
    </div>
  )
}
