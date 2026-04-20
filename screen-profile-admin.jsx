// 屏幕6：积分激励 · 徽章 · 排行榜；屏幕7：PC 管理员后台

function ProfileScreen({ onBack, intensity = 'medium', character }) {
  return (
    <div style={{ height: '100%', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={iconBtn}>{Icon.chevronL(20)}</button>
        <div style={{ fontSize: 16, fontWeight: 800, flex: 1 }}>我的成长</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }} className="no-scrollbar">
        {/* 头像卡 */}
        <div style={{ background: 'linear-gradient(135deg, #14B87A 0%, #0A7A50 100%)', borderRadius: 20, padding: 18, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', padding: 4, borderRadius: '50%', overflow: 'hidden', width: 72, height: 72, flexShrink: 0 }}>
            {character?.img
              ? <img src={character.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}/>
              : <AvatarXiaomei size={64}/>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{character?.nickname || character?.name || '小美'}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{character?.store || '朝阳大悦城店'} · 入职 6 个月</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11 }}>
              <span>🏆 Lv.7</span>
              <span>🔥 7 天连胜</span>
              <span>💎 120</span>
            </div>
          </div>
        </div>
        {/* 数据条 */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { n: '38', l: '通关场景', c: 'var(--brand)' },
            { n: '142', l: '累计题数', c: '#4E7BFF' },
            { n: '86', l: '平均分', c: '#FF9E44' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 12, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* 连胜日历 */}
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ animation: 'flame-flicker 1s infinite' }}>{Icon.flame(20)}</span>
            <div style={{ fontSize: 14, fontWeight: 800, flex: 1 }}>连胜火焰 · 7 天</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>距离最长 12 天 ↑</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['一','二','三','四','五','六','日'].map((d, i) => (
              <div key={i} style={{
                flex: 1, aspectRatio: '1', borderRadius: 10,
                background: i < 7 ? 'var(--brand)' : 'var(--bg-3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: i < 7 ? '#fff' : 'var(--ink-3)',
                boxShadow: i < 7 ? '0 2px 0 var(--brand-ink)' : 'none',
                fontSize: 10, fontWeight: 700,
              }}>
                <span>{d}</span>
                <span style={{ fontSize: 14, marginTop: 2 }}>{i < 7 ? '🔥' : '·'}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 徽章墙 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>🏅 我的徽章</div>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, boxShadow: 'var(--shadow-card)' }}>
            <Badge label="收银办卡大师" icon={<span style={{fontSize:24}}>💳</span>} color="#14B87A" earned size={60}/>
            <Badge label="投诉处理能手" icon={<span style={{fontSize:24}}>🛡</span>} color="#4E7BFF" earned size={60}/>
            <Badge label="慢病专员" icon={<span style={{fontSize:24}}>💊</span>} color="#A67BD6" earned={false} size={60}/>
            <Badge label="7 天连胜" icon={<span style={{fontSize:24}}>🔥</span>} color="#FF9E44" earned size={60}/>
            <Badge label="100 题达人" icon={<span style={{fontSize:22}}>💯</span>} color="#FFCE3C" earned size={60}/>
            <Badge label="金牌导购" icon={<span style={{fontSize:22}}>👑</span>} color="#FF6FA4" earned={false} size={60}/>
            <Badge label="健康服务星" icon={<span style={{fontSize:22}}>🌿</span>} color="#14B87A" earned={false} size={60}/>
            <Badge label="满分达人" icon={<span style={{fontSize:22}}>⭐</span>} color="#FF9E44" earned={false} size={60}/>
          </div>
        </div>
        {/* 门店排行榜 —— 只看练习量 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>🏪 本店练习榜 · 本周</div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {[
              { rank: 1, name: '张璐', count: 34, self: false },
              { rank: 2, name: '小美', count: 28, self: true },
              { rank: 3, name: '周文博', count: 22, self: false },
              { rank: 4, name: '赵芳', count: 18, self: false },
            ].map(r => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: r.rank > 1 ? '1px solid var(--line)' : 0, background: r.self ? 'var(--brand-soft)' : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.rank <= 3 ? ['#FFCE3C','#D5DAE1','#E8A87C'][r.rank-1] : 'var(--bg-3)', color: r.rank <= 3 ? '#fff' : 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{r.rank}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: r.self ? 800 : 600 }}>{r.name}{r.self && <span style={{ fontSize: 10, background: 'var(--brand)', color: '#fff', padding: '1px 6px', borderRadius: 6, marginLeft: 6 }}>我</span>}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{r.count} 次</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, paddingLeft: 4 }}>🔒 只统计练习次数，不看考核分数 —— 放心练</div>
        </div>
      </div>
    </div>
  );
}
const iconBtn = { background: 'rgba(0,0,0,0.06)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

// ────────────── PC 管理员后台 ──────────────
function AdminDashboard() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', height: '100%', display: 'flex', background: 'var(--bg-2)' }}>
      {/* 左侧栏 */}
      <div style={{ width: 200, background: '#fff', borderRight: '1px solid var(--line)', padding: '18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 18px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>🏪</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>门店对练</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>管理后台</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          {[
            { l: '数据总览', a: true, i: Icon.chart(16) },
            { l: '员工管理', i: Icon.user(16) },
            { l: '场景库', i: Icon.book(16) },
            { l: '排行榜', i: Icon.trophy(16) },
            { l: '设置', i: Icon.settings(16) },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: m.a ? 'var(--brand-ink)' : 'var(--ink-2)',
              background: m.a ? 'var(--brand-soft)' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
            }}>{m.i}{m.l}</div>
          ))}
        </div>
      </div>
      {/* 主内容 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>朝阳大悦城店 · 4 月 18 日</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>数据总览</div>
          </div>
          <select style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 12, background: '#fff' }}>
            <option>本周</option><option>本月</option>
          </select>
        </div>
        {/* 指标 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { l: '本周练习人次', n: '142', d: '↑ 23%', c: 'var(--brand)' },
            { l: '平均评分', n: '81', d: '↑ 4', c: '#4E7BFF' },
            { l: '最活跃员工', n: '张璐', d: '34 次', c: '#FF9E44' },
            { l: '薄弱话术点', n: '次日生效', d: '漏答率 48%', c: 'var(--danger)' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.l}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.c, marginTop: 4 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.d}</div>
            </div>
          ))}
        </div>
        {/* 图表占位 + 员工表 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>员工练习趋势</div>
            <svg viewBox="0 0 360 160" width="100%" height="160">
              {/* 网格 */}
              {[0,1,2,3].map(i => <line key={i} x1="30" y1={20 + i*32} x2="350" y2={20 + i*32} stroke="#EEF1F5" strokeWidth="1"/>)}
              {/* 折线 */}
              <path d="M30 120 L80 105 L130 90 L180 75 L230 60 L280 45 L330 30" stroke="var(--brand)" strokeWidth="3" fill="none"/>
              <path d="M30 120 L80 105 L130 90 L180 75 L230 60 L280 45 L330 30 L330 140 L30 140 Z" fill="var(--brand)" fillOpacity="0.1"/>
              {['4/12','4/13','4/14','4/15','4/16','4/17','4/18'].map((d, i) => (
                <text key={i} x={30 + i*50} y="155" fontSize="10" fill="#8A92A3" textAnchor="middle">{d}</text>
              ))}
              {[0,1,2,3,4,5,6].map(i => <circle key={i} cx={30 + i*50} cy={120 - i*15} r="4" fill="#fff" stroke="var(--brand)" strokeWidth="2"/>)}
            </svg>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>话术薄弱项</div>
            {[
              { l: '次日生效提醒', v: 0.52, c: 'var(--danger)' },
              { l: '会员日权益', v: 0.68, c: '#FF9E44' },
              { l: '优惠券使用', v: 0.82, c: 'var(--brand)' },
              { l: '立减话术', v: 0.91, c: 'var(--brand)' },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>{r.l}</span>
                  <span style={{ fontWeight: 700 }}>{Math.round(r.v*100)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${r.v*100}%`, height: '100%', background: r.c }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen, AdminDashboard });
