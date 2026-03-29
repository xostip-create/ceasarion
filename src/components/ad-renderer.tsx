"use client";

import { useState, useEffect } from "react";
import { DetectionResult } from "./browser-detector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Zap, MousePointer2, Image as ImageIcon, ArrowRight } from "lucide-react";

interface AdRendererProps {
  detection: DetectionResult | null;
  onAdClick?: () => void;
}

export function AdRenderer({ detection, onAdClick }: AdRendererProps) {
  const [adType, setAdType] = useState<"Direct Link" | "Native Banner" | "Pop-under" | "Social Bar">("Direct Link");

  useEffect(() => {
    if (!detection) return;
    if (detection.adBlockActive) setAdType("Direct Link");
    else if (detection.isMobile) setAdType("Social Bar");
    else if (detection.browser === "Chrome") setAdType("Pop-under");
    else setAdType("Native Banner");
  }, [detection]);

  if (!detection) return (
    <div className="w-full h-48 flex items-center justify-center animate-pulse bg-muted rounded-xl">
      <p className="text-sm text-muted-foreground">Selecting best offer...</p>
    </div>
  );

  return (
    <Card className="border shadow-lg overflow-hidden transition-all duration-700">
      <CardHeader className="bg-slate-50 border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
            <Zap className="w-4 h-4 text-accent" />
            SPONSORED CONTENT
          </CardTitle>
          <div className="px-2 py-0.5 bg-blue-100 rounded text-[10px] font-bold text-blue-700 uppercase tracking-wider">Verified</div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {adType === "Direct Link" && (
            <div className="p-8 bg-white rounded-2xl border flex flex-col items-center shadow-sm w-full max-w-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Continue to Content</h3>
              <p className="text-sm text-slate-500 mb-6">Click below to view the full report.</p>
              <Button size="lg" className="w-full font-bold h-14 rounded-xl text-lg group" onClick={onAdClick}>
                Learn More <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}

          {adType === "Pop-under" && (
            <div className="space-y-4 w-full">
              <div className="aspect-video bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-200">
                <MousePointer2 className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-400">Content loading...</p>
              </div>
              <Button variant="outline" className="w-full rounded-xl h-12 font-bold" onClick={onAdClick}>Learn More</Button>
            </div>
          )}

          {adType === "Native Banner" && (
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border hover:bg-white transition-all cursor-pointer group shadow-sm w-full" onClick={onAdClick}>
              <div className="w-24 h-24 bg-slate-200 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"><ImageIcon className="w-10 h-10 text-slate-400 opacity-50" /></div>
              <div className="flex flex-col justify-center text-left space-y-2">
                <div className="h-4 w-48 bg-slate-300 rounded" />
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <span className="text-blue-600 text-sm font-bold flex items-center">Learn More <ExternalLink className="ml-1 w-3 h-3" /></span>
              </div>
            </div>
          )}

          {adType === "Social Bar" && (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-10 duration-500">
               <div className="bg-white p-5 rounded-2xl shadow-2xl border-2 border-primary flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg"><Zap className="w-7 h-7" /></div>
                  <div className="text-left"><p className="text-sm font-bold text-slate-900 leading-tight">Action Required</p><p className="text-xs text-slate-500">Tap to continue...</p></div>
                  <Button size="sm" className="h-10 px-4 rounded-lg font-bold" onClick={onAdClick}>Learn More</Button>
               </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}