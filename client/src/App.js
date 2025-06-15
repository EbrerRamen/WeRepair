import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import GetQuotePage from './components/GetQuotePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import EditProfile from './components/EditProfile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
    <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/contact" element={<GetQuotePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          </Routes>
    </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
