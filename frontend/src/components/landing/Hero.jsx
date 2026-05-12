import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Bell, CheckCircle2, FileText, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, black, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1.5 text-xs text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />
          New · Real-time analytics & smart approvals
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.02]"
        >
          Smart College Management,
          <br />
          <span className="font-display text-gradient">Simplified.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          Manage complaints, leaves, announcements, and communication across students, mentors,
          and administrators in one unified, beautifully designed platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/register" className="group inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all hover:scale-[1.02] shadow-elegant">
            Get Started
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-border glass hover:bg-muted/40 font-medium transition-colors"
          >
            <Sparkles className="size-4" />
            Explore Features
          </a>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20 mx-auto max-w-5xl"
        >
          <div className="absolute -inset-x-12 -top-10 -bottom-10 bg-gradient-primary opacity-20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative rounded-2xl glass-strong shadow-elegant overflow-hidden">
            {/* window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-chart-4/70" />
              <span className="size-2.5 rounded-full bg-chart-2/70" />
              <div className="ml-4 h-6 flex-1 max-w-md rounded-md bg-muted/40 px-3 grid place-items-center text-[10px] text-muted-foreground">
                app.unisphere.io / dashboard
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
              {/* Sidebar */}
              <div className="hidden md:flex col-span-2 flex-col gap-1.5">
                {["Overview", "Complaints", "Leaves", "Announcements", "Groups", "Analytics"].map((s, i) => (
                  <div
                    key={s}
                    className={`px-3 py-2 rounded-lg text-xs ${
                      i === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="col-span-12 md:col-span-10 grid grid-cols-6 gap-3">
                {/* Stats */}
                {[
                  { label: "Active Complaints", value: "128", trend: "+12%", icon: FileText },
                  { label: "Pending Leaves", value: "34", trend: "-8%", icon: CheckCircle2 },
                  { label: "Announcements", value: "9", trend: "+3", icon: Bell },
                ].map((s) => (
                  <div key={s.label} className="col-span-6 sm:col-span-2 rounded-xl border border-border/60 bg-surface/60 p-4">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <s.icon className="size-4" />
                      <span className="text-[10px] text-primary">{s.trend}</span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}

                {/* Chart */}
                <div className="col-span-6 sm:col-span-4 rounded-xl border border-border/60 bg-surface/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">Resolution Trends</div>
                    <TrendingUp className="size-4 text-primary" />
                  </div>
                  <svg viewBox="0 0 300 100" className="mt-3 w-full h-24">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 C30,70 50,40 80,45 C110,50 130,20 160,30 C190,40 210,15 240,25 C270,35 285,20 300,28 L300,100 L0,100 Z"
                      fill="url(#g)"
                    />
                    <path
                      d="M0,80 C30,70 50,40 80,45 C110,50 130,20 160,30 C190,40 210,15 240,25 C270,35 285,20 300,28"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {/* Recent */}
                <div className="col-span-6 sm:col-span-2 rounded-xl border border-border/60 bg-surface/60 p-4">
                  <div className="text-xs font-medium mb-3">Recent Activity</div>
                  {[
                    { t: "Leave approved", a: "Mentor R." },
                    { t: "New complaint", a: "Hostel Block A" },
                    { t: "Announcement", a: "Dean's office" },
                  ].map((r) => (
                    <div key={r.t} className="flex items-center gap-2 py-1.5">
                      <div className="size-6 rounded-full bg-gradient-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] truncate">{r.t}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{r.a}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="col-span-6 sm:col-span-4 rounded-xl border border-border/60 bg-surface/60 p-4">
                  <div className="text-xs font-medium mb-3">Leave Approvals</div>
                  {[
                    { n: "Aarav S.", r: "Medical leave", s: "Approved" },
                    { n: "Priya M.", r: "Family event", s: "Pending" },
                    { n: "Kabir N.", r: "Conference", s: "Approved" },
                  ].map((r) => (
                    <div key={r.n} className="flex items-center justify-between py-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-muted grid place-items-center">
                          <Users className="size-3 text-muted-foreground" />
                        </div>
                        <div>
                          <div>{r.n}</div>
                          <div className="text-[10px] text-muted-foreground">{r.r}</div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          r.s === "Approved" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:flex absolute -left-10 top-32 glass-strong rounded-xl p-3 shadow-elegant items-center gap-3 w-56"
          >
            <div className="size-9 rounded-lg bg-primary/15 grid place-items-center">
              <Bell className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-medium">New announcement</div>
              <div className="text-[10px] text-muted-foreground">From Principal · 2m ago</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:flex absolute -right-8 bottom-20 glass-strong rounded-xl p-3 shadow-elegant items-center gap-3 w-60"
          >
            <div className="size-9 rounded-lg bg-chart-2/20 grid place-items-center">
              <CheckCircle2 className="size-4 text-chart-2" />
            </div>
            <div>
              <div className="text-xs font-medium">Complaint #2014 resolved</div>
              <div className="text-[10px] text-muted-foreground">Avg time 2h 14m</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
