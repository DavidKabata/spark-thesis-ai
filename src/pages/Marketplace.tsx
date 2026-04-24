import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Tag } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Listing = {
  id: string;
  title: string;
  summary: string;
  category: string | null;
  asking_price: number | null;
  currency: string;
  created_at: string;
};

const formatPrice = (amount: number | null, currency: string) =>
  amount == null ? "Open to offers" : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

const Marketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Innovation Deal Marketplace | Research Venture Ai";
    supabase
      .from("listings")
      .select("id,title,summary,category,asking_price,currency,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setListings(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2 mb-6">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Marketplace</p>
              <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-4">
                Innovation <span className="text-gradient italic font-normal">deal market</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Browse research-backed innovations available for licensing, acquisition, or partnership. Submit offers and negotiate directly with the researchers.
              </p>
            </div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-card">
              <Link to={user ? "/marketplace/new" : "/auth?redirect=/marketplace/new"}>
                <Plus className="h-4 w-4" /> List an innovation
              </Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading listings…</p>
          ) : listings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">No innovations listed yet. Be the first to publish one.</p>
                <Button asChild>
                  <Link to={user ? "/marketplace/new" : "/auth?redirect=/marketplace/new"}>List an innovation</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((l) => (
                <Link key={l.id} to={`/marketplace/${l.id}`} className="group">
                  <Card className="h-full transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-card">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {l.category && (
                          <Badge variant="secondary" className="font-normal">
                            <Tag className="h-3 w-3" /> {l.category}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-display text-xl tracking-tight group-hover:text-primary transition-smooth">
                        {l.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">{l.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium text-foreground">{formatPrice(l.asking_price, l.currency)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default Marketplace;
