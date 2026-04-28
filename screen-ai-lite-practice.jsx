// 屏幕：AI 入门版顾客对练（纯LLM扮演）

const LITE_API_BASE_FROM_QUERY = (() => {
  try {
    return new URLSearchParams(window.location.search).get('api') || '';
  } catch {
    return '';
  }
})();
const LITE_IS_LOCAL = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const LITE_WORKER_URL = LITE_API_BASE_FROM_QUERY || (LITE_IS_LOCAL ? 'http://localhost:8899' : '');

const LITE_PERSONA_FALLBACK = [
  { id: 'privacy_concern', label: '隐私顾虑型顾客', openingLine: '我不想留手机号。', concern: '担心隐私和骚扰', roundLimit: 6 },
  { id: 'value_disbelief', label: '价值不认同型顾客', openingLine: '办会员有什么用？我平时也不怎么来。', concern: '觉得不划算', roundLimit: 6 },
  { id: 'time_pressure', label: '时间紧张型顾客', openingLine: '我赶时间，不办了，下次吧。', concern: '没时间', roundLimit: 4 },
  { id: 'bad_experience', label: '负面经验型顾客', openingLine: '以前办过会员，也没觉得有什么用。', concern: '不信任会员价值', roundLimit: 6 },
  { id: 'anti_sales', label: '推销反感型顾客', openingLine: '别推销了，我不办。', concern: '反感强推', roundLimit: 5 },
];

async function callLiteInit(personaId = '') {
  const resp = await fetch(`${LITE_WORKER_URL}/api/beginner-init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personaId }),
  });
  if (!resp.ok) throw new Error(`lite-init ${resp.status}`);
  return resp.json();
}

async function callLiteTurn({ personaId, clerkText, conversation, round }) {
  const resp = await fetch(`${LITE_WORKER_URL}/api/beginner-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personaId, clerkText, conversation, round }),
  });
  if (!resp.ok) throw new Error(`lite-turn ${resp.status}`);
  return resp.json();
}

async function callLiteFeedback(conversation) {
  const resp = await fetch(`${LITE_WORKER_URL}/api/beginner-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation }),
  });
  if (!resp.ok) throw new Error(`lite-feedback ${resp.status}`);
  return resp.json();
}

function demoLiteTurn(persona, clerkText, round) {
  const t = String(clerkText || '');
  const hardPush = /必须|一定要|赶紧|立刻|不办就亏/.test(t);
  const hasValue = /(立减|减|省).{0,6}\d+|会员价|优惠券/.test(t);
  const hasEmpathy = /理解|明白|您担心|放心/.test(t);
  const hasPrivacy = /仅用于|不会打扰|不泄露|可关闭/.test(t);
  const hasSpeed = /10秒|一分钟|很快|不耽误/.test(t);

  if (hardPush) return { customerReply: '别推了，我不办。', done: true, result: 'reject' };
  if (persona.id === 'privacy_concern' && hasPrivacy && hasValue) return { customerReply: '那如果不会一直打扰，可以办一下。', done: true, result: 'accept' };
  if (persona.id === 'time_pressure' && hasSpeed && hasValue) return { customerReply: '很快的话，那你帮我弄一下吧。', done: true, result: 'accept' };
  if (hasEmpathy && hasValue) return { customerReply: '你再说下这单能省多少。', done: false, result: 'hesitate' };
  if (round >= (persona.roundLimit || 6)) return { customerReply: '先这样吧，我先结账。', done: true, result: 'reject' };
  return { customerReply: '我再想想，先结账吧。', done: false, result: 'hesitate' };
}

function AILitePracticeScreen({ onBack }) {
  const [personas, setPersonas] = React.useState(LITE_PERSONA_FALLBACK);
  const [persona, setPersona] = React.useState(LITE_PERSONA_FALLBACK[0]);
  const [messages, setMessages] = React.useState([]);
  const [conversation, setConversation] = React.useState([]);
  const [text, setText] = React.useState('');
  const [round, setRound] = React.useState(1);
  const [done, setDone] = React.useState(false);
  const [result, setResult] = React.useState('hesitate');
  const [feedback, setFeedback] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [feedbackLoading, setFeedbackLoading] = React.useState(false);
  const [usingDemo, setUsingDemo] = React.useState(!LITE_WORKER_URL);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function startWithPersona(pid) {
    setDone(false);
    setFeedback('');
    setRound(1);
    try {
      if (!LITE_WORKER_URL) throw new Error('no-api');
      const data = await callLiteInit(pid);
      const list = Array.isArray(data.personas) && data.personas.length ? data.personas : LITE_PERSONA_FALLBACK;
      setPersonas(list);
      const selected = list.find((x) => x.id === pid) || data.persona || list[0];
      setPersona(selected);
      setMessages([
        { who: 'sys', text: `🎯 入门版：${selected.label}（最多${selected.roundLimit || data.roundLimit || 6}轮）` },
        { who: 'customer', text: selected.openingLine },
      ]);
      setConversation([{ who: 'customer', text: selected.openingLine }]);
      setUsingDemo(false);
    } catch {
      const selected = LITE_PERSONA_FALLBACK.find((x) => x.id === pid) || LITE_PERSONA_FALLBACK[0];
      setPersona(selected);
      setMessages([
        { who: 'sys', text: `🎯 入门版：${selected.label}（最多${selected.roundLimit}轮）` },
        { who: 'customer', text: selected.openingLine },
      ]);
      setConversation([{ who: 'customer', text: selected.openingLine }]);
      setUsingDemo(true);
    }
  }

  React.useEffect(() => {
    startWithPersona(persona.id);
  }, []);

  async function send() {
    const clerkText = text.trim();
    if (!clerkText || loading || done) return;
    setLoading(true);
    setMessages((m) => [...m, { who: 'clerk', text: clerkText }]);
    const nextConversation = [...conversation, { who: 'clerk', text: clerkText }];
    setConversation(nextConversation);
    setText('');

    try {
      let turn;
      if (usingDemo || !LITE_WORKER_URL) {
        await new Promise((r) => setTimeout(r, 450));
        turn = demoLiteTurn(persona, clerkText, round);
      } else {
        turn = await callLiteTurn({ personaId: persona.id, clerkText, conversation: nextConversation.slice(-20), round });
      }
      const reply = String(turn.customerReply || '我再想想。').trim();
      const end = !!turn.done;
      const nextRound = round + 1;
      setMessages((m) => [...m, { who: 'customer', text: reply }]);
      setConversation((c) => [...c, { who: 'customer', text: reply }]);
      setRound(nextRound);
      setResult(turn.result || 'hesitate');
      if (end || nextRound > (persona.roundLimit || 6)) setDone(true);
    } catch {
      setMessages((m) => [...m, { who: 'customer', text: '我再想想，先结账吧。' }]);
      setConversation((c) => [...c, { who: 'customer', text: '我再想想，先结账吧。' }]);
      if (round + 1 > (persona.roundLimit || 6)) setDone(true);
      setRound((r) => r + 1);
    } finally {
      setLoading(false);
    }
  }

  async function genFeedback() {
    if (feedbackLoading || !conversation.length) return;
    setFeedbackLoading(true);
    try {
      if (usingDemo || !LITE_WORKER_URL) throw new Error('demo');
      const data = await callLiteFeedback(conversation);
      setFeedback(String(data.feedback || '').trim());
    } catch {
      setFeedback(`【训练结果】
等级：良好

【做得好的地方】
1. 能围绕顾客顾虑继续沟通。
2. 有一定的推进意识。

【需要改进的地方】
1. 价值表达还可以更具体，最好量化到本单。
2. 对异议先共情再说明，避免连续劝说。

【下次可以这样说】
“我理解您担心，我们就看这单：现在能省X元，流程30秒，不合适就正常结账。”`);
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
      <div style={{ padding: '54px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.06)', border: 0, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer' }}>{Icon.x(18, '#1A1F2C')}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>入门版训练</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>LLM 顾客对练</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: done ? 'var(--brand-ink)' : 'var(--ink-3)' }}>第 {Math.min(round, persona.roundLimit || 6)} / {persona.roundLimit || 6} 轮</div>
      </div>

      <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => startWithPersona(p.id)}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '7px 11px',
              background: persona.id === p.id ? 'var(--brand)' : '#fff',
              color: persona.id === p.id ? '#fff' : 'var(--ink-2)',
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-card)',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ margin: '0 16px 8px', background: '#fff', borderRadius: 14, padding: '10px 12px', boxShadow: 'var(--shadow-card)', fontSize: 12, color: 'var(--ink-3)' }}>
        当前顾虑：<b style={{ color: 'var(--ink-2)' }}>{persona.concern}</b>。目标：像真实顾客自然回应，不配合、不教学。
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 12px' }} className="no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.who === 'clerk' ? 'flex-end' : 'flex-start', marginBottom: 8, gap: 8 }}>
            {m.who !== 'clerk' && <AvatarElder size={28} />}
            <div style={{ maxWidth: 260, padding: '10px 13px', borderRadius: 14, background: m.who === 'clerk' ? 'var(--brand)' : '#fff', color: m.who === 'clerk' ? '#fff' : 'var(--ink-1)', fontSize: 14, lineHeight: 1.4, boxShadow: m.who === 'clerk' ? '0 2px 8px rgba(20,184,122,0.25)' : 'var(--shadow-card)' }}>
              {m.text}
            </div>
            {m.who === 'clerk' && <AvatarXiaomei size={28} />}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>顾客思考中…</div>}
      </div>

      {feedback && (
        <div style={{ margin: '0 16px 8px', background: '#fff', borderRadius: 14, padding: '10px 12px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>训练反馈</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.45, color: 'var(--ink-2)', fontFamily: 'inherit' }}>{feedback}</pre>
        </div>
      )}

      <div style={{ padding: '10px 16px 32px', borderTop: '1px solid var(--line)', background: 'var(--bg-1)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={done ? '本轮已结束，可生成反馈' : '输入你要对顾客说的话…'}
            disabled={loading || done}
            style={{ flex: 1, borderRadius: 12, border: '1px solid var(--line)', padding: '10px 12px', fontSize: 14, outline: 'none' }}
          />
          <button onClick={send} disabled={loading || done} style={{ border: 0, borderRadius: 12, background: loading || done ? '#C8CED8' : 'var(--brand)', color: '#fff', padding: '0 14px', fontWeight: 800, cursor: loading || done ? 'not-allowed' : 'pointer' }}>发送</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDone(true)} style={{ flex: 1, border: 0, borderRadius: 12, background: '#E9EEF5', color: 'var(--ink-2)', padding: '10px 12px', fontWeight: 800, cursor: 'pointer' }}>结束对练</button>
          <button onClick={genFeedback} disabled={!done || feedbackLoading} style={{ flex: 1, border: 0, borderRadius: 12, background: !done || feedbackLoading ? '#C8CED8' : 'var(--brand)', color: '#fff', padding: '10px 12px', fontWeight: 800, cursor: !done || feedbackLoading ? 'not-allowed' : 'pointer' }}>
            {feedbackLoading ? '生成中…' : '生成反馈'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AILitePracticeScreen });

