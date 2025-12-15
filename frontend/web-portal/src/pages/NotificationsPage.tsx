import { useEffect, useState } from 'react';
import { Bell, Check, Filter } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getAllNotifications, markNotificationAsRead } from '../api/services';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getAllNotifications(filter === 'all');
      setNotifications(data.data?.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      alert('Failed to mark notification as read');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        
        <div className="flex items-center gap-2">
          <Filter className="text-gray-600" size={20} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="unread">Unread Only</option>
            <option value="all">All Notifications</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-gray-500 text-lg">No notifications to display</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'unread' ? "You're all caught up!" : "You haven't received any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl border-l-4 border-r border-t border-b p-5 shadow-sm transition-all ${
                notif.isRead ? 'opacity-60' : ''
              } ${getPriorityColor(notif.priority)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{notif.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    <span className="px-2 py-1 bg-white rounded border border-gray-200 uppercase tracking-wider">
                      {notif.type}
                    </span>
                    {notif.priority && (
                      <span className={`px-2 py-1 rounded uppercase tracking-wider font-medium ${
                        notif.priority === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : notif.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {notif.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotificationsPage;
