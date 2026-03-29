"use client";

import { useState, useMemo } from "react";
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
  XAxis, 
  YAxis,
  CartesianGrid,
  Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
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

const trafficChartConfig = {
  impressions: {
    label: "Impressions",
    color: "hsl(var(--chart-1))",
  },
  clicks: {
    label: "Clicks",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const browserChartConfig = {
  value: {
    label: "Traffic Share",
  },
} satisfies ChartConfig;

const DEFAULT_TEMPLATE = `<article class="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
  <header class="space-y-4">
    <div class="flex items-center gap-2 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
      <span class="px-2 py-0.5 bg-blue-50 rounded border border-blue-100">Breaking News</span>
      <span>• 5 Min Read</span>
    </div>
    <h1 class="text-3xl font-bold text-slate-900 leading-tight">
      New Policy Changes Could Save Families Thousands This Year
    </h1>
  </header>
  
  <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
     <img src="https://picsum.photos/seed/fb-news/800/450" alt="News Image" class="object-cover w-full h-full" />
  </div>

  <div class="space-y-4 text-slate-700 leading-relaxed">
    <p class="text-lg font-medium text-slate-800">
      A recent shift in federal guidelines is creating waves across the market, potentially offering significant relief for millions of families nationwide.
    </p>
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

  const impressionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "adImpressionEvents"));
  }, [db, user]);

  const clicksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "adClickEvents"));
  }, [db, user]);

  const { data: landingPages, isLoading: isPagesLoading } = useCollection(landingPagesQuery);
  const { data: impressions } = useCollection(impressionsQuery);
  const { data: clicks } = useCollection(clicksQuery);

  const stats = useMemo(() => {
    if (!impressions || !clicks) return null;
    const totalImpressions = impressions.length;
    const totalClicks = clicks.length;
    const revenue = (totalClicks * 0.12) + (totalImpressions / 1000 * 0.45);
    const detected = impressions.filter(i => i.adblockerStatus === 'detected').length;
    const rate = totalImpressions > 0 ? (detected / totalImpressions * 100).toFixed(1) : "0.0";

    return {
      impressions: totalImpressions > 1000 ? `${(totalImpressions / 1000).toFixed(1)}K` : totalImpressions.toString(),
      clicks: totalClicks.toLocaleString(),
      revenue: `$${revenue.toFixed(2)}`,
      optimizedRate: `${rate}%`
    };
  }, [impressions, clicks]);

  const chartData = useMemo(() => {
    if (!impressions || !clicks) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    return last7Days.map(day => {
      const dayImpressions = impressions.filter(i => {
        const date = new Date(i.timestamp);
        return date.toLocaleDateString('en-US', { weekday: 'short' }) === day;
      }).length;
      const dayClicks = clicks.filter(c => {
        const date = new Date(c.timestamp);
        return date.toLocaleDateString('en-US', { weekday: 'short' }) === day;
      }).length;

      return { name: day, impressions: dayImpressions, clicks: dayClicks };
    });
  }, [impressions, clicks]);

  const browserData = useMemo(() => {
    if (!impressions) return [];
    const counts: Record<string, number> = {};
    impressions.forEach(i => {
      counts[i.browserType] = (counts[i.browserType] || 0) + 1;
    });

    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }));
  }, [impressions]);

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
    setDocumentNonBlocking(publicRef, { ...pageData, ownerId: user.uid }, { merge: true });
    setIsDialogOpen(false);
    setNewName("");
    setNewSlug("");
    setNewHtml(DEFAULT_TEMPLATE);
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center"><ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-bold mb-4">Admin Session Required</h2><Button asChild className="rounded-full px-8"><a href="/login">Sign In</a></Button></div>;

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
              <Button className="rounded-full h-11 px-6 shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> New Landing Page</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Landing Page</DialogTitle>
                <DialogDescription>Configure your high-conversion middleman page for Facebook traffic.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label htmlFor="name">Campaign Name</Label><Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="FB Summer Promo" /></div>
                  <div className="grid gap-2"><Label htmlFor="slug">URL Slug</Label><Input id="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="exclusive-offer" /></div>
                </div>
                <div className="grid gap-2"><Label htmlFor="html">Content HTML</Label><Textarea id="html" value={newHtml} onChange={(e) => setNewHtml(e.target.value)} rows={12} className="font-mono text-xs" /></div>
              </div>
              <DialogFooter><Button onClick={handleCreatePage} className="w-full rounded-full h-12 font-bold text-lg">Launch Live Page</Button></DialogFooter>
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
                { label: "Total Impressions", value: stats?.impressions || "0", trend: "+12.5%", icon: <Users className="text-primary" /> },
                { label: "Optimized Rate", value: stats?.optimizedRate || "0%", trend: "+5.2%", icon: <ShieldAlert className="text-accent" /> },
                { label: "Total Clicks", value: stats?.clicks || "0", trend: "+18.3%", icon: <MousePointer2 className="text-primary" /> },
                { label: "Est. Revenue", value: stats?.revenue || "$0.00", trend: "+24.1%", icon: <TrendingUp className="text-green-500" /> },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm"><CardContent className="p-6">
                  <div className="flex justify-between items-start"><div className="p-2 bg-secondary rounded-xl">{stat.icon}</div><span className="text-xs font-bold text-green-600 flex items-center gap-1">{stat.trend} <ArrowUpRight className="w-3 h-3" /></span></div>
                  <div className="mt-4"><p className="text-sm text-muted-foreground font-medium">{stat.label}</p><h3 className="text-3xl font-bold text-primary mt-1">{stat.value}</h3></div>
                </CardContent></Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-sm"><CardHeader><CardTitle>Daily Traffic Performance</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={trafficChartConfig} className="h-[300px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm"><CardHeader><CardTitle>Browser Targeting</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <ChartContainer config={browserChartConfig} className="h-[200px] w-full">
                      <BarChart data={browserData} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} width={70} />
                         <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                           {browserData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                         </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isPagesLoading ? [1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-muted rounded-xl" />) : 
                landingPages?.map((page) => (
                  <Card key={page.id} className="hover:shadow-md transition-all border-none group bg-white shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-primary/[0.02]">
                      <CardTitle className="text-lg font-bold text-primary truncate max-w-[150px]">{page.name}</CardTitle>
                      <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center"><Globe className="w-4 h-4 text-primary" /></div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <code className="text-xs bg-muted p-2 rounded block break-all font-mono text-primary/80 border">/l/{page.slug}</code>
                      <div className="flex items-center justify-between pt-2"><span className="text-xs font-bold text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live</span><span className="text-xs text-muted-foreground">{new Date(page.updatedAt).toLocaleDateString()}</span></div>
                      <div className="pt-4 flex gap-2"><Button variant="outline" size="sm" className="flex-1 rounded-full text-xs font-bold h-9" asChild><a href={`/l/${page.slug}`} target="_blank" rel="noopener noreferrer">Test <ExternalLink className="ml-1 w-3 h-3" /></a></Button></div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}