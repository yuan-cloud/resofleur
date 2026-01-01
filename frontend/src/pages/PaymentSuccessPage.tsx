/**
 * Payment Success Page
 * Polls for payment status and shows result
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FlowerButton from '../components/FlowerButton';
import { getAuthToken } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setMessage('No payment session found');
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const pollStatus = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setStatus('error');
          setMessage('Please log in to verify payment');
          return;
        }

        const res = await fetch(`${API_URL}/api/payments/status/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Failed to check payment status');
        }

        const data = await res.json();

        if (data.payment_status === 'paid') {
          setStatus('success');
          setMessage(`Successfully upgraded to ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}!`);
          await refreshUser();
          return;
        }

        if (data.status === 'expired') {
          setStatus('error');
          setMessage('Payment session expired. Please try again.');
          return;
        }

        // Still pending
        attempts++;
        if (attempts < maxAttempts) {
          setStatus('pending');
          setMessage('Processing payment...');
          setTimeout(pollStatus, pollInterval);
        } else {
          setStatus('error');
          setMessage('Payment verification timed out. Please check your account.');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || 'Failed to verify payment');
      }
    };

    pollStatus();
  }, [searchParams, refreshUser]);

  return (
    <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-rose-100/50 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-[120px] animate-blob-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-12">
          <FlowerButton onClick={() => navigate('/')}>
            Resofleur
          </FlowerButton>
        </div>

        <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/60 shadow-2xl shadow-gray-200/20">
          {status === 'loading' || status === 'pending' ? (
            <>
              <div className="w-12 h-12 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-light text-gray-700 mb-2">Verifying Payment</h2>
              <p className="text-gray-400 text-sm font-light">{message || 'Please wait...'}</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-gray-700 mb-2">Payment Successful!</h2>
              <p className="text-gray-400 text-sm font-light mb-8">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-gradient-to-r from-rose-400/90 to-pink-400/90 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-sm font-medium tracking-wide transition-all shadow-lg shadow-rose-200/30"
              >
                Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-gray-700 mb-2">Payment Issue</h2>
              <p className="text-gray-400 text-sm font-light mb-8">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-medium tracking-wide transition-all"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
