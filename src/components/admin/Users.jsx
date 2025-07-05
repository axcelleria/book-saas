import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import M from 'materialize-css/dist/js/materialize.min.js';
import { API_URL } from '../../config/api';
import { saveAs } from 'file-saver';

const roleOptions = [
  { label: 'Subscribers', value: 'subscriber' },
  { label: 'Contributors', value: 'contributor' }
];

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState(roleOptions.map(r => r.value));

  useEffect(() => {
    // Redirect non-admin users
    if (!user || user.role !== 'admin') {
      navigate('/my-books');
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      M.toast({ html: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      M.toast({ html: 'User deleted successfully' });
      setUsers(users.filter(u => u.id !== userId));
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
      fetchUsers();
    } catch (error) {
      M.toast({ html: error.message });
    }
  };

  const handleRoleCheckbox = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleExportCSV = () => {
    const filtered = users.filter(u => selectedRoles.includes(u.role));
    const csv = filtered.map(u => u.email).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'user_emails.csv');
  };

  if (loading) {
    return <div className="center-align">Loading...</div>;
  }

  return (
    <div className="container">
      <h4>Manage Users</h4>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>Export emails for:</span>
        {roleOptions.map(opt => (
          <label key={opt.value} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={selectedRoles.includes(opt.value)}
              onChange={() => handleRoleCheckbox(opt.value)}
              style={{ marginRight: 4 }}
            />
            <span>{opt.label}</span>
          </label>
        ))}
        <button className="btn-small blue" style={{ marginLeft: 12 }} onClick={handleExportCSV}>
          Export CSV
        </button>
      </div>
      <table className="striped responsive-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Books Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.user_status || 'active'}</td>
              <td>{u.book_count}</td>
              <td>
                {u.role !== 'admin' && (
                  <>
                    <button
                      className={`btn-small ${u.user_status === 'paused' ? 'green' : 'orange'} waves-effect waves-light`}
                      style={{ marginRight: 8 }}
                      onClick={() => handlePauseToggle(u.id, u.user_status)}
                    >
                      <i className="material-icons">
                        {u.user_status === 'paused' ? 'play_arrow' : 'pause'}
                      </i>
                    </button>
                    <button
                      className="btn-small red waves-effect waves-light"
                      onClick={() => handleDelete(u.id)}
                    >
                      <i className="material-icons">delete</i>
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
