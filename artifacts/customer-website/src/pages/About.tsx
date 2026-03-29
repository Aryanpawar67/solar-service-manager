import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Target, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function About() {
  return (
    <div className="pt-24 pb-20 bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-secondary leading-tight">
              Empowering India's <span className="text-primary">Solar Future</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Founded in 2021, GreenVolt started with a simple mission: to ensure that the transition to renewable energy isn't hampered by poor maintenance. We saw thousands of expensive solar arrays losing efficiency simply because they were dirty.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Today, we are India's leading specialized solar maintenance provider, bringing professional, eco-friendly cleaning and diagnostic services to residential and commercial properties.
            </p>
            <div className="pt-6">
              <Link href="/contact">
                <Button size="lg" className="rounded-xl shadow-lg gap-2">
                  Get in Touch <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 w-full"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[16/10]">
              <img 
                src={`${import.meta.env.BASE_URL}images/about-team.png`} 
                alt="GreenVolt Team" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <p className="text-white font-bold text-xl">The GreenVolt Team</p>
                <p className="text-white/80 text-sm">Committed to excellence</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">Our Core Values</h2>
            <p className="text-secondary-foreground/80 text-lg">The principles that guide our work every day.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8 text-primary" />,
                title: "Efficiency First",
                desc: "Every action we take is aimed at maximizing the power output of your solar investment."
              },
              {
                icon: <Award className="w-8 h-8 text-primary" />,
                title: "Quality & Safety",
                desc: "We never cut corners. We use pure RO water, specialized tools, and rigorous safety protocols."
              },
              {
                icon: <Users className="w-8 h-8 text-primary" />,
                title: "Customer Trust",
                desc: "Transparent pricing, reliable scheduling, and dedicated support you can always count on."
              }
            ].map((val, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-white"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  {val.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{val.title}</h3>
                <p className="text-white/70 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
