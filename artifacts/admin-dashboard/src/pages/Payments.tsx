import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, Edit, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { 
  useListPayments, 
  useCreatePayment, 
  useUpdatePayment,
  useListCustomers,
  getListPaymentsQueryKey
} from "@workspace/api-client-react";
import type { Payment } from "@workspace/api-client-react";

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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const paymentSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  status: z.enum(["pending", "success", "failed"]),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data, isLoading } = useListPayments();
  const { data: customers } = useListCustomers({ limit: 100 });
  
  const createMut = useCreatePayment();
  const updateMut = useUpdatePayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { customerId: undefined, amount: 0, status: "success", paymentMethod: "Card", transactionId: "" }
  });

  const openAddDialog = () => {
    setSelectedPayment(null);
    form.reset({ customerId: undefined, amount: 0, status: "success", paymentMethod: "Card", transactionId: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (p: Payment) => {
    setSelectedPayment(p);
    form.reset({
      customerId: p.customerId,
      amount: p.amount,
      status: p.status,
      paymentMethod: p.paymentMethod || "",
      transactionId: p.transactionId || ""
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: PaymentFormValues) => {
    if (selectedPayment) {
      updateMut.mutate({ id: selectedPayment.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Payment updated" });
        }
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Payment recorded" });
        }
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Payments</h2>
          <p className="text-muted-foreground mt-1">Track customer payments and transactions.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Transaction Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center">Loading...</TableCell></TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No payments found.</TableCell></TableRow>
              ) : (
                data?.data?.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{payment.customer?.name || `Customer #${payment.customerId}`}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">₹{payment.amount}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {payment.paymentMethod || "Unknown"} {payment.transactionId ? `· ${payment.transactionId}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        payment.status === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        payment.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }>
                        {payment.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(payment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-xl font-display">{selectedPayment ? "Update Payment" : "Record Payment"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select disabled={!!selectedPayment} onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                    <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {customers?.data?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount (₹) *</FormLabel><FormControl><Input type="number" disabled={!!selectedPayment} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Method</FormLabel><FormControl><Input {...field} placeholder="e.g. Card, UPI" className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="transactionId" render={({ field }) => (
                  <FormItem><FormLabel>Transaction ID</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
