import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10_000,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message;
    return Promise.reject(new Error(message));
  },
);

export default client;
