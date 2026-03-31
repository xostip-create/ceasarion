"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  MousePointer2, 
  Zap, 
  Save, 
  Loader2, 
  ExternalLink, 
  Globe, 
  ShieldX, 
  Plus, 
  Trash2, 
  Layout,
  RotateCcw,
  Calendar as CalendarIcon
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { subDays, startOfDay, isAfter, parseISO, format } from "date-fns";

const trafficChartConfig = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

type DateRange = "today" | "7d" | "30d" | "all";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [nativeBannerScript, setNativeBannerScript] = useState("");
  const [aggressiveBrowsers, setAggressiveBrowsers] = useState<string[]>([]);
  const [newBrowser, setNewBrowser] = useState("");

  const configRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "adConfig", "settings");
  }, [db, user]);

  const { data: remoteConfig } = useDoc(configRef);

  useEffect(() => {
    if (remoteConfig) {
      setNativeBannerScript(remoteConfig.nativeBannerScript || "");
      setAggressiveBrowsers(remoteConfig.aggressiveBrowsers || ["Brave", "Firefox", "DuckDuckGo"]);
    }
  }, [remoteConfig]);

  const handleSaveConfig = () => {
    if (!db || !user) return;
    const data = {
      nativeBannerScript,
      aggressiveBrowsers,
      updatedAt: new Date().toISOString()
    };
    
    setDocumentNonBlocking(doc(db, "users", user.uid, "adConfig", "settings"), data, { merge: true });
    
    setDocumentNonBlocking(doc(db, "public_landing_pages", "main"), {
      id: "nestle-survey",
      name: "Nestle Survey",
      ownerId: user.uid,
      adConfig: data
    }, { merge: true });
  };

  const addBrowser = () => {
    if (newBrowser && !aggressiveBrowsers.includes(newBrowser)) {
      setAggressiveBrowsers([...aggressiveBrowsers, newBrowser]);
      setNewBrowser("");
    }
  };

  const removeBrowser = (name: string) => {
    setAggressiveBrowsers(aggressiveBrowsers.filter(b => b !== name));
  };

  const impressionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "adImpressionEvents"));
  }, [db, user]);

  const clicksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "adClickEvents"));
  }, [db, user]);

  const { data: allImpressions } = useCollection(impressionsQuery);
  const { data: allClicks } = useCollection(clicksQuery);

  const filteredData = useMemo(() => {
    if (!allImpressions || !allClicks) return { impressions: [], clicks: [] };
    let cutoff: Date | null = null;
    if (dateRange === "today") cutoff = startOfDay(new Date());
    else if (dateRange === "7d") cutoff = subDays(new Date(), 7);
    else if (dateRange === "30d") cutoff = subDays(new Date(), 30);
    const impressions = cutoff ? allImpressions.filter(i => isAfter(parseISO(i.timestamp), cutoff!)) : allImpressions;
    const clicks = cutoff ? allClicks.filter(c => isAfter(parseISO(c.timestamp), cutoff!)) : allClicks;
    return { impressions, clicks };
  }, [allImpressions, allClicks, dateRange]);

  const stats = useMemo(() => {
    const { impressions, clicks } = filteredData;
    const totalImpressions = impressions.length;
    const totalClicks = clicks.length;
    const detected = impressions.filter(i => i.adblockerStatus === 'detected').length;
    const rate = totalImpressions > 0 ? (detected / totalImpressions * 100).toFixed(1) : "0.0";
    return {
      impressions: totalImpressions.toLocaleString(),
      clicks: totalClicks.toLocaleString(),
      optimizedRate: `${rate}%`
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const { impressions, clicks } = filteredData;
    if (dateRange === "today") {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours.map(hour => ({
        name: `${hour}:00`,
        impressions: impressions.filter(i => parseISO(i.timestamp).getHours() === hour).length,
        clicks: clicks.filter(c => parseISO(c.timestamp).getHours() === hour).length,
      }));
    }
    const dayCount = dateRange === "all" ? 14 : (dateRange === "7d" ? 7 : 30);
    const data = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = d.toLocaleDateString();
      data.push({
        name: format(d, "MMM dd"),
        impressions: impressions.filter(i => parseISO(i.timestamp).toLocaleDateString() === dateStr).length,
        clicks: clicks.filter(c => parseISO(c.timestamp).toLocaleDateString() === dateStr).length,
      });
    }
    return data;
  }, [filteredData, dateRange]);

  const handleResetMetrics = () => {
    if (!db || !user || !allImpressions || !allClicks) return;
    allImpressions.forEach(imp => deleteDocumentNonBlocking(doc(db, "users", user.uid, "adImpressionEvents", imp.id)));
    allClicks.forEach(click => deleteDocumentNonBlocking(doc(db, "users", user.uid, "adClickEvents", click.id)));
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center"><Zap className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-bold mb-4">Admin Session Required</h2><Button asChild className="rounded-full px-8"><a href="/login">Sign In</a></Button></div>;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Native Bridge Control</h1>
            <p className="text-muted-foreground">Manage Nestlé Survey native banners and performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-full h-11 px-6 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Metrics
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all recorded impressions and click data for this account.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleResetMetrics} className="rounded-full bg-destructive text-white hover:bg-destructive/90">Yes, Reset Data</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button asChild className="rounded-full h-11 px-6 shadow-lg shadow-primary/20"><a href="/" target="_blank">View Live Survey <ExternalLink className="w-4 h-4 ml-2" /></a></Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border rounded-full p-1 h-12">
            <TabsTrigger value="overview" className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="ads" className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Native Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Survey Impressions", value: stats?.impressions || "0", icon: <Users className="text-primary" /> },
                { label: "Optimization Rate", value: stats?.optimizedRate || "0%", icon: <Zap className="text-accent" /> },
                { label: "Ad Clicks", value: stats?.clicks || "0", icon: <MousePointer2 className="text-primary" /> },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm"><CardContent className="p-6"><div className="flex justify-between items-start"><div className="p-2 bg-secondary rounded-xl">{stat.icon}</div></div><div className="mt-4"><p className="text-sm text-muted-foreground font-medium">{stat.label}</p><h3 className="text-3xl font-bold text-primary mt-1">{stat.value}</h3></div></CardContent></Card>
              ))}
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Traffic Performance</CardTitle><CardDescription>{dateRange === "today" ? "Hourly data" : "Daily trends"}</CardDescription></div><div className="flex items-center gap-2 bg-white border rounded-full px-4 h-10 shadow-sm"><CalendarIcon className="w-4 h-4 text-muted-foreground" /><Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}><SelectTrigger className="border-none shadow-none focus:ring-0 w-[140px] h-8 p-0 text-sm font-medium"><SelectValue placeholder="Select range" /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="7d">Last 7 Days</SelectItem><SelectItem value="30d">Last 30 Days</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent></Select></div></div></CardHeader>
              <CardContent><ChartContainer config={trafficChartConfig} className="h-[350px] w-full"><LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} /><ChartTooltip content={<ChartTooltipContent />} /><Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-impressions)", strokeWidth: 2 }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-clicks)", strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></ChartContainer></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Layout className="w-5 h-5 text-primary" /> Primary Native Banner</CardTitle><CardDescription>This ad format is required for survey progression.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Native Banner Script Code</label>
                      <Textarea placeholder="Paste your Adsterra Native Banner code here..." className="font-code text-xs min-h-[300px]" value={nativeBannerScript} onChange={e => setNativeBannerScript(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="flex items-center gap-2"><ShieldX className="w-5 h-5 text-destructive" /> Targeting Filters</CardTitle><CardDescription>Monitor these environments closely.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">{aggressiveBrowsers.map(b => (<Badge key={b} variant="secondary" className="px-3 py-1 flex items-center gap-2">{b} <Trash2 className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeBrowser(b)} /></Badge>))}</div>
                    <div className="flex gap-2"><Input placeholder="e.g. Brave" value={newBrowser} onChange={e => setNewBrowser(e.target.value)} className="h-9" /><Button size="sm" onClick={addBrowser}><Plus className="w-4 h-4" /></Button></div>
                  </CardContent>
                </Card>
                <Button onClick={handleSaveConfig} className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 gap-2"><Save className="w-5 h-5" /> Save Configuration</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}