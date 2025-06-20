import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import axios from 'axios';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/quotes/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await axios.patch(`/api/quotes/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications((prev) => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          WeRepair
        </Link>
        
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <div className="notification-section-wrapper" ref={dropdownRef}>
                <button className="notification-section" onClick={() => setShowDropdown((s) => !s)}>
                  Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="notif-badge">{notifications.filter(n => !n.read).length}</span>
                  )}
                </button>
                {showDropdown && (
                  <div className="notification-dropdown">
                    {loading ? (
                      <div className="notif-loading">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="notif-empty">No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif._id}
                          className={`notif-item${notif.read ? '' : ' unread'}`}
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          <span className="notif-message">{notif.message}</span>
                          <span className="notif-date">{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link">Admin Panel</Link>
              )}
              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 