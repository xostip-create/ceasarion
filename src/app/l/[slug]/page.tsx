
"use client";

import { useState, useEffect } from "react";
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
    // Note: In a real app, you'd query /public_landing_pages by slug.
    // For this demo, we'll try to find it.
    return doc(db, "public_landing_pages", slug as string);
  }, [db, slug]);

  const { data: page, isLoading, error } = useDoc(campaignRef);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-primary">Content Unavailable</h1>
        <p className="text-muted-foreground max-w-md mt-2">
          The requested landing page could not be loaded. Please check your link or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Invisible Detector */}
      <div className="sr-only">
        <BrowserDetector onDetect={setDetection} />
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-8">
        {/* Dynamic Content injected from Admin */}
        <div 
          className="prose prose-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: page.htmlContent }}
        />

        {/* The Ad Engine */}
        <div className="mt-12">
          <AdRenderer detection={detection} />
        </div>

        {/* Simple Footer to keep attention on Ads */}
        <footer className="pt-20 pb-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
          Managed by Ceasarion Infrastructure
        </footer>
      </main>
    </div>
  );
}
