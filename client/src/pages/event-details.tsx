import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  Share2, 
  ArrowLeft,
  Users,
  Minus,
  Plus,
  CreditCard,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Event, TicketTier } from "@shared/schema";

interface EventWithDetails extends Event {
  ticketTiers: TicketTier[];
  organizationName: string;
}

interface CartItem {
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

function TicketTierCard({ 
  tier, 
  cart, 
  onUpdateCart,
  disabled = false,
}: { 
  tier: TicketTier;
  cart: Map<string, CartItem>;
  onUpdateCart: (tierId: string, quantity: number) => void;
  disabled?: boolean;
}) {
  const available = tier.quantity - tier.soldCount;
  const cartItem = cart.get(tier.id);
  const quantity = cartItem?.quantity || 0;
  const maxPerOrder = tier.maxPerOrder || 10;
  const canAdd = quantity < Math.min(available, maxPerOrder);
  
  const isSoldOut = available === 0;
  const price = parseFloat(tier.price);

  return (
    <Card className={`${isSoldOut ? 'opacity-60' : ''}`} data-testid={`tier-card-${tier.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{tier.name}</h4>
              {isSoldOut && (
                <Badge variant="destructive">Sold Out</Badge>
              )}
            </div>
            {tier.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {tier.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{available} of {tier.quantity} available</span>
              {tier.maxPerOrder && (
                <span>Max {tier.maxPerOrder} per order</span>
              )}
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <div className="text-xl font-bold mb-2">
              {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
            </div>
            
            {!isSoldOut && !disabled && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateCart(tier.id, quantity - 1)}
                  disabled={quantity === 0}
                  data-testid={`button-decrease-${tier.id}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateCart(tier.id, quantity + 1)}
                  disabled={!canAdd}
                  data-testid={`button-increase-${tier.id}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", id],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { eventId: string; items: CartItem[] }) => {
      return await apiRequest("POST", "/api/payments/create-order", orderData);
    },
    onSuccess: (data) => {
      toast({
        title: "Order created",
        description: "Redirecting to payment...",
      });
      // In production, this would integrate with Razorpay checkout
      navigate(`/checkout/${data.orderId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCart = (tierId: string, quantity: number) => {
    const tier = event?.ticketTiers.find(t => t.id === tierId);
    if (!tier) return;

    const newCart = new Map(cart);
    if (quantity <= 0) {
      newCart.delete(tierId);
    } else {
      newCart.set(tierId, {
        tierId,
        tierName: tier.name,
        price: parseFloat(tier.price),
        quantity,
      });
    }
    setCart(newCart);
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to purchase tickets.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }

    const items = Array.from(cart.values());
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please select at least one ticket.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      eventId: id!,
      items,
    });
  };

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalTickets = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="aspect-[21/9] w-full rounded-lg" />
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Event not found</h1>
        <p className="text-muted-foreground mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  const eventDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isPast = eventDate < new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2" data-testid="button-back">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
      </Button>

      {/* Hero Image */}
      <div className="aspect-[21/9] relative rounded-lg overflow-hidden bg-muted">
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Calendar className="h-20 w-20 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
              {event.status}
            </Badge>
            {isPast && (
              <Badge variant="outline" className="bg-background/80">Past Event</Badge>
            )}
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2" data-testid="text-event-title">
            {event.name}
          </h1>
          <p className="text-white/80">
            Organized by {event.organizationName}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Event Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Info Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium truncate">
                    {eventDate.toLocaleDateString('en-IN', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium truncate">
                    {eventDate.toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium truncate">{event.venue}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              {event.description ? (
                <p className="whitespace-pre-wrap">{event.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Venue Details */}
          {event.venueAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Venue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{event.venue}</p>
                    <p className="text-muted-foreground">{event.venueAddress}</p>
                    {event.city && (
                      <p className="text-muted-foreground">{event.city}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ticket Selection Sidebar */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Select Tickets
                </CardTitle>
                <CardDescription>
                  Choose your ticket tier and quantity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticketTiers.length > 0 ? (
                  event.ticketTiers.map((tier) => (
                    <TicketTierCard
                      key={tier.id}
                      tier={tier}
                      cart={cart}
                      onUpdateCart={handleUpdateCart}
                      disabled={isPast || event.status !== 'published'}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No tickets available for this event.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cart Summary */}
            {totalTickets > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from(cart.values()).map((item) => (
                    <div key={item.tierId} className="flex justify-between text-sm">
                      <span>
                        {item.tierName} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total ({totalTickets} tickets)</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleProceedToPayment}
                    disabled={createOrderMutation.isPending || isPast || event.status !== 'published'}
                    data-testid="button-proceed-payment"
                  >
                    {createOrderMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Share Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                navigator.share?.({
                  title: event.name,
                  text: event.shortDescription || `Check out ${event.name}`,
                  url: window.location.href,
                }).catch(() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "Link copied",
                    description: "Event link copied to clipboard",
                  });
                });
              }}
              data-testid="button-share"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
