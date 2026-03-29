
"use client";

import { useState, useEffect } from "react";

export type DetectionResult = {
  browser: string;
  isMobile: boolean;
  adBlockActive: boolean;
};

interface BrowserDetectorProps {
  onDetect?: (result: DetectionResult) => void;
}

export function BrowserDetector({ onDetect }: BrowserDetectorProps) {
  useEffect(() => {
    const detect = async () => {
      const ua = navigator.userAgent;
      let browser = "Unknown";
      if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edge")) browser = "Edge";

      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

      // Simple Detection for restricted environments
      let adBlockActive = false;
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      testAd.style.position = "absolute";
      testAd.style.left = "-9999px";
      testAd.style.visibility = "hidden";
      document.body.appendChild(testAd);
      
      // Still wait slightly for a consistent background process feel, 
      // but without the visible loader.
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (testAd.offsetHeight === 0) {
        adBlockActive = true;
      }
      document.body.removeChild(testAd);

      const detectionResult = { browser, isMobile, adBlockActive };
      if (onDetect) onDetect(detectionResult);
    };

    detect();
  }, [onDetect]);

  // Return nothing to the user, detection happens in the background
  return null;
}
