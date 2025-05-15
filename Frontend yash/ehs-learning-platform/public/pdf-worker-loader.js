/**
 * Enhanced PDF.js Worker Loader Script
 * 
 * This script handles loading the PDF.js worker script with robust error handling and fallbacks:
 * 1. Tries to load the worker from the local server
 * 2. Falls back to a CDN if local loading fails
 * 3. Provides error handling for PDF viewing issues
 * 4. Helps with token authentication for protected PDFs
 */
(function() {
  console.log('Enhanced PDF Worker loader initializing...');
  
  // Get the current PDF.js version from the main PDF.js script
  const scriptElements = document.querySelectorAll('script');
  let pdfJsVersion = '3.11.174'; // Fallback version
  
  for (let i = 0; i < scriptElements.length; i++) {
    const src = scriptElements[i].src;
    if (src && src.includes('pdf.js') && !src.includes('worker')) {
      const match = src.match(/\/pdf\.js@([^/]+)/);
      if (match && match[1]) {
        pdfJsVersion = match[1];
        console.log('Detected PDF.js version:', pdfJsVersion);
        break;
      }
    }
  }
  
  // URL of the worker script - try multiple locations
  const workerUrls = [
    '/pdf.worker.min.js',
    '/pdfjs/build/pdf.worker.min.js',
    '/pdfjs/web/pdf.worker.js',
    '/static/pdf.worker.min.js'
  ];
  
  const cdnFallbackUrl = `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
  
  // Function to download the worker script
  function downloadWorker(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.timeout = 10000; // 10-second timeout
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          const blob = xhr.response;
          resolve(blob);
        } else {
          reject(new Error(`Failed to download worker from ${url}: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error(`Network error downloading worker from ${url}`));
      };
      
      xhr.ontimeout = function() {
        reject(new Error(`Timeout downloading worker from ${url}`));
      };
      
      xhr.send();
    });
  }
  
  // Function to create a blob URL for the worker
  function createWorkerBlobUrl(blob) {
    return URL.createObjectURL(blob);
  }
  
  // Try to load the worker from each URL until one succeeds
  async function tryLoadingWorker() {
    // Try local paths first
    for (const url of workerUrls) {
      try {
        const blob = await downloadWorker(url);
        const blobUrl = createWorkerBlobUrl(blob);
        console.log('PDF Worker loaded successfully from:', url);
        window.pdfWorkerUrl = blobUrl;
        
        // If pdfjsLib is available, configure it directly
        if (typeof pdfjsLib !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = url;
          console.log('PDF.js worker configured via pdfjsLib');
        }
        
        return blobUrl; // Success
      } catch (error) {
        console.warn(`Failed to load PDF worker from ${url}:`, error);
        // Continue to the next URL
      }
    }
    
    // If all local paths fail, try the CDN
    try {
      const blob = await downloadWorker(cdnFallbackUrl);
      const blobUrl = createWorkerBlobUrl(blob);
      console.log('PDF Worker loaded from CDN fallback:', cdnFallbackUrl);
      window.pdfWorkerUrl = blobUrl;
      
      // If pdfjsLib is available, configure it directly
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = cdnFallbackUrl;
        console.log('PDF.js worker configured via pdfjsLib (CDN)');
      }
      
      return blobUrl; // Success with CDN
    } catch (cdnError) {
      console.error('Failed to load PDF worker from CDN fallback:', cdnError);
      
      // Last resort: If pdfjsLib is available, let it use its default worker
      if (typeof pdfjsLib !== 'undefined') {
        console.log('Falling back to PDF.js default worker handling');
        // Don't set workerSrc to let PDF.js handle it internally
      }
      
      return null; // All attempts failed
    }
  }
  
  // Start the worker loading process
  tryLoadingWorker().then(result => {
    if (result) {
      // Worker loaded successfully, initialize enhanced PDF handling
      initEnhancedPdfHandling();
    } else {
      // Worker failed to load, set up fallback viewer
      setupFallbackViewer();
    }
  });
  
  // Initialize enhanced PDF handling
  function initEnhancedPdfHandling() {
    // Create a global helper for adding auth tokens to PDF URLs
    window.getAuthenticatedPdfUrl = function(url) {
      if (!url) return null;
      
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) return url;
      
      // Check if URL already has parameters
      const hasParams = url.indexOf('?') !== -1;
      const separator = hasParams ? '&' : '?';
      
      // Add token and cache-busting parameter
      const timestamp = Date.now();
      return `${url}${separator}token=${encodeURIComponent(token)}&t=${timestamp}`;
    };
    
    // Handle PDF viewing errors
    window.addEventListener('pdf-loading-error', function(event) {
      console.error('PDF loading error:', event.detail);
      showPdfError(event.detail.container, event.detail.message, event.detail.url);
    });
  }
  
  // Set up fallback viewer when PDF.js fails
  function setupFallbackViewer() {
    console.log('Setting up fallback PDF viewer due to worker loading failure');
    
    // Create a global function to initialize the fallback viewer
    window.initFallbackPdfViewer = function(containerId, pdfUrl) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('PDF container not found:', containerId);
        return;
      }
      
      // Get authenticated URL
      const authUrl = window.getAuthenticatedPdfUrl ? 
                     window.getAuthenticatedPdfUrl(pdfUrl) : pdfUrl;
      
      // Try to use browser's built-in PDF viewer
      const iframe = document.createElement('iframe');
      iframe.src = authUrl;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.border = 'none';
      
      // Clear container and add iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      // Handle iframe errors
      iframe.onerror = function() {
        showPdfError(container, 'Failed to load PDF in browser', pdfUrl);
      };
    };
  }
  
  // Show PDF error with download option
  function showPdfError(container, message, pdfUrl) {
    if (!container) {
      console.error('Cannot show PDF error - container not found');
      return;
    }
    
    // Get authenticated URL if helper is available
    const authUrl = window.getAuthenticatedPdfUrl ? 
                   window.getAuthenticatedPdfUrl(pdfUrl) : pdfUrl;
    
    // Create error UI
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
        <h3>Error Loading PDF</h3>
        <p>${message || 'The PDF could not be loaded'}</p>
        <p>You can try opening the PDF directly in your browser.</p>
        <a href="${authUrl}" target="_blank" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">
          Open PDF
        </a>
      </div>
    `;
  }
})();