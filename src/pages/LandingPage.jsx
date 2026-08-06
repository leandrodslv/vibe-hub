import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import SocialProof from '../components/landing/SocialProof';
import Programme from '../components/landing/Programme';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';

export default function LandingPage({ onEnterApp, onEnterModules }) {
  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-12');
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div id="top" className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-primary selection:text-on-primary">
      <Navbar onEnterApp={onEnterApp} />
      <Hero onEnterApp={onEnterApp} />
      <SocialProof />
      <Programme onEnterApp={onEnterApp} />
      <FAQ />
      <Footer onEnterApp={onEnterApp} />
    </div>
  );
}
