import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Analyze from "@/components/landing/Analyze";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Audience from "@/components/landing/Audience";
import Impact from "@/components/landing/Impact";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Analyze />
      <Features />
      <HowItWorks />
      <Audience />
      <Impact />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
