// ═══════════════════════════════════════════════════════════════
//  剧情动画 · 视觉小说版 (Visual Novel Edition v3)
//  风格参考:《未定事件簿》+《动物森友会》 — 温暖沉浸，有呼吸感
// ═══════════════════════════════════════════════════════════════

// ─────── Speech ───────
const VOICE_PROFILES = {
  clerk:   { rate: 1.05, pitch: 1.25, lang: 'zh-CN', prefer: 'female' },
  elder:   { rate: 0.88, pitch: 0.9,  lang: 'zh-CN', prefer: 'female' },
  teacher: { rate: 0.95, pitch: 1.0,  lang: 'zh-CN', prefer: 'male'   },
};
function pickVoice(profile) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const zh = voices.filter(v => /zh|Chinese/i.test(v.lang));
  const pool = zh.length ? zh : voices;
  return pool.find(v => profile.prefer === 'female'
    ? /female|woman|女|Xiaoxiao|Mei/i.test(v.name)
    : /male|man|男|Kangkang|Yunyang/i.test(v.name)
  ) || pool[0];
}
function speakLine(text, role) {
  if (!window.speechSynthesis || !text) return;
  const p = VOICE_PROFILES[role] || VOICE_PROFILES.clerk;
  const clean = text.replace(/\*\*/g,'').replace(/（[^）]*）/g,'').trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = p.rate; u.pitch = p.pitch; u.lang = p.lang;
  const v = pickVoice(p);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
if (typeof window !== 'undefined' && window.speechSynthesis)
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

// ─────── CSS ───────
(function injectVNCSS() {
  if (document.getElementById('vn-css')) return;
  const s = document.createElement('style');
  s.id = 'vn-css';
  s.textContent = `
@keyframes breathe    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.008)} }
@keyframes talk-bob   { 0%,100%{transform:translateY(0) rotate(0)} 30%{transform:translateY(-4px) rotate(-1.5deg)} 70%{transform:translateY(-3px) rotate(1.2deg)} }
@keyframes char-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
@keyframes char-leave { from{transform:translateX(0);opacity:1} to{transform:translateX(120px) rotate(8deg);opacity:0} }
@keyframes scene-in   { from{opacity:0} to{opacity:1} }
@keyframes dlg-rise   { from{transform:translateY(100%);opacity:0} to{transform:none;opacity:1} }
@keyframes name-pop   { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
@keyframes tap-pulse  { 0%,100%{opacity:.4;transform:translateX(0)} 50%{opacity:1;transform:translateX(4px)} }
@keyframes choice-in  { from{transform:translateY(28px);opacity:0} to{transform:none;opacity:1} }
@keyframes gold-ring  { 0%{box-shadow:0 0 0 0 rgba(255,206,60,0)} 40%{box-shadow:0 0 0 8px rgba(255,206,60,0.5)} 100%{box-shadow:0 0 0 18px rgba(255,206,60,0)} }
@keyframes wrong-flash{ 0%,100%{background:transparent} 40%{background:rgba(255,60,60,0.18)} }
@keyframes confetti-f { 0%{transform:translateY(0) rotate(0);opacity:1} 100%{transform:translateY(-180px) rotate(720deg);opacity:0} }
@keyframes result-in  { 0%{transform:translateY(30px) scale(.88);opacity:0} 65%{transform:translateY(-5px) scale(1.03)} 100%{transform:none;opacity:1} }
@keyframes teacher-in { from{transform:translateY(60px);opacity:0} to{transform:none;opacity:1} }
@keyframes act-reveal { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }
@keyframes hp-pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
@keyframes lamp-flick { 0%,95%,100%{opacity:1} 97%{opacity:0.7} }
@keyframes dust-float { 0%{transform:translateY(0) translateX(0);opacity:0} 20%{opacity:.5} 100%{transform:translateY(-80px) translateX(20px);opacity:0} }
`;
  document.head.appendChild(s);
})();

// ─────── Typewriter Hook ───────
function useTypewriter(text, speed = 36, active = true) {
  const [out, setOut] = React.useState('');
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!active) { setOut(text || ''); setDone(true); return; }
    setOut(''); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, active]);
  return { out, done };
}

// ─────── Confetti ───────
function ConfettiLayer() {
  const items = React.useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      x: 10 + Math.random() * 80,
      delay: Math.random() * .5,
      dur: .6 + Math.random() * .7,
      size: 6 + Math.random() * 9,
      color: ['#FFCE3C','#14B87A','#FF9E44','#4E7BFF','#FF6FA4','#A67BD6'][i % 6],
      round: Math.random() > .5,
    })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'none', overflow: 'hidden' }}>
      {items.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '40%', left: `${p.x}%`,
          width: p.size, height: p.size,
          borderRadius: p.round ? '50%' : 3,
          background: p.color,
          animation: `confetti-f ${p.dur}s ${p.delay}s ease-out both`,
        }}/>
      ))}
    </div>
  );
}

// ─────── Rich Pharmacy Background ───────
function VNPharmacyBG() {
  const shelfColors = ['#14B87A','#FF9E44','#4E7BFF','#FFCE3C','#FF6FA4','#A67BD6','#ff6b6b','#74B9FF'];
  const mkRow = (x, y, cols = 4, w = 28, h = 38) =>
    Array.from({ length: cols }, (_, i) => (
      <g key={i}>
        <rect x={x + i * (w + 4)} y={y} width={w} height={h} rx={3}
          fill={shelfColors[(i * 3 + Math.floor(y / 50)) % shelfColors.length]} opacity=".82"/>
        <rect x={x + i * (w + 4)} y={y} width={w} height={5} rx="3 3 0 0"
          fill="rgba(255,255,255,.25)"/>
        <rect x={x + 4 + i * (w + 4)} y={y + 8} width={w - 8} height={2} rx={1}
          fill="rgba(255,255,255,.4)"/>
        <rect x={x + 4 + i * (w + 4)} y={y + 12} width={w - 8} height={1.5} rx={1}
          fill="rgba(255,255,255,.25)"/>
      </g>
    ));

  return (
    <svg viewBox="0 0 380 520" width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, display: 'block' }}>
      <defs>
        <linearGradient id="wall-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7A4B20"/>
          <stop offset="60%" stopColor="#A86830"/>
          <stop offset="100%" stopColor="#C08040"/>
        </linearGradient>
        <radialGradient id="lamp-l" cx=".5" cy="0" r="1">
          <stop offset="0%" stopColor="#FFF4C0" stopOpacity=".22"/>
          <stop offset="100%" stopColor="#FFF4C0" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="lamp-r" cx=".5" cy="0" r="1">
          <stop offset="0%" stopColor="#FFF4C0" stopOpacity=".18"/>
          <stop offset="100%" stopColor="#FFF4C0" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="floor-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6B4020"/>
          <stop offset="100%" stopColor="#4A2C10"/>
        </linearGradient>
        <linearGradient id="counter-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5A2B"/>
          <stop offset="100%" stopColor="#5C3510"/>
        </linearGradient>
        <radialGradient id="center-haze" cx=".5" cy=".45" r=".55">
          <stop offset="0%" stopColor="#FFEBC0" stopOpacity=".12"/>
          <stop offset="100%" stopColor="#FFEBC0" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="vignette-t" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0500" stopOpacity=".7"/>
          <stop offset="30%" stopColor="#0A0500" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="vignette-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="70%" stopColor="#0A0500" stopOpacity="0"/>
          <stop offset="100%" stopColor="#0A0500" stopOpacity=".65"/>
        </linearGradient>
      </defs>

      {/* ── CEILING ── */}
      <rect width="380" height="50" fill="#120800"/>
      {/* Fluorescent strips */}
      <rect x="55" y="22" width="90" height="7" rx="3.5" fill="#FFFDE8" style={{ animation: 'lamp-flick 8s infinite' }}/>
      <rect x="57" y="22" width="90" height="3" rx="2" fill="#fff" opacity=".5"/>
      <rect x="235" y="22" width="90" height="7" rx="3.5" fill="#FFFDE8" style={{ animation: 'lamp-flick 11s 2s infinite' }}/>
      <rect x="237" y="22" width="90" height="3" rx="2" fill="#fff" opacity=".5"/>
      {/* Light cones */}
      <polygon points="100,29 20,420 180,420" fill="url(#lamp-l)"/>
      <polygon points="280,29 200,420 360,420" fill="url(#lamp-r)"/>

      {/* ── BACK WALL ── */}
      <rect x="0" y="50" width="380" height="340" fill="url(#wall-g)"/>

      {/* ── PHARMACY CROSS (glowing neon) ── */}
      <rect x="168" y="60" width="44" height="44" rx="7" fill="#0A5C38"/>
      <rect x="168" y="60" width="44" height="44" rx="7" fill="none" stroke="#14B87A" strokeWidth="2" opacity=".9"/>
      <rect x="181" y="65" width="18" height="34" rx="2" fill="#14B87A"/>
      <rect x="174" y="72" width="32" height="18" rx="2" fill="#14B87A"/>
      {/* Neon glow */}
      <rect x="168" y="60" width="44" height="44" rx="7" fill="none" stroke="#6DFFC0" strokeWidth="4" opacity=".15"/>
      <text x="190" y="106" textAnchor="middle" fontSize="8" fill="#14B87A" fontWeight="bold" opacity=".7">PHARMACY</text>

      {/* ── LEFT SHELF UNIT ── */}
      <rect x="0" y="58" width="130" height="332" fill="#F0E0C8"/>
      <rect x="0" y="58" width="130" height="8" fill="#D4A870"/>
      {/* Shelf boards */}
      {[108, 158, 208, 258, 308].map((y, i) => (
        <g key={i}>
          <rect x="0" y={y} width="130" height="5" fill="#C49060"/>
          <rect x="0" y={y + 5} width="130" height="1" fill="rgba(0,0,0,.15)"/>
          {mkRow(4, y - 44, 4, 26, 38)}
        </g>
      ))}
      {/* Last partial row */}
      {mkRow(4, 315, 4, 26, 36)}
      {/* Shelf shadow */}
      <rect x="130" y="58" width="6" height="332" fill="rgba(0,0,0,.18)"/>

      {/* ── RIGHT SHELF UNIT ── */}
      <rect x="250" y="58" width="130" height="332" fill="#F0E0C8"/>
      <rect x="250" y="58" width="130" height="8" fill="#D4A870"/>
      {[108, 158, 208, 258, 308].map((y, i) => (
        <g key={i}>
          <rect x="250" y={y} width="130" height="5" fill="#C49060"/>
          <rect x="250" y={y + 5} width="130" height="1" fill="rgba(0,0,0,.15)"/>
          {mkRow(254, y - 44, 4, 26, 38)}
        </g>
      ))}
      {mkRow(254, 315, 4, 26, 36)}
      <rect x="244" y="58" width="6" height="332" fill="rgba(0,0,0,.12)"/>

      {/* ── FLOOR TRANSITION ── */}
      <rect x="0" y="390" width="380" height="50" fill="url(#floor-g)"/>

      {/* ── COUNTER ── */}
      <rect x="0" y="440" width="380" height="80" fill="url(#counter-g)"/>
      <rect x="0" y="440" width="380" height="6" fill="#C09060"/>
      {/* Wood grain lines */}
      {[452, 462, 472, 482].map((y, i) => (
        <line key={i} x1="0" y1={y} x2="380" y2={y + 2} stroke="rgba(0,0,0,.08)" strokeWidth="1.5"/>
      ))}
      {/* POS Terminal */}
      <rect x="163" y="408" width="54" height="38" rx="5" fill="#1A1410"/>
      <rect x="168" y="413" width="44" height="22" rx="3" fill="#14B87A" opacity=".8"/>
      <rect x="170" y="415" width="40" height="14" rx="2" fill="#0D8054"/>
      <text x="190" y="424" textAnchor="middle" fontSize="8" fill="#6DFFC0" fontWeight="bold">¥68.00</text>
      {/* Terminal stand */}
      <rect x="183" y="446" width="14" height="4" rx="2" fill="#2A201A"/>

      {/* ── CENTER WARM HAZE ── */}
      <rect width="380" height="520" fill="url(#center-haze)"/>

      {/* ── VIGNETTES ── */}
      <rect width="380" height="520" fill="url(#vignette-t)"/>
      <rect width="380" height="520" fill="url(#vignette-b)"/>
      {/* Side vignettes */}
      <rect width="40" height="520" fill="rgba(0,0,0,.25)"/>
      <rect x="340" width="40" height="520" fill="rgba(0,0,0,.25)"/>

      {/* Floating dust particles */}
      {[80, 200, 300].map((x, i) => (
        <circle key={i} cx={x} cy={300 + i * 30} r="1.5" fill="#FFEBC0" opacity=".4"
          style={{ animation: `dust-float ${3 + i}s ${i * 1.5}s infinite` }}/>
      ))}
    </svg>
  );
}

// ─────── Xiaomei VN Sprite ───────
function XiaomeiVN({ emotion = 'neutral', talking = false, active = true, size = 160 }) {
  const [mouthOpen, setMouthOpen] = React.useState(false);
  React.useEffect(() => {
    if (!talking) { setMouthOpen(false); return; }
    const id = setInterval(() => setMouthOpen(m => !m), 160);
    return () => clearInterval(id);
  }, [talking]);

  const eyeMap = {
    neutral:   <><ellipse cx="42" cy="58" rx="3.5" ry="4.5" fill="#1A1F2C"/><ellipse cx="62" cy="58" rx="3.5" ry="4.5" fill="#1A1F2C"/></>,
    happy:     <><path d="M39 58 Q42 54 45 58" stroke="#1A1F2C" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M59 58 Q62 54 65 58" stroke="#1A1F2C" strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    surprised: <><ellipse cx="42" cy="58" rx="4" ry="5.5" fill="#1A1F2C"/><ellipse cx="62" cy="58" rx="4" ry="5.5" fill="#1A1F2C"/><circle cx="43.5" cy="56.5" r="1.5" fill="#fff"/><circle cx="63.5" cy="56.5" r="1.5" fill="#fff"/></>,
    frozen:    <><path d="M39 57 L45 57" stroke="#1A1F2C" strokeWidth="2" strokeLinecap="round"/><path d="M59 57 L65 57" stroke="#1A1F2C" strokeWidth="2" strokeLinecap="round"/></>,
  };
  const browMap = {
    neutral:   <><path d="M38 50 Q42 47 46 50" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M58 50 Q62 47 66 50" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
    happy:     <><path d="M38 48 Q42 46 46 48" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M58 48 Q62 46 66 48" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
    surprised: <><path d="M38 46 Q42 43 46 46" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M58 46 Q62 43 66 46" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
    frozen:    <><path d="M38 50 Q42 52 46 50" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M58 50 Q62 52 66 50" stroke="#2A1810" strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
  };
  const blushOpacity = { neutral: 0.18, happy: 0.5, surprised: 0.35, frozen: 0 };

  return (
    <div style={{
      display: 'inline-block',
      filter: active ? 'brightness(1) drop-shadow(0 4px 16px rgba(20,184,122,0.25))' : 'brightness(0.55) saturate(0.4)',
      transform: active ? 'scale(1.04)' : 'scale(0.94)',
      transformOrigin: 'bottom center',
      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      animation: active ? (talking ? 'talk-bob 0.32s ease-in-out infinite' : 'breathe 4s ease-in-out infinite') : 'none',
    }}>
      <svg width={size} height={size * 1.08} viewBox="0 0 104 112" style={{ display: 'block', overflow: 'visible' }}>
        {/* Body shadow */}
        <ellipse cx="52" cy="112" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
        {/* Uniform body */}
        <path d="M18 100 Q18 88 52 88 Q86 88 86 100 L90 112 L14 112 Z" fill="#14B87A"/>
        <path d="M18 100 Q18 88 52 88" stroke="#0A8050" strokeWidth="1" fill="none"/>
        {/* White collar + lapel */}
        <path d="M38 88 L52 100 L66 88 L62 82 L42 82 Z" fill="#fff"/>
        <path d="M38 88 L38 108 L52 100 Z" fill="#E8F9F2"/>
        <path d="M66 88 L66 108 L52 100 Z" fill="#E8F9F2"/>
        {/* Collar outline */}
        <path d="M38 88 L52 100 L66 88" stroke="#D0E8DC" strokeWidth="1" fill="none"/>
        {/* Employee badge */}
        <rect x="62" y="100" width="16" height="10" rx="2" fill="#fff" opacity=".9"/>
        <rect x="63" y="102" width="10" height="2" rx="1" fill="#14B87A"/>
        <rect x="63" y="105.5" width="7" height="1.5" rx=".7" fill="#ccc"/>
        <circle cx="74.5" cy="104" r="2" fill="#E0F0E8"/>
        {/* Neck */}
        <rect x="45" y="82" width="14" height="10" rx="2" fill="#FFD8B0"/>
        {/* Face */}
        <ellipse cx="52" cy="56" rx="24" ry="26" fill="#FFD8B0"/>
        {/* Face shading */}
        <ellipse cx="52" cy="60" rx="20" ry="20" fill="rgba(255,160,100,0.08)"/>
        {/* Ears */}
        <ellipse cx="28" cy="58" rx="3.5" ry="4.5" fill="#FFCA9A"/>
        <ellipse cx="76" cy="58" rx="3.5" ry="4.5" fill="#FFCA9A"/>
        {/* Hair back */}
        <path d="M28 56 Q28 28 52 26 Q76 28 76 56 Q74 38 64 34 Q52 30 40 34 Q30 38 28 56 Z" fill="#2A1810"/>
        {/* Hair side strands */}
        <path d="M28 55 Q24 65 26 78 Q28 72 30 68 Q29 62 28 55 Z" fill="#2A1810"/>
        <path d="M76 55 Q80 65 78 78 Q76 72 74 68 Q75 62 76 55 Z" fill="#2A1810"/>
        {/* Hair bun */}
        <circle cx="52" cy="26" r="10" fill="#2A1810"/>
        <circle cx="52" cy="25" r="7" fill="#38221A"/>
        <path d="M46 26 Q52 22 58 26" stroke="#1A0C08" strokeWidth="1.5" fill="none"/>
        {/* Hair accessories */}
        <circle cx="60" cy="20" r="3" fill="#FF6FA4" opacity=".9"/>
        {/* Eyebrows */}
        {browMap[emotion] || browMap.neutral}
        {/* Eyes */}
        {eyeMap[emotion] || eyeMap.neutral}
        {/* Eye shine (neutral only) */}
        {(emotion === 'neutral' || emotion === 'happy') && <>
          <circle cx="43.5" cy="56.5" r="1.2" fill="#fff"/>
          <circle cx="63.5" cy="56.5" r="1.2" fill="#fff"/>
        </>}
        {/* Nose */}
        <ellipse cx="52" cy="65" rx="1.5" ry="1.2" fill="#E8A880" opacity=".5"/>
        {/* Mouth */}
        {mouthOpen
          ? <ellipse cx="52" cy="73" rx="4" ry="3.5" fill="#B06050"/>
          : emotion === 'happy'
            ? <path d="M46 71 Q52 77 58 71" stroke="#C08060" strokeWidth="2" fill="none" strokeLinecap="round"/>
            : emotion === 'frozen'
              ? <line x1="48" y1="72" x2="56" y2="72" stroke="#C08060" strokeWidth="1.5" strokeLinecap="round"/>
              : <path d="M47 72 Q52 75 57 72" stroke="#C08060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        }
        {/* Blush */}
        <ellipse cx="35" cy="67" rx="6" ry="4" fill="#FF9EB0" opacity={blushOpacity[emotion] ?? 0.18}/>
        <ellipse cx="69" cy="67" rx="6" ry="4" fill="#FF9EB0" opacity={blushOpacity[emotion] ?? 0.18}/>
        {/* Frozen sweat drop */}
        {emotion === 'frozen' && <>
          <ellipse cx="76" cy="46" rx="2.5" ry="4" fill="#A0DCFF" opacity=".8"/>
          <path d="M73 46 Q74.5 42 76 46" fill="#A0DCFF" opacity=".8"/>
          <text x="52" y="42" textAnchor="middle" fontSize="12">💭</text>
        </>}
      </svg>
    </div>
  );
}

// ─────── Wang Auntie VN Sprite ───────
function WangAuntieVN({ emotion = 'neutral', talking = false, active = true, size = 160 }) {
  const [mouthOpen, setMouthOpen] = React.useState(false);
  React.useEffect(() => {
    if (!talking) { setMouthOpen(false); return; }
    const id = setInterval(() => setMouthOpen(m => !m), 200);
    return () => clearInterval(id);
  }, [talking]);

  const eyeMap = {
    neutral:   <><line x1="38" y1="55" x2="47" y2="55" stroke="#2A1810" strokeWidth="2.2" strokeLinecap="round"/><line x1="57" y1="55" x2="66" y2="55" stroke="#2A1810" strokeWidth="2.2" strokeLinecap="round"/></>,
    curious:   <><ellipse cx="42.5" cy="55" rx="3.5" ry="4" fill="#2A1810"/><ellipse cx="61.5" cy="55" rx="3.5" ry="4" fill="#2A1810"/><circle cx="43.5" cy="54" r="1" fill="#fff"/><circle cx="62.5" cy="54" r="1" fill="#fff"/></>,
    annoyed:   <><path d="M38 57 L47 55" stroke="#2A1810" strokeWidth="2.2" strokeLinecap="round"/><path d="M57 55 L66 57" stroke="#2A1810" strokeWidth="2.2" strokeLinecap="round"/></>,
    satisfied: <><path d="M38 56 Q42.5 53 47 56" stroke="#2A1810" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M57 56 Q61.5 53 66 56" stroke="#2A1810" strokeWidth="2" fill="none" strokeLinecap="round"/></>,
  };
  const browMap = {
    neutral:   <><path d="M36 47 Q42 45 48 47" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M56 47 Q62 45 68 47" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    curious:   <><path d="M36 45 Q42 41 48 45" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M56 45 Q62 41 68 45" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    annoyed:   <><path d="M36 45 Q42 48 48 47" stroke="#333" strokeWidth="2.2" fill="none" strokeLinecap="round"/><path d="M56 47 Q62 48 68 45" stroke="#333" strokeWidth="2.2" fill="none" strokeLinecap="round"/></>,
    satisfied: <><path d="M36 47 Q42 44 48 47" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M56 47 Q62 44 68 47" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round"/></>,
  };

  return (
    <div style={{
      display: 'inline-block',
      filter: active ? 'brightness(1) drop-shadow(0 4px 16px rgba(200,80,80,0.2))' : 'brightness(0.55) saturate(0.4)',
      transform: active ? 'scale(1.04)' : 'scale(0.94)',
      transformOrigin: 'bottom center',
      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      animation: active ? (talking ? 'talk-bob 0.38s ease-in-out infinite' : 'breathe 5s 0.8s ease-in-out infinite') : 'none',
    }}>
      <svg width={size} height={size * 1.08} viewBox="0 0 104 112" style={{ display: 'block', overflow: 'visible' }}>
        <ellipse cx="52" cy="112" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
        {/* Clothes */}
        <path d="M16 100 Q16 87 52 87 Q88 87 88 100 L92 112 L12 112 Z" fill="#B83030"/>
        <path d="M16 100 Q16 87 52 87" stroke="#8A1A1A" strokeWidth="1" fill="none"/>
        {/* Collar */}
        <path d="M40 87 Q52 97 64 87 L62 80 L42 80 Z" fill="#C84040"/>
        <path d="M40 87 Q52 97 64 87" stroke="#FF7070" strokeWidth="1" fill="none"/>
        {/* Neck */}
        <rect x="43" y="78" width="18" height="12" rx="3" fill="#E8C8A0"/>
        {/* Face */}
        <ellipse cx="52" cy="55" rx="25" ry="27" fill="#E8C8A0"/>
        <ellipse cx="52" cy="60" rx="22" ry="22" fill="rgba(200,120,60,0.06)"/>
        {/* Ears */}
        <ellipse cx="27" cy="57" rx="4" ry="5" fill="#DCBA94"/>
        <ellipse cx="77" cy="57" rx="4" ry="5" fill="#DCBA94"/>
        {/* Earrings */}
        <circle cx="27" cy="62" r="3" fill="#D4AF37"/>
        <circle cx="77" cy="62" r="3" fill="#D4AF37"/>
        {/* Gray permed hair */}
        <path d="M26 54 Q26 26 52 23 Q78 26 78 54 Q76 36 64 32 Q52 28 40 32 Q28 36 26 54 Z" fill="#909090"/>
        {/* Curly texture */}
        {[[27,47,6],[35,30,5],[50,24,5.5],[65,30,5],[77,47,6],[33,38,4],[68,38,4]].map(([cx,cy,r],i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#828282" opacity=".9"/>
        ))}
        {/* Hair highlights */}
        <path d="M40 32 Q52 28 64 32" stroke="#B0B0B0" strokeWidth="1.5" fill="none" opacity=".6"/>
        {/* Glasses frame */}
        <circle cx="42.5" cy="55" r="8" fill="rgba(200,230,255,0.12)" stroke="#2A1810" strokeWidth="1.8"/>
        <circle cx="61.5" cy="55" r="8" fill="rgba(200,230,255,0.12)" stroke="#2A1810" strokeWidth="1.8"/>
        <path d="M50.5 55 L53.5 55" stroke="#2A1810" strokeWidth="1.5"/>
        <path d="M26 52 L34 53.5" stroke="#2A1810" strokeWidth="1.5"/>
        <path d="M69.5 53.5 L78 52" stroke="#2A1810" strokeWidth="1.5"/>
        {/* Eyebrows */}
        {browMap[emotion] || browMap.neutral}
        {/* Eyes */}
        {eyeMap[emotion] || eyeMap.neutral}
        {/* Nose */}
        <path d="M49 65 Q52 68 55 65" stroke="#C09070" strokeWidth="1.2" fill="none"/>
        {/* Mouth */}
        {mouthOpen
          ? <ellipse cx="52" cy="75" rx="4.5" ry="3.5" fill="#9A5040"/>
          : emotion === 'satisfied'
            ? <path d="M46 74 Q52 79 58 74" stroke="#A07060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            : emotion === 'annoyed'
              ? <path d="M47 76 Q52 73 57 76" stroke="#A07060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              : <line x1="47" y1="74" x2="57" y2="74" stroke="#A07060" strokeWidth="1.8" strokeLinecap="round"/>
        }
        {/* Blush */}
        {emotion === 'satisfied' && <>
          <ellipse cx="35" cy="66" rx="6" ry="4" fill="#FF9EB0" opacity=".35"/>
          <ellipse cx="69" cy="66" rx="6" ry="4" fill="#FF9EB0" opacity=".35"/>
        </>}
        {/* Wrinkle lines (subtle) */}
        <path d="M30 60 Q33 62 35 60" stroke="#C09070" strokeWidth=".7" fill="none" opacity=".4"/>
        <path d="M69 60 Q72 62 74 60" stroke="#C09070" strokeWidth=".7" fill="none" opacity=".4"/>
      </svg>
    </div>
  );
}

// ─────── VN Dialogue Box ───────
function VNDialogBox({ speakerKey, speakerLabel, speakerColor, text, onTap, autoType = true }) {
  const { out, done } = useTypewriter(text, 38, autoType);
  return (
    <div onClick={done ? onTap : undefined} style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(14,8,2,0.88)',
      backdropFilter: 'blur(12px)',
      borderTop: `2px solid ${speakerColor || '#FFCE3C'}44`,
      padding: '12px 18px 32px',
      cursor: done ? 'pointer' : 'default',
      animation: 'dlg-rise 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Speaker name badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: speakerColor || '#FFCE3C',
        color: '#1A0A00', padding: '4px 14px', borderRadius: 999,
        fontSize: 13, fontWeight: 900,
        marginBottom: 10,
        animation: 'name-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: `0 2px 12px ${speakerColor || '#FFCE3C'}55`,
      }}>
        {speakerLabel}
      </div>
      {/* Dialogue text */}
      <div style={{ fontSize: 16, fontWeight: 600, color: '#FFF8F0', lineHeight: 1.6, minHeight: 50, letterSpacing: 0.3 }}>
        {out}
        {!done && <span style={{ borderRight: '2px solid #FFCE3C', animation: 'tap-pulse 0.7s infinite', marginLeft: 1 }}>&nbsp;</span>}
      </div>
      {/* Tap to continue */}
      {done && (
        <div style={{ position: 'absolute', bottom: 10, right: 20, fontSize: 11, color: 'rgba(255,248,240,0.5)', display: 'flex', alignItems: 'center', gap: 4, animation: 'tap-pulse 1.2s infinite' }}>
          点击继续 ▶
        </div>
      )}
    </div>
  );
}

// ─────── Choice Panel ───────
function ChoicePanel({ question, options, onSelect, selected }) {
  const feedbackColor = { best: '#14B87A', ok: '#FF9E44', bad: '#FF5B5B' };
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 28px', background: 'linear-gradient(transparent 0%, rgba(10,5,0,0.95) 15%)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFCE3C', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 }}>
        🎯 {question}
      </div>
      {options.map((o, i) => {
        const picked = selected?.id === o.id;
        const showResult = !!selected;
        const isBest = showResult && o.feedback === 'best';
        const isWrong = picked && o.feedback !== 'best';
        const borderColor = isBest ? '#14B87A' : isWrong ? '#FF5B5B' : picked ? '#FF9E44' : 'rgba(255,248,240,0.2)';
        const bgColor = isBest ? 'rgba(20,184,122,0.18)' : isWrong ? 'rgba(255,91,91,0.15)' : 'rgba(255,248,240,0.06)';
        return (
          <button key={o.id}
            onClick={() => !selected && onSelect(o)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
              background: bgColor, border: `2px solid ${borderColor}`,
              borderRadius: 14, padding: '11px 13px', marginBottom: 8,
              cursor: selected ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)', textAlign: 'left',
              animation: `choice-in 0.4s ${i * 0.1}s cubic-bezier(0.34,1.56,0.64,1) both`,
              boxShadow: isBest ? '0 0 0 3px rgba(20,184,122,0.3), 0 4px 20px rgba(20,184,122,0.25)' : isWrong ? 'none' : 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = 'rgba(255,248,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,206,60,0.6)'; } }}
            onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = bgColor; e.currentTarget.style.borderColor = borderColor; } }}
          >
            {/* Option tag */}
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: isBest ? '#14B87A' : isWrong ? '#FF5B5B' : 'rgba(255,206,60,0.25)',
              color: isBest || isWrong ? '#fff' : '#FFCE3C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900,
            }}>
              {isBest ? '✓' : isWrong ? '✕' : o.id}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFF8F0', lineHeight: 1.4 }}>{o.text}</div>
              {showResult && (isBest || isWrong) && (
                <div style={{ fontSize: 11.5, color: isBest ? '#6DFFC0' : '#FF9EB0', marginTop: 4, lineHeight: 1.4 }}>
                  {o.why}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────── Scene Intro (cinematic title) ───────
function SceneIntroAct({ onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, zIndex: 5 }}>
      <div style={{ textAlign: 'center', animation: 'scene-in 0.8s ease' }}>
        {/* Black bar lines (cinematic letterbox) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: '#000' }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: '#000' }}/>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ width: 50, height: 2, background: '#FFCE3C', margin: '0 auto 10px', animation: 'act-reveal 0.6s 0.4s ease both' }}/>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: 6, textTransform: 'uppercase', animation: 'scene-in 0.8s 0.3s both' }}>
            第 1 幕
          </div>
          <div style={{ fontSize: 12, color: '#FFCE3C', letterSpacing: 3, marginTop: 6, animation: 'scene-in 0.8s 0.6s both' }}>
            真实场景
          </div>
          <div style={{ width: 50, height: 2, background: '#FFCE3C', margin: '10px auto 0', animation: 'act-reveal 0.6s 0.8s ease both' }}/>
        </div>
      </div>
    </div>
  );
}

// ─────── Teacher Spotlight ───────
function TeacherSpotlightAct({ text }) {
  const parts = (text || '').split('**');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,5,0,0.75)', backdropFilter: 'blur(3px)' }}/>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, animation: 'teacher-in 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Teacher avatar */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FFDF80, #FFCE3C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, boxShadow: '0 0 0 5px rgba(255,206,60,0.25), 0 0 30px rgba(255,206,60,0.35)' }}>
          👨‍🏫
        </div>
        {/* Card */}
        <div style={{ background: 'rgba(30,18,5,0.95)', border: '1.5px solid rgba(255,206,60,0.5)', borderRadius: 22, padding: '18px 20px', boxShadow: '0 0 40px rgba(255,206,60,0.15), 0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ background: '#FFCE3C', color: '#6B4D00', fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 999 }}>💡 老师讲解</div>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: '#FFF8EC', fontWeight: 500 }}>
            {parts.map((t, i) => i % 2 === 1
              ? <strong key={i} style={{ color: '#FF9E44', fontWeight: 900 }}>{t}</strong>
              : t)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────── Outcome Screen ───────
function OutcomeAct({ bad }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 28px', zIndex: 5 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,5,0,0.6)', backdropFilter: 'blur(2px)' }}/>
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', animation: 'result-in 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 16 }}>😔</div>
        <div style={{ background: 'rgba(20,5,5,0.9)', border: '2px solid rgba(255,91,91,0.6)', borderRadius: 20, padding: '20px 24px', boxShadow: '0 0 40px rgba(255,91,91,0.2)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FF7070', marginBottom: 8 }}>顾客结账离开了</div>
          <div style={{ fontSize: 13, color: 'rgba(255,248,240,0.6)', lineHeight: 1.6 }}>一个潜在会员就这样流失了……</div>
        </div>
      </div>
    </div>
  );
}

// ─────── Result Screen ───────
function ResultAct({ choice, onComplete }) {
  const isBest = choice?.feedback === 'best';
  const isOk = choice?.feedback === 'ok';
  const color = isBest ? '#14B87A' : isOk ? '#FF9E44' : '#FF5B5B';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', zIndex: 10 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,5,0,0.85)', backdropFilter: 'blur(6px)' }}/>
      {isBest && <ConfettiLayer/>}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, animation: 'result-in 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize: 72 }}>{isBest ? '🎉' : isOk ? '🤔' : '😢'}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, textShadow: `0 0 20px ${color}66` }}>
          {isBest ? '顾客成功办卡！' : isOk ? '勉强通过' : '顾客离开了'}
        </div>
        <div style={{ background: 'rgba(255,248,240,0.06)', border: `1.5px solid ${color}44`, borderRadius: 16, padding: '14px 18px', textAlign: 'center', maxWidth: 300 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,248,240,0.7)', lineHeight: 1.6 }}>{choice?.why}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ fontSize: 22, opacity: i < (choice?.score || 0) ? 1 : 0.2, filter: i < (choice?.score || 0) ? 'drop-shadow(0 0 6px #FFCE3C)' : 'none' }}>⭐</span>
            ))}
          </div>
        </div>
        {isBest && (
          <div style={{ background: 'rgba(20,184,122,0.15)', border: '1.5px solid rgba(20,184,122,0.4)', borderRadius: 12, padding: '10px 18px', animation: 'result-in 0.7s 0.3s both' }}>
            <div style={{ fontSize: 13, color: '#6DFFC0', fontWeight: 800 }}>🏅 获得技能点 +30 · 收银话术解锁</div>
          </div>
        )}
        <button onClick={onComplete} style={{
          padding: '14px 40px', borderRadius: 18, border: 0,
          background: isBest ? '#14B87A' : 'rgba(255,248,240,0.12)',
          color: isBest ? '#fff' : 'rgba(255,248,240,0.7)',
          fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 900,
          boxShadow: isBest ? '0 5px 0 #0A7A50, 0 8px 24px rgba(20,184,122,0.3)' : 'none',
          cursor: 'pointer', letterSpacing: 1,
          animation: 'result-in 0.7s 0.5s both',
        }}>完成 · 领取奖励 →</button>
      </div>
    </div>
  );
}

// ─────── Top HUD ───────
function StoryTopBar({ step, total, muted, setMuted, onClose }) {
  const pct = step / Math.max(total - 1, 1);
  return (
    <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,248,240,0.12)', border: '1px solid rgba(255,248,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        {Icon.x(16, 'rgba(255,248,240,0.7)')}
      </button>
      {/* Segmented progress (RPG style) */}
      <div style={{ flex: 1, position: 'relative', height: 6 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: 'rgba(255,248,240,0.12)' }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct * 100}%`, borderRadius: 3, background: 'linear-gradient(90deg,#14B87A,#FFCE3C)', transition: 'width 0.4s ease', boxShadow: '0 0 8px rgba(20,184,122,0.6)' }}/>
        {/* Segment notches */}
        {Array.from({ length: total - 1 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: -1, bottom: -1, left: `${((i + 1) / total) * 100}%`, width: 2, background: 'rgba(10,5,0,0.5)', borderRadius: 1 }}/>
        ))}
      </div>
      {/* HP hearts */}
      <div style={{ display: 'flex', gap: 3 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ fontSize: 16, lineHeight: 1, filter: 'drop-shadow(0 0 4px rgba(255,80,80,0.6))', animation: i === 0 ? 'hp-pulse 2s 1s infinite' : 'none' }}>❤️</div>
        ))}
      </div>
      {/* Mute button */}
      <button onClick={() => { setMuted(m => !m); if (!muted) window.speechSynthesis?.cancel(); }} style={{ width: 36, height: 36, borderRadius: '50%', background: muted ? 'rgba(255,248,240,0.08)' : 'rgba(20,184,122,0.25)', border: `1px solid ${muted ? 'rgba(255,248,240,0.15)' : 'rgba(20,184,122,0.6)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
        {Icon.volume(16, muted ? 'rgba(255,248,240,0.35)' : '#6DFFC0')}
        {muted && <div style={{ position: 'absolute', width: 24, height: 2, background: 'rgba(255,248,240,0.5)', transform: 'rotate(-35deg)', borderRadius: 1 }}/>}
      </button>
    </div>
  );
}

// ─────── Main StoryAnimation ───────
function StoryAnimation({ onComplete, avatarStyle = 'chibi' }) {
  const STEPS = [
    { type: 'scene-intro' },
    { type: 'clerk-speak',    text: '好的，一共 68 元。\n您有会员卡吗？可以帮您查查优惠。' },
    { type: 'customer-speak', text: '没有。', emotion: 'neutral' },
    { type: 'clerk-frozen',   text: '……' },
    { type: 'customer-speak', text: '那结账吧。', emotion: 'annoyed', leaving: true },
    { type: 'outcome-bad' },
    { type: 'act-divider',    label: '第 2 幕 · 正确做法' },
    { type: 'teacher',        text: '当顾客说「没有」，其实是**最佳时机**——她愿意听！把好处量化到「今天这单」，30 秒说清楚 6 大权益。' },
    { type: 'choice',         question: '现在换你来！顾客说「没有」后：',
      options: [
        { id: 'A', text: '"那您要不要办一张？"',                      feedback: 'ok',   score: 1, why: '太被动——顾客容易直接说"不用了"。' },
        { id: 'B', text: '"今天这单 68 元，办卡立减 5 元，还送礼品。"',feedback: 'best', score: 3, why: '量化到今天这单，顾客耳朵立刻竖起来。' },
        { id: 'C', text: '直接扫码结账，不再多问。',                    feedback: 'bad',  score: 0, why: '错过了所有引导机会。' },
      ]},
    { type: 'result' },
  ];

  const [step, setStep] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [choice, setChoice] = React.useState(null);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [divider, setDivider] = React.useState(null);
  const current = STEPS[step];

  const goNext = React.useCallback(() => {
    const ni = step + 1;
    if (ni >= STEPS.length) return;
    const ns = STEPS[ni];
    if (ns.type === 'act-divider') {
      setDivider(ns.label);
      setTimeout(() => { setDivider(null); setStep(ni + 1); }, 2200);
    } else {
      setStep(ni);
    }
  }, [step]);

  const doChoice = (c) => {
    setChoice(c);
    if (c.feedback === 'best') setShowConfetti(true);
    if (!muted) speakLine(c.why, 'teacher');
    setTimeout(goNext, 600);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  // Auto voice
  React.useEffect(() => {
    if (muted) return;
    const map = {
      'clerk-speak':    ['clerk', current?.text],
      'clerk-frozen':   ['clerk', '大脑一片空白'],
      'customer-speak': ['elder', current?.text],
      'teacher':        ['teacher', current?.text],
    };
    const e = map[current?.type];
    if (e) {
      const t = setTimeout(() => speakLine(e[1], e[0]), 400);
      return () => clearTimeout(t);
    }
  }, [step, muted]);
  React.useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Determine character states
  const isClerkSpeaking   = current.type === 'clerk-speak' || current.type === 'clerk-frozen';
  const isCustomerSpeaking = current.type === 'customer-speak';
  const showChars = ['clerk-speak','customer-speak','clerk-frozen','choice'].includes(current.type);
  const customerLeaving = current.leaving;

  // Customer emotion
  const custEmotion = current.type === 'customer-speak' ? (current.emotion || 'neutral') : 'neutral';
  // Clerk emotion
  const clerkEmotion = current.type === 'clerk-frozen' ? 'frozen' : current.type === 'clerk-speak' ? 'neutral' : 'neutral';

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: '#120800', fontFamily: 'var(--font-sans)' }}>
      {/* Confetti */}
      {showConfetti && <ConfettiLayer/>}

      {/* Act divider overlay */}
      {divider && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 60, height: 2, background: '#FFCE3C', animation: 'act-reveal 0.7s 0.2s both' }}/>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: 5, animation: 'scene-in 0.7s 0.5s both' }}>{divider.split('·')[0]}</div>
          <div style={{ fontSize: 12, color: '#FFCE3C', letterSpacing: 2, animation: 'scene-in 0.7s 0.8s both' }}>{divider.split('·')[1]}</div>
          <div style={{ width: 60, height: 2, background: '#FFCE3C', animation: 'act-reveal 0.7s 1s both' }}/>
        </div>
      )}

      {/* Background */}
      <VNPharmacyBG/>

      {/* HUD */}
      <StoryTopBar step={step} total={STEPS.length} muted={muted} setMuted={setMuted} onClose={onComplete}/>

      {/* Scene intro */}
      {current.type === 'scene-intro' && <SceneIntroAct onDone={goNext}/>}

      {/* Characters */}
      {showChars && (
        <div style={{ position: 'absolute', bottom: current.type === 'choice' ? 260 : 148, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 12px', zIndex: 4 }}>
          <div style={{ animation: customerLeaving ? 'none' : 'scene-in 0.5s ease' }}>
            <XiaomeiVN emotion={clerkEmotion} talking={isClerkSpeaking && current.type !== 'clerk-frozen'} active={isClerkSpeaking || current.type === 'choice'} size={150}/>
          </div>
          <div style={{ animation: customerLeaving ? 'char-leave 0.8s ease both' : 'scene-in 0.5s 0.15s ease both' }}>
            <WangAuntieVN emotion={custEmotion} talking={isCustomerSpeaking} active={isCustomerSpeaking} size={150}/>
          </div>
        </div>
      )}

      {/* Outcome */}
      {current.type === 'outcome-bad' && <OutcomeAct bad/>}

      {/* Teacher */}
      {current.type === 'teacher' && <TeacherSpotlightAct text={current.text}/>}

      {/* Result */}
      {current.type === 'result' && <ResultAct choice={choice} onComplete={onComplete}/>}

      {/* Dialogue box */}
      {(current.type === 'clerk-speak' || current.type === 'clerk-frozen') && (
        <VNDialogBox key={step}
          speakerKey="clerk" speakerLabel="小美（你）" speakerColor="#14B87A"
          text={current.type === 'clerk-frozen' ? '……（大脑一片空白，不知道说什么）' : current.text}
          onTap={goNext}
        />
      )}
      {current.type === 'customer-speak' && (
        <VNDialogBox key={step}
          speakerKey="elder" speakerLabel="王阿姨" speakerColor="#FF9E44"
          text={current.text}
          onTap={goNext}
        />
      )}
      {current.type === 'outcome-bad' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 18px 32px', zIndex: 10 }}>
          <button onClick={goNext} style={{ width: '100%', padding: '14px 0', borderRadius: 16, border: 0, background: '#14B87A', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 900, letterSpacing: 1, boxShadow: '0 5px 0 #0A7A50', cursor: 'pointer' }}>
            看看正确做法 →
          </button>
        </div>
      )}
      {current.type === 'teacher' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 18px 32px', zIndex: 15 }}>
          <button onClick={goNext} style={{ width: '100%', padding: '14px 0', borderRadius: 16, border: 0, background: '#FFCE3C', color: '#6B4D00', fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 900, letterSpacing: 1, boxShadow: '0 5px 0 #B8890A', cursor: 'pointer' }}>
            明白了，我来试试 →
          </button>
        </div>
      )}
      {current.type === 'choice' && (
        <ChoicePanel question={current.question} options={current.options} onSelect={doChoice} selected={choice}/>
      )}
    </div>
  );
}

// ─────── Legacy TopBar (for screen-quiz.jsx) ───────
function TopBar({ step, totalSteps, onClose }) {
  return (
    <div style={{ position: 'absolute', top: 48, left: 20, right: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.08)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {Icon.x(18, '#1A1F2C')}
      </button>
      <ProgressBar value={step / Math.max(1, totalSteps - 1)} color="#FF9E44" height={12}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{Icon.heart(20)}<span style={{ fontWeight: 800 }}>3</span></div>
    </div>
  );
}

Object.assign(window, { StoryAnimation, TopBar });
