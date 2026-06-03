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

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function DevicesPage() {
  const { 
    isConnected, 
    lastEvent, 
    connectToBox, 
    disconnect, 
    sendMedicationConfig, 
    triggerMotor 
  } = useCareBox();

  // Estado para o formulário de Medicação
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [medDays, setMedDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [isSending, setIsSending] = useState(false);

  // Estado para o motor
  const [motorSteps, setMotorSteps] = useState<number>(512);

  const handleToggleDay = (index: number) => {
    const newDays = [...medDays];
    newDays[index] = !newDays[index];
    setMedDays(newDays);
  };

  const handleSendConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      alert('Por favor, insere o nome do medicamento.');
      return;
    }
    
    setIsSending(true);
    try {
      await sendMedicationConfig(medName, medTime, medDays);
      alert('✅ Comando enviado para a CareBox com sucesso!');
      setMedName(''); // Limpa o formulário após envio
    } catch (error) {
      console.error(error);
      alert('❌ Erro ao enviar. A caixa está ligada e dentro do alcance?');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestMotor = async () => {
    try {
      await triggerMotor(motorSteps);
    } catch (error) {
      alert('❌ Erro ao ativar o motor.');
    }
  };

  const renderLastEvent = () => {
    if (!lastEvent) return <p className="text-gray-500 italic">A aguardar dados da CareBox...</p>;

    const parts = lastEvent.split('|');
    const type = parts[0];

    switch (type) {
      case 'MED_TOMADA':
        return (
          <div className="flex items-center text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 w-full">
            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>
              <strong>{parts[1]}</strong> tomada {parts[2] === 'pontual' ? 'a horas' : `com ${parts[3]} de atraso`}.
            </span>
          </div>
        );
      case 'MED_IGNORADA':
        return (
          <div className="flex items-center text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 w-full">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>Alerta: A toma de <strong>{parts[1]}</strong> foi falhada/ignorada!</span>
          </div>
        );
      case 'RESTOCK':
        return (
          <div className="flex items-center text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 w-full">
            <Package className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>Gaveta vazia! Faltam apenas <strong>{parts[1]}</strong> tomas.</span>
          </div>
        );
      case 'RFID':
        return (
          <div className="flex items-center text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200 w-full">
            <Activity className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>RFID Lido: {parts[1] === 'UNKNOWN' ? 'Desconhecido' : `Plano ${parts[1]}`}</span>
          </div>
        );
      default:
        return (
          <div className="p-3 bg-gray-100 rounded-lg text-gray-700 font-mono text-sm w-full break-all">
            Raw: {lastEvent}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* HEADER: STATUS BLUETOOTH */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            CareBox Control <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">BLE Módulo</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Modo de Depuração e Configuração Manual</p>
        </div>

        <button
          onClick={isConnected ? disconnect : connectToBox}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isConnected ? <BluetoothConnected className="w-5 h-5" /> : <Bluetooth className="w-5 h-5 animate-pulse" />}
          {isConnected ? 'Desconectar da Caixa' : 'Procurar CareBox'}
        </button>
      </div>

      {!isConnected ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-10 text-center flex flex-col items-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Bluetooth className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">À procura da CareBox...</h3>
          <p className="text-blue-700 max-w-md">
            Liga o Bluetooth do teu telemóvel, liga a CareBox à corrente e clica no botão acima para iniciar o emparelhamento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PAINEL ESQUERDO: ENVIO DE DADOS (WRITE) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
              <Pill className="w-5 h-5 text-indigo-500" />
              Testar Configuração (Write)
            </h2>
            
            <form onSubmit={handleSendConfig} className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Medicamento</label>
                <input 
                  type="text" 
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Ex: Brufen 600mg"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hora da Toma</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="time" 
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dias da Semana</label>
                <div className="flex justify-between gap-1">
                  {DIAS_SEMANA.map((dia, index) => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => handleToggleDay(index)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-colors ${
                        medDays[index] 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-200"
                >
                  <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
                  {isSending ? 'A enviar...' : 'Enviar para a Caixa'}
                </button>
              </div>
            </form>
          </div>

          {/* PAINEL DIREITO: RECEÇÃO DE DADOS (NOTIFY) & MOTOR */}
          <div className="space-y-6 flex flex-col">
            
            {/* EVENTOS EM TEMPO REAL */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Activity className="w-5 h-5 text-green-500 animate-pulse" />
                Monitor de Eventos (Notify)
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Abre a gaveta da CareBox, usa o cartão RFID ou espera pela hora configurada para ver a caixa a comunicar com a App.
              </p>
              <div className="min-h-[80px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-2">
                {renderLastEvent()}
              </div>
            </div>

            {/* MOTOR */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Settings className="w-5 h-5 text-gray-500" />
                Teste de Motor Stepper
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input 
                    type="number" 
                    value={motorSteps}
                    onChange={(e) => setMotorSteps(Number(e.target.value))}
                    placeholder="Passos (Ex: 512)"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none"
                  />
                </div>
                <button
                  onClick={handleTestMotor}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                >
                  Rodar Gaveta
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}