import { useEffect, useState } from 'react';
import { Terminal, Shield, Zap, Code, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ApiDocsPage = () => {
  const [docs, setDocs] = useState<any>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api-docs.json')
      .then(r => r.json())
      .then(d => setDocs(d))
      .catch(e => console.error("Failed to load api docs", e));
  }, []);

  const endpoints = docs?.endpoints || [];

  return (
    <div className="w-full bg-bg-page pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-text-main tracking-tight mb-4"
          >
            CareSync API <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Reference</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-text-muted max-w-2xl mx-auto"
          >
            Integrate with the CareSync ecosystem using our secure, RESTful API.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Terminal, title: 'RESTful Design', desc: 'Standard HTTP methods and status codes for intuitive integration.' },
            { icon: Shield, title: 'Zero-Trust Auth', desc: 'Secure endpoints with JWT and API Key scopes.' },
            { icon: Zap, title: 'High Performance', desc: 'Optimized PostgreSQL queries with Redis caching.' },
            { icon: Code, title: 'OpenAPI Spec', desc: 'Fully documented with Swagger/OpenAPI 3.0.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-bg-hover/40 border border-border-subtle/50 rounded-2xl p-6 hover:bg-bg-hover/60 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">{feature.title}</h3>
              <p className="text-text-muted text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-bg-card rounded-2xl border border-border-subtle overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-border-subtle bg-bg-card/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-text-main">API Endpoints</h2>
              {docs && <p className="text-sm text-text-muted mt-1">Version {docs.version} • {docs.totalEndpoints} endpoints documented</p>}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {!docs ? (
              <div className="text-center py-12 text-text-muted animate-pulse">Loading API Documentation...</div>
            ) : (
              endpoints.map((ep: any, i: number) => (
                <div key={`${ep.method}-${ep.path}-${i}`} className="border border-border-subtle/50 rounded-xl overflow-hidden bg-bg-hover/20">
                  <button
                    onClick={() => setExpandedPath(expandedPath === ep.path ? null : ep.path)}
                    className="w-full flex items-center justify-between p-4 hover:bg-bg-hover/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-16 text-center text-xs font-bold px-2 py-1 rounded bg-bg-hover ${
                        ep.method === 'GET' ? 'text-green-400' :
                        ep.method === 'POST' ? 'text-blue-400' :
                        ep.method === 'PUT' ? 'text-amber-400' :
                        ep.method === 'DELETE' ? 'text-red-400' :
                        'text-orange-400'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-text-main/90">{ep.path}</code>
                    </div>
                    <ChevronDown size={16} className={`text-text-muted transition-transform ${expandedPath === ep.path ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedPath === ep.path && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border-subtle/50 bg-bg-card/50 overflow-hidden"
                      >
                        <div className="p-5 text-sm space-y-4">
                          <p className="text-text-main/80">{ep.description}</p>
                          
                          {ep.parameters && ep.parameters.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-text-main mb-2">Parameters</h4>
                              <div className="bg-bg-page/50 rounded-lg p-3 border border-border-subtle">
                                {ep.parameters.map((p: any, idx: number) => (
                                  <div key={idx} className="flex gap-4 py-1 border-b border-border-subtle/50 last:border-0 text-xs">
                                    <span className="font-mono text-blue-300 min-w-[100px]">{p.name}</span>
                                    <span className="text-text-muted min-w-[60px] italic">in {p.in}</span>
                                    <span className="text-text-main/80">{p.description || 'No description'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {ep.requestBody && (
                            <div>
                              <h4 className="font-semibold text-text-main mb-2">Request Body Example</h4>
                              <pre className="p-3 rounded-lg bg-bg-page/50 border border-border-subtle overflow-x-auto text-xs font-mono text-text-muted">
                                {JSON.stringify(ep.requestBody, null, 2)}
                              </pre>
                            </div>
                          )}

                          {ep.responseBody && (
                            <div>
                              <h4 className="font-semibold text-text-main mb-2">Success Response</h4>
                              <pre className="p-3 rounded-lg bg-bg-page/50 border border-border-subtle overflow-x-auto text-xs font-mono text-emerald-400">
                                {JSON.stringify(ep.responseBody, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
