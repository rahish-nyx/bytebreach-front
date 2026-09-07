export const ADMOB_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADMOB_PUBLISHER_ID;
export const MODULE_COMPLETION_AD_UNIT_ID = process.env.NEXT_PUBLIC_ADMOB_MODULE_COMPLETION_AD_UNIT_ID;

// Capacitor-ready wrappers. Import @capacitor-community/admob in the native shell.
export async function showModuleCompletionAd() {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) return;
  // Native integration can call AdMob.prepareInterstitial/showInterstitial with MODULE_COMPLETION_AD_UNIT_ID.
}

export async function showBannerAd() {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) return;
  // Native integration can call AdMob.showBanner here.
}
