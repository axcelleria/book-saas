import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login } from '../../services/authService';
import M from 'materialize-css/dist/js/materialize.min.js';

const SignIn = () => {
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    M.updateTextFields();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(formData.email, formData.password);
      setUser(userData);
      M.toast({ html: 'Login successful!' });
      navigate('/my-books');
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col s12 m8 offset-m2 l6 offset-l3">
          <div className="card-panel">
            <h4 className="center-align">Sign In</h4>
            <form onSubmit={handleSubmit}>
              <div className="input-field">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="input-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <label htmlFor="password">Password</label>
                <span
                  className="material-icons prefix right"
                  style={{ cursor: 'pointer', top: '10px', right: '-10px'}}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <Link to="/forgot-password" className="blue-text">Forgot Password?</Link>
              </div>

              <div className="center-align">
                <button type="submit" className="btn waves-effect waves-light">
                  Sign In
                </button>
              </div>

              <div className="center-align" style={{ marginTop: '15px' }}>
                Don't have an account? <Link to="/register">Sign Up</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;