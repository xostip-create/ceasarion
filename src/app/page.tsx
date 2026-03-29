
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function HardcodedOfferPage() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);

  const newsHero = PlaceHolderImages.find(img => img.id === 'news-hero');

  // Look up the site owner UID from the 'main' public config
  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config, isLoading } = useDoc(configRef);

  useEffect(() => {
    if (config && detection && !recorded && db) {
      const impressionRef = collection(db, "users", config.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: "home-offer",
        adSlotConfigurationId: "default-slot",
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
        landingPageId: "home-offer",
        adSlotConfigurationId: "default-slot",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased">
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

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p className="text-lg font-medium text-slate-800">
              A recent shift in federal guidelines is creating waves across the market, potentially offering significant relief for millions of families nationwide.
            </p>
            <p>
              Industry experts suggest that the update, which took effect earlier this week, targets long-standing inefficiencies in the current system. While many were skeptical at first, the early data shows a promising trend for those who take action quickly.
            </p>
          </div>
        </article>

        <section id="ad-unit" className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-slate-50 px-2">Sponsored Link</span>
          </div>
          <AdRenderer detection={detection} onAdClick={handleAdClick} />
        </section>

        <footer className="pt-16 pb-12 text-center space-y-4">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">© {new Date().getFullYear()} News Discovery Network</p>
        </footer>
      </main>
    </div>
  );
}
