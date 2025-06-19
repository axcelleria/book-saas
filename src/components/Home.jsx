import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBooks } from '../services/bookService';
import M from 'materialize-css/dist/js/materialize.min.js';

const truncateDescription = (description) => {
  if (!description) return 'No description available.';
  const words = description.split(/\s+/);
  if (words.length <= 20) return description;
  return words.slice(0, 15).join(' ') + '...';
};

const Home = () => {
  const [randomBook, setRandomBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const fetchedBooks = await getAllBooks();
        // Filter out paused books
        const activeBooks = fetchedBooks.filter(book => book.book_status === 1);
        setBooks(activeBooks);
        
        if (activeBooks.length > 0) {
          const randomIndex = Math.floor(Math.random() * activeBooks.length);
          setRandomBook(activeBooks[randomIndex]);
        }
      } catch (error) {
        console.error('Error:', error);
        M.toast({ html: error.message });
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  if (loading) {
    return <div className="center-align">Loading...</div>;
  }

  if (!randomBook) {
    return <div className="center-align">No books available</div>;
  }

  return (
    <div className="container">
      <h3 className="center-align">Featured Book</h3>
      
      <div className="card horizontal">
        <div className="card-image" style={{ width: '320px', padding: '20px' }}>
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
            <p>{truncateDescription(randomBook.description)}</p>
            <div className="divider" style={{ margin: '15px 0' }}></div>
            <Link 
              to={`/book/${generateSlug(randomBook.title)}`}
              className="btn btn-large green"
            >
              <i className="material-icons left">info</i>
              View Details
            </Link>
            
            <div className="row" style={{ marginTop: '20px' }}>
              <div className="col s12">
                <span className="chip teal white-text">
                  {randomBook.category || 'Uncategorized'}
                </span>
                {randomBook.tags && randomBook.tags.split(',').map(tag => (
                  <span key={tag} className="chip">{tag.trim()}</span>
                ))}
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

export default Home;
