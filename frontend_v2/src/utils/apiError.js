export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error?.response) return 'Unable to reach the server. Check that the backend is running.';
  return error.response.data?.message || fallback;
}
