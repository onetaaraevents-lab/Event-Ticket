import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw,
  Keyboard,
  History,
  ChevronUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, EntryScan, Ticket } from "@shared/schema";

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket & {
    eventName: string;
    tierName: string;
    attendeeName?: string;
  };
  scanResult: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_event';
}

interface RecentScan extends EntryScan {
  ticketCode: string;
  attendeeName?: string;
}

export default function Scanner() {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch events for dropdown
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { status: "published" }],
  });

  // Fetch recent scans
  const { data: recentScans } = useQuery<RecentScan[]>({
    queryKey: ["/api/scans/recent", selectedEventId],
    enabled: !!selectedEventId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      return await apiRequest("POST", "/api/scans/verify", {
        ticketCode,
        eventId: selectedEventId,
      });
    },
    onSuccess: (data: ScanResult) => {
      setLastScanResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/scans/recent"] });
      
      if (soundEnabled) {
        // Play success/error sound
        const audio = new Audio(data.success ? '/sounds/success.mp3' : '/sounds/error.mp3');
        audio.play().catch(() => {});
      }

      // Vibrate on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(data.success ? 100 : [100, 50, 100]);
      }

      toast({
        title: data.success ? "Scan Successful" : "Scan Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });

      // Clear result after 3 seconds
      setTimeout(() => setLastScanResult(null), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Scan Error",
        description: error.message || "Failed to verify ticket",
        variant: "destructive",
      });
    },
  });

  // Camera setup
  useEffect(() => {
    if (cameraEnabled && selectedEventId) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [cameraEnabled, selectedEventId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
      setCameraEnabled(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim() && selectedEventId) {
      scanMutation.mutate(manualCode.trim());
      setManualCode("");
    }
  };

  const getScanResultDisplay = () => {
    if (!lastScanResult) return null;

    const configs = {
      success: {
        bg: "bg-success",
        icon: Check,
        title: "Entry Approved",
      },
      already_scanned: {
        bg: "bg-warning",
        icon: AlertTriangle,
        title: "Already Scanned",
      },
      invalid: {
        bg: "bg-destructive",
        icon: X,
        title: "Invalid Ticket",
      },
      expired: {
        bg: "bg-destructive",
        icon: X,
        title: "Ticket Expired",
      },
      wrong_event: {
        bg: "bg-destructive",
        icon: X,
        title: "Wrong Event",
      },
    };

    const config = configs[lastScanResult.scanResult];
    const Icon = config.icon;

    return (
      <div className={`absolute inset-0 ${config.bg} flex items-center justify-center z-20 animate-scale-in`}>
        <div className="text-center text-white">
          <Icon className="h-24 w-24 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
          {lastScanResult.ticket && (
            <p className="text-lg opacity-90">
              {lastScanResult.ticket.attendeeName || lastScanResult.ticket.tierName}
            </p>
          )}
          <p className="mt-2 opacity-75">{lastScanResult.message}</p>
        </div>
      </div>
    );
  };

  if (!selectedEventId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold" data-testid="text-scanner-title">
            Gate Scanner
          </h1>
          <p className="text-muted-foreground">
            Select an event to start scanning tickets
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>
              Choose the event you want to scan tickets for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger data-testid="select-event">
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.filter(e => e.status === 'published').map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {new Date(event.startDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No active events available for scanning.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Scanner Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold truncate" data-testid="text-scanning-event">
              {selectedEvent?.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isScanning ? "Ready to scan" : "Scanner paused"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCameraEnabled(!cameraEnabled)}
              data-testid="button-toggle-camera"
            >
              {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEventId("")}
              data-testid="button-change-event"
            >
              Change Event
            </Button>
          </div>
        </div>
      </div>

      {/* Scanner Viewport */}
      <div className="flex-1 relative bg-black">
        {cameraEnabled ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Scan overlay frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line" />
              </div>
            </div>
            {/* Status text */}
            <div className="absolute top-4 left-0 right-0 text-center">
              <Badge variant="secondary" className="bg-black/50 text-white">
                Position QR code within the frame
              </Badge>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <CameraOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="opacity-75">Camera is disabled</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setCameraEnabled(true)}
              >
                Enable Camera
              </Button>
            </div>
          </div>
        )}

        {/* Scan result overlay */}
        {getScanResultDisplay()}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t bg-background space-y-4">
        {/* Manual entry */}
        <form onSubmit={handleManualScan} className="flex gap-2">
          <div className="flex-1 relative">
            <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter ticket code manually"
              className="pl-10 font-mono uppercase"
              data-testid="input-manual-code"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!manualCode.trim() || scanMutation.isPending}
            data-testid="button-manual-scan"
          >
            {scanMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
        </form>

        {/* Recent scans sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full" data-testid="button-recent-scans">
              <History className="mr-2 h-4 w-4" />
              Recent Scans ({recentScans?.length || 0})
              <ChevronUp className="ml-auto h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Recent Scans</SheetTitle>
              <SheetDescription>
                Last 10 scans for this event
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-2 overflow-y-auto">
              {recentScans && recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div 
                    key={scan.id} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        scan.scanResult === 'success' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {scan.scanResult === 'success' ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm truncate">{scan.ticketCode}</p>
                        <p className="text-xs text-muted-foreground">
                          {scan.attendeeName || "Guest"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground shrink-0">
                      {new Date(scan.scannedAt!).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No scans yet for this event
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
