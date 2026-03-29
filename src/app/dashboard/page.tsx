
"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  ShieldAlert,
  ArrowUpRight,
  Monitor,
  Smartphone,
  Plus,
  Globe,
  Loader2,
  ExternalLink,
  Settings2
} from "lucide-react";
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid,
  Cell
} from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const mockLineData = [
  { name: "Mon", impressions: 4500, clicks: 320 },
  { name: "Tue", impressions: 5200, clicks: 480 },
  { name: "Wed", impressions: 3800, clicks: 290 },
  { name: "Thu", impressions: 6100, clicks: 540 },
  { name: "Fri", impressions: 4800, clicks: 410 },
  { name: "Sat", impressions: 7200, clicks: 680 },
  { name: "Sun", impressions: 6800, clicks: 610 },
];

const browserData = [
  { name: "Chrome", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Safari", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Firefox", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Edge", value: 10, color: "hsl(var(--chart-4))" },
  { name: "Others", value: 5, color: "hsl(var(--chart-5))" },
];

const DEFAULT_TEMPLATE = `<article class="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
  <header class="space-y-4">
    <div class="flex items-center gap-2 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
      <span class="px-2 py-0.5 bg-blue-50 rounded border border-blue-100">Breaking News</span>
      <span>• 5 Min Read</span>
    </div>
    <h1 class="text-3xl font-bold text-slate-900 leading-tight">
      New Policy Changes Could Save Families Thousands This Year
    </h1>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
         <svg class="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      </div>
      <div>
        <p class="text-sm font-bold">Sarah Jenkins</p>
        <p class="text-xs text-slate-500">Updated 2 hours ago</p>
      </div>
    </div>
  </header>
  
  <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
     <img src="https://picsum.photos/seed/fb-news/800/450" alt="News Image" class="object-cover w-full h-full" />
  </div>

  <div class="space-y-4 text-slate-700 leading-relaxed">
    <p class="text-lg font-medium text-slate-800">
      A recent shift in federal guidelines is creating waves across the market, potentially offering significant relief for millions of families nationwide.
    </p>
    <p>
      Industry experts suggest that these adjustments are designed to combat rising costs while providing a pathway for sustainable growth in the residential sector. Early reports indicate that early adopters of the tool below have seen the most benefit.
    </p>
  </div>
  
  <div class="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center space-y-4">
    <h2 class="text-xl font-bold text-blue-900 underline decoration-accent/30 underline-offset-4 italic">Check Your Eligibility Below</h2>
    <p class="text-sm text-blue-700">Our free tool helps you determine if you qualify for the new rebate program in under 60 seconds. No obligation required.</p>
  </div>
</article>`;

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newHtml, setNewHtml] = useState(DEFAULT_TEMPLATE);

  const landingPagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "landingPages"));
  }, [db, user]);

  const { data: landingPages, isLoading: isPagesLoading } = useCollection(landingPagesQuery);

  const handleCreatePage = () => {
    if (!user || !db || !newName || !newSlug) return;

    const id = doc(collection(db, "temp")).id;
    const pageRef = doc(db, "users", user.uid, "landingPages", id);
    
    const pageData = {
      id,
      name: newName,
      slug: newSlug,
      description: "Custom Facebook traffic landing page",
      htmlContent: newHtml,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(pageRef, pageData, { merge: true });
    
    const publicRef = doc(db, "public_landing_pages", newSlug);
    setDocumentNonBlocking(publicRef, {
      ...pageData,
      ownerId: user.uid
    }, { merge: true });

    setIsDialogOpen(false);
    setNewName("");
    setNewSlug("");
    setNewHtml(DEFAULT_TEMPLATE);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Admin Session Required</h2>
        <p className="text-muted-foreground mb-6">Please sign in to access the monetization console.</p>
        <Button asChild className="rounded-full px-8">
           <a href="/login">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Admin Console</h1>
            <p className="text-muted-foreground">Manage your arbitrage flows and track performance.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-11 px-6 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> New Landing Page
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Landing Page</DialogTitle>
                <DialogDescription>
                  Configure your high-conversion middleman page for Facebook traffic.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="FB Summer Promo" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">URL Slug (/l/[slug])</Label>
                    <Input id="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="exclusive-offer" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="html">Content HTML (Viral Template)</Label>
                  <Textarea 
                    id="html" 
                    value={newHtml} 
                    onChange={(e) => setNewHtml(e.target.value)} 
                    rows={12}
                    className="font-mono text-xs"
                    placeholder="HTML content for the landing page..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePage} className="w-full rounded-full h-12 font-bold text-lg">Launch Live Page</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full border h-12">
            <TabsTrigger value="overview" className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Active Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Impressions", value: "248.5K", trend: "+12.5%", icon: <Users className="text-primary" /> },
                { label: "Bypass Rate", value: "99.8%", trend: "+5.2%", icon: <ShieldAlert className="text-accent" /> },
                { label: "Total Clicks", value: "14,208", trend: "+18.3%", icon: <MousePointer2 className="text-primary" /> },
                { label: "Est. Revenue", value: "$4,129", trend: "+24.1%", icon: <TrendingUp className="text-green-500" /> },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-secondary rounded-xl">
                        {stat.icon}
                      </div>
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        {stat.trend} <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-primary mt-1">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Daily Traffic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockLineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="impressions" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Browser Targeting</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="h-[200px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={browserData} layout="vertical">
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} width={70} />
                             <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                               {browserData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Mobile Traffic</span>
                          <span className="font-bold">62%</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Desktop Traffic</span>
                          <span className="font-bold">31%</span>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isPagesLoading ? (
                [1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-muted rounded-xl" />)
              ) : landingPages && landingPages.length > 0 ? (
                landingPages.map((page) => (
                  <Card key={page.id} className="hover:shadow-md transition-all border-none group bg-white shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-primary/[0.02]">
                      <CardTitle className="text-lg font-bold text-primary truncate max-w-[150px]">{page.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                           <Globe className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Public URL</span>
                        <code className="text-xs bg-muted p-2 rounded block break-all font-mono text-primary/80 border">/l/{page.slug}</code>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                         <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live & Serving
                         </span>
                         <span className="text-xs text-muted-foreground">Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="pt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs font-bold h-9" asChild>
                           <a href={`/l/${page.slug}`} target="_blank" rel="noopener noreferrer">
                             Test <ExternalLink className="ml-1 w-3 h-3" />
                           </a>
                        </Button>
                        <Button variant="default" size="sm" className="flex-1 rounded-full text-xs font-bold h-9">
                           Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Globe className="w-10 h-10 text-primary/30" />
                  </div>
                  <div className="max-w-xs mx-auto space-y-2">
                    <h3 className="text-xl font-bold text-primary">No Active Flows</h3>
                    <p className="text-sm text-muted-foreground">Launch your first viral landing page to begin routing and monetizing your traffic.</p>
                  </div>
                  <Button onClick={() => setIsDialogOpen(true)} className="rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20">
                    Create My First Landing Page
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
