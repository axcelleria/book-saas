import { useState, useEffect, useRef } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { Link, useLocation } from 'react-router-dom';
import { getAllBooks, incrementBookDownloads } from './services/bookService';
import { useTrackingCodes } from './hooks/useTrackingCodes';

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
  const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
  localStorage.setItem(STORAGE_KEY, email);
  localStorage.setItem(EXPIRY_KEY, expiry.toString());
};

const Landing = () => {
  useTrackingCodes();

  const location = useLocation();
  const bookSlug = location.state?.bookSlug;
  const [randomBook, setRandomBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [tosAgreed, setTosAgreed] = useState(false);
  const [isVerified, setIsVerified] = useState(!!getStoredEmail());
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const fetchedBooks = await getAllBooks();
        setBooks(fetchedBooks);
        
        if (fetchedBooks.length > 0) {
          let selectedBook;
          if (bookSlug) {
            selectedBook = fetchedBooks.find(b => 
              generateSlug(b.title) === bookSlug
            );
            // Track download when coming from BookDetail
            if (selectedBook && selectedBook.id) {
              await incrementBookDownloads(selectedBook.id);
            }
          }
          
          if (!selectedBook) {
            const randomIndex = Math.floor(Math.random() * fetchedBooks.length);
            selectedBook = fetchedBooks[randomIndex];
          }

          setRandomBook(selectedBook);
          document.title = selectedBook.title;
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };

    // Initialize tracking code here
    // Example: Google Analytics, Facebook Pixel, etc.
    // console.log('Initialize tracking code');

    M.AutoInit();
    fetchBooks();
  }, [bookSlug]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !tosAgreed) return;

    try {
      // TODO: Add API call to save email to your backend
      setStoredEmail(email);
      setIsVerified(true);
      M.Modal.getInstance(modalRef.current).close();
      M.toast({ html: 'Email verified successfully!' });
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    }
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

  if (books.length === 0) {
    return (
      <div className="container center-align" style={{ marginTop: '50px' }}>
        <div className="card-panel blue lighten-5">
          <i className="material-icons large">menu_book</i>
          <h4>No Books Added Yet</h4>
          <p>Start building your book collection by adding your first book!</p>
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
      {isVerified ? (
        <>
          <h3 className="center-align">Read {randomBook.title}</h3>
          
          <div className="card horizontal" style={{ marginTop: '30px' }}>
            <div className="card-image" style={{ width: '240px', padding: '20px' }}>
              <img 
                src={randomBook.cover || 'https://placehold.co/240x320'} 
                alt={randomBook.title}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="card-stacked">
              <div className="card-content">
                <h4>{randomBook.title}</h4>
                <h5>By {randomBook.author}</h5>
                <div className="divider" style={{ margin: '15px 0' }}></div>
                <p>{randomBook.description || 'No description available.'}</p>

                <div className="divider" style={{ margin: '15px 0' }}></div>
                <a href={ randomBook.sourceUrl } target="_blank" className="btn btn-small green">
                    <i className="material-icons left">download</i> Download</a>
                <div className="row" style={{ marginTop: '20px' }}>
                  <div className="col s6">
                    <span className="chip teal white-text">
                      {randomBook.category || 'Uncategorized'}
                    </span>

                {randomBook.tags && randomBook.tags.split(',').map(tag => (
                  <span key={tag} className="chip">{tag.trim()}</span>
                ))}

                  </div>
                  <div className="col s6 right-align">
                    <Link 
                      to={`/book/${generateSlug(randomBook.title)}`} 
                      className="btn waves-effect waves-light"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="center-align" style={{ marginTop: '40px' }}>
            <button 
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * books.length);
                setRandomBook(books[randomIndex]);
              }}
              className="btn waves-effect waves-light grey"
            >
              <i className="material-icons left">autorenew</i>
              Show Another Book
            </button>
            
            <Link 
              to="/books" 
              className="btn waves-effect waves-light blue"
              style={{ marginLeft: '10px' }}
            >
              <i className="material-icons left">list</i>
              Bookshelf
            </Link>
          </div>
        </>
      ) : (
        <div className="center-align" style={{ marginTop: '50px' }}>
          <h4>Welcome to Our Book Collection</h4>
          <p>Please verify your email to access our free and discounted books.</p>
        </div>
      )}

      {/* Email Verification Modal */}
      <div id="verifyModal" className="modal" ref={modalRef}>
        <form onSubmit={handleEmailSubmit}>
          <div className="modal-content">
            <h4>Welcome!</h4>
            <p>Please verify your email to access our collection of free and discounted books.</p>
            <div className="input-field">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="email">Your Email</label>
            </div>
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={tosAgreed}
                  onChange={(e) => setTosAgreed(e.target.checked)}
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
              disabled={!email || !tosAgreed}
            >
              <i className="material-icons left">check</i>
              Start Reading
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to generate slugs
const generateSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default Landing;