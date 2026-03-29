"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { BrowserDetector, DetectionResult } from "@/components/browser-detector";
import { AdRenderer } from "@/components/ad-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  MousePointerClick, 
  ArrowRight, 
  TrendingUp, 
  Layers,
  Cpu
} from "lucide-react";

export default function Home() {
  const [detection, setDetection] = useState<DetectionResult | null>(null);

  return (
    <div className="min-h-screen font-body flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Intelligent Traffic Monetization</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary leading-tight tracking-tight">
                Bypass Adblockers with <span className="text-accent">Ceasarion</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Smart browser detection engine that dynamically serves the most profitable 
                Adsterra formats based on user environment, ensuring 100% fill rate.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" className="bg-primary text-white h-14 px-10 text-lg font-bold rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  Start Monetizing Now
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-full border-2 hover:bg-secondary">
                  View Demo Dashboard
                </Button>
              </div>

              {/* Dynamic Interaction Area */}
              <div className="mt-16 space-y-6">
                <div className="flex justify-center">
                   <BrowserDetector onDetect={setDetection} />
                </div>
                
                <div className="max-w-3xl mx-auto">
                   <AdRenderer detection={detection} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/10 blur-[120px] rounded-full -z-10" />
        </section>

        {/* Features Grid */}
        <section id="solutions" className="py-24 bg-white/50 backdrop-blur-sm border-t border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">Advanced Arbitrage Technology</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Stop losing up to 40% of your traffic revenue to browser restrictions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Cpu className="w-8 h-8 text-accent" />,
                  title: "Real-time Detection",
                  desc: "Instantly identify browser version, OS, and ad-blocking software to tailor the user experience."
                },
                {
                  icon: <Layers className="w-8 h-8 text-accent" />,
                  title: "Hybrid Ad Engine",
                  desc: "Seamlessly switch between Pop-under, Native, and Direct Link formats to maximize CTR."
                },
                {
                  icon: <ShieldCheck className="w-8 h-8 text-accent" />,
                  title: "Domain Rotation",
                  desc: "Built-in anti-ban technology ensuring your arbitrage campaigns stay live and profitable."
                }
              ].map((feature, idx) => (
                <Card key={idx} className="border-none shadow-none bg-transparent group hover:translate-y-[-4px] transition-all">
                  <CardContent className="pt-6 space-y-4">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-primary">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-12 relative overflow-hidden flex flex-col items-center text-center text-white">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <BarChart3 className="w-64 h-64 rotate-12" />
               </div>
               
               <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">Ready to scale your ROI?</h2>
               <p className="text-primary-foreground/80 text-xl max-w-2xl mb-10 leading-relaxed">
                 Join over 1,200 successful traffic arbitrageurs using Ceasarion to outsmart browser limits.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-12 text-lg font-bold rounded-full">
                    Start Free Trial
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-12 text-lg font-bold rounded-full border-white text-white hover:bg-white/10">
                    Talk to Expert
                  </Button>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-secondary/50 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-xl font-headline font-bold text-primary">Ceasarion</span>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Ceasarion Arbitrage. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
