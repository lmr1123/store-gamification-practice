// 屏幕5：对练回放 + 评分报告
// scoreData 来自 AI 对练的真实结果，无数据时降级展示 demo

function ReplayScreen({ onComplete, onBack, onPracticeAgain, scoreData }) {
  const scrollRef = React.useRef();

  // ── 数据：优先使用真实 scoreData，否则 fallback demo ──
  const score    = scoreData?.score    ?? 82;
  const stars    = scoreData?.stars    ?? 2;
  const covered  = scoreData?.covered  ?? ['打招呼', '询问会员', '立减 5 元', '优惠券', '次日生效'];
  const missed   = scoreData?.missed   ?? ['免费礼品'];
  const goodTip  = scoreData?.feedback_good    ?? '话术覆盖清晰，顾客成功办卡。量化到本单效果好';
  const improveTip = scoreData?.feedback_improve ?? '下次记得补充「次日生效」这一关键信息点';
  const behaviorScores = scoreData?.behavior_scores ?? [];
  const behaviorSummary = scoreData?.behavior_summary ?? null;

  // 真实对话 + 逐句点评（API 返回的 per_message 用于标注）
  const conversation = scoreData?.conversation ?? [];
  const perMessage   = scoreData?.per_message  ?? [];

  // demo 话术（无真实对话时展示）
  const demoLines = [
    { who: 'customer', text: '帮我结一下账。' },
    { who: 'clerk',    text: '欢迎光临！一共 68 元。您有会员卡吗？', tag: 'good', note: '打招呼 + 询问会员两件事合一，效率高' },
    { who: 'customer', text: '没有，办会员有什么用？' },
    { who: 'clerk',    text: '现在办这单立减 5 元，等于 63 元，还送 3 张 5 元券。', tag: 'great', note: '量化到本单，立刻让顾客感知价值 ⭐' },
    { who: 'customer', text: '那行…券怎么用？' },
    { who: 'clerk',    text: '满 9.9 减 5 元，全场通用。这月会员日还送花茶。', tag: 'warn', note: '漏了「次日生效」，顾客可能当场试用失败' },
    { who: 'customer', text: '好吧，我办一张。' },
    { who: 'clerk',    text: '好的，麻烦扫一下这个二维码。', tag: 'good' },
  ];

  // 构建展示用的行：真实对话 + per_message 注入标签/点评
  const noteMap = {};
  perMessage.forEach(m => { if (m.text) noteMap[m.text] = m; });

  const displayLines = conversation.filter(m => m.who === 'clerk' || m.who === 'customer').length > 0
    ? conversation.filter(m => m.who === 'clerk' || m.who === 'customer').map(m => ({
        ...m,
        tag:  m.who === 'clerk' ? (noteMap[m.text]?.tag  ?? null) : null,
        note: m.who === 'clerk' ? (noteMap[m.text]?.note ?? null) : null,
      }))
    : demoLines;

  // 分项数据
  const coveredCount = covered.length;
  const totalPoints  = coveredCount + missed.length || 6;
  const coverageScore = Math.round((coveredCount / totalPoints) * 100);
  const satisfactionScore = score >= 85 ? 88 : score >= 70 ? 74 : 60;

  const grade = score >= 90 ? { label: '完美！', bg: 'linear-gradient(135deg,#1FD491 0%,#059952 100%)' }
    : score >= 75 ? { label: '不错！', bg: 'linear-gradient(135deg,#14B87A 0%,#0A7A50 100%)' }
    : score >= 60 ? { label: '继续加油', bg: 'linear-gradient(135deg,#FF9E44 0%,#E07000 100%)' }
    : { label: '需要练习', bg: 'linear-gradient(135deg,#FF5B5B 0%,#C93030 100%)' };

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column' }}>

      {/* 顶部导航 */}
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack || onComplete} style={{ background: 'rgba(0,0,0,0.06)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {Icon.x(18)}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>对练回放 · 不计入考核</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>收银场景 · 会员引导</div>
        </div>
      </div>

      {/* 滚动内容区 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }} className="no-scrollbar">

        {/* ── 总分卡 ── */}
        <div style={{
          marginTop: 10, padding: 18, borderRadius: 20, color: '#fff',
          background: grade.bg, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(20,184,122,0.3)',
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
          <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>本次对练评分</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 13, paddingBottom: 10, opacity: 0.9 }}>/ 100</div>
            <div style={{ flex: 1, textAlign: 'right', paddingBottom: 8 }}>
              <StarRating value={stars} max={3} size={22}/>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{grade.label}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, marginTop: 12, opacity: 0.92, lineHeight: 1.6, background: 'rgba(0,0,0,0.12)', borderRadius: 10, padding: '8px 12px' }}>
            👍 {goodTip}<br/>
            💡 {improveTip}
          </div>
        </div>

        {/* ── 分项评分 ── */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: '关键话术', score: coverageScore, color: 'var(--brand)', desc: `${coveredCount}/${totalPoints} 项命中` },
            { label: '应对时效', score: 91,            color: '#4E7BFF',       desc: '平均 3.1s 响应' },
            { label: '顾客满意', score: satisfactionScore, color: '#FF9E44',   desc: 'AI 模拟值' },
          ].map((it, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700 }}>{it.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: it.color, lineHeight: 1.2, marginTop: 4 }}>{it.score}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{it.desc}</div>
            </div>
          ))}
        </div>

        {/* ── 遗漏要点提示 ── */}
        {missed.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF4E5', borderRadius: 14, border: '1.5px solid #FFD0A0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 12, color: '#C96E1A', lineHeight: 1.6, fontWeight: 600 }}>
              <span style={{ fontWeight: 800 }}>本次遗漏：</span>
              {missed.map((m, i) => (
                <span key={i} style={{ background: '#FFD0A055', borderRadius: 5, padding: '1px 6px', marginLeft: 4 }}>{m}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── 行为评估（结构化） ── */}
        {behaviorScores.length > 0 && (
          <div style={{ marginTop: 12, background: '#fff', borderRadius: 14, padding: '12px 12px 10px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)', marginBottom: 8 }}>🧭 行为评估</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {behaviorScores.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 32px', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{item.dimension || `维度${i + 1}`}</span>
                  <div style={{ height: 7, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, item.score || 0))}%`, borderRadius: 999, background: '#4E7BFF' }} />
                  </div>
                  <span style={{ fontSize: 11, textAlign: 'right', fontWeight: 800, color: '#2D4FD3' }}>{item.score || 0}</span>
                </div>
              ))}
            </div>
            {behaviorSummary?.next_actions?.length > 0 && (
              <div style={{ marginTop: 9, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                下一步：{behaviorSummary.next_actions.slice(0, 2).join('；')}
              </div>
            )}
          </div>
        )}

        {/* ── AI 逐句点评 ── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📝 AI 逐句点评</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          </div>
          {displayLines.map((m, i) => (
            <ReplayLine key={i} m={m}/>
          ))}
        </div>
      </div>

      {/* ── 底部 CTA ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 32px', background: 'var(--bg-1)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <button
          onClick={onPracticeAgain || onComplete}
          style={{ flex: 1, padding: 14, border: '2px solid var(--line)', borderRadius: 14, background: 'var(--bg-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'var(--ink-2)' }}>
          再练一次
        </button>
        <BigButton onClick={onComplete} style={{ flex: 1.4 }}>继续闯关 →</BigButton>
      </div>
    </div>
  );
}

// ── 逐句气泡 ──────────────────────────────────────────
function ReplayLine({ m }) {
  const isClerk = m.who === 'clerk';
  const tagLabel = { good: '✓ 不错', great: '🌟 精彩', warn: '⚠ 漏点', bad: '✕ 有误' };
  const tagColor = { good: 'var(--brand)', great: '#0aab60', warn: '#FF9E44', bad: 'var(--danger)' };

  const bubbleBg = isClerk
    ? (m.tag === 'warn' ? '#FFF4E5' : m.tag === 'bad' ? '#FFF0F0' : m.tag === 'great' ? '#E8FAF3' : 'var(--brand-soft)')
    : '#F2F4F7';
  const bubbleBorder = isClerk
    ? `1.5px solid ${m.tag ? tagColor[m.tag] + '55' : 'var(--brand)33'}`
    : '1.5px solid var(--line)';

  // warn 时高亮关键词（简单规则：遗漏词汇）
  const warnWords = ['花茶', '次日', '生效', '礼品'];
  function renderText(text) {
    if (m.tag !== 'warn') return text;
    let result = text;
    warnWords.forEach(w => {
      if (result.includes(w)) {
        const parts = result.split(w);
        result = parts.join(`【${w}】`);
      }
    });
    // 简单输出带标记
    return result.split(/【(.*?)】/).map((part, i) =>
      i % 2 === 1
        ? <mark key={i} style={{ background: '#FFD6A5', padding: '0 2px', borderRadius: 3, fontWeight: 700 }}>{part}</mark>
        : part
    );
  }

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: isClerk ? 'flex-end' : 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isClerk ? 'row-reverse' : 'row', maxWidth: '88%' }}>
        {/* 头像 */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isClerk ? 'var(--brand)' : '#E0C8B0'}`, background: isClerk ? 'var(--brand-soft)' : '#FDF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {isClerk ? <AvatarXiaomei size={36}/> : <AvatarElder size={36}/>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isClerk ? 'flex-end' : 'flex-start', gap: 4 }}>
          {/* 姓名 + 标签 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isClerk ? 'row-reverse' : 'row' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isClerk ? 'var(--brand-ink)' : '#A06030' }}>
              {isClerk ? '小美' : '王阿姨'}
            </span>
            {m.tag && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${tagColor[m.tag]}20`, color: tagColor[m.tag], border: `1px solid ${tagColor[m.tag]}44` }}>
                {tagLabel[m.tag]}
              </span>
            )}
          </div>

          {/* 气泡 */}
          <div style={{ padding: '9px 13px', background: bubbleBg, border: bubbleBorder, borderRadius: isClerk ? '16px 4px 16px 16px' : '4px 16px 16px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5 }}>
              {renderText(m.text)}
            </div>
          </div>

          {/* AI 点评 */}
          {m.note && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: '#fff', borderRadius: 10, padding: '7px 10px', border: `1.5px solid ${tagColor[m.tag] || 'var(--line)'}33`, maxWidth: 240 }}>
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
