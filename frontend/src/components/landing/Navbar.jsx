import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import logo from "../../assets/logo-removebg-preview.png";

const links = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Dashboard", href: "#showcase" },
  { label: "Contact", href: "#footer" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { dark, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`flex items-center justify-between rounded-2xl px-5 sm:px-6 py-2.5 transition-all duration-500 gap-4 ${
            scrolled ? "glass-strong shadow-card" : "bg-transparent"
          }`}
        >
          {/* Logo / Branding */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img
              src={logo}
              alt="UniSphere"
              className="h-8 w-auto object-contain"
            />
            <span className="text-base font-semibold tracking-tight text-on-surface">
              Uni<span className="font-display">Sphere</span>
            </span>
          </Link>

          {/* Center - Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface rounded-lg transition-all duration-200 hover:bg-surface-container-low"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right - Actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg hover:bg-surface-container-low transition-all duration-200 text-on-surface-variant hover:text-on-surface"
            >
              {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Login */}
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center h-9 px-4 text-sm font-medium rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all duration-200"
            >
              Login
            </Link>

            {/* Get Started */}
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center h-9 px-4 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
            >
              Get Started
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-surface-container-low transition-all duration-200 text-on-surface-variant hover:text-on-surface"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm z-50 glass-strong p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-base font-semibold text-on-surface">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 rounded-lg hover:bg-surface-container-low text-on-surface text-sm font-medium"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="h-px bg-outline-variant my-3" />
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full h-11 rounded-lg border border-outline text-sm font-medium text-center leading-[44px] text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="w-full h-11 rounded-lg bg-primary text-white text-sm font-medium mt-2 text-center leading-[44px] hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}