// import React, { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { API_URL } from './config/api';

const TrackingManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trackingCodes, setTrackingCodes] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    platform: 'google-tag-manager',
    code: '',
    position: 'head',
    active: true
  });

  const platforms = [
    { value: 'google-tag-manager', label: 'Google Tag Manager' },
    { value: 'fb-pixel', label: 'Facebook Pixel' },
    { value: 'google-analytics', label: 'Google Analytics' },
    { value: 'twitter-pixel', label: 'Twitter Pixel' },
    { value: 'linkedin-insight', label: 'LinkedIn Insight Tag' },
    { value: 'custom', label: 'Custom Code' }
  ];

  const positions = [
    { value: 'head', label: 'Head (before </head>)' },
    { value: 'body-start', label: 'Body Start (after <body>)' },
    { value: 'body-end', label: 'Body End (before </body>)' }
  ];

  useEffect(() => {
    M.AutoInit();

    if( "admin" !== user.role ){
      navigate('/my-books');
      return;
    }

    fetchTrackingCodes();

  }, []);

  const fetchTrackingCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/tracking-codes`);
      if (!response.ok) throw new Error('Failed to fetch tracking codes');
      const data = await response.json();
      setTrackingCodes(data);
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = formData.id 
        ? `${API_URL}/tracking-codes/${formData.id}`
        : `${API_URL}/tracking-codes`;
        
      const response = await fetch(url, {
        method: formData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save tracking code');

      await fetchTrackingCodes();
      M.toast({ html: `Tracking code ${formData.id ? 'updated' : 'added'} successfully!` });
      resetForm();
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    }
  };

  const handleEdit = (id) => {
    const codeToEdit = trackingCodes.find(code => code.id === id);
    if (codeToEdit) {
      setFormData(codeToEdit);
      // Scroll to form
      document.getElementById('tracking-form').scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tracking code?')) {
      try {
        const response = await fetch(`${API_URL}/tracking-codes/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete tracking code');

        await fetchTrackingCodes();
        M.toast({ html: 'Tracking code deleted successfully' });
      } catch (error) {
        M.toast({ html: `Error: ${error.message}` });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      platform: 'google-tag-manager',
      code: '',
      position: 'head',
      active: true
    });
  };

  return (
    <div className="container">
      <h3 className="center-align">Tracking Code Manager</h3>
      
      <div className="card-panel">
        <form id="tracking-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="input-field col s12 m6">
              <select
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                required
              >
                {platforms.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
              <label>Platform</label>
            </div>

            <div className="input-field col s12 m6">
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              >
                {positions.map(position => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </select>
              <label>Position</label>
            </div>
          </div>

          <div className="input-field">
            <textarea
              id="code"
              className="materialize-textarea"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              style={{ fontFamily: 'monospace', minHeight: '150px' }}
            />
            <label htmlFor="code">Tracking Code</label>
          </div>

          <div className="switch">
            <label>
              Inactive
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              <span className="lever"></span>
              Active
            </label>
          </div>

          <div className="center-align" style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className="btn waves-effect waves-light blue"
            >
              <i className="material-icons left">save</i>
              {formData.id ? 'Update' : 'Save'} Code
            </button>
            {formData.id && (
              <button
                type="button"
                className="btn waves-effect waves-light grey"
                onClick={resetForm}
                style={{ marginLeft: '10px' }}
              >
                <i className="material-icons left">cancel</i>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card-panel" style={{ marginTop: '30px' }}>
        <h5 className="center-align">Saved Tracking Codes</h5>
        {trackingCodes.length === 0 ? (
          <p className="center-align">No tracking codes saved yet</p>
        ) : (
          <table className="highlight responsive-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trackingCodes.map(code => (
                <tr key={code.id}>
                  <td>
                    {platforms.find(p => p.value === code.platform)?.label || code.platform}
                  </td>
                  <td>
                    {positions.find(p => p.value === code.position)?.label || code.position}
                  </td>
                  <td>
                    <span className={`btn-small ${code.active ? 'green' : 'black'}`}>
                      {code.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-small waves-effect waves-light blue"
                      onClick={() => handleEdit(code.id)}
                      title="Edit"
                    >
                      <i className="material-icons">edit</i>
                    </button>
                    <button
                      className="btn-small waves-effect waves-light red"
                      onClick={() => handleDelete(code.id)}
                      title="Delete"
                      style={{ marginLeft: '10px' }}
                    >
                      <i className="material-icons">delete</i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TrackingManager;