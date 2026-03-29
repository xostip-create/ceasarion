
"use client";

import { useState, useEffect } from "react";
import { DetectionResult } from "./browser-detector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Zap, MousePointer2, Image as ImageIcon } from "lucide-react";

interface AdRendererProps {
  detection: DetectionResult | null;
}

export function AdRenderer({ detection }: AdRendererProps) {
  const [adStrategy, setAdStrategy] = useState<string>("Initializing...");
  const [adType, setAdType] = useState<"Direct Link" | "Native Banner" | "Pop-under" | "Social Bar">("Direct Link");

  useEffect(() => {
    if (!detection) return;

    if (detection.adBlockActive) {
      setAdStrategy("Bypassing Adblocker using High-Yield Direct Link");
      setAdType("Direct Link");
    } else if (detection.isMobile) {
      setAdStrategy("Optimizing for Mobile Engagement with Social Bar");
      setAdType("Social Bar");
    } else if (detection.browser === "Chrome") {
      setAdStrategy("Maximizing Desktop ROI with High-Frequency Pop-under");
      setAdType("Pop-under");
    } else {
      setAdStrategy("Contextual Monetization with Native Banners");
      setAdType("Native Banner");
    }
  }, [detection]);

  if (!detection) return (
    <div className="w-full h-48 flex items-center justify-center animate-pulse bg-muted rounded-xl">
      <p className="text-sm text-muted-foreground">Identifying optimal ad format...</p>
    </div>
  );

  return (
    <Card className="border-2 border-primary/20 bg-white shadow-xl overflow-hidden transition-all duration-700">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Active Ad Placement
          </CardTitle>
          <div className="px-3 py-1 bg-accent/20 rounded-full">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">{adType}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground italic mt-1">{adStrategy}</p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {adType === "Direct Link" && (
            <div className="space-y-4 max-w-md">
              <div className="p-10 bg-secondary/30 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center">
                <MousePointer2 className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-primary">Limited Time Offer</h3>
                <p className="text-sm text-muted-foreground mb-6">Click below to access our exclusive monetization resource.</p>
                <Button size="lg" className="w-full font-bold shadow-lg shadow-primary/20">
                  Access Direct Link <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {adType === "Pop-under" && (
            <div className="space-y-4 w-full">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex flex-col items-center justify-center border border-primary/10">
                <Zap className="w-16 h-16 text-primary/40 mb-2" />
                <p className="text-sm font-medium text-primary/60">Pop-under triggered in background</p>
              </div>
              <p className="text-xs text-muted-foreground">Standard Adsterra Pop-under integration active.</p>
            </div>
          )}

          {adType === "Native Banner" && (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 p-3 bg-muted/30 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-20 h-20 bg-muted rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                       <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <div className="flex flex-col justify-center text-left">
                      <div className="h-3 w-16 bg-accent/20 rounded mb-2" />
                      <div className="h-4 w-32 bg-primary/20 rounded mb-2" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Native ad units injected via JS bridge.</p>
            </div>
          )}

          {adType === "Social Bar" && (
            <div className="fixed bottom-6 right-6 z-50 animate-bounce">
               <div className="bg-white p-4 rounded-2xl shadow-2xl border border-accent flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-primary">New Alert</p>
                    <p className="text-[10px] text-muted-foreground">Check your status now.</p>
                  </div>
                  <Button size="sm" variant="accent" className="h-8">Open</Button>
               </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
