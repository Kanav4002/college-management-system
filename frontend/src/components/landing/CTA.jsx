import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 sm:p-16 text-center shadow-elegant"
        >
          <div className="absolute inset-0 bg-gradient-mesh opacity-80" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] bg-gradient-primary opacity-30 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 right-0 size-80 bg-primary/30 blur-3xl rounded-full" />

          <div className="relative">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              Ready to <span className="font-display text-gradient">transform</span> your campus?
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-muted-foreground">
              Join the institutions building a better student experience with UniSphere.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="group inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-elegant">
                Get Started
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/login" className="h-12 px-6 rounded-xl border border-border glass hover:bg-muted/40 font-medium transition-colors inline-flex items-center">
                Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}