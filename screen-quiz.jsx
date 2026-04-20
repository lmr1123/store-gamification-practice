// ══════════════════════════════════════════════════════
//  闯关题型系统  v3.0 Production
//  支持 combo 加成 / 爱心失去动画 / 答题反馈 / 4种题型
// ══════════════════════════════════════════════════════

function QuizScreen({ onComplete, onBack }) {
  const { state: gs, actions } = useGame();
  const [idx, setIdx] = React.useState(0);
  const [combo, setCombo] = React.useState(0);
  const [heartAnim, setHeartAnim] = React.useState(false);
  const [xpFloats, setXpFloats] = React.useState([]); // [{id,xp}]
  const [finished, setFinished] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);

  const questions = [
    {
      kind: 'dialog', xp: 30,
      setup: { customer: 'worker', said: '我不需要会员，就买一次。' },
      prompt: '你作为小美，下一句最佳回应是？',
      options: [
        { id: 'A', text: '"好的，那给您结账。"', correct: false, why: '直接放弃了，错过引导机会。' },
        { id: 'B', text: '"今天办卡这单立减 5 元，等于 63 元，还能送 3 张优惠券。"', correct: true, why: '把「就买一次」转化为「这次也能省」，量化到本单，顾客感知价值强。⭐' },
        { id: 'C', text: '"办一张吧，不办亏了。"', correct: false, why: '话术太强硬，容易引起反感。' },
      ],
    },
    {
      kind: 'match', xp: 40,
      prompt: '把顾客类型与最佳应对话术连线',
      left: [
        { id: 'elder',   label: '大妈型',   Comp: AvatarElder },
        { id: 'worker',  label: '上班族',   Comp: AvatarWorker },
        { id: 'chronic', label: '慢病老人', Comp: AvatarChronic },
        { id: 'picky',   label: '挑剔客',   Comp: AvatarPicky },
      ],
      right: [
        { id: 'chronic', label: '"您常买降压药？会员有复购 8 折专享。"' },
        { id: 'elder',   label: '"办卡立减 5 元，下周还领花茶礼包。"' },
        { id: 'picky',   label: '"您这要求合理，我帮您留意平价款。"' },
        { id: 'worker',  label: '"扫一下就办好，线上下单也减 5 元。"' },
      ],
    },
    {
      kind: 'order', xp: 35,
      prompt: '把收银办卡的 5 个步骤按顺序排列',
      items: [
        { id: 1, text: '扫码商品，同时询问「是否有会员」' },
        { id: 2, text: '告知「这单办卡立减 5 元」' },
        { id: 3, text: '介绍 2–3 条核心权益亮点' },
        { id: 4, text: '请顾客扫码完成办卡' },
        { id: 5, text: '提醒「次日生效，记得下次用」' },
      ],
    },
    {
      kind: 'judge', xp: 25,
      prompt: '这段对话中，小美漏掉了哪个关键信息？',
      dialog: [
        { who: 'clerk', msg: '您有会员吗？' },
        { who: 'customer', msg: '没有，有什么用？' },
        { who: 'clerk', msg: '办卡这单立减 5 元，还能领优惠券。' },
        { who: 'customer', msg: '优惠券怎么用？' },
        { who: 'clerk', msg: '全场满 9.9 减 5 元。' },
      ],
      options: [
        { id: 'A', text: '没说「次日生效」', correct: true, why: '顾客当场用券会失败，体验差，可能投诉。这是最常见的漏点！' },
        { id: 'B', text: '没说折扣力度', correct: false, why: '其实说了立减 5 元，已经量化了。' },
        { id: 'C', text: '没介绍免费礼品', correct: false, why: '礼品是加分项，不是核心关键信息。' },
      ],
    },
  ];

  const q = questions[idx];
  const totalXP = questions.reduce((a, b) => a + b.xp, 0);

  const handleAnswer = (correct) => {
    const newCombo = correct ? combo + 1 : 0;
    const multiplier = correct && combo >= 2 ? 1 + Math.min(combo * 0.15, 1) : 1;
    const earned = correct ? Math.round(q.xp * multiplier) : 0;

    if (correct) {
      setCombo(newCombo);
      setCorrectCount(c => c + 1);
      setScore(s => s + earned);
      actions.addCombo();
      if (earned > 0) {
        const id = Date.now();
        setXpFloats(f => [...f, { id, xp: earned }]);
        setTimeout(() => setXpFloats(f => f.filter(x => x.id !== id)), 1200);
      }
    } else {
      setCombo(0);
      actions.resetCombo();
      setHeartAnim(true);
      actions.loseHeart();
      setTimeout(() => setHeartAnim(false), 600);
    }

    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const finalScore = Math.round(((correctCount + (correct ? 1 : 0)) / questions.length) * 100);
        const stars = finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : finalScore >= 50 ? 1 : 0;
        actions.gainXP(score + earned, { perfect: finalScore >= 95 });
        actions.completeScenario('checkout', stars, finalScore);
        onComplete({ score: finalScore, stars, xp: score + earned, combo: Math.max(combo, newCombo) });
      } else {
        setIdx(i => i + 1);
      }
    }, correct ? 1400 : 1800);
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* XP 浮动 */}
      {xpFloats.map(f => (
        <div key={f.id} style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, pointerEvents: 'none',
          animation: 'xp-float 1.2s var(--ease-out) forwards',
        }}>
          <div style={{ background: 'var(--grad-gold)', color: '#7A5800', fontWeight: 900, fontSize: 26, padding: '8px 20px', borderRadius: 999, boxShadow: '0 4px 16px rgba(255,180,0,0.5)', whiteSpace: 'nowrap' }}>
            +{f.xp} XP {combo >= 3 ? '⚡' : '✨'}
          </div>
        </div>
      ))}

      {/* 顶部进度条 */}
      <QuizTopBar
        idx={idx} total={questions.length}
        combo={combo} hearts={gs.hearts} maxHearts={gs.maxHearts}
        heartAnim={heartAnim} onBack={onBack}
      />

      {/* 内容区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 120px' }} className="no-scrollbar">
        {/* Combo 提示 */}
        {combo >= 3 && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <ComboDisplay combo={combo}/>
          </div>
        )}

        {/* 题目标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
            color: '#fff', background: 'var(--brand)', padding: '4px 10px', borderRadius: 999,
          }}>第 {idx + 1} / {questions.length} 题</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            {{ dialog: '对话选择', match: '连线匹配', order: '步骤排序', judge: '情景判断' }[q.kind]}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>+{q.xp} XP</div>
        </div>

        {/* 题目正文 */}
        <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--ink-1)', marginBottom: 18, lineHeight: 1.35 }}>
          {q.prompt}
        </div>

        {/* 题型组件 */}
        {q.kind === 'dialog' && <DialogQuestion q={q} onAnswer={handleAnswer} combo={combo}/>}
        {q.kind === 'match'  && <MatchQuestion  q={q} onAnswer={handleAnswer}/>}
        {q.kind === 'order'  && <OrderQuestion  q={q} onAnswer={handleAnswer}/>}
        {q.kind === 'judge'  && <JudgeQuestion  q={q} onAnswer={handleAnswer}/>}
      </div>
    </div>
  );
}

// ─── 顶部进度 TopBar ──────────────────────────────────
function QuizTopBar({ idx, total, combo, hearts, maxHearts, heartAnim, onBack }) {
  return (
    <div style={{ padding: '50px 16px 10px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button onClick={onBack} style={{
          background: 'var(--bg-3)', border: 0, borderRadius: '50%', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>✕</button>

        {/* 进度条 */}
        <div style={{ flex: 1, height: 10, background: 'var(--bg-3)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 5,
            width: `${(idx / total) * 100}%`,
            background: combo >= 5 ? 'var(--grad-amber)' : combo >= 3 ? 'var(--grad-gold)' : 'var(--grad-brand)',
            transition: 'width 0.5s var(--ease-out), background 0.3s',
            boxShadow: combo >= 3 ? '0 0 8px rgba(255,180,0,0.6)' : '0 0 6px rgba(20,184,122,0.4)',
          }}/>
        </div>

        {/* 爱心 */}
        <div style={{
          display: 'flex', gap: 2, alignItems: 'center',
          animation: heartAnim ? 'shake 0.5s var(--ease-spring)' : 'none',
        }}>
          {[...Array(maxHearts)].map((_, i) => (
            <span key={i} style={{
              fontSize: 16, lineHeight: 1,
              filter: i < hearts ? 'none' : 'grayscale(1) opacity(0.3)',
              transition: 'filter 0.3s',
              animation: heartAnim && i === hearts ? 'heart-break 0.5s var(--ease-spring)' : 'none',
            }}>❤️</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 题型1：对话选择 ──────────────────────────────────
function DialogQuestion({ q, onAnswer, combo }) {
  const [selected, setSelected] = React.useState(null);
  const [shake, setShake] = React.useState(null);

  const handle = (o) => {
    if (selected) return;
    setSelected(o);
    if (!o.correct) {
      setShake(o.id);
      setTimeout(() => setShake(null), 600);
    }
    onAnswer(o.correct);
  };

  const AvatarComp = q.setup?.customer === 'worker' ? AvatarWorker
    : q.setup?.customer === 'elder' ? AvatarElder : AvatarWorker;

  return (
    <>
      {/* 场景展示 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>💬 场景对话</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <AvatarComp size={68}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 5 }}>顾客说：</div>
            <div style={{ background: '#F0F3F7', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-1)' }}>
              {q.setup?.said}
            </div>
          </div>
        </div>
      </div>

      {/* 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map(o => {
          const picked = selected?.id === o.id;
          const answered = selected !== null;
          const correct = answered && o.correct;
          const wrong = picked && !o.correct;
          const missed = answered && !picked && o.correct;

          return (
            <div
              key={o.id}
              onClick={() => handle(o)}
              style={{
                borderRadius: 18, overflow: 'hidden',
                border: `2.5px solid ${correct || missed ? 'var(--brand)' : wrong ? 'var(--danger)' : picked ? 'var(--line)' : 'var(--line)'}`,
                background: correct || missed ? '#F0FDF7' : wrong ? '#FFF0F0' : '#fff',
                cursor: answered ? 'default' : 'pointer',
                animation: shake === o.id ? 'shake 0.5s' : 'none',
                transition: 'all 0.2s',
                boxShadow: correct ? '0 0 0 3px rgba(20,184,122,0.15)' : wrong ? '0 0 0 3px rgba(255,91,91,0.15)' : 'var(--shadow-card)',
              }}
            >
              {/* 选项内容 */}
              <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: correct || missed ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: (correct || missed || wrong) ? '#fff' : 'var(--ink-2)',
                  transition: 'all 0.2s',
                }}>
                  {correct || missed ? '✓' : wrong ? '✕' : o.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AvatarXiaomei size={32}/>
                    <div style={{ flex: 1, fontSize: 14, lineHeight: 1.45, fontWeight: 600, color: 'var(--ink-1)' }}>
                      {o.text}
                    </div>
                  </div>
                </div>
              </div>

              {/* 点评条 */}
              {answered && (correct || wrong || missed) && (
                <div style={{
                  padding: '10px 16px',
                  background: correct || missed ? 'var(--brand-soft)' : '#FFE5E5',
                  borderTop: `1px solid ${correct || missed ? '#A8E6CB' : '#FFBBBB'}`,
                  fontSize: 13, lineHeight: 1.45,
                  color: correct || missed ? 'var(--brand-ink)' : '#C94545',
                }}>
                  {correct || missed ? '👍' : '💡'} {o.why}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── 题型2：连线匹配 ──────────────────────────────────
function MatchQuestion({ q, onAnswer }) {
  const [matches, setMatches] = React.useState({});
  const [selectedLeft, setSelectedLeft] = React.useState(null);
  const [done, setDone] = React.useState(false);
  const total = q.left.length;

  const pickLeft = (id) => {
    if (matches[id] || done) return;
    setSelectedLeft(s => s === id ? null : id);
  };

  const pickRight = (id) => {
    if (!selectedLeft || done) return;
    const correct = selectedLeft === id;
    const newMatches = { ...matches, [selectedLeft]: { rightId: id, correct } };
    setMatches(newMatches);
    setSelectedLeft(null);
    if (Object.keys(newMatches).length === total) {
      setDone(true);
      const allCorrect = Object.values(newMatches).every(m => m.correct);
      setTimeout(() => onAnswer(allCorrect), 900);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
      {/* 左侧：顾客类型 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.left.map(l => {
          const m = matches[l.id];
          const active = selectedLeft === l.id;
          const borderColor = m ? (m.correct ? 'var(--brand)' : 'var(--danger)') : active ? 'var(--brand)' : 'var(--line)';
          const bg = m ? (m.correct ? '#F0FDF7' : '#FFF0F0') : active ? 'var(--brand-soft)' : '#fff';
          return (
            <div key={l.id} onClick={() => pickLeft(l.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '10px 8px', background: bg,
              border: `2.5px solid ${borderColor}`,
              borderRadius: 16, cursor: m ? 'default' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: active ? '0 0 0 3px rgba(20,184,122,0.2)' : 'var(--shadow-card)',
            }}>
              <l.Comp size={44}/>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-1)', textAlign: 'center' }}>{l.label}</div>
              {m && <div style={{ fontSize: 18 }}>{m.correct ? '✅' : '❌'}</div>}
            </div>
          );
        })}
      </div>

      {/* 右侧：话术 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.right.map(r => {
          const matchedWith = Object.entries(matches).find(([, v]) => v.rightId === r.id);
          const c = matchedWith ? (matchedWith[1].correct ? 'var(--brand)' : 'var(--danger)') : null;
          const glow = selectedLeft && !matchedWith;
          return (
            <div key={r.id} onClick={() => pickRight(r.id)} style={{
              padding: '12px 12px', borderRadius: 14, fontSize: 12, lineHeight: 1.5, fontWeight: 600,
              background: c ? (c === 'var(--brand)' ? '#F0FDF7' : '#FFF0F0') : '#fff',
              border: `2px solid ${c || (glow ? '#AAD8F5' : 'var(--line)')}`,
              cursor: selectedLeft && !matchedWith ? 'pointer' : 'default',
              transition: 'all 0.15s',
              boxShadow: glow ? '0 0 0 3px rgba(78,123,255,0.15)' : 'var(--shadow-card)',
              color: 'var(--ink-1)',
              minHeight: 60, display: 'flex', alignItems: 'center',
            }}>{r.label}</div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 题型3：步骤排序 ──────────────────────────────────
function OrderQuestion({ q, onAnswer }) {
  const [items, setItems] = React.useState(() => [...q.items].sort(() => Math.random() - 0.5));
  const [checked, setChecked] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const move = (i, dir) => {
    if (checked) return;
    const ni = i + dir;
    if (ni < 0 || ni >= items.length) return;
    const arr = [...items];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setItems(arr);
  };

  const check = () => {
    const ok = items.every((it, i) => it.id === i + 1);
    setChecked(true);
    setResult(ok);
    setTimeout(() => onAnswer(ok), 1600);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {items.map((it, i) => {
          const ok = checked && it.id === i + 1;
          const wrong = checked && it.id !== i + 1;
          return (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 14px',
              background: ok ? '#F0FDF7' : wrong ? '#FFF0F0' : '#fff',
              border: `2px solid ${ok ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--line)'}`,
              borderRadius: 16, transition: 'all 0.25s',
              boxShadow: 'var(--shadow-card)',
              animation: checked ? (ok ? 'pop-in 0.3s var(--ease-spring)' : 'none') : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: ok ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: (ok || wrong) ? '#fff' : 'var(--ink-3)',
                fontWeight: 900, fontSize: 13,
              }}>{ok ? '✓' : wrong ? '✕' : i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', lineHeight: 1.4 }}>{it.text}</div>
              {!checked && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button onClick={() => move(i, -1)} style={{ width: 26, height: 26, border: 0, borderRadius: 7, background: 'var(--bg-3)', cursor: 'pointer', fontSize: 11, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                  <button onClick={() => move(i, 1)}  style={{ width: 26, height: 26, border: 0, borderRadius: 7, background: 'var(--bg-3)', cursor: 'pointer', fontSize: 11, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!checked && (
        <button onClick={check} style={{
          width: '100%', padding: 16, border: 0, borderRadius: 18,
          background: 'var(--brand)', color: '#fff', fontSize: 16, fontWeight: 900,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: 'var(--shadow-btn)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
          onPointerDown={e => { e.currentTarget.style.transform='translateY(3px)'; e.currentTarget.style.boxShadow='0 1px 0 var(--brand-ink)'; }}
          onPointerUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-btn)'; }}
        >确认顺序 ✓</button>
      )}
      {checked && (
        <div style={{
          textAlign: 'center', padding: '14px 0',
          fontSize: 16, fontWeight: 900,
          color: result ? 'var(--brand)' : 'var(--danger)',
          animation: 'pop-in 0.3s var(--ease-spring)',
        }}>
          {result ? '🎉 完美！顺序全对！' : '❌ 顺序有误，正确顺序已标出'}
        </div>
      )}
    </>
  );
}

// ─── 题型4：情景判断 ──────────────────────────────────
function JudgeQuestion({ q, onAnswer }) {
  const [sel, setSel] = React.useState(null);

  const handle = (o) => {
    if (sel) return;
    setSel(o);
    onAnswer(o.correct);
  };

  return (
    <>
      {/* 对话展示 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '14px 14px 12px', marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>💬 观察这段对话</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.dialog.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: d.who === 'clerk' ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end' }}>
              {d.who === 'customer' && <AvatarElder size={28}/>}
              <div style={{
                background: d.who === 'clerk' ? 'var(--brand)' : '#F0F3F7',
                color: d.who === 'clerk' ? '#fff' : 'var(--ink-1)',
                padding: '8px 12px', borderRadius: d.who === 'clerk' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: 13, maxWidth: '75%', lineHeight: 1.4, fontWeight: 600,
              }}>
                <span style={{ fontSize: 9, opacity: 0.7, display: 'block', marginBottom: 2 }}>{d.who === 'clerk' ? '小美' : '顾客'}</span>
                {d.msg}
              </div>
              {d.who === 'clerk' && <AvatarXiaomei size={28}/>}
            </div>
          ))}
        </div>
      </div>

      {/* 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map(o => {
          const picked = sel?.id === o.id;
          const answered = sel !== null;
          const correct = answered && o.correct;
          const wrong = picked && !o.correct;

          return (
            <div key={o.id} onClick={() => handle(o)} style={{
              borderRadius: 18, overflow: 'hidden',
              border: `2.5px solid ${correct ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--line)'}`,
              background: correct ? '#F0FDF7' : wrong ? '#FFF0F0' : '#fff',
              cursor: answered ? 'default' : 'pointer',
              transition: 'all 0.2s', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: correct ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 13,
                  color: (correct || wrong) ? '#fff' : 'var(--ink-2)',
                }}>{correct ? '✓' : wrong ? '✕' : o.id}</div>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{o.text}</div>
              </div>
              {answered && (correct || wrong) && (
                <div style={{
                  padding: '10px 16px',
                  background: correct ? 'var(--brand-soft)' : '#FFE5E5',
                  borderTop: `1px solid ${correct ? '#A8E6CB' : '#FFBBBB'}`,
                  fontSize: 13, color: correct ? 'var(--brand-ink)' : '#C94545', lineHeight: 1.5,
                }}>
                  {correct ? '👍' : '💡'} {o.why}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// 向后兼容导出
function TopBar({ step, totalSteps, onClose }) {
  return <QuizTopBar idx={step} total={totalSteps} combo={0} hearts={5} maxHearts={5} heartAnim={false} onBack={onClose}/>;
}

Object.assign(window, { QuizScreen, TopBar });
