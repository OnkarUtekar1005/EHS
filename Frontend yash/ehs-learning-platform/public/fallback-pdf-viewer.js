// This is a fallback PDF viewer script that uses browser's built-in PDF viewer
// It will be used when the PDF.js library fails to load

(function() {
  console.log('Fallback PDF viewer initializing');
  
  window.createFallbackPdfViewer = function(containerId, pdfUrl, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    
    // Create an iframe
    const iframe = document.createElement('iframe');
    
    // Get the current authentication token
    const token = localStorage.getItem('token');
    
    // Add token to URL if it exists and URL doesn't already have it
    let url = pdfUrl;
    if (token && !url.includes('token=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(token)}`;
    }
    
    // Set iframe attributes
    iframe.src = url;
    iframe.width = options.width || '100%';
    iframe.height = options.height || '600px';
    iframe.style.border = 'none';
    
    // Add sandbox attributes for security
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    
    // Clear container and append iframe
    container.innerHTML = '';
    container.appendChild(iframe);
    
    // If onLoad callback is provided
    if (options.onLoad && typeof options.onLoad === 'function') {
      iframe.onload = options.onLoad;
    }
    
    return {
      iframe,
      dispose: function() {
        container.innerHTML = '';
      }
    };
  };
  
  // Also create a helper function to get a direct download URL
  window.getDirectDownloadUrl = function(fileId) {
    // Base URL for the API
    const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
    
    // Get the current authentication token
    const token = localStorage.getItem('token');
    
    // Create URL with token
    let url = `${baseUrl}/api/materials/${fileId}/stream`;
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }
    
    return url;
  };
})();