import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Battery, Wifi, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getDeviceById } from '../api/services';

const DeviceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevice();
    // Poll for status updates every 30 seconds
    const interval = setInterval(loadDevice, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const loadDevice = async () => {
    try {
      const data = await getDeviceById(id!);
      setDevice(data.data?.device);
    } catch (err) {
      console.error('Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConnectionColor = (status: string) => {
    if (status === 'online') return 'text-green-600';
    if (status === 'syncing') return 'text-blue-600';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">Loading device...</div>
      </DashboardLayout>
    );
  }

  if (!device) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">Device not found</div>
      </DashboardLayout>
    );
  }

  const lastSyncMinutes = device.lastSync 
    ? Math.floor((Date.now() - new Date(device.lastSync).getTime()) / 60000)
    : null;

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate('/dashboard/devices')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Devices
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <Smartphone className="text-teal-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{device.name}</h1>
              <p className="text-gray-600 mt-1 uppercase tracking-wider text-sm">{device.deviceType}</p>
              <p className="text-gray-500 text-xs mt-1">ID: {device.deviceId}</p>
            </div>
          </div>
          <span className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            device.connectionStatus === 'online' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              device.connectionStatus === 'online' ? 'bg-green-600' : 'bg-gray-400'
            }`} />
            {device.connectionStatus || 'Offline'}
          </span>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Battery className={getBatteryColor(device.batteryLevel || 0)} size={28} />
              <span className="text-2xl font-bold text-gray-900">
                {device.batteryLevel !== null ? `${device.batteryLevel}%` : '--'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Battery Level</p>
            <p className="text-xs text-gray-500 mt-1">
              Status: {device.batteryStatus || 'Unknown'}
            </p>
          </div>

          <div className="p-5 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Wifi className={getConnectionColor(device.connectionStatus)} size={28} />
              <span className="text-2xl font-bold text-gray-900">
                {device.connectionStatus === 'online' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Connection Status</p>
            <p className="text-xs text-gray-500 mt-1">
              {device.lastConnection 
                ? `Last: ${new Date(device.lastConnection).toLocaleString()}`
                : 'Never connected'}
            </p>
          </div>

          <div className="p-5 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-green-600" size={28} />
              <span className="text-2xl font-bold text-gray-900">
                {lastSyncMinutes !== null ? `${lastSyncMinutes}m` : '--'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Last Sync</p>
            <p className="text-xs text-gray-500 mt-1">
              {device.lastSync 
                ? new Date(device.lastSync).toLocaleString()
                : 'Never synced'}
            </p>
          </div>
        </div>

        {/* Device Information */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Device Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="font-medium text-gray-900">{device.model || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Serial Number</p>
              <p className="font-medium text-gray-900">{device.serialNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Firmware Version</p>
              <p className="font-medium text-gray-900">{device.firmwareVersion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hardware Version</p>
              <p className="font-medium text-gray-900">{device.hardwareVersion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registration Date</p>
              <p className="font-medium text-gray-900">
                {new Date(device.registrationDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Warranty Status</p>
              <p className={`font-medium ${device.isUnderWarranty ? 'text-green-600' : 'text-red-600'}`}>
                {device.isUnderWarranty ? 'Active' : 'Expired'}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(device.batteryLevel < 20 || device.connectionStatus === 'offline') && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-bold text-yellow-900 mb-2">Device Alerts</h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {device.batteryLevel < 20 && (
                    <li>• Low battery: {device.batteryLevel}% remaining. Please charge soon.</li>
                  )}
                  {device.connectionStatus === 'offline' && (
                    <li>• Device is offline. Check connection and power.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostics */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-4">Diagnostics</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Temperature Sensor</span>
              <span className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-sm font-medium">
                  {device.status?.temperature ? `${device.status.temperature}°C` : 'Normal'}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Motor Status</span>
              <span className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-sm font-medium">{device.status?.motorStatus || 'Idle'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Door Status</span>
              <span className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-sm font-medium">{device.status?.doorStatus || 'Closed'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeviceDetailsPage;
