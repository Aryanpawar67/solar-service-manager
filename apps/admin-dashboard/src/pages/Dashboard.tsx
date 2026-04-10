import { motion } from "framer-motion";
import { Users, Sun, Wrench, IndianRupee, MessageSquare, TrendingUp, BadgeCheck } from "lucide-react";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MOCK_CHART_DATA = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 2000 },
  { name: "Apr", revenue: 2780 },
  { name: "May", revenue: 1890 },
  { name: "Jun", revenue: 2390 },
  { name: "Jul", revenue: 3490 },
];

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${analytics.totalRevenue.toLocaleString()}`,
      description: `₹${analytics.monthlyRevenue.toLocaleString()} this month`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-100/50",
    },
    {
      title: "Active Subscriptions",
      value: analytics.activeSubscriptions,
      description: "Across all plans",
      icon: Sun,
      color: "text-amber-600",
      bg: "bg-amber-100/50",
    },
    {
      title: "Pending Services",
      value: analytics.pendingServices,
      description: `${analytics.completedServices} completed total`,
      icon: Wrench,
      color: "text-blue-600",
      bg: "bg-blue-100/50",
    },
    {
      title: "Total Customers",
      value: analytics.totalCustomers,
      description: "Registered clients",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100/50",
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground shadow-lg">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/40" />
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold">Good morning, Admin!</h2>
          <p className="mt-2 text-primary-foreground/80 max-w-xl text-lg">
            Here's what's happening with your solar panel services today. You have {analytics.pendingServices} services pending and {analytics.newContactsUnread} new messages.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-4 flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-muted-foreground" />
              Recent Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics.recentServices?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent services</div>
              ) : (
                analytics.recentServices?.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {service.serviceType || "Maintenance Visit"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(service.scheduledDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      service.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      service.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }>
                      {service.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
