import React from 'react';
import { Link } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';
import AuthActions from './components/auth/AuthActions';
import { useAuth } from './contexts/AuthContext';

const Navbar = () => {
  const { user } = useAuth();

  // Initialize Materialize sidenav
  React.useEffect(() => {
    let sidenav = document.querySelector('.sidenav');
    M.Sidenav.init(sidenav, {});
  }, []);

  return (
    <>
      <nav className="blue darken-2">
        <div className="nav-wrapper container">
          <Link to="/" className="brand-logo">Opthread</Link>
          <a href="#!" data-target="mobile-demo" className="sidenav-trigger">
            <i className="material-icons">menu</i>
          </a>
          <ul className="right hide-on-med-and-down">
            <li><Link to="/books">Bookshelf</Link></li>
            {user && (
              <li><Link to="/add">Add New Book</Link></li>
            )}
            <li><AuthActions /></li>
          </ul>
        </div>
      </nav>

      {/* Mobile Side Navigation */}
      <ul className="sidenav" id="mobile-demo">
        <li><Link to="/" className="sidenav-close">All Books</Link></li>
        {user && (
          <li><Link to="/add" className="sidenav-close">Add New Book</Link></li>
        )}
      </ul>
    </>
  );
};

export default Navbar;