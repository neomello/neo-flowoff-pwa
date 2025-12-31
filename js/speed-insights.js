// Vercel Speed Insights Integration
// This file injects the Speed Insights tracking script
// to monitor performance metrics for the PWA

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights for performance monitoring
// This tracks Core Web Vitals and other performance metrics
try {
  injectSpeedInsights();
} catch (error) {
  // Silently fail if Speed Insights is not available
  // This prevents errors if running in development or offline
  console.debug('Speed Insights initialization skipped:', error?.message);
}
