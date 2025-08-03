import { useState, useEffect, useRef } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { Link, useLocation, useParams } from 'react-router-dom';
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

const Landing = () => {
  useTrackingCodes();

  const location = useLocation();
  const { slug } = useParams(); // Get slug from URL params
  const bookSlug = slug || location.state?.bookSlug; // Use URL param or location state
  const [landingBook, setLandingBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(!!getStoredEmail());

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const fetchedBooks = await getAllBooks();
        
        if (fetchedBooks.length > 0) {
          let selectedBook;
          if (bookSlug) {
            // Try to find book by exact slug match first
            selectedBook = fetchedBooks.find(b => b.slug === bookSlug);
            
            // If not found, try finding by generated slug from title
            if (!selectedBook) {
              selectedBook = fetchedBooks.find(b => 
                generateSlug(b.title) === bookSlug
              );
            }
            
            // Track download when book is found
            if (selectedBook && selectedBook.id) {
              await incrementBookDownloads(selectedBook.id);
            }
          }
          
          if (!selectedBook) {
            // If no book found by slug, show a random one
            const activeBooks = fetchedBooks.filter(b => b.book_status === 1);
            const randomIndex = Math.floor(Math.random() * activeBooks.length);
            selectedBook = activeBooks[randomIndex];
          }

          setLandingBook(selectedBook);
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };

    M.AutoInit();
    fetchBooks();
  }, [bookSlug]);

  // Update document title when landing book changes
  useEffect(() => {
    if (landingBook) {
      document.title = `${landingBook.title} - Optread`;
      // Restore default title when component unmounts
      return () => {
        document.title = 'Optread';
      };
    }
  }, [landingBook]);
  const getBookButton = (book) => {
    if ( book.book_type === 'free' ) {
      return (
        <a href={book.source_url} target="_blank" className="btn btn-large green">
          <i className="material-icons left">download</i>
          Claim Your Free Copy Now!
        </a>
      );
    } else {
      return (
        <>
        <a href={book.source_url} target="_blank" className="btn btn-large orange">
          <i className="material-icons left">local_offer</i>
          Claim Your Discounted Copy Now!
        </a>
        <div className="btn btn-large"
            style={{ marginLeft: '10px' }}
            onClick={handleCopyCoupon(book.discount_code)}
            title='Click to Copy Discount Code'
            >
          <i className="material-icons left">local_offer</i> {book.discount_code}
        </div>
      </>
      );
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
  

  return (
    <div className="container">
      {isVerified ? (
        <>
          <h3 className="center-align">Read {landingBook.title}</h3>
          
          <div className="card horizontal" style={{ marginTop: '30px' }}>
            <div className="card-image" style={{ width: '240px', padding: '20px' }}>
              <img 
                src={landingBook.cover || 'https://placehold.co/240x320'} 
                alt={landingBook.title}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="card-stacked">
              <div className="card-content">
                <h4>{landingBook.title}</h4>
                <h5>By {landingBook.author}</h5>
                <div className="divider" style={{ margin: '15px 0' }}></div>
                
                {landingBook.description ? (
                  landingBook.description.split('\n').map((line, index) => (
                    line.trim().length > 0 ? (
                      <p key={index}>{line}</p>
                    ) : null
                  ))
                ) : (
                  <p>No description available.</p>
                )}
                <div className="divider" style={{ margin: '15px 0' }}></div>
                
                {getBookButton(landingBook)}

                {landingBook.discount_price && landingBook.price && (
                  <div style={{ marginTop: '10px' }}>
                    <span className="grey-text" style={{ textDecoration: 'line-through', marginRight: '10px' }}>
                      ${landingBook.price.toFixed(2)}
                    </span>
                    <span className="green-text text-darken-2" style={{ fontSize: '1.2em' }}>
                      ${landingBook.discount_price.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="row" style={{ marginTop: '20px' }}>
                  <div className="col s12">
                    <span className="chip teal white-text">
                      {landingBook.category || 'Uncategorized'}
                    </span>

                    {landingBook.tags && landingBook.tags.split(',').map(tag => (
                      <span key={tag} className="chip">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="center-align" style={{ marginTop: '50px' }}>
          <h4>Welcome to Our Book Collection</h4>
          <p>Please verify your email to access our free and discounted books.</p>
          <Link
            to={`/book/${generateSlug(landingBook.title)}`} 
            className="btn waves-effect waves-light"
          >
            Return
          </Link>
        </div>
      )}

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