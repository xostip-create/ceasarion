
"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MousePointer2, ShieldAlert, Zap, Save, Loader2, ExternalLink, Globe, ShieldX, Plus, Trash2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, doc, setDoc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const trafficChartConfig = {
  impressions: { label: "Impressions", color: "hsl(var(--chart-1))" },
  clicks: { label: "Clicks", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Ad Configuration State
  const [smartLink, setSmartLink] = useState("");
  const [popUnderScript, setPopUnderScript] = useState("");
  const [nativeBannerScript, setNativeBannerScript] = useState("");
  const [aggressiveBrowsers, setAggressiveBrowsers] = useState<string[]>([]);
  const [newBrowser, setNewBrowser] = useState("");

  const configRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "adConfig", "settings");
  }, [db, user]);

  const { data: remoteConfig, isLoading: isConfigLoading } = useDoc(configRef);

  useEffect(() => {
    if (remoteConfig) {
      setSmartLink(remoteConfig.smartLink || "");
      setPopUnderScript(remoteConfig.popUnderScript || "");
      setNativeBannerScript(remoteConfig.nativeBannerScript || "");
      setAggressiveBrowsers(remoteConfig.aggressiveBrowsers || ["Brave", "Firefox", "DuckDuckGo"]);
    }
  }, [remoteConfig]);

  const handleSaveConfig = () => {
    if (!db || !user) return;
    const data = {
      smartLink,
      popUnderScript,
      nativeBannerScript,
      aggressiveBrowsers,
      updatedAt: new Date().toISOString()
    };
    
    // Save to private settings
    setDocumentNonBlocking(doc(db, "users", user.uid, "adConfig", "settings"), data, { merge: true });
    
    // Sync to public landing page config
    setDocumentNonBlocking(doc(db, "public_landing_pages", "main"), {
      id: "home-offer",
      name: "Main Offer",
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

  // Stats Logic
  const impressionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "adImpressionEvents"));
  }, [db, user]);

  const clicksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "adClickEvents"));
  }, [db, user]);

  const { data: impressions } = useCollection(impressionsQuery);
  const { data: clicks } = useCollection(clicksQuery);

  const stats = useMemo(() => {
    if (!impressions || !clicks) return null;
    const totalImpressions = impressions.length;
    const totalClicks = clicks.length;
    const detected = impressions.filter(i => i.adblockerStatus === 'detected').length;
    const rate = totalImpressions > 0 ? (detected / totalImpressions * 100).toFixed(1) : "0.0";
    return {
      impressions: totalImpressions.toLocaleString(),
      clicks: totalClicks.toLocaleString(),
      optimizedRate: `${rate}%`
    };
  }, [impressions, clicks]);

  const chartData = useMemo(() => {
    if (!impressions || !clicks) return [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map(day => ({
      name: day,
      impressions: impressions.filter(i => new Date(i.timestamp).toLocaleDateString('en-US', { weekday: 'short' }) === day).length,
      clicks: clicks.filter(c => new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'short' }) === day).length,
    }));
  }, [impressions, clicks]);

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center"><ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-bold mb-4">Admin Session Required</h2><Button asChild className="rounded-full px-8"><a href="/login">Sign In</a></Button></div>;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Arbitrage Control</h1>
            <p className="text-muted-foreground">Manage your Adsterra scripts and real-time performance.</p>
          </div>
          <Button asChild className="rounded-full h-11 px-6 shadow-lg shadow-primary/20">
            <a href="/" target="_blank">Test Landing Page <ExternalLink className="w-4 h-4 ml-2" /></a>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border rounded-full p-1 h-12">
            <TabsTrigger value="overview" className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="ads" className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Ad Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Total Impressions", value: stats?.impressions || "0", icon: <Users className="text-primary" /> },
                { label: "Optimization Rate", value: stats?.optimizedRate || "0%", icon: <Zap className="text-accent" /> },
                { label: "Total Clicks", value: stats?.clicks || "0", icon: <MousePointer2 className="text-primary" /> },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-secondary rounded-xl">{stat.icon}</div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-primary mt-1">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Traffic Performance</CardTitle></CardHeader>
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
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Core Links</CardTitle>
                    <CardDescription>Primary targets for standard browser traffic.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Smart Link URL (Main Target)</label>
                      <Input placeholder="https://adsterra.com/smartlink/..." value={smartLink} onChange={e => setSmartLink(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-accent" /> Adsterra Fallbacks</CardTitle>
                    <CardDescription>Scripts injected based on environmental detection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Pop-under Script</label>
                      <Textarea placeholder="Paste Adsterra Pop-under code here..." className="font-code text-xs min-h-[120px]" value={popUnderScript} onChange={e => setPopUnderScript(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Native Banner Script</label>
                      <Textarea placeholder="Paste Adsterra Native Banner code here..." className="font-code text-xs min-h-[120px]" value={nativeBannerScript} onChange={e => setNativeBannerScript(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldX className="w-5 h-5 text-destructive" /> Aggressive Browsers</CardTitle>
                    <CardDescription>Trigger fallbacks for these browsers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {aggressiveBrowsers.map(b => (
                        <Badge key={b} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                          {b} <Trash2 className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeBrowser(b)} />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="e.g. Brave" value={newBrowser} onChange={e => setNewBrowser(e.target.value)} className="h-9" />
                      <Button size="sm" onClick={addBrowser}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveConfig} className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 gap-2">
                  <Save className="w-5 h-5" /> Save Ad Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
