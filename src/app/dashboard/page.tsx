
"use client";

import { useMemo, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
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

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Initialize public config so the hardcoded landing page knows who the owner is
  useEffect(() => {
    if (user && db) {
      const configRef = doc(db, "public_landing_pages", "main");
      setDocumentNonBlocking(configRef, { 
        ownerId: user.uid, 
        id: "main-promo",
        name: "Main Offer Page" 
      }, { merge: true });
    }
  }, [user, db]);

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
    const revenue = (totalClicks * 0.12) + (totalImpressions / 1000 * 0.45);
    const detected = impressions.filter(i => i.adblockerStatus === 'detected').length;
    const rate = totalImpressions > 0 ? (detected / totalImpressions * 100).toFixed(1) : "0.0";

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const todayStart = now.getTime() - oneDay;
    const yesterdayStart = now.getTime() - (2 * oneDay);

    const getCountInPeriod = (data: any[], start: number, end: number) => 
      data.filter(item => {
        const t = new Date(item.timestamp).getTime();
        return t >= start && t < end;
      }).length;

    const currentImps = getCountInPeriod(impressions, todayStart, now.getTime());
    const previousImps = getCountInPeriod(impressions, yesterdayStart, todayStart);
    
    const currentClicks = getCountInPeriod(clicks, todayStart, now.getTime());
    const previousClicks = getCountInPeriod(clicks, yesterdayStart, todayStart);

    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    return {
      impressions: totalImpressions > 1000 ? `${(totalImpressions / 1000).toFixed(1)}K` : totalImpressions.toString(),
      clicks: totalClicks.toLocaleString(),
      revenue: `$${revenue.toFixed(2)}`,
      optimizedRate: `${rate}%`,
      trends: {
        impressions: getTrend(currentImps, previousImps),
        clicks: getTrend(currentClicks, previousClicks),
        revenue: getTrend(currentClicks, previousClicks),
        optimizedRate: getTrend(currentImps, previousImps)
      }
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

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center"><ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-bold mb-4">Admin Session Required</h2><Button asChild className="rounded-full px-8"><a href="/login">Sign In</a></Button></div>;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Admin Console</h1>
            <p className="text-muted-foreground">Real-time performance metrics for your hardcoded offer page.</p>
          </div>
          <Button asChild className="rounded-full h-11 px-6 shadow-lg shadow-primary/20">
            <a href="/offer" target="_blank">Test Landing Page <ExternalLink className="w-4 h-4 ml-2" /></a>
          </Button>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Impressions", value: stats?.impressions || "0", trend: stats?.trends.impressions || "0%", icon: <Users className="text-primary" /> },
              { label: "Optimized Rate", value: stats?.optimizedRate || "0%", trend: stats?.trends.optimizedRate || "0%", icon: <ShieldAlert className="text-accent" /> },
              { label: "Total Clicks", value: stats?.clicks || "0", trend: stats?.trends.clicks || "0%", icon: <MousePointer2 className="text-primary" /> },
              { label: "Est. Revenue", value: stats?.revenue || "$0.00", trend: stats?.trends.revenue || "0%", icon: <TrendingUp className="text-green-500" /> },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-secondary rounded-xl">{stat.icon}</div>
                    <span className={`text-xs font-bold flex items-center gap-1 ${stat.trend.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                      {stat.trend} {stat.trend.startsWith('-') ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
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
              <CardHeader><CardTitle>Daily Traffic Performance</CardTitle></CardHeader>
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

            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Browser Targeting</CardTitle></CardHeader>
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
        </div>
      </div>
    </div>
  );
}
