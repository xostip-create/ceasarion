
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { CheckCircle2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const NESTLE_QUESTIONS = [
  // Culinary (Maggi)
  "How often do you use Maggi Star cubes for your daily cooking?",
  "Have you tried the new Maggi Signature Jollof seasoning variant?",
  "Do you prefer Maggi Chicken or Maggi Crayfish for traditional soups?",
  "Is Maggi Naija Pot a staple in your kitchen pantry?",
  "How would you rate the flavor intensity of Maggi Mi’py?",
  "Does Maggi seasoning help you achieve the perfect taste in your family meals?",
  "Do you use Maggi Signature sub-variants for special occasions?",
  "How many Maggi cubes do you typically use for a pot of soup?",
  "Do you believe Maggi is the most iconic seasoning brand in Nigeria?",
  "Have you noticed Maggi's commitment to iron fortification in its cubes?",

  // Beverages (Milo, Nescafé, Nido)
  "Is Milo your first choice for a chocolate malt drink in the morning?",
  "How often do you purchase Milo Ready-to-Drink (RTD) for your children?",
  "Do you prefer the convenience of Milo 3-in-1 sachets?",
  "Is Nescafé Classic your go-to coffee for a morning energy boost?",
  "Have you tried the Nescafé 3-in-1 Malty variant?",
  "Does Nido Fortified with FortiGrow provide the nutrition your children need?",
  "How frequently do you enjoy a cup of Nescafé 3-in-1 Original?",
  "Do you consider Milo a necessary energy food drink for active kids?",
  "Is Nescafé RTD coffee a regular part of your busy workday?",
  "How satisfied are you with the creamy taste of Nido milk?",
  "Do you stock Milo Energy Food Drink in bulk for your household?",
  "Does Nescafé help you stay productive throughout the afternoon?",
  "Is Milo Powder in tins or sachets more convenient for your usage?",
  "Do you believe Nido is the best milk for growing children?",
  "How likely are you to recommend Milo to other parents?",

  // Breakfast Cereals (Golden Morn, Fitness)
  "How often does your family have Golden Morn for breakfast?",
  "Do you prefer the maize and soya blend of Golden Morn?",
  "Is Golden Morn the most trusted family cereal in your home?",
  "Have you tried Nestlé Fitness cereal for a healthier breakfast option?",
  "Do the economical Golden Morn sachets help with your monthly budget?",
  "Is locally sourced maize in Golden Morn a reason why you buy it?",
  "How would you rate the crunchiness of Nestlé Fitness cereal?",
  "Do you enjoy Golden Morn with milk or as a dry snack?",
  "Is Nestlé Fitness your preferred cereal for weight management?",
  "Does Golden Morn provide enough energy to last until lunchtime?",

  // Infant Nutrition (Cerelac, NAN, SMA, Lactogen)
  "Is Cerelac your primary choice for your baby's first solid foods?",
  "Which Cerelac flavor does your baby enjoy most (Wheat, Maize, Banana, or Honey)?",
  "How often do you use NAN Optipro (1, 2, or 3) for your infant?",
  "Does NAN Comfort help ease your baby's digestive sensitivity?",
  "Is SMA Gold your trusted premium infant formula brand?",
  "Have you used Lactogen 1 or 2 as a starter formula for your newborn?",
  "Is Nutrend still a part of your weaning cereal routine?",
  "Do you trust Nestlé infant nutrition for early childhood development?",
  "Is the NAN Kid range suitable for your toddler's nutritional needs?",
  "How satisfied are you with the quality of Cerelac infant cereals?",

  // Bottled Water (Pure Life)
  "Is Nestlé Pure Life your preferred brand for purified bottled water?",
  "How often do you buy the 1.5L size of Nestlé Pure Life for home use?",
  "Do you trust the safety and quality standards of Nestlé Pure Life?",
  "Is the 60cl Nestlé Pure Life bottle your go-to for hydration on the move?",
  "How would you rate the taste and purity of Nestlé Pure Life?",

  // Confectionery & Dairy (Chocomilo, KitKat, Carnation)
  "Is Chocomilo a favorite cocoa confectionery snack in your household?",
  "How often do you treat yourself to a KitKat chocolate wafer bar?",
  "Is Carnation Milk your first choice for baking and creamy desserts?",
  "Do you use Carnation Milk as a whitener for your tea or coffee?",
  "How would you rate the convenience of Chocomilo cubes as a snack?",
  "Is KitKat widely available in the retail outlets where you shop?",
  "Does Carnation Milk enhance the flavor of your signature recipes?",
  "Is KitKat the best chocolate snack for a quick break?",
  "How satisfied are you with the rich taste of Carnation dairy products?",
  "Would you like to see more Nestlé confectionery options in Nigeria?"
];

export default function NestleSurveyPage() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config } = useDoc(configRef);
  const adConfig = config?.adConfig;

  // Reset timer on step change
  useEffect(() => {
    setTimeLeft(5);
  }, [currentStep]);

  // Countdown logic
  useEffect(() => {
    if (timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isCompleted]);

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
    if (timeLeft > 0) return;
    
    if (currentStep < NESTLE_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const progress = useMemo(() => {
    return ((currentStep + 1) / NESTLE_QUESTIONS.length) * 100;
  }, [currentStep]);

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full space-y-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Survey Complete!</h1>
          <p className="text-muted-foreground">Thank you for your valuable feedback on Nestlé Nigeria products. Your feedback helps us serve you better.</p>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {NESTLE_QUESTIONS.length}</p>
              <Progress value={progress} className="w-24 h-1.5 mt-1" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {NESTLE_QUESTIONS[currentStep]}
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {["Very Satisfied", "Satisfied", "Rarely / Neutral", "Not Interested"].map((option) => (
                <button 
                  key={option}
                  disabled={timeLeft > 0}
                  className={cn(
                    "w-full p-4 text-left text-sm font-medium border rounded-2xl transition-all active:scale-[0.98] outline-none",
                    timeLeft > 0 
                      ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-primary"
                  )}
                  onClick={handleNext}
                >
                  {option}
                </button>
              ))}
            </div>

            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 text-primary animate-pulse py-2">
                <Timer className="w-4 h-4" />
                <span className="text-xs font-bold tracking-tight">Please wait {timeLeft}s to unlock answer...</span>
              </div>
            )}
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
              key={currentStep}
              detection={detection} 
              onAdClick={() => {}} 
              nativeScript={adConfig?.nativeBannerScript}
            />
          </div>
        </section>

        <footer className="text-center pt-4">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} Nestlé Nigeria Consumer Insights</p>
        </footer>
      </main>
    </div>
  );
}
