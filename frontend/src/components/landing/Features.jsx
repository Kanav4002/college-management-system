import { motion } from "framer-motion";
import { MessageSquareWarning, CalendarCheck, BellRing, Megaphone, LayoutDashboard, ShieldCheck, UsersRound, BarChart3 } from "lucide-react";

const features = [
  { icon: MessageSquareWarning, title: "Complaint Management", desc: "Submit, track, and resolve complaints with full transparency and SLA timers." },
  { icon: CalendarCheck, title: "Leave Management", desc: "End-to-end leave workflows with mentor approvals and instant status updates." },
  { icon: BellRing, title: "Real-time Notifications", desc: "Push, email and in-app alerts so nobody misses what matters." },
  { icon: Megaphone, title: "Announcements", desc: "Broadcast updates to entire institutions, departments, or specific groups." },
  { icon: LayoutDashboard, title: "Role-Based Dashboards", desc: "Tailored experiences for students, mentors and administrators." },
  { icon: ShieldCheck, title: "Secure Authentication", desc: "JWT-based sessions with Google OAuth and granular access control." },
  { icon: UsersRound, title: "Group Management", desc: "Create classes, batches, hostels and committees in just a few clicks." },
  { icon: BarChart3, title: "Analytics & Insights", desc: "Operational metrics and trends to drive better decisions." },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">Features</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight">
            Everything your campus needs.
            <span className="font-display text-muted-foreground"> Nothing it doesn't.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A unified platform engineered for the way modern colleges actually operate.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className="group relative rounded-2xl border border-border bg-surface/40 p-6 hover:bg-surface transition-all hover:-translate-y-1 hover:shadow-card overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.06] transition-opacity" />
              <div className="relative">
                <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
