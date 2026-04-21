import { GraduationCap, University, Briefcase, Check } from "lucide-react";

const groups = [
  {
    icon: GraduationCap,
    label: "For Students & Researchers",
    title: "Make your research matter beyond the shelf",
    benefits: [
      "AI-guided thesis refinement and clarity",
      "Translate your work into a startup blueprint",
      "Access funding, mentors, and industry briefs",
      "Build a portfolio that opens real career doors",
    ],
  },
  {
    icon: University,
    label: "For Universities",
    title: "A digital infrastructure for innovation",
    benefits: [
      "Showcase and commercialize institutional research",
      "Power hybrid learning and digital faculty workflows",
      "Track impact metrics across faculties",
      "Strengthen industry and funding partnerships",
    ],
  },
  {
    icon: Briefcase,
    label: "For Industry & Hubs",
    title: "Tap into a pipeline of vetted innovation",
    benefits: [
      "Discover research aligned to your problems",
      "Co-create MVPs with motivated researcher teams",
      "License IP and scout emerging technologies",
      "Plug into university R&D, end to end",
    ],
  },
];

const Audience = () => {
  return (
    <section id="audience" className="py-28">
      <div className="container">
        <div className="max-w-2xl mb-20">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">Built for</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-5 leading-tight">
            One platform.{" "}
            <span className="text-gradient italic font-normal">Three worlds</span>{" "}
            connected.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.label} className="group relative rounded-2xl border border-border bg-card p-8 hover:shadow-elegant transition-smooth hover:-translate-y-1">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary mb-6 group-hover:bg-spark group-hover:text-accent-foreground transition-smooth">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</p>
                <h3 className="font-display text-2xl font-semibold mb-6 tracking-tight leading-snug">{group.title}</h3>
                <ul className="space-y-3">
                  {group.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Audience;
