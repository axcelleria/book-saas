import { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const API_URL = 'http://localhost:3001/api';

const isSuperAdmin = (user) => user?.role === 'admin';

const defaultCover = 'https://placehold.co/240x320/teal/white?text=Book+Cover';

const generateSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const organizeCategories = (categories) => {
  const parents = categories.filter(cat => !cat.parent_id);
  const children = categories.filter(cat => cat.parent_id);
  
  return parents.map(parent => ({
    ...parent,
    children: children.filter(child => child.parent_id === parent.id)
  }));
};

const BookForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Initial form state with all database fields
  const [formData, setFormData] = useState({
    id: null,
    user_id: user?.id || null,
    title: '',
    slug: '',
    cover: '',
    author: '',
    description: '',
    category: '',
    tags: '',
    book_type: 'free',
    source_url: '',
    discount_code: '',
    book_status: 0,
    view_count: 0,
    download_count: 0,
    created_at: null,
    updated_at: null,
    paused_at: null
  });

  const [categories, setCategories] = useState([]);
  const [organizedCategories, setOrganizedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
          
          // Format tags if needed
          bookData.tags = Array.isArray(bookData.tags) 
            ? bookData.tags.join(', ') 
            : bookData.tags || '';
            
          setFormData(bookData);
        }

        // Load and organize categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to load categories');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
        setOrganizedCategories(organizeCategories(categoriesData));

        // Initialize Materialize components
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
  }, [id, isEditMode, navigate, user]);

  // Update Materialize form fields when data changes
  useEffect(() => {
    M.updateTextFields();
  }, [formData]);

  // Initialize Materialize select when categories change
  useEffect(() => {
    const selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
  }, [categories]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' 
        ? (name === 'book_status' ? parseInt(value) : value)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare book data with correct field names
      const bookData = {
        id: formData.id,
        user_id: user.id,
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        cover: formData.cover,
        author: formData.author,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
          .join(', '),
        book_type: formData.book_type,
        source_url: formData.source_url,
        discount_code: formData.discount_code,
        book_status: parseInt(formData.book_status)
      };

      // Remove id for new books
      if (!isEditMode) {
        delete bookData.id;
      }

      await saveBook(bookData);
      M.toast({ html: `Book ${isEditMode ? 'updated' : 'added'} successfully!` });
      let redirectUrl = isSuperAdmin(user) ? '/books' : '/my-books';
      navigate(redirectUrl);
    } catch (error) {
      M.toast({ html: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
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
    <div className="container-fluid" style={{ padding: '20px' }}>
      <div className="row">
        <div className="col s12" style={{ marginBottom: '20px' }}>
          {/* <h2 className="center-align">{isEditMode ? 'Edit Book' : 'Add New Book'}</h2> */}
        </div>
      </div>

      <div className="row" style={{ display: 'flex', margin: 0 }}>
        {/* Form Section - Left side */}
        <div className="col s6" style={{ padding: '0 30px' }}>
          <form onSubmit={handleSubmit}>
            {/* Title */}
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

            {/* Cover URL */}
            <div className="input-field">
              <input
                id="cover"
                type="text"
                name="cover"
                value={formData.cover}
                onChange={handleChange}
                required
              />
              <label htmlFor="cover">Book Cover URL</label>
            </div>

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
              <label htmlFor="description">Description</label>
            </div>

            {/* Category */}
            <div className="input-field">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Choose a category</option>
                {organizedCategories.map(parent => (
                  <optgroup key={parent.id} label={parent.name}>
                    {parent.children.map(child => (
                      <option key={child.id} value={child.name}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <label>Category</label>
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
              <label htmlFor="tags">Tags (comma separated)</label>
            </div>

            {/* Book Type */}
            <div style={{ margin: '20px 0' }}>
              <label>Book Type:</label>
              <p>
                <label>
                  <input
                    name="book_type"
                    type="radio"
                    value="free"
                    checked={formData.book_type === 'free'}
                    onChange={handleChange}
                  />
                  <span>Free Book</span>
                </label>
              </p>
              <p>
                <label>
                  <input
                    name="book_type"
                    type="radio"
                    value="discount"
                    checked={formData.book_type === 'discount'}
                    onChange={handleChange}
                  />
                  <span>Discount Book</span>
                </label>
              </p>
            </div>

            {/* Source URL */}
            <div className="input-field">
              <input
                id="source_url"
                type="url"
                name="source_url"
                value={formData.source_url}
                onChange={handleChange}
                required
              />
              <label htmlFor="source_url">Book Source URL</label>
            </div>

            {/* Discount Code */}
            {formData.book_type === 'discount' && (
              <div className="input-field">
                <input
                  id="discount_code"
                  type="text"
                  name="discount_code"
                  value={formData.discount_code}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="discount_code">Discount Code</label>
              </div>
            )}

            {/* Book Status */}
            <div style={{ margin: '20px 0' }}>
              <label>Book Visibility:</label>
              <p>
                <label>
                  <input
                    name="book_status"
                    type="radio"
                    value="1"
                    checked={parseInt(formData.book_status) === 1}
                    onChange={handleChange}
                  />
                  <span>
                    {/* <i className="material-icons tiny" style={{ verticalAlign: 'middle', marginRight: '8px' }}>visibility</i> */}
                    Public
                  </span>
                </label>
              </p>
              <p>
                <label>
                  <input
                    name="book_status"
                    type="radio"
                    value="0"
                    checked={parseInt(formData.book_status) === 0}
                    onChange={handleChange}
                  />
                  <span>
                    {/* <i className="material-icons tiny" style={{ verticalAlign: 'middle', marginRight: '8px' }}>pause_circle_filled</i> */}
                    Pending
                  </span>
                </label>
              </p>
            </div>

            {/* Submit Button */}
            <div className="input-field">
              <button type="submit" className="btn waves-effect waves-light">
                {isEditMode ? 'Update Book' : 'Add Book'}
                <i className="material-icons right">send</i>
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section - Right side */}
        <div className="col s6" style={{ padding: '0 30px' }}>
          <div className="card">
            <div className="card-content">
              <div className="book-preview">
                <div className="center-align" style={{ marginBottom: '20px' }}>
                  <img
                    src={formData.cover || defaultCover}
                    alt="Book Cover"
                    className="responsive-img"
                    style={{ maxHeight: '320px' }}
                  />
                </div>

                {formData.source_url ? (
                  <a href={formData.source_url} target="_blank" rel="noopener noreferrer">
                    <h5>{formData.title || 'Book Title'}</h5>
                  </a>
                ) : (
                  <h5>{formData.title || 'Book Title'}</h5>
                )}

                <p className="grey-text text-darken-2">
                  {formData.author || 'Author Name'}
                </p>

                <p style={{ marginBottom: '20px' }}>
                  {formData.description || 'Book description will appear here...'}
                </p>

                {formData.category && (
                  <div className="chip teal white-text">
                    {formData.category}
                  </div>
                )}

                {formData.tags && formData.tags.split(',').map((tag, index) => (
                  <div key={index} className="chip">
                    {tag.trim()}
                  </div>
                ))}

                <div style={{ marginTop: '15px' }}>
                  <div className={`chip ${parseInt(formData.book_status) === 1 ? 'teal' : 'grey'} white-text`}>
                    <i className="material-icons tiny" style={{ marginRight: "10px", verticalAlign: 'text-bottom' }}>
                      {parseInt(formData.book_status) === 1 ? 'visibility' : 'visibility_off'}
                    </i>
                    {parseInt(formData.book_status) === 1 ? 'Public' : 'Paused'}
                  </div>

                  {formData.book_type === 'discount' && formData.discount_code && (
                    <div className="chip amber darken-1 white-text">
                      <i className="material-icons tiny" style={{ marginRight: "10px", verticalAlign: 'text-bottom' }}>local_offer</i>
                      {formData.discount_code}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookForm;