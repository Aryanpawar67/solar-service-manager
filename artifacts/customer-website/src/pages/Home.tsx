import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Leaf, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        <div className="absolute inset-0 -z-10">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Solar panels on a roof" 
            className="w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/30" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground border border-primary/30 backdrop-blur-md mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-semibold tracking-wide uppercase">India's #1 Solar Maintenance</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-[1.1]">
                Maximize Your Solar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Investment.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl">
                Dirty panels can lose up to 25% of their efficiency. Professional cleaning and maintenance by GreenVolt keeps your energy production at peak performance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 group">
                    Book a Service
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 rounded-2xl border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                    View Subscription Plans
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/5 p-8 md:p-12 border border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
            {[
              { label: "Happy Customers", value: "5,000+" },
              { label: "Panels Serviced", value: "100k+" },
              { label: "Cities Covered", value: "12+" },
              { label: "Energy Recovered", value: "2.4 MW" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col"
              >
                <span className="text-3xl md:text-4xl font-display font-bold text-secondary mb-2">{stat.value}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-secondary mb-6">Why Choose GreenVolt?</h2>
            <p className="text-lg text-muted-foreground">We don't just clean; we optimize. Our certified technicians ensure your solar array operates at maximum capacity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-primary" />,
                title: "Efficiency Boost",
                desc: "Our specialized RO water cleaning removes all dust, bird droppings, and debris, instantly boosting power output by up to 25%."
              },
              {
                icon: <Shield className="w-8 h-8 text-primary" />,
                title: "Certified Experts",
                desc: "Our technicians are fully trained and insured. We use non-abrasive tools to ensure your panels are never scratched or damaged."
              },
              {
                icon: <Leaf className="w-8 h-8 text-primary" />,
                title: "Eco-Friendly",
                desc: "We use 100% RO purified water with no harsh chemicals, ensuring environmental safety while delivering a spotless finish."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-none shadow-lg shadow-primary/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-secondary mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Ready to supercharge your solar panels?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/book">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 rounded-2xl text-lg font-bold shadow-xl">
                  Book a Cleaning Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
