import /*React,*/ { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Globe, ArrowRight } from 'lucide-react';

export const SoftwareArchitecturePage = () => {
  const [activeView, setActiveView] = useState<'web' | 'native'>('web');

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Hybrid Architecture</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          How CareSync bridges the gap between modern React web development and low-level Android hardware APIs using Capacitor.
        </p>
      </div>

      {/* Interactive Diagram */}
      <div className="grid md:grid-cols-3 gap-8 items-center">
        
        {/* React Layer */}
        <motion.div 
          className={`p-6 rounded-xl border ${activeView === 'web' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900'} cursor-pointer transition-all`}
          onClick={() => setActiveView('web')}
          whileHover={{ scale: 1.02 }}
        >
          <Globe className="text-blue-400 mb-4" size={32} />
          <h3 className="text-xl font-bold text-white mb-2">React Layer</h3>
          <p className="text-sm text-slate-400">UI/UX, State Management (Zustand), Business Logic</p>
        </motion.div>

        {/* The Bridge */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="text-xs font-mono text-slate-500">Capacitor Bridge</div>
          <ArrowRight className="text-slate-600" />
          <div className="h-px w-full bg-slate-800" />
          <ArrowRight className="text-slate-600 rotate-180" />
          <div className="text-xs font-mono text-slate-500">JSON Marshalling</div>
        </div>

        {/* Native Layer */}
        <motion.div 
          className={`p-6 rounded-xl border ${activeView === 'native' ? 'border-green-500 bg-green-500/10' : 'border-slate-800 bg-slate-900'} cursor-pointer transition-all`}
          onClick={() => setActiveView('native')}
          whileHover={{ scale: 1.02 }}
        >
          <Smartphone className="text-green-400 mb-4" size={32} />
          <h3 className="text-xl font-bold text-white mb-2">Native Layer</h3>
          <p className="text-sm text-slate-400">Java/Kotlin, NFC Hardware, Haptics, Bluetooth LE</p>
        </motion.div>
      </div>

      {/* Code Comparison */}
      <div className="bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-800">
          <div className="px-4 py-2 text-xs font-mono text-slate-400 border-r border-slate-800 bg-slate-900/50">
            {activeView === 'web' ? 'MedicationScan.tsx (React)' : 'NfcPlugin.java (Android)'}
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="font-mono text-sm">
            {activeView === 'web' ? (
<code className="text-blue-300">
{`// 1. Guard Clause for Web
if (!Capacitor.isNativePlatform()) return;

// 2. Listen for Native Events
NativeBridge.nfc.addListener('nfcTagDetected', (data) => {
  toast.success(\`Tag Scanned: \${data.tagId}\`);
  verifyMedication(data.tagId);
});

// 3. Trigger Native Scan
await NativeBridge.nfc.startScan();`}
</code>
            ) : (
<code className="text-green-300">
{`@PluginMethod
public void startScan(PluginCall call) {
    // 1. Access Android Hardware
    nfcAdapter.enableReaderMode(
        getActivity(),
        this, 
        NfcAdapter.FLAG_READER_NFC_A,
        null
    );
    
    // 2. Resolve Promise back to JS
    call.resolve();
}`}
</code>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
