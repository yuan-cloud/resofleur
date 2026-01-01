/**
 * Terms of Service Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import FlowerButton from '../components/FlowerButton';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf9f8] relative">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-[120px] animate-blob-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-12">
          <FlowerButton onClick={() => navigate('/')}>
            Resofleur
          </FlowerButton>
        </div>

        {/* Content */}
        <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/60 shadow-2xl">
          <h1 className="text-3xl font-light text-gray-700 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray prose-sm max-w-none space-y-6 text-gray-600 font-light">
            <p className="text-sm text-gray-400">Last updated: December 20, 2025</p>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using Resofleur ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">2. Description of Service</h2>
              <p>Resofleur is a cloud-based visual control interface for Resolume Arena and Avenue. The Service allows users to remotely control their Resolume instances through a web interface.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">3. User Accounts</h2>
              <p>To use certain features of the Service, you must create an account. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">4. Subscription and Payments</h2>
              <p>The Service offers free and paid subscription tiers:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Free Tier:</strong> Limited to 1 configuration</li>
                <li><strong>Pro Tier ($5/month):</strong> Unlimited configurations and priority support</li>
              </ul>
              <p className="mt-4">Payments are processed through Stripe. Subscriptions renew automatically unless cancelled.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">6. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are owned by Resofleur and are protected by international copyright, trademark, and other intellectual property laws.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">7. Disclaimer of Warranties</h2>
              <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">8. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, Resofleur shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">9. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">10. Contact</h2>
              <p>For questions about these Terms, please contact us through the app's support channel.</p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="text-rose-400 hover:text-rose-500 text-sm font-light transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
