// 屏幕5：对练结束后的回放 + 评分报告

function ReplayScreen({ onComplete }) {
  const [playing, setPlaying] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const duration = 120; // 2 分钟对练

  // 时间轴事件
  const timeline = [
    { t: 0, who: 'customer', text: '帮我结一下账。', tag: 'neutral' },
    { t: 5, who: 'clerk', text: '欢迎光临！一共 68 元。您有会员卡吗？', tag: 'good', note: '打招呼 + 询问会员 两件事合一，效率高' },
    { t: 15, who: 'customer', text: '没有，办会员有什么用？' },
    { t: 20, who: 'clerk', text: '现在办这单立减 5 元，等于 63 元，还能送 3 张 5 元券。', tag: 'great', note: '量化到本单，立刻让顾客感知价值 ⭐' },
    { t: 40, who: 'customer', text: '那行...券怎么用？' },
    { t: 45, who: 'clerk', text: '满 9.9 减 5 元，全场通用。这月会员日还送花茶。', tag: 'warn', note: '漏了"次日生效"，顾客可能当场试用失败' },
    { t: 80, who: 'customer', text: '好吧，我办一张。' },
    { t: 85, who: 'clerk', text: '好的，麻烦扫一下这个二维码。', tag: 'good' },
  ];

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setCursor(c => { const n = c + 1; if (n >= duration) { setPlaying(false); return duration; } return n; }), 100);
    return () => clearInterval(t);
  }, [playing]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部 */}
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onComplete} style={{ background: 'rgba(0,0,0,0.06)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {Icon.x(18)}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>对练回放 · 不计入考核</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>收银场景 · 会员引导</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }} className="no-scrollbar">
        {/* 总分卡 */}
        <ScoreCard/>
        {/* 分项评分 */}
        <SubScoreSection/>
        {/* 时间轴回放 */}
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, flex: 1 }}>🎞 时间轴回放</div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{fmt(cursor)} / {fmt(duration)}</span>
          </div>
          {/* 时间轴条 */}
          <Timeline timeline={timeline} duration={duration} cursor={cursor} setCursor={setCursor}/>
          {/* 播放控制 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <button onClick={() => setPlaying(p => !p)} style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'var(--brand)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {playing ? Icon.pause(18, '#fff') : Icon.play(18, '#fff')}
            </button>
            <button style={{ padding: '8px 12px', borderRadius: 10, border: 0, background: 'var(--bg-3)', color: 'var(--ink-2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {Icon.volume(14)} 1.0x
            </button>
            <button style={{ padding: '8px 12px', borderRadius: 10, border: 0, background: 'var(--bg-3)', color: 'var(--ink-2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {Icon.replay(14)} 重播
            </button>
          </div>
        </div>
        {/* 对话流（带点评） */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>📝 AI 逐句点评</div>
          {timeline.map((m, i) => <ReplayLine key={i} m={m} highlight={cursor >= m.t && cursor < (timeline[i+1]?.t || duration)} fmt={fmt}/>)}
        </div>
      </div>
      {/* 底部 CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 32px', background: 'var(--bg-1)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <button onClick={onComplete} style={{ flex: 1, padding: 14, border: '2px solid var(--line)', borderRadius: 14, background: 'var(--bg-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>返回技能树</button>
        <BigButton onClick={onComplete} style={{ flex: 1.4 }}>再练一次</BigButton>
      </div>
    </div>
  );
}

function ScoreCard() {
  return (
    <div style={{
      marginTop: 10, padding: 18,
      background: 'linear-gradient(135deg, #14B87A 0%, #0A7A50 100%)',
      borderRadius: 20, color: '#fff', position: 'relative', overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(20,184,122,0.3)',
    }}>
      {/* 装饰 */}
      <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
      <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
      <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>本次对练评分</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
        <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>82</div>
        <div style={{ fontSize: 13, paddingBottom: 8, opacity: 0.9 }}>/ 100</div>
        <div style={{ flex: 1, textAlign: 'right', paddingBottom: 8 }}>
          <StarRating value={2} max={3} size={22}/>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>比上次 ↑8 分</div>
        </div>
      </div>
      <div style={{ fontSize: 12, marginTop: 10, opacity: 0.9, lineHeight: 1.4 }}>
        👍 话术覆盖清晰，顾客成功办卡。<br/>
        💡 下次记得补充「次日生效」这一关键信息点。
      </div>
    </div>
  );
}

function SubScoreSection() {
  const items = [
    { label: '关键话术覆盖', score: 83, color: 'var(--brand)', desc: '5/6 项命中' },
    { label: '应对时效', score: 92, color: '#4E7BFF', desc: '平均 3.2 秒响应' },
    { label: '顾客满意度', score: 75, color: '#FF9E44', desc: 'AI 模拟值' },
  ];
  return (
    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{it.label}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: it.color, lineHeight: 1.2, marginTop: 4 }}>{it.score}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{it.desc}</div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ timeline, duration, cursor, setCursor }) {
  const tagColor = { good: 'var(--brand)', great: '#14B87A', warn: '#FF9E44', bad: 'var(--danger)' };
  return (
    <div style={{ position: 'relative', height: 44 }}>
      {/* 轨道 */}
      <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 6, background: 'var(--bg-3)', borderRadius: 3 }}/>
      {/* 进度条 */}
      <div style={{ position: 'absolute', top: 20, left: 0, width: `${cursor/duration*100}%`, height: 6, background: 'var(--brand)', borderRadius: 3 }}/>
      {/* 事件点 */}
      {timeline.filter(t => t.tag).map((e, i) => (
        <div key={i} style={{ position: 'absolute', left: `${e.t/duration*100}%`, top: 14, transform: 'translateX(-50%)', cursor: 'pointer' }}
          onClick={() => setCursor(e.t)}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: tagColor[e.t] || tagColor[e.tag], border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}/>
        </div>
      ))}
      {/* 拖动把手 */}
      <div style={{ position: 'absolute', left: `${cursor/duration*100}%`, top: 10, transform: 'translateX(-50%)', zIndex: 2 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', border: '3px solid var(--brand)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}/>
      </div>
      {/* 时间轴底部刻度 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
        <span>0:00</span><span>0:30</span><span>1:00</span><span>1:30</span><span>2:00</span>
      </div>
    </div>
  );
}

function ReplayLine({ m, highlight, fmt }) {
  const isClerk = m.who === 'clerk';
  const tagLabel = { good: '✓ 不错', great: '🌟 精彩', warn: '⚠ 漏点', bad: '✕ 有误' };
  const tagColor = { good: 'var(--brand)', great: '#14B87A', warn: '#FF9E44', bad: 'var(--danger)' };

  // 气泡颜色
  const bubbleBg = isClerk
    ? (m.tag === 'warn' ? '#FFF4E5' : m.tag === 'bad' ? '#FFF0F0' : 'var(--brand-soft)')
    : '#F2F4F7';
  const bubbleBorder = highlight ? '2px solid #FFCE3C' : isClerk ? `1.5px solid ${m.tag ? tagColor[m.tag]+'55' : 'var(--brand)33'}` : '1.5px solid var(--line)';

  return (
    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: isClerk ? 'flex-end' : 'flex-start' }}>
      {/* 时间戳 */}
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 4, paddingLeft: isClerk ? 0 : 44, paddingRight: isClerk ? 44 : 0 }}>
        {fmt(m.t)}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isClerk ? 'row-reverse' : 'row', maxWidth: '88%' }}>
        {/* 头像 */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `2px solid ${isClerk ? 'var(--brand)' : '#E0C8B0'}`, background: isClerk ? 'var(--brand-soft)' : '#FDF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isClerk ? <AvatarXiaomei size={36}/> : <AvatarElder size={36}/>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isClerk ? 'flex-end' : 'flex-start', gap: 4 }}>
          {/* 姓名 + 标签 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isClerk ? 'row-reverse' : 'row' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isClerk ? 'var(--brand-ink)' : '#A06030' }}>{isClerk ? '小美' : '王阿姨'}</span>
            {m.tag && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${tagColor[m.tag]}20`, color: tagColor[m.tag], border: `1px solid ${tagColor[m.tag]}44` }}>
                {tagLabel[m.tag]}
              </span>
            )}
          </div>

          {/* 气泡 */}
          <div style={{
            padding: '9px 13px',
            background: bubbleBg,
            border: bubbleBorder,
            borderRadius: isClerk ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            boxShadow: highlight ? '0 0 0 3px rgba(255,206,60,0.3)' : 'var(--shadow-card)',
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5 }}>
              {m.tag === 'warn'
                ? <span>{m.text.split('花茶')[0]}<mark style={{ background: '#FFD6A5', padding: '0 2px', borderRadius: 3 }}>花茶</mark>{m.text.split('花茶')[1] || ''}</span>
                : m.text}
            </div>
          </div>

          {/* AI 点评（仅店员有） */}
          {m.note && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 6,
              background: '#fff', borderRadius: 10,
              padding: '7px 10px',
              border: `1.5px solid ${tagColor[m.tag]}33`,
              maxWidth: 240,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
              <span style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 600 }}>{m.note}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReplayScreen });
