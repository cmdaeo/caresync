import React, { useEffect, useState } from 'react';
import { Plus, Smartphone, Wifi, Battery, AlertTriangle, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getDevices, registerDevice, deleteDevice } from '../api/services';

const DevicesPage = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [newDevice, setNewDevice] = useState({ name: '', deviceId: '', deviceType: 'carebox' });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await getDevices();
      // Handle structure { success: true, data: { devices: [] } }
      setDevices(data.data?.devices || []);
    } catch (err) {
      setError('Failed to load devices.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerDevice(newDevice);
      setShowAddModal(false);
      setNewDevice({ name: '', deviceId: '', deviceType: 'carebox' });
      loadDevices();
    } catch (err) {
      alert('Failed to register device. ID might be in use.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this device?')) {
      try {
        await deleteDevice(id);
        loadDevices();
      } catch (err) {
        alert('Failed to remove device.');
      }
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 80) return <Battery className="text-green-500" />;
    if (level > 20) return <Battery className="text-blue-500" />;
    return <Battery className="text-red-500" />;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Devices</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors"
        >
          <Plus size={18} />
          <span>Link Device</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading devices...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.length === 0 && <p className="text-gray-500 col-span-3">No devices linked yet.</p>}
          
          {devices.map((device) => (
            <div key={device.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 rounded-full">
                    <Smartphone className="text-teal-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{device.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{device.deviceType}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(device.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="space-y-3 border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Wifi size={16} /> Status
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    device.connectionStatus === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {device.connectionStatus || 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    {getBatteryIcon(device.batteryLevel || 0)} Battery
                  </span>
                  <span className="font-medium">{device.batteryLevel !== null ? `${device.batteryLevel}%` : '--'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Link New Device</h2>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-lg p-2"
                  value={newDevice.name}
                  onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="e.g. Mom's Pill Box"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device ID (Serial)</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-lg p-2"
                  value={newDevice.deviceId}
                  onChange={e => setNewDevice({...newDevice, deviceId: e.target.value})}
                  placeholder="Enter serial number on device"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={newDevice.deviceType}
                  onChange={e => setNewDevice({...newDevice, deviceType: e.target.value})}
                >
                  <option value="carebox">Smart Pill Box</option>
                  <option value="careband">Wrist Band</option>
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DevicesPage;
