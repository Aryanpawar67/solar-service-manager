import { motion } from "framer-motion";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

const plans = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "₹999",
    period: "per month",
    visits: "1 Visit",
    features: [
      "1 Professional Cleaning Visit",
      "Basic Visual Inspection",
      "Water-only Wash",
      "Standard Support"
    ]
  },
  {
    id: "standard",
    name: "Standard Plan",
    price: "₹1,799",
    period: "per month",
    visits: "2 Visits",
    popular: true,
    features: [
      "2 Professional Cleaning Visits",
      "Detailed Inverter Check",
      "RO Purified Water Wash",
      "Performance Report",
      "Priority Support"
    ]
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: "₹2,999",
    period: "per month",
    visits: "4 Visits",
    features: [
      "4 Professional Cleaning Visits",
      "Comprehensive Diagnostics",
      "RO Purified Water Wash",
      "Thermal Imaging",
      "24/7 Priority Support",
      "Free Minor Repairs"
    ]
  }
];

export function Pricing() {
  return (
    <div className="pt-32 pb-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold text-secondary mb-6"
          >
            Simple, transparent pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground"
          >
            Choose the maintenance plan that fits your solar array's needs. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={plan.popular ? "relative z-10" : "relative"}
            >
              <Card className={`relative h-full flex flex-col transition-all duration-300 ${
                plan.popular 
                  ? "border-primary shadow-2xl shadow-primary/20 scale-105 bg-secondary text-white" 
                  : "border-border/50 hover:shadow-xl bg-white"
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-10">
                  <CardTitle className={`text-xl font-bold mb-2 ${plan.popular ? "text-white" : "text-secondary"}`}>
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-end justify-center gap-1">
                    <span className={`text-5xl font-display font-bold ${plan.popular ? "text-white" : "text-secondary"}`}>
                      {plan.price}
                    </span>
                    <span className={`mb-2 font-medium ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-4 font-semibold ${plan.popular ? "text-primary" : "text-primary"}`}>
                    {plan.visits} / month
                  </p>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 shrink-0 ${plan.popular ? "text-primary" : "text-primary"}`} />
                        <span className={plan.popular ? "text-white/90" : "text-secondary/80"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-8 pb-10">
                  <Link href={`/book?plan=${plan.id}`} className="w-full">
                    <Button 
                      className={`w-full h-12 rounded-xl text-base ${
                        plan.popular 
                          ? "bg-primary hover:bg-primary/90 text-white" 
                          : "bg-secondary text-white hover:bg-secondary/90"
                      }`}
                    >
                      Choose {plan.name}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
