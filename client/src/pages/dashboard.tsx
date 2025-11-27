import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Calendar, 
  Ticket, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Plus,
  Users,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { Event, Ticket as TicketType } from "@shared/schema";

interface DashboardStats {
  totalEvents: number;
  activeTickets: number;
  totalRevenue: number;
  pendingScans: number;
}

interface UpcomingEvent extends Event {
  ticketsSold: number;
  revenue: number;
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  loading = false,
}: { 
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}) {
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
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{description}</p>
              {trend && (
                <Badge 
                  variant="secondary" 
                  className={trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}
                >
                  {trend.positive ? "+" : ""}{trend.value}%
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: UpcomingEvent }) {
  const eventDate = new Date(event.startDate);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
  
  const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : eventDate.toLocaleDateString('en-IN', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <Card className="hover-elevate" data-testid={`event-card-${event.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <span className="text-xs font-medium uppercase">
              {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
            </span>
            <span className="text-lg font-bold leading-none">
              {eventDate.getDate()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{event.name}</h3>
              <Badge variant={event.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
                {event.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {event.venue} • {dateLabel} at {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Ticket className="h-3.5 w-3.5" />
                {event.ticketsSold} sold
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                ₹{event.revenue.toLocaleString()}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/events/${event.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTicketCard({ ticket }: { ticket: TicketType & { eventName: string; eventDate: Date } }) {
  const statusColors: Record<string, string> = {
    confirmed: "bg-status-confirmed text-white",
    pending: "bg-status-pending text-black",
    scanned: "bg-status-scanned text-white",
    cancelled: "bg-status-cancelled text-white",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`ticket-row-${ticket.id}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Ticket className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{ticket.eventName}</p>
          <p className="text-sm text-muted-foreground">
            {ticket.ticketCode}
          </p>
        </div>
      </div>
      <Badge className={statusColors[ticket.status] || "bg-muted"}>
        {ticket.status}
      </Badge>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'admin' || user?.role === 'organiser';

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery<UpcomingEvent[]>({
    queryKey: ["/api/events", "upcoming"],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<(TicketType & { eventName: string; eventDate: Date })[]>({
    queryKey: ["/api/tickets", "recent"],
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" data-testid="text-dashboard-greeting">
            {greeting()}, {user?.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your events today.
          </p>
        </div>
        {isOrganizer && (
          <Button asChild data-testid="button-create-event">
            <Link href="/events/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={stats?.totalEvents ?? 0}
          description="Active events"
          icon={Calendar}
          loading={statsLoading}
        />
        <StatCard
          title="Active Tickets"
          value={stats?.activeTickets ?? 0}
          description="Confirmed tickets"
          icon={Ticket}
          trend={{ value: 12, positive: true }}
          loading={statsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          description="This month"
          icon={TrendingUp}
          trend={{ value: 8, positive: true }}
          loading={statsLoading}
        />
        <StatCard
          title="Pending Scans"
          value={stats?.pendingScans ?? 0}
          description="Awaiting entry"
          icon={Clock}
          loading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upcoming Events */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your next scheduled events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 5).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">No upcoming events</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isOrganizer ? "Create your first event to get started." : "Browse events to find something interesting."}
                </p>
                <Button asChild>
                  <Link href={isOrganizer ? "/events/create" : "/events"}>
                    {isOrganizer ? "Create Event" : "Browse Events"}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Your latest ticket activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tickets">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full mb-3" />
              ))
            ) : recentTickets && recentTickets.length > 0 ? (
              recentTickets.slice(0, 5).map((ticket) => (
                <RecentTicketCard key={ticket.id} ticket={ticket} />
              ))
            ) : (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">No tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse events and get your first ticket.
                </p>
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Gate Keepers */}
      {(user?.role === 'gatekeeper' || user?.role === 'admin' || user?.role === 'organiser') && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for gate management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild data-testid="button-quick-scan">
                <Link href="/scan">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <span>Start Scanning</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild data-testid="button-quick-attendees">
                <Link href="/events">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span>View Attendees</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild data-testid="button-quick-analytics">
                <Link href="/analytics">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <span>View Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild data-testid="button-quick-payments">
                <Link href="/payments">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <span>Payments</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
