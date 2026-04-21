import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-spark.jpg";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-soft">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-secondary-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI-powered research commercialization
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight font-semibold mb-6">
            Turning theses into{" "}
            <span className="text-gradient">industry-ready</span>{" "}
            <span className="italic font-normal">innovation</span>{" "}
            through AI
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Scholar Spark helps universities, researchers, and industry partners transform
            postgraduate research into real-world products, startups, and solutions —
            unlocking innovation across Africa and beyond.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-elegant group h-12 px-6" asChild>
              <a href="#join">
                Join the platform
                <ArrowRight className="ml-1 h-4 w-4 transition-smooth group-hover:translate-x-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6 border-border hover:bg-secondary" asChild>
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute -inset-4 bg-spark opacity-20 blur-3xl rounded-full" />
          <div className="relative rounded-2xl overflow-hidden shadow-elegant border border-border/50 bg-primary">
            <img
              src={heroImage}
              alt="AI transforming research into innovation"
              width={1536}
              height={1152}
              className="w-full h-auto"
            />
          </div>

          {/* Floating stat cards */}
          <div className="hidden md:block absolute -left-8 top-1/4 bg-card border border-border rounded-2xl shadow-elegant p-4 animate-float">
            <div className="text-2xl font-display font-semibold text-gradient">10k+</div>
            <div className="text-xs text-muted-foreground mt-1">Theses analyzed</div>
          </div>
          <div className="hidden md:block absolute -right-8 bottom-1/4 bg-card border border-border rounded-2xl shadow-elegant p-4 animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="text-2xl font-display font-semibold text-gradient-spark">240</div>
            <div className="text-xs text-muted-foreground mt-1">Startups launched</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
