
"use client";

import { Navbar } from "@/components/navbar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  ShieldAlert,
  ArrowUpRight,
  Monitor,
  Smartphone,
  Tablet,
  ChevronRight
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
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

const data = [
  { name: "Mon", impressions: 4500, clicks: 320, bypass: 45 },
  { name: "Tue", impressions: 5200, clicks: 480, bypass: 55 },
  { name: "Wed", impressions: 3800, clicks: 290, bypass: 40 },
  { name: "Thu", impressions: 6100, clicks: 540, bypass: 75 },
  { name: "Fri", impressions: 4800, clicks: 410, bypass: 60 },
  { name: "Sat", impressions: 7200, clicks: 680, bypass: 90 },
  { name: "Sun", impressions: 6800, clicks: 610, bypass: 85 },
];

const browserData = [
  { name: "Chrome", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Safari", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Firefox", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Edge", value: 10, color: "hsl(var(--chart-4))" },
  { name: "Others", value: 5, color: "hsl(var(--chart-5))" },
];

const bypassRateData = [
  { name: "Standard Ads", value: 65 },
  { name: "Ceasarion Bypass", value: 98 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Performance Insights</h1>
            <p className="text-muted-foreground">Monitor your real-time traffic monetization metrics.</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <span className="text-sm font-medium">System Live</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Impressions", value: "248.5K", trend: "+12.5%", icon: <Users className="text-primary" /> },
            { label: "Bypass Rate", value: "99.8%", trend: "+5.2%", icon: <ShieldAlert className="text-accent" /> },
            { label: "Total Clicks", value: "14,208", trend: "+18.3%", icon: <MousePointer2 className="text-primary" /> },
            { label: "Net Revenue", value: "$4,129", trend: "+24.1%", icon: <TrendingUp className="text-green-500" /> },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-secondary rounded-lg">
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
          {/* Main Chart */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Daily Impressions & Clicks</CardTitle>
              <CardDescription>Visualizing your traffic growth across the current week.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <Tooltip 
                      content={<ChartTooltipContent />}
                    />
                    <Line type="monotone" dataKey="impressions" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Device / Browser Distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Traffic Origin</CardTitle>
              <CardDescription>Breakdown by browser type.</CardDescription>
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
                
                <div className="space-y-4">
                  {[
                    { label: "Mobile", value: "62%", icon: <Smartphone className="w-4 h-4" /> },
                    { label: "Desktop", value: "31%", icon: <Monitor className="w-4 h-4" /> },
                    { label: "Tablet", value: "7%", icon: <Tablet className="w-4 h-4" /> },
                  ].map((device, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg">
                      <div className="flex items-center gap-3">
                        {device.icon}
                        <span className="text-sm font-medium">{device.label}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{device.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ad Effectiveness Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Top Performing Formats</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Ad Format</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Impressions</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Avg. CPM</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-4 text-xs font-bold text-primary uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { format: "Direct Link (Adblock Bypass)", imp: "82.4K", cpm: "$2.45", rev: "$201.88", status: "High" },
                    { format: "Pop-under", imp: "124.1K", cpm: "$1.85", rev: "$229.58", status: "Medium" },
                    { format: "Native Banner", imp: "32.0K", cpm: "$0.95", rev: "$30.40", status: "Stable" },
                    { format: "Social Bar", imp: "10.0K", cpm: "$3.10", rev: "$31.00", status: "Growing" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-primary">{row.format}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.imp}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.cpm}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">{row.rev}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={`h-2 w-16 rounded-full bg-muted relative overflow-hidden`}>
                             <div className={`absolute left-0 top-0 h-full bg-accent ${i === 0 ? 'w-full' : i === 1 ? 'w-2/3' : 'w-1/3'}`} />
                           </div>
                           <span className="text-[10px] font-bold uppercase text-accent">{row.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-muted/20 text-center">
               <button className="text-sm font-bold text-primary hover:text-accent transition-colors flex items-center justify-center mx-auto gap-1">
                 View All Reports <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
