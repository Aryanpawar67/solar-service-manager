import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Mail, Phone, Clock, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListContactSubmissions,
  useConvertContactToCustomer,
  getListContactSubmissionsQueryKey,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import type { Contact } from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const convertSchema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [convertingContact, setConvertingContact] = useState<Contact | null>(null);

  const { data, isLoading } = useListContactSubmissions();
  const convertMut = useConvertContactToCustomer();

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: { address: "", city: "" },
  });

  const openConvertDialog = (msg: Contact) => {
    setConvertingContact(msg);
    form.reset({ address: "", city: "" });
  };

  const onConvert = (values: ConvertFormValues) => {
    if (!convertingContact) return;
    convertMut.mutate(
      { id: convertingContact.id, data: values },
      {
        onSuccess: (customer) => {
          queryClient.invalidateQueries({ queryKey: getListContactSubmissionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setConvertingContact(null);
          toast({ title: "Customer created", description: `${customer.name} has been added to customers.` });
        },
        onError: () => {
          toast({ title: "Failed to create customer", variant: "destructive" });
        },
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Contact Inquiries</h2>
          <p className="text-muted-foreground mt-1">Messages from the public website.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading inquiries...</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-card">No messages found.</div>
        ) : (
          data?.data?.map((msg) => (
            <Card key={msg.id} className="border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row border-b border-border/40 bg-muted/20 p-4 gap-4 sm:items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {msg.name}
                        {!msg.isRead && <Badge className="bg-blue-500 text-white hover:bg-blue-600">New</Badge>}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {msg.email}</span>
                        {msg.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {msg.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => openConvertDialog(msg)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Convert to Customer
                    </Button>
                  </div>
                </div>
                <div className="p-5">
                  {msg.subject && <h4 className="font-medium text-sm mb-2">Subject: {msg.subject}</h4>}
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{msg.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!convertingContact} onOpenChange={(open) => !open && setConvertingContact(null)}>
        {convertingContact && (
          <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden border-border/50">
            <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
              <DialogTitle className="text-xl font-display">Convert to Customer</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-1">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{convertingContact.name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{convertingContact.email}</span></div>
                {convertingContact.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{convertingContact.phone}</span></div>}
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onConvert)} className="space-y-4">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl><Input {...field} placeholder="Customer's installation address" className="rounded-xl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={() => setConvertingContact(null)} className="rounded-xl">Cancel</Button>
                    <Button
                      type="submit"
                      disabled={convertMut.isPending}
                      className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {convertMut.isPending ? "Creating..." : "Create Customer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
