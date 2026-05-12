import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer id="footer" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">
                Uni<span className="font-display">Sphere</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Smart college management, simplified. One unified platform for students, mentors, and admins.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary animate-pulse-glow" />
              All systems operational
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#showcase" className="hover:text-foreground">Dashboard</a></li>
              <li><a href="#about" className="hover:text-foreground">About</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="mailto:hello@unisphere.io" className="hover:text-foreground">hello@unisphere.io</a></li>
              <li><a href="#" className="hover:text-foreground">Support</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
            </ul>
                      </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} UniSphere. All rights reserved.</div>
          <div>Crafted for modern campuses.</div>
        </div>
      </div>
    </footer>
  );
}
