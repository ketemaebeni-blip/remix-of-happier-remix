import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Cake, LayoutGrid, ShoppingBag, UtensilsCrossed, Plus, LogOut, Store,
  Boxes, CheckCircle2, XCircle, Upload, Tag,
} from "lucide-react";
// @ts-ignore - plain JS data module
import { CATEGORIES, DISHES } from "@/components/sweet-bloom/data.js";
import { useUnavailable, useCakeOverrides } from "@/components/sweet-bloom/availability";
import { supabase } from "@/integrations/supabase/client";
import "@/components/sweet-bloom/menu-admin.css";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Menu Management — Selam Cake & Arts" }] }),
  component: AdminDashboard,
});

const fmtETB = (n: number) => `ETB ${Number(n).toLocaleString("en-US")}`;

type Section = "overview" | "orders" | "menu" | "shop";

// Shop items mirror those hard-coded in public/shop.html
const SHOP_ITEMS: { id: string; name: string; cat: string; price: number }[] = [
  { id: "fast1", name: "Fruit & Nut Fasting Cake", cat: "Fasting", price: 35 },
  { id: "fast2", name: "Vegan Chocolate", cat: "Fasting", price: 38 },
  { id: "fast3", name: "Apple Cinnamon", cat: "Fasting", price: 32 },
  { id: "fast4", name: "Carrot Walnut", cat: "Fasting", price: 34 },
  { id: "ker1", name: "Baptism Cross Cake", cat: "Kerestena", price: 45 },
  { id: "ker2", name: "Holy Communion Cake", cat: "Kerestena", price: 55 },
  { id: "ker3", name: "Easter Resurrection Cake", cat: "Kerestena", price: 48 },
  { id: "ker4", name: "Confirmation Blessing", cat: "Kerestena", price: 42 },
  { id: "ysh1", name: "Traditional Shemgelena", cat: "Yeshemgelena", price: 40 },
  { id: "ysh2", name: "Blue Baby Welcome", cat: "Yeshemgelena", price: 38 },
  { id: "ysh3", name: "Pink Baby Shower", cat: "Yeshemgelena", price: 38 },
  { id: "ysh4", name: "Neutral Woodland", cat: "Yeshemgelena", price: 42 },
  { id: "grad1", name: "Cap & Gown Tier", cat: "Graduation", price: 65 },
  { id: "grad2", name: "Diploma Scroll", cat: "Graduation", price: 50 },
  { id: "grad3", name: "Class of 2026", cat: "Graduation", price: 58 },
  { id: "grad4", name: "Scholar Book Stack", cat: "Graduation", price: 55 },
  { id: "wed1", name: "3-Tier Floral Wedding", cat: "Wedding", price: 220 },
  { id: "wed2", name: "Anniversary Gold", cat: "Wedding", price: 95 },
  { id: "wed3", name: "Silver Jubilee", cat: "Wedding", price: 150 },
  { id: "wed4", name: "Classic Ivory Wedding", cat: "Wedding", price: 120 },
  { id: "bday1", name: "Chocolate Celebration", cat: "Birthday", price: 38 },
  { id: "bday2", name: "Vanilla Party Cake", cat: "Birthday", price: 32 },
  { id: "bday3", name: "Red Velvet Party", cat: "Birthday", price: 42 },
  { id: "bday4", name: "Custom Theme Cake", cat: "Birthday", price: 55 },
  { id: "avail1", name: "Classic Vanilla Slice", cat: "Available Today", price: 6 },
  { id: "avail2", name: "Chocolate Fudge Cupcake", cat: "Available Today", price: 4.5 },
  { id: "avail3", name: "Strawberry Tart", cat: "Available Today", price: 7 },
  { id: "avail4", name: "Lemon Drizzle Loaf", cat: "Available Today", price: 5.5 },
  { id: "avail5", name: "Red Velvet Cookie", cat: "Available Today", price: 3.5 },
  { id: "avail6", name: "Cinnamon Roll", cat: "Available Today", price: 5 },
];


type OrderRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  items: { name: string; qty: number; price: number; img?: string | null }[];
  total: number;
  status: string;
  created_at: string;
};

function AdminDashboard() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const { isAvailable, setAvailable } = useUnavailable();
  const { applyOverride, saveOverride } = useCakeOverrides();

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", image_url: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [shopAvail, setShopAvail] = useState<Record<string, boolean>>({});
  const [shopBusy, setShopBusy] = useState<Record<string, boolean>>({});

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, customer_address, items, total, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Load orders failed", error);
      return;
    }
    setOrders((data ?? []) as OrderRow[]);
  }, []);

  const loadShopAvail = useCallback(async () => {
    const { data, error } = await supabase
      .from("shop_item_availability")
      .select("item_id, available");
    if (error) { console.error("Load shop avail failed", error); return; }
    const map: Record<string, boolean> = {};
    (data ?? []).forEach((r: any) => { map[r.item_id] = r.available; });
    setShopAvail(map);
  }, []);

  async function toggleShopItem(item_id: string, current: boolean) {
    setShopBusy((b) => ({ ...b, [item_id]: true }));
    setShopAvail((m) => ({ ...m, [item_id]: !current })); // optimistic
    const { error } = await supabase
      .from("shop_item_availability")
      .upsert({ item_id, available: !current, updated_at: new Date().toISOString() }, { onConflict: "item_id" });
    if (error) {
      alert("Update failed: " + error.message);
      setShopAvail((m) => ({ ...m, [item_id]: current }));
    }
    setShopBusy((b) => ({ ...b, [item_id]: false }));
  }


  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        nav({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const admin = !!roles?.some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      setReady(true);
      if (admin) { loadOrders(); loadShopAvail(); }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) nav({ to: "/admin/login" });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav, loadOrders, loadShopAvail]);

  // Live shop availability
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase
      .channel("shop_avail_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_item_availability" }, () => loadShopAvail())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, loadShopAvail]);


  // Live orders
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, loadOrders]);

  if (!ready) return null;

  async function logout() {
    await supabase.auth.signOut();
    nav({ to: "/admin/login" });
  }

  if (!isAdmin) {
    return (
      <div className="ma-denied">
        <div className="box">
          <h1>Access denied</h1>
          <p>This account is read-only. Only the owner / manager can edit the menu.</p>
          <button className="ma-edit-btn" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  const editableCats = CATEGORIES.filter((c: any) => c.id !== "all").map((c: any) => c.id);
  const rows = (DISHES as any[]).map((d: any) => ({ raw: d, merged: applyOverride(d) }));

  // Overview stats
  const totalCakes = rows.length;
  const inStock = rows.filter((r) => isAvailable(r.merged.id)).length;
  const outStock = totalCakes - inStock;
  const newOrders = orders.filter((o) => o.status === "new").length;

  function openEdit(raw: any) {
    const m = applyOverride(raw);
    setCreating(false);
    setEditing(raw);
    setForm({ name: m.nameEN, category: m.cat, price: String(m.price), image_url: m.img });
  }

  async function uploadImage(file: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Image is too large (max 8MB).");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `cakes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("cake-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      // Private bucket → long-lived signed URL (10 years)
      const { data, error: urlErr } = await supabase.storage
        .from("cake-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (urlErr || !data?.signedUrl) throw urlErr || new Error("Could not create URL");
      setForm((f) => ({ ...f, image_url: data.signedUrl }));
    } catch (err: any) {
      alert("Upload failed: " + (err?.message ?? "unknown error"));
    } finally {
      setUploading(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await saveOverride(editing.id, {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        image_url: form.image_url.trim(),
      });
      setEditing(null);
    } catch (err: any) {
      alert("Save failed: " + (err?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function setOrderStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert("Could not update status: " + error.message);
      loadOrders();
    }
  }

  const navItems: { id: Section; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu Management", icon: UtensilsCrossed },
  ];

  return (
    <div className="ma-shell">
      <aside className="ma-sidebar">
        <div className="ma-logo">
          <span className="ma-logo-icon"><Cake size={22} /></span>
          <span>
            <b>Selam Cake</b>
            <span>&amp; Arts</span>
          </span>
        </div>

        <nav className="ma-nav">
          {navItems.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                className={"ma-nav-item" + (section === it.id ? " active" : "")}
                type="button"
                onClick={() => setSection(it.id)}
              >
                <Icon size={19} /> {it.label}
              </button>
            );
          })}
        </nav>

        <div className="ma-sidebar-foot">
          <Link to="/" className="ma-nav-item">
            <Store size={19} /> View Shop
          </Link>
          <button className="ma-nav-item" type="button" onClick={logout}>
            <LogOut size={19} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="ma-main">
        {section === "overview" && (
          <>
            <h1 className="ma-page-title">Overview</h1>
            <p className="ma-page-sub">A quick snapshot of your shop today.</p>
            <div className="ma-stats">
              <div className="ma-stat">
                <span className="ma-stat-icon"><Boxes size={22} /></span>
                <span className="ma-stat-val">{totalCakes}</span>
                <span className="ma-stat-label">Total Cakes</span>
              </div>
              <div className="ma-stat">
                <span className="ma-stat-icon green"><CheckCircle2 size={22} /></span>
                <span className="ma-stat-val">{inStock}</span>
                <span className="ma-stat-label">In Stock</span>
              </div>
              <div className="ma-stat">
                <span className="ma-stat-icon red"><XCircle size={22} /></span>
                <span className="ma-stat-val">{outStock}</span>
                <span className="ma-stat-label">Out of Stock</span>
              </div>
              <div className="ma-stat">
                <span className="ma-stat-icon"><ShoppingBag size={22} /></span>
                <span className="ma-stat-val">{orders.length}</span>
                <span className="ma-stat-label">Total Orders</span>
              </div>
              <div className="ma-stat">
                <span className="ma-stat-icon green"><ShoppingBag size={22} /></span>
                <span className="ma-stat-val">{newOrders}</span>
                <span className="ma-stat-label">New Orders</span>
              </div>
            </div>

            <section className="ma-card">
              <div className="ma-card-head">
                <h2>Recent Orders</h2>
                <button className="ma-add-btn" type="button" onClick={() => setSection("orders")}>
                  View all
                </button>
              </div>
              <div className="ma-table-wrap">
                {orders.length === 0 ? (
                  <div className="ma-empty-state">No orders yet.</div>
                ) : (
                  <table className="ma-table">
                    <thead>
                      <tr><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id}>
                          <td><span className="ma-cake-name">{o.customer_name || "—"}</span></td>
                          <td>{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</td>
                          <td><span className="ma-price">{fmtETB(o.total)}</span></td>
                          <td><span className={"ma-order-status " + o.status}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {section === "orders" && (
          <>
            <h1 className="ma-page-title">Orders</h1>
            <p className="ma-page-sub">Every order customers send from the shop.</p>
            <section className="ma-card">
              <div className="ma-card-head">
                <h2>All Orders ({orders.length})</h2>
                <button className="ma-add-btn" type="button" onClick={loadOrders}>Refresh</button>
              </div>
              <div className="ma-table-wrap">
                {orders.length === 0 ? (
                  <div className="ma-empty-state">No orders yet. They'll appear here in real time.</div>
                ) : (
                  <table className="ma-table">
                    <thead>
                      <tr>
                        <th>Customer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <div className="ma-cake-name">{o.customer_name || "—"}</div>
                            <div style={{ fontSize: 13, color: "#9a8b7c" }}>{o.customer_phone || ""}</div>
                            {o.customer_address && (
                              <div style={{ fontSize: 12, color: "#9a8b7c" }}>📍 {o.customer_address}</div>
                            )}
                          </td>
                          <td>
                            <ul className="ma-order-items">
                              {o.items.map((it, i) => (
                                <li key={i}>{it.name} × {it.qty}</li>
                              ))}
                            </ul>
                          </td>
                          <td><span className="ma-price">{fmtETB(o.total)}</span></td>
                          <td style={{ fontSize: 13, color: "#9a8b7c" }}>
                            {new Date(o.created_at).toLocaleString()}
                          </td>
                          <td>
                            <select
                              className="ma-status-select"
                              value={o.status}
                              onChange={(e) => setOrderStatus(o.id, e.target.value)}
                            >
                              <option value="new">New</option>
                              <option value="preparing">Preparing</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {section === "menu" && (
          <>
            <h1 className="ma-page-title">Menu Management</h1>
            <p className="ma-page-sub">Manage your cake catalog, pricing and live stock status.</p>

            <section className="ma-card">
              <div className="ma-card-head">
                <h2>Manage Cake Inventory</h2>
                <button
                  className="ma-add-btn"
                  type="button"
                  onClick={() => {
                    setCreating(true);
                    setEditing(null);
                    setForm({ name: "", category: editableCats[0] ?? "", price: "", image_url: "" });
                  }}
                >
                  <Plus size={18} /> Add New Cake
                </button>
              </div>

              <div className="ma-table-wrap">
                <table className="ma-table">
                  <thead>
                    <tr>
                      <th>Cake</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ raw, merged }: any) => {
                      const on = isAvailable(merged.id);
                      return (
                        <tr key={merged.id}>
                          <td>
                            <div className="ma-cake-cell">
                              <img className="ma-thumb" src={merged.img} alt={merged.nameEN} loading="lazy" />
                              <span className="ma-cake-name">{merged.nameEN}</span>
                            </div>
                          </td>
                          <td><span className="ma-cat-tag">{merged.cat}</span></td>
                          <td><span className="ma-price">{fmtETB(merged.price)}</span></td>
                          <td>
                            <div className="ma-stock">
                              <button
                                type="button"
                                className={"ma-switch" + (on ? " on" : "")}
                                role="switch"
                                aria-checked={on}
                                aria-label={`Toggle stock for ${merged.nameEN}`}
                                onClick={() => setAvailable(merged.id, !on)}
                              />
                              <span className={"ma-stock-label " + (on ? "in" : "out")}>
                                {on ? "In Stock" : "Out of Stock"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <button className="ma-edit-btn" type="button" onClick={() => openEdit(raw)}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {(editing || creating) && (
        <div className="ma-modal-overlay" onClick={() => !saving && !uploading && (setEditing(null), setCreating(false))}>
          <form className="ma-modal" onClick={(e) => e.stopPropagation()} onSubmit={submitEdit}>
            <h2>{creating ? "Add New Cake" : "Edit Cake"}</h2>

            {creating && (
              <p style={{ marginTop: -8, marginBottom: 14, fontSize: 13, color: "#9a8b7c" }}>
                New cakes are added to the catalog file. To edit price, name, category and photo of an
                existing cake, use the Edit action on each row.
              </p>
            )}

            <label className="ma-field">
              <span>Name</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="ma-field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {editableCats.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="ma-field">
              <span>Price (ETB)</span>
              <input required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>

            <div className="ma-field">
              <span>Photo</span>
              <label className="ma-upload">
                <Upload size={16} />
                {uploading ? "Uploading…" : "Upload a picture"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <div className="ma-or">…or paste an image URL</div>
              <input
                type="url"
                placeholder="https://…"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              {form.image_url && (
                <img src={form.image_url} alt="preview" style={{ marginTop: 10, width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12 }} />
              )}
            </div>

            <div className="ma-modal-actions">
              <button type="button" className="ma-btn-secondary" disabled={saving || uploading} onClick={() => { setEditing(null); setCreating(false); }}>
                Cancel
              </button>
              <button type="submit" className="ma-btn-primary" disabled={saving || uploading || creating}>
                {saving ? "Saving…" : creating ? "Edit existing rows" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
