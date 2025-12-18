import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { useEffect } from 'react';

const RoleBasedDashboard = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Route based on user role
      switch (user.role) {
        case 'caregiver':
          navigate('/dashboard/caregiver');
          break;
        case 'patient':
          navigate('/dashboard');
          break;
        case 'healthcare_provider':
          navigate('/dashboard/caregiver'); // Healthcare providers get caregiver view
          break;
        case 'admin':
          navigate('/dashboard/caregiver'); // Admins get caregiver view
          break;
        default:
          navigate('/dashboard');
          break;
      }
    }
  }, [user, navigate]);

  return <div>Loading dashboard...</div>;
};

export default RoleBasedDashboard;