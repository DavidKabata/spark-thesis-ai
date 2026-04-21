import { Sparkles } from "lucide-react";

const Footer = () => {
  const links = {
    Platform: ["AI Thesis Assistant", "Startup Engine", "Industry Hub", "Discovery"],
    Company: ["About", "Mission", "Careers", "Press"],
    Resources: ["Documentation", "Case studies", "Research blog", "Support"],
    Legal: ["Privacy", "Terms", "IP policy", "Cookies"],
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-16">
        <div className="grid lg:grid-cols-6 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-spark flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight">
                Research <span className="text-gradient-spark">Venture Ai</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered platform turning postgraduate research into industry-ready innovation.
            </p>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="font-semibold text-sm mb-4">{heading}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Research Venture Ai. Built for the next generation of innovators.</p>
          <p className="font-display italic">Made with intention in Africa 🌍</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
