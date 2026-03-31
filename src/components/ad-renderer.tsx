
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!nativeScript || !iframeRef.current) {
      if (onReady) onReady();
      return;
    }

    setIsInjecting(true);
    
    // Construct a standalone HTML document for the iframe.
    // This creates a completely isolated environment for the ad script to run.
    const adDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 120px;
              background: transparent;
              font-family: sans-serif;
            }
            #ad-wrapper { width: 100%; display: flex; justify-content: center; }
            * { max-width: 100% !important; }
          </style>
        </head>
        <body>
          <div id="ad-wrapper">
            ${nativeScript}
          </div>
          <script>
            // Notify parent if the ad script finishes or fails (optional)
            window.onerror = function() {
              console.log('Ad script error caught in isolated environment');
            };
          </script>
        </body>
      </html>
    `;

    try {
      // Use srcdoc to inject the full HTML environment instantly.
      // This is superior to manual DOM manipulation for third-party scripts.
      iframeRef.current.srcdoc = adDocument;
    } catch (e) {
      // Silent fail
    }

    const timer = setTimeout(() => {
      setIsInjecting(false);
      if (onReady) onReady();
    }, 600);

    return () => clearTimeout(timer);
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
        <CardContent className="p-0">
          <div className="relative w-full min-h-[140px] flex items-center justify-center">
             {!nativeScript ? (
               <div className="flex flex-col items-center gap-2 opacity-20 p-8">
                 <ImageIcon className="w-8 h-8" />
                 <p className="text-[10px]">Premium content loading...</p>
               </div>
             ) : (
               <iframe
                 ref={iframeRef}
                 className="w-full border-none min-h-[140px]"
                 title="Advertisement"
                 sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                 scrolling="no"
               />
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
