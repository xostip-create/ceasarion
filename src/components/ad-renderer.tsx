
"use client";

import { useState, useEffect, useRef } from "react";
import { DetectionResult } from "./browser-detector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface AdRendererProps {
  detection: DetectionResult | null;
  onAdClick?: () => void;
  nativeScript?: string;
  onReady?: () => void;
}

export function AdRenderer({ detection, onAdClick, nativeScript, onReady }: AdRendererProps) {
  const [isInjecting, setIsInjecting] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nativeScript || !adContainerRef.current) {
      if (onReady) onReady();
      return;
    }

    setIsInjecting(true);
    const container = adContainerRef.current;
    
    try {
      // Clear previous content completely
      container.innerHTML = ""; 
      
      // Use Range API to create a contextual fragment which handles scripts better
      const range = document.createRange();
      const fragment = range.createContextualFragment(nativeScript);
      
      // Find all scripts in the fragment and replace them with executable script elements
      const scripts = Array.from(fragment.querySelectorAll("script"));
      scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        
        // Copy all attributes (src, async, data-*, etc.)
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy inline script content if present
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        
        // Replace the non-executing script tag with our new executable one
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
      
      // Append the processed fragment to our container
      container.appendChild(fragment);
    } catch (e) {
      // Silent fail for ad injection issues to avoid breaking the UX
    } finally {
      // Small delay to ensure browser handles the fragment before clearing the loader
      const timer = setTimeout(() => {
        setIsInjecting(false);
        if (onReady) onReady();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [nativeScript, onReady]);

  if (!detection) return (
    <div className="w-full h-32 flex items-center justify-center animate-pulse bg-muted rounded-xl">
      <p className="text-xs text-muted-foreground">Preparing Nestlé Experience...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border shadow-md overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 py-2 px-4 border-b">
          <CardTitle className="text-[9px] font-bold flex items-center justify-between text-slate-400 uppercase tracking-widest">
            <span>Sponsored Recommendation</span>
            {isInjecting && <Loader2 className="w-3 h-3 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div ref={adContainerRef} className="min-h-[100px] flex items-center justify-center text-slate-300">
             {!nativeScript && (
               <div className="flex flex-col items-center gap-2 opacity-20">
                 <ImageIcon className="w-8 h-8" />
                 <p className="text-[10px]">Premium content loading...</p>
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
