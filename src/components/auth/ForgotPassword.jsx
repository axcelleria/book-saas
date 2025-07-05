import { useState } from 'react';
import { sendPasswordResetEmail } from '../../utils/email-service';
import { generateResetToken, createTokenExpiration } from '../../utils/token-service';
import { API_URL } from '../../config/api';
import M from 'materialize-css/dist/js/materialize.min.js';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const saveResetTokenToDB = async (email, token) => {
    const response = await fetch(`${API_URL}/auth/reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        token,
        expiresAt: createTokenExpiration(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save reset token');
    }

    return await response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Generate a secure random token
      const resetToken = generateResetToken();
      const resetLink = `${window.location.origin}/reset-password/${resetToken}`;

      // Debug: log email and reset link
      console.log('ForgotPassword: email to reset:', email);
      console.log('ForgotPassword: reset link:', resetLink);

      // 2. Save token to DB with expiration
      await saveResetTokenToDB(email, resetToken);

      // 3. Send email with reset link
      await sendPasswordResetEmail(email, resetLink);

      M.toast({ html: 'Password reset link sent to your email!' });
    } catch (err) {
      console.error('Password reset error:', err);
      M.toast({ html: `Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col s12 m6 offset-m3">
          <div className="card">
            <div className="card-content">
              <span className="card-title">Forgot Password</span>
              <form onSubmit={handleSubmit}>
                <div className="input-field">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label htmlFor="email">Email Address</label>
                </div>
                <button className="btn waves-effect waves-light" type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              {/* {message && <p className="grey-text">{message}</p>} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;