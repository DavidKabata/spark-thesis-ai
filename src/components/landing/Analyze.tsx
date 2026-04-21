import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, Sparkles, Download, Loader2, CheckCircle2, X, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { downloadAnalysisPdf } from "@/lib/reportPdf";
import { cn } from "@/lib/utils";

type CanvasType = "business_model" | "lean";
type InputMode = "upload" | "paste";

type Analysis = {
  id: string;
  title: string;
  canvas_type: CanvasType;
  executive_summary: string | null;
  value_create: string | null;
  value_deliver: string | null;
  value_capture: string | null;
  canvas_data: Record<string, string>;
  created_at: string;
};

const Analyze = () => {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<InputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [abstract, setAbstract] = useState("");
  const [canvasType, setCanvasType] = useState<CanvasType>("business_model");
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const onPickFile = useCallback((f: File | null) => {
    if (!f) return;
    const ok = /\.(pdf|docx)$/i.test(f.name);
    if (!ok) {
      toast({ title: "Unsupported file", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setAnalysis(null);
    setStep("idle");
  }, []);

  const handleAnalyze = async () => {
    if (!user) return;

    if (mode === "upload") {
      if (!file) {
        toast({ title: "Choose a file", description: "Upload your thesis first.", variant: "destructive" });
        return;
      }
    } else {
      if (abstract.trim().length < 200) {
        toast({
          title: "Abstract too short",
          description: "Please paste at least 200 characters so the AI has enough context.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      let payload: Record<string, unknown> = { canvas_type: canvasType };

      if (mode === "upload" && file) {
        setStep("uploading");
        const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("theses").upload(path, file, {
          contentType: file.type || (ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
          upsert: false,
        });
        if (upErr) throw upErr;
        payload.file_path = path;
      } else {
        payload.abstract_text = abstract.trim();
      }

      setStep("analyzing");
      const { data, error } = await supabase.functions.invoke("analyze-thesis", {
        body: payload,
      });
      if (error) throw error;
      if (!data?.analysis) throw new Error("No analysis returned");

      setAnalysis(data.analysis as Analysis);
      setStep("done");
      toast({ title: "Analysis ready 🎉", description: "Review your canvas and download the report." });
    } catch (err: any) {
      console.error(err);
      setStep("idle");
      toast({
        title: "Analysis failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setFile(null);
    setAbstract("");
    setAnalysis(null);
    setStep("idle");
  };

  return (
    <section id="analyze" className="py-24 bg-background relative scroll-mt-20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <a
            href={user ? "#analyze-form" : "/auth"}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-secondary-foreground mb-5 hover:bg-card hover:border-primary/40 transition-smooth cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Try it now
          </a>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-4">
            Upload your thesis.{" "}
            <span className="text-gradient italic font-normal">Get a venture blueprint.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Three steps: upload, choose your canvas, download a polished business model report
            covering how your research <span className="font-medium text-foreground">creates</span>,{" "}
            <span className="font-medium text-foreground">delivers</span>, and{" "}
            <span className="font-medium text-foreground">captures</span> value.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl shadow-elegant p-6 md:p-10">
          {!user && !authLoading && (
            <div className="text-center py-10">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-spark items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2">Sign in to analyze</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create a free account to upload your thesis and save your business model reports.
              </p>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-elegant h-12 px-6">
                <Link to="/auth">Create account or sign in</Link>
              </Button>
            </div>
          )}

          {user && step !== "done" && (
            <>
              {/* Step 1: Submit research */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</div>
                  <h3 className="font-display text-lg font-semibold">Submit your research</h3>
                </div>

                {/* Mode toggle */}
                <div className="inline-flex p-1 rounded-xl bg-secondary border border-border mb-4">
                  <button
                    type="button"
                    onClick={() => setMode("upload")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2",
                      mode === "upload"
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    Upload thesis
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("paste")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2",
                      mode === "paste"
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    Paste abstract
                  </button>
                </div>

                {mode === "upload" ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      onPickFile(e.dataTransfer.files?.[0] || null);
                    }}
                    className={cn(
                      "block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-smooth",
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50",
                    )}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                      disabled={step !== "idle"}
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <div className="font-medium text-foreground">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setFile(null); }}
                          className="ml-2 p-1 rounded hover:bg-secondary"
                          aria-label="Remove file"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="font-medium text-foreground">Drag & drop or click to upload</div>
                        <div className="text-xs text-muted-foreground">PDF or DOCX · Max 20MB</div>
                      </div>
                    )}
                  </label>
                ) : (
                  <div>
                    <Textarea
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      placeholder="Paste your thesis abstract, summary, or key chapters here. The more context you provide, the sharper the business model. Minimum 200 characters."
                      className="min-h-[200px] resize-y text-sm leading-relaxed"
                      disabled={step !== "idle"}
                    />
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>Minimum 200 characters</span>
                      <span className={cn(abstract.length >= 200 ? "text-primary font-medium" : "")}>
                        {abstract.length.toLocaleString()} characters
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Canvas choice */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</div>
                  <h3 className="font-display text-lg font-semibold">Choose your canvas</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCanvasType("business_model")}
                    className={cn(
                      "text-left p-5 rounded-2xl border-2 transition-smooth",
                      canvasType === "business_model"
                        ? "border-primary bg-primary/5 shadow-card"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-display font-semibold">Business Model Canvas</div>
                      {canvasType === "business_model" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Classic 9-block view: customers, value, channels, revenue, costs.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasType("lean")}
                    className={cn(
                      "text-left p-5 rounded-2xl border-2 transition-smooth",
                      canvasType === "lean"
                        ? "border-primary bg-primary/5 shadow-card"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-display font-semibold">Lean Canvas</div>
                      {canvasType === "lean" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Startup-focused: problem, solution, UVP, metrics, unfair advantage.
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 3: Analyze */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">3</div>
                <h3 className="font-display text-lg font-semibold">Generate your report</h3>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={step !== "idle" || (mode === "upload" ? !file : abstract.trim().length < 200)}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 shadow-elegant h-12"
              >
                {step === "uploading" && (<><Loader2 className="h-4 w-4 animate-spin" /> Uploading thesis...</>)}
                {step === "analyzing" && (<><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI...</>)}
                {step === "idle" && (<><Sparkles className="h-4 w-4" /> Analyze thesis</>)}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Takes 20-60 seconds. Your file is stored privately and only you can see it.
              </p>
            </>
          )}

          {user && step === "done" && analysis && (
            <ResultView analysis={analysis} onReset={reset} />
          )}
        </div>
      </div>
    </section>
  );
};

const BMC_BLOCKS: Array<[string, string]> = [
  ["key_partnerships", "Key Partnerships"],
  ["key_activities", "Key Activities"],
  ["key_resources", "Key Resources"],
  ["value_propositions", "Value Propositions"],
  ["customer_relationships", "Customer Relationships"],
  ["channels", "Channels"],
  ["customer_segments", "Customer Segments"],
  ["cost_structure", "Cost Structure"],
  ["revenue_streams", "Revenue Streams"],
];
const LEAN_BLOCKS: Array<[string, string]> = [
  ["problem", "Problem"],
  ["solution", "Solution"],
  ["unique_value_proposition", "Unique Value Proposition"],
  ["unfair_advantage", "Unfair Advantage"],
  ["customer_segments", "Customer Segments"],
  ["key_metrics", "Key Metrics"],
  ["channels", "Channels"],
  ["cost_structure", "Cost Structure"],
  ["revenue_streams", "Revenue Streams"],
];

const ResultView = ({ analysis, onReset }: { analysis: Analysis; onReset: () => void }) => {
  const blocks = analysis.canvas_type === "lean" ? LEAN_BLOCKS : BMC_BLOCKS;
  const canvasLabel = analysis.canvas_type === "lean" ? "Lean Canvas" : "Business Model Canvas";

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{canvasLabel}</div>
          <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight">{analysis.title}</h3>
        </div>
        <CheckCircle2 className="h-7 w-7 text-primary shrink-0" />
      </div>

      {analysis.executive_summary && (
        <p className="text-muted-foreground mb-6 leading-relaxed">{analysis.executive_summary}</p>
      )}

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[
          ["Value Created", analysis.value_create],
          ["Value Delivered", analysis.value_deliver],
          ["Value Captured", analysis.value_capture],
        ].map(([label, body]) => (
          <div key={label} className="p-4 rounded-xl bg-soft border border-border">
            <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-1">{label}</div>
            <p className="text-sm text-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {blocks.map(([key, label]) => (
          <div key={key} className="p-4 rounded-xl border border-border bg-card hover:shadow-card transition-smooth">
            <div className="text-[11px] uppercase tracking-wide text-primary font-semibold mb-1.5">{label}</div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {analysis.canvas_data?.[key] || "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          onClick={() => downloadAnalysisPdf(analysis)}
          className="flex-1 bg-primary hover:bg-primary/90 shadow-elegant h-12"
        >
          <Download className="h-4 w-4" />
          Download PDF report
        </Button>
        <Button size="lg" variant="outline" onClick={onReset} className="h-12">
          Analyze another
        </Button>
      </div>
    </div>
  );
};

export default Analyze;
