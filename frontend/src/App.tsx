/**
 * Resofleur
 * Premium visual control interface
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import useResolumeConnection from './hooks/useResolumeConnection';
import useResolumeClips from './hooks/useResolumeClips';
import useResolumeControls from './hooks/useResolumeControls';
import { LayerIndex } from './types/resolume.types';
import { analytics } from './utils/analytics';
import './App.css';

import ResolumeControls from './components/ResolumeControls';
import SettingsPanel from './components/SettingsPanel';
import WelcomeScreen from './components/WelcomeScreen';
import FlowerButton from './components/FlowerButton';
import UpgradeModal from './components/UpgradeModal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// Analytics page view tracker
function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location.pathname]);
  return null;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Main Dashboard component
function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedLayer, setSelectedLayer] = useState<LayerIndex>(1);
  const [controlMode, setControlMode] = useState<'resolume' | 'lighting'>('resolume');
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { isConnected, connectionStatus, isLoading: isConnectionLoading, error: connectionError } = useResolumeConnection();
  
  const { clips, activeClipId, activeClipIndex, selectedClipIndex, isLoading: areClipsLoading, error: clipsError, triggerClip, selectClip, clearLayer } = useResolumeClips({
    layerIndex: selectedLayer,
    isConnected,
    autoRefreshInterval: 3000,
  });

  const { bpm, setBpm, opacity, setOpacity, scrubPosition, setScrubPosition, isBpmLoading, isOpacityLoading, isScrubbing, error: controlsError } = useResolumeControls({
    layerIndex: selectedLayer,
    activeClipId,
    activeClipIndex: selectedClipIndex,
    isConnected,
  });

  const hasActiveConfig = useMemo(() => !!connectionStatus?.config, [connectionStatus]);
  const displayError = useMemo(() => connectionError || clipsError || controlsError, [connectionError, clipsError, controlsError]);

  const handleClipTrigger = async (clipIndex: number) => {
    try { await triggerClip(clipIndex as any); } catch (e) { console.error(e); }
  };

  const handleClearLayer = async () => {
    try { await clearLayer(); } catch (e) { console.error(e); }
  };

  // Welcome
  if (!hasActiveConfig && !showSettings) {
    return <WelcomeScreen onGetStarted={() => setShowSettings(true)} isLoading={isConnectionLoading} />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f8] relative">
      {/* Ambient - smaller on mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 md:-top-40 -left-20 md:-left-40 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-rose-100/40 rounded-full blur-[80px] md:blur-[120px] animate-blob" />
        <div className="absolute top-1/4 -right-20 md:-right-40 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-pink-100/30 rounded-full blur-[80px] md:blur-[120px] animate-blob-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-20 md:-bottom-40 left-1/3 w-[275px] md:w-[550px] h-[275px] md:h-[550px] bg-violet-100/20 rounded-full blur-[80px] md:blur-[120px] animate-blob" style={{ animationDelay: '8s' }} />
      </div>

      {/* Content - responsive padding */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        
        {/* Header - mobile optimized */}
        <header className="flex items-center justify-between mb-8 md:mb-16">
          <FlowerButton onClick={() => window.location.reload()}>
            <span className="text-base sm:text-lg">Resofleur</span>
          </FlowerButton>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
            {/* User Info - hidden on small mobile, visible on sm+ */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-light text-gray-600">
                  {user?.full_name || user?.email?.split('@')[0]}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className={`text-xs font-light ${user?.subscription_tier === 'pro' ? 'text-rose-500' : 'text-gray-400'}`}>
                    {user?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                  </span>
                  {user?.subscription_tier !== 'pro' && (
                    <button
                      onClick={() => setShowUpgrade(true)}
                      className="text-xs text-rose-400 hover:text-rose-500 font-light underline ml-1"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status - compact on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-300'}`} />
              <span className="text-[10px] sm:text-xs text-gray-400 font-light">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-all touch-manipulation"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2.5 sm:p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-full transition-all touch-manipulation"
              title="Sign out"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Error - responsive */}
        {displayError && (
          <div className="mb-6 md:mb-10 px-4 md:px-5 py-3 md:py-4 bg-rose-50/80 backdrop-blur border border-rose-100/50 rounded-xl md:rounded-2xl text-rose-500 text-xs sm:text-sm font-light">
            {displayError}
          </div>
        )}

        {/* Settings */}
        {showSettings && (
          <div className="mb-6 md:mb-10">
            <SettingsPanel hasActiveConfig={hasActiveConfig} onClose={() => setShowSettings(false)} />
          </div>
        )}

        {/* Main */}
        {isConnected && (
          <div className="space-y-10">
            
            {/* Mode */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-full w-fit">
              {(['resolume', 'lighting'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setControlMode(mode)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    controlMode === mode
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'resolume' ? 'Visuals' : 'Lighting'}
                </button>
              ))}
            </div>

            {/* Panel */}
            {controlMode === 'resolume' && (
              <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/60 shadow-2xl shadow-gray-200/20">
                <ResolumeControls
                  selectedLayer={selectedLayer}
                  onLayerChange={setSelectedLayer}
                  clips={clips}
                  activeClipId={activeClipId}
                  selectedClipIndex={selectedClipIndex}
                  onTriggerClip={handleClipTrigger}
                  onSelectClip={selectClip}
                  onClearLayer={handleClearLayer}
                  bpm={bpm}
                  onBpmChange={setBpm}
                  opacity={opacity}
                  onOpacityChange={setOpacity}
                  scrubPosition={scrubPosition}
                  onScrubChange={setScrubPosition}
                  connected={isConnected}
                  loading={areClipsLoading || isBpmLoading || isOpacityLoading || isScrubbing}
                />
              </div>
            )}

            {controlMode === 'lighting' && (
              <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] p-16 border border-white/60 shadow-2xl shadow-gray-200/20 text-center">
                <p className="text-gray-300 text-sm font-light tracking-wide">Coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {!isConnected && isConnectionLoading && (
          <div className="flex items-center justify-center py-40">
            <div className="w-6 h-6 border border-rose-200 border-t-rose-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-100/50 text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 font-light">
            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <span>© {new Date().getFullYear()} Resofleur</span>
          </div>
        </footer>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageTracker />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          {/* Payment routes (need auth context but not full protection) */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
