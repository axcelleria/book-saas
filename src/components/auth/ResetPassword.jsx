import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/auth/verify-reset-token/${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Invalid or expired token');
        }
        
        setIsValidToken(true);
      } catch (err) {
        setIsValidToken(false);
        setMessage(err.message);
        M.toast({ html: err.message, classes: 'red' });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      M.toast({ html: 'Password reset successfully!', classes: 'green' });
      navigate('/login');
    } catch (err) {
      setMessage(err.message);
      M.toast({ html: `Error: ${err.message}`, classes: 'red' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null || isLoading) {
    return (
      <div className="container center-align">
        <div className="preloader-wrapper big active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left">
              <div className="circle"></div>
            </div>
            <div className="gap-patch">
              <div className="circle"></div>
            </div>
            <div className="circle-clipper right">
              <div className="circle"></div>
            </div>
          </div>
        </div>
        <p>Verifying token...</p>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="container center-align">
        <h5>Invalid or Expired Token</h5>
        <p className="red-text">{message}</p>
        <a href="/forgot-password" className="btn waves-effect waves-light">
          Request New Reset Link
        </a>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col s12 m6 offset-m3">
          <div className="card">
            <div className="card-content">
              <span className="card-title">Reset Password</span>
              <form onSubmit={handleSubmit}>
                <div className="input-field">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword();
                    }}
                    required
                    minLength="6"
                    className={passwordError ? 'invalid' : ''}
                  />
                  <label htmlFor="password" className={password ? 'active' : ''}>
                    New Password (min 6 characters)
                  </label>
                  {passwordError && (
                    <span className="helper-text red-text">{passwordError}</span>
                  )}
                </div>
                <div className="input-field" style={{ marginTop: '-10px', marginBottom: '20px' }}>
                  <label style={{ userSelect: 'none', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword((v) => !v)}
                      style={{ marginRight: '8px', verticalAlign: 'middle' }}
                    />
                    <span style={{ verticalAlign: 'middle' }}>Show Password</span>
                  </label>
                </div>
                <div className="center-align">
                  <button
                    className="btn waves-effect waves-light"
                    type="submit"
                    disabled={isLoading || passwordError}
                  >
                    {isLoading ? (
                      <>
                        <i className="material-icons left">refresh</i>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
                {message && <p className="red-text center-align">{message}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;