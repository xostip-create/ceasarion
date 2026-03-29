
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Loader2, AlertCircle } from "lucide-react";

export default function CampaignLandingPage() {
  const { slug } = useParams();
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);

  const campaignRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    // In production, this collection is globally readable.
    return doc(db, "public_landing_pages", slug as string);
  }, [db, slug]);

  const { data: page, isLoading, error } = useDoc(campaignRef);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-primary">Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mt-2">
          The requested landing page could not be found. It may have been expired or moved.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased">
      {/* Invisible Logic with Minimal UI Feedback */}
      <div className="sticky top-0 z-50 w-full flex justify-center pt-4 pointer-events-none">
        <BrowserDetector onDetect={setDetection} />
      </div>

      <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12 space-y-10">
        {/* Dynamic Content injected from Admin Console */}
        <div 
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: page.htmlContent }}
        />

        {/* The Intelligent Ad Injection Zone */}
        <section id="ad-unit" className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-slate-50 px-2">Advertisement</span>
          </div>
          <AdRenderer detection={detection} />
        </section>

        {/* Minimal Footer */}
        <footer className="pt-16 pb-12 text-center space-y-4">
          <div className="flex justify-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-40">
             <span>Terms</span>
             <span>Privacy</span>
             <span>Report Ad</span>
          </div>
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">
            Powered by Ceasarion Dynamic Ad Bridge
          </p>
        </footer>
      </main>
    </div>
  );
}
