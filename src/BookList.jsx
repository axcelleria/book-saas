import { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useNavigate, Link } from 'react-router-dom'; 
import { useAuth } from './contexts/AuthContext';

const BookList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [filters, setFilters] = useState({
    title: '',
    author: '',
    category: '',
    tags: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    authors: [],
    categories: [],
    tags: []
  });
  const navigate = useNavigate();

  // Initialize Materialize components and load data
  useEffect(() => {
    M.AutoInit();
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/books');
      const data = await response.json();
      setBooks(data);
      setFilteredBooks(data);
    } catch (error) {
      M.toast({ html: 'Error loading books' });
      console.error('Error:', error);
    }
  };

  // Apply filters whenever books or filters change
  useEffect(() => {
    let result = books;

    // Text filters
    if (filters.title) {
      result = result.filter(book => 
        book.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    if (filters.author) {
      result = result.filter(book => 
        book.author.toLowerCase().includes(filters.author.toLowerCase())
      );
    }
    if (filters.category) {
      result = result.filter(book => 
        book.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    if (filters.tags) {
      result = result.filter(book => 
        book.tags.toLowerCase().includes(filters.tags.toLowerCase())
      );
    }

    // Active filters (from clicking on author/category/tags)
    if (activeFilters.authors.length > 0) {
      result = result.filter(book => 
        activeFilters.authors.includes(book.author)
      );
    }
    if (activeFilters.categories.length > 0) {
      result = result.filter(book => 
        activeFilters.categories.includes(book.category)
      );
    }
    if (activeFilters.tags.length > 0) {
      result = result.filter(book => 
        activeFilters.tags.some(tag => book.tags.split(',').map(t => t.trim()).includes(tag))
      );
    }
    M.Tooltip.init(document.querySelectorAll('.tooltipped'));

    setFilteredBooks(result);
  }, [books, filters, activeFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFilter = (type, value) => {
    setActiveFilters(prev => {
      const currentValues = [...prev[type]];
      if (currentValues.includes(value)) {
        return prev; // Already filtered by this value
      }
      return {
        ...prev,
        [type]: [...currentValues, value]
      };
    });
  };

  const handleRemoveFilter = (type, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(v => v !== value)
    }));
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

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

  return (
    <div className="container">
      {/* Page Title */}
      <h2 className="center-align">Book Library</h2>

      {/* Filter Bar */}
      <div className="card-panel grey lighten-4">
        <div className="row">
          <div className="input-field col s12 m3">
            <input
              type="text"
              id="filter-title"
              name="title"
              value={filters.title}
              onChange={handleFilterChange}
            />
            <label htmlFor="filter-title">Filter by Title</label>
          </div>
          <div className="input-field col s12 m3">
            <input
              type="text"
              id="filter-author"
              name="author"
              value={filters.author}
              onChange={handleFilterChange}
            />
            <label htmlFor="filter-author">Filter by Author</label>
          </div>
          <div className="input-field col s12 m3">
            <input
              type="text"
              id="filter-category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            />
            <label htmlFor="filter-category">Filter by Category</label>
          </div>
          <div className="input-field col s12 m3">
            <input
              type="text"
              id="filter-tags"
              name="tags"
              value={filters.tags}
              onChange={handleFilterChange}
            />
            <label htmlFor="filter-tags">Filter by Tags</label>
          </div>
        </div>

        {/* Active Filters */}
        {Object.values(activeFilters).flat().length > 0 && (
          <div className="active-filters">
            <h5>Active Filters:</h5>
            {activeFilters.authors.map(author => (
              <div key={`author-${author}`} className="chip">
                {author}
                <i className="close material-icons" onClick={() => handleRemoveFilter('authors', author)}>
                  close
                </i>
              </div>
            ))}
            {activeFilters.categories.map(category => (
              <div key={`category-${category}`} className="chip">
                {category}
                <i className="close material-icons" onClick={() => handleRemoveFilter('categories', category)}>
                  close
                </i>
              </div>
            ))}
            {activeFilters.tags.map(tag => (
              <div key={`tag-${tag}`} className="chip">
                {tag}
                <i className="close material-icons" onClick={() => handleRemoveFilter('tags', tag)}>
                  close
                </i>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Table */}
      <table className="striped responsive-table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Title</th>
            <th>Author</th>
            <th>Category</th>
            <th>Type</th>
            <th style={{width: "100px" }}>Status</th>
            <th style={{width: "60px" }}><i className="material-icons">visibility</i></th>
            <th style={{width: "60px" }}><i className="material-icons">download</i></th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredBooks.length > 0 ? (
            filteredBooks.map(book => (
              <tr key={book.id}>
                <td>
                  <Link to={`/book/${generateSlug(book.title)}`}>
                    <img 
                      src={book.cover || 'https://placehold.co/60x80'} 
                      alt={book.title} 
                      style={{width: '60px', height: '80px', objectFit: 'cover'}}
                    />
                  </Link>
                </td>
                <td>
                  <Link to={`/book/${generateSlug(book.title)}`}>{book.title}</Link>
                </td>
                <td>
                  <a 
                    href="#!" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddFilter('authors', book.author);
                    }}
                    className="blue-text"
                  >
                    {book.author}
                  </a>
                </td>
                <td>
                  <a 
                    href="#!" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddFilter('categories', book.category);
                    }}
                    className="blue-text"
                  >
                    {book.category}
                  </a>
                </td>
                <td>
                  {book.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => (
                    <a
                      key={tag}
                      href="#!"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddFilter('tags', tag);
                      }}
                      className="blue-text"
                      style={{marginRight: '5px', display: 'inline-block'}}
                    >
                      #{tag}
                    </a>
                  ))}
                </td>
                <td>
                  <span className={`btn-small ${book.book_status === 1 ? 'green' : 'orange'}`} style={{ cursor: 'default' }}>
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
                {isAdmin && (
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
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="center-align">No books found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Only show FAB for admin */}
      {isAdmin && (
        <div className="fixed-action-btn">
          <Link 
            to="/add" 
            className="btn-floating btn-large blue waves-effect waves-light"
          >
            <i className="large material-icons">add</i>
          </Link>
        </div>
      )}
    </div>
  );
};

export default BookList;