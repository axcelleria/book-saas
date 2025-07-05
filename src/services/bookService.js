import { getToken } from '../utils/jwt';
import { API_URL } from '../config/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const getAllBooks = async () => {
  try {
    const response = await fetch(`${API_URL}/books`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
};

export const getBookBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/book/${slug}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching book:', error);
    return null;
  }
};

export const incrementBookViews = async (bookId) => {
  const response = await fetch(`${API_URL}/books/${bookId}/views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to update view count');
  }

  return await response.json();
};

export const incrementBookDownloads = async (bookId) => {
  const response = await fetch(`${API_URL}/books/${bookId}/downloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to update download count');
  }

  return await response.json();
};

export const getMyBooks = async (userId) => {
  const response = await fetch(`${API_URL}/my-books/${userId}`, {
    headers: authHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch books');
  return await response.json();
};

export const saveBook = async (book) => {
  const url = book.id 
    ? `${API_URL}/books/${book.id}`
    : `${API_URL}/books`;
    
  const response = await fetch(url, {
    method: book.id ? 'PUT' : 'POST',
    headers: authHeaders(),
    body: JSON.stringify(book)
  });

  if (!response.ok) {
    throw new Error('Failed to save book');
  }

  return await response.json();
};