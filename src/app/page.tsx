
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

const NESTLE_SURVEY = [
  // Culinary (Maggi)
  { q: "How often do you use Maggi Star cubes for your daily cooking?", o: ["Daily", "Weekly", "Occasionally", "Rarely"] },
  { q: "Have you tried the new Maggi Signature Jollof seasoning variant?", o: ["Yes, loved it", "Yes, it's okay", "Not yet, but plan to", "No interest"] },
  { q: "Do you prefer Maggi Chicken or Maggi Crayfish for traditional soups?", o: ["Maggi Chicken", "Maggi Crayfish", "Both", "Neither"] },
  { q: "Is Maggi Naija Pot a staple in your kitchen pantry?", o: ["Yes, always", "Sometimes", "Rarely", "Never"] },
  { q: "How would you rate the flavor intensity of Maggi Mi’py?", o: ["Excellent", "Good", "Fair", "Not tried"] },
  { q: "Does Maggi seasoning help you achieve the perfect taste in family meals?", o: ["Absolutely", "Mostly", "Slightly", "Not at all"] },
  { q: "Do you use Maggi Signature sub-variants for special occasions?", o: ["Always", "Often", "Sometimes", "Never"] },
  { q: "How many Maggi cubes do you typically use for a pot of soup?", o: ["1-2 cubes", "3-5 cubes", "6+ cubes", "None"] },
  { q: "Do you believe Maggi is the most iconic seasoning brand in Nigeria?", o: ["Strongly agree", "Agree", "Neutral", "Disagree"] },
  { q: "Have you noticed Maggi's commitment to iron fortification in its cubes?", o: ["Yes, I knew", "I just noticed", "Not aware", "Don't care"] },

  // Beverages (Milo, Nescafé, Nido)
  { q: "Is Milo your first choice for a chocolate malt drink in the morning?", o: ["Yes, primary", "Sometimes", "Rarely", "No, I drink tea/coffee"] },
  { q: "How often do you purchase Milo Ready-to-Drink (RTD) for your children?", o: ["Daily", "Weekly", "Monthly", "Never"] },
  { q: "Do you prefer the convenience of Milo 3-in-1 sachets?", o: ["Yes, very convenient", "It's okay", "Prefer powder", "Not interested"] },
  { q: "Is Nescafé Classic your go-to coffee for a morning energy boost?", o: ["Yes, daily", "Often", "Occasionally", "Never"] },
  { q: "Have you tried the Nescafé 3-in-1 Malty variant?", o: ["Yes, it's great", "Tried it once", "Never heard of it", "No coffee for me"] },
  { q: "Does Nido Fortified with FortiGrow provide the nutrition your children need?", o: ["Absolutely", "Probably", "Unsure", "Not satisfied"] },
  { q: "How frequently do you enjoy a cup of Nescafé 3-in-1 Original?", o: ["Multiple times daily", "Daily", "Weekly", "Monthly"] },
  { q: "Do you consider Milo a necessary energy food drink for active kids?", o: ["Highly necessary", "Good addition", "Optional", "Unnecessary"] },
  { q: "Is Nescafé RTD coffee a regular part of your busy workday?", o: ["Always", "Sometimes", "Rarely", "Never"] },
  { q: "How satisfied are you with the creamy taste of Nido milk?", o: ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"] },
  { q: "Do you stock Milo Energy Food Drink in bulk for your household?", o: ["Yes, in tins", "Yes, big sachets", "Small packs only", "No"] },
  { q: "Does Nescafé help you stay productive throughout the afternoon?", o: ["Significantly", "Moderately", "A little", "Not at all"] },
  { q: "Is Milo Powder in tins or sachets more convenient for your usage?", o: ["Tins", "Sachets", "Both", "Neither"] },
  { q: "Do you believe Nido is the best milk for growing children?", o: ["Yes, best choice", "Good choice", "Other brands better", "No"] },
  { q: "How likely are you to recommend Milo to other parents?", o: ["Extremely likely", "Likely", "Unlikely", "Not at all"] },

  // Breakfast Cereals (Golden Morn, Fitness)
  { q: "How often does your family have Golden Morn for breakfast?", o: ["Daily", "3-4 times/week", "Weekly", "Rarely"] },
  { q: "Do you prefer the maize and soya blend of Golden Morn?", o: ["Love it", "Like it", "It's okay", "Dislike"] },
  { q: "Is Golden Morn the most trusted family cereal in your home?", o: ["Definitely", "Mostly", "Somewhat", "No"] },
  { q: "Have you tried Nestlé Fitness cereal for a healthier breakfast option?", o: ["Yes, regularly", "Tried it", "Want to try", "No interest"] },
  { q: "Do the economical Golden Morn sachets help with your monthly budget?", o: ["Saves a lot", "Helps a bit", "No difference", "I buy tins"] },
  { q: "Is locally sourced maize in Golden Morn a reason why you buy it?", o: ["Yes, important", "Nice addition", "Didn't know", "Not important"] },
  { q: "How would you rate the crunchiness of Nestlé Fitness cereal?", o: ["Perfect", "Good", "Too hard", "Not tried"] },
  { q: "Do you enjoy Golden Morn with milk or as a dry snack?", o: ["Always with milk", "Mostly milk", "As a dry snack", "Both ways"] },
  { q: "Is Nestlé Fitness your preferred cereal for weight management?", o: ["Yes, primary", "One of many", "Not used for that", "No"] },
  { q: "Does Golden Morn provide enough energy to last until lunchtime?", o: ["Yes, completely", "Mostly", "Barely", "No"] },

  // Infant Nutrition (Cerelac, NAN, SMA, Lactogen)
  { q: "Is Cerelac your primary choice for your baby's first solid foods?", o: ["Yes", "One of them", "No, home-made", "No, other brand"] },
  { q: "Which Cerelac flavor does your baby enjoy most?", o: ["Wheat/Maize", "Banana", "Honey", "Multi-grain"] },
  { q: "How often do you use NAN Optipro for your infant?", o: ["Every feeding", "Supplement", "Occasionally", "Never"] },
  { q: "Does NAN Comfort help ease your baby's digestive sensitivity?", o: ["Very helpful", "Somewhat", "No change", "Not used"] },
  { q: "Is SMA Gold your trusted premium infant formula brand?", o: ["Highly trusted", "Trusted", "Neutral", "Don't use it"] },
  { q: "Have you used Lactogen as a starter formula for your newborn?", o: ["Yes, exclusively", "Yes, supplemented", "Thinking about it", "No"] },
  { q: "Is Nutrend still a part of your weaning cereal routine?", o: ["Yes", "Used to be", "Never", "What is Nutrend?"] },
  { q: "Do you trust Nestlé infant nutrition for early childhood development?", o: ["Fully trust", "Mostly trust", "Neutral", "Low trust"] },
  { q: "Is the NAN Kid range suitable for your toddler's nutritional needs?", o: ["Perfectly", "Mostly", "Somewhat", "Not at all"] },
  { q: "How satisfied are you with the quality of Cerelac infant cereals?", o: ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"] },

  // Bottled Water (Pure Life)
  { q: "Is Nestlé Pure Life your preferred brand for purified bottled water?", o: ["Yes, always", "Usually", "Sometimes", "No, other brand"] },
  { q: "How often do you buy the 1.5L size of Nestlé Pure Life for home use?", o: ["Every week", "Monthly", "Occasionally", "Never"] },
  { q: "Do you trust the safety and quality standards of Nestlé Pure Life?", o: ["Completely", "Mostly", "Neutral", "No"] },
  { q: "Is the 60cl Nestlé Pure Life bottle your go-to for hydration on the move?", o: ["Yes", "Sometimes", "Prefer other sizes", "No"] },
  { q: "How would you rate the taste and purity of Nestlé Pure Life?", o: ["Best taste", "Clean & Good", "Standard", "Poor"] },

  // Confectionery & Dairy (Chocomilo, KitKat, Carnation)
  { q: "Is Chocomilo a favorite cocoa confectionery snack in your household?", o: ["Top favorite", "Liked by all", "Occasionally bought", "Not liked"] },
  { q: "How often do you treat yourself to a KitKat chocolate wafer bar?", o: ["Very often", "Weekly", "Monthly", "Rarely"] },
  { q: "Is Carnation Milk your first choice for baking and creamy desserts?", o: ["Yes, always", "Often", "Rarely", "Never"] },
  { q: "Do you use Carnation Milk as a whitener for your tea or coffee?", o: ["Every morning", "Occasionally", "Tried it", "No"] },
  { q: "How would you rate the convenience of Chocomilo cubes as a snack?", o: ["Very convenient", "Good", "Standard", "Not convenient"] },
  { q: "Is KitKat widely available in the retail outlets where you shop?", o: ["Yes, everywhere", "Mostly", "Rarely", "Hard to find"] },
  { q: "Does Carnation Milk enhance the flavor of your signature recipes?", o: ["Significantly", "Noticeably", "A little", "Not at all"] },
  { q: "Is KitKat the best chocolate snack for a quick break?", o: ["Definitely", "One of the best", "It's okay", "Prefer others"] },
  { q: "How satisfied are you with the rich taste of Carnation dairy products?", o: ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"] },
  { q: "Would you like to see more Nestlé confectionery options in Nigeria?", o: ["Yes, please!", "Maybe", "Neutral", "No"] }
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
    
    if (currentStep < NESTLE_SURVEY.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const progress = useMemo(() => {
    return ((currentStep + 1) / NESTLE_SURVEY.length) * 100;
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

  const currentQuestionData = NESTLE_SURVEY[currentStep];

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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {NESTLE_SURVEY.length}</p>
              <Progress value={progress} className="w-24 h-1.5 mt-1" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {currentQuestionData.q}
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {currentQuestionData.o.map((option) => (
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
              <div className="flex items-center justify-center gap-2 text-primary py-2">
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
