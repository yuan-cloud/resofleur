/**
 * Payment Cancel Page
 * Shown when user cancels payment
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import FlowerButton from '../components/FlowerButton';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

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
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-light text-gray-700 mb-2">Payment Cancelled</h2>
          <p className="text-gray-400 text-sm font-light mb-8">
            Your payment was cancelled. No charges were made.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-gradient-to-r from-rose-400/90 to-pink-400/90 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-sm font-medium tracking-wide transition-all shadow-lg shadow-rose-200/30"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
