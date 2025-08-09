import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyBooks } from '../services/bookService';
import M from 'materialize-css';
import { Link } from 'react-router-dom';
import { API_URL }  from '../config/api.js';

const MyBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [titleFilter, setTitleFilter] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const subscriberCountsFetched = useRef(false);

  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        setLoading(true);
        const data = await getMyBooks(user.id);
        setBooks(data);
        setFilteredBooks(data); // Initialize filteredBooks with all books
      } catch (error) {
        M.toast({ html: error.message });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyBooks();
    }
  }, [user]);

  useEffect(() => {
    // Filter books by title whenever titleFilter or books change
    setFilteredBooks(
      books.filter((book) =>
        book.title.toLowerCase().includes(titleFilter.toLowerCase())
      )
    );

    M.Tooltip.init(document.querySelectorAll('.tooltipped'));
  }, [titleFilter, books]);

  const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this book?')) {
        try {
          const response = await fetch(`${API_URL}/books/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            const updatedBooks = books.filter(book => book.id !== id);
            setBooks(updatedBooks);
            setFilteredBooks(updatedBooks);
            M.toast({ html: 'Book deleted successfully' });
          } else {
            throw new Error('Failed to delete book');
          }
        } catch (error) {
          M.toast({ html: 'Error deleting book' });
          console.error('Error:', error);
        }
      }
    };

  const exportSubscribers = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/subscribers/export/${bookId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export subscribers');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers_${bookId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    }
  };

  const handleExportClick = (bookId) => {
    exportSubscribers(bookId);
  };

  const generateSlug = (title) => {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-')   // Replace spaces with hyphens
      .replace(/-+/g, '-');    // Replace multiple hyphens with single
  };

  const fetchSubscriberCount = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/subscribers/count/${bookId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscriber count');
      }
      const { count } = await response.json();
      return count;
    } catch (error) {
      console.error('Error fetching subscriber count:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (subscriberCountsFetched.current) return;

    const updateSubscriberCounts = async () => {
      try {
        const updatedBooks = await Promise.all(
          books.map(async (book) => {
            const subscriberCount = await fetchSubscriberCount(book.id);
            return { ...book, subscriberCount };
          })
        );
        setBooks(updatedBooks);
        setFilteredBooks(updatedBooks);
        subscriberCountsFetched.current = true;
      } catch (error) {
        console.error('Error updating subscriber counts:', error);
      }
    };

    if (books.length > 0) {
      updateSubscriberCounts();
    }
  }, [books]);

  if (loading) {
    return <div className="center-align">Loading...</div>;
  }

  if (books.length === 0) {
    return (
      <div className="container center-align" style={{ marginTop: '50px' }}>
        <div className="card-panel blue lighten-5">
          <i className="material-icons large">menu_book</i>
          <h4>No Books Added Yet</h4>
          <p>Start your book collection by adding your first book!</p>
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
      <div className="row">
        <div className="col s12">
          <h2>{ user.full_name }'s Bookshelf</h2>
        </div>
      </div>

      <div className="row">
        <div className="input-field col s12">
          <i className="material-icons prefix">search</i>
          <input
            id="titleFilter"
            type="text"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
          />
          <label htmlFor="titleFilter">Filter by Title</label>
        </div>
      </div>

      <table className="striped responsive-table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Title</th>
            <th>Author</th>
            <th>Category</th>
            <th>Tags</th>
            <th style={{width: "100px" }}>Status</th>
            <th style={{ width: '55px' }}> <i className="material-icons tiny">visibility</i> </th>
            <th style={{ width: '55px' }}> <i className="material-icons tiny">file_download</i> </th>
            <th style={{ width: '55px' }}>
              <i className="material-icons tiny">rss_feed</i>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map((book) => (
            <tr key={book.id}>
              <td>
                <img
                  src={book.cover || 'https://placehold.co/50x70'}
                  alt={book.title}
                  style={{
                    width: '50px',
                    height: '70px',
                    objectFit: 'cover',
                  }}
                />
              </td>
              <td><Link to={`/book/${generateSlug(book.title)}`}>{book.title}</Link></td>
              <td>{book.author}</td>
              <td>
                <span className="chip teal white-text">
                  {book.category || 'Uncategorized'}
                </span>
              </td>
              <td style={{ width: "200px" }}>
                {book.tags &&
                  book.tags.split(',').map((tag) => (
                    <span key={tag} className="chip">
                      {tag.trim()}
                    </span>
                  ))}
              </td>
                <td>
                  <span 
                    className={`btn-small ${book.book_status === 1 ? 'green' : 'orange'}`}
                    style={{ cursor: 'default' }}
                  >
                    <i className="material-icons tooltipped" data-position="top" data-tooltip={book.book_status === 1 ? 'Public' : 'Paused'}>
                      {book.book_status === 1 ? 'visibility' : 'visibility_off'}
                    </i>
                  </span>
                </td>
              <td>
                {book.view_count || 0}
              </td>
              <td>
                {book.download_count || 0}
              </td>
              <td>{book.subscriberCount || 0}</td>
              <td>
                <Link
                  to={`/edit/${book.id}`}
                  className="btn-small waves-effect waves-light tooltipped"
                  style={{ marginRight: '5px' }}
                  data-position="top"
                  data-tooltip="Edit Book"
                >
                  <i className="material-icons">edit</i>
                </Link>
                <button
                  className="btn-small red waves-effect waves-light tooltipped"
                  onClick={() => handleDelete(book.id)}
                  data-position="top"
                  data-tooltip="Delete Book"
                >
                  <i className="material-icons">delete</i>
                </button>
                <button
                  className="btn-small yellow darken-2 waves-effect waves-light tooltipped"
                  onClick={() => handleExportClick(book.id)}
                  data-position="top"
                  data-tooltip={book.subscriberCount === 0 ? "No Subscribers to Export" : "Export Subscribers"}
                  style={{ marginLeft: '5px' }}
                  disabled={book.subscriberCount === 0}
                >
                  <i className="material-icons">file_download</i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Floating Action Button */}
      <div className="fixed-action-btn">
        <Link
          to="/add"
          className="btn-floating btn-large blue waves-effect waves-light"
        >
          <i className="large material-icons">add</i>
        </Link>
      </div>
    </div>
  );
};

export default MyBooks;