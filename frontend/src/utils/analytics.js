/**
 * EventPulse Analytics Utility
 * High-Adoption tracking for Google Analytics 4 (GA4)
 */

export const trackEvent = (eventName, params = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString(),
      platform: 'EventPulse-PWA'
    });
  } else {
    console.warn('[Analytics] gtag not found. Event cached or skipped:', eventName);
  }
};

export const trackPageview = (page_path) => {
  if (window.gtag) {
    window.gtag('config', 'G-17VHZWNX4Y', {
      page_path: page_path,
    });
  }
};
