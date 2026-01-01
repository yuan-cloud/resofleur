/**
 * Analytics Utility
 * Simple analytics tracking for user behavior
 */

type EventName = 
  | 'page_view'
  | 'user_registered'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'upgrade_clicked'
  | 'checkout_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'config_created'
  | 'config_deleted'
  | 'clip_triggered'
  | 'layer_cleared'
  | 'error_occurred';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Track an event
   */
  track(eventName: EventName, properties?: EventProperties): void {
    const event = {
      name: eventName,
      properties: properties || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
    };

    if (this.isProduction) {
      // In production, you would send to your analytics service
      // For now, we log to console and could POST to a backend endpoint
      console.info('[Analytics]', event);
      
      // Example: Send to backend
      // this.sendToBackend(event);
    } else {
      // In development, just log
      console.debug('[Analytics Dev]', event);
    }
  }

  /**
   * Track a page view
   */
  pageView(pageName: string): void {
    this.track('page_view', { page: pageName });
  }

  /**
   * Track user registration
   */
  userRegistered(userId: string): void {
    this.track('user_registered', { user_id: userId });
  }

  /**
   * Track user login
   */
  userLoggedIn(userId: string): void {
    this.track('user_logged_in', { user_id: userId });
  }

  /**
   * Track user logout
   */
  userLoggedOut(): void {
    this.track('user_logged_out');
  }

  /**
   * Track upgrade button click
   */
  upgradeClicked(currentTier: string): void {
    this.track('upgrade_clicked', { current_tier: currentTier });
  }

  /**
   * Track checkout start
   */
  checkoutStarted(tier: string, amount: number): void {
    this.track('checkout_started', { tier, amount });
  }

  /**
   * Track successful payment
   */
  paymentCompleted(tier: string, amount: number): void {
    this.track('payment_completed', { tier, amount });
  }

  /**
   * Track failed payment
   */
  paymentFailed(reason: string): void {
    this.track('payment_failed', { reason });
  }

  /**
   * Track config creation
   */
  configCreated(configType: string): void {
    this.track('config_created', { config_type: configType });
  }

  /**
   * Track config deletion
   */
  configDeleted(): void {
    this.track('config_deleted');
  }

  /**
   * Track clip trigger
   */
  clipTriggered(layerId: number, clipId: number): void {
    this.track('clip_triggered', { layer_id: layerId, clip_id: clipId });
  }

  /**
   * Track layer clear
   */
  layerCleared(layerId: number): void {
    this.track('layer_cleared', { layer_id: layerId });
  }

  /**
   * Track error
   */
  errorOccurred(errorType: string, errorMessage: string): void {
    this.track('error_occurred', { error_type: errorType, error_message: errorMessage });
  }

  /**
   * Send event to backend (for future implementation)
   */
  private async sendToBackend(event: object): Promise<void> {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (e) {
      // Silently fail - analytics should not break the app
      console.warn('[Analytics] Failed to send event:', e);
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();
export default analytics;
