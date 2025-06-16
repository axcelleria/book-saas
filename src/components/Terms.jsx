// import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="container">
      <div className="row">
        <div className="col s12">
          <h2>Terms of Service</h2>
          <div className="card-panel">
            <h4>1. Acceptance of Terms</h4>
            <p>By accessing and using this website, you accept and agree to be bound by the terms and conditions of this agreement.</p>

            <h4>2. Email Collection</h4>
            <p>We collect email addresses to:</p>
            <ul className="browser-default">
              <li>Provide access to book downloads and discount codes</li>
              <li>Send important updates about books you've accessed</li>
              <li>Prevent abuse of our service</li>
            </ul>

            <h4>3. Cookie Policy</h4>
            <p>We use cookies to:</p>
            <ul className="browser-default">
              <li>Remember your email verification for 24 hours</li>
              <li>Improve your browsing experience</li>
              <li>Analyze our website traffic</li>
            </ul>

            <h4>4. Usage Terms</h4>
            <p>You agree not to:</p>
            <ul className="browser-default">
              <li>Share or distribute access to download links</li>
              <li>Use automated systems to access our services</li>
              <li>Submit false or misleading information</li>
            </ul>

            <h4>5. Privacy Policy</h4>
            <p>We are committed to protecting your privacy. Your email address will:</p>
            <ul className="browser-default">
              <li>Never be sold to third parties</li>
              <li>Be stored securely</li>
              <li>Only be used for the purposes stated above</li>
            </ul>

            <div className="center-align" style={{ marginTop: '30px' }}>
              <Link to="/" className="btn waves-effect waves-light">
                <i className="material-icons left">arrow_back</i>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
