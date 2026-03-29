
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
      <BrowserDetector onDetect={setDetection} />

      <main className="container mx-auto max-w-xl px-4 py-2 space-y-2 flex-1 flex flex-col">
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
              onClick={handleAdClick} 
              size="lg" 
              className="w-full h-10 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary"
            >
              Verify & Continue
              <ArrowRight className="ml-2 w-3 h-3" />
            </Button>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">Connection Verified</p>
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
            <AdRenderer detection={detection} onAdClick={handleAdClick} />
          </div>
        </section>

        <footer className="pt-4 pb-6 text-center">
          <p className="text-[7px] text-slate-300 font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} Content Distribution Hub</p>
        </footer>
      </main>
    </div>
  );
}
