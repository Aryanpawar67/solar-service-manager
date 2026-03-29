import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Services() {
  return (
    <div className="pt-24 pb-20">
      <section className="bg-secondary text-white py-20 mb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-display font-bold mb-6"
          >
            Our Services
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            Comprehensive maintenance solutions designed to maximize the lifespan and output of your solar investment.
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* Service 1 */}
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 space-y-6"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide uppercase">Core Service</div>
            <h2 className="text-4xl font-display font-bold text-secondary">Deep Cleaning Service</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Dust, pollution, and bird droppings form a film over your panels that blocks sunlight. Our specialized deep cleaning process uses pure RO water to safely remove all debris without scratching the glass.
            </p>
            <ul className="space-y-3">
              {['100% RO Purified Water', 'Non-abrasive soft brushes', 'Spotless finish guaranteed', 'Up to 25% efficiency increase'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium text-secondary">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link href="/book">
                <Button className="rounded-xl" size="lg">Book Cleaning</Button>
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img src={`${import.meta.env.BASE_URL}images/cleaning-service.png`} alt="Solar Panel Cleaning" className="w-full h-auto object-cover aspect-[4/3] hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>
        </div>

        {/* Service 2 */}
        <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 space-y-6"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide uppercase">Maintenance</div>
            <h2 className="text-4xl font-display font-bold text-secondary">Inspection & Diagnostics</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Prevention is better than cure. Our technical team performs comprehensive health checks on your entire solar infrastructure to catch issues before they affect your power yield.
            </p>
            <ul className="space-y-3">
              {['Inverter health check', 'Wiring and connection inspection', 'Thermal imaging for hotspots', 'Detailed performance report'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-primary/20 p-1 rounded-full"><Check className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium text-secondary">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link href="/contact">
                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/5" size="lg">Request Inspection</Button>
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img src={`${import.meta.env.BASE_URL}images/maintenance-service.png`} alt="Solar Panel Inspection" className="w-full h-auto object-cover aspect-[4/3] hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
