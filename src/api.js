const API_URL = 'http://localhost:3001/api'; // Change in production

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