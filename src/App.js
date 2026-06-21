import { useState, useEffect } from "react";

const STORAGE_KEY = "bd-card-manager-cards";

const CARD_COLORS = [
  { name: "Midnight", bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)", text: "#fff" },
  { name: "Forest", bg: "linear-gradient(135deg, #134e4a 0%, #065f46 60%, #047857 100%)", text: "#fff" },
  { name: "Crimson", bg: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)", text: "#fff" },
  { name: "Slate", bg: "linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)", text: "#fff" },
  { name: "Violet", bg: "linear-gradient(135deg, #2e1065 0%, #4c1d95 60%, #6d28d9 100%)", text: "#fff" },
  { name: "Copper", bg: "linear-gradient(135deg, #78350f 0%, #92400e 60%, #b45309 100%)", text: "#fff" },
];

const NETWORKS = ["Visa", "Mastercard", "Amex", "Discover", "Other"];

function getDaysUntilDue(dueDay) {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  const target = thisMonth >= today ? thisMonth : nextMonth;
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getDueLabel(daysLeft) {
  if (daysLeft === 0) return { label: "Due Today", color: "#ef4444" };
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: "#f97316" };
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: "#eab308" };
  return { label: `${daysLeft}d left`, color: "#22c55e" };
}

function CreditCardVisual({ card, small }) {
  const colorObj = CARD_COLORS[card.colorIndex ?? 0];
  const last4 = card.cardNumber ? card.cardNumber.slice(-4) : "••••";
  const utilization = card.limit > 0 ? ((card.balance / card.limit) * 100).toFixed(0) : 0;

  return (
    <div style={{
      background: colorObj.bg,
      borderRadius: small ? 12 : 20,
      padding: small ? "14px 16px" : "22px 24px",
      color: colorObj.text,
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
      minHeight: small ? 80 : 160,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      userSelect: "none",
    }}>
      {/* Subtle circle decoration */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: small ? 13 : 17, fontWeight: 600, letterSpacing: 0.2 }}>{card.bankName || "Bank Name"}</div>
          {!small && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>{card.cardName || "Card"}</div>}
        </div>
        <div style={{ fontSize: small ? 11 : 13, fontWeight: 700, letterSpacing: 1, opacity: 0.85 }}>{card.network || "Visa"}</div>
      </div>

      {!small && (
        <div>
          <div style={{ fontSize: 15, letterSpacing: 3, opacity: 0.8, marginBottom: 10 }}>
            •••• •••• •••• {last4}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.55, textTransform: "uppercase", letterSpacing: 1 }}>Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>৳{Number(card.balance || 0).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, opacity: 0.55, textTransform: "uppercase", letterSpacing: 1 }}>Limit</div>
              <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>৳{Number(card.limit || 0).toLocaleString()}</div>
            </div>
          </div>
          {/* Utilization bar */}
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.18)", borderRadius: 4, height: 4 }}>
            <div style={{ height: 4, borderRadius: 4, background: utilization > 70 ? "#ef4444" : "rgba(255,255,255,0.85)", width: `${Math.min(utilization, 100)}%`, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>{utilization}% utilized</div>
        </div>
      )}
    </div>
  );
}

function AddCardModal({ onSave, onClose, editCard }) {
  const [form, setForm] = useState(editCard || {
    bankName: "", cardName: "", network: "Visa", cardNumber: "",
    limit: "", balance: "", dueDay: "", colorIndex: 0,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.bankName && form.limit && form.dueDay;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1c1c1e", borderRadius: "24px 24px 0 0", padding: "28px 20px 40px",
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        color: "#fff",
      }}>
        <div style={{ width: 36, height: 4, background: "#444", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{editCard ? "Edit Card" : "Add New Card"}</div>

        {/* Card preview */}
        <div style={{ marginBottom: 20 }}>
          <CreditCardVisual card={form} />
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 16 }}>
          <Label>Card Color</Label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {CARD_COLORS.map((c, i) => (
              <div key={i} onClick={() => set("colorIndex", i)} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c.bg, cursor: "pointer",
                border: form.colorIndex === i ? "3px solid #fff" : "2px solid transparent",
                boxSizing: "border-box", flexShrink: 0,
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Bank Name *</Label>
            <Input value={form.bankName} onChange={v => set("bankName", v)} placeholder="e.g. Dutch-Bangla Bank" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Card Name</Label>
            <Input value={form.cardName} onChange={v => set("cardName", v)} placeholder="e.g. Platinum Dual" />
          </div>
          <div>
            <Label>Network</Label>
            <Select value={form.network} onChange={v => set("network", v)} options={NETWORKS} />
          </div>
          <div>
            <Label>Last 4 Digits</Label>
            <Input value={form.cardNumber} onChange={v => set("cardNumber", v.replace(/\D/g, "").slice(0, 4))} placeholder="1234" maxLength={4} />
          </div>
          <div>
            <Label>Credit Limit (৳) *</Label>
            <Input value={form.limit} onChange={v => set("limit", v.replace(/\D/g, ""))} placeholder="100000" type="number" />
          </div>
          <div>
            <Label>Current Balance (৳)</Label>
            <Input value={form.balance} onChange={v => set("balance", v.replace(/\D/g, ""))} placeholder="0" type="number" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Payment Due Day (1–31) *</Label>
            <Input value={form.dueDay} onChange={v => set("dueDay", v.replace(/\D/g, "").slice(0, 2))} placeholder="e.g. 15" type="number" min="1" max="31" />
          </div>
        </div>

        <button onClick={() => valid && onSave(form)} style={{
          marginTop: 20, width: "100%", padding: "15px", borderRadius: 14,
          background: valid ? "#0A84FF" : "#333", color: "#fff", border: "none",
          fontSize: 16, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed",
        }}>
          {editCard ? "Save Changes" : "Add Card"}
        </button>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      type={type} maxLength={maxLength}
      style={{
        width: "100%", background: "#2c2c2e", border: "none", borderRadius: 10,
        padding: "12px", color: "#fff", fontSize: 15, boxSizing: "border-box",
        outline: "none", fontFamily: "inherit",
      }} />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", background: "#2c2c2e", border: "none", borderRadius: 10,
      padding: "12px", color: "#fff", fontSize: 15, boxSizing: "border-box",
      outline: "none", fontFamily: "inherit", appearance: "none",
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CardDetailSheet({ card, onClose, onEdit, onDelete, onMarkPaid }) {
  const daysLeft = getDaysUntilDue(Number(card.dueDay));
  const { label, color } = getDueLabel(daysLeft);
  const utilization = card.limit > 0 ? ((card.balance / card.limit) * 100).toFixed(1) : 0;
  const available = (Number(card.limit) - Number(card.balance || 0));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1c1c1e", borderRadius: "24px 24px 0 0", padding: "28px 20px 44px",
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", color: "#fff",
      }}>
        <div style={{ width: 36, height: 4, background: "#444", borderRadius: 2, margin: "0 auto 20px" }} />
        <CreditCardVisual card={card} />

        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatBox label="Available" value={`৳${available.toLocaleString()}`} sub="to spend" />
          <StatBox label="Due In" value={label} sub={`Day ${card.dueDay} of month`} valueColor={color} />
          <StatBox label="Utilization" value={`${utilization}%`} sub={utilization > 70 ? "⚠ High" : "Healthy"} valueColor={utilization > 70 ? "#f97316" : "#22c55e"} />
          <StatBox label="Limit" value={`৳${Number(card.limit).toLocaleString()}`} sub="credit limit" />
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <ActionBtn label="✓  Mark as Paid" color="#22c55e" onClick={() => onMarkPaid(card)} />
          <ActionBtn label="✎  Edit Card" color="#0A84FF" onClick={() => onEdit(card)} />
          <ActionBtn label="✕  Delete Card" color="#ef4444" onClick={() => onDelete(card.id)} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, valueColor }) {
  return (
    <div style={{ background: "#2c2c2e", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: valueColor || "#fff", marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#636366", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px", borderRadius: 14,
      background: color + "22", color: color, border: `1px solid ${color}44`,
      fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [tab, setTab] = useState("cards"); // cards | summary

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) setCards(JSON.parse(res.value));
      } catch (_) {}
    })();
  }, []);

  const save = async (updated) => {
    setCards(updated);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  const addCard = (form) => {
    const newCard = { ...form, id: Date.now().toString(), balance: Number(form.balance || 0), limit: Number(form.limit), dueDay: Number(form.dueDay) };
    save([...cards, newCard]);
    setShowAdd(false);
  };

  const updateCard = (form) => {
    save(cards.map(c => c.id === form.id ? { ...form, balance: Number(form.balance || 0), limit: Number(form.limit), dueDay: Number(form.dueDay) } : c));
    setEditCard(null);
    setDetailCard(null);
  };

  const deleteCard = (id) => {
    save(cards.filter(c => c.id !== id));
    setDetailCard(null);
  };

  const markPaid = (card) => {
    save(cards.map(c => c.id === card.id ? { ...c, balance: 0 } : c));
    setDetailCard(null);
  };

  // Summary stats
  const totalLimit = cards.reduce((s, c) => s + Number(c.limit), 0);
  const totalBalance = cards.reduce((s, c) => s + Number(c.balance || 0), 0);
  const totalAvailable = totalLimit - totalBalance;
  const overallUtil = totalLimit > 0 ? ((totalBalance / totalLimit) * 100).toFixed(1) : 0;
  const upcomingDue = [...cards].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay)).slice(0, 3);

  return (
    <div style={{
      minHeight: "100vh", background: "#000", color: "#fff",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 480, margin: "0 auto", paddingBottom: 90,
    }}>
      {/* Header */}
      <div style={{ padding: "60px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 13, color: "#8e8e93", letterSpacing: 0.3 }}>MY CARDS</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{cards.length} Card{cards.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: "#0A84FF", border: "none", color: "#fff",
          borderRadius: 20, padding: "8px 16px", fontSize: 14, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        }}>+ Add</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", margin: "0 20px 20px", background: "#1c1c1e", borderRadius: 12, padding: 3 }}>
        {["cards", "summary"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px", borderRadius: 10, border: "none",
            background: tab === t ? "#2c2c2e" : "transparent",
            color: tab === t ? "#fff" : "#636366",
            fontSize: 14, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
          }}>{t === "cards" ? "Cards" : "Summary"}</button>
        ))}
      </div>

      {tab === "cards" && (
        <div style={{ padding: "0 20px" }}>
          {cards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#636366" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#8e8e93" }}>No cards yet</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Tap "Add" to add your first credit card</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {cards.map(card => {
                const daysLeft = getDaysUntilDue(Number(card.dueDay));
                const { label, color } = getDueLabel(daysLeft);
                return (
                  <div key={card.id} onClick={() => setDetailCard(card)} style={{ cursor: "pointer" }}>
                    <CreditCardVisual card={card} />
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
                      <div style={{ fontSize: 12, color: "#636366" }}>Due day {card.dueDay}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color }}>{label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "summary" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Total overview */}
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 20, padding: "20px" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Total Balance</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>৳{totalBalance.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>of ৳{totalLimit.toLocaleString()} total limit</div>
            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.15)", borderRadius: 4, height: 6 }}>
              <div style={{ height: 6, borderRadius: 4, background: overallUtil > 70 ? "#ef4444" : "#22c55e", width: `${Math.min(overallUtil, 100)}%`, transition: "width 0.4s" }} />
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{overallUtil}% overall utilization</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatBox label="Available Credit" value={`৳${totalAvailable.toLocaleString()}`} sub="across all cards" valueColor="#22c55e" />
            <StatBox label="Total Cards" value={cards.length} sub="active cards" />
          </div>

          {/* Upcoming dues */}
          {upcomingDue.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Upcoming Payments</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingDue.map(card => {
                  const daysLeft = getDaysUntilDue(Number(card.dueDay));
                  const { label, color } = getDueLabel(daysLeft);
                  return (
                    <div key={card.id} onClick={() => { setDetailCard(card); setTab("cards"); }} style={{
                      background: "#1c1c1e", borderRadius: 14, padding: "14px 16px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                    }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{card.bankName}</div>
                        <div style={{ fontSize: 12, color: "#636366", marginTop: 2 }}>৳{Number(card.balance || 0).toLocaleString()} due</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
                        <div style={{ fontSize: 11, color: "#636366", marginTop: 2 }}>Day {card.dueDay}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: "rgba(28,28,30,0.95)",
        backdropFilter: "blur(20px)", borderTop: "1px solid #2c2c2e",
        display: "flex", justifyContent: "space-around", padding: "12px 0 28px",
      }}>
        {[{ id: "cards", icon: "💳", label: "Cards" }, { id: "summary", icon: "📊", label: "Summary" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", color: tab === t.id ? "#0A84FF" : "#636366",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            fontSize: 10, fontWeight: 600, cursor: "pointer", padding: "4px 20px",
          }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Modals */}
      {showAdd && <AddCardModal onSave={addCard} onClose={() => setShowAdd(false)} />}
      {editCard && <AddCardModal editCard={editCard} onSave={updateCard} onClose={() => setEditCard(null)} />}
      {detailCard && (
        <CardDetailSheet
          card={detailCard}
          onClose={() => setDetailCard(null)}
          onEdit={(c) => { setDetailCard(null); setEditCard(c); }}
          onDelete={deleteCard}
          onMarkPaid={markPaid}
        />
      )}
    </div>
  );
}
