import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical, Edit, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addMonths } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useListCustomers,
  getListSubscriptionsQueryKey
} from "@workspace/api-client-react";
import type { Subscription } from "@workspace/api-client-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const subscriptionSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  plan: z.enum(["basic", "standard", "premium"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  amount: z.coerce.number().min(1, "Amount is required"),
  status: z.enum(["active", "paused", "cancelled", "expired"]).default("active")
});

type SubFormValues = z.infer<typeof subscriptionSchema>;

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const { data, isLoading, refetch } = useListSubscriptions();
  const { data: customers } = useListCustomers({ limit: 100 });

  const createMut = useCreateSubscription();
  const updateMut = useUpdateSubscription();

  const form = useForm<SubFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { customerId: undefined, plan: "standard", startDate: format(new Date(), "yyyy-MM-dd"), amount: 1799, status: "active" }
  });

  const openAddDialog = () => {
    setSelectedSub(null);
    form.reset({ customerId: undefined, plan: "standard", startDate: format(new Date(), "yyyy-MM-dd"), amount: 1799, status: "active" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (s: Subscription) => {
    setSelectedSub(s);
    form.reset({
      customerId: s.customerId,
      plan: s.plan,
      startDate: format(new Date(s.startDate), "yyyy-MM-dd"),
      endDate: s.endDate ? format(new Date(s.endDate), "yyyy-MM-dd") : undefined,
      amount: s.amount,
      status: s.status
    });
    setIsDialogOpen(true);
  };

  const openRenewDialog = (s: Subscription) => {
    setSelectedSub(s);
    setIsRenewOpen(true);
  };

  const handleRenew = () => {
    if (!selectedSub) return;
    const newStart = format(new Date(), "yyyy-MM-dd");
    const newEnd = format(addMonths(new Date(), 1), "yyyy-MM-dd");
    updateMut.mutate(
      { id: selectedSub.id, data: { status: "active", endDate: newEnd } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          setIsRenewOpen(false);
          toast({ title: "Subscription renewed", description: `Active until ${format(new Date(newEnd), "MMM d, yyyy")}` });
        }
      }
    );
  };

  const onSubmit = (values: SubFormValues) => {
    if (selectedSub) {
      updateMut.mutate({ id: selectedSub.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Subscription updated" });
        }
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Subscription created" });
        }
      });
    }
  };

  const isExpiringSoon = (sub: Subscription & { daysUntilExpiry?: number | null }) =>
    sub.status === "active" && typeof sub.daysUntilExpiry === "number" && sub.daysUntilExpiry <= 30;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Subscriptions</h2>
          <p className="text-muted-foreground mt-1">Manage recurring maintenance plans.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="rounded-xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center">Loading...</TableCell></TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No subscriptions found.</TableCell></TableRow>
              ) : (
                data?.data?.map((sub) => {
                  const expiringSoon = isExpiringSoon(sub as Subscription & { daysUntilExpiry?: number | null });
                  return (
                    <TableRow
                      key={sub.id}
                      className={`hover:bg-muted/30 transition-colors ${expiringSoon ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
                    >
                      <TableCell>
                        <div className="font-medium text-foreground">{sub.customer?.name || `Customer #${sub.customerId}`}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="capitalize font-medium">{sub.plan}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Since {format(new Date(sub.startDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{sub.amount}</TableCell>
                      <TableCell>
                        {sub.endDate ? (
                          <div>
                            <div className="text-sm">{format(new Date(sub.endDate), "MMM d, yyyy")}</div>
                            {expiringSoon && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                {(sub as Subscription & { daysUntilExpiry?: number | null }).daysUntilExpiry} days left
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          sub.status === 'paused' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }>
                          {sub.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openEditDialog(sub)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit Status
                            </DropdownMenuItem>
                            {(sub.status === "active" || sub.status === "expired") && (
                              <DropdownMenuItem onClick={() => openRenewDialog(sub)} className="cursor-pointer text-primary focus:text-primary">
                                <RefreshCw className="mr-2 h-4 w-4" /> Renew
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-xl font-display">{selectedSub ? "Edit Subscription" : "Create Subscription"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select disabled={!!selectedSub} onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                    <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {customers?.data?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="plan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Basic (₹999/mo)</SelectItem>
                        <SelectItem value="standard">Standard (₹1799/mo)</SelectItem>
                        <SelectItem value="premium">Premium (₹2999/mo)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Monthly Amount (₹) *</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start Date *</FormLabel><FormControl><Input type="date" disabled={!!selectedSub} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                {selectedSub && (
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Renew Confirmation Dialog */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-xl font-display">Renew Subscription</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              This will renew the subscription for <strong>{selectedSub?.customer?.name}</strong>, set the status to <strong>Active</strong>, and extend the end date by one month from today.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
              <Button variant="outline" onClick={() => setIsRenewOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleRenew}
                disabled={updateMut.isPending}
                className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {updateMut.isPending ? "Renewing..." : "Confirm Renew"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
