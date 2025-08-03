import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="page-footer blue-grey darken-3">
      <div className="container">
        <div className="row">
          <div className="col l6 s12">
            <h5 className="white-text">Optread</h5>
            <p className="grey-text text-lighten-4">
              Your go-to platform for discovering and accessing quality books and exclusive discounts.
            </p>
          </div>
          <div className="col l4 offset-l2 s12">
            <h5 className="white-text">Links</h5>
            <ul>
              <li>
                <Link to="/books" className="grey-text text-lighten-3">
                    Bookshelf
                </Link>
              </li>
              <li>
                <Link to="/terms" className="grey-text text-lighten-3">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/policy" className="grey-text text-lighten-3">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://ideas.optread.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grey-text text-lighten-3"
                >
                  Roadmap
                </a>
              </li>
              <li>
                <a
                  href="https://support.optread.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grey-text text-lighten-3"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        <div className="container">
          © {new Date().getFullYear()} Optread. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;