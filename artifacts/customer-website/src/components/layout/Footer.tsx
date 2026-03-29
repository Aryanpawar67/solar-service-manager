import { Link } from "wouter";
import { Sun, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-20 pb-10 border-t-4 border-primary mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group inline-flex">
              <div className="bg-primary text-white p-2 rounded-xl">
                <Sun className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-white">
                GreenVolt
              </span>
            </Link>
            <p className="text-secondary-foreground/70 leading-relaxed">
              Keeping your solar panels clean, efficient & profitable. Professional maintenance services for residential and commercial solar installations.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-6 text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-secondary-foreground/70 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/services" className="text-secondary-foreground/70 hover:text-primary transition-colors">Our Services</Link></li>
              <li><Link href="/pricing" className="text-secondary-foreground/70 hover:text-primary transition-colors">Subscription Plans</Link></li>
              <li><Link href="/about" className="text-secondary-foreground/70 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-secondary-foreground/70 hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-6 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-secondary-foreground/70">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>123 Green Energy Park<br />Tech City, TC 100201</span>
              </li>
              <li className="flex items-center gap-3 text-secondary-foreground/70">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3 text-secondary-foreground/70">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>hello@greenvolt.example.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-6 text-white">Ready to Boost Yield?</h3>
            <p className="text-secondary-foreground/70 mb-6">
              Dirty panels lose up to 25% of their efficiency. Book a cleaning today.
            </p>
            <Link href="/book">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 group">
                Book a Service
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary-foreground/50 text-sm">
            © {new Date().getFullYear()} GreenVolt Solar Services. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-secondary-foreground/50">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
