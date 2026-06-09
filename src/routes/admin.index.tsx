import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Cake, LayoutGrid, ShoppingBag, LogOut, Store,
  Boxes, CheckCircle2, XCircle, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import "@/components/sweet-bloom/menu-admin.css";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Menu Management — Selam Cake & Arts" }] }),
  component: AdminDashboard,
});

const fmtBirr = (n: number) =>
  `Birr ${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

type Section = "overview" | "orders" | "menu";

// Shop catalog — mirrors items shown in public/shop.html
type ShopItem = { id: string; name: string; sub: string; cat: string; price: number; img: string };
const SHOP_ITEMS: ShopItem[] = [
  { id: "fast1", name: "Fruit & Nut Fasting Cake", sub: "Mixed dried fruits · Walnuts · Spiced batter · No dairy", cat: "Fasting", price: 35, img: "https://images.pexels.com/photos/37661106/pexels-photo-37661106.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "fast2", name: "Vegan Chocolate", sub: "Rich cocoa · Coconut milk · Dairy-free ganache", cat: "Fasting", price: 38, img: "https://images.pexels.com/photos/37262561/pexels-photo-37262561.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "fast3", name: "Apple Cinnamon", sub: "Fresh apples · Cinnamon spice · Oat crumble topping", cat: "Fasting", price: 32, img: "https://images.pexels.com/photos/30739085/pexels-photo-30739085.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "fast4", name: "Carrot Walnut", sub: "Grated carrots · Walnuts · Orange zest · Plant-based cream", cat: "Fasting", price: 34, img: "https://images.pexels.com/photos/32397279/pexels-photo-32397279.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ker1", name: "Baptism Cross Cake", sub: "White vanilla · Gold cross · Soft buttercream", cat: "Kerestena", price: 45, img: "https://images.pexels.com/photos/2144200/pexels-photo-2144200.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ker2", name: "Holy Communion Cake", sub: "Elegant white · Host detail · Floral accents", cat: "Kerestena", price: 55, img: "https://images.pexels.com/photos/32437628/pexels-photo-32437628.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ker3", name: "Easter Resurrection Cake", sub: "Chocolate layers · Spring florals · Symbolic design", cat: "Kerestena", price: 48, img: "https://images.pexels.com/photos/31336127/pexels-photo-31336127.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ker4", name: "Confirmation Blessing", sub: "Light sponge · Pastel frosting · Dove decoration", cat: "Kerestena", price: 42, img: "https://images.pexels.com/photos/15307373/pexels-photo-15307373.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ysh1", name: "Traditional Shemgelena", sub: "Honey bread base · Decorative icing · Cultural motifs", cat: "Yeshemgelena", price: 40, img: "https://images.pexels.com/photos/29051739/pexels-photo-29051739.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ysh2", name: "Blue Baby Welcome", sub: "Vanilla sponge · Blue buttercream · Teddy topper", cat: "Yeshemgelena", price: 38, img: "https://images.pexels.com/photos/30233124/pexels-photo-30233124.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ysh3", name: "Pink Baby Shower", sub: "Strawberry cream · Pink roses · Edible pearls", cat: "Yeshemgelena", price: 38, img: "https://images.pexels.com/photos/12742498/pexels-photo-12742498.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "ysh4", name: "Neutral Woodland", sub: "Earthy tones · Forest animals · Gender-neutral design", cat: "Yeshemgelena", price: 42, img: "https://images.pexels.com/photos/30233124/pexels-photo-30233124.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "grad1", name: "Cap & Gown Tier", sub: "2-tier chocolate · Graduation cap topper · Gold details", cat: "Graduation", price: 65, img: "https://images.pexels.com/photos/9540405/pexels-photo-9540405.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "grad2", name: "Diploma Scroll", sub: "Vanilla roll design · Edible ribbon · Personalised name", cat: "Graduation", price: 50, img: "https://images.pexels.com/photos/20768168/pexels-photo-20768168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "grad3", name: "Class of 2026", sub: "Modern design · School colours · Year banner", cat: "Graduation", price: 58, img: "https://images.pexels.com/photos/12419449/pexels-photo-12419449.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "grad4", name: "Scholar Book Stack", sub: "Stacked book design · Fondant finish · Quote plaque", cat: "Graduation", price: 55, img: "https://images.pexels.com/photos/6210746/pexels-photo-6210746.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "wed1", name: "3-Tier Floral Wedding", sub: "Vanilla sponge · Buttercream roses · Fresh greenery", cat: "Wedding", price: 220, img: "https://images.pexels.com/photos/34569681/pexels-photo-34569681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "wed2", name: "Anniversary Gold", sub: "Golden fondant · Champagne accents · Sugar flowers", cat: "Wedding", price: 95, img: "https://images.pexels.com/photos/34073612/pexels-photo-34073612.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "wed3", name: "Silver Jubilee", sub: "Silver leaf details · White tiers · 25th anniversary", cat: "Wedding", price: 150, img: "https://images.pexels.com/photos/17869890/pexels-photo-17869890.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "wed4", name: "Classic Ivory Wedding", sub: "Single tier · Ivory fondant · Gold leaf details", cat: "Wedding", price: 120, img: "https://images.pexels.com/photos/28378968/pexels-photo-28378968.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "bday1", name: "Chocolate Celebration", sub: "Dark chocolate sponge · Ganache drip · Strawberry topping", cat: "Birthday", price: 38, img: "https://images.pexels.com/photos/2337821/pexels-photo-2337821.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "bday2", name: "Vanilla Party Cake", sub: "Classic vanilla · Rainbow sprinkles · Buttercream", cat: "Birthday", price: 32, img: "https://images.pexels.com/photos/32916204/pexels-photo-32916204.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "bday3", name: "Red Velvet Party", sub: "Red velvet layers · Cream cheese · Festive decor", cat: "Birthday", price: 42, img: "https://images.pexels.com/photos/9553739/pexels-photo-9553739.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "bday4", name: "Custom Theme Cake", sub: "Your design · Any theme · Personalised message", cat: "Birthday", price: 55, img: "https://images.pexels.com/photos/5713248/pexels-photo-5713248.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "avail1", name: "Classic Vanilla Slice", sub: "Freshly baked this morning · Light sponge · Buttercream", cat: "Available Today", price: 6, img: "https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "avail2", name: "Chocolate Fudge Cupcake", sub: "Rich cocoa · Ganache topping · Sprinkles", cat: "Available Today", price: 4.5, img: "https://images.pexels.com/photos/3776947/pexels-photo-3776947.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "avail3", name: "Strawberry Tart", sub: "Fresh strawberries · Custard · Flaky pastry", cat: "Available Today", price: 7, img: "https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "avail4", name: "Lemon Drizzle Loaf", sub: "Zesty lemon · Sugar glaze · Moist sponge", cat: "Available Today", price: 5.5, img: "https://images.pexels.com/photos/1485806/pexels-photo-1485806.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "avail5", name: "Red Velvet Cookie", sub: "Cream cheese chunks · Cocoa · Soft bake", cat: "Available Today", price: 3.5, img: "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
  { id: "avail6", name: "Cinnamon Roll", sub: "Warm spice · Cream cheese glaze · Yeast dough", cat: "Available Today", price: 5, img: "https://images.pexels.com/photos/351961/pexels-photo-351961.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=400&w=400" },
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

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [shopAvail, setShopAvail] = useState<Record<string, boolean>>({});
  const [shopBusy, setShopBusy] = useState<Record<string, boolean>>({});

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, customer_address, items, total, status, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.error("Load orders failed", error); return; }
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
    setShopAvail((m) => ({ ...m, [item_id]: !current }));
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
      if (!session) { nav({ to: "/admin/login" }); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
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

  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase
      .channel("shop_avail_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_item_availability" }, () => loadShopAvail())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, loadShopAvail]);

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

  const totalItems = SHOP_ITEMS.length;
  const available = SHOP_ITEMS.filter((i) => shopAvail[i.id] !== false).length;
  const soldOut = totalItems - available;
  const newOrders = orders.filter((o) => o.status === "new").length;

  async function setOrderStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { alert("Could not update status: " + error.message); loadOrders(); }
  }

  const navItems: { id: Section; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Shop Items", icon: Tag },
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
                <span className="ma-stat-val">{totalItems}</span>
                <span className="ma-stat-label">Total Items</span>
              </div>
              <div className="ma-stat">
                <span className="ma-stat-icon green"><CheckCircle2 size={22} /></span>
                <span className="ma-stat-val">{available}</span>
                <span className="ma-stat-label">Available</span>
              </div>
              <div className="ma-stat">
                <span className="ma-stat-icon red"><XCircle size={22} /></span>
                <span className="ma-stat-val">{soldOut}</span>
                <span className="ma-stat-label">Sold Out</span>
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
                          <td><span className="ma-price">{fmtBirr(o.total)}</span></td>
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
                          <td><span className="ma-price">{fmtBirr(o.total)}</span></td>
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
            <h1 className="ma-page-title">Shop Items</h1>
            <p className="ma-page-sub">All items from the shop page. Toggle availability — changes appear instantly for customers.</p>
            <section className="ma-card">
              <div className="ma-card-head">
                <h2>Inventory ({SHOP_ITEMS.length})</h2>
                <button className="ma-add-btn" type="button" onClick={loadShopAvail}>Refresh</button>
              </div>
              <div className="ma-table-wrap">
                <table className="ma-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHOP_ITEMS.map((it) => {
                      const on = shopAvail[it.id] !== false;
                      const busy = !!shopBusy[it.id];
                      return (
                        <tr key={it.id}>
                          <td>
                            <div className="ma-cake-cell">
                              <img className="ma-thumb" src={it.img} alt={it.name} loading="lazy" />
                              <div>
                                <div className="ma-cake-name">{it.name}</div>
                                <div style={{ fontSize: 12, color: "#9a8b7c", maxWidth: 320 }}>{it.sub}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="ma-cat-tag">{it.cat}</span></td>
                          <td><span className="ma-price">{fmtBirr(it.price)}</span></td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                                padding: "4px 10px",
                                borderRadius: 999,
                                background: on ? "#dcfce7" : "#fee2e2",
                                color: on ? "#047857" : "#b91c1c",
                              }}
                            >
                              {on ? "Available" : "Sold Out"}
                            </span>
                          </td>
                          <td>
                            <div className="ma-stock">
                              <button
                                type="button"
                                className={"ma-switch" + (on ? " on" : "")}
                                role="switch"
                                aria-checked={on}
                                disabled={busy}
                                aria-label={`Toggle availability for ${it.name}`}
                                onClick={() => toggleShopItem(it.id, on)}
                              />
                            </div>
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
    </div>
  );
}
