import { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// API functions
const API_URL = 'http://localhost:3001/api'; // Update with your backend URL

const saveBook = async (book) => {
  const url = book.id 
    ? `${API_URL}/books/${book.id}`
    : `${API_URL}/books`;
    
  const response = await fetch(url, {
    method: book.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save book');
  }

  return await response.json();
};

const BookForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    cover: '',
    author: '',
    description: '',
    category: '',
    tags: '',
    bookType: 'free',
    sourceUrl: '',
    discountCode: '',
    book_status: 0  // Add default status
  });

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load book data and categories
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // Load book if in edit mode
        if (isEditMode) {
          const response = await fetch(`${API_URL}/books/${id}`);
          if (!response.ok) {
            throw new Error('Book not found');
          }
          const bookData = await response.json();
          // Ensure tags is a string
          bookData.tags = Array.isArray(bookData.tags) 
            ? bookData.tags.join(', ') 
            : bookData.tags || '';
          setFormData(bookData);
        }

        // Load categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to load categories');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Initialize Materialize components after data is loaded
        setTimeout(() => {
          M.AutoInit();
          M.updateTextFields();
        }, 0);
      } catch (error) {
        M.toast({ html: `Error: ${error.message}` });
        navigate('/my-books');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode, navigate]);

  // Add new effect to handle label updates when formData changes
  useEffect(() => {
    M.updateTextFields();
  }, [formData]);

  // Initialize Materialize select when categories change
  useEffect(() => {
    const selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
  }, [categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? (checked ? value : prev[name]) : value
    }));
  };

  const handleCategoryChange = (e) => {
    setFormData({...formData, category: e.target.value});
  };

  const handleNewCategory = async () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      try {
        // Save new category to backend
        const response = await fetch(`${API_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedCategory })
        });

        if (response.ok) {
          setCategories([...categories, trimmedCategory]);
          setFormData({...formData, category: trimmedCategory});
          setNewCategory('');
          M.toast({ html: 'Category added successfully' });
        }
      } catch (error) {
        M.toast({ html: `Error adding category: ${error.message}` });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const bookData = {
        ...formData,
        user_id: user.id,  // Add user_id to book data
        tags: formData.tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
          .join(', ')
      };

      // Explicitly remove id when adding new book
      if (!isEditMode) {
        delete bookData.id;
      }

      await saveBook(bookData);
      M.toast({ html: `Book ${isEditMode ? 'updated' : 'added'} successfully!` });
      navigate('/my-books');
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this reset function
  const resetForm = () => {
    setFormData({
      title: '',
      cover: '',
      author: '',
      description: '',
      category: '',
      tags: '',
      bookType: 'free',
      sourceUrl: '',
      discountCode: '',
      id: null,  // Important: clear the id
      book_status: 0  // Reset status to default
    });
    // Reset form labels
    const labels = document.querySelectorAll('label');
    labels.forEach(label => label.classList.remove('active'));
  };

  if (isLoading) {
    return (
      <div className="container center-align" style={{ marginTop: '50px' }}>
        <div className="preloader-wrapper big active">
          <div className="spinner-layer spinner-blue-only">
            <div className="circle-clipper left">
              <div className="circle"></div>
            </div>
            <div className="gap-patch">
              <div className="circle"></div>
            </div>
            <div className="circle-clipper right">
              <div className="circle"></div>
            </div>
          </div>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col s12" style={{ marginBottom: '20px' }}>
          <h2 className="center-align">{isEditMode ? 'Edit Book' : 'Add New Book'}</h2>
          {isEditMode && (
            <div className="center-align">
              <button
                type="button"
                className="btn waves-effect waves-light orange"
                onClick={() => {
                  resetForm();
                  navigate('/add');  // Update URL without book ID
                }}
              >
                <i className="material-icons left">add</i>
                Add New Book Instead
              </button>
            </div>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Book Title */}
        <div className="input-field">
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <label htmlFor="title">Book Title</label>
        </div>

        {/* Book Cover */}
        <div className="input-field">
          <input
            id="cover"
            type="text"
            name="cover"
            value={formData.cover}
            onChange={handleChange}
            required
          />
          <label htmlFor="cover">Book Cover URL (e.g., https://placehold.co/240x320)</label>
        </div>
        {formData.cover && (
          <div className="center-align" style={{margin: '20px 0'}}>
            <img 
              src={formData.cover} 
              alt="Book Cover Preview" 
              className="responsive-img" 
              style={{maxHeight: '200px'}}
            />
          </div>
        )}

        {/* Author */}
        <div className="input-field">
          <input
            id="author"
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
          <label htmlFor="author">Author</label>
        </div>

        {/* Description */}
        <div className="input-field">
          <textarea
            id="description"
            className="materialize-textarea"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <label htmlFor="description">Short Description/Excerpt</label>
        </div>

        {/* Category */}
        <div className="input-field col s12">
          <select
            name="category"
            value={formData.category}
            onChange={handleCategoryChange}
            required
          >
            <option value="" disabled>Choose a category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <label>Book Category</label>
        </div>

        {/* New Category Input */}
        <div className="input-field col s12">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNewCategory()}
            placeholder="Or enter new category"
          />
          <button 
            type="button"
            className="btn-small waves-effect waves-light teal"
            onClick={handleNewCategory}
            disabled={!newCategory.trim()}
            style={{marginTop: '10px'}}
          >
            <i className="material-icons left">add</i>
            Add New Category
          </button>
        </div>

        {/* Tags */}
        <div className="input-field">
          <input
            id="tags"
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
          />
          <label htmlFor="tags">Tags (up to 5, comma separated)</label>
          <span className="helper-text">e.g., adventure, fantasy, magic, epic, young-adult</span>
        </div>

        {/* Book Type Radio Buttons */}
        <div style={{margin: '20px 0'}}>
          <label>Book Type:</label>
          <p>
            <label>
              <input
                name="bookType"
                type="radio"
                value="free"
                checked={formData.bookType === 'free'}
                onChange={handleChange}
              />
              <span>Free Book</span>
            </label>
          </p>
          <p>
            <label>
              <input
                name="bookType"
                type="radio"
                value="discount"
                checked={formData.bookType === 'discount'}
                onChange={handleChange}
              />
              <span>Discount Book</span>
            </label>
          </p>
        </div>

        {/* Source URL (always shown) */}
        <div className="input-field">
          <input
            id="sourceUrl"
            type="url"
            name="sourceUrl"
            value={formData.sourceUrl}
            onChange={handleChange}
            required
          />
          <label htmlFor="sourceUrl">Book Source URL</label>
        </div>

        {/* Discount Code (only shown for discount books) */}
        {formData.bookType === 'discount' && (
          <div className="input-field">
            <input
              id="discountCode"
              type="text"
              name="discountCode"
              value={formData.discountCode}
              onChange={handleChange}
              required={formData.bookType === 'discount'}
            />
            <label htmlFor="discountCode">Discount Code</label>
          </div>
        )}

        {/* Add Book Status Radio Buttons before Submit Button */}
        <div style={{margin: '20px 0'}}>
          <label>Book Status:</label>
          <p>
            <label>
              <input
                name="book_status"
                type="radio"
                value="0"
                checked={formData.book_status === 0}
                onChange={(e) => setFormData({...formData, book_status: parseInt(e.target.value)})}
              />
              <span>Paused</span>
            </label>
          </p>
          <p>
            <label>
              <input
                name="book_status"
                type="radio"
                value="1"
                checked={formData.book_status === 1}
                onChange={(e) => setFormData({...formData, book_status: parseInt(e.target.value)})}
              />
              <span>Published</span>
            </label>
          </p>
        </div>

        {/* Submit Button */}
        <div className="center-align" style={{marginTop: '30px'}}>
          <button
            className="btn waves-effect waves-light"
            type="submit"
            disabled={isLoading}
          >
            <i className="material-icons left">save</i>
            {isEditMode ? 'Update' : 'Save'} Book
          </button>
          {formData.id && (
            <button
              type="button"
              className="btn waves-effect waves-light grey"
              onClick={() => navigate('/')}
              style={{marginLeft: '10px'}}
              disabled={isLoading}
            >
              <i className="material-icons left">cancel</i>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BookForm;