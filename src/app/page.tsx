"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { CheckCircle2, Timer, Gift, ArrowRight, Trophy, Sparkles, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NESTLE_SURVEY = [
  // Hook Questions
  { q: "Which Nestlé gift pack would you prefer as your reward today?", o: ["Milo & Nido Pack", "Maggi Culinary Set", "Golden Morn Family Pack"] },
  { q: "Will you provide honest feedback to help us improve our local recipes?", o: ["Yes, Absolutely", "I Will Try", "Definitely"] },
  { q: "How many people in your household enjoy Nestlé products daily?", o: ["1-3 People", "4-6 People", "7+ People"] },
  { q: "Which Nestlé site have you heard of in Nigeria?", o: ["Agbara Factory", "Flowergate Site", "Abaji Factory"] },
  { q: "What is your primary reason for choosing Nestlé products?", o: ["Quality & Taste", "Nutritional Value", "Affordability"] },

  // Culinary (Maggi)
  { q: "How often do you use Maggi Star cubes for your daily cooking?", o: ["Every Single Day", "3-4 Times Weekly", "Occasionally"] },
  { q: "Which Maggi variant is your absolute favorite for Jollof Rice?", o: ["Maggi Signature Jollof", "Maggi Star", "Maggi Naija Pot"] },
  { q: "Do you prefer Maggi Chicken or Maggi Crayfish for soups?", o: ["Maggi Chicken", "Maggi Crayfish", "I Use Both"] },
  { q: "How would you rate the flavor intensity of Maggi Mi’py?", o: ["Very Intense", "Good Balance", "Needs More Flavor"] },
  { q: "Does Maggi seasoning help you achieve the perfect taste?", o: ["Always", "Most Times", "Sometimes"] },
  { q: "How many Maggi cubes do you typically use for a large pot?", o: ["1-2 Cubes", "3-5 Cubes", "6+ Cubes"] },
  { q: "Have you noticed the iron fortification logo on Maggi?", o: ["Yes, I noticed", "No, I haven't", "I'll look now"] },
  { q: "Do you believe Maggi is the most iconic seasoning in Nigeria?", o: ["Strongly Agree", "Agree", "Neutral"] },
  { q: "Which Maggi Signature variant do you use most?", o: ["Jollof", "Naija Pot", "Mi’py"] },
  { q: "Is the price of Maggi cubes reasonable for your budget?", o: ["Very Affordable", "Fair Price", "A bit Expensive"] },

  // Beverages (Milo)
  { q: "Is Milo your first choice for a chocolate malt drink?", o: ["Yes, Primary Choice", "Sometimes", "No, I use others"] },
  { q: "How often do you purchase Milo Ready-to-Drink (RTD)?", o: ["Every Week", "Occasionally", "Never"] },
  { q: "Do you prefer the convenience of Milo 3-in-1 sachets?", o: ["Love the convenience", "It's Okay", "Prefer Powdered Tins"] },
  { q: "Is Milo a necessary energy food drink for active kids?", o: ["Highly Necessary", "Somewhat Necessary", "Optional"] },
  { q: "Which Milo pack size do you buy most frequently?", o: ["Large Tins", "Economy Sachets", "Refill Packs"] },
  { q: "Does Milo help your kids stay active throughout the day?", o: ["Significantly", "Moderately", "Unsure"] },
  { q: "How likely are you to recommend Milo to other parents?", o: ["Very Likely", "Likely", "Neutral"] },
  { q: "Which Milo format do you find most refreshing?", o: ["Hot Drink", "Cold/Iced Drink", "RTD Pack"] },
  { q: "Is the taste of Milo better than other malt drinks?", o: ["Much Better", "Slightly Better", "About the same"] },
  { q: "How satisfied are you with the energy release Milo provides?", o: ["Very Satisfied", "Satisfied", "Neutral"] },

  // Beverages (Nescafé & Nido)
  { q: "Is Nescafé Classic your go-to for a morning boost?", o: ["Yes, Every Morning", "Occasionally", "Rarely"] },
  { q: "Have you tried the Nescafé 3-in-1 Malty variant?", o: ["Yes, I love it", "Not yet", "Prefer Original"] },
  { q: "Does Nescafé help you stay productive in the afternoon?", o: ["Significantly", "A Little", "Not Really"] },
  { q: "Which Nescafé format is your favorite?", o: ["Nescafé Classic", "3-in-1 Sachet", "Ready-to-Drink"] },
  { q: "Does Nido FortiGrow provide the nutrition your kids need?", o: ["Absolutely", "I believe so", "Unsure"] },
  { q: "How satisfied are you with the creamy taste of Nido?", o: ["Extremely Satisfied", "Satisfied", "Neutral"] },
  { q: "Is Nido milk a regular item on your monthly list?", o: ["Yes, Always", "Sometimes", "Rarely"] },
  { q: "Do you prefer Nescafé 3-in-1 over traditional coffee?", o: ["Yes, definitely", "Sometimes", "No"] },
  { q: "Is Nido the best milk choice for growing children?", o: ["The Best Choice", "A Good Choice", "Neutral"] },
  { q: "How do you rate the solubility of Nescafé granules?", o: ["Excellent", "Good", "Fair"] },

  // Breakfast Cereals (Golden Morn)
  { q: "How often does your family have Golden Morn for breakfast?", o: ["4-7 Times Weekly", "1-3 Times Weekly", "Rarely"] },
  { q: "Do you prefer the maize and soya blend of Golden Morn?", o: ["Yes, I Love it", "It's Okay", "Neutral"] },
  { q: "Is Golden Morn the most trusted cereal in your home?", o: ["Highly Trusted", "Trusted", "Neutral"] },
  { q: "Have you tried Nestlé Fitness cereal?", o: ["Yes, regularly", "Once or twice", "Not yet"] },
  { q: "Do the economical Golden Morn sachets help your budget?", o: ["Helps A Lot", "A Little", "No Difference"] },
  { q: "Is local sourcing of maize in Golden Morn important?", o: ["Very Important", "Somewhat Important", "Not Important"] },
  { q: "How would you rate the crunchiness of Fitness cereal?", o: ["Perfectly Crunchy", "Good Texture", "Needs Improvement"] },
  { q: "Do you enjoy Golden Morn with milk or as a snack?", o: ["With Milk", "As a Snack", "Both Ways"] },
  { q: "Is Fitness your preferred cereal for weight management?", o: ["Primary Choice", "One of many", "Not used"] },
  { q: "Does Golden Morn provide enough energy until lunch?", o: ["Yes, Definitely", "Mostly", "Not Really"] },

  // Infant Nutrition
  { q: "Is Cerelac your primary choice for your baby's first solids?", o: ["Yes, Only Cerelac", "Mixed with others", "No, I use others"] },
  { q: "Which Cerelac flavor does your baby enjoy most?", o: ["Wheat/Maize", "Fruit Flavors", "Honey Variant"] },
  { q: "How often do you use NAN Optipro for your infant?", o: ["Every Feeding", "Supplement only", "Not used"] },
  { q: "Does NAN Comfort help ease digestive sensitivity?", o: ["Very Helpful", "Somewhat Helpful", "No change"] },
  { q: "Is SMA Gold your trusted premium formula brand?", o: ["Top Choice", "Second Choice", "Not used"] },
  { q: "Do you trust Nestlé infant nutrition for development?", o: ["Fully Trust", "Mostly Trust", "Neutral"] },
  { q: "How satisfied are you with the quality of Cerelac?", o: ["Very Satisfied", "Satisfied", "Needs Improvement"] },
  { q: "Is the NAN Kid range suitable for your toddler's needs?", o: ["Perfectly Sized", "Good but expensive", "Not used"] },
  { q: "Is SMA Gold 1, 2, or 3 currently in your nursery?", o: ["Yes, stocked", "Just 1 tin", "No"] },
  { q: "Have you noticed positive growth after using Nestlé formulas?", o: ["Clear improvement", "Slight change", "No change"] },

  // Water & Confectionery
  { q: "Is Nestlé Pure Life your preferred brand for bottled water?", o: ["Always", "Occasionally", "Rarely"] },
  { q: "Do you trust the safety standards of Pure Life?", o: ["Completely Trust", "Mostly Trust", "Neutral"] },
  { q: "Is Chocomilo a favorite cocoa confectionery snack for you?", o: ["Top Favorite", "Sometimes", "Not Really"] },
  { q: "How often do you treat yourself to a KitKat bar?", o: ["Very Often", "Monthly", "Rarely"] },
  { q: "Is Carnation Milk your first choice for baking?", o: ["Yes, Always", "Sometimes", "No"] },
];

export default function NestleGiftArena() {
  const db = useFirestore();
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');
  const questionCardRef = useRef<HTMLDivElement>(null);
  const continueBtnRef = useRef<HTMLDivElement>(null);

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "public_landing_pages", "main");
  }, [db]);

  const { data: config } = useDoc(configRef);
  const adConfig = config?.adConfig;

  useEffect(() => {
    setTimeLeft(3);
    setSelectedOption(null);
  }, [currentStep]);

  useEffect(() => {
    if (timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isCompleted]);

  useEffect(() => {
    if (config && detection && db) {
      const impressionRef = collection(db, "users", config.ownerId, "adImpressionEvents");
      addDocumentNonBlocking(impressionRef, {
        landingPageId: "nestle-gift-arena",
        step: currentStep,
        timestamp: new Date().toISOString(),
        browserType: detection.browser,
        adblockerStatus: detection.adBlockActive ? "detected" : "notDetected"
      });
    }
  }, [config, detection, db, currentStep]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setTimeout(() => {
      continueBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleNext = () => {
    if (!selectedOption || timeLeft > 0) return;
    
    if (currentStep < NESTLE_SURVEY.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => {
        questionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const progress = useMemo(() => {
    return ((currentStep + 1) / NESTLE_SURVEY.length) * 100;
  }, [currentStep]);

  if (isCompleted) {
    return (
      <div className="min-h-screen arena-gradient flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 border-4 border-secondary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-20 h-20 text-secondary" />
          </div>
          <Sparkles className="w-16 h-16 text-secondary mx-auto gift-pulse" />
          <h1 className="text-3xl font-black text-primary tracking-tight">ARENA COMPLETE!</h1>
          <p className="text-muted-foreground font-medium">Excellent work! Your feedback is secured and your <b>Nestlé Reward Pack</b> is being finalized.</p>
          <div className="bg-secondary/10 p-6 rounded-3xl border-2 border-dashed border-secondary/40">
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Gift Arena Voucher</p>
            <p className="text-xl font-black mt-2 text-primary">#GIFT-ARENA-992</p>
          </div>
          <Button className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-secondary/30 bg-secondary hover:bg-secondary/90 text-primary" onClick={() => window.location.reload()}>CLAIM REWARD NOW</Button>
        </div>
      </div>
    );
  }

  const currentQuestionData = NESTLE_SURVEY[currentStep];

  return (
    <div className="min-h-screen arena-gradient font-body antialiased flex flex-col items-center pt-6 md:pt-10 pb-20">
      <BrowserDetector onDetect={setDetection} />

      <header className="container max-w-xl px-4 mb-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-2xl shadow-lg">
            {logo && <Image src={logo.imageUrl} alt="Nestle" width={40} height={40} className="object-contain" />}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-primary tracking-tight flex items-center gap-2">
              GIFT ARENA <Trophy className="w-5 h-5 text-secondary" />
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Premium Rewards Portal</p>
          </div>
        </div>
        
        <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm flex items-center justify-between border border-white/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
              <Coins className="w-4 h-4 text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Arena Level</span>
              <span className="text-xs font-black text-primary">{currentStep + 1} / 60</span>
            </div>
          </div>
          <div className="flex-1 max-w-[120px] mx-4">
             <Progress value={progress} className="h-2 bg-slate-100" />
          </div>
          <Badge variant="secondary" className="bg-secondary/10 text-primary border-secondary/20 font-bold">
            +{Math.floor(progress)}pts
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-xl px-4 space-y-6 flex-1 flex flex-col">
        <div ref={questionCardRef} className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/20 border border-white p-6 md:p-8 space-y-8 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5">
            <Sparkles className="w-24 h-24" />
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 leading-[1.2] tracking-tight">
              {currentQuestionData.q}
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {currentQuestionData.o.map((option) => (
                <button 
                  key={option}
                  className={cn(
                    "w-full p-5 text-left text-sm font-bold border-2 rounded-[1.5rem] transition-all active:scale-[0.98] outline-none relative group",
                    selectedOption === option 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-slate-50 border-slate-100 text-slate-700 hover:border-secondary/40 hover:bg-white"
                  )}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                  {selectedOption === option && <CheckCircle2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section id="ad-unit" className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="h-[2px] bg-slate-200 flex-1" />
             <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border shadow-sm">
                <Sparkles className="w-3 h-3 text-secondary" />
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.15em]">Sponsored Area</span>
             </div>
             <div className="h-[2px] bg-slate-200 flex-1" />
          </div>
          
          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-1 border border-white/60 shadow-xl shadow-slate-200/50">
            <AdRenderer 
              key={currentStep}
              detection={detection} 
              onAdClick={() => {}} 
              nativeScript={adConfig?.nativeBannerScript}
            />
          </div>
        </section>

        <div ref={continueBtnRef} className="space-y-4 pb-10">
          {selectedOption && (
            <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Badge className="bg-secondary text-primary font-black py-1 px-4 rounded-full gift-pulse">
                 ARENA SYNCED! CLICK BELOW
               </Badge>
            </div>
          )}

          <Button 
            onClick={handleNext}
            disabled={!selectedOption || timeLeft > 0}
            className={cn(
               "w-full h-16 rounded-[1.5rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3",
               !selectedOption || timeLeft > 0 ? "bg-slate-200 text-slate-400" : "bg-primary text-white shadow-primary/30 hover:scale-[1.02]"
            )}
          >
            {timeLeft > 0 ? (
              <>
                <Timer className="w-6 h-6 animate-spin" />
                ARENA LOCK ({timeLeft}s)
              </>
            ) : (
              <>
                NEXT CHALLENGE
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>
          {!selectedOption && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              SELECT ONE TO UNLOCK CONTINUE
            </div>
          )}
        </div>

        <footer className="text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2">
            © {new Date().getFullYear()} <span className="text-primary">Nestlé Nigeria Arena</span> <Trophy className="w-3 h-3 text-secondary" />
          </p>
        </footer>
      </main>
    </div>
  );
}