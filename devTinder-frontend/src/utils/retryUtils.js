/**
 * Retry utility with exponential backoff
 * Useful for handling transient failures like auth cookie issues
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry (should return a Promise)
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelayMs - Base delay in milliseconds (default: 500)
 * @param {number} options.maxDelayMs - Maximum delay in milliseconds (default: 5000)
 * @param {Function} options.shouldRetry - Function to determine if we should retry (default: retry on any error)
 * @returns {Promise} Result of the successful function call
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    maxDelayMs = 5000,
    shouldRetry = () => true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if shouldRetry returns false
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: delay = baseDelayMs * 2^attempt, capped at maxDelayMs
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Check if an error is retryable (transient)
 * @param {AxiosError} error - Axios error object
 * @returns {boolean} True if the error is likely transient
 */
export const isRetryableError = (error) => {
  // Retry on network errors
  if (!error.response) {
    return true;
  }

  const status = error.response.status;

  // Retry on server errors (5xx) and some 4xx (429 too many requests, 408 timeout)
  // Don't retry on 401 (auth) or 403 (forbidden) as they're permanent
  return (
    status >= 500 ||
    status === 429 ||
    status === 408
  );
};

/**
 * Determine retry strategy for auth-specific errors
 * @param {AxiosError} error - Axios error object
 * @param {number} attempt - Current attempt number
 * @returns {boolean} True if we should retry
 */
export const shouldRetryAuth = (error, attempt) => {
  // For 401s, only retry once or twice (cookie might be set after login)
  if (error?.response?.status === 401 && attempt > 1) {
    return false;
  }

  return isRetryableError(error);
};
