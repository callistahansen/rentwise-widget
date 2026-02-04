import { useState, useMemo, useEffect, useCallback, useRef } from "react";

/* ─── STYLES ─── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #fefcfd; --dark: #2a0913; --rose-50: #fbeaef; --rose-100: #f6d5df;
    --rose-200: #eeaabf; --rose-300: #e5809e; --rose-400: #dc567e; --rose-500: #d42b5e;
    --rose-600: #a9234b; --rose-700: #7f1a38; --rose-800: #551126; --rose-900: #2a0913;
    --green: #4a9a6d; --green-light: #e8f5ee; --coral: #c07060; --coral-light: #f5e8e5;
    --border: #f6d5df; --white: #fff; --warm-white: #fefdfb; --gray: #8a8a8a;
  }
  html { scroll-behavior: smooth; }
  input:focus, textarea:focus, select:focus { outline: none; border-color: var(--rose-400) !important; box-shadow: 0 0 0 3px rgba(220,86,126,0.15) !important; }
  button:focus-visible { outline: 2px solid var(--rose-400); outline-offset: 2px; }
  .card-body { overflow: hidden; max-height: 0; transition: max-height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease; opacity: 0; }
  .card-body.open { max-height: 2000px; opacity: 1; }
  .apt-card { opacity: 0; transform: translateY(12px); animation: cardIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
  @keyframes cardIn { to { opacity: 1; transform: translateY(0); } }
  .comp-cheapest { background: rgba(74,154,109,0.08) !important; color: var(--green) !important; font-weight: 600 !important; }
  input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
  input[type="date"] { -webkit-appearance: none; appearance: none; min-width: 0; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px); background: var(--dark); color: #fff; padding: 12px 20px; border-radius: 12px; font-size: 15px; font-weight: 500; z-index: 1000; opacity: 0; transition: transform 0.3s ease, opacity 0.3s ease; pointer-events: none; }
  .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
  .confirm-modal { position: fixed; inset: 0; background: rgba(42,9,19,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .confirm-modal-content { background: #fff; padding: 24px; border-radius: 16px; max-width: 340px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .photo-gallery-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.92); display: flex; flex-direction: column; z-index: 1001; }
  .photo-upload-zone { border: 2px dashed var(--rose-200); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--warm-white); }
  .photo-upload-zone:hover { border-color: var(--rose-400); background: var(--rose-50); }
  .photo-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; margin-top: 12px; }
  .photo-preview-item { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; transition: transform 0.2s ease; }
  .photo-preview-item:hover { transform: scale(1.05); }
  .photo-preview-item img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
  .photo-preview-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.6); border: none; color: #fff; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
  .photo-preview-item:hover .photo-preview-remove { opacity: 1; }
  .notes-display { white-space: pre-wrap; word-wrap: break-word; }
  textarea { resize: vertical; }
  
  /* Nav tab hover effects */
  .nav-tab { transition: all 0.2s ease; }
  .nav-tab:hover:not(:disabled):not(.active) { background: var(--rose-50) !important; transform: translateY(-1px); }
  .nav-tab.active:hover { background: linear-gradient(135deg, var(--rose-500) 0%, var(--rose-600) 100%) !important; }
  
  /* Card hover effects */
  .apt-card > div { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .apt-card:hover > div { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  
  /* Button hover effects */
  .action-btn { transition: all 0.15s ease; }
  .action-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  
  /* Table row hover */
  .compare-row { transition: background 0.15s ease; }
  .compare-row:hover { background: rgba(251,234,239,0.5); }
  
  /* Input hover */
  input:not(:focus):hover, textarea:not(:focus):hover { border-color: var(--rose-300) !important; }
`;


/* ─── DATA ─── */
const COST_CATEGORIES = [
  { key: "rent", label: "Rent", icon: "🏠", color: "#a9234b" },
  { key: "parking", label: "Parking", icon: "🅿️", color: "#d42b5e" },
  { key: "electricity", label: "Electricity", icon: "⚡", color: "#dc567e" },
  { key: "gas", label: "Gas", icon: "🔥", color: "#e5809e" },
  { key: "water", label: "Water", icon: "💧", color: "#eeaabf" },
  { key: "internet", label: "Internet", icon: "📶", color: "#f6d5df" },
  { key: "trash", label: "Trash / Waste", icon: "🗑️", color: "#7f1a38" },
  { key: "insurance", label: "Renter's Insurance", icon: "🛡️", color: "#551126" },
  { key: "laundry", label: "Laundry", icon: "👕", color: "#dc567e" },
  { key: "storage", label: "Storage Unit", icon: "📦", color: "#e5809e" },
  { key: "pet", label: "Pet Rent", icon: "🐾", color: "#7f1a38" },
  { key: "other", label: "Other", icon: "✦", color: "#a9234b" },
];

const MOVEIN_FIELDS = [
  { key: "first", label: "First Month's Rent", icon: "1️⃣" },
  { key: "last", label: "Last Month's Rent", icon: "🔚" },
  { key: "deposit", label: "Security Deposit", icon: "🏦" },
  { key: "petdeposit", label: "Pet Deposit", icon: "🐾" },
  { key: "appfee", label: "Application Fee", icon: "📝" },
  { key: "adminfee", label: "Admin Fee", icon: "📋" },
  { key: "broker", label: "Broker Fee", icon: "🤝" },
  { key: "moveother", label: "Other Move-In", icon: "📦" },
];

const emptyApartment = () => ({
  id: Date.now() + Math.random(),
  name: "", neighborhood: "", city: "", address: "", unit: "",
  sqft: "", bedrooms: "", dateAvailable: "", leaseterm: "", notes: "",
  photos: [],
  costs: Object.fromEntries(COST_CATEGORIES.map(c => [c.key, ""])),
  movein: Object.fromEntries(MOVEIN_FIELDS.map(f => [f.key, ""])),
});

function formatDate(d) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`;
}

function useToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const show = useCallback((msg) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), 2500);
  }, []);
  return { message, visible, show };
}

function useMobile(bp = 960) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth <= bp);
    c(); window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, [bp]);
  return m;
}

export default function RentWise() {
  const isMobile = useMobile();
  const toast = useToast();
  const [apartments, setApartments] = useState([emptyApartment()]);
  const [view, setView] = useState("input");
  const [activeTab, setActiveTab] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [activeSection, setActiveSection] = useState({});
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });
  const [compareSelection, setCompareSelection] = useState([]);
  const [photoGallery, setPhotoGallery] = useState({ show: false, aptId: null, photoIndex: 0 });

  // Blur number inputs on scroll so browser can't increment them — page scrolls normally
  useEffect(() => {
    const handler = (e) => {
      if (e.target && e.target.type === "number") {
        e.target.blur();
      }
    };
    document.addEventListener("wheel", handler, { passive: true });
    return () => document.removeEventListener("wheel", handler);
  }, []);

  const addApartment = useCallback(() => {
    const n = emptyApartment();
    setApartments(prev => [...prev, n]);
    setActiveTab(n.id);
    toast.show("New apartment added");
    // Scroll to the new card after it renders
    setTimeout(() => {
      const newCard = document.getElementById(`apt-card-${n.id}`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, [toast]);

  const update = useCallback((id, field, value) => {
    setApartments(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (COST_CATEGORIES.find(c => c.key === field)) return { ...a, costs: { ...a.costs, [field]: value } };
      if (MOVEIN_FIELDS.find(f => f.key === field)) return { ...a, movein: { ...a.movein, [field]: value } };
      return { ...a, [field]: value };
    }));
  }, []);

  const duplicateApartment = useCallback((apt) => {
    const dup = { ...apt, id: Date.now() + Math.random(), name: apt.name ? `${apt.name} (copy)` : "", costs: { ...apt.costs }, movein: { ...apt.movein }, photos: (apt.photos || []).map(p => ({ ...p, id: Date.now() + Math.random() })) };
    setApartments(prev => { const idx = prev.findIndex(a => a.id === apt.id); const arr = [...prev]; arr.splice(idx + 1, 0, dup); return arr; });
    setActiveTab(dup.id);
    toast.show("Apartment duplicated");
  }, [toast]);

  const removeApartment = useCallback((id) => {
    setApartments(prev => prev.filter(a => a.id !== id));
    if (activeTab === id) setActiveTab(null);
    setCompareSelection(prev => prev.filter(cid => cid !== id));
    toast.show("Apartment removed");
  }, [activeTab, toast]);

  const confirmRemoveApartment = useCallback((apt) => {
    const aptName = apt.name || `Apartment ${apartments.findIndex(a => a.id === apt.id) + 1}`;
    setConfirmModal({
      show: true,
      title: "Remove Apartment",
      message: `Are you sure you want to remove "${aptName}"? This cannot be undone.`,
      confirmText: "Remove",
      onConfirm: () => {
        removeApartment(apt.id);
        setConfirmModal({ show: false, message: "", onConfirm: null });
      }
    });
  }, [apartments, removeApartment]);

  const moveApartment = useCallback((id, dir) => {
    setApartments(prev => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx === -1 || (dir === "up" && idx === 0) || (dir === "down" && idx === prev.length - 1)) return prev;
      const arr = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return arr;
    });
  }, []);

  const toggleCompareSelection = useCallback((id) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const addPhotos = useCallback((aptId, files) => {
    const maxSize = 2 * 1024 * 1024;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= maxSize);
    if (valid.length === 0) { toast.show("Please select valid images (max 2MB each)"); return; }
    valid.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photo = { id: Date.now() + Math.random(), data: e.target.result, name: file.name };
        setApartments(prev => prev.map(a => a.id !== aptId ? a : { ...a, photos: [...(a.photos || []), photo] }));
      };
      reader.readAsDataURL(file);
    });
    toast.show(`Adding ${valid.length} photo${valid.length > 1 ? 's' : ''}...`);
  }, [toast]);

  const removePhoto = useCallback((aptId, photoId) => {
    setApartments(prev => prev.map(a => a.id !== aptId ? a : { ...a, photos: (a.photos || []).filter(p => p.id !== photoId) }));
    toast.show("Photo removed");
  }, [toast]);

  const openPhotoGallery = useCallback((aptId, idx = 0) => setPhotoGallery({ show: true, aptId, photoIndex: idx }), []);
  const closePhotoGallery = useCallback(() => setPhotoGallery({ show: false, aptId: null, photoIndex: 0 }), []);
  const navigateGallery = useCallback((dir) => {
    setPhotoGallery(prev => {
      const apt = apartments.find(a => a.id === prev.aptId);
      if (!apt?.photos) return prev;
      const newIdx = prev.photoIndex + dir;
      if (newIdx < 0 || newIdx >= apt.photos.length) return prev;
      return { ...prev, photoIndex: newIdx };
    });
  }, [apartments]);

  const clearAll = useCallback(() => {
    setConfirmModal({ show: true, title: "Reset All Apartments", message: "Are you sure you want to reset all apartments? This cannot be undone.", confirmText: "Reset All", onConfirm: () => { setApartments([emptyApartment()]); setActiveTab(null); setShowComparison(false); setConfirmModal({ show: false, message: "", onConfirm: null }); toast.show("All apartments cleared"); } });
  }, [toast]);

  useEffect(() => {
    const handler = (e) => {
      if (photoGallery.show) {
        if (e.key === "Escape") { closePhotoGallery(); return; }
        if (e.key === "ArrowLeft") { navigateGallery(-1); return; }
        if (e.key === "ArrowRight") { navigateGallery(1); return; }
      }
      if (e.key === "Escape") {
        if (confirmModal.show) setConfirmModal({ show: false, message: "", onConfirm: null });
        else if (showComparison) setShowComparison(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [photoGallery.show, confirmModal.show, showComparison, closePhotoGallery, navigateGallery]);

  const getTotal = useCallback((apt) => COST_CATEGORIES.reduce((s, c) => s + (parseFloat(apt.costs[c.key]) || 0), 0), []);
  const getMoveInTotal = useCallback((apt) => MOVEIN_FIELDS.reduce((s, f) => s + (parseFloat(apt.movein[f.key]) || 0), 0), []);

  const sorted = useMemo(() => [...apartments].sort((a, b) => getTotal(a) - getTotal(b)), [apartments, getTotal]);
  const filledApts = useMemo(() => apartments.filter(a => getTotal(a) > 0), [apartments, getTotal]);
  const cheapestId = filledApts.length > 1 ? sorted.find(a => getTotal(a) > 0)?.id : null;
  const expensiveId = filledApts.length > 1 ? [...sorted].reverse().find(a => getTotal(a) > 0)?.id : null;

  const neighborhoodGroups = useMemo(() => {
    const groups = {};
    filledApts.forEach(apt => { const k = (apt.neighborhood || "").trim(); if (!k) return; if (!groups[k]) groups[k] = []; groups[k].push(apt); });
    Object.keys(groups).forEach(k => groups[k].sort((a,b) => getTotal(a) - getTotal(b)));
    return groups;
  }, [filledApts, getTotal]);
  const neighborhoodNames = Object.keys(neighborhoodGroups).sort();
  const hasMultiNeighborhoods = neighborhoodNames.length >= 2;

  const activeNav = view === "input" && showComparison ? "compare" : view;
  const galleryApt = apartments.find(a => a.id === photoGallery.aptId);
  const galleryPhotos = galleryApt?.photos || [];
  const currentPhoto = galleryPhotos[photoGallery.photoIndex];

  const cheapestPerCat = useMemo(() => {
    const map = {};
    COST_CATEGORIES.forEach(cat => {
      const vals = filledApts.map(a => ({ id: a.id, v: parseFloat(a.costs[cat.key]) || 0 })).filter(x => x.v > 0);
      if (vals.length > 1) { vals.sort((a, b) => a.v - b.v); map[cat.key] = vals[0].id; }
    });
    return map;
  }, [filledApts]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "'DM Sans', sans-serif", color: "var(--dark)" }}>
      <style>{styles}</style>

      {/* Toast */}
      <div className={`toast ${toast.visible ? "show" : ""}`}>{toast.message}</div>

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="confirm-modal" onClick={() => setConfirmModal({ show: false, message: "", onConfirm: null })}>
          <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 12, color: "var(--dark)" }}>{confirmModal.title || "Confirm"}</div>
            <div style={{ fontSize: 15, color: "var(--rose-800)", marginBottom: 20, lineHeight: 1.5 }}>{confirmModal.message}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal({ show: false, message: "", onConfirm: null })} style={{ flex: 1, padding: "10px 16px", border: "1px solid var(--rose-200)", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 500, color: "var(--rose-700)", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={confirmModal.onConfirm} style={{ flex: 1, padding: "10px 16px", border: "none", borderRadius: 10, background: "var(--coral)", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>{confirmModal.confirmText || "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {photoGallery.show && (
        <div className="photo-gallery-modal" onClick={closePhotoGallery}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "'DM Serif Display', serif" }}>{galleryApt?.name || "Apartment Photos"}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{galleryPhotos.length > 0 ? `${photoGallery.photoIndex + 1} of ${galleryPhotos.length}` : "No photos"}</div>
            </div>
            <button onClick={closePhotoGallery} style={{ background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", padding: "4px 12px" }}>×</button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }} onClick={e => e.stopPropagation()}>
            {currentPhoto ? (
              <>
                <button onClick={() => navigateGallery(-1)} disabled={photoGallery.photoIndex === 0} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 32, padding: "20px 14px", cursor: "pointer", borderRadius: 8, opacity: photoGallery.photoIndex === 0 ? 0.3 : 1 }}>‹</button>
                <img src={currentPhoto.data} alt={currentPhoto.name} style={{ maxWidth: "90%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} />
                <button onClick={() => navigateGallery(1)} disabled={photoGallery.photoIndex === galleryPhotos.length - 1} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 32, padding: "20px 14px", cursor: "pointer", borderRadius: 8, opacity: photoGallery.photoIndex === galleryPhotos.length - 1 ? 0.3 : 1 }}>›</button>
              </>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>No photos uploaded yet</div>
            )}
          </div>
          {galleryPhotos.length > 1 && (
            <div style={{ padding: 16, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", background: "rgba(0,0,0,0.5)", maxHeight: 110, overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              {galleryPhotos.map((photo, idx) => (
                <img key={photo.id} src={photo.data} alt="" onClick={() => setPhotoGallery(prev => ({ ...prev, photoIndex: idx }))} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: idx === photoGallery.photoIndex ? "2px solid var(--rose-400)" : "2px solid transparent" }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header style={{ position: "relative", overflow: "hidden", padding: isMobile ? "28px 18px 22px" : "52px 40px 38px", background: "linear-gradient(135deg, #fbeaef 0%, #f6d5df 100%)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 75% 40%, rgba(220,86,126,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: isMobile ? 10.5 : 12, letterSpacing: 3.5, textTransform: "uppercase", color: "var(--rose-600)", marginBottom: 10, fontWeight: 600 }}>RentWise</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 26 : 42, fontWeight: 400, color: "var(--rose-900)", lineHeight: 1.15, letterSpacing: -0.5 }}>
            True Monthly Cost <span style={{ fontStyle: "italic", color: "var(--rose-500)" }}>Calculator</span>
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: "var(--rose-800)", marginTop: 12, lineHeight: 1.6, maxWidth: 600 }}>
            Compare the real all-in cost of every apartment — rent, utilities, parking, and everything in between.
          </p>
          {filledApts.length > 0 && (
            <div style={{ display: "flex", gap: isMobile ? "14px 18px" : 24, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(220,86,126,0.2)", flexWrap: "wrap" }}>
              {[
                { label: "Apartments", value: apartments.length },
                { label: "Avg Monthly", value: `$${Math.round(filledApts.reduce((s,a) => s + getTotal(a), 0) / filledApts.length).toLocaleString()}` },
                { label: "Range", value: filledApts.length > 1 ? `$${getTotal(sorted.find(a=>getTotal(a)>0)||sorted[0]).toLocaleString()} – $${getTotal([...sorted].reverse().find(a=>getTotal(a)>0)||sorted[0]).toLocaleString()}` : "—" },
                ...(neighborhoodNames.length > 0 ? [{ label: "Areas", value: neighborhoodNames.length }] : []),
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: isMobile ? 9.5 : 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--rose-600)", fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: isMobile ? 15 : 19, fontWeight: 700, color: "var(--rose-900)", marginTop: 3 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Nav */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "16px 14px 0" : "24px 40px 0" }}>
        <div style={{ display: "flex", gap: 5, background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid var(--rose-100)", boxShadow: "0 2px 8px rgba(212,43,94,0.06)" }}>
          {[
            { key: "input", label: "✏️ Input", sub: "Add & edit" },
            { key: "cards", label: "🗂️ My Apartments", sub: filledApts.length > 0 ? `${filledApts.length} saved` : "Summary view" },
            { key: "neighborhoods", label: "📍 By Area", sub: hasMultiNeighborhoods ? `${neighborhoodNames.length} areas` : "Need 2+ areas", disabled: !hasMultiNeighborhoods },
            { key: "compare", label: "📊 Compare", sub: filledApts.length > 1 ? "Side-by-side" : "Need 2+ apts", disabled: filledApts.length < 2 },
          ].map(tab => {
            const isActive = activeNav === tab.key;
            return (
              <button key={tab.key} className={`nav-tab ${isActive ? "active" : ""}`} onClick={() => {
                if (tab.disabled) return;
                if (tab.key === "compare") { setView("input"); setShowComparison(true); }
                else { setView(tab.key); setShowComparison(false); setCompareSelection([]); }
              }} disabled={tab.disabled} style={{
                flex: 1, padding: isMobile ? "8px 3px" : "11px 8px", border: "none", borderRadius: 9, cursor: tab.disabled ? "default" : "pointer",
                background: isActive ? "linear-gradient(135deg, var(--rose-500) 0%, var(--rose-600) 100%)" : "transparent",
                color: isActive ? "#fff" : tab.disabled ? "#ccc" : "var(--rose-900)",
                fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 10 : 13, fontWeight: 600, textAlign: "center", lineHeight: 1.3, opacity: tab.disabled ? 0.5 : 1
              }}>
                {tab.label}
                {!isMobile && <div style={{ fontSize: 15, fontWeight: 400, opacity: 0.6, marginTop: 1 }}>{tab.sub}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "18px 14px 60px" : "28px 40px 80px" }}>

        {/* ═══════ CARDS VIEW ═══════ */}
        {view === "cards" && (
          filledApts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "72px 24px", background: "#fff", borderRadius: 18, border: "1.5px solid var(--rose-200)" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🏠</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--dark)", marginBottom: 5 }}>No apartments yet</div>
              <div style={{ fontSize: 14, color: "var(--rose-700)", marginBottom: 20 }}>Add your first apartment to see it here.</div>
              <button onClick={() => setView("input")} style={{ padding: "10px 20px", border: "none", borderRadius: 10, background: "linear-gradient(135deg, var(--rose-500) 0%, var(--rose-600) 100%)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Go to Input</button>
            </div>
          ) : (
            <>
              {filledApts.length > 1 && (
                <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--rose-50)", borderRadius: 10, fontSize: 15, color: "var(--rose-700)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>↕️</span><span>Use the arrow buttons on each card to reorder your apartments</span>
                </div>
              )}
              {filledApts.map((apt, idx) => {
                const total = getTotal(apt);
                const moveInTotal = getMoveInTotal(apt);
                const isCheapest = apt.id === cheapestId;
                const isMostExpensive = apt.id === expensiveId;
                const monthlyCosts = COST_CATEGORIES.filter(c => parseFloat(apt.costs[c.key]) > 0);
                const moveInItems = MOVEIN_FIELDS.filter(f => parseFloat(apt.movein[f.key]) > 0);
                const aptIndex = apartments.findIndex(a => a.id === apt.id);

                return (
                  <div key={apt.id} className="apt-card" style={{ marginBottom: 16, animationDelay: `${idx * 0.07}s` }}>
                    <div style={{ background: "#fff", borderRadius: 18, border: isCheapest ? "1.5px solid var(--green)" : isMostExpensive ? "1.5px solid var(--coral)" : "1.5px solid var(--border)", overflow: "hidden", boxShadow: "0 3px 16px rgba(0,0,0,0.05)" }}>
                      <div style={{ background: "linear-gradient(135deg, #fbeaef 0%, #f6d5df 100%)", padding: isMobile ? "16px 18px 14px" : "20px 22px 16px", position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                              {isCheapest && <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, background: "var(--green)", color: "#fff", padding: "3px 9px", borderRadius: 4 }}>✓ Lowest Cost</span>}
                              {isMostExpensive && <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, background: "#dc567e", color: "#fff", padding: "3px 9px", borderRadius: 4 }}>⚠ Highest Cost</span>}
                              {apt.neighborhood && <span style={{ fontSize: 15, letterSpacing: 0.8, color: "var(--rose-700)", background: "rgba(220,86,126,0.15)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>📍 {apt.neighborhood}</span>}
                            </div>
                            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 19 : 24, color: "var(--rose-900)", lineHeight: 1.2 }}>{apt.name || `Apartment ${aptIndex + 1}`}</div>
                            <div style={{ fontSize: 15, color: "var(--rose-700)", marginTop: 5 }}>
                              {[apt.address, apt.unit && `Unit ${apt.unit}`, apt.city, apt.bedrooms && apt.sqft && `${apt.bedrooms}BR · ${apt.sqft} sqft`, apt.leaseterm && `${apt.leaseterm} mo lease`, apt.dateAvailable && `Available ${formatDate(apt.dateAvailable)}`].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 23 : 32, color: "var(--rose-600)", lineHeight: 1 }}>${total.toLocaleString()}</div>
                              <div style={{ fontSize: 15, color: "var(--rose-600)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2, fontWeight: 600 }}>/month</div>
                            </div>
                            {apartments.length > 1 && (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => moveApartment(apt.id, "up")} disabled={aptIndex === 0} style={{ width: 28, height: 28, border: "1px solid var(--rose-200)", borderRadius: 6, background: aptIndex === 0 ? "var(--rose-50)" : "#fff", cursor: aptIndex === 0 ? "default" : "pointer", color: aptIndex === 0 ? "#ccc" : "var(--rose-600)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans'" }}>↑</button>
                                <button onClick={() => moveApartment(apt.id, "down")} disabled={aptIndex === apartments.length - 1} style={{ width: 28, height: 28, border: "1px solid var(--rose-200)", borderRadius: 6, background: aptIndex === apartments.length - 1 ? "var(--rose-50)" : "#fff", cursor: aptIndex === apartments.length - 1 ? "default" : "pointer", color: aptIndex === apartments.length - 1 ? "#ccc" : "var(--rose-600)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans'" }}>↓</button>
                              </div>
                            )}
                          </div>
                        </div>
                        {total > 0 && (
                          <div style={{ height: 5, marginTop: 14, background: "rgba(220,86,126,0.15)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
                            {COST_CATEGORIES.map(cat => { const v = parseFloat(apt.costs[cat.key]) || 0; const pct = (v / total) * 100; return pct > 0 ? <div key={cat.key} style={{ width: `${pct}%`, background: cat.color }} /> : null; })}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: isMobile ? "16px 16px 18px" : "20px 22px 22px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr 0.9fr", gap: isMobile ? 14 : 20 }}>
                        <div>
                          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--rose-500)", fontWeight: 600, marginBottom: 11 }}>💰 Monthly</div>
                          {monthlyCosts.map(cat => { const v = parseFloat(apt.costs[cat.key]) || 0; const pct = (v / total) * 100; return (
                            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                              <span style={{ fontSize: 14, width: 22, textAlign: "center" }}>{cat.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                                  <span style={{ fontSize: 15, color: "#3a3a3a" }}>{cat.label}</span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--dark)" }}>${v.toLocaleString()}</span>
                                </div>
                                <div style={{ height: 3, background: "var(--cream)", borderRadius: 2, marginTop: 4 }}><div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: 2 }} /></div>
                              </div>
                            </div>
                          ); })}
                          {monthlyCosts.length === 0 && <div style={{ fontSize: 15, color: "#bbb", fontStyle: "italic" }}>No costs entered</div>}
                          {apt.sqft && total > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 9, borderTop: "1px solid var(--rose-200)", fontSize: 14, color: "var(--rose-700)" }}>
                              <span style={{ fontWeight: 600, color: "var(--dark)" }}>${(total / Number(apt.sqft)).toFixed(2)}</span> per sqft/mo
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--rose-400)", fontWeight: 600, marginBottom: 11 }}>📋 Move-In</div>
                          {moveInItems.map(f => { const v = parseFloat(apt.movein[f.key]) || 0; return (
                            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                              <span style={{ fontSize: 14, width: 22, textAlign: "center" }}>{f.icon}</span>
                              <span style={{ flex: 1, fontSize: 15, color: "#3a3a3a" }}>{f.label}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--rose-400)" }}>${v.toLocaleString()}</span>
                            </div>
                          ); })}
                          {moveInItems.length === 0 && <div style={{ fontSize: 15, color: "#bbb", fontStyle: "italic" }}>No move-in fees</div>}
                          {moveInTotal > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 9, borderTop: "1px solid var(--rose-200)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 14, color: "var(--rose-700)" }}>Total</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--rose-400)" }}>${moveInTotal.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--rose-700)", fontWeight: 600, marginBottom: 11 }}>📝 Notes</div>
                          <div className="notes-display" style={{ flex: 1, fontSize: 15, color: "#5a5a5a", lineHeight: 1.6 }}>{apt.notes || <span style={{ color: "#bbb", fontStyle: "italic" }}>No notes</span>}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                            {apt.photos?.length > 0 && (
                              <button onClick={() => openPhotoGallery(apt.id, 0)} style={{ padding: "7px 13px", border: "1px solid var(--rose-300)", borderRadius: 8, background: "linear-gradient(135deg, #fbeaef 0%, #f6d5df 100%)", cursor: "pointer", fontSize: 15, color: "var(--rose-700)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>📷 {apt.photos.length} Photo{apt.photos.length > 1 ? "s" : ""}</button>
                            )}
                            <button onClick={() => { setView("input"); setShowComparison(false); setActiveTab(apt.id); }} style={{ padding: "7px 13px", border: "1px solid var(--rose-200)", borderRadius: 8, background: "var(--cream)", cursor: "pointer", fontSize: 15, color: "var(--rose-700)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>✏️ Edit</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )
        )}

        {/* ═══════ INPUT VIEW ═══════ */}
        {view === "input" && !showComparison && (
          <>
            {apartments.length === 1 && getTotal(apartments[0]) === 0 && (
              <div style={{ marginBottom: 16, padding: isMobile ? "14px 16px" : "18px 22px", background: "linear-gradient(135deg, #fbeaef 0%, #f6d5df 100%)", borderRadius: 14, border: "1px solid rgba(220,86,126,0.2)" }}>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600, color: "var(--rose-900)", marginBottom: isMobile ? 6 : 8 }}>Welcome to RentWise ✨</div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: "var(--rose-800)", lineHeight: 1.65 }}>Finding your next home is exciting, and you should have a clear understanding of your real month-to-month costs for your next dream apartment! We'll help you organize, compare, and see the full picture — so you can focus on finding <em>the one</em>.</div>
              </div>
            )}

            {apartments.map((apt, idx) => {
              const total = getTotal(apt);
              const moveInTotal = getMoveInTotal(apt);
              const isOpen = activeTab === apt.id;
              const isCheapest = apt.id === cheapestId;
              const isMostExpensive = apt.id === expensiveId;
              const section = activeSection[apt.id] || "costs";

              return (
                <div key={apt.id} id={`apt-card-${apt.id}`} className="apt-card" style={{ marginBottom: 12, animationDelay: `${idx * 0.06}s` }}>
                  <div style={{ background: "#fff", borderRadius: 16, border: isCheapest ? "1.5px solid var(--green)" : isMostExpensive ? "1.5px solid var(--coral)" : "1.5px solid var(--border)", overflow: "hidden", boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
                    {(isCheapest || isMostExpensive) && (
                      <div style={{ fontSize: isMobile ? 9 : 11, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 600, background: isCheapest ? "var(--green-light)" : "var(--coral-light)", color: isCheapest ? "var(--green)" : "var(--coral)", padding: isMobile ? "4px 14px" : "5px 16px" }}>{isCheapest ? "✓  Lowest True Cost" : "⚠  Highest True Cost"}</div>
                    )}
                    <div onClick={() => setActiveTab(isOpen ? null : apt.id)} style={{ cursor: "pointer", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, userSelect: "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: isOpen ? "linear-gradient(135deg, var(--rose-500) 0%, var(--rose-600) 100%)" : "var(--rose-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: isOpen ? "#fff" : "var(--dark)" }}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{apt.name || <span style={{ color: "#bbb", fontWeight: 400, fontStyle: "italic" }}>Apartment {idx + 1}</span>}</div>
                        <div style={{ fontSize: 15, color: "var(--rose-700)", marginTop: 2 }}>{[apt.neighborhood, apt.city, apt.address].filter(Boolean).join(" · ") || "No address yet"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: isMobile ? 20 : 23, fontFamily: "'DM Serif Display', serif", color: total > 0 ? "var(--dark)" : "#ccc" }}>{total > 0 ? `$${total.toLocaleString()}` : "—"}</div>
                        <div style={{ fontSize: 15, color: "var(--rose-700)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 500 }}>/mo</div>
                      </div>
                      <div style={{ fontSize: 14, color: "#b5afa6", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</div>
                    </div>

                    {total > 0 && (
                      <div style={{ height: 4, margin: "0 20px", background: "var(--cream)", borderRadius: 2, overflow: "hidden", display: "flex" }}>
                        {COST_CATEGORIES.map(cat => { const v = parseFloat(apt.costs[cat.key]) || 0; const pct = (v / total) * 100; return pct > 0 ? <div key={cat.key} style={{ width: `${pct}%`, background: cat.color }} /> : null; })}
                      </div>
                    )}

                    <div className={`card-body ${isOpen ? "open" : ""}`}>
                      <div style={{ padding: isMobile ? "18px 16px 16px" : "22px 20px 20px" }}>
                        {/* Meta inputs */}
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 8 : 10 }}>
                          <MetaInput label="Name / Label" value={apt.name} onChange={v => update(apt.id, "name", v)} placeholder="e.g. Silver Lake Loft" isMobile={isMobile} />
                          <MetaInput label="Neighborhood / Area" value={apt.neighborhood} onChange={v => update(apt.id, "neighborhood", v)} placeholder="e.g. Silver Lake" isMobile={isMobile} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 0.8fr 0.8fr", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 8 : 10 }}>
                          <MetaInput label="Street Address" value={apt.address} onChange={v => update(apt.id, "address", v)} placeholder="e.g. 1234 Fountain Ave" isMobile={isMobile} />
                          <MetaInput label="Unit #" value={apt.unit} onChange={v => update(apt.id, "unit", v)} placeholder="e.g. 4B" isMobile={isMobile} />
                          <MetaInput label="City" value={apt.city} onChange={v => update(apt.id, "city", v)} placeholder="e.g. Los Angeles" isMobile={isMobile} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1.2fr", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 18 : 22 }}>
                          <MetaInput label="Bedrooms" value={apt.bedrooms} onChange={v => update(apt.id, "bedrooms", v)} placeholder="e.g. 1" type="number" isMobile={isMobile} />
                          <MetaInput label="Square Footage" value={apt.sqft} onChange={v => update(apt.id, "sqft", v)} placeholder="e.g. 650" type="number" isMobile={isMobile} />
                          <MetaInput label="Lease (months)" value={apt.leaseterm} onChange={v => update(apt.id, "leaseterm", v)} placeholder="e.g. 12" type="number" isMobile={isMobile} />
                          <MetaInput label="Date Available" value={apt.dateAvailable} onChange={v => update(apt.id, "dateAvailable", v)} type="date" isMobile={isMobile} />
                        </div>

                        {/* Section tabs */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                          {["costs", "movein"].map(tab => (
                            <button key={tab} onClick={() => setActiveSection(prev => ({ ...prev, [apt.id]: tab }))} style={{ padding: isMobile ? "5px 12px" : "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: isMobile ? 12 : 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", background: section === tab ? "var(--dark)" : "var(--cream)", color: section === tab ? "#fff" : "var(--gray)" }}>
                              {tab === "costs" ? "💰 Monthly" : "📋 Move-In"}{tab === "movein" && moveInTotal > 0 && <span style={{ marginLeft: 6, opacity: 0.7 }}>${moveInTotal.toLocaleString()}</span>}
                            </button>
                          ))}
                        </div>

                        {/* Costs */}
                        {section === "costs" && (
                          <>
                            <div style={{ fontSize: isMobile ? 9.5 : 11, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--rose-700)", fontWeight: 600, marginBottom: 10 }}>Monthly Costs</div>
                            {COST_CATEGORIES.map(cat => {
                              const val = parseFloat(apt.costs[cat.key]) || 0;
                              return (
                                <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, padding: "7px 0", borderBottom: cat.key === "rent" ? "1.5px solid var(--rose-500)" : "1px solid var(--border)" }}>
                                  <span style={{ fontSize: isMobile ? 15 : 17, width: isMobile ? 22 : 26, textAlign: "center" }}>{cat.icon}</span>
                                  <label style={{ flex: 1, fontSize: isMobile ? 13 : 15, color: cat.key === "rent" ? "var(--dark)" : "#3a3a3a", fontWeight: cat.key === "rent" ? 600 : 400 }}>{cat.label}</label>
                                  <div style={{ position: "relative", width: isMobile ? 100 : 120 }}>
                                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb", fontSize: 13 }}>$</span>
                                    <input type="number" min="0" value={apt.costs[cat.key]} onChange={e => update(apt.id, cat.key, e.target.value)} placeholder="0" style={{ width: "100%", padding: isMobile ? "8px 10px 8px 24px" : "10px 12px 10px 28px", border: cat.key === "rent" ? "1.5px solid var(--rose-500)" : "1px solid var(--border)", borderRadius: 8, fontSize: isMobile ? 13 : 15, fontFamily: "'DM Sans', sans-serif", background: cat.key === "rent" ? "var(--rose-50)" : "var(--warm-white)", color: "var(--dark)" }} />
                                  </div>
                                  <span style={{ fontSize: 14, color: "var(--rose-700)", width: 36, textAlign: "right" }}>{val > 0 && total > 0 ? `${((val / total) * 100).toFixed(0)}%` : ""}</span>
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "2px solid var(--dark)" }}>
                              <span style={{ fontSize: 15, fontWeight: 600 }}>True Monthly Total</span>
                              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "var(--dark)" }}>${total.toLocaleString()}</span>
                            </div>
                            {apt.sqft && total > 0 && <div style={{ textAlign: "right", fontSize: isMobile ? 11 : 15, color: "var(--rose-700)", marginTop: 4 }}>${(total / Number(apt.sqft)).toFixed(2)} per sqft/mo</div>}
                          </>
                        )}

                        {/* Move-in */}
                        {section === "movein" && (
                          <>
                            <div style={{ fontSize: isMobile ? 9.5 : 11, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--rose-700)", fontWeight: 600, marginBottom: 10 }}>Move-In Costs</div>
                            {MOVEIN_FIELDS.map(f => (
                              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, padding: "7px 0", borderBottom: "1px solid var(--rose-200)" }}>
                                <span style={{ fontSize: isMobile ? 15 : 17, width: isMobile ? 22 : 26, textAlign: "center" }}>{f.icon}</span>
                                <label style={{ flex: 1, fontSize: isMobile ? 13 : 15, color: "#3a3a3a" }}>{f.label}</label>
                                <div style={{ position: "relative", width: isMobile ? 100 : 120 }}>
                                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb", fontSize: 13 }}>$</span>
                                  <input type="number" min="0" value={apt.movein[f.key]} onChange={e => update(apt.id, f.key, e.target.value)} placeholder="0" style={{ width: "100%", padding: isMobile ? "8px 10px 8px 24px" : "10px 12px 10px 28px", border: "1px solid var(--rose-200)", borderRadius: 8, fontSize: isMobile ? 13 : 15, fontFamily: "'DM Sans', sans-serif", background: "var(--warm-white)", color: "var(--dark)" }} />
                                </div>
                                <span style={{ width: isMobile ? 0 : 36 }} />
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "2px solid var(--dark)" }}>
                              <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600 }}>Total Move-In Cost</span>
                              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 20 : 24, color: "var(--dark)" }}>${moveInTotal.toLocaleString()}</span>
                            </div>
                          </>
                        )}

                        {/* Notes */}
                        <div style={{ marginTop: isMobile ? 14 : 18 }}>
                          <label style={{ display: "block", fontSize: isMobile ? 9.5 : 11, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--rose-700)", fontWeight: 600, marginBottom: 6 }}>Notes</label>
                          <textarea value={apt.notes} onChange={e => update(apt.id, "notes", e.target.value)} placeholder="Lease terms, agent contact, move-in timeline, vibe..." style={{ width: "100%", border: "1px solid var(--rose-200)", borderRadius: 10, padding: isMobile ? "10px 12px" : "12px 14px", fontSize: isMobile ? 13 : 15, fontFamily: "'DM Sans', sans-serif", color: "#3a3a3a", minHeight: isMobile ? 56 : 70, background: "var(--warm-white)", lineHeight: 1.6 }} />
                        </div>

                        {/* Photos */}
                        <div style={{ marginTop: isMobile ? 14 : 18 }}>
                          <div style={{ fontSize: isMobile ? 9.5 : 11, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--rose-700)", fontWeight: 600, marginBottom: 6 }}>📷 Photos {apt.photos?.length > 0 && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({apt.photos.length})</span>}</div>
                          <div className="photo-upload-zone" onClick={() => document.getElementById(`photo-${apt.id}`).click()}>
                            <input type="file" id={`photo-${apt.id}`} accept="image/*" multiple style={{ display: "none" }} onChange={e => addPhotos(apt.id, e.target.files)} />
                            <div style={{ fontSize: isMobile ? 20 : 24, marginBottom: 6 }}>📸</div>
                            <div style={{ fontSize: isMobile ? 12 : 14, color: "var(--rose-700)", fontWeight: 500 }}>Click or drag photos here</div>
                            <div style={{ fontSize: isMobile ? 10 : 14, color: "var(--rose-600)", marginTop: 4 }}>Listing photos, in-person shots, floor plans...</div>
                          </div>
                          {apt.photos?.length > 0 && (
                            <div className="photo-preview-grid">
                              {apt.photos.map((photo, pidx) => (
                                <div key={photo.id} className="photo-preview-item">
                                  <img src={photo.data} alt="" onClick={() => openPhotoGallery(apt.id, pidx)} />
                                  <button className="photo-preview-remove" onClick={() => removePhoto(apt.id, photo.id)}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                          <button onClick={() => duplicateApartment(apt)} style={{ background: "none", border: "1px solid var(--rose-200)", borderRadius: 8, color: "var(--rose-700)", fontSize: isMobile ? 12 : 15, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", padding: "6px 12px", fontWeight: 500 }}>📋 Duplicate</button>
                          {apartments.length > 1 && <button onClick={() => confirmRemoveApartment(apt)} style={{ background: "none", border: "none", color: "var(--coral)", fontSize: isMobile ? 12 : 15, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}>✕ Remove</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="action-btn" onClick={addApartment} style={{ flex: 1, padding: isMobile ? 12 : 14, border: "1.5px dashed var(--border)", borderRadius: 14, background: "transparent", cursor: "pointer", color: "var(--rose-700)", fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 13 : 15, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ fontSize: 18 }}>+</span> Add Apartment</button>
              {apartments.length > 1 && <button className="action-btn" onClick={clearAll} style={{ padding: isMobile ? "12px 14px" : "14px 16px", border: "1.5px solid var(--rose-200)", borderRadius: 14, background: "transparent", cursor: "pointer", color: "var(--rose-700)", fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 12 : 14 }}>Reset All</button>}
            </div>
          </>
        )}

        {/* ═══════ COMPARE VIEW ═══════ */}
        {view === "input" && showComparison && filledApts.length > 1 && (() => {
          const compareApts = compareSelection.length === 2 ? apartments.filter(a => compareSelection.includes(a.id) && getTotal(a) > 0) : sorted.filter(a => getTotal(a) > 0);
          const compareSorted = [...compareApts].sort((a, b) => getTotal(a) - getTotal(b));
          const compareChId = compareSorted.length > 1 ? compareSorted[0]?.id : null;
          const compareExpId = compareSorted.length > 1 ? compareSorted[compareSorted.length - 1]?.id : null;
          const compareSavings = compareSorted.length >= 2 ? getTotal(compareSorted[compareSorted.length - 1]) - getTotal(compareSorted[0]) : 0;
          const allSorted = sorted.filter(a => getTotal(a) > 0);

          // Per-category cheapest for selected apartments
          const compareCheapPerCat = {};
          COST_CATEGORIES.forEach(cat => {
            const vals = compareSorted.map(a => ({ id: a.id, v: parseFloat(a.costs[cat.key]) || 0 })).filter(x => x.v > 0);
            if (vals.length > 1) { vals.sort((a, b) => a.v - b.v); compareCheapPerCat[cat.key] = vals[0].id; }
          });

          return (
            <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid var(--rose-200)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: isMobile ? "12px 16px" : "15px 20px", background: "linear-gradient(135deg, #fbeaef 0%, #f6d5df 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--rose-600)", fontWeight: 600 }}>{compareSelection.length === 2 ? "Head-to-Head Comparison" : "Side-by-Side Comparison"}</span>
                  {filledApts.length > 2 && compareSelection.length !== 2 && <div style={{ fontSize: 15, color: "var(--rose-700)", marginTop: 2 }}>Check 2 boxes below to compare head-to-head</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {compareSelection.length > 0 && <button onClick={() => setCompareSelection([])} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", border: "1px solid var(--rose-300)", background: "#fff", color: "var(--rose-600)" }}>Show All</button>}
                  <span style={{ fontSize: 15, color: "var(--rose-700)" }}>{compareSelection.length === 2 ? "2 selected" : "sorted low → high"}</span>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    {filledApts.length > 2 && (
                      <tr style={{ borderBottom: "1px solid var(--rose-100)", background: "#fefcfd" }}>
                        <th style={{ padding: "8px 16px" }}></th>
                        {allSorted.map(apt => (
                          <th key={apt.id} style={{ padding: "8px 12px", textAlign: "center" }}>
                            <input type="checkbox" checked={compareSelection.includes(apt.id)} disabled={compareSelection.length >= 2 && !compareSelection.includes(apt.id)} onChange={() => toggleCompareSelection(apt.id)} style={{ width: 16, height: 16, accentColor: "var(--rose-500)", cursor: compareSelection.length >= 2 && !compareSelection.includes(apt.id) ? "default" : "pointer" }} />
                          </th>
                        ))}
                      </tr>
                    )}
                    <tr style={{ borderBottom: "1px solid var(--rose-200)", background: "#faf8f5" }}>
                      <th style={{ textAlign: "left", padding: "10px 16px", color: "var(--rose-700)", fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.8, width: "36%" }}>Category</th>
                      {compareSorted.map(apt => (
                        <th key={apt.id} style={{ textAlign: "right", padding: "10px 12px", fontSize: 14, fontWeight: 600, color: apt.id === compareChId ? "var(--green)" : apt.id === compareExpId ? "var(--coral)" : "var(--dark)", whiteSpace: "nowrap" }}>
                          <div>{apt.name || `Apt ${apartments.findIndex(a => a.id === apt.id) + 1}`}</div>
                          {apt.neighborhood && <div style={{ fontSize: 10, fontWeight: 400, color: "var(--rose-700)", marginTop: 1 }}>📍 {apt.neighborhood}</div>}
                          {apt.unit && <div style={{ fontSize: 10, fontWeight: 400, color: "var(--rose-700)" }}>Unit {apt.unit}</div>}
                          {apt.id === compareChId && compareSorted.length > 1 && <div style={{ fontSize: 10, color: "var(--green)", letterSpacing: 0.5, marginTop: 1 }}>✓ BEST</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COST_CATEGORIES.map(cat => {
                      if (!compareSorted.some(a => parseFloat(a.costs[cat.key]) > 0)) return null;
                      return (
                        <tr key={cat.key} className="compare-row" style={{ borderBottom: "1px solid #f2efe9" }}>
                          <td style={{ padding: "8px 16px", color: "#3a3a3a" }}><span style={{ marginRight: 8 }}>{cat.icon}</span>{cat.label}</td>
                          {compareSorted.map(apt => {
                            const v = parseFloat(apt.costs[cat.key]) || 0;
                            const isMin = compareCheapPerCat[cat.key] === apt.id;
                            return <td key={apt.id} className={isMin ? "comp-cheapest" : ""} style={{ textAlign: "right", padding: "8px 12px", color: v === 0 ? "#ccc" : "var(--dark)", fontWeight: v > 0 ? 500 : 400, borderRadius: isMin ? 6 : 0 }}>{v > 0 ? `$${v.toLocaleString()}` : "—"}</td>;
                          })}
                        </tr>
                      );
                    })}
                    <tr style={{ background: "#faf8f5", borderTop: "2px solid var(--dark)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13 }}>💰 True Total</td>
                      {compareSorted.map(apt => (
                        <td key={apt.id} style={{ textAlign: "right", padding: "12px 12px", fontWeight: 700, fontFamily: "'DM Serif Display', serif", fontSize: 16, color: apt.id === compareChId ? "var(--green)" : apt.id === compareExpId ? "var(--coral)" : "var(--dark)" }}>${getTotal(apt).toLocaleString()}</td>
                      ))}
                    </tr>
                    {compareSorted.some(a => a.sqft && getTotal(a) > 0) && (
                      <tr style={{ borderTop: "1px solid var(--rose-200)" }}>
                        <td style={{ padding: "8px 16px", color: "var(--rose-700)", fontSize: 14 }}>Cost / Sq Ft</td>
                        {compareSorted.map(apt => { const t = getTotal(apt), sq = Number(apt.sqft); return <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: "var(--rose-700)", fontSize: 14 }}>{sq && t > 0 ? `$${(t/sq).toFixed(2)}/sqft` : "—"}</td>; })}
                      </tr>
                    )}
                    {compareSorted.some(a => a.leaseterm) && (
                      <tr style={{ borderTop: "1px solid var(--rose-200)" }}>
                        <td style={{ padding: "8px 16px", color: "var(--rose-700)", fontSize: 14 }}>📄 Lease Term</td>
                        {compareSorted.map(apt => (
                          <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: apt.leaseterm ? "var(--dark)" : "#ccc", fontSize: 14 }}>{apt.leaseterm ? `${apt.leaseterm} mo` : "—"}</td>
                        ))}
                      </tr>
                    )}
                    {compareSorted.some(a => getMoveInTotal(a) > 0) && (
                      <tr style={{ borderTop: "1px solid var(--rose-200)", background: "rgba(122,156,189,0.04)" }}>
                        <td style={{ padding: "8px 16px", color: "var(--rose-400)", fontSize: 15, fontWeight: 500 }}>📋 Move-In Total</td>
                        {compareSorted.map(apt => { const mi = getMoveInTotal(apt); return <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: mi > 0 ? "var(--rose-400)" : "#ccc", fontSize: 15, fontWeight: mi > 0 ? 500 : 400 }}>{mi > 0 ? `$${mi.toLocaleString()}` : "—"}</td>; })}
                      </tr>
                    )}
                    {compareSorted.some(a => a.dateAvailable) && (
                      <tr style={{ borderTop: "1px solid var(--rose-200)" }}>
                        <td style={{ padding: "8px 16px", color: "var(--rose-700)", fontSize: 14 }}>📅 Available</td>
                        {compareSorted.map(apt => (
                          <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: apt.dateAvailable ? "var(--dark)" : "#ccc", fontSize: 14 }}>{apt.dateAvailable ? formatDate(apt.dateAvailable) : "—"}</td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {compareSorted.length >= 2 && compareSavings > 0 && (
                <div style={{ margin: 16, padding: "14px 18px", borderRadius: 12, background: "var(--green-light)", border: "1px solid rgba(74,154,109,0.25)" }}>
                  <div style={{ fontSize: 15, color: "#2e6b4a", fontWeight: 600 }}>💰 {compareSorted[0]?.name || "The cheapest option"} saves <span style={{ color: "var(--green)" }}>${compareSavings.toLocaleString()}/mo</span> vs {compareSelection.length === 2 ? compareSorted[1]?.name || "the other" : "the most expensive"}</div>
                  <div style={{ fontSize: 15, color: "#3a7a55", marginTop: 2 }}>That's <strong>${(compareSavings * 12).toLocaleString()}/year</strong> in savings{compareSelection.length !== 2 && filledApts.length > 2 ? " compared across all your apartments" : ""}.</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════ NEIGHBORHOODS VIEW ═══════ */}
        {view === "neighborhoods" && neighborhoodNames.map((name, nIdx) => {
          const group = neighborhoodGroups[name];
          const groupCheapestId = group.length > 1 ? group[0].id : null;
          const groupExpensiveId = group.length > 1 ? group[group.length - 1].id : null;
          const groupMin = getTotal(group[0]);
          const groupMax = getTotal(group[group.length - 1]);
          const groupAvg = Math.round(group.reduce((s, a) => s + getTotal(a), 0) / group.length);

          // Per-category cheapest within this neighborhood
          const groupCheapPerCat = {};
          COST_CATEGORIES.forEach(cat => {
            const vals = group.map(a => ({ id: a.id, v: parseFloat(a.costs[cat.key]) || 0 })).filter(x => x.v > 0);
            if (vals.length > 1) { vals.sort((a, b) => a.v - b.v); groupCheapPerCat[cat.key] = vals[0].id; }
          });

          return (
            <div key={name} className="apt-card" style={{ marginBottom: 20, animationDelay: `${nIdx * 0.08}s` }}>
              <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid var(--rose-200)", overflow: "hidden", boxShadow: "0 3px 16px rgba(0,0,0,0.05)" }}>
                <div style={{ background: "linear-gradient(135deg, #fbeaef 0%, #f6d5df 100%)", padding: isMobile ? "16px 18px 12px" : "18px 22px 14px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 85% 40%, rgba(220,86,126,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--rose-600)", fontWeight: 600, marginBottom: 4 }}>📍 Neighborhood</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 20 : 26, color: "var(--rose-900)", lineHeight: 1.2 }}>{name}</div>
                      <div style={{ fontSize: 15, color: "var(--rose-700)", marginTop: 4 }}>{group.length} apartment{group.length > 1 ? "s" : ""} listed</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, letterSpacing: 1, textTransform: "uppercase", color: "var(--rose-600)", marginBottom: 2, fontWeight: 600 }}>Avg / mo</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 18 : 24, color: "var(--rose-600)" }}>${groupAvg.toLocaleString()}</div>
                      {group.length > 1 && <div style={{ fontSize: 15, color: "var(--rose-700)", marginTop: 3 }}>${groupMin.toLocaleString()} – ${groupMax.toLocaleString()}</div>}
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--rose-200)", background: "#faf8f5" }}>
                        <th style={{ textAlign: "left", padding: isMobile ? "7px 10px" : "9px 14px", color: "var(--rose-700)", fontWeight: 600, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.8, width: "38%" }}>Category</th>
                        {group.map(apt => (
                          <th key={apt.id} style={{ textAlign: "right", padding: "9px 12px", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", color: apt.id === groupCheapestId ? "var(--green)" : apt.id === groupExpensiveId ? "var(--coral)" : "var(--dark)" }}>
                            <div>{apt.name || "Apt"}</div>
                            {apt.unit && <div style={{ fontSize: 10, fontWeight: 400, color: "#c4bdb4", marginTop: 1 }}>Unit {apt.unit}</div>}
                            {apt.id === groupCheapestId && group.length > 1 && <div style={{ fontSize: 10, color: "var(--green)", letterSpacing: 0.5, marginTop: 1 }}>✓ BEST</div>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COST_CATEGORIES.map(cat => {
                        if (!group.some(a => parseFloat(a.costs[cat.key]) > 0)) return null;
                        return (
                          <tr key={cat.key} className="compare-row" style={{ borderBottom: "1px solid #f2efe9" }}>
                            <td style={{ padding: "7px 14px", color: "#3a3a3a" }}><span style={{ marginRight: 6 }}>{cat.icon}</span>{cat.label}</td>
                            {group.map(apt => {
                              const v = parseFloat(apt.costs[cat.key]) || 0;
                              const isMin = groupCheapPerCat[cat.key] === apt.id;
                              return <td key={apt.id} className={isMin ? "comp-cheapest" : ""} style={{ textAlign: "right", padding: "7px 12px", color: v === 0 ? "#ccc" : "var(--dark)", fontWeight: v > 0 ? 500 : 400, borderRadius: isMin ? 6 : 0 }}>{v > 0 ? `$${v.toLocaleString()}` : "—"}</td>;
                            })}
                          </tr>
                        );
                      })}
                      <tr style={{ background: "#faf8f5", borderTop: "2px solid var(--dark)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12.5 }}>💰 True Total</td>
                        {group.map(apt => (
                          <td key={apt.id} style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, fontFamily: "'DM Serif Display', serif", fontSize: 15, color: apt.id === groupCheapestId ? "var(--green)" : apt.id === groupExpensiveId ? "var(--coral)" : "var(--dark)" }}>${getTotal(apt).toLocaleString()}</td>
                        ))}
                      </tr>
                      {group.some(a => a.sqft && getTotal(a) > 0) && (
                        <tr style={{ borderTop: "1px solid var(--rose-200)" }}>
                          <td style={{ padding: "7px 14px", color: "var(--rose-700)", fontSize: 14 }}>Cost / Sq Ft</td>
                          {group.map(apt => { const t = getTotal(apt), sq = Number(apt.sqft); return <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: "var(--rose-700)", fontSize: 14 }}>{sq && t > 0 ? `$${(t/sq).toFixed(2)}/sqft` : "—"}</td>; })}
                        </tr>
                      )}
                      {group.some(a => a.leaseterm) && (
                        <tr style={{ borderTop: "1px solid var(--rose-200)" }}>
                          <td style={{ padding: "7px 14px", color: "var(--rose-700)", fontSize: 14 }}>📄 Lease Term</td>
                          {group.map(apt => (
                            <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: apt.leaseterm ? "var(--dark)" : "#ccc", fontSize: 14 }}>{apt.leaseterm ? `${apt.leaseterm} mo` : "—"}</td>
                          ))}
                        </tr>
                      )}
                      {group.some(a => getMoveInTotal(a) > 0) && (
                        <tr style={{ borderTop: "1px solid var(--rose-200)", background: "rgba(122,156,189,0.04)" }}>
                          <td style={{ padding: "7px 14px", color: "var(--rose-400)", fontSize: 15, fontWeight: 500 }}>📋 Move-In</td>
                          {group.map(apt => { const mi = getMoveInTotal(apt); return <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: mi > 0 ? "var(--rose-400)" : "#ccc", fontSize: 15, fontWeight: mi > 0 ? 500 : 400 }}>{mi > 0 ? `$${mi.toLocaleString()}` : "—"}</td>; })}
                        </tr>
                      )}
                      {group.some(a => a.dateAvailable) && (
                        <tr style={{ borderTop: "1px solid var(--rose-200)" }}>
                          <td style={{ padding: "7px 14px", color: "var(--rose-700)", fontSize: 14 }}>📅 Available</td>
                          {group.map(apt => (
                            <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: apt.dateAvailable ? "var(--dark)" : "#ccc", fontSize: 14 }}>{apt.dateAvailable ? formatDate(apt.dateAvailable) : "—"}</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {group.length >= 2 && (
                  <div style={{ margin: "12px 16px 16px", padding: "11px 14px", borderRadius: 10, background: "var(--green-light)", border: "1px solid rgba(74,154,109,0.2)" }}>
                    <div style={{ fontSize: 14, color: "#2e6b4a", fontWeight: 600 }}>💰 {group[0].name || "Cheapest"} saves <span style={{ color: "var(--green)" }}>${(groupMax - groupMin).toLocaleString()}/mo</span> vs the most expensive in {name}</div>
                    <div style={{ fontSize: 15, color: "#3a7a55", marginTop: 2 }}>That's <strong>${((groupMax - groupMin) * 12).toLocaleString()}/year</strong> within this area alone.</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetaInput({ label, value, onChange, placeholder, type = "text", isMobile }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={{ display: "block", fontSize: isMobile ? 9.5 : 11, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--rose-700)", fontWeight: 600, marginBottom: isMobile ? 5 : 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ display: "block", width: "100%", maxWidth: "100%", boxSizing: "border-box", border: "1px solid var(--rose-200)", borderRadius: 9, padding: isMobile ? "10px 11px" : "12px 14px", fontSize: isMobile ? 13 : 15, fontFamily: "'DM Sans', sans-serif", color: value ? "var(--dark)" : "var(--gray)", background: "var(--warm-white)", height: isMobile ? 42 : 48 }} />
    </div>
  );
}
