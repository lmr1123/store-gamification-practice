// ══════════════════════════════════════════════════════
//  结果庆典页  v2.0 Production
//  XP 获得动画 / 星星动效 / 徽章解锁 / 分享/再练
// ══════════════════════════════════════════════════════

function ResultsScreen({ result = {}, from = 'quiz', onContinue, onPracticeAgain, onReplay, character }) {
  const { score = 82, stars = 2, xp = 45, combo = 0 } = result;
  const { state: gs } = useGame();

  const [phase, setPhase] = React.useState('score'); // score → stars → xp → done
  const [showStars, setShowStars] = React.useState(0);
  const [showXP, setShowXP] = React.useState(false);
  const [showBadge, setShowBadge] = React.useState(false);
  const newBadge = gs.pendingAchievements?.[0] || null;

  // 动画序列
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('stars'), 600);
    const t2 = setTimeout(() => {
      setShowStars(1);
      setTimeout(() => setShowStars(2), 300);
      setTimeout(() => setShowStars(stars >= 3 ? 3 : stars), 600);
    }, 800);
    const t3 = setTimeout(() => { setPhase('xp'); setShowXP(true); }, 1600);
    const t4 = setTimeout(() => { if (newBadge) setShowBadge(true); }, 2400);
    const t5 = setTimeout(() => setPhase('done'), 2800);
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, []);

  const grade = score >= 90 ? { label: '完美！', color: '#14B87A', bg: 'linear-gradient(135deg,#1FD491 0%,#059952 100%)', emoji: '🏆' }
    : score >= 75 ? { label: '不错！', color: '#4E7BFF', bg: 'linear-gradient(135deg,#6B8FFF 0%,#3D5CE8 100%)', emoji: '⭐' }
    : score >= 60 ? { label: '继续加油', color: '#FF9E44', bg: 'linear-gradient(135deg,#FFB347 0%,#FF7A00 100%)', emoji: '💪' }
    : { label: '需要练习', color: '#FF5B5B', bg: 'linear-gradient(135deg,#FF6B6B 0%,#E03030 100%)', emoji: '📖' };

  const fromLabel = { quiz: '闯关题型', ai: 'AI 对练', replay: '对练回放', story: '剧情动画' }[from] || '练习';

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="no-scrollbar">
      {/* 礼花背景 */}
      <Confetti active={phase !== 'score' && stars >= 2}/>

      {/* 分数主卡 */}
      <div style={{
        background: grade.bg,
        padding: '56px 20px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 装饰圆 */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: -30, bottom: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}/>

        {/* 场次标签 */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginBottom: 12 }}>
          {fromLabel} · 完成 🎬
        </div>

        {/* emoji 大图标 */}
        <div style={{ fontSize: 64, animation: 'pop-in-spring 0.6s var(--ease-spring)', lineHeight: 1, marginBottom: 8 }}>
          {grade.emoji}
        </div>

        {/* 分数 */}
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1, letterSpacing: -2, animation: 'pop-in 0.4s 0.2s var(--ease-spring) both' }}>{score}</div>
          <div style={{ fontSize: 18, opacity: 0.85, marginTop: 4, fontWeight: 700 }}>{grade.label}</div>
        </div>

        {/* 星星 */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              fontSize: 40, lineHeight: 1,
              filter: i < showStars ? 'none' : 'grayscale(1) opacity(0.35)',
              transform: i < showStars ? 'scale(1)' : 'scale(0.7)',
              transition: `all 0.35s ${0.1*i}s var(--ease-spring)`,
            }}>⭐</div>
          ))}
        </div>

        {/* Combo 提示 */}
        {combo >= 3 && (
          <div style={{
            marginTop: 14, background: 'rgba(255,255,255,0.2)',
            borderRadius: 999, padding: '6px 16px',
            fontSize: 13, fontWeight: 800, color: '#fff',
            animation: 'slide-up 0.4s 1.2s var(--ease-spring) both',
            backdropFilter: 'blur(6px)',
          }}>⚡ {combo}x 最高连击！XP 已加成</div>
        )}
      </div>

      <div style={{ flex: 1, padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* XP 获得卡 */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '16px 18px',
          boxShadow: 'var(--shadow-card)',
          animation: showXP ? 'slide-up 0.4s var(--ease-spring)' : 'none',
          opacity: showXP ? 1 : 0,
          transition: 'opacity 0.3s',
        }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>🎁 本次获得</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* XP */}
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: 'var(--brand-soft)', borderRadius: 14 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--brand)' }}>+{xp}</div>
              <div style={{ fontSize: 11, color: 'var(--brand-ink)', fontWeight: 700, marginTop: 2 }}>经验值 XP</div>
            </div>
            {/* 星星 */}
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: '#FFFBEA', borderRadius: 14 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#CC9900' }}>×{stars}</div>
              <div style={{ fontSize: 11, color: '#CC9900', fontWeight: 700, marginTop: 2 }}>星级评定</div>
            </div>
            {/* 连击加成 */}
            {combo >= 3 && (
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: '#FFF4E5', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#FF9E44' }}>×{(1 + Math.min(combo * 0.15, 1)).toFixed(1)}</div>
                <div style={{ fontSize: 11, color: '#CC6E00', fontWeight: 700, marginTop: 2 }}>连击加成</div>
              </div>
            )}
          </div>
        </div>

        {/* 徽章解锁 */}
        {showBadge && newBadge && (
          <div style={{
            background: `linear-gradient(135deg, ${newBadge.color}22 0%, ${newBadge.color}11 100%)`,
            border: `2px solid ${newBadge.color}55`,
            borderRadius: 20, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'pop-in-spring 0.5s var(--ease-spring)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: `radial-gradient(circle at 30% 30%, ${newBadge.color}EE, ${newBadge.color})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
              boxShadow: `0 4px 0 ${newBadge.color}55, 0 6px 20px ${newBadge.color}44`,
              animation: 'float-badge 2s ease-in-out infinite',
            }}>{newBadge.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: newBadge.color, textTransform: 'uppercase', letterSpacing: 1 }}>🏅 新徽章解锁！</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink-1)', marginTop: 3 }}>{newBadge.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{newBadge.desc}</div>
            </div>
          </div>
        )}

        {/* AI 点评摘要 */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>💬 AI 快速点评</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.feedback_good ? (
              <div style={{ background: 'var(--brand-soft)', padding: '10px 12px', borderRadius: 12, fontSize: 13, color: 'var(--brand-ink)', lineHeight: 1.5, fontWeight: 600 }}>
                👍 {result.feedback_good}
              </div>
            ) : (
              <div style={{ background: 'var(--brand-soft)', padding: '10px 12px', borderRadius: 12, fontSize: 13, color: 'var(--brand-ink)', lineHeight: 1.5, fontWeight: 600 }}>
                👍 话术覆盖清晰，顾客成功办卡。量化到本单效果好。
              </div>
            )}
            {result.feedback_improve ? (
              <div style={{ background: '#FFF4E5', padding: '10px 12px', borderRadius: 12, fontSize: 13, color: '#C96E1A', lineHeight: 1.5, fontWeight: 600 }}>
                💡 {result.feedback_improve}
              </div>
            ) : (
              <div style={{ background: '#FFF4E5', padding: '10px 12px', borderRadius: 12, fontSize: 13, color: '#C96E1A', lineHeight: 1.5, fontWeight: 600 }}>
                💡 下次记得补充「次日生效」这一关键信息点。
              </div>
            )}
          </div>
        </div>

        <IntentResolutionCard result={result} />

        {/* 本次对话逐句回顾 */}
        <ConversationReview result={result} />
      </div>

      {/* 底部 CTA */}
      <div style={{
        padding: '12px 16px 36px',
        background: 'rgba(255,255,255,0.96)',
        borderTop: '1px solid var(--line)',
        backdropFilter: 'blur(20px)',
        display: 'flex', gap: 10,
        opacity: phase === 'done' ? 1 : 0,
        transition: 'opacity 0.4s',
        pointerEvents: phase === 'done' ? 'auto' : 'none',
      }}>
        <button onClick={onPracticeAgain} style={{
          flex: 1, padding: 15, border: '2.5px solid var(--line)', borderRadius: 16,
          background: 'var(--bg-1)', fontSize: 14, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'inherit', color: 'var(--ink-2)',
        }}>再练一次</button>
        {onReplay && (from === 'ai' || from === 'replay') && (
          <button onClick={onReplay} style={{
            flex: 1, padding: 15, border: '2.5px solid var(--brand)', borderRadius: 16,
            background: 'var(--brand-soft)', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', color: 'var(--brand-ink)',
          }}>📽 查看回放</button>
        )}
        <button onClick={onContinue} style={{
          flex: 1.4, padding: 15, border: 0, borderRadius: 16,
          background: 'var(--brand)', color: '#fff',
          fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: 'var(--shadow-btn)',
        }}>继续闯关 →</button>
      </div>
    </div>
  );
}

// ─── 礼花组件 ────────────────────────────────────────
function Confetti({ active }) {
  const pieces = React.useMemo(() => (
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      color: ['#14B87A','#FFCE3C','#FF9E44','#4E7BFF','#FF6FA4','#A67BD6'][i % 6],
      left: `${5 + (i / 18) * 90}%`,
      delay: `${(i * 0.08).toFixed(2)}s`,
      size: 8 + (i % 4) * 3,
      shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
    }))
  ), []);

  if (!active) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-10px', left: p.left,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: p.shape,
          animation: `confetti-fall ${1.2 + (p.id % 3) * 0.4}s ${p.delay} ease-in forwards`,
        }}/>
      ))}
    </div>
  );
}

// ─── 对话逐句回顾 ─────────────────────────────────────
function ConversationReview({ result }) {
  const { conversation = [], per_message = [], missed = [] } = result;

  // 用 per_message 建立 clerk话术 → 点评 的映射
  const noteMap = {};
  (per_message || []).forEach(m => { if (m.text) noteMap[m.text] = m; });

  const tagLabel = { good: '✓ 不错', great: '🌟 精彩', warn: '⚠ 漏点', bad: '✕ 有误' };
  const tagColor = { good: 'var(--brand)', great: '#0aab60', warn: '#FF9E44', bad: 'var(--danger)' };

  // 无对话数据时不展示
  if (!conversation || conversation.filter(m => m.who === 'clerk').length === 0) {
    return null;
  }

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>📝 本次对话回顾</div>
      {missed.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12, fontWeight: 600 }}>
          遗漏要点：{missed.map(m => <span key={m} style={{ background: '#FFF4E5', color: '#C96E1A', borderRadius: 6, padding: '1px 6px', marginRight: 4, fontWeight: 700 }}>{m}</span>)}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {conversation.filter(m => m.who === 'clerk' || m.who === 'customer').map((m, i) => {
          const isClerk = m.who === 'clerk';
          const meta = isClerk ? (noteMap[m.text] || null) : null;
          const tag = meta?.tag || null;
          const note = meta?.note || null;

          const bubbleBg = isClerk
            ? (tag === 'warn' ? '#FFF4E5' : tag === 'bad' ? '#FFF0F0' : tag === 'great' ? '#E8FAF3' : 'var(--brand-soft)')
            : '#F2F4F7';
          const bubbleBorder = isClerk
            ? `1.5px solid ${tag ? tagColor[tag] + '55' : 'var(--brand)33'}`
            : '1.5px solid var(--line)';

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isClerk ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isClerk ? 'row-reverse' : 'row', maxWidth: '90%' }}>
                {/* 头像 */}
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `2px solid ${isClerk ? 'var(--brand)' : '#E0C8B0'}`, background: isClerk ? 'var(--brand-soft)' : '#FDF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isClerk ? <AvatarXiaomei size={28}/> : <AvatarElder size={28}/>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isClerk ? 'flex-end' : 'flex-start', gap: 3 }}>
                  {/* 姓名 + 标签 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isClerk ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isClerk ? 'var(--brand-ink)' : '#A06030' }}>
                      {isClerk ? '小美' : '王阿姨'}
                    </span>
                    {tag && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: `${tagColor[tag]}18`, color: tagColor[tag], border: `1px solid ${tagColor[tag]}44` }}>
                        {tagLabel[tag]}
                      </span>
                    )}
                  </div>

                  {/* 气泡 */}
                  <div style={{ padding: '8px 11px', background: bubbleBg, border: bubbleBorder, borderRadius: isClerk ? '14px 3px 14px 14px' : '3px 14px 14px 14px', fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5 }}>
                    {m.text}
                  </div>

                  {/* AI 点评 */}
                  {note && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, background: '#fff', borderRadius: 8, padding: '5px 8px', border: `1.5px solid ${tagColor[tag] || 'var(--line)'}33`, maxWidth: 210 }}>
                      <span style={{ fontSize: 12, flexShrink: 0 }}>💬</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.4, fontWeight: 600 }}>{note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntentResolutionCard({ result }) {
  const ir = result?.intent_resolution;
  if (!ir || typeof ir !== 'object') return null;

  const details = ir.details || {};
  const value = details.value || {};
  const time = details.time || {};
  const risk = details.risk || {};
  const items = [
    { key: 'value', label: '价值意图', hint: '值不值', solved: !!value.solved, start: value.start, end: value.end },
    { key: 'time', label: '时间意图', hint: '快不快', solved: !!time.solved, start: time.start, end: time.end },
    { key: 'risk', label: '风险意图', hint: '稳不稳', solved: !!risk.solved, start: risk.start, end: risk.end },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>🧭 顾客意图解决情况</div>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 10, fontWeight: 700 }}>
        {ir.summary || '已输出顾客意图解决情况'}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <div key={item.key} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '8px 10px', background: item.solved ? '#E8FAF3' : '#FFF7E8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-1)' }}>
                {item.label}（{item.hint}）
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: item.solved ? 'var(--brand-ink)' : '#C96E1A' }}>
                {item.solved ? '已解决' : '待继续'}
              </div>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
              疑虑变化：{Number.isFinite(item.start) ? item.start : '-'} → {Number.isFinite(item.end) ? item.end : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ResultsScreen, Confetti });
