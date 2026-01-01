/**
 * Resofleur - Application Entry Point
 * Premium visual control interface
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';

// Initialize Sentry for error tracking (only in production)
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
}

// Simple analytics tracking
const trackPageView = (page: string) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to console in production (can be replaced with real analytics)
    console.info('[Analytics] Page View:', page);
  }
};

// Track initial page view
trackPageView(window.location.pathname);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Error Fallback Component
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center p-8">
      <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/60 shadow-2xl max-w-md text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-light text-gray-700 mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm font-light mb-6">
          We've been notified and are working on a fix.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-rose-400/90 to-pink-400/90 text-white rounded-xl text-sm font-medium"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
// Build timestamp: 1766391541
