
"use client";

import { useState, useEffect } from "react";
import { DetectionResult } from "./browser-detector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowRight, Image as ImageIcon } from "lucide-react";

interface AdRendererProps {
  detection: DetectionResult | null;
  onAdClick?: () => void;
  nativeScript?: string;
}

export function AdRenderer({ detection, onAdClick, nativeScript }: AdRendererProps) {
  // Better script injection for Adsterra/External Scripts
  useEffect(() => {
    if (nativeScript) {
      const container = document.getElementById("native-ad-container");
      if (container) {
        container.innerHTML = ""; // Clear existing
        
        // Create a contextual fragment to handle the HTML string
        const range = document.createRange();
        const fragment = range.createContextualFragment(nativeScript);
        
        // Standard innerHTML does not execute <script> tags.
        // We must manually create and append them to trigger loading/execution.
        const scripts = Array.from(fragment.querySelectorAll("script"));
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          
          // Copy all attributes (src, async, type, etc.)
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Copy inline script content if any
          if (oldScript.innerHTML) {
            newScript.innerHTML = oldScript.innerHTML;
          }
          
          // Replace the old script with the new "executable" one in the fragment
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
        
        container.appendChild(fragment);
      }
    }
  }, [nativeScript]);

  if (!detection) return (
    <div className="w-full h-48 flex items-center justify-center animate-pulse bg-muted rounded-xl">
      <p className="text-sm text-muted-foreground">Selecting best offer...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Native Banner Area - Always Displayed */}
      <Card className="border shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 py-3 px-4">
          <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-slate-500 uppercase tracking-widest">
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div id="native-ad-container" className="min-h-[100px] flex items-center justify-center text-slate-300">
             {!nativeScript && (
               <div className="flex flex-col items-center gap-2 opacity-20">
                 <ImageIcon className="w-10 h-10" />
                 <p className="text-xs">Native Offer Loading...</p>
               </div>
             )}
          </div>
        </CardContent>
      </Card>

      {/* Primary Click Bait Unit */}
      <Card className="border shadow-lg overflow-hidden transition-all duration-700 bg-white">
        <CardHeader className="bg-slate-50 border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
              <Zap className="w-4 h-4 text-accent" />
              SPECIAL OFFER
            </CardTitle>
            <div className="px-2 py-0.5 bg-blue-100 rounded text-[10px] font-bold text-blue-700 uppercase tracking-wider">Verified</div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border flex flex-col items-center shadow-inner w-full">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Continue to Full Report</h3>
              <p className="text-sm text-slate-500 mb-6">Redirecting to verified source...</p>
              <Button size="lg" className="w-full font-bold h-14 rounded-xl text-lg group" onClick={onAdClick}>
                Learn More <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
