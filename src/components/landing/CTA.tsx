import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-28 bg-soft relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
            Your research deserves a{" "}
            <span className="text-gradient italic font-normal">second life</span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Join universities, students, and industry partners building the future
            of research commercialization.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@university.edu"
              className="flex-1 h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-smooth"
            />
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-elegant group h-12 px-6">
              Get early access
              <ArrowRight className="ml-1 h-4 w-4 transition-smooth group-hover:translate-x-1" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-6">
            Free for students · Institutional plans available
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
