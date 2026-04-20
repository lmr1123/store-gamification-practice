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
            <div style={{ background: 'var(--brand-soft)', padding: '10px 12px', borderRadius: 12, fontSize: 13, color: 'var(--brand-ink)', lineHeight: 1.5, fontWeight: 600 }}>
              👍 话术覆盖清晰，顾客成功办卡。量化到本单效果好。
            </div>
            <div style={{ background: '#FFF4E5', padding: '10px 12px', borderRadius: 12, fontSize: 13, color: '#C96E1A', lineHeight: 1.5, fontWeight: 600 }}>
              💡 下次记得补充「次日生效」这一关键信息点。
            </div>
          </div>
        </div>

        {/* 进步对比 */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>📈 进步轨迹</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink-3)' }}>74</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>上次</div>
            </div>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand)' }}>↑ +{score - 74} 分</div>
              <div style={{ height: 6, width: '100%', background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--grad-brand)', borderRadius: 3, width: `${score}%`, transition: 'width 1s var(--ease-out)' }}/>
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand)' }}>{score}</div>
              <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>本次</div>
            </div>
          </div>
        </div>
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

Object.assign(window, { ResultsScreen, Confetti });
