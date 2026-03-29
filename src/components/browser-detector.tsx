
"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DetectionResult = {
  browser: string;
  isMobile: boolean;
  adBlockActive: boolean;
};

interface BrowserDetectorProps {
  onDetect?: (result: DetectionResult) => void;
}

export function BrowserDetector({ onDetect }: BrowserDetectorProps) {
  const [result, setResult] = useState<DetectionResult | null>(null);

  useEffect(() => {
    const detect = async () => {
      const ua = navigator.userAgent;
      let browser = "Unknown";
      if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edge")) browser = "Edge";

      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

      // Simple Adblock Detection
      let adBlockActive = false;
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      testAd.style.position = "absolute";
      testAd.style.left = "-9999px";
      document.body.appendChild(testAd);
      
      // Give it a tiny bit of time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (testAd.offsetHeight === 0) {
        adBlockActive = true;
      }
      document.body.removeChild(testAd);

      const detectionResult = { browser, isMobile, adBlockActive };
      setResult(detectionResult);
      if (onDetect) onDetect(detectionResult);
    };

    detect();
  }, [onDetect]);

  if (!result) return null;

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2">
        {result.isMobile ? <Smartphone className="w-4 h-4 text-primary" /> : <Monitor className="w-4 h-4 text-primary" />}
        <span className="text-sm font-medium">{result.browser}</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        {result.adBlockActive ? (
          <>
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <Badge variant="destructive" className="text-[10px] h-5">Adblock Detected</Badge>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <Badge variant="secondary" className="text-[10px] h-5 bg-green-50 text-green-700 hover:bg-green-50">Safe for Ads</Badge>
          </>
        )}
      </div>
    </div>
  );
}
