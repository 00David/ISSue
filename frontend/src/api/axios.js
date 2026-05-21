import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Preconfigured Axios instance for API requests.
 *
 * - baseURL: backend URL from VITE_API_URL
 * - withCredentials: enables cookies (auth/session support)
 */
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export default api;