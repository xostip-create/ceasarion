
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

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
        landingPageId: "calm-verify",
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
      landingPageId: "calm-verify",
      timestamp: new Date().toISOString(),
      browserType: detection?.browser || "Unknown",
      adblockerStatus: detection?.adBlockActive ? "detected" : "notDetected"
    });

    if (adConfig.smartLink && !isAggressive) {
      window.location.href = adConfig.smartLink;
    }
  }, [config, adConfig, detection, isAggressive, db]);

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

  useEffect(() => {
    const containers: HTMLDivElement[] = [];
    if (adConfig?.socialBarScript) {
      const c = injectScript(adConfig.socialBarScript);
      if (c) containers.push(c);
    }
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

  // Loader state: wait for both config and detection
  if (isLoading || !detection) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 transition-opacity duration-500">
       <div className="relative w-16 h-16 mb-6">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Loading" 
              fill 
              className="object-contain animate-pulse opacity-40" 
              data-ai-hint={logo.imageHint}
            />
          )}
       </div>
       <div className="flex flex-col items-center gap-3">
         <Loader2 className="w-5 h-5 text-primary animate-spin" />
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Establishing Secure Connection</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased flex flex-col items-center">
      <BrowserDetector onDetect={setDetection} />

      <main className="container mx-auto max-w-xl px-4 pt-1 pb-8 space-y-2 flex-1 flex flex-col">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white p-2 md:p-4 text-center space-y-2 transition-all duration-700">
          <div className="flex justify-center">
            <div className="relative w-12 h-12 mb-0.5">
              {logo && (
                <Image 
                  src={logo.imageUrl} 
                  alt={logo.description} 
                  fill 
                  className="object-contain"
                  data-ai-hint={logo.imageHint}
                />
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Welcome</h1>
            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs mx-auto">
              Please complete this quick verification to access your content.
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleMainAction} 
              size="lg" 
              className="w-full h-10 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary hover:bg-primary/90"
            >
              Verify & Continue
              <ArrowRight className="ml-2 w-3 h-3" />
            </Button>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Connection Secured</p>
            </div>
          </div>
        </div>

        <section id="ad-unit" className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="h-px bg-slate-200 flex-1" />
             <span className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em]">Sponsored</span>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-0.5 border border-white/50">
            <AdRenderer 
              detection={detection} 
              onAdClick={handleMainAction} 
              nativeScript={adConfig?.nativeBannerScript} 
            />
          </div>
        </section>

        <footer className="pt-1 pb-4 text-center">
          <p className="text-[7px] text-slate-300 font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} Content Distribution Hub</p>
        </footer>
      </main>
    </div>
  );
}
