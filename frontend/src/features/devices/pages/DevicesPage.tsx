// frontend/src/features/devices/pages/DevicesPage.tsx
import React, { useState } from 'react';
import { 
  Bluetooth, 
  BluetoothConnected, 
  Send, 
  Settings, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Package,
  Clock,
  Pill
} from 'lucide-react';
import { useCareBox } from '../../../hooks/useCareBox';
import { useTheme } from '../../../context/ThemeContext';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DevicesPage() {
  const { theme: _ } = useTheme(); 
  const { 
    isConnected, 
    lastEvent, 
    connectToBox, 
    disconnect, 
    sendMedicationConfig, 
    triggerMotor 
  } = useCareBox();

  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [medDays, setMedDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [isSending, setIsSending] = useState(false);

  const [motorSteps, setMotorSteps] = useState<number>(512);

  const handleToggleDay = (index: number) => {
    const newDays = [...medDays];
    newDays[index] = !newDays[index];
    setMedDays(newDays);
  };

  const handleSendConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      alert('Please enter the medication name.');
      return;
    }
    
    setIsSending(true);
    try {
      await sendMedicationConfig(medName, medTime, medDays);
      alert('✅ Command successfully sent to CareBox!');
      setMedName(''); 
    } catch (error) {
      console.error(error);
      alert('❌ Error sending. Is the CareBox powered on and within range?');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestMotor = async () => {
    try {
      await triggerMotor(motorSteps);
    } catch (error) {
      alert('❌ Error activating motor.');
    }
  };

  const renderLastEvent = () => {
    if (!lastEvent) return <p className="text-text-muted italic">Waiting for CareBox data...</p>;

    const parts = lastEvent.split('|');
    const type = parts[0];

    switch (type) {
      case 'MED_TOMADA':
        return (
          <div className="flex items-center text-emerald-500 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 w-full">
            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">
              <strong className="font-bold">{parts[1]}</strong> taken {parts[2] === 'pontual' ? 'on time' : `with a ${parts[3]} delay`}.
            </span>
          </div>
        );
      case 'MED_IGNORADA':
        return (
          <div className="flex items-center text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 w-full">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">Alert: The intake of <strong className="font-bold">{parts[1]}</strong> was missed/ignored!</span>
          </div>
        );
      case 'RESTOCK':
        return (
          <div className="flex items-center text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 w-full">
            <Package className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">Empty compartment! Only <strong className="font-bold">{parts[1]}</strong> intakes remaining.</span>
          </div>
        );
      case 'RFID':
        return (
          <div className="flex items-center text-brand-primary bg-brand-primary/10 p-3 rounded-lg border border-brand-primary/20 w-full">
            <Activity className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">RFID Scanned: {parts[1] === 'UNKNOWN' ? 'Unknown' : `Plan ${parts[1]}`}</span>
          </div>
        );
      default:
        return (
          <div className="p-3 bg-bg-page border border-border-subtle rounded-lg text-text-muted font-mono text-xs w-full break-all">
            Raw: {lastEvent}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-8 px-4 sm:px-0">
      
      {/* HEADER: BLUETOOTH STATUS */}
      <div className="bg-bg-card p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            CareBox Control 
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-full">
              BLE Module
            </span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Debug Mode and Manual Configuration</p>
        </div>

        <button
          onClick={isConnected ? disconnect : connectToBox}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm border ${
            isConnected 
              ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
              : 'bg-brand-primary text-white border-transparent hover:opacity-90 active:scale-95 shadow-md'
          }`}
        >
          {isConnected ? <BluetoothConnected className="w-5 h-5" /> : <Bluetooth className="w-5 h-5 animate-pulse" />}
          {isConnected ? 'Disconnect from CareBox' : 'Scan for CareBox'}
        </button>
      </div>

      {!isConnected ? (
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-10 text-center flex flex-col items-center">
          <div className="bg-brand-primary/10 p-4 rounded-full mb-4 border border-brand-primary/20">
            <Bluetooth className="w-10 h-10 text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">Scanning for CareBox...</h3>
          <p className="text-text-muted max-w-md">
            Turn on your device's Bluetooth, plug in the CareBox, and click the button above to pair.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT PANEL: DATA SENDING (WRITE) */}
          <div className="bg-bg-card p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-text-main">
              <Pill className="w-5 h-5 text-brand-primary" />
              Test Configuration (Write)
            </h2>
            
            <form onSubmit={handleSendConfig} className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Medication Name</label>
                <input 
                  type="text" 
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="E.g. Ibuprofen 600mg"
                  className="w-full p-3 bg-bg-page border border-border-subtle text-text-main rounded-xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all placeholder:text-text-muted/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Intake Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input 
                    type="time" 
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full p-3 pl-10 bg-bg-page border border-border-subtle text-text-main rounded-xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Days of the Week</label>
                <div className="flex justify-between gap-1">
                  {WEEKDAYS.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(index)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all border ${
                        medDays[index] 
                          ? 'bg-brand-primary text-white border-transparent shadow-md' 
                          : 'bg-bg-page text-text-muted border-border-subtle hover:border-brand-primary/50 hover:text-brand-primary'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:opacity-90 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-brand-primary/20 border border-transparent"
                >
                  <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
                  {isSending ? 'Sending...' : 'Send to CareBox'}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: DATA RECEPTION (NOTIFY) & MOTOR */}
          <div className="space-y-6 flex flex-col">
            
            {/* REAL-TIME EVENTS */}
            <div className="bg-bg-card p-6 rounded-xl shadow-sm border border-border-subtle flex-1">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-text-main">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                Event Monitor (Notify)
              </h2>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                Open the CareBox drawer, use the RFID card, or wait for the scheduled time to see the box communicate with the App.
              </p>
              <div className="min-h-[80px] flex items-center justify-center bg-bg-page border border-border-subtle rounded-xl p-3">
                {renderLastEvent()}
              </div>
            </div>

            {/* MOTOR */}
            <div className="bg-bg-card p-6 rounded-xl shadow-sm border border-border-subtle">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-text-main">
                <Settings className="w-5 h-5 text-text-muted" />
                Stepper Motor Test
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input 
                    type="number" 
                    value={motorSteps}
                    onChange={(e) => setMotorSteps(Number(e.target.value))}
                    placeholder="Steps (E.g. 512)"
                    className="w-full p-3 bg-bg-page border border-border-subtle text-text-main rounded-xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all placeholder:text-text-muted/50"
                  />
                </div>
                <button
                  onClick={handleTestMotor}
                  className="bg-bg-page border border-border-subtle text-text-main hover:border-brand-primary/50 hover:text-brand-primary px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                >
                  Rotate Drawer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}