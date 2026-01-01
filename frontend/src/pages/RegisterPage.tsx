/**
 * Register Page
 * Beautiful, minimal registration form with proper error handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FlowerButton from '../components/FlowerButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear any existing errors when component mounts or unmounts
  useEffect(() => {
    clearError();
    setLocalError('');
    return () => clearError();
  }, [clearError]);

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain a digit';
    return null;
  };

  /**
   * Parse error message to provide user-friendly feedback
   */
  const parseErrorMessage = (errorMsg: string): string => {
    const lowerError = errorMsg.toLowerCase();
    
    // Email already exists (409 Conflict or similar)
    if (lowerError.includes('already') || 
        lowerError.includes('exists') || 
        lowerError.includes('conflict') ||
        lowerError.includes('registered')) {
      return 'This email is already registered. Please sign in instead.';
    }
    
    // Invalid email format
    if (lowerError.includes('invalid email') || lowerError.includes('email format')) {
      return 'Please enter a valid email address.';
    }
    
    // Server/network errors
    if (lowerError.includes('server') || lowerError.includes('connect')) {
      return 'Unable to connect. Please try again.';
    }
    
    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setLocalError(passwordError);
      return;
    }

    try {
      await register(email, password, fullName || undefined);
      navigate('/');
    } catch {
      // Error is set in context, will be displayed
    }
  };

  // Get the display error with user-friendly message
  const rawError = localError || error;
  const displayError = rawError ? parseErrorMessage(rawError) : null;

  return (
    <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-rose-100/50 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-[120px] animate-blob-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] bg-violet-100/30 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '8s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-12 text-center">
          <FlowerButton onClick={() => navigate('/')}>
            Resofleur
          </FlowerButton>
        </div>

        {/* Card */}
        <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/60 shadow-2xl shadow-gray-200/20">
          <h2 className="text-2xl font-light text-gray-700 mb-2 tracking-tight text-center">
            Create account
          </h2>
          <p className="text-gray-400 text-sm font-light text-center mb-8">
            Start controlling your visuals
          </p>

          {displayError && (
            <div className="mb-6 px-4 py-3 bg-rose-50/80 backdrop-blur border border-rose-100/50 rounded-xl text-rose-500 text-sm font-light">
              {displayError}
              {displayError.includes('sign in') && (
                <Link 
                  to="/login" 
                  className="block mt-2 text-rose-600 hover:text-rose-700 font-medium underline"
                >
                  Go to Sign In →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-light text-gray-500 mb-2">Name (optional)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-gray-100 rounded-xl text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-transparent transition-all"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-gray-500 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-gray-100 rounded-xl text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light text-gray-500 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-gray-100 rounded-xl text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
              <p className="mt-2 text-xs text-gray-400 font-light">
                Min 8 characters, 1 uppercase, 1 digit
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-rose-400/90 to-pink-400/90 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-sm font-medium tracking-wide transition-all shadow-lg shadow-rose-200/30 hover:shadow-xl hover:shadow-rose-200/40 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-xs text-gray-400 font-light text-center mt-4">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-rose-400 hover:text-rose-500">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-rose-400 hover:text-rose-500">Privacy Policy</Link>
            </p>
          </form>

          <p className="text-center text-sm text-gray-400 font-light mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-400 hover:text-rose-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
