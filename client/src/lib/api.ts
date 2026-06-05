import axios from 'axios';

// Cookie-based auth — withCredentials so the httpOnly JWT cookie is sent.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { error?: string })?.error ||
      err.message ||
      'Request failed'
    );
  }
  return 'Something went wrong';
}
