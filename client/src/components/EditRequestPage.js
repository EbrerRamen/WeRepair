import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import './GetQuotePage.css';

const EditRequestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: '',
    issueDescription: '',
    deliveryMethod: 'dropoff', // 'dropoff' or 'pickup'
    address: '',
    city: '',
    postalCode: ''
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingFiles, setExistingFiles] = useState([]);

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/quotes/${requestId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: 'include'
        });

        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch request data');
        }

        const data = await response.json();
        console.log('Fetched request data:', data);

        // Check if data.quote exists (API might be returning data wrapped in a quote object)
        const requestData = data.quote || data;
        
        setFormData({
          deviceName: requestData.deviceName || '',
          deviceType: requestData.deviceType || '',
          issueDescription: requestData.issueDescription || '',
          deliveryMethod: requestData.deliveryMethod || 'dropoff',
          address: requestData.address || '',
          city: requestData.city || '',
          postalCode: requestData.postalCode || ''
        });
        
        if (requestData.files) {
          setExistingFiles(requestData.files);
        }
      } catch (error) {
        setError('Failed to load request data');
        console.error('Error fetching request:', error);
      }
    };

    if (requestId) {
      fetchRequestData();
    }
  }, [requestId]);

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

  const removeExistingFile = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quotes/${requestId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove file');
      }

      // Update the existing files state
      setExistingFiles(prev => prev.filter(file => file._id !== fileId));
    } catch (error) {
      console.error('Error removing file:', error);
      setError(error.message || 'Failed to remove file');
    }
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
      formDataToSend.append('deliveryMethod', formData.deliveryMethod);
      if (formData.deliveryMethod === 'pickup') {
        formDataToSend.append('address', formData.address);
        formDataToSend.append('city', formData.city);
        formDataToSend.append('postalCode', formData.postalCode);
      }
      
      // Append each new file to the FormData
      files.forEach((file, index) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch(`http://localhost:5000/api/quotes/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend,
        credentials: 'include'
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update quote');
      }

      const data = await response.json();
      console.log('Update response:', data);

      // Show success message and redirect to dashboard
      alert('Your repair request has been updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating quote:', error);
      setError(error.message || 'An error occurred while updating your quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="get-quote-page">
      <div className="quote-form-container">
        <h2>Edit Repair Request</h2>
        <p>Update your device information and issue description.</p>
        
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
            <select
              id="deviceType"
              name="deviceType"
              value={formData.deviceType}
              onChange={handleChange}
              required
            >
              <option value="">Select device type</option>
              <option value="Mouse">Mouse</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Headphone">Headphone</option>
              <option value="Controller">Controller</option>
            </select>
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

          {/* Delivery Method */}
          <div className="form-group delivery-method-group">
            <label>How will you deliver your device?</label>
            <div className="delivery-method-options">
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="dropoff"
                  checked={formData.deliveryMethod === 'dropoff'}
                  onChange={handleChange}
                />
                I will drop off my device at the shop
              </label>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={formData.deliveryMethod === 'pickup'}
                  onChange={handleChange}
                />
                Send a receiver to pick up my device
              </label>
            </div>
          </div>

          {formData.deliveryMethod === 'pickup' && (
            <div className="form-group address-fields">
              <div className="form-group">
                <label htmlFor="address">Pickup Address:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  required={formData.deliveryMethod === 'pickup'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City:</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  required={formData.deliveryMethod === 'pickup'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code:</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Enter your postal code"
                  required={formData.deliveryMethod === 'pickup'}
                />
              </div>
            </div>
          )}

          {existingFiles.length > 0 && (
            <div className="preview-container">
              <h3>Current Files:</h3>
              <div className="preview-grid">
                {existingFiles.map((file) => (
                  <div key={file._id} className="preview-item">
                    {file.mimetype.startsWith('image/') ? (
                      <img 
                        src={`http://localhost:5000/uploads/${file.filename}`}
                        alt="Existing file"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                        }}
                      />
                    ) : (
                      <video 
                        src={`http://localhost:5000/uploads/${file.filename}`}
                        controls
                      />
                    )}
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => removeExistingFile(file._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="files">Add New Images/Videos (Optional):</label>
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
              <h3>New Files to Upload:</h3>
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
              {loading ? 'Updating...' : 'Update Request'}
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

export default EditRequestPage; 