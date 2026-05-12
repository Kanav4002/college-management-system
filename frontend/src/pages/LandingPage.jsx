import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { Roles } from "../components/landing/Roles";
import { About } from "../components/landing/About";
import { Showcase } from "../components/landing/Showcase";
import { Testimonials } from "../components/landing/Testimonials";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Roles />
        <About />
        <Showcase />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}