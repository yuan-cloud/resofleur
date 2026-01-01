/**
 * Upgrade Modal
 * Shows subscription options and triggers Stripe checkout
 */

import React, { useState, useEffect } from 'react';
import { useAuth, getAuthToken } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionTier {
  name: string;
  price: number;
  max_configs: number;
  features: string[];
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<Record<string, SubscriptionTier>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/tiers`);
        if (res.ok) {
          const data = await res.json();
          setTiers(data);
        }
      } catch (e) {
        console.error('Failed to fetch tiers:', e);
      }
    };
    if (isOpen) fetchTiers();
  }, [isOpen]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please log in to upgrade');
        return;
      }

      const res = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({ tier: 'pro' })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create checkout');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const proTier = tiers['pro'];
  const currentTier = user?.subscription_tier || 'free';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2rem] p-8 max-w-md w-full border border-white/60 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-light text-gray-700 mb-2">Upgrade to Pro</h2>
        <p className="text-gray-400 text-sm font-light mb-8">
          Unlock unlimited configurations and advanced features
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50/80 border border-rose-100/50 rounded-xl text-rose-500 text-sm font-light">
            {error}
          </div>
        )}

        {/* Current tier */}
        {currentTier === 'pro' ? (
          <div className="mb-8 p-6 bg-green-50/50 rounded-2xl border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">You're already on Pro!</span>
            </div>
            <p className="text-gray-500 text-sm font-light">
              Enjoy unlimited configurations and all features.
            </p>
          </div>
        ) : (
          <>
            {/* Pro tier */}
            {proTier && (
              <div className="mb-8 p-6 bg-gradient-to-br from-rose-50/50 to-pink-50/50 rounded-2xl border border-rose-100/50">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xl font-light text-gray-700">{proTier.name}</span>
                  <div>
                    <span className="text-3xl font-light text-gray-700">${proTier.price}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {proTier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-rose-400/90 to-pink-400/90 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-sm font-medium tracking-wide transition-all shadow-lg shadow-rose-200/30 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? 'Redirecting to checkout...' : 'Upgrade Now'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
