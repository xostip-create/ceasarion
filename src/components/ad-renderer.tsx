"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (nativeScript) {
      setIsInjecting(true);
      const container = document.getElementById("native-ad-container");
      if (container) {
        container.innerHTML = ""; 
        
        const range = document.createRange();
        const fragment = range.createContextualFragment(nativeScript);
        
        const scripts = Array.from(fragment.querySelectorAll("script"));
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          if (oldScript.innerHTML) {
            newScript.innerHTML = oldScript.innerHTML;
          }
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
        
        container.appendChild(fragment);

        // Simulate a small delay for the ad to actually fetch and render content
        const timer = setTimeout(() => {
          setIsInjecting(false);
          if (onReady) onReady();
        }, 2000);

        return () => clearTimeout(timer);
      }
    } else {
      // If no script, we are ready immediately (but nothing will show)
      if (onReady) onReady();
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
          <div id="native-ad-container" className="min-h-[100px] flex items-center justify-center text-slate-300">
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