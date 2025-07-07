import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import M from 'materialize-css/dist/js/materialize.min.js';
import { API_URL } from '../../config/api';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    M.updateTextFields();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      M.toast({ html: 'Profile updated successfully' });

      // If email changed, log out user
      if (updatedUser.email !== user.email) {
        await logout();
        navigate('/login');
      }
    } catch (error) {
      M.toast({ html: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      M.toast({ html: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      M.toast({ html: 'Password updated successfully. Please login again.' });
      await logout();
      navigate('/login');
    } catch (error) {
      M.toast({ html: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col s12 m8 offset-m2">
          <h4>Profile Settings</h4>
          
          {/* Profile Info Form */}
          <div className="card-panel">
            <h5>Personal Information</h5>
            <form onSubmit={handleProfileUpdate}>
              <div className="input-field">
                <input
                  id="fullName"
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  required
                />
                <label htmlFor="fullName">Full Name</label>
              </div>

              <div className="input-field">
                <input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  required
                />
                <label htmlFor="email">Email</label>
              </div>

              <button 
                type="submit" 
                className="btn waves-effect waves-light"
                disabled={loading}
              >
                Update Profile
              </button>
            </form>
          </div>

          {/* Password Change Form */}
          <div className="card-panel">
            <h5>Change Password</h5>
            <form onSubmit={handlePasswordUpdate}>
              <div className="input-field">
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
                <label htmlFor="currentPassword">Current Password</label>
              </div>

              <div className="input-field">
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
                <label htmlFor="newPassword">New Password</label>
              </div>

              <div className="input-field">
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
                <label htmlFor="confirmPassword">Confirm New Password</label>
              </div>

              <button 
                type="submit" 
                className="btn waves-effect waves-light"
                disabled={loading}
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;