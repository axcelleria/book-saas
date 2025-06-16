import React, { useState } from 'react';
import { register } from '../../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    tosAgreed: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tosAgreed) {
      M.toast({ html: 'Please agree to Terms of Service' });
      return;
    }

    if (formData.password.length < 6) {
      M.toast({ html: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      await register(formData);
      M.toast({ html: 'Registration successful! Please sign in.' });
      navigate('/login');
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col s12 m8 offset-m2 l6 offset-l3">
          <div className="card-panel">
            <h4 className="center-align">Create Account</h4>
            <form onSubmit={handleSubmit}>
              <div className="input-field">
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
                <label htmlFor="fullName">Full Name</label>
              </div>

              <div className="input-field">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="input-field">
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <label htmlFor="password">Password</label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.tosAgreed}
                    onChange={(e) => setFormData({...formData, tosAgreed: e.target.checked})}
                    required
                  />
                  <span style={{ color: 'rgba(0,0,0,0.87)' }}>
                    I agree to the <Link to="/terms" target="_blank">Terms of Service</Link>
                  </span>
                </label>
              </div>

              <div className="center-align">
                <button type="submit" className="btn waves-effect waves-light">
                  Sign Up
                </button>
              </div>

              <div className="center-align" style={{ marginTop: '20px' }}>
                <span>
                  Already have an account? <Link to="/login">Sign In</Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;