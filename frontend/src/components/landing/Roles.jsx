import { motion } from "framer-motion";
import { GraduationCap, UserCog, ShieldCheck, Check } from "lucide-react";

const roles = [
  {
    icon: GraduationCap,
    title: "Students",
    sub: "Stay on top of campus life",
    points: ["File and track complaints", "Apply for leaves in seconds", "Get instant announcements", "Join groups and committees"],
  },
  {
    icon: UserCog,
    title: "Mentors",
    sub: "Approve, guide, and monitor",
    points: ["Review pending leaves", "Resolve student complaints", "Broadcast group updates", "Track mentee performance"],
  },
  {
    icon: ShieldCheck,
    title: "Administrators",
    sub: "Run the institution at scale",
    points: ["Institution-wide analytics", "Manage roles and permissions", "Configure SLAs and policies", "Audit logs and reports"],
  },
];

export function Roles() {
  return (
    <section className="relative py-24 sm:py-32 bg-surface/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">Roles</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight">
            One platform, <span className="font-display">three perspectives.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Every user gets a workspace built for the work they actually do.</p>
        </div>

        <div className="mt-16 grid lg:grid-cols-3 gap-5">
          {roles.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative rounded-3xl glass-strong p-8 shadow-card overflow-hidden group"
            >
              <div className="absolute -top-20 -right-20 size-48 bg-gradient-primary opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity" />
              <div className="relative">
                <div className="size-12 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
                  <r.icon className="size-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.sub}</p>
                <ul className="mt-6 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm">
                      <Check className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
