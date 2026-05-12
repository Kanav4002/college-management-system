import { motion } from "framer-motion";

const stats = [
  { v: "98%", l: "Faster complaint resolution" },
  { v: "3.2x", l: "Improvement in approval times" },
  { v: "120+", l: "Institutions onboarding" },
  { v: "24/7", l: "Always-on infrastructure" },
];

export function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-primary">Why UniSphere</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Built for the way <span className="font-display">modern colleges</span> actually work.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Paper trails, lost emails, scattered WhatsApp groups, untracked complaints — UniSphere
            replaces the chaos with one elegant system that students, mentors, and administrators
            actually enjoy using.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              "Centralized communication",
              "Faster, traceable workflows",
              "Transparent leave approvals",
              "Insightful operational analytics",
            ].map((b) => (
              <div key={b} className="rounded-xl border border-border p-4 bg-surface/40 text-sm">
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-surface/60 p-6 hover:shadow-card transition-shadow"
            >
              <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-gradient">{s.v}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
