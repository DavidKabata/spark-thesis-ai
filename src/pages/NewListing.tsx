import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

type Mvp = {
  name?: string;
  one_liner?: string;
  target_user?: string;
  core_problem?: string;
  core_features?: string[];
  out_of_scope?: string[];
  tech_stack?: string;
  success_metrics?: string[];
  timeline_weeks?: number;
  first_experiment?: string;
};
type AnalysisOpt = {
  id: string;
  title: string;
  executive_summary: string | null;
  canvas_data: { __mvp?: Mvp | null } | null;
};

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(20).max(2000),
  category: z.string().trim().max(60).optional(),
  asking_price: z.string().optional(),
});

const NewListing = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisOpt[]>([]);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "List an Innovation | Marketplace";
    if (!authLoading && !user) navigate("/auth?redirect=/marketplace/new", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analyses")
      .select("id,title,executive_summary,canvas_data")
      .order("created_at", { ascending: false })
      .then(({ data }) => setAnalyses((data ?? []) as unknown as AnalysisOpt[]));
  }, [user]);

  const onPickAnalysis = (id: string) => {
    setAnalysisId(id);
    const a = analyses.find((x) => x.id === id);
    if (!a) return;
    const mvp = a.canvas_data?.__mvp;
    // Prefer the MVP name + pitch — that's what's actually for sale
    const newTitle = mvp?.name || a.title;
    const pitch = mvp?.one_liner ? mvp.one_liner : "";
    const features = mvp?.core_features?.length
      ? `\n\nCore features:\n• ${mvp.core_features.join("\n• ")}`
      : "";
    const target = mvp?.target_user ? `\n\nTarget user: ${mvp.target_user}` : "";
    const newSummary = pitch
      ? `${pitch}${target}${features}`.trim()
      : a.executive_summary || "";
    if (!title || title === a.title) setTitle(newTitle);
    if (!summary && newSummary) setSummary(newSummary);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ title, summary, category, asking_price: price });
    if (!parsed.success) {
      toast({ title: "Check your inputs", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    const askingPrice = price ? Number(price) : null;
    if (price && (Number.isNaN(askingPrice!) || askingPrice! < 0)) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        analysis_id: analysisId || null,
        title: title.trim(),
        summary: summary.trim(),
        category: category.trim() || null,
        asking_price: askingPrice,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast({ title: "Could not publish", description: error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Listing published" });
    navigate(`/marketplace/${data.id}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container max-w-2xl">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2 mb-6">
            <Link to="/marketplace"><ArrowLeft className="h-4 w-4" /> Back to marketplace</Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-3xl tracking-tight">List an innovation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                {analyses.length > 0 && (
                  <div className="space-y-2">
                    <Label>List the MVP from one of your analyses</Label>
                    <Select value={analysisId} onValueChange={onPickAnalysis}>
                      <SelectTrigger><SelectValue placeholder="Pick an analysis to publish its MVP" /></SelectTrigger>
                      <SelectContent>
                        {analyses.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.canvas_data?.__mvp?.name ? `${a.canvas_data.__mvp.name} — ${a.title}` : a.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">We'll prefill the MVP name, pitch, target user, and core features. You can edit before publishing.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} maxLength={2000} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Biotech, AI, Materials…" maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Asking price (USD)</Label>
                    <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Publishing…" : "Publish listing"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default NewListing;
