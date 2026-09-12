"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
    AndroidBridge?: {
      showAdMobNativeAd?: (adUnitId: string) => void;
      showAdMobInterstitial?: (adUnitId: string) => void;
      isApp?: () => boolean;
    };
    Android?: {
      showAdMobNativeAd?: (adUnitId: string) => void;
      showAdMobInterstitial?: (adUnitId: string) => void;
    };
    ReactNativeWebView?: unknown;
    flutter_inappwebview?: unknown;
    webkit?: {
      messageHandlers?: Record<string, unknown>;
    };
  }
}

/**
 * Detects whether the current execution environment is a Mobile Application
 * (PWA standalone, Capacitor, Android WebView, iOS WKWebView, or app shell)
 * vs a standard Web Browser.
 *
 * Google Policy Requirement:
 * - AdSense web scripts MUST NEVER run inside mobile apps / WebViews.
 * - AdMob runs exclusively for mobile application containers.
 */
export function isAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. URL Query override (e.g. ?app=true, ?platform=android, ?platform=ios)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("app") === "true" || urlParams.get("mode") === "app") {
      return true;
    }
    const platform = urlParams.get("platform");
    if (platform === "android" || platform === "ios" || platform === "app") {
      return true;
    }

    // 2. Capacitor / Cordova / Native App Wrappers
    if (window.Capacitor?.isNativePlatform?.()) {
      return true;
    }

    // 3. Android JavaScript Bridges
    if (window.AndroidBridge || window.Android) {
      return true;
    }

    // 4. React Native / Flutter WebViews
    if (window.ReactNativeWebView || window.flutter_inappwebview) {
      return true;
    }

    // 5. PWA Standalone Display Mode (Installed application)
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      return true;
    }
    if (window.matchMedia?.("(display-mode: fullscreen)").matches) {
      return true;
    }

    // 6. iOS Standalone Mode
    const nav = window.navigator as unknown as { standalone?: boolean };
    if (nav?.standalone === true) {
      return true;
    }

    // 7. Android WebView User Agent Check
    const ua = window.navigator.userAgent || "";
    if (ua.includes("ByteBreachApp") || ua.includes("; wv") || (ua.includes("Android") && ua.includes("Version/4.0") && ua.includes("Chrome"))) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function isWebEnvironment(): boolean {
  return !isAppEnvironment();
}

export function getAdEnvironment(): "web" | "app" {
  return isAppEnvironment() ? "app" : "web";
}

/**
 * React hook to reactively subscribe to the client environment.
 */
export function useAdEnvironment() {
  const [isApp, setIsApp] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    setIsApp(isAppEnvironment());
    setIsReady(true);
  }, []);

  return {
    isApp,
    isWeb: !isApp,
    isReady,
  };
}
