import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './GetQuotePage.css';

const GetQuotePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: '',
    issueDescription: ''
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were rejected. Please only upload images or videos under 10MB.');
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...validFiles]);
    setError(null);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('deviceName', formData.deviceName);
      formDataToSend.append('deviceType', formData.deviceType);
      formDataToSend.append('issueDescription', formData.issueDescription);
      
      // Append each file to the FormData
      files.forEach((file, index) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('http://localhost:5000/api/quotes/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit quote');
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Reset form
      setFormData({
        deviceName: '',
        deviceType: '',
        issueDescription: ''
      });
      setFiles([]);
      setPreviewUrls([]);

      // Show success message and redirect to dashboard
      alert('Your quote request has been submitted! We will get back to you soon.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting quote:', error);
      setError(error.message || 'An error occurred while submitting your quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="get-quote-page">
      <div className="quote-form-container">
        <h2>Get Your Repair Quote</h2>
        <p>Tell us about your device and the issue you're experiencing.</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deviceName">Device Name/Model:</label>
            <input
              type="text"
              id="deviceName"
              name="deviceName"
              value={formData.deviceName}
              onChange={handleChange}
              placeholder="e.g., Logitech G Pro X Superlight, Razer BlackWidow V3"
              required
            />
          </div>

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

          <div className="form-group">
            <label htmlFor="files">Attach Images/Videos (Optional):</label>
            <input
              type="file"
              id="files"
              onChange={handleFileChange}
              accept="image/*,video/*"
              multiple
            />
            <small>You can upload multiple files. Maximum size: 10MB per file.</small>
          </div>

          {previewUrls.length > 0 && (
            <div className="preview-container">
              <h3>Attached Files:</h3>
              <div className="preview-grid">
                {previewUrls.map((url, index) => (
                  <div key={index} className="preview-item">
                    {files[index].type.startsWith('image/') ? (
                      <img src={url} alt={`Preview ${index + 1}`} />
                    ) : (
                      <video src={url} controls />
                    )}
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GetQuotePage; 