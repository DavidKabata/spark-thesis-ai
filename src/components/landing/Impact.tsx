const stats = [
  { value: "85%", label: "of academic research never reaches the market", spark: false },
  { value: "10×", label: "faster path from thesis to validated startup concept", spark: true },
  { value: "240+", label: "ventures launched from research on the platform", spark: false },
  { value: "12", label: "African countries already in the network", spark: false },
];

const Impact = () => {
  return (
    <section id="impact" className="py-28 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary-glow blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container relative">
        <div className="max-w-3xl mb-20">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">The opportunity</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
            Unlocking innovation,{" "}
            <span className="text-gradient-spark italic font-normal">creating jobs</span>,
            putting research to work.
          </h2>
          <p className="text-lg text-primary-foreground/70 leading-relaxed">
            Africa graduates over 100,000 postgraduates each year — yet most of their
            research never leaves the library. Research Venture Ai closes that gap.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-primary-foreground/10 rounded-2xl overflow-hidden">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-primary p-8 hover:bg-primary-foreground/[0.03] transition-smooth">
              <div className={`font-display text-5xl md:text-6xl font-semibold mb-3 ${stat.spark ? "text-gradient-spark" : "text-primary-foreground"}`}>
                {stat.value}
              </div>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Impact;
