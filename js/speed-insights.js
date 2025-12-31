/**
 * Vercel Speed Insights Integration
 * 
 * This module initializes Vercel Speed Insights for real user monitoring.
 * Speed Insights helps you measure and optimize your website's performance.
 * 
 * For more information, visit: https://vercel.com/analytics/speed-insights
 */

/**
 * Initialize Speed Insights
 * This function sets up the tracking script and makes it available globally.
 */
export function initializeSpeedInsights() {
  // Initialize the Speed Insights queue if not already present
  if (typeof window !== 'undefined') {
    window.si = window.si || function () {
      (window.siq = window.siq || []).push(arguments);
    };

    // Load the Speed Insights script
    const script = document.createElement('script');
    script.src = '/_vercel/speed-insights/script.js';
    script.defer = true;
    script.async = true;
    
    // Add error handling
    script.onerror = () => {
      console.debug('[Speed Insights] Failed to load script from /_vercel/speed-insights/script.js');
    };
    
    // Append to document body
    document.body.appendChild(script);
  }
}

// Auto-initialize when script loads
initializeSpeedInsights();
