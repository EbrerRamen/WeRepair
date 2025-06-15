import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchRepairRequests = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/quotes/my-quotes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch repair requests');
        }

        const data = await response.json();
        setRepairRequests(data.quotes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'repairs') {
      fetchRepairRequests();
    }
  }, [activeTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'reviewed':
        return '#4169E1';
      case 'accepted':
        return '#32CD32';
      case 'rejected':
        return '#FF0000';
      default:
        return '#666';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this repair request?')) {
      return;
    }

    setCancellingId(requestId);
    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel request');
      }

      // Remove the cancelled request from the state
      setRepairRequests(prevRequests => 
        prevRequests.filter(request => request._id !== requestId)
      );

      // Show success message
      alert('Repair request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert(error.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome, {user?.name}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Manage your repair requests and account settings
          </motion.p>
          <motion.button
            className="logout-btn"
            onClick={handleLogout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Logout
          </motion.button>
        </div>

        <div className="dashboard-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'repairs' ? 'active' : ''}`}
            onClick={() => setActiveTab('repairs')}
          >
            My Repairs
          </button>
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="overview-section"
            >
              <div className="dashboard-card">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <Link to="/contact" className="btn-primary">
                    Request New Repair
                  </Link>
                  <button className="btn-secondary">View History</button>
                </div>
              </div>

              <div className="dashboard-card">
                <h2>Recent Activity</h2>
                <div className="recent-activity">
                  <p className="no-activity">No recent activity to show</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'repairs' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="repairs-section"
            >
              <div className="dashboard-card">
                <h2>My Repair Requests</h2>
                {loading ? (
                  <div className="loading">Loading your repair requests...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : repairRequests.length === 0 ? (
                  <div className="repairs-list">
                    <p className="no-repairs">No repair requests yet. Start by requesting a repair!</p>
                  </div>
                ) : (
                  <div className="repairs-list">
                    {repairRequests.map((request) => (
                      <div key={request._id} className="repair-request-card">
                        <div className="repair-header">
                          <div className="device-info">
                            <h3>{request.deviceName}</h3>
                            <span className="device-type">{request.deviceType}</span>
                          </div>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(request.status) }}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <p className="issue-description">{request.issueDescription}</p>
                        
                        {request.files && request.files.length > 0 && (
                          <div className="repair-images">
                            {request.files.map((file, index) => (
                              file.mimetype.startsWith('image/') ? (
                                <div key={index} className="image-container">
                                  <img 
                                    src={`http://localhost:5000/uploads/${file.filename}`}
                                    alt={`Repair image ${index + 1}`}
                                    className="repair-image"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                                    }}
                                  />
                                </div>
                              ) : file.mimetype.startsWith('video/') ? (
                                <div key={index} className="video-container">
                                  <video 
                                    src={`http://localhost:5000/uploads/${file.filename}`}
                                    controls
                                    className="repair-video"
                                  />
                                </div>
                              ) : null
                            ))}
                          </div>
                        )}

                        <div className="repair-footer">
                          <span className="date">
                            Submitted: {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                          {request.status === 'pending' && (
                            <button 
                              className="btn-secondary cancel-button"
                              onClick={() => handleCancelRequest(request._id)}
                              disabled={cancellingId === request._id}
                            >
                              {cancellingId === request._id ? 'Cancelling...' : 'Cancel Request'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="profile-section"
            >
              <div className="dashboard-card">
                <h2>Your Profile</h2>
                <div className="profile-info">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
                </div>
                <div className="action-buttons">
                  <button className="btn-secondary">Edit Profile</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 