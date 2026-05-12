import { motion } from "framer-motion";
import { Bell, FileText, BarChart3, Smartphone, CheckCircle2, Clock } from "lucide-react";

export function Showcase() {
  return (
    <section id="showcase" className="relative py-24 sm:py-32 bg-surface/40 border-y border-border overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">UI Showcase</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight">
            Designed to feel <span className="font-display">effortless.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Complaint modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-3xl border border-border bg-background p-6 shadow-card"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="size-9 rounded-xl bg-primary/15 grid place-items-center text-primary">
                <FileText className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">New Complaint</div>
                <div className="text-xs text-muted-foreground">Hostel · Block A · Room 214</div>
              </div>
              <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary">In Review</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Subject</label>
                <div className="mt-1 h-10 rounded-lg border border-border bg-surface/60 px-3 grid items-center text-sm">
                  Wifi connectivity issues during evenings
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <div className="mt-1 flex gap-2">
                  {["Infrastructure", "Hostel", "Academics", "Mess"].map((c, i) => (
                    <span
                      key={c}
                      className={`text-xs px-3 py-1.5 rounded-lg border ${
                        i === 1 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <div className="mt-1 h-20 rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
                  Connection drops every few minutes between 7–10 PM. Multiple students reported the same…
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="h-9 px-4 rounded-lg border border-border text-sm">Cancel</button>
                <button className="h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium">
                  Submit
                </button>
              </div>
            </div>
          </motion.div>

          {/* Leave card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-border bg-background p-6 shadow-card flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-chart-2/20 grid place-items-center text-chart-2">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="text-sm font-semibold">Leave Approval</div>
            </div>
            {[
              { n: "Aarav Sharma", r: "Medical · 3 days", s: "approved" },
              { n: "Priya Mehta", r: "Family · 1 day", s: "pending" },
              { n: "Kabir Nair", r: "Conference · 2d", s: "approved" },
            ].map((l) => (
              <div key={l.n} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-gradient-primary" />
                  <div>
                    <div className="text-sm">{l.n}</div>
                    <div className="text-[11px] text-muted-foreground">{l.r}</div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full ${l.s === "approved" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {l.s}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-3xl border border-border bg-background p-6 shadow-card"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="size-9 rounded-xl bg-primary/15 grid place-items-center text-primary">
                <BarChart3 className="size-4" />
              </div>
              <div className="text-sm font-semibold">Weekly Analytics</div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {[40, 65, 50, 80, 70, 95, 60].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-primary" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((d) => <span key={d}>{d}</span>)}
            </div>
          </motion.div>

          {/* Mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl border border-border bg-background p-6 shadow-card flex flex-col items-center text-center"
          >
            <div className="size-9 rounded-xl bg-primary/15 grid place-items-center text-primary mb-3">
              <Smartphone className="size-4" />
            </div>
            <div className="text-sm font-semibold">Built mobile-first</div>
            <p className="text-xs text-muted-foreground mt-1.5">Pixel-perfect on every device.</p>
            <div className="mt-5 w-32 h-56 rounded-3xl border-4 border-foreground/80 bg-surface relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-4 bg-foreground/80 rounded-b-xl" />
              <div className="p-2 pt-6 space-y-1.5">
                <div className="h-3 rounded bg-gradient-primary w-2/3" />
                <div className="h-2 rounded bg-muted" />
                <div className="h-2 rounded bg-muted w-4/5" />
                <div className="h-12 rounded-lg bg-muted/60 mt-2" />
                <div className="h-12 rounded-lg bg-primary/20" />
              </div>
            </div>
          </motion.div>

          {/* Notification center */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="lg:col-span-2 rounded-3xl border border-border bg-background p-6 shadow-card"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="size-9 rounded-xl bg-primary/15 grid place-items-center text-primary">
                <Bell className="size-4" />
              </div>
              <div className="text-sm font-semibold">Notifications</div>
              <span className="ml-auto text-[10px] text-muted-foreground">Today</span>
            </div>
            <div className="space-y-2.5">
              {[
                { i: Bell, t: "Mid-term schedule released", a: "Academic Office", time: "5m" },
                { i: CheckCircle2, t: "Your leave was approved", a: "Mentor R. Kumar", time: "1h" },
                { i: Clock, t: "Complaint #2014 status updated", a: "Hostel Office", time: "3h" },
                { i: FileText, t: "New circular: campus event", a: "Dean of Students", time: "1d" },
              ].map((n, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-surface/60 transition-colors">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <n.i className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{n.t}</div>
                    <div className="text-[11px] text-muted-foreground">{n.a}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
