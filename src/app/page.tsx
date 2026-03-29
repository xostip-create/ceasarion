
"use client";

import { useState, useEffect, useCallback } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";

export default function Home() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);

  const newsHero = PlaceHolderImages.find(img => img.id === 'news-hero');

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config, isLoading } = useDoc(configRef);

  const adConfig = config?.adConfig;
  const isAggressive = detection && adConfig?.aggressiveBrowsers?.some((b: string) => 
    detection.browser.toLowerCase().includes(b.toLowerCase())
  );

  useEffect(() => {
    if (config && detection && !recorded && db) {
      const impressionRef = collection(db, "users", config.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: "home-offer",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
      setRecorded(true);
    }
  }, [config, detection, recorded, db]);

  // Handle Smart Link or Fallback logic
  const handleMainAction = useCallback(() => {
    if (!config || !adConfig) return;

    // Track click
    const clickRef = collection(db!, "users", config.ownerId, "adClickEvents");
    addDocumentNonBlocking(clickRef, {
      landingPageId: "home-offer",
      timestamp: new Date().toISOString(),
      browserType: detection?.browser || "Unknown",
      adblockerStatus: detection?.adBlockActive ? "detected" : "notDetected"
    });

    // Smart Link is the target, unless aggressive detection forces a different flow
    if (adConfig.smartLink && !isAggressive) {
      window.location.href = adConfig.smartLink;
    } else {
      // For aggressive browsers, we rely on the Pop-under which should trigger on any click
      // or we can manually trigger a secondary action here.
      console.log("Aggressive browser detected. Fallback logic active.");
    }
  }, [config, adConfig, detection, isAggressive, db]);

  // Inject Pop-under if aggressive browser detected
  useEffect(() => {
    if (isAggressive && adConfig?.popUnderScript) {
      const div = document.createElement("div");
      div.innerHTML = adConfig.popUnderScript;
      document.body.appendChild(div);
      return () => {
        document.body.removeChild(div);
      };
    }
  }, [isAggressive, adConfig]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased" onClick={isAggressive ? () => {} : undefined}>
      <div className="sticky top-0 z-50 w-full flex justify-center pt-4 pointer-events-none">
        <BrowserDetector onDetect={setDetection} />
      </div>

      <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12 space-y-10">
        <article className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          <header className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
              <span className="px-2 py-0.5 bg-blue-50 rounded border border-blue-100">Breaking News</span>
              <span>• 5 Min Read</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              New Policy Changes Could Save Families Thousands This Year
            </h1>
          </header>
          
          <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
             {newsHero && (
               <Image 
                 src={newsHero.imageUrl} 
                 alt={newsHero.description} 
                 fill 
                 className="object-cover"
                 data-ai-hint={newsHero.imageHint}
               />
             )}
          </div>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p className="text-lg font-medium text-slate-800">
              A recent shift in federal guidelines is creating waves across the market, potentially offering significant relief for millions of families nationwide.
            </p>
            <p>
              Industry experts suggest that the update, which took effect earlier this week, targets long-standing inefficiencies in the current system. While many were skeptical at first, the early data shows a promising trend for those who take action quickly.
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Eligibility</h3>
              <p className="text-sm text-slate-500 mb-6">See if you qualify for the new rebate program by clicking below.</p>
              <Button onClick={handleMainAction} size="lg" className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 animate-pulse">
                Learn More Now
              </Button>
            </div>
          </div>
        </article>

        <section id="ad-unit" className="relative space-y-8">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-slate-50 px-2">Sponsored Content</span>
          </div>
          
          <AdRenderer 
            detection={detection} 
            onAdClick={handleMainAction} 
            nativeScript={adConfig?.nativeBannerScript} 
          />
        </section>

        <footer className="pt-16 pb-12 text-center space-y-4">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">© {new Date().getFullYear()} News Discovery Network</p>
        </footer>
      </main>
    </div>
  );
}
