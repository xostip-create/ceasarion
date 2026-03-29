
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2, ArrowRight } from "lucide-react";
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

  const { data: config, isLoading } = useDoc(configRef);

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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased flex flex-col items-center">
      <div className="w-full flex justify-center pt-6 pointer-events-none sticky top-0 z-50">
        <BrowserDetector onDetect={setDetection} />
      </div>

      <main className="container mx-auto max-w-xl px-4 py-12 space-y-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8 md:p-14 text-center space-y-10">
          <div className="flex justify-center">
             <div className="relative w-24 h-24 mb-2">
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
          
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome</h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm mx-auto">
              Please complete this quick verification to access your content.
            </p>
          </div>

          <div className="space-y-6">
            <Button 
              onClick={handleAdClick} 
              size="lg" 
              className="w-full h-16 rounded-3xl text-xl font-bold shadow-xl shadow-primary/25 transition-all hover:scale-[1.03] active:scale-[0.97] bg-primary"
            >
              Verify & Continue
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest text-center">Connection Verified</p>
            </div>
          </div>
        </div>

        <section id="ad-unit" className="space-y-8">
           <div className="flex items-center gap-6">
             <div className="h-px bg-slate-200 flex-1" />
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Sponsored</span>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-2 border border-white/50">
            <AdRenderer detection={detection} onAdClick={handleAdClick} />
          </div>
        </section>

        <footer className="pt-16 pb-12 text-center space-y-4">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">© {new Date().getFullYear()} Distribution Hub</p>
        </footer>
      </main>
    </div>
  );
}
