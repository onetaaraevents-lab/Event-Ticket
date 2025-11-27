import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Ticket, 
  CreditCard, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalTicketsSold: number;
    ticketsChange: number;
    totalEvents: number;
    eventsChange: number;
    totalAttendees: number;
    attendeesChange: number;
  };
  recentSales: Array<{
    id: string;
    eventName: string;
    ticketCount: number;
    amount: number;
    date: string;
  }>;
  topEvents: Array<{
    id: string;
    name: string;
    ticketsSold: number;
    revenue: number;
    capacity: number;
  }>;
  salesByDay: Array<{
    date: string;
    tickets: number;
    revenue: number;
  }>;
}

function StatCard({ 
  title, 
  value, 
  change,
  icon: Icon,
  loading = false,
}: { 
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  const isPositive = change >= 0;

  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState("30d");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", { period }],
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" data-testid="text-analytics-title">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your event performance and revenue
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]" data-testid="select-period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(analytics?.overview.totalRevenue ?? 0).toLocaleString()}`}
          change={analytics?.overview.revenueChange ?? 0}
          icon={CreditCard}
          loading={isLoading}
        />
        <StatCard
          title="Tickets Sold"
          value={analytics?.overview.totalTicketsSold ?? 0}
          change={analytics?.overview.ticketsChange ?? 0}
          icon={Ticket}
          loading={isLoading}
        />
        <StatCard
          title="Active Events"
          value={analytics?.overview.totalEvents ?? 0}
          change={analytics?.overview.eventsChange ?? 0}
          icon={Calendar}
          loading={isLoading}
        />
        <StatCard
          title="Total Attendees"
          value={analytics?.overview.totalAttendees ?? 0}
          change={analytics?.overview.attendeesChange ?? 0}
          icon={Users}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Events</CardTitle>
            <CardDescription>Events with highest ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics?.topEvents && analytics.topEvents.length > 0 ? (
              <div className="space-y-4">
                {analytics.topEvents.map((event, index) => {
                  const fillPercentage = (event.ticketsSold / event.capacity) * 100;
                  return (
                    <div key={event.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{event.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.ticketsSold} / {event.capacity} tickets
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold">₹{event.revenue.toLocaleString()}</p>
                          <Badge variant="secondary" className="text-xs">
                            {fillPercentage.toFixed(0)}% sold
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No event data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest ticket purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : analytics?.recentSales && analytics.recentSales.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sale.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.ticketCount} ticket{sale.ticketCount !== 1 ? 's' : ''} • {new Date(sale.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="font-semibold shrink-0">
                      ₹{sale.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sales data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
          <CardDescription>Daily ticket sales and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : analytics?.salesByDay && analytics.salesByDay.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-1">
              {analytics.salesByDay.slice(-30).map((day, index) => {
                const maxRevenue = Math.max(...analytics.salesByDay.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t group relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ₹${day.revenue.toLocaleString()} (${day.tickets} tickets)`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}<br />
                      ₹{day.revenue.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sales data to display.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
