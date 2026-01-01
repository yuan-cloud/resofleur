/**
 * WelcomeScreen
 * Minimal onboarding experience
 */

import React from 'react';
import FlowerButton from './FlowerButton';

export interface WelcomeScreenProps {
  onGetStarted: () => void;
  isLoading: boolean;
}

export default function WelcomeScreen({ onGetStarted, isLoading }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-rose-100/50 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-[120px] animate-blob-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] bg-violet-100/30 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '8s' }} />
      </div>
      
      <div className="relative z-10 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-16">
          <FlowerButton onClick={onGetStarted} disabled={isLoading}>
            Resofleur
          </FlowerButton>
        </div>
        
        {/* Card */}
        <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/60 shadow-2xl shadow-gray-200/20">
          <h2 className="text-2xl font-light text-gray-700 mb-3 tracking-tight">
            Visual control, simplified
          </h2>
          <p className="text-gray-400 text-sm font-light leading-relaxed mb-10">
            Connect to Resolume Arena and control your visuals from anywhere in the world.
          </p>
          
          <div className="space-y-4 text-left mb-10">
            {[
              'Configure your connection',
              'Use ngrok for remote access',
              'Control clips and parameters'
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 text-xs flex items-center justify-center font-light">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-500 font-light">{step}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={onGetStarted}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-rose-400/90 to-pink-400/90 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-sm font-medium tracking-wide transition-all shadow-lg shadow-rose-200/30 hover:shadow-xl hover:shadow-rose-200/40 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
