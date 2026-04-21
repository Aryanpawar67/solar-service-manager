import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomer, useCreateSubscription } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  solarCapacity: z.coerce.number().min(1, "Capacity required (kW)"),
  installationDate: z.string().optional(),
  installationDetails: z.string().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function Book() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "standard" | "premium">("standard");
  const { toast } = useToast();
  
  const createCustomer = useCreateCustomer();
  const createSubscription = useCreateSubscription();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      solarCapacity: 5,
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // 1. Create Customer
      const customer = await createCustomer.mutateAsync({ data });
      
      // 2. Create Subscription
      const amounts = { basic: 999, standard: 1799, premium: 2999 };
      await createSubscription.mutateAsync({
        data: {
          customerId: customer.id,
          plan: selectedPlan,
          amount: amounts[selectedPlan],
          startDate: new Date().toISOString().split('T')[0]
        }
      });

      setStep(3); // Success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isPending = createCustomer.isPending || createSubscription.isPending;

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-display font-bold text-secondary mb-4">Book Your Service</h1>
          <p className="text-muted-foreground">Complete the form below to schedule your professional solar cleaning.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= i ? "bg-primary text-white" : "bg-white border-2 border-border text-muted-foreground"
              }`}>
                {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
              </div>
              {i < 3 && (
                <div className={`w-16 sm:w-32 h-1 mx-2 rounded-full transition-colors ${
                  step > i ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 md:p-10 border border-border/50">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-secondary mb-6">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary">Full Name *</label>
                    <Input {...form.register("name")} placeholder="John Doe" />
                    {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary">Phone Number *</label>
                    <Input {...form.register("phone")} placeholder="+91 98765 43210" />
                    {form.formState.errors.phone && <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-secondary">Service Address *</label>
                    <Textarea {...form.register("address")} placeholder="123 Main St, Appt 4B" className="min-h-[80px]" />
                    {form.formState.errors.address && <p className="text-red-500 text-xs">{form.formState.errors.address.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary">City *</label>
                    <Input {...form.register("city")} placeholder="Mumbai" />
                    {form.formState.errors.city && <p className="text-red-500 text-xs">{form.formState.errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-secondary">Solar Capacity (kW) *</label>
                    <Input type="number" {...form.register("solarCapacity")} placeholder="5" />
                    {form.formState.errors.solarCapacity && <p className="text-red-500 text-xs">{form.formState.errors.solarCapacity.message}</p>}
                  </div>
                </div>
                <div className="mt-10 flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={async () => {
                      const isValid = await form.trigger(['name', 'phone', 'address', 'city', 'solarCapacity']);
                      if (isValid) setStep(2);
                    }}
                  >
                    Continue <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-secondary mb-6">Select a Subscription Plan</h2>
                <div className="space-y-4 mb-10">
                  {[
                    { id: "basic", name: "Basic Plan", desc: "1 Visit / month", price: "₹999" },
                    { id: "standard", name: "Standard Plan", desc: "2 Visits / month (Recommended)", price: "₹1,799" },
                    { id: "premium", name: "Premium Plan", desc: "4 Visits / month", price: "₹2,999" }
                  ].map((plan) => (
                    <Card 
                      key={plan.id} 
                      className={`cursor-pointer transition-all border-2 ${selectedPlan === plan.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"}`}
                      onClick={() => setSelectedPlan(plan.id as any)}
                    >
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-secondary">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">{plan.desc}</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <span className="font-bold text-xl text-primary">{plan.price}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {selectedPlan === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-border">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    size="lg" 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-display font-bold text-secondary mb-4">Booking Confirmed!</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Thank you, {form.getValues("name")}. Your subscription has been created.<br/>
                  Our team will contact you shortly to schedule your first visit.
                </p>
                <Link href="/">
                  <Button size="lg" variant="outline" className="rounded-xl">Return Home</Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
