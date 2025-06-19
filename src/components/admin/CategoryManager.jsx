import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api';
import M from 'materialize-css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', parentId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Initialize all Materialize selects
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
  }, [categories]); // Reinitialize when categories change

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        setSuccess('Category updated successfully');
      } else {
        await createCategory(formData);
        setSuccess('Category created successfully');
      }
        setFormData({ name: '', description: '', parentId: '' });
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parent_id || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteCategory(id);
      setSuccess('Category deleted successfully');
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="row" style={{ margin: '20px' }}>
      {/* Form Column - 30% width */}
      <div className="col s4">
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-content">
              <span className="card-title">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </span>

              {error && <div className="card-panel red lighten-4 red-text">{error}</div>}
              {success && <div className="card-panel green lighten-4 green-text">{success}</div>}

              {/* Category Name */}
              <div className="input-field">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <label htmlFor="name" className={formData.name ? 'active' : ''}>
                  Category Name *
                </label>
              </div>

              {/* Parent Category Dropdown */}
              <div className="input-field">
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">Select parent category (optional)</option>
                  {categories
                    .filter(cat => !cat.parent_id)
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
                <label>Parent Category</label>
              </div>

              {/* Description */}
              <div className="input-field">
                <textarea
                  id="description"
                  className="materialize-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <label htmlFor="description" className={formData.description ? 'active' : ''}>
                  Description
                </label>
              </div>

              <div className="card-action" style={{ paddingLeft: 0 }}>
                <button
                  type="submit"
                  className="btn waves-effect waves-light"
                >
                  {editingCategory ? 'Update' : 'Add'}
                  <i className="material-icons right">send</i>
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setFormData({ name: '', description: '', parentId: '' });
                    }}
                    className="btn grey waves-effect waves-light"
                    style={{ marginLeft: '10px' }}
                  >
                    Cancel
                    <i className="material-icons right">cancel</i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Table Column - 70% width */}
      <div className="col s8">
        <div className="card" style={{ margin: 0 }}>
          <div className="card-content" style={{ padding: 0 }}>
            <div style={{ height: '75vh', overflow: 'auto' }}>
              <table className="striped highlight">
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1, boxShadow: '0 2px 2px rgba(0,0,0,0.1)' }}>
                  <tr>
                    <th>Name</th>
                    <th>Parent Category</th>
                    <th>Description</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const parentCategory = categories.find(c => c.id === category.parent_id);
                    return (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{parentCategory ? parentCategory.name : '-'}</td>
                        <td>{category.description || '-'}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(category)}
                            className="btn-small waves-effect waves-light blue"
                            style={{ marginRight: '5px' }}
                          >
                            <i className="material-icons">edit</i>
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="btn-small waves-effect waves-light red"
                          >
                            <i className="material-icons">delete</i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
