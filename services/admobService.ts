"use client";

export const ADMOB_APP_ID =
  process.env.NEXT_PUBLIC_ADMOB_APP_ID || "ca-app-pub-8726665576912950~1023958500";
export const ADMOB_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_ADMOB_PUBLISHER_ID || "pub-8726665576912950";
export const ADMOB_NATIVE_AD_UNIT_ID =
  process.env.NEXT_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID || "ca-app-pub-8726665576912950/4799551984";
export const MODULE_COMPLETION_AD_UNIT_ID =
  process.env.NEXT_PUBLIC_ADMOB_MODULE_COMPLETION_AD_UNIT_ID || "ca-app-pub-8726665576912950/4799551984";

/**
 * Initializes AdMob in the native app container (Capacitor / Android WebView / iOS wrapper).
 */
export async function initializeAdMob(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // If running in Capacitor with @capacitor-community/admob installed
    const capacitorAdMob = (window as unknown as { AdMob?: { initialize: (options?: unknown) => Promise<void> } }).AdMob;
    if (capacitorAdMob?.initialize) {
      await capacitorAdMob.initialize({
        initializeForTesting: false,
      });
      return;
    }

    // If running inside Android WebView bridge
    if (window.AndroidBridge?.isApp?.() || window.Android) {
      // Dispatches app initialization event
      window.dispatchEvent(
        new CustomEvent("bytebreach:admob-init", {
          detail: { appId: ADMOB_APP_ID, publisherId: ADMOB_PUBLISHER_ID },
        })
      );
    }
  } catch (error) {
    console.warn("[AdMob] Native initialization failed or not supported in current container:", error);
  }
}

/**
 * Triggers an interstitial or completion ad when a student completes a room or challenge.
 */
export async function showModuleCompletionAd(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // 1. Android Bridge Interface
    if (window.AndroidBridge?.showAdMobInterstitial) {
      window.AndroidBridge.showAdMobInterstitial(MODULE_COMPLETION_AD_UNIT_ID);
      return;
    }
    if (window.Android?.showAdMobInterstitial) {
      window.Android.showAdMobInterstitial(MODULE_COMPLETION_AD_UNIT_ID);
      return;
    }

    // 2. Capacitor AdMob Native Plugin
    const capacitorAdMob = (window as unknown as { AdMob?: { showInterstitial: (options?: unknown) => Promise<void> } }).AdMob;
    if (capacitorAdMob?.showInterstitial) {
      await capacitorAdMob.showInterstitial({ adId: MODULE_COMPLETION_AD_UNIT_ID });
      return;
    }

    // 3. Web fallback / custom event
    window.dispatchEvent(
      new CustomEvent("bytebreach:show-completion-ad", {
        detail: { adUnitId: MODULE_COMPLETION_AD_UNIT_ID },
      })
    );
  } catch (error) {
    console.warn("[AdMob] showModuleCompletionAd failed:", error);
  }
}

/**
 * Requests native ad rendering for native app view.
 */
export async function requestNativeAd(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (window.AndroidBridge?.showAdMobNativeAd) {
      window.AndroidBridge.showAdMobNativeAd(ADMOB_NATIVE_AD_UNIT_ID);
      return;
    }
    if (window.Android?.showAdMobNativeAd) {
      window.Android.showAdMobNativeAd(ADMOB_NATIVE_AD_UNIT_ID);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("bytebreach:request-native-ad", {
        detail: { adUnitId: ADMOB_NATIVE_AD_UNIT_ID },
      })
    );
  } catch (error) {
    console.warn("[AdMob] requestNativeAd failed:", error);
  }
}
