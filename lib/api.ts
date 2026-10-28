import axios from 'axios';
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.founderdesigngroup.ca').replace(/\/$/, '');
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 120000 });
