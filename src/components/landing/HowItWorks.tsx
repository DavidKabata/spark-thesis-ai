import { FileText, Cpu, Lightbulb, Handshake } from "lucide-react";

const steps = [
  { icon: FileText, title: "Submit your research", description: "Upload your thesis, paper, or working draft to your private workspace.", href: "#analyze" },
  { icon: Cpu, title: "AI analysis & refinement", description: "Our models surface insights, gaps, market signals, and commercial angles.", href: "#analyze" },
  { icon: Lightbulb, title: "Generate opportunities", description: "Receive startup blueprints, MVP scopes, and IP-ready summaries.", href: "#analyze" },
  { icon: Handshake, title: "Connect & commercialize", description: "Match with industry partners, mentors, and funders to take it live.", href: "#audience" },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-28 bg-soft relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">Process</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-5 leading-tight">
            From manuscript to market in{" "}
            <span className="text-gradient italic font-normal">four steps</span>
          </h2>
        </div>

        <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <a
                key={step.title}
                href={step.href}
                className="relative group rounded-2xl p-2 -m-2 transition-smooth hover:bg-card/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="relative z-10 flex flex-col items-start">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-spark blur-xl opacity-30 group-hover:opacity-60 transition-smooth" />
                    <div className="relative h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-card group-hover:border-primary/40 transition-smooth">
                      <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                    </div>
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center font-display">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2 tracking-tight group-hover:text-primary transition-smooth">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
