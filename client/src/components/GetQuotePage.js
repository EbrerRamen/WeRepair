import React, { useState } from 'react';
import './GetQuotePage.css';

const GetQuotePage = () => {
  const [formData, setFormData] = useState({
    deviceType: '',
    issueDescription: '',
    name: '',
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Quote Request Submitted:', formData);
    alert('Your quote request has been submitted! We will get back to you soon.');
    // Here you would typically send the data to a backend service
    setFormData({
      deviceType: '',
      issueDescription: '',
      name: '',
      email: '',
      phone: ''
    });
  };

  return (
    <div className="get-quote-page">
      <div className="quote-form-container">
        <h2>Get Your Repair Quote</h2>
        <p>Tell us about your device and the issue you're experiencing.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deviceType">Device Type:</label>
            <input
              type="text"
              id="deviceType"
              name="deviceType"
              value={formData.deviceType}
              onChange={handleChange}
              placeholder="e.g., Gaming Mouse, Mechanical Keyboard, Headset"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="issueDescription">Describe the Issue:</label>
            <textarea
              id="issueDescription"
              name="issueDescription"
              value={formData.issueDescription}
              onChange={handleChange}
              placeholder="e.g., Mouse double-clicks, Keyboard RGB not working, Headset mic static..."
              rows="5"
              required
            ></textarea>
          </div>

          <h3>Your Contact Information</h3>
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (Optional):</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-button">Submit Request</button>
        </form>
      </div>
    </div>
  );
};

export default GetQuotePage; 