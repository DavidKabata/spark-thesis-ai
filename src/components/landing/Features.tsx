import { Brain, Rocket, Building2, Scale, Store } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "AI Thesis Assistant",
    description: "Refine, review, and elevate your research with intelligent suggestions, gap analysis, and academic rigor.",
    accent: false,
  },
  {
    icon: Rocket,
    title: "Research-to-Startup Engine",
    description: "Convert theses into validated startup ideas, lean business models, and MVP concepts — automatically.",
    accent: true,
  },
  {
    icon: Building2,
    title: "Industry Collaboration Hub",
    description: "Match researchers with companies solving real-world problems aligned to their work.",
    accent: false,
  },
  {
    icon: Scale,
    title: "Commercialization Toolkit",
    description: "IP guidance, licensing pathways, and curated funding opportunities for emerging innovators.",
    accent: false,
  },
  {
    icon: Store,
    title: "Innovation Deal Marketplace",
    description: "Browse, buy, and negotiate research-backed innovations. List your own discoveries for licensing or acquisition.",
    accent: false,
    link: "/marketplace",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-28 relative">
      <div className="container">
        <div className="max-w-2xl mb-20">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">Capabilities</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-5 leading-tight">
            A complete operating system for{" "}
            <span className="text-gradient italic font-normal">research innovation</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Five intelligent modules working together to move ideas from the lab to the market.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            const CardContent = (
              <div
                className={`group relative rounded-2xl p-7 border transition-smooth hover:-translate-y-1 h-full ${
                  feature.accent
                    ? "bg-primary text-primary-foreground border-primary lg:row-span-2 shadow-elegant"
                    : "bg-card border-border hover:border-primary/30 hover:shadow-card"
                } ${feature.link ? "cursor-pointer" : ""}`}
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl mb-6 transition-smooth ${
                  feature.accent
                    ? "bg-spark text-accent-foreground shadow-glow"
                    : "bg-secondary text-primary group-hover:bg-spark group-hover:text-accent-foreground"
                }`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${feature.accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {feature.description}
                </p>

                {feature.accent && (
                  <div className="mt-8 pt-6 border-t border-primary-foreground/10">
                    <div className="flex items-center gap-3 text-sm font-medium text-accent">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
                      Most-used module this quarter
                    </div>
                  </div>
                )}

                {feature.link && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Explore marketplace →
                    </span>
                  </div>
                )}
              </div>
            );

            return feature.link ? (
              <Link key={feature.title} to={feature.link} className="block h-full">
                {CardContent}
              </Link>
            ) : (
              <div key={feature.title} className="h-full">
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
