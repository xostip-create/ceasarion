
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function HardcodedOfferPage() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config } = useDoc(configRef);

  useEffect(() => {
    if (config && detection && !recorded && db) {
      const impressionRef = collection(db, "users", config.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: "calm-offer",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
      setRecorded(true);
    }
  }, [config, detection, recorded, db]);

  const handleAdClick = () => {
    if (config && detection && db) {
      const clickRef = collection(db, "users", config.ownerId, "adClickEvents");
      addDocumentNonBlocking(clickRef, {
        landingPageId: "calm-offer",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased flex flex-col items-center pt-4 md:pt-8">
      <BrowserDetector onDetect={setDetection} />

      <main className="container mx-auto max-w-xl px-4 space-y-4 flex-1 flex flex-col">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-6 md:p-8 text-center space-y-6 transition-all">
          <div className="flex justify-center">
             <div className="relative w-14 h-14">
              {logo && (
                <Image 
                  src={logo.imageUrl} 
                  alt={logo.description} 
                  fill 
                  className="object-contain"
                  data-ai-hint={logo.imageHint}
                  priority
                />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Welcome</h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Please complete this quick verification to access your content.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleAdClick} 
              size="lg" 
              className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary"
            >
              Verify & Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connection Verified</p>
            </div>
          </div>
        </div>

        <section id="ad-unit" className="space-y-3">
           <div className="flex items-center gap-3">
             <div className="h-px bg-slate-200 flex-1" />
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Recommended For You</span>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 border border-white/50">
            <AdRenderer detection={detection} onAdClick={handleAdClick} nativeScript={config?.adConfig?.nativeBannerScript} />
          </div>
        </section>

        <footer className="pt-2 pb-8 text-center">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} Content Distribution Hub</p>
        </footer>
      </main>
    </div>
  );
}
