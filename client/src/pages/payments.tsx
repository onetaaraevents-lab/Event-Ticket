import { useQuery } from "@tanstack/react-query";
import { 
  CreditCard, 
  Download, 
  Search,
  Filter,
  Check,
  Clock,
  X,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import type { Payment, Event } from "@shared/schema";

interface PaymentWithDetails extends Payment {
  event: Event;
  buyerEmail: string;
  buyerName: string;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
    completed: { color: "bg-success text-success-foreground", icon: Check },
    pending: { color: "bg-warning text-warning-foreground", icon: Clock },
    failed: { color: "bg-destructive text-destructive-foreground", icon: X },
    refunded: { color: "bg-muted text-muted-foreground", icon: RefreshCw },
  };
  return configs[status] || configs.pending;
}

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: payments, isLoading } = useQuery<PaymentWithDetails[]>({
    queryKey: ["/api/payments", { status: statusFilter }],
  });

  const filteredPayments = payments?.filter(payment => 
    payment.razorpayPaymentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.buyerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.event?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments
    ?.filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  const pendingAmount = payments
    ?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" data-testid="text-payments-title">
            Payments
          </h1>
          <p className="text-muted-foreground">
            View and manage payment transactions
          </p>
        </div>
        <Button variant="outline" data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-success">
                ₹{totalRevenue.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-warning">
                ₹{pendingAmount.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {payments?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, email, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-payments"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const statusConfig = getStatusConfig(payment.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                        <TableCell className="font-mono text-sm">
                          {payment.razorpayPaymentId || payment.razorpayOrderId || payment.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {payment.event?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{payment.buyerName || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground truncate">{payment.buyerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.ticketQuantity}</TableCell>
                        <TableCell className="font-semibold">
                          ₹{parseFloat(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(payment.createdAt!).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-1">No payments found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search criteria."
                  : "Payments will appear here once tickets are purchased."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
