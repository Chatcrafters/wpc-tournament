import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import { User, Users, Handshake, Search, Zap, CheckCircle, XCircle, Clock, Mail, UserPlus, Star, Target, MessageCircle, MapPin, Trophy, CreditCard, ArrowLeft, ArrowRight, X, Plus, AlertTriangle, Lightbulb, Phone, Calendar, ClipboardList, Hand } from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TOURNAMENT = { name: "Vienna Pickleball Open", date: "14.–16. Juni 2025", location: "Sportpark Liesing, Wien", deadline: "1. Juni 2025", year: 2025, appUrl: "https://5kzsnz.csb.app" };
const LEVELS = [
  { value: "3.5", color: "#4ADE80", desc: "Fortgeschrittene Anfänger" },
  { value: "4.5", color: "#FACC15", desc: "Mittleres Niveau" },
  { value: "5.0", color: "#F97316", desc: "Profi / Turnierspieler" },
];
const AGE_GROUPS = [
  { key: "19+", label: "Open" },
  { key: "50+", label: "Senior" },
  { key: "60+", label: "Masters" },
];
const DISCIPLINES = [
  { key: "singles", label: "Einzel", icon: "singles", hasPartner: false },
  { key: "doubles", label: "Doppel", icon: "doubles", hasPartner: true },
  { key: "mixed", label: "Mixed", icon: "mixed", hasPartner: true },
];

// ─── ICON HELPERS ─────────────────────────────────────────────────────────────
const PickleballIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="9" cy="9" r="1" fill={color} stroke="none" />
    <circle cx="15" cy="9" r="1" fill={color} stroke="none" />
    <circle cx="12" cy="14" r="1" fill={color} stroke="none" />
    <circle cx="9" cy="17" r="1" fill={color} stroke="none" />
    <circle cx="15" cy="17" r="1" fill={color} stroke="none" />
  </svg>
);

const DIcon = ({ type, size = 20, color }) => {
  if (type === "singles") return <User size={size} color={color} />;
  if (type === "doubles") return <Users size={size} color={color} />;
  if (type === "mixed") return <Handshake size={size} color={color} />;
  return null;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const lc = (l) => LEVELS.find(c => c.value === l)?.color || "#fff";
const suggestLevel = (r) => !r ? null : r < 4.0 ? "3.5" : r < 5.0 ? "4.5" : "5.0";
const calcAgeInYear = (dob, year) => { if (!dob) return null; return year - new Date(dob).getFullYear(); };

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ST = {
  wrap: { maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#0A0E1A", fontFamily: "system-ui,sans-serif", color: "#F0F4FF" },
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", padding: "0 20px 40px" },
  btn: { background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#0A0E1A", border: "none", borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" },
  btnB: { background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 14, padding: "0 16px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  btnG: { background: "linear-gradient(135deg,#22C55E,#16A34A)", color: "#fff", border: "none", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
  btnR: { background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" },
  ghost: { background: "transparent", color: "#F59E0B", border: "2px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" },
  inp: { background: "#141A2E", border: "1.5px solid #1E2845", borderRadius: 14, padding: "16px 18px", fontSize: 17, color: "#F0F4FF", width: "100%", outline: "none", boxSizing: "border-box" },
  card: { background: "#141A2E", borderRadius: 20, padding: 20, border: "1.5px solid #1E2845", marginBottom: 12 },
  hdr: { padding: "52px 0 20px", display: "flex", alignItems: "center", gap: 12 },
  back: { background: "#141A2E", border: "none", borderRadius: 12, width: 40, height: 40, cursor: "pointer", color: "#F0F4FF", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  lbl: { fontSize: 11, fontWeight: 700, color: "#6B7BA4", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, display: "block" },
  tag: (col) => ({ background: col + "22", color: col, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
  row: (col) => ({ background: "#141A2E", border: "2px solid " + (col || "#1E2845"), borderRadius: 18, padding: 18, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, color: "#F0F4FF", width: "100%", marginBottom: 12, textAlign: "left" }),
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function DuprBadge({ rating, verified, size }) {
  const sm = size === "small";
  const p = sm ? "3px 8px" : "5px 10px";
  const fs = sm ? 11 : 13;
  if (!rating) return <span style={{ background: "#1E2845", color: "#6B7BA4", borderRadius: 8, padding: p, fontSize: fs, fontWeight: 700 }}>Self-Rating</span>;
  return <span style={{ background: verified ? "rgba(59,130,246,0.2)" : "#1E2845", color: verified ? "#60A5FA" : "#6B7BA4", borderRadius: 8, padding: p, fontSize: fs, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>{verified && <Zap size={sm ? 10 : 12} />} DUPR {rating.toFixed(2)}</span>;
}

function PayOption({ icon, title, desc, price, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ background: selected ? "#0D2137" : "#141A2E", border: "2px solid " + (selected ? "#F59E0B" : "#1E2845"), borderRadius: 18, padding: 18, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, color: "#F0F4FF", width: "100%", marginBottom: 10, textAlign: "left" }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6B7BA4", marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: selected ? "#F59E0B" : "#6B7BA4" }}>{price}</div>
    </button>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const screenRef = useRef("splash");
  const setScreenTracked = (s) => { screenRef.current = s; setScreen(s); };
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [userId, setUserId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", city: "", duprId: "", dob: "" });
  const [duprData, setDuprData] = useState(null);
  const [duprLoading, setDuprLoading] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [reg, setReg] = useState({ discipline: null, level: null, age: null });
  const [step, setStep] = useState(0);
  const [partnerMode, setPartnerMode] = useState(null);
  const [partnerPhone, setPartnerPhone] = useState("");
  const [payOption, setPayOption] = useState(null);
  const [adminRegs, setAdminRegs] = useState([]);
  const [board, setBoard] = useState([]);
  const [fLevel, setFLevel] = useState(null);
  const [fAge, setFAge] = useState(null);
  const [levelWarn, setLevelWarn] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [requestMsg, setRequestMsg] = useState("");
  const [requestingId, setRequestingId] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [inviteMode, setInviteMode] = useState(null);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteCategory, setInviteCategory] = useState({ discipline: null, level: null, age: null });

  // ── Handle Stripe return URL ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const regId = params.get("reg_id");
    if (payment === "success" && regId) {
      console.log("[Stripe] Payment success for reg:", regId);
      supabase.from("registrations").update({ paid: true }).eq("id", regId).then(({ error }) => {
        console.log("[Stripe] Mark paid error:", error);
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (payment === "cancelled") {
      console.log("[Stripe] Payment cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ── Check existing session on mount ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setPhone(session.user.phone || "");
        loadProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
        setPhone(session.user.phone || "");
        const loginScreens = ["splash", "phone", "profile"];
        if (loginScreens.includes(screenRef.current)) {
          loadProfile(session.user.id);
        }
      }
      if (event === "SIGNED_OUT") {
        setUserId(null);
        setProfileId(null);
        setScreenTracked("splash");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Reload registrations when navigating to dashboard ──
  useEffect(() => {
    if (screen === "dashboard" && profileId) {
      loadRegistrations(profileId);
    }
  }, [screen, profileId]);

  // ── Load profile from Supabase ──
  const loadProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", uid).single();
    if (data) {
      setProfileId(data.id);
      setProfile({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        city: data.city || "",
        duprId: data.dupr_id || "",
        dob: data.dob || "",
      });
      if (data.dupr_rating) {
        setDuprData({ rating: parseFloat(data.dupr_rating), verified: data.dupr_verified });
      }
      await loadRegistrations(data.id);
      await loadIncomingRequests(data.id);
      setScreenTracked("dashboard");
    } else {
      setScreenTracked("profile");
    }
  };

  // ── Load registrations from Supabase ──
  const loadRegistrations = async (pid) => {
    console.log("[Registrations] Loading for profileId:", pid);
    const { data, error } = await supabase.from("registrations").select("*").eq("player_id", pid);
    console.log("[Registrations] Data:", data, "Error:", error);
    if (data) {
      setRegistrations(data.map(r => ({
        id: r.id,
        discipline: r.discipline,
        level: r.level,
        age: r.age_group,
        partnerPhone: r.partner_phone,
        lookingForPartner: r.looking_for_partner,
        paid: r.paid,
        paidForPartner: r.paid_for_partner,
        payOption: r.pay_option,
      })));
    }
  };

  // ── Load partner board from Supabase ──
  const loadBoard = async () => {
    console.log("[Board] Loading partner board...");
    const { data, error } = await supabase
      .from("registrations")
      .select("*, profiles!registrations_player_id_fkey(*)")
      .eq("looking_for_partner", true);
    console.log("[Board] Data:", data, "Error:", error);
    if (data) {
      setBoard(data.map(r => ({
        id: r.id,
        name: `${r.profiles.first_name} ${r.profiles.last_name}`,
        city: r.profiles.city || "—",
        level: r.level,
        age: r.age_group,
        discipline: r.discipline,
        phone: r.profiles.phone,
        duprRating: r.profiles.dupr_rating ? parseFloat(r.profiles.dupr_rating) : null,
        duprVerified: r.profiles.dupr_verified,
        playerId: r.player_id,
      })));
    }
  };

  // ── Load incoming partner requests ──
  const loadIncomingRequests = async (pid) => {
    console.log("[Requests] Loading incoming for profileId:", pid);
    const { data, error } = await supabase
      .from("partner_requests")
      .select("*, from_player:profiles!partner_requests_from_player_id_fkey(*)")
      .eq("to_player_id", pid);
    console.log("[Requests] Data:", data, "Error:", error);
    if (data) {
      setIncomingRequests(data.map(r => ({
        id: r.id,
        fromName: `${r.from_player.first_name} ${r.from_player.last_name}`,
        fromCity: r.from_player.city || "—",
        fromPhone: r.from_player.phone,
        fromDupr: r.from_player.dupr_rating ? parseFloat(r.from_player.dupr_rating) : null,
        fromVerified: r.from_player.dupr_verified,
        level: r.level,
        age: r.age_group,
        discipline: r.discipline,
        message: r.message || "",
        status: r.status,
        fromPlayerId: r.from_player_id,
      })));
    }
  };

  // ── Load admin data ──
  const loadAdminData = async () => {
    console.log("[Admin] Loading all registrations...");
    const { data, error } = await supabase
      .from("registrations")
      .select("*, profiles!registrations_player_id_fkey(*)");
    console.log("[Admin] Data:", data, "Error:", error);
    if (data) {
      setAdminRegs(data.map(r => ({
        id: r.id,
        name: `${r.profiles.first_name} ${r.profiles.last_name}`,
        phone: r.profiles.phone,
        discipline: r.discipline,
        level: r.level,
        age: r.age_group,
        paid: r.paid,
        paidForPartner: r.paid_for_partner,
        partnerName: r.partner_phone || null,
        partnerPaid: false,
        duprRating: r.profiles.dupr_rating ? parseFloat(r.profiles.dupr_rating) : null,
      })));
    }
  };

  // ── OTP: Send code via Supabase Auth ──
  const sendOtp = async () => {
    setOtpLoading(true);
    setAuthError("");
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    console.log("[OTP] Sending to:", cleanPhone);
    console.log("[OTP] Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    const { data, error } = await supabase.auth.signInWithOtp({ phone: cleanPhone });
    console.log("[OTP] Response data:", data);
    console.log("[OTP] Response error:", error);
    setOtpLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setOtpSent(true);
    }
  };

  // ── OTP: Verify code ──
  const verifyOtp = async () => {
    setOtpLoading(true);
    setAuthError("");
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    const { data, error } = await supabase.auth.verifyOtp({ phone: cleanPhone, token: otp, type: "sms" });
    setOtpLoading(false);
    if (error) {
      setAuthError(error.message);
    } else if (data.user) {
      setUserId(data.user.id);
      await loadProfile(data.user.id);
    }
  };

  // ── Save profile to Supabase ──
  const saveProfile = async () => {
    if (!profile.firstName || !profile.lastName || !profile.dob || playerAge < 19) return;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    // Check if profile already exists
    const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", userId).single();
    let error;
    if (existing) {
      ({ error } = await supabase.from("profiles").update({
        phone: cleanPhone,
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email || null,
        city: profile.city || null,
        dob: profile.dob,
        dupr_id: profile.duprId || null,
        dupr_rating: duprData?.rating || null,
        dupr_verified: !!duprData?.verified,
      }).eq("user_id", userId));
    } else {
      const { data: newProfile, error: insertError } = await supabase.from("profiles").insert({
        user_id: userId,
        phone: cleanPhone,
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email || null,
        city: profile.city || null,
        dob: profile.dob,
        dupr_id: profile.duprId || null,
        dupr_rating: duprData?.rating || null,
        dupr_verified: !!duprData?.verified,
      }).select().single();
      error = insertError;
      if (newProfile) setProfileId(newProfile.id);
    }
    console.log("[Profile] Save error:", error);
    if (!error) {
      setScreenTracked("dashboard");
    } else {
      setAuthError("Profil konnte nicht gespeichert werden: " + error.message);
    }
  };

  // ── Save registration to Supabase ──
  const saveRegistration = async (regData) => {
    console.log("[Registration] Saving:", { profileId, ...regData });
    const { data, error } = await supabase.from("registrations").insert({
      user_id: userId,
      player_id: profileId,
      discipline: regData.discipline,
      level: regData.level,
      age_group: regData.age,
      partner_phone: regData.partnerPhone || null,
      looking_for_partner: regData.lookingForPartner || false,
      paid: regData.paid || false,
      paid_for_partner: regData.paidForPartner || false,
      pay_option: regData.payOption || null,
    }).select().single();
    console.log("[Registration] Result:", data, "Error:", error);
    return { data, error };
  };

  // ── Send partner request to Supabase ──
  const sendPartnerRequest = async (toPlayerId, boardEntry) => {
    console.log("[PartnerRequest] Sending from:", profileId, "to:", toPlayerId);
    const { data, error } = await supabase.from("partner_requests").insert({
      user_id: userId,
      from_player_id: profileId,
      to_player_id: toPlayerId,
      discipline: boardEntry.discipline,
      level: boardEntry.level,
      age_group: boardEntry.age,
      message: requestMsg || "Würde gern mit dir spielen! 🏓",
    }).select().single();
    console.log("[PartnerRequest] Result:", data, "Error:", error);
    setSentRequests([...sentRequests, boardEntry.id]);
    setRequestingId(null);
    setRequestMsg("");
  };

  // ── Accept partner request ──
  const acceptRequest = async (req) => {
    console.log("[Request] Accepting:", req.id);
    const { error } = await supabase.from("partner_requests").update({ status: "accepted" }).eq("id", req.id);
    console.log("[Request] Accept result, error:", error);
    // Reject all other pending requests
    const otherPending = incomingRequests.filter(r => r.id !== req.id && r.status === "pending");
    for (const other of otherPending) {
      const { error: rejErr } = await supabase.from("partner_requests").update({ status: "rejected" }).eq("id", other.id);
      console.log("[Request] Auto-reject", other.id, "error:", rejErr);
    }
    setIncomingRequests(incomingRequests.map(r =>
      r.id === req.id ? { ...r, status: "accepted" } : r.status === "pending" ? { ...r, status: "rejected" } : r
    ));
    setReg({ discipline: req.discipline, level: req.level, age: req.age });
    setPartnerMode("have");
    setPartnerPhone(req.fromPhone);
    setPayOption("self");
    setScreenTracked("pairingConfirmed");
  };

  // ── Reject partner request ──
  const rejectRequest = async (reqId) => {
    console.log("[Request] Rejecting:", reqId);
    const { error } = await supabase.from("partner_requests").update({ status: "rejected" }).eq("id", reqId);
    console.log("[Request] Reject result, error:", error);
    setIncomingRequests(incomingRequests.map(r => r.id === reqId ? { ...r, status: "rejected" } : r));
  };

  // ── Admin: mark as paid ──
  const markPaid = async (regId) => {
    console.log("[Admin] Marking paid:", regId);
    const { error } = await supabase.from("registrations").update({ paid: true }).eq("id", regId);
    console.log("[Admin] Mark paid result, error:", error);
    setAdminRegs(adminRegs.map(x => x.id === regId ? { ...x, paid: true } : x));
  };

  // ── DUPR lookup (still mock — real API needs backend proxy) ──
  const fetchDupr = (id) => {
    setDuprLoading(true);
    // TODO: Replace with real DUPR API call via edge function
    setTimeout(() => {
      setDuprData(null);
      setDuprLoading(false);
    }, 1200);
  };

  const needsPartner = (d) => d === "doubles" || d === "mixed";
  const hasAnyPaid = registrations.some(r => r.paid);
  const playerAge = calcAgeInYear(profile.dob, TOURNAMENT.year);
  const suggested = suggestLevel(duprData?.rating);
  const eligibleGroups = AGE_GROUPS.filter(ag => playerAge !== null && playerAge >= parseInt(ag.key));
  const pendingCount = incomingRequests.filter(r => r.status === "pending").length;

  const pendingPayable = registrations.filter(r => r.pending && !r.lookingForPartner);
  const pendingSearch = registrations.filter(r => r.pending && r.lookingForPartner);
  const currentIsSearch = partnerMode === "search";
  const payableCount = pendingPayable.length + (!currentIsSearch ? 1 : 0);
  const pricePerReg = payOption === "both" ? 70 : payOption === "partner" ? 0 : 35;
  const totalToday = payableCount * pricePerReg;

  const finish = async () => {
    const newReg = {
      discipline: reg.discipline,
      level: reg.level,
      age: reg.age,
      partnerPhone: partnerMode === "have" ? partnerPhone : null,
      lookingForPartner: partnerMode === "search",
      paid: false,
      paidForPartner: false,
      payOption,
    };
    const { data } = await saveRegistration(newReg);
    if (data) {
      await loadRegistrations(profileId);
      return data;
    }
    return null;
  };

  // ── Stripe Checkout ──
  const handlePayment = async () => {
    const regData = await finish();
    if (!regData) return;

    // Free registration (partner search) — skip payment
    if (currentIsSearch || totalToday <= 0) {
      setScreenTracked("success");
      return;
    }

    // Redirect to Stripe Checkout
    try {
      console.log("[Stripe] Calling: /api/create-checkout-session");
      console.log("[Stripe] Payload:", { amount: totalToday, registrationId: regData.id });
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalToday,
          registrationId: regData.id,
          playerName: `${profile.firstName} ${profile.lastName}`,
        }),
      });
      console.log("[Stripe] Response status:", res.status);
      const text = await res.text();
      console.log("[Stripe] Raw response:", text);
      const data = JSON.parse(text);
      if (data.url) {
        console.log("[Stripe] Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        console.error("[Stripe] No URL returned:", data.error);
        setScreenTracked("success");
      }
    } catch (err) {
      console.error("[Stripe] Fetch error:", err);
      setScreenTracked("success");
    }
  };

  // WhatsApp URL builder
  const getWhatsAppUrl = (toPhone, msg) => {
    const clean = toPhone ? toPhone.replace(/[\s\-\(\)]/g, "").replace("+", "") : "";
    return clean.length > 6
      ? `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const generalInviteMsg = (name) =>
    `Hey${name ? " " + name : ""}! Ich spiele beim *${TOURNAMENT.name}* (${TOURNAMENT.date}, ${TOURNAMENT.location}) mit. Komm doch auch hin! 🏓\n\nHier anmelden: ${TOURNAMENT.appUrl}`;

  const categoryInviteMsg = (name, cat) =>
    `Hey${name ? " " + name : ""}! Ich spiele beim *${TOURNAMENT.name}* (${TOURNAMENT.date}) und würde gern mit dir spielen!\n\n${DISCIPLINES.find(d => d.key === cat.discipline)?.icon} ${DISCIPLINES.find(d => d.key === cat.discipline)?.label} · Level ${cat.level} · ${cat.age}\n\nMelde dich hier an: ${TOURNAMENT.appUrl}`;

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if (screen === "splash") return (
    <div style={ST.wrap}>
      <div style={{ ...ST.page, justifyContent: "center", alignItems: "center", gap: 28, background: "radial-gradient(ellipse at 50% 30%,#1A3A5C44 0%,transparent 70%)" }}>
        <img src="/logo.png" alt="PicklePass" style={{ width: 200 }} />
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <button style={ST.btn} onClick={() => setScreenTracked("phone")}>Als Spieler anmelden</button>
          <button style={ST.ghost} onClick={() => { loadAdminData(); setScreenTracked("admin"); }}>Organisatoren-Ansicht</button>
          <div style={{ textAlign: "center", color: "#3A4A6A", fontSize: 13, marginTop: 4 }}>Keine App nötig · Läuft im Browser</div>
        </div>
      </div>
    </div>
  );

  // ── PHONE ───────────────────────────────────────────────────────────────────
  if (screen === "phone") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked("splash")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Login</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>Deine<br />Handynummer</div>
        <div style={{ color: "#6B7BA4", fontSize: 14, lineHeight: 1.6 }}>Deine Nummer ist dein Login. Du bekommst einen Code per SMS.</div>
        <div>
          <label style={ST.lbl}>Telefonnummer</label>
          <input style={ST.inp} type="tel" placeholder="+43 664 123 456 7" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        {otpSent && (
          <div>
            <label style={ST.lbl}>Code aus SMS</label>
            <input style={{ ...ST.inp, letterSpacing: 8, fontSize: 22, textAlign: "center" }} type="text" placeholder="· · · · · ·" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
            <div style={{ fontSize: 12, color: "#6B7BA4", marginTop: 8, textAlign: "center" }}>Code gesendet an {phone}</div>
          </div>
        )}
        {authError && <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 14, fontSize: 13, color: "#EF4444", display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {authError}</div>}
        {!otpSent && <div style={{ background: "#0D1F33", borderRadius: 14, padding: 16, display: "flex", gap: 12 }}><Phone size={20} color="#6B7BA4" /><div style={{ fontSize: 13, color: "#6B7BA4", lineHeight: 1.5 }}>6-stelliger Code per SMS an deine Nummer.</div></div>}
      </div>
      <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {!otpSent
          ? <button style={{ ...ST.btn, opacity: phone.length < 8 || otpLoading ? 0.4 : 1 }} onClick={() => phone.length >= 8 && !otpLoading && sendOtp()}>{otpLoading ? "Sende..." : "Code senden"}</button>
          : <button style={{ ...ST.btn, opacity: otp.length < 4 || otpLoading ? 0.4 : 1 }} onClick={() => otp.length >= 4 && !otpLoading && verifyOtp()}>{otpLoading ? "Prüfe..." : "Bestätigen"}</button>}
        {otpSent && <button style={ST.ghost} onClick={() => { setOtpSent(false); setAuthError(""); }}>Andere Nummer</button>}
      </div>
    </div></div>
  );

  // ── PROFILE ─────────────────────────────────────────────────────────────────
  if (screen === "profile") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked(registrations.length > 0 ? "dashboard" : "phone")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Profil</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Fast geschafft!</div>
        <div style={{ color: "#6B7BA4", fontSize: 14 }}>Nur einmal ausfüllen – gilt für alle Turniere.</div>
        {[
          { label: "Vorname", key: "firstName", ph: "Max" },
          { label: "Nachname", key: "lastName", ph: "Mustermann" },
          { label: "Stadt", key: "city", ph: "Wien" },
          { label: "E-Mail (optional)", key: "email", ph: "max@beispiel.at", type: "email" },
        ].map(f => (
          <div key={f.key}>
            <label style={ST.lbl}>{f.label}</label>
            <input style={ST.inp} type={f.type || "text"} placeholder={f.ph} value={profile[f.key]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} />
          </div>
        ))}

        {/* GEBURTSDATUM */}
        <div>
          <label style={ST.lbl}>Geburtsdatum *</label>
          <input style={ST.inp} type="date" value={profile.dob || ""} max={new Date().toISOString().split("T")[0]} onChange={e => setProfile({ ...profile, dob: e.target.value })} />
          {playerAge !== null && (
            <div style={{ marginTop: 10, background: "#0D1F33", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6B7BA4" }}>Alter im Turnierjahr {TOURNAMENT.year}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{playerAge} Jahre</div>
                  <div style={{ fontSize: 11, color: "#6B7BA4", marginTop: 2 }}>Maßgeblich ist das Turnierjahr,<br />nicht der genaue Tag</div>
                </div>
              </div>
              <div style={ST.lbl}>Berechtigte Altersgruppen</div>
              <div style={{ display: "flex", gap: 8 }}>
                {AGE_GROUPS.map(ag => {
                  const ok = playerAge >= parseInt(ag.key);
                  return (
                    <div key={ag.key} style={{ flex: 1, textAlign: "center", background: ok ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.08)", color: ok ? "#4ADE80" : "#3A4A6A", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, border: ok ? "1px solid rgba(74,222,128,0.3)" : "1px solid #1E2845" }}>
                      <div>{ok ? <CheckCircle size={14} /> : <XCircle size={14} />}</div>
                      <div>{ag.key}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>{ok ? ag.label : "Nicht berechtigt"}</div>
                    </div>
                  );
                })}
              </div>
              {playerAge < 19 && <div style={{ marginTop: 10, background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#EF4444", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> Mindestalter 19 Jahre im Turnierjahr {TOURNAMENT.year}.</div>}
            </div>
          )}
        </div>

        {/* DUPR */}
        <div style={{ ...ST.card, borderColor: "#2A4A6C", marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Zap size={22} color="#60A5FA" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>DUPR Rating verbinden</div>
              <div style={{ fontSize: 12, color: "#6B7BA4" }}>Empfohlen – Self-Rating als Fallback möglich</div>
            </div>
          </div>
          <label style={ST.lbl}>DUPR Player ID</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...ST.inp, flex: 1 }} type="text" placeholder="z.B. 12345 oder 67890" value={profile.duprId} onChange={e => { setProfile({ ...profile, duprId: e.target.value }); setDuprData(null); }} />
            <button style={{ ...ST.btnB, height: 54, borderRadius: 14, opacity: profile.duprId.length < 3 ? 0.4 : 1 }} onClick={() => profile.duprId.length >= 3 && fetchDupr(profile.duprId)}>
              {duprLoading ? "..." : "Laden"}
            </button>
          </div>
          {duprLoading && <div style={{ marginTop: 12, fontSize: 13, color: "#6B7BA4", textAlign: "center", display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> DUPR wird abgefragt...</div>}
          {duprData && (
            <div style={{ marginTop: 12, background: "rgba(59,130,246,0.1)", borderRadius: 12, padding: 14, border: "1.5px solid rgba(59,130,246,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color="#4ADE80" /> {duprData.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7BA4", marginTop: 2 }}>Empfohlenes Level: <strong style={{ color: lc(suggested) }}>{suggested}</strong></div>
                </div>
                <DuprBadge rating={duprData.rating} verified={duprData.verified} />
              </div>
            </div>
          )}
          {profile.duprId && !duprData && !duprLoading && <div style={{ marginTop: 10, fontSize: 12, color: "#6B7BA4", display: "flex", alignItems: "center", gap: 6 }}><Lightbulb size={12} /> Kein DUPR? Kein Problem – Level wird als Self-Rating markiert.</div>}
        </div>
      </div>
      <div style={{ paddingTop: 20 }}>
        <button style={{ ...ST.btn, opacity: (!profile.firstName || !profile.lastName || !profile.dob || (playerAge !== null && playerAge < 19)) ? 0.4 : 1 }}
          onClick={() => profile.firstName && profile.lastName && profile.dob && playerAge >= 19 && saveProfile()}>
          Profil speichern
        </button>
        {!profile.dob && profile.firstName && profile.lastName && <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: "#F59E0B" }}>Bitte Geburtsdatum eingeben.</div>}
        {profile.dob && playerAge !== null && playerAge < 19 && <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: "#EF4444", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> Im Turnierjahr {TOURNAMENT.year} wirst du {playerAge} – Mindestalter ist 19.</div>}
      </div>
    </div></div>
  );

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  if (screen === "dashboard") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={{ ...ST.hdr, justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#F0F4FF", letterSpacing: -0.5 }}>Pickle<span style={{ color: "#F59E0B" }}>Pass</span></div>
          <div style={{ fontSize: 13, color: "#6B7BA4" }}>Hallo, {profile.firstName || "Spieler"}</div>
        </div>
        <DuprBadge rating={duprData?.rating} verified={!!duprData} size="small" />
      </div>

      {/* Tournament Card */}
      <div style={{ background: "linear-gradient(135deg,#0D2137,#1A3A5C)", borderRadius: 24, padding: 24, border: "1.5px solid #2A4A6C", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Nächstes Turnier</div>
        <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}>{TOURNAMENT.name}</div>
        <div style={{ fontSize: 14, color: "#8BA4C0", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} /> {TOURNAMENT.date}</div>
        <div style={{ fontSize: 14, color: "#8BA4C0", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {TOURNAMENT.location}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(245,158,11,0.15)", borderRadius: 10, padding: "6px 12px", fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>Anmeldeschluss: {TOURNAMENT.deadline}</span>
          <span style={{ background: "rgba(74,222,128,0.15)", borderRadius: 10, padding: "6px 12px", fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>Plätze frei</span>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button style={{ flex: 1, background: "#141A2E", border: "1.5px solid #1E2845", borderRadius: 16, padding: 14, cursor: "pointer", color: "#F0F4FF", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => { setFLevel(null); setFAge(null); loadBoard(); setScreenTracked("board"); }}><Search size={14} /> Partnerbörse</button>
        <button style={{ flex: 1, background: "#141A2E", border: "1.5px solid #1E2845", borderRadius: 16, padding: 14, cursor: "pointer", color: "#F0F4FF", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => setScreenTracked("profile")}><Zap size={14} /> DUPR: {duprData ? duprData.rating.toFixed(2) : "—"}</button>
      </div>

      {/* FREUND EINLADEN Button */}
      <button onClick={() => setScreenTracked("invite")} style={{ width: "100%", background: "linear-gradient(135deg,#1A2A4C,#0D1F33)", border: "1.5px solid #2A4A6C", borderRadius: 18, padding: 16, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}><UserPlus size={22} color="#60A5FA" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F4FF" }}>Freund zum Turnier einladen</div>
          <div style={{ fontSize: 12, color: "#60A5FA", marginTop: 2 }}>Per WhatsApp · mit oder ohne Kategorie-Vorschlag</div>
        </div>
        <span style={{ color: "#60A5FA", fontSize: 18 }}><ArrowRight size={18} /></span>
      </button>

      {/* Incoming requests notification */}
      {pendingCount > 0 && (
        <button onClick={() => setScreenTracked("requests")} style={{ width: "100%", background: "linear-gradient(135deg,#1A3A5C,#0D2137)", border: "2px solid #F59E0B", borderRadius: 18, padding: 16, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
          <div style={{ position: "relative" }}>
            <Mail size={28} color="#F59E0B" />
            <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingCount}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F4FF" }}>{pendingCount} neue Partneranfrage{pendingCount > 1 ? "n" : ""}!</div>
            <div style={{ fontSize: 12, color: "#F59E0B", marginTop: 2 }}>Tippen um zu antworten</div>
          </div>
          <span style={{ color: "#F59E0B", fontSize: 20 }}><ArrowRight size={20} /></span>
        </button>
      )}

      {/* Registrations */}
      <div style={ST.lbl}>Meine Anmeldungen</div>
      {registrations.length === 0
        ? <div style={{ ...ST.card, textAlign: "center", padding: 32, color: "#3A4A6A" }}><div style={{ fontSize: 36, marginBottom: 8 }}><Target size={36} color="#3A4A6A" /></div><div>Noch nicht angemeldet</div></div>
        : registrations.map(r => {
            const d = DISCIPLINES.find(x => x.key === r.discipline);
            const col = lc(r.level);
            return (
              <div key={r.id} style={{ background: "#141A2E", borderRadius: 16, padding: "16px 18px", border: "1.5px solid " + col + "44", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <DIcon type={d?.icon} size={24} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{d?.label} · {r.age}</div>
                      <div style={{ fontSize: 12, marginTop: 2, color: r.paid ? "#4ADE80" : "#F59E0B" }}>
                        {r.paid ? (r.paidForPartner ? "Du hast für beide bezahlt" : "Bezahlt") : "Zahlung nach Paarung"}
                      </div>
                    </div>
                  </div>
                  <span style={ST.tag(col)}>{r.level}</span>
                </div>
                {r.lookingForPartner && <div style={{ background: "#0D2A1A", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#4ADE80", display: "flex", alignItems: "center", gap: 6 }}><Search size={12} /> Auf Partnerbörse aktiv</div>}
                {r.partnerPhone && <div style={{ background: "#0D1F33", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#6B7BA4", display: "flex", alignItems: "center", gap: 6 }}><Users size={12} /> Partner: {r.partnerPhone} · <span style={{ color: r.paidForPartner ? "#4ADE80" : "#F59E0B" }}>{r.paidForPartner ? "Du hast gezahlt" : "Partner zahlt noch"}</span></div>}
              </div>
            );
          })
      }
      <div style={{ marginTop: 8 }}>
        {registrations.length < 3
          ? <button style={ST.btn} onClick={() => { setReg({ discipline: null, level: null, age: null }); setPartnerPhone(""); setPartnerMode(null); setPayOption(null); setStep(0); setLevelWarn(false); setScreenTracked("register"); }}><Plus size={16} style={{display:"inline",verticalAlign:"middle"}} /> Neue Kategorie anmelden</button>
          : <div style={{ textAlign: "center", color: "#6B7BA4", fontSize: 13, padding: 16 }}>Maximum 3 Kategorien erreicht</div>}
      </div>
    </div></div>
  );

  // ── INVITE FRIEND ────────────────────────────────────────────────────────────
  if (screen === "invite") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked("dashboard")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Freund einladen</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>Wen möchtest du<br />einladen?</div>
        <div style={{ color: "#6B7BA4", fontSize: 14, lineHeight: 1.6 }}>Die Einladung wird direkt per WhatsApp verschickt – mit Link zur Anmeldung.</div>

        {/* Phone input */}
        <div>
          <label style={ST.lbl}>Handynummer (optional)</label>
          <input style={ST.inp} type="tel" placeholder="+43 664 987 654 3" value={invitePhone} onChange={e => setInvitePhone(e.target.value)} />
          <div style={{ fontSize: 12, color: "#6B7BA4", marginTop: 6 }}>Leer lassen um nur den Link zu öffnen</div>
        </div>

        {/* Invite type */}
        <div style={ST.lbl}>Art der Einladung</div>

        {/* General invite */}
        <button style={{ ...ST.row(inviteMode === "general" ? "#60A5FA55" : null) }} onClick={() => setInviteMode(inviteMode === "general" ? null : "general")}>
          <Star size={28} color="#60A5FA" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Allgemeine Einladung</div>
            <div style={{ fontSize: 13, color: "#6B7BA4", marginTop: 2 }}>Einfach zum Turnier einladen, ohne Kategorie</div>
          </div>
          {inviteMode === "general" && <span style={{ color: "#60A5FA" }}><CheckCircle size={16} /></span>}
        </button>

        {/* Category invite */}
        <button style={{ ...ST.row(inviteMode === "category" ? "#F59E0B55" : null) }} onClick={() => setInviteMode(inviteMode === "category" ? null : "category")}>
          <Target size={28} color="#F59E0B" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Mit Kategorie-Vorschlag</div>
            <div style={{ fontSize: 13, color: "#6B7BA4", marginTop: 2 }}>Schlage gleich eine Disziplin + Level vor</div>
          </div>
          {inviteMode === "category" && <span style={{ color: "#F59E0B" }}><CheckCircle size={16} /></span>}
        </button>

        {/* Category selector */}
        {inviteMode === "category" && (
          <div style={{ ...ST.card, borderColor: "#F59E0B44" }}>
            <div style={ST.lbl}>Disziplin</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {DISCIPLINES.filter(d => d.hasPartner).map(d => (
                <button key={d.key} onClick={() => setInviteCategory({ ...inviteCategory, discipline: d.key })}
                  style={{ padding: "8px 14px", borderRadius: 50, border: "2px solid " + (inviteCategory.discipline === d.key ? "#F59E0B" : "#1E2845"), background: inviteCategory.discipline === d.key ? "rgba(245,158,11,0.15)" : "transparent", color: inviteCategory.discipline === d.key ? "#F59E0B" : "#6B7BA4", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <DIcon type={d.icon} size={14} /> {d.label}
                </button>
              ))}
            </div>
            <div style={ST.lbl}>Level</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {LEVELS.map(l => (
                <button key={l.value} onClick={() => setInviteCategory({ ...inviteCategory, level: l.value })}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 12, border: "2px solid " + (inviteCategory.level === l.value ? l.color : "#1E2845"), background: inviteCategory.level === l.value ? l.color + "22" : "transparent", color: inviteCategory.level === l.value ? l.color : "#6B7BA4", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {l.value}
                </button>
              ))}
            </div>
            <div style={ST.lbl}>Altersgruppe</div>
            <div style={{ display: "flex", gap: 8 }}>
              {AGE_GROUPS.map(ag => (
                <button key={ag.key} onClick={() => setInviteCategory({ ...inviteCategory, age: ag.key })}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 12, border: "2px solid " + (inviteCategory.age === ag.key ? "#F59E0B" : "#1E2845"), background: inviteCategory.age === ag.key ? "rgba(245,158,11,0.15)" : "transparent", color: inviteCategory.age === ag.key ? "#F59E0B" : "#6B7BA4", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {ag.key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp preview */}
        {inviteMode && (
          <div style={{ background: "#0D2A1A", border: "1.5px solid #1A4A2A", borderRadius: 18, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><MessageCircle size={12} /> WhatsApp Vorschau</div>
            <div style={{ background: "#1A3A25", borderRadius: 12, padding: 14, fontSize: 13, color: "#D1FAE5", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {inviteMode === "general"
                ? generalInviteMsg(null)
                : (inviteCategory.discipline && inviteCategory.level && inviteCategory.age)
                  ? categoryInviteMsg(null, inviteCategory)
                  : <span style={{ color: "#6B9A70", fontStyle: "italic" }}>Bitte Disziplin, Level und Altersgruppe wählen</span>
              }
            </div>
            {/* Direct link copy */}
            <div style={{ marginTop: 10, background: "#0D1F33", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#4ADE80", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{TOURNAMENT.appUrl}</span>
              <button style={{ background: "rgba(74,222,128,0.2)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#4ADE80", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, marginLeft: 8 }}
                onClick={() => { navigator.clipboard?.writeText(TOURNAMENT.appUrl).catch(() => {}); }}>
                Kopieren
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {inviteMode === "general" && (
          <a href={getWhatsAppUrl(invitePhone, generalInviteMsg(null))} target="_blank" rel="noopener noreferrer"
            style={{ ...ST.btnG, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Per WhatsApp einladen
          </a>
        )}
        {inviteMode === "category" && inviteCategory.discipline && inviteCategory.level && inviteCategory.age && (
          <a href={getWhatsAppUrl(invitePhone, categoryInviteMsg(null, inviteCategory))} target="_blank" rel="noopener noreferrer"
            style={{ ...ST.btn, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Mit Kategorie-Vorschlag einladen
          </a>
        )}
        <button style={ST.ghost} onClick={() => setScreenTracked("dashboard")}>Zurück</button>
      </div>
    </div></div>
  );

  // ── REGISTER ────────────────────────────────────────────────────────────────
  if (screen === "register") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => step > 0 ? setStep(step - 1) : setScreenTracked("dashboard")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Kategorie wählen</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {["Disziplin", "Level", "Alter"].map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? "#F59E0B" : "#1E2845" }} />)}
      </div>
      {step === 0 && <>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Welche Disziplin?</div>
        <div style={{ color: "#6B7BA4", fontSize: 14, marginBottom: 20 }}>Du kannst bis zu 3 Kategorien spielen.</div>
        {DISCIPLINES.map(d => (
          <button key={d.key} style={ST.row()} onClick={() => { setReg({ ...reg, discipline: d.key }); setStep(1); }}>
            <DIcon type={d.icon} size={30} />
            <div><div style={{ fontSize: 17, fontWeight: 700 }}>{d.label}</div><div style={{ fontSize: 13, color: "#6B7BA4", marginTop: 2 }}>{d.key === "singles" ? "Einzelwertung" : d.key === "doubles" ? "Herren- oder Damendoppel" : "Gemischtes Doppel"}</div></div>
            <span style={{ marginLeft: "auto", color: "#3A4A6A" }}><ArrowRight size={16} /></span>
          </button>
        ))}
      </>}
      {step === 1 && <>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Welches Level?</div>
        {duprData && <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} /> DUPR {duprData.rating.toFixed(2)} – empfohlen: <strong>Level {suggested}</strong></div>}
        {LEVELS.map(c => (
          <button key={c.value} style={ST.row(c.color + "55")} onClick={() => { setReg({ ...reg, level: c.value }); setLevelWarn(!!duprData && suggestLevel(duprData.rating) !== c.value); setStep(2); }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: c.color, flexShrink: 0 }}>{c.value}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>Level {c.value}</div><div style={{ fontSize: 13, color: "#6B7BA4", marginTop: 2 }}>{c.desc}</div></div>
            {suggested === c.value && duprData && <span style={{ background: "rgba(59,130,246,0.2)", color: "#60A5FA", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 700 , display: "flex", alignItems: "center", gap: 3 }}><Zap size={11} /> Empfohlen</span>}
            <span style={{ marginLeft: 8, color: "#3A4A6A" }}><ArrowRight size={16} /></span>
          </button>
        ))}
      </>}
      {step === 2 && <>
        {levelWarn && <div style={{ background: "rgba(249,115,22,0.1)", border: "1.5px solid rgba(249,115,22,0.4)", borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 13, color: "#F97316", lineHeight: 1.6, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> Dein DUPR ({duprData?.rating.toFixed(2)}) passt nicht zu Level {reg.level}. Empfohlen: Level {suggested}. Du kannst trotzdem fortfahren – wird als unverified markiert.</div>}
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Altersgruppe?</div>
        <div style={{ fontSize: 13, color: "#6B7BA4", marginBottom: 16, background: "#0D1F33", borderRadius: 12, padding: "10px 14px" }}>
          Maßgeblich ist das <strong style={{ color: "#F0F4FF" }}>Turnierjahr {TOURNAMENT.year}</strong> – du wirst {playerAge} Jahre alt.
        </div>
        {eligibleGroups.map(ag => (
          <button key={ag.key} style={ST.row("#F59E0B33")} onClick={() => { setReg({ ...reg, age: ag.key }); needsPartner(reg.discipline) ? setScreenTracked("partnerChoice") : (setPayOption("self"), setScreenTracked("payment")); }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1E2845", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{ag.key}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{ag.label}</div><div style={{ fontSize: 13, color: "#4ADE80", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={12} /> Berechtigt im Jahr {TOURNAMENT.year}</div></div>
            <span style={{ color: "#3A4A6A" }}><ArrowRight size={16} /></span>
          </button>
        ))}
        {AGE_GROUPS.filter(ag => playerAge < parseInt(ag.key)).map(ag => (
          <div key={ag.key} style={{ background: "#0D1020", border: "1.5px solid #1E2845", borderRadius: 18, padding: 18, display: "flex", alignItems: "center", gap: 14, marginBottom: 12, opacity: 0.45 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1E2845", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#3A4A6A", flexShrink: 0 }}>{ag.key}</div>
            <div><div style={{ fontSize: 17, fontWeight: 700, color: "#3A4A6A" }}>{ag.label}</div><div style={{ fontSize: 13, color: "#EF4444", marginTop: 2 }}><XCircle size={12} style={{display:"inline",verticalAlign:"middle"}} /> Du wirst {TOURNAMENT.year} erst {playerAge} – Mindestalter {ag.key}</div></div>
          </div>
        ))}
      </>}
    </div></div>
  );

  // ── PARTNER CHOICE ───────────────────────────────────────────────────────────
  if (screen === "partnerChoice") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked("register")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Partner</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>Hast du schon<br />einen Partner?</div>
        <div style={{ background: "#141A2E", borderRadius: 14, padding: 14, fontSize: 13, color: "#6B7BA4", border: "1.5px solid #1E2845" }}>
          {DISCIPLINES.find(d => d.key === reg.discipline)?.icon} {DISCIPLINES.find(d => d.key === reg.discipline)?.label} · Level {reg.level} · {reg.age}
        </div>
        <button style={ST.row("#F59E0B55")} onClick={() => { setPartnerMode("have"); setScreenTracked("partnerInvite"); }}>
          <Phone size={30} color="#F59E0B" />
          <div><div style={{ fontSize: 17, fontWeight: 700 }}>Ja, ich habe einen Partner</div><div style={{ fontSize: 13, color: "#6B7BA4", marginTop: 2 }}>Ich gebe seine Handynummer ein</div></div>
          <span style={{ marginLeft: "auto", color: "#3A4A6A" }}><ArrowRight size={16} /></span>
        </button>
        <button style={ST.row("#4ADE8055")} onClick={() => { setPartnerMode("search"); setPayOption(null); setScreenTracked("payment"); }}>
          <Search size={30} color="#4ADE80" />
          <div><div style={{ fontSize: 17, fontWeight: 700 }}>Nein, ich suche noch</div><div style={{ fontSize: 13, color: "#6B7BA4", marginTop: 2 }}>{hasAnyPaid ? "Kostenlos auf Partnerbörse eintragen" : "Zahlung erst nach Paarung (24h)"}</div></div>
          <span style={{ marginLeft: "auto", color: "#3A4A6A" }}><ArrowRight size={16} /></span>
        </button>
        <div style={{ background: "#0D1F33", borderRadius: 14, padding: 16, fontSize: 13, color: "#6B7BA4", lineHeight: 1.7 }}>
          <Lightbulb size={14} color="#6B7BA4" style={{flexShrink:0,display:"inline",verticalAlign:"middle"}} /> <strong style={{ color: "#F0F4FF" }}>Partnerbörse:</strong> Du erscheinst in der Liste für deine Kategorie.<br />
          Wenn du und ein Partner euch einigt, habt ihr <strong style={{ color: "#F0F4FF" }}>24h Zeit</strong> zu zahlen.<br />
          Zahlt nur einer – der andere fliegt raus, Zahlender bleibt drin.
        </div>
      </div>
    </div></div>
  );

  // ── PARTNER INVITE ───────────────────────────────────────────────────────────
  if (screen === "partnerInvite") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked("partnerChoice")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Partner einladen</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Wer spielt mit dir?</div>
        <div style={{ color: "#6B7BA4", fontSize: 14, lineHeight: 1.6 }}>Handynummer eingeben – Partner bekommt automatisch eine WhatsApp.</div>
        <div>
          <label style={ST.lbl}>Handynummer Partner</label>
          <input style={ST.inp} type="tel" placeholder="+43 664 987 654 3" value={partnerPhone} onChange={e => setPartnerPhone(e.target.value)} />
        </div>
        {partnerPhone.length > 5 && (
          <div style={{ background: "#0D2A1A", border: "1.5px solid #1A4A2A", borderRadius: 18, padding: 16 }}>
            <div style={{...ST.lbl, display: "flex", alignItems: "center", gap: 6}}><MessageCircle size={12} /> WhatsApp Vorschau</div>
            <div style={{ background: "#1A3A25", borderRadius: 12, padding: 14, fontSize: 13, color: "#D1FAE5", lineHeight: 1.7 }}>
              Hallo! <strong>{profile.firstName} {profile.lastName}</strong> möchte mit dir beim <strong>{TOURNAMENT.name}</strong> spielen.<br /><br />
              {DISCIPLINES.find(d => d.key === reg.discipline)?.icon} {DISCIPLINES.find(d => d.key === reg.discipline)?.label} · Level {reg.level} · {reg.age}<br /><br />
              Bestätige hier:<br />
              <span style={{ color: "#4ADE80" }}>{TOURNAMENT.appUrl}/invite/abc123</span><br /><br />
              <span style={{ color: "#6B9A70", fontSize: 12 }}>Zahlung bis spätestens 72h vor Turnierbeginn.</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={{ ...ST.btn, opacity: partnerPhone.length < 8 ? 0.4 : 1 }} onClick={() => partnerPhone.length >= 8 && (setPayOption("self"), setScreenTracked("payment"))}>Partner einladen & weiter</button>
        <button style={ST.ghost} onClick={() => { setPayOption("self"); setScreenTracked("payment"); }}>Später hinzufügen</button>
      </div>
    </div></div>
  );

  // ── PARTNER BOARD ────────────────────────────────────────────────────────────
  if (screen === "board") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked("dashboard")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Partnerbörse</span>
      </div>
      <div style={{ fontSize: 14, color: "#6B7BA4", marginBottom: 16 }}>Spieler die noch einen Partner suchen</div>
      <div style={{ marginBottom: 10 }}>
        <div style={ST.lbl}>Level</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEVELS.map(l => <button key={l.value} onClick={() => setFLevel(fLevel === l.value ? null : l.value)} style={{ padding: "8px 16px", borderRadius: 50, border: "2px solid " + (fLevel === l.value ? l.color : "#1E2845"), background: fLevel === l.value ? l.color + "22" : "transparent", color: fLevel === l.value ? l.color : "#6B7BA4", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{l.value}</button>)}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={ST.lbl}>Altersgruppe</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {AGE_GROUPS.map(ag => <button key={ag.key} onClick={() => setFAge(fAge === ag.key ? null : ag.key)} style={{ padding: "8px 16px", borderRadius: 50, border: "2px solid " + (fAge === ag.key ? "#F59E0B" : "#1E2845"), background: fAge === ag.key ? "rgba(245,158,11,0.15)" : "transparent", color: fAge === ag.key ? "#F59E0B" : "#6B7BA4", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{ag.key}</button>)}
        </div>
      </div>
      {board.filter(p => (!fLevel || p.level === fLevel) && (!fAge || p.age === fAge)).map(p => {
        const d = DISCIPLINES.find(x => x.key === p.discipline);
        const col = lc(p.level);
        return (
          <div key={p.id} style={{ ...ST.card, borderColor: col + "33" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: col + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}><DIcon type={d?.icon} size={20} /></div>
                <div><div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div><div style={{ fontSize: 13, color: "#6B7BA4", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {p.city}</div></div>
              </div>
              <span style={ST.tag(col)}>{p.level}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={ST.tag("#8B9CC0")}>{d?.label}</span>
              <span style={ST.tag("#8B9CC0")}>{p.age}</span>
              <DuprBadge rating={p.duprRating} verified={p.duprVerified} size="small" />
            </div>
            {p.playerId === profileId ? (
              <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#F59E0B", textAlign: "center" }}>Das bist du</div>
            ) : requestingId === p.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea style={{ ...ST.inp, fontSize: 14, resize: "none", height: 80 }} placeholder="Kurze Nachricht... (optional)" value={requestMsg} onChange={e => setRequestMsg(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...ST.btnG, flex: 2, padding: 12 }} onClick={() => sendPartnerRequest(p.playerId, p)}><Mail size={14} /> Anfrage senden</button>
                  <button style={{ flex: 1, background: "transparent", border: "1.5px solid #1E2845", borderRadius: 14, padding: 12, cursor: "pointer", color: "#6B7BA4", fontSize: 14 }} onClick={() => { setRequestingId(null); setRequestMsg(""); }}>Abbruch</button>
                </div>
              </div>
            ) : sentRequests.includes(p.id) ? (
              <div style={{ background: "rgba(74,222,128,0.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#4ADE80", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><CheckCircle size={14} /> Anfrage gesendet – wartet auf Antwort</div>
            ) : (
              <button style={ST.btnG} onClick={() => setRequestingId(p.id)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Mail size={16} /> Partneranfrage senden</button>
            )}
          </div>
        );
      })}
      {board.filter(p => (!fLevel || p.level === fLevel) && (!fAge || p.age === fAge)).length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#3A4A6A" }}><div style={{ fontSize: 36, marginBottom: 8 }}><Search size={36} color="#3A4A6A" /></div><div>Keine Spieler in dieser Kategorie</div></div>}
    </div></div>
  );

  // ── INCOMING REQUESTS ────────────────────────────────────────────────────────
  if (screen === "requests") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => setScreenTracked("dashboard")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Partneranfragen</span>
      </div>
      {pendingCount === 0 && <div style={{ ...ST.card, textAlign: "center", padding: 40, color: "#3A4A6A" }}><div style={{ fontSize: 36, marginBottom: 8 }}><CheckCircle size={36} color="#3A4A6A" /></div><div>Keine offenen Anfragen</div></div>}
      {pendingCount > 0 && <>
        <div style={{ fontSize: 13, color: "#6B7BA4", marginBottom: 16, lineHeight: 1.6 }}>Wähle deinen Partner – alle anderen Anfragen werden automatisch abgelehnt.</div>
        {incomingRequests.filter(r => r.status === "pending").map(req => {
          const d = DISCIPLINES.find(x => x.key === req.discipline);
          const col = lc(req.level);
          return (
            <div key={req.id} style={{ ...ST.card, borderColor: col + "44", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: col + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}><DIcon type={d?.icon} size={22} /></div>
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{req.fromName}</div><div style={{ fontSize: 12, color: "#6B7BA4", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {req.fromCity}</div></div>
                </div>
                <DuprBadge rating={req.fromDupr} verified={req.fromVerified} size="small" />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={ST.tag(col)}>{req.level}</span>
                <span style={ST.tag("#8B9CC0")}>{d?.label}</span>
                <span style={ST.tag("#8B9CC0")}>{req.age}</span>
              </div>
              <div style={{ background: "#0D1F33", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#D1E8FF", lineHeight: 1.6, fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 8 }}><MessageCircle size={14} style={{flexShrink:0,marginTop:2}} /> "{req.message}"</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...ST.btnG, flex: 2, padding: 14 }} onClick={() => acceptRequest(req)}><CheckCircle size={16} /> Annehmen</button>
                <button style={{ ...ST.btnR, flex: 1 }} onClick={() => rejectRequest(req.id)}><XCircle size={16} /> Ablehnen</button>
              </div>
            </div>
          );
        })}
      </>}
      {incomingRequests.filter(r => r.status !== "pending").length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={ST.lbl}>Bereits beantwortet</div>
          {incomingRequests.filter(r => r.status !== "pending").map(req => (
            <div key={req.id} style={{ ...ST.card, opacity: 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{req.fromName}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: req.status === "accepted" ? "#4ADE80" : "#EF4444" }}>{req.status === "accepted" ? "Angenommen" : "Abgelehnt"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );

  // ── PAIRING CONFIRMED ────────────────────────────────────────────────────────
  if (screen === "pairingConfirmed") return (
    <div style={ST.wrap}>
      <div style={{ ...ST.page, justifyContent: "center", alignItems: "center", gap: 20, textAlign: "center" }}>
        <div style={{ width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle,#4ADE8033,#0D2A1A)", border: "2px solid #4ADE8066", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}><Handshake size={52} color="#4ADE80" /></div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Paarung bestätigt!</div>
          <div style={{ color: "#6B7BA4", fontSize: 15, lineHeight: 1.6 }}>Du und <strong style={{ color: "#F0F4FF" }}>{partnerPhone}</strong> seid jetzt ein Team.</div>
        </div>
        <div style={{ background: "#0D2137", border: "1.5px solid #F59E0B44", borderRadius: 18, padding: 18, width: "100%" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> Zahlung innerhalb 24h</div>
          <div style={{ fontSize: 13, color: "#8BA4C0", lineHeight: 1.7 }}>
            Ihr habt <strong style={{ color: "#F0F4FF" }}>24 Stunden</strong> um zu bezahlen.<br />
            Zahlt nur einer – der andere fliegt raus.<br />
            Zahlt keiner – beide raus, kein Geld fällig.
          </div>
        </div>
        <div style={{ background: "#0D2A1A", border: "1.5px solid #1A4A2A", borderRadius: 18, padding: 16, width: "100%" }}>
          <div style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><MessageCircle size={14} /> WhatsApp gesendet</div>
          <div style={{ fontSize: 13, color: "#6B7BA4" }}>Beide Spieler wurden per WhatsApp benachrichtigt mit dem Zahlungslink.</div>
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={ST.btn} onClick={() => setScreenTracked("payment")}>Jetzt sofort bezahlen</button>
          <button style={ST.ghost} onClick={() => setScreenTracked("dashboard")}>Später bezahlen</button>
        </div>
      </div>
    </div>
  );

  // ── PAYMENT ──────────────────────────────────────────────────────────────────
  if (screen === "payment") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={ST.hdr}>
        <button style={ST.back} onClick={() => needsPartner(reg.discipline) ? setScreenTracked("partnerInvite") : setScreenTracked("register")}><ArrowLeft size={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Bezahlen & Anmelden</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Warenkorb */}
        <div style={ST.card}>
          <div style={ST.lbl}>Warenkorb ({registrations.filter(r => r.pending).length + 1}/3)</div>
          {pendingPayable.map(r => {
            const d = DISCIPLINES.find(x => x.key === r.discipline);
            return <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0D1F33", borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><DIcon type={d?.icon} size={18} /><div><div style={{ fontSize: 13, fontWeight: 600 }}>{d?.label} · {r.age}</div><div style={{ fontSize: 11, color: "#6B7BA4" }}>Level {r.level}{r.partnerPhone ? " · " + r.partnerPhone : ""}</div></div></div>
              <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>€ 35</span>
            </div>;
          })}
          {pendingSearch.map(r => {
            const d = DISCIPLINES.find(x => x.key === r.discipline);
            return <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(74,222,128,0.05)", borderRadius: 12, padding: "10px 14px", marginBottom: 8, border: "1px solid rgba(74,222,128,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><DIcon type={d?.icon} size={18} /><div><div style={{ fontSize: 13, fontWeight: 600 }}>{d?.label} · {r.age}</div><div style={{ fontSize: 11, color: "#4ADE80", display: "flex", alignItems: "center", gap: 6 }}><Search size={12} /> Partnerbörse – erst nach Paarung</div></div></div>
              <span style={{ color: "#4ADE80", fontWeight: 700, fontSize: 13 }}>€ 0 jetzt</span>
            </div>;
          })}
          {/* Current reg */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: currentIsSearch ? "rgba(74,222,128,0.08)" : "rgba(245,158,11,0.1)", borderRadius: 12, padding: "10px 14px", border: currentIsSearch ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(245,158,11,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <DIcon type={DISCIPLINES.find(d => d.key === reg.discipline)?.icon} size={18} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{DISCIPLINES.find(d => d.key === reg.discipline)?.label} · {reg.age} <span style={{ color: "#F59E0B", fontSize: 11 }}>neu</span></div>
                <div style={{ fontSize: 11, color: currentIsSearch ? "#4ADE80" : "#6B7BA4", display: "flex", alignItems: "center", gap: 4 }}>{currentIsSearch ? <><Search size={12} /> Partnerbörse – erst nach Paarung</> : partnerPhone ? <><Users size={12} /> {partnerPhone}</> : "Einzel"}</div>
              </div>
            </div>
            <span style={{ color: currentIsSearch ? "#4ADE80" : "#F59E0B", fontWeight: 700, fontSize: 13 }}>{currentIsSearch ? "€ 0 jetzt" : "€ 35"}</span>
          </div>
        </div>

        {/* Zahlungsoption */}
        {payableCount > 0 && <>
          <div style={ST.lbl}>Wer zahlt? ({payableCount} {payableCount === 1 ? "Kategorie" : "Kategorien"})</div>
          {(needsPartner(reg.discipline) && !currentIsSearch) || pendingPayable.some(r => r.partnerPhone) ? <>
            <PayOption icon={<User size={24} />} title="Nur mein Anteil" desc={`Partner zahlt selbst – bis 72h vor Turnier · ${payableCount}× € 35`} price={`€ ${payableCount * 35}`} selected={payOption === "self"} onClick={() => setPayOption("self")} />
            <PayOption icon={<Users size={24} />} title="Ich zahle für alle Partner mit" desc={`Kein Stress für Partner · ${payableCount}× € 70`} price={`€ ${payableCount * 70}`} selected={payOption === "both"} onClick={() => setPayOption("both")} />
            <PayOption icon={<MessageCircle size={24} />} title="Partner zahlen für uns alle" desc="Du zahlst heute nichts" price="€ 0 jetzt" selected={payOption === "partner"} onClick={() => setPayOption("partner")} />
          </> : <PayOption icon={<User size={24} />} title={payableCount > 1 ? `Alle ${payableCount} Startgelder` : "Mein Startgeld"} desc={payableCount > 1 ? `${payableCount}× € 35,00` : "Einzel – nur dein Anteil"} price={`€ ${payableCount * 35}`} selected={payOption === "self"} onClick={() => setPayOption("self")} />}
        </>}

        {currentIsSearch && <div style={{ ...ST.card, borderColor: "#1A4A2A" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Search size={14} /> Partnerbörse – keine Zahlung jetzt</div>
          <div style={{ fontSize: 13, color: "#8BA4C0", lineHeight: 1.7 }}>Nach Paarung: <strong style={{ color: "#F0F4FF" }}>beide zahlen innerhalb 24h</strong><br />Nur einer zahlt – anderer fliegt raus<br />Kein Partner bis Turnier – Eintrag erlischt</div>
        </div>}

        {(payOption === "self" || payOption === "both") && payableCount > 0 && (
          <div style={{ ...ST.card, borderColor: "#2A4A6C" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CreditCard size={20} color="#60A5FA" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Sichere Zahlung via Stripe</div>
                <div style={{ fontSize: 12, color: "#6B7BA4", marginTop: 2 }}>Kreditkarte, Klarna, Giropay u.v.m.</div>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div style={{ background: "#0D1F33", borderRadius: 16, padding: "14px 18px" }}>
          {(pendingSearch.length > 0 || currentIsSearch) && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}><span style={{ color: "#4ADE80", display: "flex", alignItems: "center", gap: 4 }}><Search size={12} /> {pendingSearch.length + (currentIsSearch ? 1 : 0)} × Partnerbörse</span><span style={{ color: "#4ADE80" }}>€ 0,00 jetzt</span></div>}
          {payableCount > 0 && payOption && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}><span style={{ color: "#6B7BA4" }}>{payableCount} × Startgeld</span><span style={{ color: "#6B7BA4" }}>€ {pricePerReg} × {payableCount}</span></div>}
          <div style={{ borderTop: "1px solid #1E2845", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Heute fällig</span>
            <span style={{ fontWeight: 800, fontSize: 24, color: "#F59E0B" }}>{payOption || currentIsSearch ? `€ ${totalToday.toFixed(2)}` : "—"}</span>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Weitere Kategorie */}
        {registrations.filter(r => !r.pending).length === 0 && registrations.filter(r => r.pending).length < 2 && (
          <div style={{ background: "#0D1F33", borderRadius: 16, padding: 16, border: "1.5px solid #1E2845" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F4FF", marginBottom: 4 }}><Plus size={14} style={{display:"inline",verticalAlign:"middle"}} /> Noch eine Kategorie? ({registrations.filter(r => r.pending).length + 1}/3)</div>
            <div style={{ fontSize: 12, color: "#6B7BA4", marginBottom: 12 }}>Füge weitere Kategorien hinzu – du zahlst alles zusammen.</div>
            <button style={{ ...ST.ghost, padding: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => {
              const pending = { ...reg, id: Date.now(), partnerPhone: partnerMode === "have" ? partnerPhone : null, lookingForPartner: partnerMode === "search", paid: false, paidForPartner: false, payOption, pending: true };
              setRegistrations([...registrations, pending]);
              setReg({ discipline: null, level: null, age: null }); setPartnerPhone(""); setPartnerMode(null); setPayOption(null); setStep(0); setLevelWarn(false);
              setScreenTracked("register");
            }}><Plus size={14} /> Weitere Kategorie hinzufügen</button>
          </div>
        )}

        {/* CTA */}
        <button style={{ ...ST.btn, opacity: (!payOption && !currentIsSearch) ? 0.4 : 1 }} onClick={() => {
          if (payOption || currentIsSearch) {
            handlePayment();
          }
        }}>
          {(() => {
            const pp = registrations.filter(r => r.pending && !r.lookingForPartner);
            const total = pp.length + (!currentIsSearch ? 1 : 0);
            if (total > 1) return `${total} Kategorien bezahlen`;
            if (currentIsSearch) return "Kostenlos eintragen";
            return "Jetzt anmelden";
          })()}
        </button>
        {registrations.filter(r => r.pending && r.lookingForPartner).length > 0 && <div style={{ fontSize: 12, color: "#4ADE80", textAlign: "center", display: "flex", alignItems: "center", gap: 6 }}><Search size={12} /> Partnerbörse-Kategorien kostenlos – Zahlung erst nach Paarung</div>}
      </div>
    </div></div>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (screen === "success") return (
    <div style={ST.wrap}>
      <div style={{ ...ST.page, justifyContent: "center", alignItems: "center", gap: 20, textAlign: "center" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle,#4ADE8033,#0D2A1A)", border: "2px solid #4ADE8066", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>{partnerMode === "search" ? <Search size={48} /> : <CheckCircle size={48} />}
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{partnerMode === "search" ? "Eingetragen!" : "Angemeldet!"}</div>
          <div style={{ color: "#6B7BA4", fontSize: 15, lineHeight: 1.6 }}>
            {partnerMode === "have" && partnerPhone ? `Dein Partner (${partnerPhone}) bekommt eine WhatsApp.` : partnerMode === "search" ? "Du stehst jetzt auf der Partnerbörse." : "Deine Anmeldung ist bestätigt."}
          </div>
        </div>
        {partnerMode === "search" && <div style={{ background: "#0D2A1A", border: "1.5px solid #1A4A2A", borderRadius: 18, padding: 18, width: "100%" }}>
          <div style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Search size={14} /> Partnerbörse aktiv</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{DISCIPLINES.find(d => d.key === reg.discipline)?.label} · Level {reg.level} · {reg.age}</div>
          <div style={{ fontSize: 13, color: "#6B7BA4", lineHeight: 1.6 }}>Sobald sich jemand meldet – WhatsApp.<br />Beide müssen innerhalb 24h zahlen.</div>
        </div>}
        {partnerMode === "have" && payOption === "self" && <div style={{ background: "#0D1F33", border: "1.5px solid #1E2845", borderRadius: 18, padding: 16, width: "100%" }}>
          <div style={{ fontSize: 13, color: "#F59E0B", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> Partner hat Zeit bis 72h vor Turnier</div>
          {["7 Tage · Partner erinnern", "3 Tage · Partner + du", "72h · Letzte Warnung – Backup-Karte"].map((r, i) => (
            <div key={i} style={{ fontSize: 13, color: "#6B7BA4", display: "flex", gap: 8, marginBottom: 6 }}><Clock size={13} color="#6B7BA4" /><span>{r}</span></div>
          ))}
        </div>}
        {payOption === "both" && <div style={{ background: "#0D2A1A", border: "1.5px solid #1A4A2A", borderRadius: 18, padding: 16, width: "100%" }}>
          <div style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700, marginBottom: 8 }}>Du hast für beide bezahlt</div>
          <div style={{ fontSize: 13, color: "#6B7BA4" }}>Dein Partner muss nichts mehr zahlen – beide bestätigt.</div>
        </div>}

        {/* Freund einladen vom Success Screen */}
        <button onClick={() => setScreenTracked("invite")} style={{ width: "100%", background: "linear-gradient(135deg,#1A2A4C,#0D1F33)", border: "1.5px solid #2A4A6C", borderRadius: 18, padding: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
          <UserPlus size={28} color="#60A5FA" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F0F4FF" }}>Freund einladen!</div>
            <div style={{ fontSize: 12, color: "#60A5FA", marginTop: 2 }}>Teile das Turnier per WhatsApp</div>
          </div>
          <span style={{ color: "#60A5FA" }}><ArrowRight size={16} /></span>
        </button>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {registrations.length < 3 && <button style={{ ...ST.btn, width: "100%" }} onClick={() => { setReg({ discipline: null, level: null, age: null }); setPartnerPhone(""); setPartnerMode(null); setPayOption(null); setStep(0); setLevelWarn(false); setScreenTracked("register"); }}><Plus size={16} style={{display:"inline",verticalAlign:"middle"}} /> Weitere Kategorie anmelden</button>}
          <button style={{ ...ST.ghost, width: "100%" }} onClick={() => setScreenTracked("dashboard")}>{registrations.length >= 3 ? "Zum Dashboard" : "Zurück zum Dashboard"}</button>
        </div>

        {registrations.length > 0 && <div style={{ width: "100%", background: "#0D1F33", borderRadius: 18, padding: 16, border: "1.5px solid #1E2845" }}>
          <div style={ST.lbl}>Meine Anmeldungen ({registrations.length}/3)</div>
          {registrations.map(r => {
            const d = DISCIPLINES.find(x => x.key === r.discipline);
            const col = lc(r.level);
            return <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><DIcon type={d?.icon} size={18} /><div><div style={{ fontSize: 13, fontWeight: 600 }}>{d?.label} · {r.age}</div><div style={{ fontSize: 11, color: r.paid ? "#4ADE80" : "#F59E0B" }}>{r.paid ? "Bezahlt" : "Ausstehend"}</div></div></div>
              <span style={ST.tag(col)}>{r.level}</span>
            </div>;
          })}
        </div>}
      </div>
    </div>
  );

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if (screen === "admin") return (
    <div style={ST.wrap}><div style={ST.page}>
      <div style={{ ...ST.hdr, justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#F0F4FF" }}>PICKLE<span style={{ color: "#F59E0B" }}>PASS</span> <span style={{ color: "#6B7BA4" }}>· ORGANISATOR</span></div><div style={{ fontSize: 22, fontWeight: 800 }}>Teilnehmerliste</div></div>
        <button style={{ ...ST.back, color: "#F59E0B" }} onClick={() => setScreenTracked("splash")}><X size={20} /></button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[{ label: "Gesamt", value: adminRegs.length, col: "#F0F4FF" }, { label: "Bezahlt", value: adminRegs.filter(r => r.paid).length, col: "#4ADE80" }, { label: "Offen", value: adminRegs.filter(r => !r.paid).length, col: "#F97316" }].map((stat, i) => (
          <div key={i} style={{ flex: 1, background: "#141A2E", borderRadius: 16, padding: 14, textAlign: "center", border: "1.5px solid #1E2845" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.col }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "#6B7BA4", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={ST.lbl}>Alle Anmeldungen</div>
      {adminRegs.length === 0 && <div style={{ ...ST.card, textAlign: "center", padding: 32, color: "#3A4A6A" }}><div style={{ fontSize: 36, marginBottom: 8 }}><ClipboardList size={36} color="#3A4A6A" /></div><div>Noch keine Anmeldungen</div></div>}
      {adminRegs.map(r => {
        const d = DISCIPLINES.find(x => x.key === r.discipline);
        const col = lc(r.level);
        return (
          <div key={r.id} style={{ ...ST.card, borderColor: !r.paid ? "#EF444433" : "#1E2845" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#6B7BA4", marginTop: 2 }}>{r.phone}</div>
                <div style={{ marginTop: 6 }}><DuprBadge rating={r.duprRating} verified={!!r.duprRating} size="small" /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span style={ST.tag(col)}>{r.level}</span>
                <span style={{ fontSize: 11, color: r.paid ? "#4ADE80" : "#EF4444", fontWeight: 700 }}>{r.paid ? (r.paidForPartner ? "Für beide" : "Bezahlt") : "Offen"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: r.partnerName ? 10 : 0 }}>
              <span style={ST.tag("#8B9CC0")}>{d?.icon} {d?.label}</span>
              <span style={ST.tag("#8B9CC0")}>{r.age}</span>
            </div>
            {r.partnerName && <div style={{ background: "#0D1F33", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13 }}><span style={{ color: "#6B7BA4" }}>Partner: </span><span style={{ fontWeight: 600 }}>{r.partnerName}</span></div>
              <span style={{ fontSize: 12, color: r.paidForPartner ? "#4ADE80" : "#F59E0B", fontWeight: 700 }}>{r.paidForPartner ? "Übernommen" : "Ausstehend"}</span>
            </div>}
            <div style={{ display: "flex", gap: 8 }}>
              {!r.paid && <button style={{ ...ST.btn, padding: 10, fontSize: 13 }} onClick={() => markPaid(r.id)}><CreditCard size={14} /> Als bezahlt markieren</button>}
            </div>
          </div>
        );
      })}
    </div></div>
  );

  return null;
}
