
import Link from "next/link";
import { Zap, LayoutDashboard, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-headline font-bold tracking-tight text-primary">Ceasarion</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
             Dashboard
          </Link>
          <Link href="#solutions" className="text-sm font-medium hover:text-primary transition-colors">Solutions</Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:flex text-primary font-bold">Sign In</Button>
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 shadow-md shadow-primary/30">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}
