/**
 * Utility functions for image handling
 */

// Backend URL configuration
const BACKEND_URL = 'http://localhost:5001';

/**
 * Get the full URL for an image path
 * 
 * @param {string} imagePath - The path to the image
 * @param {string} defaultImage - Optional default image path if the image is not found
 * @returns {string} The full URL to the image
 */
export const getImageUrl = (imagePath, defaultImage = '/images/default-equipment.jpg') => {
  // If image path is null or undefined, return default image
  if (!imagePath) {
    console.log('Image path is empty, using default');
    return defaultImage;
  }
  
  // If image path starts with 'http', it's already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If image path starts with '/uploads', prepend with backend URL
  if (imagePath.startsWith('/uploads')) {
    const url = `${BACKEND_URL}${imagePath}`;
    return url;
  }
  
  // Return default image for all other cases
  return defaultImage;
};

/**
 * Standard image error handler
 * 
 * @param {Event} event - The error event
 * @param {string} fallbackImage - The fallback image to use
 */
export const handleImageError = (event, fallbackImage = '/images/default-equipment.jpg') => {
  console.log('Image failed to load:', event.target.src);
  event.target.src = fallbackImage;
  
  // Add a second fallback to prevent infinite loops if the fallback also fails
  event.target.onerror = null;
};
