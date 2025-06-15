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
  const [selectedImage, setSelectedImage] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'requests') {
        fetchAllRepairRequests();
      }
    } else if (activeTab === 'repairs') {
      fetchRepairRequests();
    }
  }, [activeTab, user?.role]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchAllRepairRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/quotes/all', {
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

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Refresh users list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

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

      setRepairRequests(prevRequests => 
        prevRequests.filter(request => request._id !== requestId)
      );

      alert('Repair request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert(error.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const handleEditRequest = (requestId) => {
    navigate(`/edit-request/${requestId}`);
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this repair request?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject request');
      }

      // Update the request status in the state
      setRepairRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status: 'rejected' }
            : request
        )
      );

      alert('Repair request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request');
    }
  };

  const renderAdminDashboard = () => (
    <div className="dashboard-content">
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="overview-section"
        >
          <div className="dashboard-card">
            <h2>Admin Overview</h2>
            <div className="action-buttons">
              <Link to="/manage-quotes" className="btn-primary">
                Manage Repair Quotes
              </Link>
              <Link to="/manage-users" className="btn-secondary">
                Manage Users
              </Link>
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

      {activeTab === 'requests' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="repairs-section"
        >
          <div className="dashboard-card">
            <h2>Repair Requests</h2>
            {loading ? (
              <div className="loading">Loading repair requests...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : repairRequests.length === 0 ? (
              <div className="repairs-list">
                <p className="no-repairs">No repair requests found.</p>
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
                                onClick={() => handleImageClick(`http://localhost:5000/uploads/${file.filename}`)}
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
                        <div className="request-actions">
                          <button 
                            className="btn-secondary reject-button"
                            onClick={() => handleRejectRequest(request._id)}
                          >
                            Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="users-section"
        >
          <div className="dashboard-card">
            <h2>User Management</h2>
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="users-list">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <select 
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'quotes' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="quotes-section"
        >
          <div className="dashboard-card">
            <h2>Repair Quotes</h2>
            {loading ? (
              <div className="loading">Loading quotes...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="quotes-list">
                {/* Quote management UI will go here */}
                <p>Quote management interface coming soon...</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderUserDashboard = () => (
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
            <h2>Requests</h2>
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
                                onClick={() => handleImageClick(`http://localhost:5000/uploads/${file.filename}`)}
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
                        <div className="request-actions">
                          <button 
                            className="btn-secondary edit-button"
                            onClick={() => handleEditRequest(request._id)}
                          >
                            Edit Request
                          </button>
                          <button 
                            className="btn-secondary cancel-button"
                            onClick={() => handleCancelRequest(request._id)}
                            disabled={cancellingId === request._id}
                          >
                            {cancellingId === request._id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        </div>
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
              <Link to="/edit-profile" className="btn-secondary">Edit Profile</Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

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
            {user?.role === 'admin' ? 'Manage users and repair quotes' : 'Manage your repair requests and account settings'}
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
          {user?.role === 'admin' ? (
            <>
              <button 
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                Requests
              </button>
              <button 
                className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
              <button 
                className={`tab ${activeTab === 'quotes' ? 'active' : ''}`}
                onClick={() => setActiveTab('quotes')}
              >
                Quotes
              </button>
            </>
          ) : (
            <>
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
                Requests
              </button>
              <button 
                className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
            </>
          )}
        </div>

        {user?.role === 'admin' ? renderAdminDashboard() : renderUserDashboard()}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>×</button>
            <img src={selectedImage} alt="Full size" className="full-size-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 