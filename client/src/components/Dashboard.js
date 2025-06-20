import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Dashboard.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    estimatedCost: '',
    estimatedTime: '',
    notes: ''
  });
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectForm, setRejectForm] = useState({
    reason: ''
  });
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showAcceptConfirmation, setShowAcceptConfirmation] = useState(false);
  const [quoteToAccept, setQuoteToAccept] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'requests') {
        fetchRepairRequests();
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
      const endpoint = user?.role === 'admin' 
        ? 'http://localhost:5000/api/quotes/all'
        : 'http://localhost:5000/api/quotes/my-quotes';

      const response = await fetch(endpoint, {
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

  const handleRejectRequest = async (requestId) => {
    const request = repairRequests.find(r => r._id === requestId);
    setSelectedRequest(request);
    setShowRejectForm(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRequest) return;

    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${selectedRequest._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rejectForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject request');
      }

      // Update the request status in the state
      setRepairRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === selectedRequest._id 
            ? { ...request, status: 'rejected', rejectionReason: rejectForm.reason }
            : request
        )
      );

      setShowRejectForm(false);
      setSelectedRequest(null);
      setRejectForm({
        reason: ''
      });

      alert('Repair request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request');
    }
  };

  const handleRejectFormChange = (e) => {
    const { name, value } = e.target;
    setRejectForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAcceptRequest = async (requestId) => {
    const request = repairRequests.find(r => r._id === requestId);
    setSelectedRequest(request);
    setShowQuoteForm(true);
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRequest) return;

    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${selectedRequest._id}/quote`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send quote');
      }

      // Update the request status in the state
      setRepairRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === selectedRequest._id 
            ? { ...request, status: 'quoted', quote: quoteForm }
            : request
        )
      );

      setShowQuoteForm(false);
      setSelectedRequest(null);
      setQuoteForm({
        estimatedCost: '',
        estimatedTime: '',
        notes: ''
      });

      toast.success('Quote sent successfully');
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error(error.message || 'Failed to send quote');
    }
  };

  const handleQuoteFormChange = (e) => {
    const { name, value } = e.target;
    setQuoteForm(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleViewQuote = (request) => {
    setSelectedQuote(request);
    setShowQuoteDetails(true);
  };

  const handleAcceptQuote = async (quote) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${quote._id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to accept quote');
      }

      setShowAcceptConfirmation(false);
      setQuoteToAccept(null);
      setShowQuoteDetails(false);
      fetchRepairRequests();
      toast.success('Quote accepted successfully');
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error(error.message || 'Error accepting quote');
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

      {activeTab === 'requests' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="repairs-section"
        >
          <div className="dashboard-card">
            <h2>All Repair Requests</h2>
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
                    <p className="delivery-method-info">
                      <strong>Delivery Method:</strong> {request.deliveryMethod === 'pickup' ? 'Pickup (Receiver will come)' : 'Dropoff at Shop'}
                    </p>
                    {request.deliveryMethod === 'pickup' && (
                      <div className="pickup-address-info">
                        <p><strong>Pickup Address:</strong> {request.address || 'N/A'}</p>
                        <p><strong>City:</strong> {request.city || 'N/A'}</p>
                        <p><strong>Postal Code:</strong> {request.postalCode || 'N/A'}</p>
                      </div>
                    )}
                    
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
                      {user?.role === 'admin' && (
                        <div className="request-actions">
                          {request.status === 'pending' && (
                            <>
                              <button 
                                className="btn-primary accept-button"
                                onClick={() => handleAcceptRequest(request._id)}
                              >
                                Send Quote
                              </button>
                              <button 
                                className="btn-secondary"
                                onClick={() => handleRejectRequest(request._id)}
                              >
                                Reject Request
                              </button>
                            </>
                          )}
                          {(request.status === 'quoted' || request.status === 'accepted') && request.quote && (
                            <button 
                              className="btn-primary view-quote-button"
                              onClick={() => handleViewQuote(request)}
                            >
                              View Quote
                            </button>
                          )}
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
                    <p className="delivery-method-info">
                      <strong>Delivery Method:</strong> {request.deliveryMethod === 'pickup' ? 'Pickup (Receiver will come)' : 'Dropoff at Shop'}
                    </p>
                    {request.deliveryMethod === 'pickup' && (
                      <div className="pickup-address-info">
                        <p><strong>Pickup Address:</strong> {request.address || 'N/A'}</p>
                        <p><strong>City:</strong> {request.city || 'N/A'}</p>
                        <p><strong>Postal Code:</strong> {request.postalCode || 'N/A'}</p>
                      </div>
                    )}
                    
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
                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <>
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
                          </>
                        )}
                        {request.status === 'quoted' && request.quote && (
                          <>
                            <button 
                              className="btn-primary view-quote-button"
                              onClick={() => handleViewQuote(request)}
                            >
                              View Quote
                            </button>
                            <button 
                              className="btn-secondary cancel-button"
                              onClick={() => handleCancelRequest(request._id)}
                              disabled={cancellingId === request._id}
                            >
                              {cancellingId === request._id ? 'Cancelling...' : 'Cancel Request'}
                            </button>
                          </>
                        )}
                        {request.status === 'rejected' && request.rejection && (
                          <div className="rejection-info">
                            <p className="rejection-reason">
                              <strong>Rejection Reason:</strong> {request.rejection.reason}
                            </p>
                          </div>
                        )}
                      </div>
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

  const QuoteDetailsModal = () => (
    <div className="modal">
      <div className="modal-content">
        <h2>Quote Details</h2>
        {selectedQuote && selectedQuote.quote && (
          <div className="quote-details">
            <p><strong>Estimated Cost:</strong> TK{selectedQuote.quote.estimatedCost}</p>
            <p><strong>Estimated Time:</strong> {selectedQuote.quote.estimatedTime}</p>
            {selectedQuote.quote.notes && (
              <p><strong>Additional Notes:</strong> {selectedQuote.quote.notes}</p>
            )}
            <p><strong>Submitted On:</strong> {new Date(selectedQuote.quote.submittedAt).toLocaleDateString()}</p>
            
            {selectedQuote.status === 'quoted' && user?.role !== 'admin' && (
              <button 
                className="accept-quote-btn"
                onClick={() => {
                  setQuoteToAccept(selectedQuote);
                  setShowAcceptConfirmation(true);
                }}
              >
                Accept Quote
              </button>
            )}
          </div>
        )}
        <button className="close-modal" onClick={() => setShowQuoteDetails(false)}>×</button>
      </div>
    </div>
  );

  const AcceptConfirmationModal = () => (
    <div className="modal">
      <div className="modal-content">
        <h2>Accept Quote</h2>
        <p>Are you sure you want to accept this quote?</p>
        <div className="modal-actions">
          <button 
            className="confirm-btn"
            onClick={() => handleAcceptQuote(quoteToAccept)}
          >
            Yes, Accept
          </button>
          <button 
            className="cancel-btn"
            onClick={() => {
              setShowAcceptConfirmation(false);
              setQuoteToAccept(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
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

      {/* Quote Form Modal */}
      {showQuoteForm && selectedRequest && (
        <div className="modal" onClick={() => setShowQuoteForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowQuoteForm(false)}>×</button>
            <h2>Submit Quote for {selectedRequest.deviceName}</h2>
            <form onSubmit={handleQuoteSubmit} className="quote-form">
              <div className="form-group">
                <label htmlFor="estimatedCost">Estimated Cost (TK)</label>
                <input
                  type="number"
                  id="estimatedCost"
                  name="estimatedCost"
                  value={quoteForm.estimatedCost}
                  onChange={handleQuoteFormChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label htmlFor="estimatedTime">Estimated Time (days)</label>
                <input
                  type="number"
                  id="estimatedTime"
                  name="estimatedTime"
                  value={quoteForm.estimatedTime}
                  onChange={handleQuoteFormChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={quoteForm.notes}
                  onChange={handleQuoteFormChange}
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowQuoteForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Form Modal */}
      {showRejectForm && selectedRequest && (
        <div className="modal" onClick={() => setShowRejectForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Reject Repair Request</h2>
            <button className="close-modal" onClick={() => setShowRejectForm(false)}>×</button>
            <form onSubmit={handleRejectSubmit} className="quote-form">
              <div className="form-group">
                <label htmlFor="reason">Reason for Rejection</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={rejectForm.reason}
                  onChange={handleRejectFormChange}
                  rows="4"
                  required
                  placeholder="Please provide a detailed reason for rejecting this repair request..."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRejectForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-secondary reject-button">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuoteDetails && <QuoteDetailsModal />}
      {showAcceptConfirmation && <AcceptConfirmationModal />}
    </div>
  );
};

export default Dashboard;