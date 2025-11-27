import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Ticket, 
  QrCode, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Shield,
  Check,
  ArrowRight,
  Zap,
  Globe,
  CreditCard
} from "lucide-react";

const features = [
  {
    icon: Ticket,
    title: "Instant Ticketing",
    description: "Create events and start selling tickets in minutes. Multiple pricing tiers, early-bird options, and capacity management.",
  },
  {
    icon: QrCode,
    title: "QR Code Scanning",
    description: "Fast, reliable entry scanning with real-time validation. Works offline and syncs when connected.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Notifications",
    description: "Send ticket confirmations, event reminders, and updates directly to attendees via WhatsApp.",
  },
  {
    icon: Users,
    title: "Multi-Organization",
    description: "Manage multiple organizations with separate teams, events, and analytics. Role-based access control.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track ticket sales, revenue, and attendance in real-time. Export reports and gain insights.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Powered by Razorpay for secure payment processing. PCI-DSS compliant with fraud protection.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for small events and getting started",
    features: [
      "Up to 100 tickets per event",
      "Basic QR scanning",
      "Email notifications",
      "1 organization",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "2,999",
    description: "For growing event organizers",
    features: [
      "Unlimited tickets",
      "Advanced QR scanning",
      "WhatsApp notifications",
      "5 organizations",
      "Priority support",
      "Custom branding",
      "Analytics dashboard",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale event operations",
    features: [
      "Everything in Pro",
      "Unlimited organizations",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "White-label option",
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Ticket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">EventPass</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">
              Pricing
            </a>
          </nav>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/api/login">Log In</a>
            </Button>
            <Button asChild data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6" data-testid="badge-hero">
              <Zap className="mr-1 h-3 w-3" />
              Trusted by 10,000+ events
            </Badge>
            
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6" data-testid="text-hero-title">
              Sell Tickets.{" "}
              <span className="text-primary">Scan Entries.</span>{" "}
              Grow Events.
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8" data-testid="text-hero-description">
              The complete event ticketing platform. Create events, sell tickets with Razorpay, 
              scan entries with QR codes, and engage attendees with WhatsApp notifications.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild data-testid="button-start-free">
                <a href="/api/login">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-view-pricing">
                <a href="#pricing">View Pricing</a>
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold mb-4" data-testid="text-features-title">
              Everything you need to run successful events
            </h2>
            <p className="text-muted-foreground">
              From ticketing to entry management, we've got you covered with powerful tools designed for event professionals.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate border-card-border" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold mb-4" data-testid="text-how-it-works-title">
              Get started in 3 simple steps
            </h2>
            <p className="text-muted-foreground">
              Launch your event in minutes, not days. Our streamlined process makes it easy.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Create Your Event</h3>
              <p className="text-muted-foreground">
                Set up your event with details, venue, dates, and ticket tiers. Add images and descriptions.
              </p>
            </div>
            
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Sell Tickets</h3>
              <p className="text-muted-foreground">
                Share your event link. Accept payments via Razorpay. Tickets are delivered instantly with QR codes.
              </p>
            </div>
            
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Scan & Manage</h3>
              <p className="text-muted-foreground">
                Use the scanner app for quick entry. Track attendance in real-time. Access detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold mb-4" data-testid="text-pricing-title">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : 'border-card-border'}`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    {plan.price === "Custom" ? (
                      <span className="text-4xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="text-lg">₹</span>
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                  
                  <ul className="mb-6 space-y-3 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                    data-testid={`button-pricing-${plan.name.toLowerCase()}`}
                  >
                    <a href="/api/login">{plan.cta}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">10,000+ Events Hosted</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              <span className="text-sm font-medium">1M+ Tickets Sold</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">₹50Cr+ Processed</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">PCI-DSS Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <Ticket className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-bold">EventPass</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete event ticketing platform for modern organizers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} EventPass. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
