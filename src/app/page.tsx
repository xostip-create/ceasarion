"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const NESTLE_QUESTIONS = [
  "How often do you consume Nestlé products in your household?",
  "Which Nestlé coffee brand do you enjoy the most for your morning boost?",
  "Does Maggi seasoning play a role in your signature family recipes?",
  "Which of these Nestlé chocolates is your absolute go-to treat?",
  "Have you explored Nestlé's range of plant-based milk alternatives?",
  "How important is nutritional transparency when you choose Nestlé products?",
  "Which Nestlé breakfast cereal starts your day most frequently?",
  "Do you prefer Nescafé Classic or the Gold blend for your instant coffee?",
  "How would you rate Nestlé's commitment to sustainable packaging?",
  "Which Nestlé bottled water brand do you trust for daily hydration?",
  "Is MILO a staple beverage for active members in your family?",
  "Which KitKat flavor variation are you most excited to try next?",
  "How likely are you to recommend Nespresso to a fellow coffee lover?",
  "Do you associate the Nestlé brand with high-quality dairy standards?",
  "Which Nestlé ice cream brand is your preferred choice for summer?",
  "Have you tried the new Nestlé health science wellness supplements?",
  "How often do you use Nestlé Toll House morsels for your baking?",
  "Which Nestlé infant nutrition product do you trust most?",
  "Do you believe Nestlé provides good value for money across its range?",
  "Would you like to receive exclusive Nestlé vouchers and product news?"
];

export default function NestleSurveyPage() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [adReady, setAdReady] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config } = useDoc(configRef);
  const adConfig = config?.adConfig;

  // Track impressions per step
  useEffect(() => {
    if (config && detection && db) {
      const impressionRef = collection(db, "users", config.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: "nestle-survey",
        step: currentStep,
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
    }
  }, [config, detection, db, currentStep]);

  const handleNext = () => {
    if (currentStep < NESTLE_QUESTIONS.length - 1) {
      setAdReady(false);
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleAdReady = useCallback(() => {
    setAdReady(true);
  }, []);

  const progress = useMemo(() => {
    return ((currentStep + 1) / NESTLE_QUESTIONS.length) * 100;
  }, [currentStep]);

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full space-y-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Survey Complete!</h1>
          <p className="text-muted-foreground">Thank you for your valuable feedback on Nestlé products. Your rewards are being processed.</p>
          <Button className="w-full h-12 rounded-full font-bold" onClick={() => window.location.reload()}>Finish</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased flex flex-col items-center pt-6 md:pt-10">
      <BrowserDetector onDetect={setDetection} />

      <main className="container mx-auto max-w-xl px-4 space-y-6 flex-1 flex flex-col pb-10">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative w-12 h-12">
              {logo && (
                <Image 
                  src={logo.imageUrl} 
                  alt="Nestlé" 
                  fill 
                  className="object-contain"
                  data-ai-hint="nestle logo"
                  priority
                />
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of 20</p>
              <Progress value={progress} className="w-24 h-1.5 mt-1" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {NESTLE_QUESTIONS[currentStep]}
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {["Very Frequently", "Sometimes", "Rarely", "Never / Not Interested"].map((option) => (
                <button 
                  key={option}
                  className="w-full p-4 text-left text-sm font-medium border rounded-2xl hover:bg-slate-50 hover:border-primary transition-all active:scale-[0.98]"
                  onClick={handleNext}
                  disabled={!adReady}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section id="ad-unit" className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-px bg-slate-200 flex-1" />
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Partner Content</span>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 border border-white/50">
            <AdRenderer 
              detection={detection} 
              onAdClick={() => {}} 
              nativeScript={adConfig?.nativeBannerScript}
              onReady={handleAdReady}
            />
          </div>

          {!adReady && (
            <div className="flex items-center justify-center gap-2 text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-medium">Verifying advertisement load...</span>
            </div>
          )}

          <div className="pt-2">
            <Button 
              onClick={handleNext} 
              disabled={!adReady}
              size="lg" 
              className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === NESTLE_QUESTIONS.length - 1 ? "Complete Survey" : "Continue to Next Question"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        <footer className="text-center pt-4">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} Nestlé Consumer Insights Program</p>
        </footer>
      </main>
    </div>
  );
}