import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyBooks } from '../services/bookService';
import M from 'materialize-css';
import { Link } from 'react-router-dom';

const MyBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [titleFilter, setTitleFilter] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);

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
  }, [titleFilter, books]);

  const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this book?')) {
        try {
          const response = await fetch(`http://localhost:3001/api/books/${id}`, {
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

  const generateSlug = (title) => {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-')   // Replace spaces with hyphens
      .replace(/-+/g, '-');    // Replace multiple hyphens with single
  };

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
            <th style={{ width: '55px' }}> <i className="material-icons tiny">visibility</i> </th>
            <th style={{ width: '55px' }}> <i className="material-icons tiny">file_download</i> </th>
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
              <td>
                {book.tags &&
                  book.tags.split(',').map((tag) => (
                    <span key={tag} className="chip">
                      {tag.trim()}
                    </span>
                  ))}
              </td>
              <td>
                {book.view_count || 0}
              </td>
              <td>
                {book.download_count || 0}
              </td>
              <td>
                <Link
                  to={`/edit/${book.id}`}
                  className="btn-small waves-effect waves-light"
                  style={{ marginRight: '5px' }}
                >
                  <i className="material-icons">edit</i>
                </Link>
                <button
                  className="btn-small red waves-effect waves-light"
                  onClick={() => handleDelete(book.id)}
                >
                  <i className="material-icons">delete</i>
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