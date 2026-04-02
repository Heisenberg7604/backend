const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL is not defined. Check your environment configuration.');
}

export default API_BASE;

