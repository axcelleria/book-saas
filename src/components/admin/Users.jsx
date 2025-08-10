import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import M from 'materialize-css/dist/js/materialize.min.js';
import { API_URL } from '../../config/api';

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contributors, setContributors] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect non-admin users
    if (!user || user.role !== 'admin') {
      navigate('/my-books');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch contributors
      const contributorsResponse = await fetch(`${API_URL}/users`);
      if (!contributorsResponse.ok) throw new Error('Failed to fetch contributors');
      const contributorsData = await contributorsResponse.json();
      setContributors(contributorsData.filter(u => u.role === 'contributor'));

      // Fetch subscribers with book count
      const subscribersResponse = await fetch(`${API_URL}/subscribers/summary`);
      if (!subscribersResponse.ok) throw new Error('Failed to fetch subscribers');
      const subscribersData = await subscribersResponse.json();
      setSubscribers(subscribersData);
    } catch (error) {
      M.toast({ html: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContributor = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this contributor? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete contributor');

      M.toast({ html: 'Contributor deleted successfully' });
      setContributors(contributors.filter(u => u.id !== userId));
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    if (!window.confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subscribers/${subscriberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete subscriber');

      M.toast({ html: 'Subscriber deleted successfully' });
      setSubscribers(subscribers.filter(s => s.id !== subscriberId));
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  const handlePauseToggle = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_status: currentStatus === 'paused' ? 'active' : 'paused' })
      });
      if (!response.ok) throw new Error('Failed to update user status');
      M.toast({ html: `User ${currentStatus === 'paused' ? 'unpaused' : 'paused'} successfully` });
      fetchData();
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  // const handleRoleCheckbox = (role) => {
  //   setSelectedRoles(prev =>
  //     prev.includes(role)
  //       ? prev.filter(r => r !== role)
  //       : [...prev, role]
  //   );
  // };

  const handleExportSubscribers = async () => {
    try {
      const response = await fetch(`${API_URL}/subscribers/export-all`);
      if (!response.ok) throw new Error('Failed to export subscribers');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  const handleSendResetPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error('Failed to send reset password link');
      M.toast({ html: 'Reset password link sent successfully' });
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  if (loading) {
    return <div className="center-align">Loading...</div>;
  }

  return (
    <div className="container">
      <h4>Manage Users</h4>
      
      {/* Contributors Table */}
      <h5>Contributors</h5>
      <table className="striped responsive-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Books Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contributors.map(c => (
            <tr key={c.id}>
              <td>{c.full_name}</td>
              <td>{c.email}</td>
              <td>{c.user_status || 'active'}</td>
              <td>{c.book_count}</td>
              <td>
                <button
                  className={`btn-small ${c.user_status === 'paused' ? 'green' : 'orange'} waves-effect waves-light`}
                  style={{ marginRight: 8 }}
                  onClick={() => handlePauseToggle(c.id, c.user_status)}
                  title={c.user_status === 'paused' ? 'Unpause' : 'Pause'}
                >
                  <i className="material-icons">
                    {c.user_status === 'paused' ? 'play_arrow' : 'pause'}
                  </i>
                </button>
                <button
                  className="btn-small blue waves-effect waves-light"
                  style={{ marginRight: 8 }}
                  onClick={() => handleSendResetPassword(c.email)}
                  title="Send Reset Password Link"
                >
                  <i className="material-icons">lock_reset</i>
                </button>
                <button
                  className="btn-small red waves-effect waves-light"
                  onClick={() => handleDeleteContributor(c.id)}
                  title="Delete Contributor"
                >
                  <i className="material-icons">delete</i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Divider */}
      <div style={{ margin: '50px 0', borderBottom: '1px solid #ddd' }}></div>

      {/* Subscribers Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h5>Subscribers</h5>
        <button 
          className="btn blue waves-effect waves-light"
          onClick={handleExportSubscribers}
        >
          <i className="material-icons left">file_download</i>
          Export All Subscribers
        </button>
      </div>

      <table className="striped responsive-table" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th className='tooltipped' data-position="top" data-tooltip="Subscribed books count"><i className="material-icons tiny">rss_feed</i></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.book_count}</td>
              <td>
                <button
                  className="btn-small red waves-effect waves-light"
                  onClick={() => handleDeleteSubscriber(s.id)}
                  title="Delete Subscriber"
                >
                  <i className="material-icons">delete</i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
