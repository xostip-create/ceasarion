
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Hide navbar on campaign pages to maximize conversion
  if (pathname?.startsWith("/l/")) return null;

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
          <Link href="/" className={`text-sm font-medium transition-colors ${pathname === "/" ? "text-primary font-bold" : "hover:text-primary"}`}>Home</Link>
          {user && (
            <Link href="/dashboard" className={`text-sm font-medium transition-colors flex items-center gap-1 ${pathname === "/dashboard" ? "text-primary font-bold" : "hover:text-primary"}`}>
               Dashboard
            </Link>
          )}
          <Link href="/#solutions" className="text-sm font-medium hover:text-primary transition-colors">Solutions</Link>
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <Button variant="ghost" asChild className="text-primary font-bold">
              <Link href="/login">Sign In</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                 <span className="w-2 h-2 bg-green-500 rounded-full" />
                 Connected
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
          <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 shadow-md shadow-primary/30">
            <Link href={user ? "/dashboard" : "/login"}>
              {user ? "Admin Panel" : "Get Started"}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
