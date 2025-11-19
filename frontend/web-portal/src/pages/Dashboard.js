import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);

        // Fetch user-specific data
        const medsResponse = await api.get('/medications');
        setMedications(medsResponse.data.data);
        
        const presResponse = await api.get('/prescriptions');
        setPrescriptions(presResponse.data.data);

      } catch (err) {
        setError('Failed to load dashboard data.');
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <button onClick={handleLogout}>Logout</button>

      <h2>Your Medications</h2>
      {medications.length > 0 ? (
        <ul>
          {medications.map((med) => (
            <li key={med.id}>{med.name} - {med.dosage}</li>
          ))}
        </ul>
      ) : <p>No medications found.</p>}

      <h2>Your Prescriptions</h2>
      {prescriptions.length > 0 ? (
        <ul>
          {prescriptions.map((pres) => (
            <li key={pres.id}>Prescription from Dr. {pres.doctorName} on {new Date(pres.dateIssued).toLocaleDateString()}</li>
          ))}
        </ul>
      ) : <p>No prescriptions found.</p>}
    </div>
  );
}

export default Dashboard;
