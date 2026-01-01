/**
 * Privacy Policy Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import FlowerButton from '../components/FlowerButton';

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-light text-gray-700 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray prose-sm max-w-none space-y-6 text-gray-600 font-light">
            <p className="text-sm text-gray-400">Last updated: December 20, 2025</p>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe; we do not store card details</li>
                <li><strong>Configuration Data:</strong> Your Resolume connection settings</li>
                <li><strong>Usage Data:</strong> How you interact with the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze usage patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">3. Information Sharing</h2>
              <p>We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Service Providers:</strong> Third parties that help us operate (e.g., Stripe for payments)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">4. Data Security</h2>
              <p>We implement appropriate security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Passwords are hashed using bcrypt encryption</li>
                <li>All data transmitted via HTTPS</li>
                <li>Access controls and authentication</li>
                <li>Regular security assessments</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">5. Data Retention</h2>
              <p>We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">7. Cookies and Tracking</h2>
              <p>We use essential cookies to maintain your session and preferences. We may use analytics tools to understand how users interact with our Service. You can control cookie settings in your browser.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">8. Children's Privacy</h2>
              <p>The Service is not intended for children under 13. We do not knowingly collect information from children under 13.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">9. International Data Transfers</h2>
              <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-700 mt-8 mb-4">11. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us through the app's support channel.</p>
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
