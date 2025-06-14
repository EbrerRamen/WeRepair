import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}!</h1>
          <p>Manage your repair requests and account settings</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Your Profile</h2>
            <div className="profile-info">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <Link to="/contact" className="btn-primary">Request Repair</Link>
              <button className="btn-secondary">View History</button>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="dashboard-card">
              <h2>Admin Access</h2>
              <div className="action-buttons">
                <Link to="/admin" className="btn-primary">Admin Panel</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 