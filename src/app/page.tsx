
"use client";

import { useState, useEffect, useCallback } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2, ShieldCheck, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config, isLoading } = useDoc(configRef);
  const adConfig = config?.adConfig;
  
  const isAggressive = detection && adConfig?.aggressiveBrowsers?.some((b: string) => 
    detection.browser.toLowerCase().trim().includes(b.toLowerCase().trim())
  );

  useEffect(() => {
    if (config && detection && !recorded && db) {
      const impressionRef = collection(db, "users", config.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: "neutral-verify",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
      setRecorded(true);
    }
  }, [config, detection, recorded, db]);

  const handleMainAction = useCallback(() => {
    if (!config || !adConfig) return;

    const clickRef = collection(db!, "users", config.ownerId, "adClickEvents");
    addDocumentNonBlocking(clickRef, {
      landingPageId: "neutral-verify",
      timestamp: new Date().toISOString(),
      browserType: detection?.browser || "Unknown",
      adblockerStatus: detection?.adBlockActive ? "detected" : "notDetected"
    });

    if (adConfig.smartLink && !isAggressive) {
      window.location.href = adConfig.smartLink;
    }
  }, [config, adConfig, detection, isAggressive, db]);

  // Inject Script Helper
  const injectScript = useCallback((scriptContent: string) => {
    if (!scriptContent) return null;
    const container = document.createElement("div");
    container.style.display = "none";
    const range = document.createRange();
    const fragment = range.createContextualFragment(scriptContent);
    const scripts = Array.from(fragment.querySelectorAll("script"));
    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
    container.appendChild(fragment);
    document.body.appendChild(container);
    return container;
  }, []);

  // Handle Social Bar and Pop-under
  useEffect(() => {
    const containers: HTMLDivElement[] = [];
    
    // Always Social Bar
    if (adConfig?.socialBarScript) {
      const c = injectScript(adConfig.socialBarScript);
      if (c) containers.push(c);
    }

    // Pop-under for aggressive
    if (isAggressive && adConfig?.popUnderScript) {
      const c = injectScript(adConfig.popUnderScript);
      if (c) containers.push(c);
    }

    return () => {
      containers.forEach(c => {
        if (document.body.contains(c)) document.body.removeChild(c);
      });
    };
  }, [isAggressive, adConfig, injectScript]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased flex flex-col items-center">
      <div className="w-full flex justify-center pt-4 pointer-events-none sticky top-0 z-50">
        <BrowserDetector onDetect={setDetection} />
      </div>

      <main className="container mx-auto max-w-xl px-4 py-12 space-y-8 flex-1">
        <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12 text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Verification</h1>
            <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
              Please verify you are not a bot to access the requested content.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleMainAction} 
              size="lg" 
              className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Verify & Continue
              <MousePointerClick className="ml-2 w-6 h-6" />
            </Button>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Manual click required</p>
          </div>
        </div>

        <section id="ad-unit" className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-px bg-slate-200 flex-1" />
             <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Sponsored Content</span>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          
          <AdRenderer 
            detection={detection} 
            onAdClick={handleMainAction} 
            nativeScript={adConfig?.nativeBannerScript} 
          />
        </section>

        <footer className="pt-8 pb-12 text-center">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">© {new Date().getFullYear()} Cloud Verification Services</p>
        </footer>
      </main>
    </div>
  );
}
