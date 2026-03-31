
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
  // Culinary (Maggi) - 10 Questions
  { q: "How often do you use Maggi Star cubes for your daily cooking?", o: ["Every Day", "Sometimes", "Rarely"] },
  { q: "Have you tried the new Maggi Signature Jollof seasoning variant?", o: ["Yes, Loved It", "Not Yet", "No Interest"] },
  { q: "Do you prefer Maggi Chicken or Maggi Crayfish for traditional soups?", o: ["Maggi Chicken", "Maggi Crayfish", "Both Equally"] },
  { q: "Is Maggi Naija Pot a staple in your kitchen pantry?", o: ["Yes, Always", "Occasionally", "Never"] },
  { q: "How would you rate the flavor intensity of Maggi Mi’py?", o: ["Excellent", "Good", "Not Tried"] },
  { q: "Does Maggi seasoning help you achieve the perfect taste in family meals?", o: ["Absolutely", "Slightly", "Not at all"] },
  { q: "Do you use Maggi Signature sub-variants for special occasions?", o: ["Always", "Sometimes", "Never"] },
  { q: "How many Maggi cubes do you typically use for a pot of soup?", o: ["1-2 Cubes", "3-5 Cubes", "6+ Cubes"] },
  { q: "Do you believe Maggi is the most iconic seasoning brand in Nigeria?", o: ["Strongly Agree", "Neutral", "Disagree"] },
  { q: "Have you noticed Maggi's commitment to iron fortification in its cubes?", o: ["Yes, I Knew", "Just Noticed", "Not Aware"] },

  // Beverages (Milo) - 10 Questions
  { q: "Is Milo your first choice for a chocolate malt drink in the morning?", o: ["Yes, Primary", "Sometimes", "No"] },
  { q: "How often do you purchase Milo Ready-to-Drink (RTD) for your children?", o: ["Weekly", "Monthly", "Never"] },
  { q: "Do you prefer the convenience of Milo 3-in-1 sachets?", o: ["Yes, Very", "It's Okay", "Prefer Powder"] },
  { q: "Do you consider Milo a necessary energy food drink for active kids?", o: ["Highly Necessary", "Good Addition", "Optional"] },
  { q: "Is Milo Powder in tins or sachets more convenient for your usage?", o: ["Tins", "Sachets", "Both"] },
  { q: "How likely are you to recommend Milo to other parents?", o: ["Extremely Likely", "Likely", "Unlikely"] },
  { q: "Do you stock Milo Energy Food Drink in bulk for your household?", o: ["Yes, Tins", "Sachets Only", "No"] },
  { q: "Which Milo format do you find most refreshing?", o: ["Hot Drink", "Cold/Iced", "RTD Pack"] },
  { q: "Does Milo help your kids stay active throughout the school day?", o: ["Definitely", "Moderately", "Unsure"] },
  { q: "Is the taste of Milo better than other malt drinks in Nigeria?", o: ["Much Better", "Similar", "No"] },

  // Beverages (Nescafé & Nido) - 10 Questions
  { q: "Is Nescafé Classic your go-to coffee for a morning energy boost?", o: ["Yes, Daily", "Occasionally", "Never"] },
  { q: "Have you tried the Nescafé 3-in-1 Malty variant?", o: ["Yes, Great", "Not Yet", "No Interest"] },
  { q: "Does Nescafé help you stay productive throughout the afternoon?", o: ["Significantly", "A Little", "Not at All"] },
  { q: "How frequently do you enjoy a cup of Nescafé 3-in-1 Original?", o: ["Daily", "Weekly", "Monthly"] },
  { q: "Is Nescafé RTD coffee a regular part of your busy workday?", o: ["Always", "Sometimes", "Never"] },
  { q: "Does Nido Fortified with FortiGrow provide the nutrition your children need?", o: ["Absolutely", "Probably", "Unsure"] },
  { q: "How satisfied are you with the creamy taste of Nido milk?", o: ["Very Satisfied", "Satisfied", "Neutral"] },
  { q: "Do you believe Nido is the best milk for growing children?", o: ["Best Choice", "Good Choice", "Neutral"] },
  { q: "Is Nido milk a regular item on your monthly grocery list?", o: ["Yes", "Sometimes", "No"] },
  { q: "Do you prefer Nescafé Classic over other instant coffee brands?", o: ["Yes", "Maybe", "No"] },

  // Breakfast Cereals (Golden Morn & Fitness) - 10 Questions
  { q: "How often does your family have Golden Morn for breakfast?", o: ["Daily", "Weekly", "Rarely"] },
  { q: "Do you prefer the maize and soya blend of Golden Morn?", o: ["Love It", "It's Okay", "No"] },
  { q: "Is Golden Morn the most trusted family cereal in your home?", o: ["Definitely", "Somewhat", "No"] },
  { q: "Have you tried Nestlé Fitness cereal for a healthy breakfast?", o: ["Yes", "Want To", "No"] },
  { q: "Do the economical Golden Morn sachets help with your budget?", o: ["Helps A Lot", "A Little", "No Difference"] },
  { q: "Is locally sourced maize in Golden Morn a reason why you buy it?", o: ["Yes, Important", "Nice Addition", "Don't Care"] },
  { q: "How would you rate the crunchiness of Nestlé Fitness cereal?", o: ["Perfect", "Good", "Not Tried"] },
  { q: "Do you enjoy Golden Morn with milk or as a dry snack?", o: ["With Milk", "Dry Snack", "Both"] },
  { q: "Is Nestlé Fitness your preferred cereal for weight management?", o: ["Yes", "One of Many", "No"] },
  { q: "Does Golden Morn provide enough energy to last until lunch?", o: ["Yes", "Mostly", "No"] },

  // Infant Nutrition (Cerelac, NAN, SMA) - 10 Questions
  { q: "Is Cerelac your primary choice for your baby's first solid foods?", o: ["Yes", "No, Home-made", "No, Other Brand"] },
  { q: "Which Cerelac flavor does your baby enjoy most?", o: ["Wheat/Maize", "Fruit Flavors", "Honey"] },
  { q: "How often do you use NAN Optipro for your infant?", o: ["Every Feeding", "Supplement", "Never"] },
  { q: "Does NAN Comfort help ease your baby's digestive sensitivity?", o: ["Very Helpful", "Somewhat", "Not Used"] },
  { q: "Is SMA Gold your trusted premium infant formula brand?", o: ["Highly Trusted", "Neutral", "Don't Use"] },
  { q: "Have you used Lactogen as a starter formula for your newborn?", o: ["Yes", "Thinking About It", "No"] },
  { q: "Do you trust Nestlé infant nutrition for early development?", o: ["Fully Trust", "Mostly Trust", "Neutral"] },
  { q: "Is the NAN Kid range suitable for your toddler's needs?", o: ["Perfectly", "Somewhat", "Not at All"] },
  { q: "How satisfied are you with the quality of Cerelac cereals?", o: ["Very Satisfied", "Satisfied", "Neutral"] },
  { q: "Is Nutrend still a part of your weaning cereal routine?", o: ["Yes", "Used To Be", "Never"] },

  // Bottled Water, Confectionery & Dairy - 10 Questions
  { q: "Is Nestlé Pure Life your preferred brand for bottled water?", o: ["Always", "Sometimes", "No"] },
  { q: "Do you trust the safety standards of Nestlé Pure Life?", o: ["Completely", "Mostly", "No"] },
  { q: "Is Nestlé Pure Life 60cl your go-to for hydration on the move?", o: ["Yes", "Occasionally", "No"] },
  { q: "Is Chocomilo a favorite cocoa confectionery snack for you?", o: ["Top Favorite", "Occasionally", "No"] },
  { q: "How often do you treat yourself to a KitKat chocolate bar?", o: ["Often", "Monthly", "Rarely"] },
  { q: "Is KitKat the best chocolate snack for a quick break?", o: ["Definitely", "It's Okay", "No"] },
  { q: "Is Carnation Milk your first choice for baking?", o: ["Yes", "Rarely", "Never"] },
  { q: "Do you use Carnation Milk as a whitener for tea or coffee?", o: ["Daily", "Sometimes", "No"] },
  { q: "Would you like to see more Nestlé confectionery options in Nigeria?", o: ["Yes, Please!", "Maybe", "No"] },
  { q: "How would you rate the purity of Nestlé Pure Life?", o: ["Excellent", "Standard", "Poor"] }
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
