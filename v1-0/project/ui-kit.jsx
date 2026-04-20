// UI Kit: 图标、气泡、星星、火焰、按钮、评分等通用组件

// ─────────── 图标库（线性风格 SVG） ───────────
const Icon = {
  home: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 10l9-7 9 7v11a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V10z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
  map: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 3l6 2 5-2v16l-5 2-6-2-5 2V5l5-2z M9 3v16 M15 5v16" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
  trophy: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 4h10v7a5 5 0 01-10 0V4z M5 6H3v2a2 2 0 002 2 M19 6h2v2a2 2 0 01-2 2 M10 16h4v3h-4z M8 20h8" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
  user: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="2"/><path d="M4 21a8 8 0 0116 0" stroke={c} strokeWidth="2"/></svg>,
  mic: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" stroke={c} strokeWidth="2"/><path d="M5 11a7 7 0 0014 0 M12 18v3" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  keyboard: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="13" rx="2" stroke={c} strokeWidth="2"/><path d="M6 11h.01 M10 11h.01 M14 11h.01 M18 11h.01 M7 15h10" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  play: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 4v16l13-8z" fill={c}/></svg>,
  pause: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill={c}/><rect x="14" y="4" width="4" height="16" fill={c}/></svg>,
  check: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6 10-12" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12 M18 6L6 18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></svg>,
  chevronR: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronL: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  flame: (s=24,c='#FF9E44') => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2s4 5 4 10a4 4 0 01-8 0c0-3 2-4 2-7 0-2-1-3-1-3s3 1 3 0zM8 14c0 2 2 4 4 4s4-1.5 4-4-2-1-2-3c0 0-2 3-4 3s-2-2-2 0z" fill={c}/></svg>,
  star: (s=24,c='#FFCE3C',filled=true) => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill={filled?c:'none'} stroke={c} strokeWidth={filled?0:2}/></svg>,
  gem: (s=24,c='#4E7BFF') => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z" fill={c} opacity="0.9"/><path d="M6 3l4 6h4l4-6 M2 9h20 M12 21V9" stroke="#fff" strokeWidth="1"/></svg>,
  lock: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="11" rx="2" stroke={c} strokeWidth="2"/><path d="M8 10V7a4 4 0 018 0v3" stroke={c} strokeWidth="2"/></svg>,
  heart: (s=24,c='#FF5B5B') => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a5 5 0 018-4 5 5 0 018 4c0 6-8 11-8 11z" fill={c}/></svg>,
  sparkle: (s=24,c='#FFCE3C') => <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={c}/></svg>,
  volume: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 10v4h4l5 4V6L7 10H3z M16 8a5 5 0 010 8 M19 5a9 9 0 010 14" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  replay: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1015-6.7L21 3 M21 3v6h-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  shield: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2l8 3v7c0 5-3 8-8 10-5-2-8-5-8-10V5l8-3z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
  settings: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4.8A7 7 0 0014 5.3L13.5 3h-3L10 5.3a7 7 0 00-2.5 1.3l-2.4-.8-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.4-.8a7 7 0 002.5 1.3L10.5 21h3l.5-2.3a7 7 0 002.5-1.3l2.4.8 2-3.4-2-1.6A7 7 0 0019 12z" stroke={c} strokeWidth="2"/></svg>,
  bell: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z M10 21a2 2 0 004 0" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  coin: (s=24,c='#FFCE3C') => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={c}/><circle cx="12" cy="12" r="7" fill="none" stroke="#D4A500" strokeWidth="1"/><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8A6500">¥</text></svg>,
  book: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4V4z M20 4h-7a3 3 0 00-3 3v13a2 2 0 012-2h8V4z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>,
  chart: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 21h18 M6 17V9 M11 17V5 M16 17v-5 M21 17v-3" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  target: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke={c} strokeWidth="2"/><circle cx="12" cy="12" r="1.5" fill={c}/></svg>,
  drag: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="6" r="1.5" fill={c}/><circle cx="15" cy="6" r="1.5" fill={c}/><circle cx="9" cy="12" r="1.5" fill={c}/><circle cx="15" cy="12" r="1.5" fill={c}/><circle cx="9" cy="18" r="1.5" fill={c}/><circle cx="15" cy="18" r="1.5" fill={c}/></svg>,
};

// ─────────── 连胜火焰 ───────────
function StreakFlame({ count = 7, size = 24 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#FF9E44' }}>
      <span style={{ display: 'inline-block', animation: 'flame-flicker 0.8s infinite' }}>{Icon.flame(size)}</span>
      <span style={{ fontSize: size * 0.72 }}>{count}</span>
    </div>
  );
}

// ─────────── 星级评分 ───────────
function StarRating({ value = 0, max = 3, size = 20, gap = 2 }) {
  return (
    <div style={{ display: 'inline-flex', gap }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ opacity: i < value ? 1 : 0.25 }}>
          {Icon.star(size, '#FFCE3C', i < value)}
        </span>
      ))}
    </div>
  );
}

// ─────────── 对话气泡 ───────────
function SpeechBubble({ children, side = 'left', color = '#fff', textColor, tailOffset = 20, style = {} }) {
  const isLeft = side === 'left';
  return (
    <div style={{ position: 'relative', maxWidth: 320, ...style }}>
      <div style={{
        background: color, color: textColor || 'var(--ink-1)',
        padding: '10px 14px', borderRadius: 18,
        fontSize: 15, lineHeight: 1.4,
        boxShadow: '0 2px 8px rgba(26,31,44,0.08)',
      }}>{children}</div>
      {/* 小尾巴 */}
      <svg width="14" height="10" viewBox="0 0 14 10" style={{
        position: 'absolute', bottom: -2,
        [isLeft ? 'left' : 'right']: tailOffset,
        transform: isLeft ? 'none' : 'scaleX(-1)',
      }}>
        <path d="M0 0 Q6 10 14 0 Z" fill={color}/>
      </svg>
    </div>
  );
}

// ─────────── 老师讲解气泡（带"讲解"标签） ───────────
function TeacherBubble({ children, style = {} }) {
  return (
    <div style={{
      position: 'relative', background: '#FFF4D6',
      padding: '14px 16px', borderRadius: 18,
      border: '2px solid #FFCE3C',
      boxShadow: '0 4px 0 #E5B820',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: -12, left: 14,
        background: '#FFCE3C', color: '#6B4D00',
        fontSize: 11, fontWeight: 800,
        padding: '3px 10px', borderRadius: 999,
        letterSpacing: 0.5,
      }}>💡 老师讲解</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: '#6B4D00', paddingTop: 4 }}>{children}</div>
    </div>
  );
}

// ─────────── 奖励弹出 ───────────
function RewardBurst({ type = 'coin', count = 10, intensity = 'medium' }) {
  const icon = type === 'coin' ? Icon.coin(32) : type === 'gem' ? Icon.gem(32) : Icon.sparkle(32);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', background: '#FFF4D6', borderRadius: 999,
      border: '2px solid #FFCE3C',
      animation: 'pop-in 0.4s var(--ease-spring)',
      position: 'relative',
    }}>
      {intensity === 'explosion' && (
        <>
          <span style={{ position: 'absolute', top: -8, left: 8, animation: 'sparkle 1s infinite' }}>✨</span>
          <span style={{ position: 'absolute', top: -4, right: 10, animation: 'sparkle 1.2s infinite 0.3s' }}>⭐</span>
          <span style={{ position: 'absolute', bottom: -8, right: 20, animation: 'sparkle 0.9s infinite 0.5s' }}>✨</span>
        </>
      )}
      {icon}
      <span style={{ fontWeight: 800, fontSize: 18, color: '#8A6500' }}>+{count}</span>
    </div>
  );
}

// ─────────── 进度条 ───────────
function ProgressBar({ value = 0.5, color = 'var(--brand)', height = 10, showPercent = false }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height, background: 'var(--bg-3)', borderRadius: 999,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: '100%', background: color, borderRadius: 999,
          transition: 'width 0.4s var(--ease-out)',
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}/>
      </div>
      {showPercent && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', minWidth: 36, textAlign: 'right' }}>{Math.round(value*100)}%</span>}
    </div>
  );
}

// ─────────── 大按钮（Duolingo 风） ───────────
function BigButton({ children, onClick, variant = 'primary', disabled, style = {}, icon }) {
  const variants = {
    primary: { bg: 'var(--brand)', ink: 'var(--brand-ink)', text: '#fff' },
    secondary: { bg: 'var(--bg-1)', ink: 'var(--line)', text: 'var(--ink-1)' },
    danger: { bg: 'var(--danger)', ink: '#C94545', text: '#fff' },
    ghost: { bg: 'var(--bg-3)', ink: 'var(--bg-3)', text: 'var(--ink-2)' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance: 'none', border: 0, cursor: disabled ? 'not-allowed' : 'pointer',
      background: v.bg, color: v.text,
      padding: '14px 22px', borderRadius: 16,
      fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
      letterSpacing: 1, textTransform: 'uppercase',
      boxShadow: `0 4px 0 ${v.ink}`,
      opacity: disabled ? 0.4 : 1,
      transition: 'transform 0.08s, box-shadow 0.08s',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }} onMouseDown={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = `0 2px 0 ${v.ink}`; } }}
       onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 0 ${v.ink}`; }}
       onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 0 ${v.ink}`; }}>
      {icon}
      {children}
    </button>
  );
}

// ─────────── 徽章 ───────────
function Badge({ label, icon, color = 'var(--brand)', earned = true, size = 72 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: earned ? 1 : 0.35 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: earned ? `radial-gradient(circle at 30% 30%, ${color}dd, ${color})` : 'var(--bg-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: earned ? `0 4px 0 ${color}88, 0 8px 16px ${color}33` : 'none',
        position: 'relative',
      }}>
        <div style={{ color: '#fff' }}>{icon}</div>
        {earned && <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)'}}/>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textAlign: 'center', maxWidth: size + 20 }}>{label}</div>
    </div>
  );
}

Object.assign(window, { Icon, StreakFlame, StarRating, SpeechBubble, TeacherBubble, RewardBurst, ProgressBar, BigButton, Badge });
