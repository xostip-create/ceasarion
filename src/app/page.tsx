
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { CheckCircle2, Timer, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const NESTLE_SURVEY = [
  // Hook Questions (Incentive & Preferences)
  { q: "To start, which Nestlé Nigeria gift pack would you prefer as your reward today?", o: ["Milo & Nido Pack", "Maggi Culinary Set", "Golden Morn Family Pack"] },
  { q: "How many people in your household enjoy Nestlé products daily?", o: ["1-3 People", "4-6 People", "7+ People"] },
  { q: "Will you provide honest feedback to help us improve our local recipes?", o: ["Yes, Absolutely", "I Will Try", "Definitely"] },
  { q: "Which of these Nestlé sites have you heard of in Nigeria?", o: ["Agbara Factory", "Flowergate Site", "Abaji Factory"] },
  { q: "What is your primary reason for choosing Nestlé products?", o: ["Quality & Taste", "Nutritional Value", "Affordability"] },

  // Culinary (Maggi)
  { q: "How often do you use Maggi Star cubes for your daily cooking?", o: ["Every Single Day", "3-4 Times Weekly", "Occasionally"] },
  { q: "Which Maggi variant is your absolute favorite for Jollof Rice?", o: ["Maggi Signature Jollof", "Maggi Star", "Maggi Naija Pot"] },
  { q: "Do you prefer Maggi Chicken or Maggi Crayfish for your traditional soups?", o: ["Maggi Chicken", "Maggi Crayfish", "I Use Both"] },
  { q: "How would you rate the flavor intensity of Maggi Mi’py?", o: ["Very Intense", "Good Balance", "Needs More Flavor"] },
  { q: "Does Maggi seasoning help you achieve the perfect taste in family meals?", o: ["Always", "Most Times", "Sometimes"] },
  { q: "How many Maggi cubes do you typically use for a large pot of soup?", o: ["1-2 Cubes", "3-5 Cubes", "6+ Cubes"] },
  { q: "Have you noticed the iron fortification logo on Maggi packaging?", o: ["Yes, I noticed", "No, I haven't", "I'll look now"] },
  { q: "Do you believe Maggi is the most iconic seasoning brand in Nigeria?", o: ["Strongly Agree", "Agree", "Neutral"] },
  { q: "Which of these new Maggi Signature variants do you use most?", o: ["Jollof", "Naija Pot", "Mi’py"] },
  { q: "Is the price of Maggi cubes reasonable for your monthly budget?", o: ["Very Affordable", "Fair Price", "A bit Expensive"] },

  // Beverages (Milo)
  { q: "Is Milo your first choice for a chocolate malt drink in the morning?", o: ["Yes, Primary Choice", "Sometimes", "No, I use others"] },
  { q: "How often do you purchase Milo Ready-to-Drink (RTD) for school?", o: ["Every Week", "Occasionally", "Never"] },
  { q: "Do you prefer the convenience of Milo 3-in-1 sachets?", o: ["Love the convenience", "It's Okay", "Prefer Powdered Tins"] },
  { q: "Do you consider Milo a necessary energy food drink for active kids?", o: ["Highly Necessary", "Somewhat Necessary", "Optional"] },
  { q: "Which Milo pack size do you buy most frequently?", o: ["Large Tins", "Economy Sachets", "Refill Packs"] },
  { q: "Does Milo help your kids stay active throughout the school day?", o: ["Significantly", "Moderately", "Unsure"] },
  { q: "How likely are you to recommend Milo to other parents?", o: ["Very Likely", "Likely", "Neutral"] },
  { q: "Which Milo format do you find most refreshing?", o: ["Hot Drink", "Cold/Iced Drink", "RTD Pack"] },
  { q: "Is the taste of Milo better than other malt drinks in Nigeria?", o: ["Much Better", "Slightly Better", "About the same"] },
  { q: "How satisfied are you with the energy release Milo provides?", o: ["Very Satisfied", "Satisfied", "Neutral"] },

  // Beverages (Nescafé & Nido)
  { q: "Is Nescafé Classic your go-to coffee for a morning energy boost?", o: ["Yes, Every Morning", "Occasionally", "Rarely"] },
  { q: "Have you tried the Nescafé 3-in-1 Malty variant?", o: ["Yes, I love it", "Not yet", "Prefer Original"] },
  { q: "Does Nescafé help you stay productive throughout the afternoon?", o: ["Significantly", "A Little", "Not Really"] },
  { q: "Which Nescafé format is your favorite?", o: ["Nescafé Classic", "3-in-1 Sachet", "Ready-to-Drink"] },
  { q: "Does Nido Fortified with FortiGrow provide the nutrition your kids need?", o: ["Absolutely", "I believe so", "Unsure"] },
  { q: "How satisfied are you with the creamy taste of Nido milk?", o: ["Extremely Satisfied", "Satisfied", "Neutral"] },
  { q: "Is Nido milk a regular item on your monthly grocery list?", o: ["Yes, Always", "Sometimes", "Rarely"] },
  { q: "Do you prefer Nescafé 3-in-1 over traditional brewed coffee?", o: ["Yes, definitely", "Sometimes", "No"] },
  { q: "Is Nido the best milk choice for growing children in your view?", o: ["The Best Choice", "A Good Choice", "Neutral"] },
  { q: "How do you rate the solubility of Nescafé granules?", o: ["Excellent", "Good", "Fair"] },

  // Breakfast Cereals (Golden Morn & Fitness)
  { q: "How often does your family have Golden Morn for breakfast?", o: ["4-7 Times Weekly", "1-3 Times Weekly", "Rarely"] },
  { q: "Do you prefer the maize and soya blend of Golden Morn?", o: ["Yes, I Love it", "It's Okay", "Neutral"] },
  { q: "Is Golden Morn the most trusted family cereal in your home?", o: ["Highly Trusted", "Trusted", "Neutral"] },
  { q: "Have you tried Nestlé Fitness cereal for a healthy breakfast?", o: ["Yes, regularly", "Once or twice", "Not yet"] },
  { q: "Do the economical Golden Morn sachets help with your budget?", o: ["Helps A Lot", "A Little", "No Difference"] },
  { q: "Is the local sourcing of maize in Golden Morn important to you?", o: ["Very Important", "Somewhat Important", "Not Important"] },
  { q: "How would you rate the crunchiness of Nestlé Fitness cereal?", o: ["Perfectly Crunchy", "Good Texture", "Needs Improvement"] },
  { q: "Do you enjoy Golden Morn with milk or as a dry snack?", o: ["With Milk", "As a Snack", "Both Ways"] },
  { q: "Is Nestlé Fitness your preferred cereal for weight management?", o: ["Primary Choice", "One of many", "Not used"] },
  { q: "Does Golden Morn provide enough energy to last until lunch?", o: ["Yes, Definitely", "Mostly", "Not Really"] },

  // Infant Nutrition (Cerelac, NAN, SMA)
  { q: "Is Cerelac your primary choice for your baby's first solid foods?", o: ["Yes, Only Cerelac", "Mixed with others", "No, I use others"] },
  { q: "Which Cerelac flavor does your baby enjoy most?", o: ["Wheat/Maize", "Fruit Flavors", "Honey Variant"] },
  { q: "How often do you use NAN Optipro for your infant?", o: ["Every Feeding", "Supplement only", "Not used"] },
  { q: "Does NAN Comfort help ease your baby's digestive sensitivity?", o: ["Very Helpful", "Somewhat Helpful", "No change"] },
  { q: "Is SMA Gold your trusted premium infant formula brand?", o: ["Top Choice", "Second Choice", "Not used"] },
  { q: "Do you trust Nestlé infant nutrition for early development?", o: ["Fully Trust", "Mostly Trust", "Neutral"] },
  { q: "How satisfied are you with the quality of Cerelac cereals?", o: ["Very Satisfied", "Satisfied", "Needs Improvement"] },
  { q: "Is the NAN Kid range suitable for your toddler's needs?", o: ["Perfectly Sized", "Good but expensive", "Not used"] },
  { q: "Is SMA Gold 1, 2, or 3 currently in your nursery?", o: ["Yes, stocked", "Just 1 tin", "No"] },
  { q: "Have you noticed any positive growth after using Nestlé formulas?", o: ["Clear improvement", "Slight change", "No change"] },

  // Water, Confectionery & Final Questions
  { q: "Is Nestlé Pure Life your preferred brand for bottled water?", o: ["Always", "Occasionally", "Rarely"] },
  { q: "Do you trust the safety standards of Nestlé Pure Life?", o: ["Completely Trust", "Mostly Trust", "Neutral"] },
  { q: "Is Chocomilo a favorite cocoa confectionery snack for you?", o: ["Top Favorite", "Sometimes", "Not Really"] },
  { q: "How often do you treat yourself to a KitKat chocolate bar?", o: ["Very Often", "Monthly", "Rarely"] },
  { q: "Is Carnation Milk your first choice for baking and desserts?", o: ["Yes, Always", "Sometimes", "No"] },
];

export default function NestleSurveyPage() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config } = useDoc(configRef);
  const adConfig = config?.adConfig;

  // Reset selection and timer on step change
  useEffect(() => {
    setTimeLeft(3);
    setSelectedOption(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!selectedOption || timeLeft > 0) return;
    
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
          <h1 className="text-2xl font-bold text-primary">Survey Complete!</h1>
          <p className="text-muted-foreground">Thank you for your valuable feedback. Your selection for the <b>Nestlé Reward Pack</b> has been recorded.</p>
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">Incentive Status</p>
            <p className="text-sm font-bold mt-1">Reward Coupon Generated: #NST-7729</p>
          </div>
          <Button className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20" onClick={() => window.location.reload()}>Claim My Gift</Button>
        </div>
      </div>
    );
  }

  const currentQuestionData = NESTLE_SURVEY[currentStep];

  return (
    <div className="min-h-screen bg-slate-50 font-body antialiased flex flex-col items-center pt-6 md:pt-10">
      <BrowserDetector onDetect={setDetection} />

      <main className="container mx-auto max-w-xl px-4 space-y-6 flex-1 flex flex-col pb-20">
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
              <div className="flex items-center gap-2 justify-end">
                <Gift className="w-3 h-3 text-accent animate-bounce" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {NESTLE_SURVEY.length}</p>
              </div>
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
                  className={cn(
                    "w-full p-4 text-left text-sm font-medium border rounded-2xl transition-all active:scale-[0.98] outline-none",
                    selectedOption === option 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  )}
                  onClick={() => setSelectedOption(option)}
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
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Sponsored Recommendations</span>
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

        <div className="space-y-4">
          <Button 
            onClick={handleNext}
            disabled={!selectedOption || timeLeft > 0}
            className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {timeLeft > 0 ? (
              <>
                <Timer className="w-5 h-5 animate-pulse" />
                Verifying {timeLeft}s
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
          {!selectedOption && (
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Please select an answer to proceed
            </p>
          )}
        </div>

        <footer className="text-center pt-4">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.1em]">© {new Date().getFullYear()} Nestlé Nigeria Consumer Feedback Program</p>
        </footer>
      </main>
    </div>
  );
}
