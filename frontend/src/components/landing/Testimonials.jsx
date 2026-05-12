import { motion } from "framer-motion";

const items = [
  {
    q: "UniSphere replaced four different tools we used to juggle. Complaint resolution times dropped overnight.",
    n: "Dr. Anjali Rao",
    r: "Dean of Student Affairs",
  },
  {
    q: "I love how easy it is to apply for leaves and track everything from my phone. The notifications are perfect.",
    n: "Aarav Sharma",
    r: "B.Tech, Final Year",
  },
  {
    q: "As a mentor I can finally see what my students need without drowning in WhatsApp groups and emails.",
    n: "Prof. Rohan Kumar",
    r: "Faculty Mentor",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">Loved by campuses</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight">
            Voices from the <span className="font-display">community.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <motion.figure
              key={t.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-3xl border border-border bg-surface/40 p-7 hover:bg-surface transition-colors"
            >
              <div className="text-3xl font-display text-primary leading-none">"</div>
              <blockquote className="mt-2 text-sm leading-relaxed">{t.q}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="size-9 rounded-full bg-gradient-primary" />
                <div>
                  <div className="text-sm font-medium">{t.n}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
