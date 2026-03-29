
"use client";

import { useState, useEffect, use } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2, AlertCircle } from "lucide-react";

export default function CampaignLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);

  const campaignRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, "public_landing_pages", slug);
  }, [db, slug]);

  const { data: page, isLoading, error } = useDoc(campaignRef);

  useEffect(() => {
    if (page && detection && !recorded && db) {
      // Record impression once detection is ready and page is loaded
      const impressionRef = collection(db, "users", page.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: page.id,
        adSlotConfigurationId: "default-slot",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
      setRecorded(true);
    }
  }, [page, detection, recorded, db]);

  const handleAdClick = () => {
    if (page && detection && db) {
      const clickRef = collection(db, "users", page.ownerId, "adClickEvents");
      addDocumentNonBlocking(clickRef, {
        landingPageId: page.id,
        adSlotConfigurationId: "default-slot",
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  if (error || !page) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center"><AlertCircle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-bold text-primary">Page Not Found</h1></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased">
      <BrowserDetector onDetect={setDetection} />

      <main className="container mx-auto max-w-2xl px-4 py-2 space-y-4">
        <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: page.htmlContent }} />

        <section id="ad-unit" className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-slate-50 px-2">Advertisement</span>
          </div>
          <AdRenderer detection={detection} onAdClick={handleAdClick} />
        </section>

        <footer className="pt-8 pb-12 text-center space-y-4">
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">Powered by Ceasarion Dynamic Ad Bridge</p>
        </footer>
      </main>
    </div>
  );
}
