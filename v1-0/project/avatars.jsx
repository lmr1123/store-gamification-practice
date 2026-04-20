// 角色头像 SVG 库
// 主角小美 + 5种顾客类型，用纯 SVG 绘制，支持 Q版 / 写实 / 像素三种风格切换

// ─────────── 小美（店员主角） ───────────
function AvatarXiaomei({ size = 80, style: drawStyle = 'chibi' }) {
  if (drawStyle === 'pixel') {
    return <AvatarPixel size={size} palette={{ skin: '#FFE1C4', hair: '#3B2416', top: '#14B87A', accent: '#FFCE3C' }} />;
  }
  if (drawStyle === 'realistic') {
    return <AvatarRealistic size={size} palette={{ skin: '#F5D4B3', hair: '#2A1B10', top: '#14B87A' }} name="小美" />;
  }
  // Q版默认
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      {/* 身体 */}
      <path d="M25 90 Q25 70 50 70 Q75 70 75 90 L75 100 L25 100 Z" fill="#14B87A"/>
      {/* 围裙领口 */}
      <path d="M40 72 L50 80 L60 72 L60 90 L40 90 Z" fill="#E6F9F0"/>
      {/* 脖子 */}
      <rect x="44" y="60" width="12" height="12" fill="#FFE1C4"/>
      {/* 头 */}
      <circle cx="50" cy="42" r="22" fill="#FFE1C4"/>
      {/* 头发 */}
      <path d="M28 42 Q28 20 50 20 Q72 20 72 42 Q72 30 60 26 Q55 35 50 30 Q45 35 40 26 Q28 30 28 42 Z" fill="#3B2416"/>
      {/* 丸子头 */}
      <circle cx="50" cy="20" r="7" fill="#3B2416"/>
      {/* 眼睛 */}
      <ellipse cx="42" cy="44" rx="2.5" ry="3.5" fill="#1A1F2C"/>
      <ellipse cx="58" cy="44" rx="2.5" ry="3.5" fill="#1A1F2C"/>
      <circle cx="42.5" cy="43" r="0.8" fill="#fff"/>
      <circle cx="58.5" cy="43" r="0.8" fill="#fff"/>
      {/* 腮红 */}
      <ellipse cx="38" cy="50" rx="3" ry="2" fill="#FF9EB0" opacity="0.6"/>
      <ellipse cx="62" cy="50" rx="3" ry="2" fill="#FF9EB0" opacity="0.6"/>
      {/* 微笑 */}
      <path d="M46 52 Q50 56 54 52" stroke="#1A1F2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* 药房员工胸牌 */}
      <rect x="56" y="78" width="10" height="6" rx="1" fill="#fff"/>
      <rect x="57" y="80" width="6" height="1" fill="#14B87A"/>
    </svg>
  );
}

// ─────────── 大妈型顾客 ───────────
function AvatarElder({ size = 80, style: drawStyle = 'chibi' }) {
  if (drawStyle === 'pixel') return <AvatarPixel size={size} palette={{ skin: '#F5D4B3', hair: '#9A9A9A', top: '#D05454', accent: '#fff' }} />;
  if (drawStyle === 'realistic') return <AvatarRealistic size={size} palette={{ skin: '#ECCDA8', hair: '#6E6E6E', top: '#C84D52' }} name="王阿姨" />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path d="M25 90 Q25 70 50 70 Q75 70 75 90 L75 100 L25 100 Z" fill="#C94747"/>
      <rect x="44" y="60" width="12" height="12" fill="#ECCDA8"/>
      <circle cx="50" cy="42" r="22" fill="#ECCDA8"/>
      {/* 卷发 */}
      <path d="M28 42 Q28 22 50 22 Q72 22 72 42 Q70 36 64 38 Q58 32 54 36 Q50 30 46 36 Q42 32 36 38 Q30 36 28 42 Z" fill="#8A8A8A"/>
      <circle cx="32" cy="40" r="3" fill="#8A8A8A"/>
      <circle cx="68" cy="40" r="3" fill="#8A8A8A"/>
      {/* 老花眼镜 */}
      <circle cx="42" cy="46" r="5" fill="none" stroke="#1A1F2C" strokeWidth="1.2"/>
      <circle cx="58" cy="46" r="5" fill="none" stroke="#1A1F2C" strokeWidth="1.2"/>
      <line x1="47" y1="46" x2="53" y2="46" stroke="#1A1F2C" strokeWidth="1.2"/>
      {/* 眼睛 */}
      <line x1="40" y1="46" x2="44" y2="46" stroke="#1A1F2C" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="56" y1="46" x2="60" y2="46" stroke="#1A1F2C" strokeWidth="1.3" strokeLinecap="round"/>
      {/* 嘴 */}
      <path d="M46 55 Q50 53 54 55" stroke="#1A1F2C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* 耳环 */}
      <circle cx="28" cy="48" r="1.5" fill="#FFCE3C"/>
      <circle cx="72" cy="48" r="1.5" fill="#FFCE3C"/>
    </svg>
  );
}

// ─────────── 上班族 ───────────
function AvatarWorker({ size = 80, style: drawStyle = 'chibi' }) {
  if (drawStyle === 'pixel') return <AvatarPixel size={size} palette={{ skin: '#FFE1C4', hair: '#1A1A1A', top: '#2A3A4C', accent: '#FFF' }} />;
  if (drawStyle === 'realistic') return <AvatarRealistic size={size} palette={{ skin: '#FFD8B5', hair: '#1A1A1A', top: '#2F3E51' }} name="李先生" />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path d="M25 90 Q25 70 50 70 Q75 70 75 90 L75 100 L25 100 Z" fill="#2F3E51"/>
      {/* 领带 */}
      <path d="M48 70 L52 70 L54 82 L50 86 L46 82 Z" fill="#C94747"/>
      {/* 白衬衫领 */}
      <path d="M40 70 L50 78 L60 70 L56 66 L44 66 Z" fill="#fff"/>
      <rect x="44" y="60" width="12" height="12" fill="#FFD8B5"/>
      <circle cx="50" cy="42" r="22" fill="#FFD8B5"/>
      {/* 短发 */}
      <path d="M30 40 Q30 22 50 22 Q70 22 70 40 Q70 30 58 28 Q50 24 42 28 Q30 30 30 40 Z" fill="#1A1A1A"/>
      {/* 眉毛 */}
      <path d="M38 42 L44 41" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M56 41 L62 42" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round"/>
      {/* 眼睛 */}
      <ellipse cx="41" cy="46" rx="2" ry="3" fill="#1A1F2C"/>
      <ellipse cx="59" cy="46" rx="2" ry="3" fill="#1A1F2C"/>
      {/* 嘴 —— 紧抿 */}
      <line x1="46" y1="55" x2="54" y2="55" stroke="#1A1F2C" strokeWidth="1.5" strokeLinecap="round"/>
      {/* 耳机 */}
      <circle cx="28" cy="44" r="3" fill="#fff" stroke="#1A1A1A" strokeWidth="1"/>
    </svg>
  );
}

// ─────────── 慢性病老人 ───────────
function AvatarChronic({ size = 80, style: drawStyle = 'chibi' }) {
  if (drawStyle === 'pixel') return <AvatarPixel size={size} palette={{ skin: '#EFD4B8', hair: '#BFBFBF', top: '#7A6FA8', accent: '#fff' }} />;
  if (drawStyle === 'realistic') return <AvatarRealistic size={size} palette={{ skin: '#E8C8A3', hair: '#B0B0B0', top: '#7A6FA8' }} name="张爷爷" />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path d="M25 90 Q25 70 50 70 Q75 70 75 90 L75 100 L25 100 Z" fill="#7A6FA8"/>
      <rect x="44" y="60" width="12" height="12" fill="#E8C8A3"/>
      <circle cx="50" cy="42" r="22" fill="#E8C8A3"/>
      {/* 白发 */}
      <path d="M30 38 Q30 22 50 22 Q70 22 70 38 Q60 28 50 30 Q40 28 30 38 Z" fill="#C8C8C8"/>
      <path d="M35 30 Q40 35 45 32" stroke="#fff" strokeWidth="1" fill="none"/>
      {/* 皱纹 */}
      <path d="M32 50 Q35 52 38 50" stroke="#C9A57E" strokeWidth="0.8" fill="none"/>
      <path d="M62 50 Q65 52 68 50" stroke="#C9A57E" strokeWidth="0.8" fill="none"/>
      {/* 眼睛 —— 温和 */}
      <path d="M38 46 Q42 44 44 46" stroke="#1A1F2C" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M56 46 Q60 44 62 46" stroke="#1A1F2C" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      {/* 嘴 */}
      <path d="M46 56 Q50 58 54 56" stroke="#1A1F2C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* 拐杖提示 */}
      <circle cx="80" cy="72" r="3" fill="#8A5CF6" opacity="0.3"/>
    </svg>
  );
}

// ─────────── 年轻妈妈 ───────────
function AvatarYoung({ size = 80, style: drawStyle = 'chibi' }) {
  if (drawStyle === 'pixel') return <AvatarPixel size={size} palette={{ skin: '#FFE1C4', hair: '#6B3A1E', top: '#FF6FA4', accent: '#FFF' }} />;
  if (drawStyle === 'realistic') return <AvatarRealistic size={size} palette={{ skin: '#FFDCC0', hair: '#5A2F18', top: '#E85E94' }} name="陈妈妈" />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path d="M25 90 Q25 70 50 70 Q75 70 75 90 L75 100 L25 100 Z" fill="#E85E94"/>
      <rect x="44" y="60" width="12" height="12" fill="#FFDCC0"/>
      <circle cx="50" cy="42" r="22" fill="#FFDCC0"/>
      {/* 长发 */}
      <path d="M26 42 Q26 20 50 20 Q74 20 74 42 L76 60 L70 58 Q72 48 68 38 Q50 24 32 38 Q28 48 30 58 L24 60 Z" fill="#6B3A1E"/>
      {/* 刘海 */}
      <path d="M34 30 Q50 22 66 30 Q60 38 50 34 Q40 38 34 30 Z" fill="#4E2811"/>
      {/* 眼睛 */}
      <ellipse cx="42" cy="46" rx="2.5" ry="3.5" fill="#1A1F2C"/>
      <ellipse cx="58" cy="46" rx="2.5" ry="3.5" fill="#1A1F2C"/>
      <circle cx="42.5" cy="45" r="0.8" fill="#fff"/>
      <circle cx="58.5" cy="45" r="0.8" fill="#fff"/>
      {/* 腮红 */}
      <ellipse cx="37" cy="52" rx="3" ry="2" fill="#FF9EB0" opacity="0.5"/>
      <ellipse cx="63" cy="52" rx="3" ry="2" fill="#FF9EB0" opacity="0.5"/>
      {/* 嘴 */}
      <path d="M47 56 Q50 58 53 56" stroke="#C94575" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      {/* 宝宝小手 */}
      <circle cx="26" cy="80" r="4" fill="#FFDCC0"/>
    </svg>
  );
}

// ─────────── 挑剔客 ───────────
function AvatarPicky({ size = 80, style: drawStyle = 'chibi' }) {
  if (drawStyle === 'pixel') return <AvatarPixel size={size} palette={{ skin: '#FFDCB5', hair: '#3B2416', top: '#FF8A3D', accent: '#FFF' }} />;
  if (drawStyle === 'realistic') return <AvatarRealistic size={size} palette={{ skin: '#FFDCB5', hair: '#3B2416', top: '#F27A2A' }} name="刘女士" />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <path d="M25 90 Q25 70 50 70 Q75 70 75 90 L75 100 L25 100 Z" fill="#F27A2A"/>
      <rect x="44" y="60" width="12" height="12" fill="#FFDCB5"/>
      <circle cx="50" cy="42" r="22" fill="#FFDCB5"/>
      {/* 盘发 */}
      <path d="M30 40 Q30 22 50 20 Q70 22 70 40 Q68 30 60 28 Q52 24 44 28 Q32 32 30 40 Z" fill="#3B2416"/>
      <ellipse cx="50" cy="18" rx="8" ry="5" fill="#3B2416"/>
      {/* 眉毛 —— 皱眉 */}
      <path d="M38 41 L44 43" stroke="#3B2416" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M56 43 L62 41" stroke="#3B2416" strokeWidth="1.8" strokeLinecap="round"/>
      {/* 眼睛 —— 细长 */}
      <path d="M39 46 Q42 45 45 46" stroke="#1A1F2C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M55 46 Q58 45 61 46" stroke="#1A1F2C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* 嘴 —— 嘟嘴 */}
      <ellipse cx="50" cy="56" rx="2.5" ry="1.8" fill="#C94575"/>
      {/* 口红 */}
      <circle cx="76" cy="38" r="2" fill="#C94747"/>
    </svg>
  );
}

// ─────────── 像素风 通用模板 ───────────
function AvatarPixel({ size = 80, palette }) {
  const { skin, hair, top, accent } = palette;
  // 10x10 像素网格
  const pixels = [
    // 0=透明 1=发 2=皮肤 3=上衣 4=口眼 5=accent
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,2,2,2,2,1,1,0],
    [0,1,2,2,4,2,4,2,1,0],
    [0,1,2,2,2,2,2,2,1,0],
    [0,0,1,2,4,4,2,1,0,0],
    [0,0,0,2,2,2,2,0,0,0],
    [0,0,3,3,5,3,3,3,0,0],
    [0,3,3,3,3,3,3,3,3,0],
    [3,3,3,3,3,3,3,3,3,3],
  ];
  const colorMap = { 0: 'transparent', 1: hair, 2: skin, 3: top, 4: '#1A1F2C', 5: accent };
  const px = size / 10;
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ display: 'block', imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
      {pixels.map((row, y) => row.map((c, x) => c === 0 ? null : (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colorMap[c]}/>
      )))}
    </svg>
  );
}

// ─────────── 写实风 通用模板 ───────────
function AvatarRealistic({ size = 80, palette, name }) {
  const { skin, hair, top } = palette;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`skin-${name}`} cx="0.5" cy="0.4">
          <stop offset="0%" stopColor={skin}/>
          <stop offset="100%" stopColor={skin} stopOpacity="0.7"/>
        </radialGradient>
        <linearGradient id={`top-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top}/>
          <stop offset="100%" stopColor={top} stopOpacity="0.8"/>
        </linearGradient>
      </defs>
      <path d="M20 95 Q20 68 50 68 Q80 68 80 95 L80 100 L20 100 Z" fill={`url(#top-${name})`}/>
      <ellipse cx="50" cy="45" rx="18" ry="22" fill={`url(#skin-${name})`}/>
      <path d="M32 40 Q32 22 50 22 Q68 22 68 40 Q60 30 50 32 Q40 30 32 40 Z" fill={hair}/>
      <ellipse cx="43" cy="48" rx="1.5" ry="2.2" fill="#1A1F2C"/>
      <ellipse cx="57" cy="48" rx="1.5" ry="2.2" fill="#1A1F2C"/>
      <path d="M46 58 Q50 60 54 58" stroke="#5A2F18" strokeWidth="1" fill="none" strokeLinecap="round"/>
      {/* 高光 */}
      <ellipse cx="44" cy="38" rx="3" ry="5" fill="#fff" opacity="0.25"/>
    </svg>
  );
}

Object.assign(window, {
  AvatarXiaomei, AvatarElder, AvatarWorker, AvatarChronic, AvatarYoung, AvatarPicky,
});
