import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import M from 'materialize-css/dist/js/materialize.min.js';

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch('/api/users');
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
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      M.toast({ html: 'User deleted successfully' });
      setUsers(users.filter(u => u.id !== userId));
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
      <table className="striped responsive-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
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
              <td>{u.book_count}</td>
              <td>
                {u.role !== 'admin' && (
                  <button 
                    className="btn-small red waves-effect waves-light"
                    onClick={() => handleDelete(u.id)}
                  >
                    <i className="material-icons">delete</i>
                  </button>
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
