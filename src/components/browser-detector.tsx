"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

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
  const [status, setStatus] = useState<"checking" | "verified">("checking");

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
      
      // Simulate network delay for "professional" feel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (testAd.offsetHeight === 0) {
        adBlockActive = true;
      }
      document.body.removeChild(testAd);

      const detectionResult = { browser, isMobile, adBlockActive };
      setResult(detectionResult);
      setStatus("verified");
      if (onDetect) onDetect(detectionResult);
    };

    detect();
  }, [onDetect]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-lg pointer-events-auto transition-all duration-500 animate-in slide-in-from-top-4">
      {status === "checking" ? (
        <>
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Optimizing Connection...</span>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {result?.isMobile ? <Smartphone className="w-3 h-3 text-slate-400" /> : <Monitor className="w-3 h-3 text-slate-400" />}
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{result?.browser} Connected</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            {result?.adBlockActive ? (
              <>
                <ShieldAlert className="w-3 h-3 text-accent" />
                <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Optimized Route Active</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Verified Traffic</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
