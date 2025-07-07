import { API_URL }  from './config/api.js';

export const getBooks = async () => {
  const response = await fetch(`${API_URL}/books`);
  return await response.json();
};

export const getBook = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}`);
  return await response.json();
};

export const saveBook = async (book) => {
  const response = await fetch(`${API_URL}/books`, {
    method: book.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  return await response.json();
};

export const deleteBook = async (id) => {
  await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
};

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return await response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  return await response.json();
};

// Category Management
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return await response.json();
};

export const getCategory = async (id) => {
  const response = await fetch(`${API_URL}/categories/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category');
  }
  return await response.json();
};

export const createCategory = async (category) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: category.name,
      description: category.description,
      parentId: category.parentId || null
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }
  return await response.json();
};

export const updateCategory = async (id, category) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: category.name,
      description: category.description,
      parentId: category.parentId || null
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }
  return await response.json();
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }
};