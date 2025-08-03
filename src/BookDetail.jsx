import React, { useEffect, useState, useRef } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAllBooks, getBookBySlug, incrementBookViews } from './services/bookService';
import { API_URL } from './config/api';
import { sendWelcomeEmail } from './utils/email-service';

// Storage helpers
const STORAGE_KEY = 'bookEmail';
const EXPIRY_KEY = 'bookEmailExpiry';

const getStoredEmail = () => {
  const email = localStorage.getItem(STORAGE_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  
  if (!email || !expiry) return null;
  if (new Date().getTime() > parseInt(expiry)) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  }
  return email;
};

const setStoredEmail = (email) => {
  const expiry = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
  localStorage.setItem(STORAGE_KEY, email);
  localStorage.setItem(EXPIRY_KEY, expiry.toString());
};

const BookDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tosAgreed, setTosAgreed] = useState(false);
  const [userEmail, setUserEmail] = useState(getStoredEmail());
  const [showEmailForm, setShowEmailForm] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const foundBook = await getBookBySlug(slug);
        if (!foundBook || foundBook.book_status === 0) {
          M.toast({ html: 'Book is not available' });
          navigate('/');
          return;
        }
        setBook(foundBook);
        
        // Set page title with book name
        document.title = `${foundBook.title} - Book Details | Optread`;
        
        // Track book view
        await incrementBookViews(foundBook.id);
        
        // Fetch other books for recommendations
        const allBooks = await getAllBooks();
        const relatedBooks = allBooks
          .filter(b => b.book_status === 1 && b.id !== foundBook.id)
          .slice(0, 3);
        setBooks(relatedBooks);
      } catch (error) {
        console.error('Error fetching book:', error);
        M.toast({ html: 'Error loading book details' });
        navigate('/');
      }
      setLoading(false);
    };

    if (slug) {
      fetchData();
    } else {
      navigate('/');
    }
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'Optread';
    };
  }, [slug, navigate]);

  // Separate useEffect for modal initialization
  useEffect(() => {
    if (!loading && book) {
      const modalElement = document.querySelector('#downloadModal');
      const modalInstance = M.Modal.init(modalElement, {
        dismissible: true,
        onCloseEnd: () => {
          setName('');
          setTosAgreed(false); // Only reset name and TOS agreement
        }
      });

      // Cleanup on unmount
      return () => {
        if (modalInstance && modalInstance.destroy) {
          modalInstance.destroy();
        }
      };
    }
  }, [loading, book]); // Dependencies ensure modal is initialized after content loads

  // Check email verification on mount and pre-fill if exists
  useEffect(() => {
    const storedEmail = getStoredEmail();
    if (storedEmail) {
      setEmail(storedEmail); // Pre-fill email if it exists
    }
    if (!showEmailForm) {
      setShowEmailForm(true);
      const modalElem = document.querySelector('#downloadModal');
      if (modalElem) {
        const instance = M.Modal.getInstance(modalElem);
        if (instance) instance.open();
      }
    }
  }, []);

  const showRandomBook = () => {
    const randomIndex = Math.floor(Math.random() * books.length);
    setBook(books[randomIndex]);
  };

  // Update handleDownload function
  const handleDownload = async (e) => {
    e.preventDefault();
    if (!name || !email || !tosAgreed) return;
    try {
      // Register user with subscriber role
      const res = await fetch(`${API_URL}/subscriber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      setStoredEmail(email);
      setUserEmail(email);
      setShowEmailForm(false);
      M.Modal.getInstance(modalRef.current).close();
      M.toast({ html: 'Registration successful!' });
      navigate(`/landing/${generateSlug(book.title)}`);

      if (data.isNew) {
        // Send welcome email
        await sendWelcomeEmail(
          email,
          name,
          book.title,
          book.source_url,
          book.discount_code ? book.discount_code : 'FREE'
        );
      }
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    }
  };

  const handleCopyCoupon = (code) => {
    return () => {
      navigator.clipboard.writeText(code)
        .then(() => {
          M.toast({ html: 'Coupon code copied to clipboard!' });
        })
        .catch(err => {
          M.toast({ html: 'Failed to copy coupon code.' });
        });
    };
  };

  const renderSourceButton = () => {
    // Only allow download/discount for subscribers
    if (!userEmail) {
      return (
        <button 
          className="btn btn-large green modal-trigger"
          data-target="downloadModal"
        >
          <i className="material-icons left">download</i>
          {book.book_type === 'free' ? 'Get Free Copy' : 'Get Discounted Copy'}
        </button>
      );
    }

    return (
      <button 
        onClick={() => navigate('/landing', { 
          state: { bookSlug: generateSlug(book.title) } 
        })}
        className="btn btn-large green"
      >
        <i className="material-icons left">download</i>
        {book.book_type === 'free' ? 'View Downloads' : 'View Discounts'}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="container center-align" style={{ marginTop: '50px' }}>
        <div className="preloader-wrapper big active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left">
              <div className="circle"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container center-align" style={{ marginTop: '50px' }}>
        <div className="card-panel blue lighten-5">
          <i className="material-icons large">menu_book</i>
          <h4>No Books Found</h4>
          <p>Start building your book collection!</p>
          <Link 
            to="/add" 
            className="btn-large waves-effect waves-light blue"
            style={{ marginTop: '20px' }}
          >
            <i className="material-icons left">add</i>
            Add Your First Book
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h3 className="center-align">{!slug ? 'Featured Book' : 'Book Details'}</h3>
      
      <div className="card horizontal" style={{ marginTop: '30px' }}>
        <div className="card-image" style={{ width: '320px', padding: '20px' }}>
          <img 
            src={book.cover || 'https://placehold.co/240x320'} 
            alt={book.title}
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        <div className="card-stacked">
          <div className="card-content">
            <h4>{book.title}</h4>
            <h5>By {book.author}</h5>
            <div className="divider" style={{ margin: '15px 0' }}></div>
            {book.description.split('\n').map((line, index) => (
              <p key={index}>
                {line}
              </p>
            )) || '<p>No description available.</p>'}
            <div className="divider" style={{ margin: '15px 0' }}></div>
            {renderSourceButton()}
            {book.book_type === 'discount' && userEmail && (
            <div className="btn btn-large"
                style={{ marginLeft: '10px' }}
                onClick={handleCopyCoupon(book.discount_code)}
                title='Click to Copy Discount Code'
                >
              <i className="material-icons left">local_offer</i> {book.discount_code}
            </div>
            )}
            <div className="row" style={{ marginTop: '20px' }}>
              <div className="col s12">
                <span className="chip teal white-text">
                  {book.category || 'Uncategorized'}
                </span>
                {book.tags && book.tags.split(',').map(tag => (
                  <span key={tag} className="chip">{tag.trim()}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="center-align" style={{ marginTop: '40px' }}>
        {!slug && (
          <button 
            onClick={showRandomBook}
            className="btn waves-effect waves-light grey"
          >
            <i className="material-icons left">autorenew</i>
            Show Another Book
          </button>
        )}
        
        <Link 
          to="/books" 
          className="btn waves-effect waves-light blue"
          style={{ marginLeft: '10px' }}
        >
          <i className="material-icons left">list</i>
          Bookshelf
        </Link>
      </div>

      {/* Updated Modal */}
      <div id="downloadModal" className="modal" ref={modalRef}>
        <form onSubmit={handleDownload}>
          <div className="modal-content">
            <h4>Enter Your Name & Email to Unlock This Offer!</h4>
            <p>Sign up now to receive book discounts, VIP access to new releases, and exclusive giveaways!</p>
            <div className="input-field">
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <label htmlFor="name">Your Name</label>
            </div>
            <div className="input-field">
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <label htmlFor="email">Your Email</label>
            </div>
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={tosAgreed}
                  onChange={e => setTosAgreed(e.target.checked)}
                  required
                />
                <span>
                  I agree to the <Link to="/terms" target="_blank">Terms of Service</Link>
                </span>
              </label>
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="submit"
              className="btn waves-effect waves-light green"
              disabled={!name || !email || !tosAgreed}
            >
              <i className="material-icons left">check</i>
              Verify Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const generateSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default BookDetail;