import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle2, XCircle, RefreshCw, MessageSquare, CalendarCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListNotifications,
  useCheckSubscriptionExpiry,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  service_scheduled: { label: "Scheduled",  icon: CalendarCheck,  color: "bg-blue-100 text-blue-800 border-blue-200" },
  service_completed: { label: "Completed",  icon: CheckCircle2,   color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  subscription_expiry: { label: "Expiry",   icon: AlertTriangle,  color: "bg-amber-100 text-amber-800 border-amber-200" },
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useListNotifications({
    type: typeFilter as Notification["type"] | undefined || undefined,
    status: (statusFilter as "sent" | "failed") || undefined,
  });

  const expiryCheck = useCheckSubscriptionExpiry();

  const handleExpiryCheck = () => {
    expiryCheck.mutate(undefined, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({
          title: "Expiry check complete",
          description: result.message,
        });
      },
      onError: () => toast({ title: "Check failed", variant: "destructive" }),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Notifications</h2>
          <p className="text-muted-foreground mt-1">SMS alerts sent to customers for service events.</p>
        </div>
        <Button
          onClick={handleExpiryCheck}
          disabled={expiryCheck.isPending}
          variant="outline"
          className="rounded-xl gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${expiryCheck.isPending ? "animate-spin" : ""}`} />
          {expiryCheck.isPending ? "Checking..." : "Run Expiry Check"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="service_scheduled">Service Scheduled</SelectItem>
            <SelectItem value="service_completed">Service Completed</SelectItem>
            <SelectItem value="subscription_expiry">Subscription Expiry</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-xl">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center">Loading...</TableCell></TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Bell className="h-8 w-8 opacity-30" />
                      <span>No notifications yet. They'll appear here as customers are notified.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((n) => {
                  const cfg = TYPE_CONFIG[n.type];
                  const Icon = cfg?.icon ?? MessageSquare;
                  return (
                    <TableRow key={n.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 ${cfg?.color ?? ""}`}>
                          <Icon className="h-3 w-3" />
                          {cfg?.label ?? n.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{n.recipientName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{n.recipientPhone}</div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground/80 max-w-xs truncate" title={n.message}>
                          {n.message}
                        </p>
                        {n.error && (
                          <p className="text-xs text-destructive mt-0.5">{n.error}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {n.status === "sent" ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Sent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-destructive text-sm font-medium">
                            <XCircle className="h-4 w-4" /> Failed
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {n.provider ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(n.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {data && data.total > data.limit && (
          <div className="p-4 border-t border-border/50 text-sm text-muted-foreground text-center">
            Showing {data.data.length} of {data.total} notifications
          </div>
        )}
      </Card>
    </motion.div>
  );
}
