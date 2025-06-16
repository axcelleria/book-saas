import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';

const AuthActions = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (dropdownRef.current) {
      M.Dropdown.init(dropdownRef.current);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
    M.toast({ html: 'Logged out successfully' });
  };

  if (!user) {
    return (
      <div>
        <a 
          className="dropdown-trigger" 
          href="#!" 
          data-target="user-dropdown"
          ref={dropdownRef}
        >
          <i className="material-icons">account_circle</i>
        </a>
        <ul id="user-dropdown" className="dropdown-content">
          <li>
            <Link to="/login">Sign In</Link>
          </li>
          <li>
            <Link to="/register">Sign Up</Link>
          </li>
        </ul>
      </div>
    );
  }

  if ("admin" !==user.role ) {
    return (
      <div>
        <a 
          className="dropdown-trigger" 
          href="#!" 
          data-target="user-dropdown"
          ref={dropdownRef}
        >
          <i className="material-icons left">account_circle</i>
          {user.full_name}
        </a>

        <ul id="user-dropdown" className="dropdown-content">
          <li>
            <Link to="/my-books">
              <i className="material-icons">book</i> My Books
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <i className="material-icons">info</i> Profile
            </Link>
          </li>

          <li className="divider"></li>
          <li>
            <a href="#!" onClick={handleLogout}>
              <i className="material-icons">exit_to_app</i>Sign Out
            </a>
          </li>
        </ul>
      </div>
    );
  }
  //super admin menus
  return (
    <div>
      <a 
        className="dropdown-trigger" 
        href="#!" 
        data-target="user-dropdown"
        ref={dropdownRef}
      >
        <i className="material-icons left">account_circle</i>
        {user.full_name}
      </a>

      <ul id="user-dropdown" className="dropdown-content">
        <li>
          <Link to="/books">
            <i className="material-icons">book</i> Books
          </Link>
        </li>
        <li>
          <Link to="/users">
            <i className="material-icons">group</i> Users
          </Link>
        </li>
        <li>
          <Link to="/tracking-codes">
            <i className="material-icons">code</i> Tracking Codes
          </Link>
        </li>

        <li className="divider"></li>

        <li>
          <Link to="/profile">
            <i className="material-icons">info</i> Profile
          </Link>
        </li>
        <li>
          <a href="#!" onClick={handleLogout}>
            <i className="material-icons">exit_to_app</i>Sign Out
          </a>
        </li>
      </ul>

    </div>
  )

};

export default AuthActions;
