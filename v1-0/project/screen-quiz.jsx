// 屏幕3：闯关题型系统（对话式 / 连线 / 排序 / 情景判断）
// 支持 tweak: quizStyle = 'card' | 'dialog' | 'drag'

function QuizScreen({ onComplete, quizStyle = 'dialog' }) {
  const [idx, setIdx] = React.useState(0);
  const questions = [
    {
      kind: 'dialog',
      setup: { customer: 'worker', said: '我不需要会员，就买一次。' },
      prompt: '你作为小美，下一句最佳回应是？',
      options: [
        { id: 'A', text: '"好的，那给您结账。"', correct: false, why: '错过了引导机会。' },
        { id: 'B', text: '"今天办卡，这单立减 5 元，还能领一份 1 星礼品。"', correct: true, why: '把"就买一次"转化为"这次也能省"，打破顾客的壁垒。' },
        { id: 'C', text: '"办一张吧，不办亏了。"', correct: false, why: '话术太生硬，容易让顾客反感。' },
      ],
    },
    {
      kind: 'match',
      prompt: '把 4 类顾客与最佳应对话术连线',
      left: [
        { id: 'elder', label: '大妈型', Comp: AvatarElder },
        { id: 'worker', label: '上班族', Comp: AvatarWorker },
        { id: 'chronic', label: '慢性病老人', Comp: AvatarChronic },
        { id: 'picky', label: '挑剔客', Comp: AvatarPicky },
      ],
      right: [
        { id: 'chronic', label: '"您常买降压药？我们有复购 8 折的会员专享。"' },
        { id: 'elder', label: '"今天办卡立减 5 元，下周还能领花茶礼包。"' },
        { id: 'picky', label: '"您这要求合理，我帮您留意同类平价款。"' },
        { id: 'worker', label: '"扫一下就办好，以后线上下单也能减 5 元。"' },
      ],
    },
    {
      kind: 'order',
      prompt: '把收银办卡的 5 个关键步骤按顺序排列',
      items: [
        { id: 1, text: '①  扫码商品同时询问「是否有会员」' },
        { id: 2, text: '②  告知「这单办卡立减 5 元」' },
        { id: 3, text: '③  介绍 6 大权益中 2-3 条亮点' },
        { id: 4, text: '④  请顾客扫码完成办卡' },
        { id: 5, text: '⑤  提醒「次日生效，记得下次用」' },
      ],
    },
    {
      kind: 'judge',
      prompt: '观察这段对话，店员漏掉了哪个关键信息点？',
      dialog: [
        { who: 'clerk', msg: '您有会员吗？' },
        { who: 'customer', msg: '没有，有什么用？' },
        { who: 'clerk', msg: '办卡这单立减 5 元，还能减 5 元优惠券。' },
        { who: 'customer', msg: '优惠券怎么用？' },
        { who: 'clerk', msg: '全场满 9.9 减 5 元。' },
      ],
      options: [
        { id: 'A', text: '没说"次日生效"', correct: true, why: '顾客可能当场尝试使用优惠券却无法用，体验变差。' },
        { id: 'B', text: '没说折扣力度', correct: false, why: '其实说了立减 5 元。' },
        { id: 'C', text: '没介绍免费礼品', correct: false, why: '礼品是加分项但不是关键信息。' },
      ],
    },
  ];
  const q = questions[idx];

  const go = (correct) => {
    setTimeout(() => setIdx(i => i + 1), 1500);
    if (idx + 1 >= questions.length) setTimeout(onComplete, 1500);
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column' }}>
      <TopBar step={idx} totalSteps={questions.length} onClose={onComplete}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '100px 20px 180px' }} className="no-scrollbar">
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
          第 {idx + 1} 题 / {questions.length} · {q.kind === 'dialog' ? '对话题' : q.kind === 'match' ? '连线题' : q.kind === 'order' ? '排序题' : '情景判断'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-1)', marginBottom: 20, lineHeight: 1.35 }}>
          {q.prompt}
        </div>
        {q.kind === 'dialog' && <DialogQuestion q={q} onAnswer={go} quizStyle={quizStyle}/>}
        {q.kind === 'match' && <MatchQuestion q={q} onAnswer={go}/>}
        {q.kind === 'order' && <OrderQuestion q={q} onAnswer={go}/>}
        {q.kind === 'judge' && <JudgeQuestion q={q} onAnswer={go}/>}
      </div>
    </div>
  );
}

function DialogQuestion({ q, onAnswer, quizStyle }) {
  const [selected, setSelected] = React.useState(null);
  const handle = (o) => { setSelected(o); onAnswer(o.correct); };
  return (
    <>
      {/* 漫画画面 */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <AvatarWorker size={80}/>
          <div style={{ flex: 1 }}>
            <SpeechBubble side="left" color="#F0F3F7">
              {q.setup.said}
            </SpeechBubble>
          </div>
        </div>
      </div>
      {/* 选项（两种 tweak 样式） */}
      {quizStyle === 'dialog' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map(o => {
            const picked = selected?.id === o.id;
            const showAnswer = selected !== null;
            const isCorrect = showAnswer && o.correct;
            const isWrong = picked && !o.correct;
            return (
              <div key={o.id} onClick={() => !selected && handle(o)} style={{ cursor: selected ? 'default' : 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ marginTop: 6 }}><AvatarXiaomei size={44}/></div>
                  <SpeechBubble side="left" color={isCorrect ? '#E6F9F0' : isWrong ? '#FFEEEE' : '#fff'} style={{ flex: 1, maxWidth: 'none', border: `2px solid ${isCorrect ? 'var(--brand)' : isWrong ? 'var(--danger)' : 'var(--line)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', background: 'var(--bg-3)', borderRadius: 6 }}>{o.id}</span>
                      <span>{o.text}</span>
                      {isCorrect && Icon.check(18, 'var(--brand)')}
                      {isWrong && Icon.x(18, 'var(--danger)')}
                    </div>
                    {showAnswer && (isCorrect || isWrong) && (
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--line)' }}>{o.why}</div>
                    )}
                  </SpeechBubble>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {q.options.map(o => (
            <button key={o.id} onClick={() => !selected && handle(o)} style={{
              appearance: 'none', border: `2px solid ${selected?.id === o.id ? (o.correct ? 'var(--brand)' : 'var(--danger)') : 'var(--line)'}`,
              background: selected?.id === o.id ? (o.correct ? '#E6F9F0' : '#FFEEEE') : 'var(--bg-1)',
              padding: 14, borderRadius: 14, fontSize: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}>{o.id}. {o.text}</button>
          ))}
        </div>
      )}
    </>
  );
}

function MatchQuestion({ q, onAnswer }) {
  const [matches, setMatches] = React.useState({});
  const [selectedLeft, setSelectedLeft] = React.useState(null);
  const [done, setDone] = React.useState(false);

  const pickLeft = (id) => { if (matches[id] || done) return; setSelectedLeft(id); };
  const pickRight = (id) => {
    if (!selectedLeft || done) return;
    const ok = selectedLeft === id;
    setMatches(m => ({ ...m, [selectedLeft]: { rightId: id, correct: ok } }));
    setSelectedLeft(null);
    if (Object.keys({ ...matches, [selectedLeft]: 1 }).length === q.left.length) {
      setDone(true);
      setTimeout(() => onAnswer(true), 800);
    }
  };

  const colorFor = (id) => {
    const m = matches[id];
    if (!m) return null;
    return m.correct ? 'var(--brand)' : 'var(--danger)';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.left.map(l => {
          const active = selectedLeft === l.id;
          const c = colorFor(l.id);
          return (
            <div key={l.id} onClick={() => pickLeft(l.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 8,
              background: c ? `${c}22` : active ? 'var(--brand-soft)' : 'var(--bg-1)',
              border: `2px solid ${c || (active ? 'var(--brand)' : 'var(--line)')}`,
              borderRadius: 14, cursor: 'pointer',
            }}>
              <l.Comp size={40}/>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{l.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.right.map(r => {
          const matchedWith = Object.entries(matches).find(([, v]) => v.rightId === r.id);
          const c = matchedWith ? (matchedWith[1].correct ? 'var(--brand)' : 'var(--danger)') : null;
          return (
            <div key={r.id} onClick={() => pickRight(r.id)} style={{
              padding: 12, borderRadius: 14, fontSize: 13, lineHeight: 1.4,
              background: c ? `${c}15` : 'var(--bg-1)',
              border: `2px solid ${c || 'var(--line)'}`,
              cursor: selectedLeft ? 'pointer' : 'default',
              opacity: matchedWith ? 0.9 : 1,
            }}>{r.label}</div>
          );
        })}
      </div>
    </div>
  );
}

function OrderQuestion({ q, onAnswer }) {
  const [items, setItems] = React.useState(() => [...q.items].sort(() => Math.random() - 0.5));
  const [checked, setChecked] = React.useState(false);
  const move = (i, dir) => {
    const ni = i + dir;
    if (ni < 0 || ni >= items.length) return;
    const arr = [...items];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setItems(arr);
  };
  const check = () => {
    const ok = items.every((it, i) => it.id === i + 1);
    setChecked(true);
    setTimeout(() => onAnswer(ok), 1500);
  };
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {items.map((it, i) => {
          const ok = checked && it.id === i + 1;
          const wrong = checked && it.id !== i + 1;
          return (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: ok ? '#E6F9F0' : wrong ? '#FFEEEE' : 'var(--bg-1)',
              border: `2px solid ${ok ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--line)'}`,
              borderRadius: 14, fontSize: 14, fontWeight: 600,
            }}>
              <span style={{ opacity: 0.5 }}>{Icon.drag(20)}</span>
              <div style={{ flex: 1 }}>{it.text}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => move(i, -1)} style={btnTiny}>▲</button>
                <button onClick={() => move(i, 1)} style={btnTiny}>▼</button>
              </div>
            </div>
          );
        })}
      </div>
      {!checked && <BigButton onClick={check} style={{ width: '100%' }}>检查答案</BigButton>}
    </>
  );
}
const btnTiny = { width: 22, height: 22, border: 0, borderRadius: 6, background: 'var(--bg-3)', cursor: 'pointer', fontSize: 10, color: 'var(--ink-2)' };

function JudgeQuestion({ q, onAnswer }) {
  const [sel, setSel] = React.useState(null);
  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
        {q.dialog.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: d.who === 'clerk' ? 'flex-start' : 'flex-end', marginBottom: 8 }}>
            <div style={{
              background: d.who === 'clerk' ? 'var(--brand-soft)' : '#F0F3F7',
              padding: '6px 10px', borderRadius: 12, fontSize: 13, maxWidth: 260,
            }}>
              <b style={{ fontSize: 10, color: 'var(--ink-3)', marginRight: 6 }}>{d.who === 'clerk' ? '小美' : '顾客'}</b>{d.msg}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map(o => {
          const picked = sel?.id === o.id;
          const showState = sel && (o.correct || picked);
          const ok = showState && o.correct;
          const wrong = picked && !o.correct;
          return (
            <button key={o.id} onClick={() => { if (!sel) { setSel(o); onAnswer(o.correct); } }} style={{
              appearance: 'none',
              border: `2px solid ${ok ? 'var(--brand)' : wrong ? 'var(--danger)' : 'var(--line)'}`,
              background: ok ? '#E6F9F0' : wrong ? '#FFEEEE' : 'var(--bg-1)',
              padding: 14, borderRadius: 14, fontSize: 14, cursor: sel ? 'default' : 'pointer',
              textAlign: 'left', fontFamily: 'inherit', color: 'var(--ink-1)',
            }}>
              <div style={{ fontWeight: 700 }}>{o.id}. {o.text}</div>
              {showState && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>{o.why}</div>}
            </button>
          );
        })}
      </div>
    </>
  );
}

Object.assign(window, { QuizScreen });
