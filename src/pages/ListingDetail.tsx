import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Tag, Send, CheckCircle2, XCircle, Rocket, Target, Wrench, Ban, Gauge, Calendar, FlaskConical, Users } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Listing = {
  id: string;
  seller_id: string;
  title: string;
  summary: string;
  category: string | null;
  asking_price: number | null;
  currency: string;
  status: string;
  created_at: string;
};

type Offer = {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
};

type Message = { id: string; offer_id: string; sender_id: string; body: string; created_at: string };

const formatPrice = (amount: number | null, currency: string) =>
  amount == null ? "Open to offers" : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!id) return;
    const { data: l } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    setListing(l as Listing | null);
    const { data: o } = await supabase
      .from("offers").select("*").eq("listing_id", id).order("created_at", { ascending: false });
    const offerList = (o ?? []) as Offer[];
    setOffers(offerList);
    if (offerList.length > 0) {
      const ids = offerList.map((x) => x.id);
      const { data: m } = await supabase
        .from("offer_messages").select("*").in("offer_id", ids).order("created_at", { ascending: true });
      const grouped: Record<string, Message[]> = {};
      (m ?? []).forEach((msg) => {
        (grouped[msg.offer_id] ||= []).push(msg as Message);
      });
      setMessages(grouped);
    } else {
      setMessages({});
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    document.title = listing ? `${listing.title} | Marketplace` : "Listing | Marketplace";
  }, [listing]);

  useEffect(() => { load(); }, [load]);

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate(`/auth?redirect=/marketplace/${id}`); return; }
    if (!listing) return;
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("offers").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: amt,
      currency: listing.currency,
      message: offerMsg.trim() || null,
    });
    if (error) {
      toast({ title: "Could not submit offer", description: error.message, variant: "destructive" });
      return;
    }
    setAmount(""); setOfferMsg("");
    toast({ title: "Offer submitted" });
    load();
  };

  const sendReply = async (offerId: string) => {
    if (!user) { navigate(`/auth?redirect=/marketplace/${id}`); return; }
    const body = (reply[offerId] || "").trim();
    if (!body) return;
    const { error } = await supabase.from("offer_messages").insert({
      offer_id: offerId, sender_id: user.id, body,
    });
    if (error) { toast({ title: "Could not send", description: error.message, variant: "destructive" }); return; }
    setReply((r) => ({ ...r, [offerId]: "" }));
    load();
  };

  const updateOfferStatus = async (offerId: string, status: string) => {
    const { error } = await supabase.from("offers").update({ status }).eq("id", offerId);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Offer ${status}` });
    load();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-28">Loading…</div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-28">
          <p className="text-muted-foreground">Listing not found.</p>
          <Button asChild className="mt-4"><Link to="/marketplace">Back to marketplace</Link></Button>
        </div>
      </main>
    );
  }

  const isSeller = user?.id === listing.seller_id;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container max-w-4xl">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2 mb-6">
            <Link to="/marketplace"><ArrowLeft className="h-4 w-4" /> Back to marketplace</Link>
          </Button>

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {listing.category && (
                <Badge variant="secondary" className="font-normal"><Tag className="h-3 w-3" /> {listing.category}</Badge>
              )}
              <Badge variant="outline" className="font-normal capitalize">{listing.status}</Badge>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-4">
              {listing.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">{listing.summary}</p>
            <p className="text-xl font-semibold text-foreground">{formatPrice(listing.asking_price, listing.currency)}</p>
          </div>

          <Separator className="my-8" />

          {!isSeller && listing.status === "active" && (
            <Card className="mb-10">
              <CardHeader><CardTitle className="font-display text-2xl tracking-tight">Make an offer</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={submitOffer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ({listing.currency})</Label>
                      <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="msg">Message (optional)</Label>
                      <Input id="msg" value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} maxLength={500} placeholder="Why this offer, terms, timeline…" />
                    </div>
                  </div>
                  <Button type="submit">{user ? "Submit offer" : "Sign in to offer"}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight mb-5">
              Offers & negotiation {offers.length > 0 && <span className="text-muted-foreground font-normal">({offers.length})</span>}
            </h2>
            {offers.length === 0 ? (
              <p className="text-muted-foreground">No offers yet.</p>
            ) : (
              <div className="space-y-4">
                {offers.map((o) => {
                  const isParticipant = user && (user.id === o.buyer_id || user.id === o.seller_id);
                  const thread = messages[o.id] || [];
                  return (
                    <Card key={o.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-xl font-semibold">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency }).format(o.amount)}
                            </span>
                            <Badge variant={o.status === "accepted" ? "default" : o.status === "rejected" || o.status === "withdrawn" ? "destructive" : "secondary"} className="capitalize">
                              {o.status}
                            </Badge>
                          </div>
                          {isSeller && o.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => updateOfferStatus(o.id, "accepted")}>
                                <CheckCircle2 className="h-4 w-4" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateOfferStatus(o.id, "rejected")}>
                                <XCircle className="h-4 w-4" /> Reject
                              </Button>
                            </div>
                          )}
                          {user?.id === o.buyer_id && o.status === "pending" && (
                            <Button size="sm" variant="ghost" onClick={() => updateOfferStatus(o.id, "withdrawn")}>Withdraw</Button>
                          )}
                        </div>
                        {o.message && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{o.message}</p>}

                        {thread.length > 0 && (
                          <div className="space-y-2 mb-4 border-l-2 border-border pl-4">
                            {thread.map((m) => (
                              <div key={m.id} className="text-sm">
                                <span className={`font-medium ${m.sender_id === o.seller_id ? "text-primary" : "text-accent"}`}>
                                  {m.sender_id === o.seller_id ? "Seller" : "Buyer"}:
                                </span>{" "}
                                <span className="text-foreground whitespace-pre-wrap">{m.body}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isParticipant && o.status === "pending" && (
                          <div className="flex gap-2">
                            <Input
                              value={reply[o.id] || ""}
                              onChange={(e) => setReply((r) => ({ ...r, [o.id]: e.target.value }))}
                              placeholder="Reply…"
                              maxLength={1000}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendReply(o.id); } }}
                            />
                            <Button size="icon" onClick={() => sendReply(o.id)} aria-label="Send"><Send className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default ListingDetail;
