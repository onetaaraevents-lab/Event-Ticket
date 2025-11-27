import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  QrCode,
  Download,
  Share2,
  Clock,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Ticket as TicketType, TicketTier, Event } from "@shared/schema";

interface TicketWithDetails extends TicketType {
  ticketTier: TicketTier & { event: Event };
}

function getStatusConfig(status: string) {
  const configs: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    confirmed: { color: "bg-status-confirmed text-white", icon: Check, label: "Confirmed" },
    pending: { color: "bg-status-pending text-black", icon: Clock, label: "Pending" },
    scanned: { color: "bg-status-scanned text-white", icon: QrCode, label: "Scanned" },
    cancelled: { color: "bg-status-cancelled text-white", icon: X, label: "Cancelled" },
    refunded: { color: "bg-muted text-muted-foreground", icon: AlertCircle, label: "Refunded" },
  };
  return configs[status] || configs.pending;
}

function TicketCard({ ticket }: { ticket: TicketWithDetails }) {
  const { toast } = useToast();
  const event = ticket.ticketTier.event;
  const eventDate = new Date(event.startDate);
  const isPast = eventDate < new Date();
  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;

  const handleShare = () => {
    navigator.share?.({
      title: `My Ticket for ${event.name}`,
      text: `Ticket Code: ${ticket.ticketCode}`,
      url: window.location.href,
    }).catch(() => {
      navigator.clipboard.writeText(ticket.ticketCode);
      toast({
        title: "Copied",
        description: "Ticket code copied to clipboard",
      });
    });
  };

  return (
    <Card className="overflow-hidden" data-testid={`ticket-card-${ticket.id}`}>
      <div className="flex flex-col sm:flex-row">
        {/* Event Image */}
        <div className="sm:w-48 aspect-video sm:aspect-square relative bg-muted shrink-0">
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
          <div className="absolute top-2 left-2">
            <Badge className={statusConfig.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Ticket Details */}
        <CardContent className="flex-1 p-4">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.ticketTier.name}</p>
                </div>
                {isPast && ticket.status !== 'scanned' && (
                  <Badge variant="outline">Past Event</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {eventDate.toLocaleDateString('en-IN', { 
                      weekday: 'long',
                      month: 'long', 
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

              <div className="flex items-center gap-2 p-2 rounded bg-muted mb-4">
                <QrCode className="h-4 w-4 text-muted-foreground shrink-0" />
                <code className="text-sm font-mono flex-1 truncate">{ticket.ticketCode}</code>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex-1" data-testid={`button-view-qr-${ticket.id}`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    View QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Your Ticket</DialogTitle>
                    <DialogDescription>
                      Show this QR code at the venue entrance
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-6">
                    {/* QR Code placeholder - in production this would render actual QR */}
                    <div className="w-64 h-64 bg-white p-4 rounded-lg border-2 border-dashed flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="h-32 w-32 mx-auto mb-2 text-foreground" />
                        <p className="font-mono text-sm font-bold">{ticket.ticketCode}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      {event.name}<br />
                      {ticket.ticketTier.name}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="icon" onClick={handleShare} data-testid={`button-share-${ticket.id}`}>
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon" data-testid={`button-download-${ticket.id}`}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function TicketCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="sm:w-48 aspect-video sm:aspect-square" />
        <CardContent className="flex-1 p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function Tickets() {
  const { data: tickets, isLoading } = useQuery<TicketWithDetails[]>({
    queryKey: ["/api/tickets"],
  });

  const upcomingTickets = tickets?.filter(t => {
    const eventDate = new Date(t.ticketTier.event.startDate);
    return eventDate >= new Date() && t.status !== 'cancelled' && t.status !== 'refunded';
  }) || [];

  const pastTickets = tickets?.filter(t => {
    const eventDate = new Date(t.ticketTier.event.startDate);
    return eventDate < new Date() || t.status === 'cancelled' || t.status === 'refunded';
  }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold" data-testid="text-tickets-title">
          My Tickets
        </h1>
        <p className="text-muted-foreground">
          View and manage your event tickets
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">
            Past ({pastTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <TicketCardSkeleton key={i} />
            ))
          ) : upcomingTickets.length > 0 ? (
            upcomingTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">No upcoming tickets</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Browse events and get your tickets for upcoming experiences.
                </p>
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <TicketCardSkeleton key={i} />
            ))
          ) : pastTickets.length > 0 ? (
            pastTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">No past tickets</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your ticket history will appear here after you attend events.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
