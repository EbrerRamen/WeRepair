import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await axios.get('/api/quotes/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await axios.patch(`/api/quotes/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications((prev) => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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

  if (loading) return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="error-message">Error: {error}</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome, Admin!</h1>
          <p>Manage users and repair quotes</p>
          <button className="logout-btn" onClick={() => window.location.href = '/login'}>Logout</button>
        </div>
        <div className="dashboard-tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Requests</button>
          <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
          <button className={`tab ${activeTab === 'quotes' ? 'active' : ''}`} onClick={() => setActiveTab('quotes')}>Quotes</button>
          <button className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            Notifications
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
        </div>
        {activeTab === 'notifications' && (
          <div className="dashboard-card">
            <h2>Notifications</h2>
            {notifLoading ? (
              <div className="notif-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              <div className="notif-list">
                {notifications.map(notif => (
                  <div key={notif._id} className={`notif-item${notif.read ? '' : ' unread'}`}>
                    <span className="notif-message">{notif.message}</span>
                    <span className="notif-date">{new Date(notif.createdAt).toLocaleString()}</span>
                    {!notif.read && (
                      <button className="mark-read-btn" onClick={() => markAsRead(notif._id)}>Mark as read</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'users' && (
          <div className="dashboard-card">
            <h2>User Management</h2>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 