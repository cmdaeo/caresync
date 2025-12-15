import { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { getAllNotifications, markNotificationAsRead } from '../api/services';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, _] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
        const data = await getAllNotifications(false);
        const notifList = data.data?.notifications || data.notifications || [];
        setNotifications(Array.isArray(notifList) ? notifList : []);
    } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]); // Set empty array on error instead of crashing
    }
    };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications(); // Refresh list
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 relative text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg z-50 border border-gray-200 max-h-96 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center sticky top-0">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 border-b hover:bg-gray-50 transition-colors flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{notif.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleMarkRead(notif.id)}
                    className="flex-shrink-0 text-teal-600 hover:text-teal-700 p-1 hover:bg-teal-50 rounded transition-colors"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
