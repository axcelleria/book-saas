export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com/api'
  : 'http://localhost:3001/api';

export const getHeaders = () => ({
  'Content-Type': 'application/json'
});