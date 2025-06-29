// src/utils/imageUtils.js

/**
 * Check whether an HTMLImageElement is fully loaded.
 * @param {HTMLImageElement|null} img
 * @returns {boolean} True if the image is loaded and has valid dimensions.
 */
export function isImageLoaded(img) {
    return !!(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
}
