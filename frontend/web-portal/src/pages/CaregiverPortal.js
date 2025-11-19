import React, { useState, useEffect } from 'react';
import api from '../services/api';

function CaregiverPortal() {
  const [caregiver, setCaregiver] = useState(null);
  const [patients, setPatients] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCaregiverData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setCaregiver(storedUser);
        
        // Assuming an endpoint exists to get a caregiver's patients
        const patientsResponse = await api.get('/caregivers/patients');
        setPatients(patientsResponse.data.data);

      } catch (err) {
        setError('Failed to load caregiver data.');
      }
    };

    fetchCaregiverData();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/caregivers/invite', { email: inviteEmail });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite.');
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!caregiver) return <p>Loading...</p>;

  return (
    <div>
      <h1>Caregiver Portal - Welcome, {caregiver.firstName}!</h1>
      <button onClick={handleLogout}>Logout</button>
      
      <h2>Your Patients</h2>
      {patients.length > 0 ? (
        <ul>
          {patients.map((p) => (
            <li key={p.patient.id}>{p.patient.firstName} {p.patient.lastName} ({p.status})</li>
          ))}
        </ul>
      ) : <p>You have no patients assigned.</p>}
      
      <h2>Invite a New Patient</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleInvite}>
        <input 
          type="email" 
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Patient's Email"
          required 
        />
        <button type="submit">Send Invite</button>
      </form>
    </div>
  );
}

export default CaregiverPortal;
