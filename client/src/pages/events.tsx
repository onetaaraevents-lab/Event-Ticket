import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import type { Event, TicketTier } from "@shared/schema";

interface EventWithDetails extends Event {
  ticketTiers: TicketTier[];
  ticketsSold: number;
  lowestPrice: number;
}

function EventCard({ event }: { event: EventWithDetails }) {
  const eventDate = new Date(event.startDate);
  const isPast = eventDate < new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();
  
  const statusVariant = {
    published: "default",
    draft: "secondary",
    cancelled: "destructive",
    completed: "outline",
  } as const;

  const availableTickets = event.ticketTiers.reduce((sum, tier) => 
    sum + (tier.quantity - tier.soldCount), 0
  );

  return (
    <Card className="overflow-hidden hover-elevate group" data-testid={`event-card-${event.id}`}>
      <div className="aspect-[16/9] relative bg-muted">
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusVariant[event.status]}>
            {event.status}
          </Badge>
          {isToday && (
            <Badge className="bg-success text-success-foreground">Today</Badge>
          )}
          {isPast && event.status !== 'completed' && (
            <Badge variant="outline" className="bg-background/80">Past</Badge>
          )}
        </div>
        {event.lowestPrice > 0 && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-background/90 text-foreground font-semibold">
              From ₹{event.lowestPrice.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {event.name}
          </h3>
          {event.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {event.shortDescription}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {eventDate.toLocaleDateString('en-IN', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {eventDate.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Ticket className="h-3.5 w-3.5" />
              {event.ticketsSold} sold
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {availableTickets} left
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/events/${event.id}`}>
              View
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/9]" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex justify-between pt-2 border-t">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Events() {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'admin' || user?.role === 'organiser';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const { data: events, isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/events", { status: statusFilter, sort: sortBy }],
  });

  const filteredEvents = events?.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" data-testid="text-events-title">
            Events
          </h1>
          <p className="text-muted-foreground">
            {isOrganizer ? "Manage your events or browse all available events." : "Browse and discover upcoming events."}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-events"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Nearest)</SelectItem>
              <SelectItem value="date-desc">Date (Farthest)</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery 
              ? "Try adjusting your search or filter criteria."
              : isOrganizer 
                ? "Create your first event to start selling tickets."
                : "Check back later for upcoming events."
            }
          </p>
          {isOrganizer && !searchQuery && (
            <Button asChild>
              <Link href="/events/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Event
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
