import { API_URL } from '../config/api';

export const getActiveTrackingCodes = async (position) => {
  try {
    const response = await fetch(`${API_URL}/tracking-codes/active/${position}`);
    if (!response.ok) return [];
    const codes = await response.json();
    return codes;
  } catch (error) {
    console.error('Error fetching tracking codes:', error);
    return [];
  }
};

export const getTrackingCodeSnippet = (codes) => {
  return codes.map(code => {
    // Return cleaned code wrapped in script tag
    return code.code;
  }).join('\n');
};
