
"use client";

import { useState, useEffect } from "react";
import { DetectionResult } from "./browser-detector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";

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
    <div className="w-full h-32 flex items-center justify-center animate-pulse bg-muted rounded-xl">
      <p className="text-xs text-muted-foreground">Selecting best offer...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Native Banner Area - Always Displayed */}
      <Card className="border shadow-md overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 py-2 px-4 border-b">
          <CardTitle className="text-[9px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div id="native-ad-container" className="min-h-[80px] flex items-center justify-center text-slate-300">
             {!nativeScript && (
               <div className="flex flex-col items-center gap-2 opacity-20">
                 <ImageIcon className="w-8 h-8" />
                 <p className="text-[10px]">Checking for relevant offers...</p>
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
