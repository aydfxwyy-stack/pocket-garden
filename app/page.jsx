"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "pocket-garden-data-v2";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const COLORS = ["#d98573", "#e6ad49", "#79a886", "#72a9bb", "#8e84b5", "#c47d9b"];
const ICONS = ["📚", "🎬", "🗣️", "🏃", "🎨", "🎵", "☕", "🌱", "🧘", "✍️", "🥗", "🧩"];
const DEFAULT_CATEGORIES = [
  { id: "reading", name: "阅读", icon: "📚", color: "#d98573" },
  { id: "watching", name: "影视", icon: "🎬", color: "#72a9bb" },
  { id: "language", name: "语言", icon: "🗣️", color: "#8e84b5" },
  { id: "health", name: "健康", icon: "🏃", color: "#79a886" },
  { id: "other", name: "其他", icon: "🌱", color: "#e6ad49" }
];

const todayKey = () => localDateKey(new Date());
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const localDateKey = date => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fmt = n => Number(n || 0).toLocaleString("zh-CN", { maximumFractionDigits: 1 });
const monthLabel = date => `${date.getFullYear()}年 ${date.getMonth() + 1}月`;

function sampleData() {
  const now = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ids = [uid(), uid(), uid()];
  return {
    version: 2,
    categories: DEFAULT_CATEGORIES,
    tasks: [
      { id: ids[0], name: "读完《小王子》", categoryId: "reading", icon: "📚", color: "#d98573", type: "quantity", target: 120, unit: "页", startDate: now, endDate: "", reminder: "", note: "睡前读一点", archived: false, completedAt: null, createdAt: Date.now() - 3000 },
      { id: ids[1], name: "看完一部好剧", categoryId: "watching", icon: "🎬", color: "#72a9bb", type: "quantity", target: 12, unit: "集", startDate: now, endDate: "", reminder: "", note: "", archived: false, completedAt: null, createdAt: Date.now() - 2000 },
      { id: ids[2], name: "日语学习 30 天", categoryId: "language", icon: "🗣️", color: "#8e84b5", type: "streak", target: 30, unit: "天", startDate: now, endDate: "", reminder: "20:00", note: "每天至少 15 分钟", archived: false, completedAt: null, createdAt: Date.now() - 1000 }
    ],
    records: [
      { id: uid(), taskId: ids[0], date: localDateKey(yesterday), amount: 12, note: "读到了狐狸出现" },
      { id: uid(), taskId: ids[2], date: now, amount: 1, note: "复习五十音" }
    ],
    settings: { seeded: true }
  };
}

function loadData() {
  if (typeof window === "undefined") return sampleData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : sampleData();
  } catch {
    return sampleData();
  }
}

export default function Home() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskEditor, setTaskEditor] = useState(null);
  const [recordEditor, setRecordEditor] = useState(null);
  const [checkinTask, setCheckinTask] = useState(null);
  const [toast, setToast] = useState("");
  const [installHint, setInstallHint] = useState(false);

  useEffect(() => {
    setData(loadData());
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setInstallHint(!standalone && /iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const flash = message => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const selectedTask = data?.tasks.find(task => task.id === selectedTaskId);
  const update = fn => setData(current => {
    const next = structuredClone(current);
    fn(next);
    refreshCompletions(next);
    return next;
  });

  if (!data) return <div className="loading"><span>🌱</span><p>正在唤醒花园…</p></div>;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div>
          <p className="eyebrow">POCKET GARDEN</p>
          <h1>{tab === "today" ? "今天，种点什么？" : tab === "calendar" ? "打卡日历" : tab === "analytics" ? "成长小结" : tab === "garden" ? "我的花园" : "更多设置"}</h1>
        </div>
        {tab === "today" && <button className="round-button" onClick={() => setTaskEditor(emptyTask(data.categories))} aria-label="新建任务">＋</button>}
      </header>

      {installHint && (
        <section className="install-card">
          <span className="install-icon">📲</span>
          <div><strong>把花园放到桌面</strong><p>点 Safari 下方的分享按钮，再选“添加到主屏幕”。</p></div>
          <button onClick={() => setInstallHint(false)}>×</button>
        </section>
      )}

      <div className="page">
        {tab === "today" && <Today data={data} onOpen={setSelectedTaskId} onCheckin={setCheckinTask} onNew={() => setTaskEditor(emptyTask(data.categories))} />}
        {tab === "calendar" && <CalendarPage data={data} onEditRecord={setRecordEditor} />}
        {tab === "analytics" && <AnalyticsPage data={data} />}
        {tab === "garden" && <GardenPage data={data} />}
        {tab === "more" && <MorePage data={data} update={update} flash={flash} />}
      </div>

      <nav className="tabbar" aria-label="主导航">
        {[
          ["today", "⌂", "今日"], ["calendar", "▦", "日历"], ["analytics", "◔", "分析"],
          ["garden", "♧", "花园"], ["more", "•••", "更多"]
        ].map(item => (
          <button key={item[0]} className={tab === item[0] ? "active" : ""} onClick={() => { setTab(item[0]); setSelectedTaskId(null); }}>
            <span>{item[1]}</span><small>{item[2]}</small>
          </button>
        ))}
      </nav>

      {selectedTask && (
        <TaskDetail task={selectedTask} data={data} onClose={() => setSelectedTaskId(null)}
          onEdit={() => setTaskEditor(selectedTask)}
          onCheckin={() => setCheckinTask(selectedTask)}
          onEditRecord={setRecordEditor}
          onArchive={() => { update(d => { const t = d.tasks.find(x => x.id === selectedTask.id); t.archived = !t.archived; }); setSelectedTaskId(null); flash(selectedTask.archived ? "已移回任务清单" : "已归档"); }}
          onDelete={() => { if (confirm(`确定删除“${selectedTask.name}”及其全部记录吗？`)) { update(d => { d.tasks = d.tasks.filter(x => x.id !== selectedTask.id); d.records = d.records.filter(r => r.taskId !== selectedTask.id); }); setSelectedTaskId(null); flash("任务已删除"); } }}
        />
      )}
      {taskEditor && <TaskEditor task={taskEditor} categories={data.categories} onClose={() => setTaskEditor(null)}
        onSave={task => { update(d => { const i = d.tasks.findIndex(x => x.id === task.id); i >= 0 ? d.tasks[i] = task : d.tasks.push(task); }); setTaskEditor(null); flash(taskEditor.createdAt ? "任务已更新" : "新任务已种下"); }} />}
      {checkinTask && <CheckinEditor task={checkinTask} onClose={() => setCheckinTask(null)}
        onSave={record => { update(d => d.records.push(record)); setCheckinTask(null); flash("打卡成功，花园获得成长值"); }} />}
      {recordEditor && <RecordEditor record={recordEditor} task={data.tasks.find(t => t.id === recordEditor.taskId)}
        onClose={() => setRecordEditor(null)}
        onSave={record => { update(d => { const i = d.records.findIndex(x => x.id === record.id); d.records[i] = record; }); setRecordEditor(null); flash("记录已更新"); }}
        onDelete={() => { update(d => { d.records = d.records.filter(x => x.id !== recordEditor.id); }); setRecordEditor(null); flash("记录已删除"); }} />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Today({ data, onOpen, onCheckin, onNew }) {
  const [filter, setFilter] = useState("all");
  const active = data.tasks.filter(t => !t.archived);
  const tasks = filter === "all" ? active : active.filter(t => t.categoryId === filter);
  const doneToday = new Set(data.records.filter(r => r.date === todayKey()).map(r => r.taskId)).size;
  const greeting = new Date().getHours() < 12 ? "早上好" : new Date().getHours() < 18 ? "下午好" : "晚上好";

  return (
    <>
      <section className="hero-card">
        <div><span className="soft-label">{greeting}</span><h2>小步前进，也算抵达。</h2><p>今天已经照顾了 <b>{doneToday}</b> 项计划</p></div>
        <div className="hero-plant"><span>☀️</span><div>🌿</div></div>
      </section>
      <div className="chips">
        <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>全部</button>
        {data.categories.map(c => <button key={c.id} className={filter === c.id ? "selected" : ""} onClick={() => setFilter(c.id)}>{c.icon} {c.name}</button>)}
      </div>
      <div className="section-heading"><div><p>正在生长</p><span>{tasks.length} 个任务</span></div></div>
      <div className="task-list">
        {tasks.length ? tasks.map(task => <TaskCard key={task.id} task={task} data={data} onOpen={onOpen} onCheckin={onCheckin} />) :
          <Empty icon="🌾" title="这里还没有任务" text="点右上角的加号，种下第一颗种子。" action={onNew} />}
      </div>
    </>
  );
}

function TaskCard({ task, data, onOpen, onCheckin }) {
  const progress = taskProgress(task, data.records);
  const category = data.categories.find(c => c.id === task.categoryId);
  return (
    <article className={`task-card ${progress.done ? "done" : ""}`} style={{ "--accent": task.color }} onClick={() => onOpen(task.id)}>
      <div className="task-icon">{task.icon}</div>
      <div className="task-main">
        <div className="task-title"><div><h3>{task.name}</h3><p>{category?.name || "未分类"} · {task.type === "streak" ? "坚持里程碑" : "累计目标"}</p></div><span>{progress.done ? "✓" : "›"}</span></div>
        <div className="progress"><i style={{ width: `${progress.percent}%` }} /></div>
        <div className="task-meta"><span>{fmt(progress.current)} / {fmt(task.target)} {task.unit}</span><b>{Math.round(progress.percent)}%</b></div>
      </div>
      {!progress.done && <button className="water-button" onClick={e => { e.stopPropagation(); onCheckin(task); }}>＋ 打卡</button>}
    </article>
  );
}

function TaskDetail({ task, data, onClose, onEdit, onCheckin, onEditRecord, onArchive, onDelete }) {
  const progress = taskProgress(task, data.records);
  const records = data.records.filter(r => r.taskId === task.id).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Modal title="任务详情" onClose={onClose}>
      <section className="detail-hero" style={{ "--accent": task.color }}>
        <div className="big-icon">{task.icon}</div><p>{data.categories.find(c => c.id === task.categoryId)?.name}</p><h2>{task.name}</h2>
        {task.note && <span>{task.note}</span>}
        <div className="progress large"><i style={{ width: `${progress.percent}%` }} /></div>
        <strong>{fmt(progress.current)} / {fmt(task.target)} {task.unit}</strong>
      </section>
      {!progress.done && <button className="primary full" onClick={onCheckin}>＋ 记录一次进展</button>}
      <div className="detail-facts">
        <span><small>开始日期</small>{task.startDate}</span>
        <span><small>结束日期</small>{task.endDate || "未设置"}</span>
        <span><small>每日提醒</small>{task.reminder || "未设置"}</span>
      </div>
      <div className="section-heading"><div><p>打卡记录</p><span>点击记录可编辑</span></div></div>
      <div className="record-list">
        {records.map(r => <button key={r.id} onClick={() => onEditRecord(r)}><i style={{ background: task.color }}>{r.date.slice(8)}</i><span><b>{r.date}</b><small>{r.note || "这一天也有好好前进"}</small></span><strong>+{fmt(r.amount)} {task.unit}</strong></button>)}
        {!records.length && <p className="muted centered">还没有打卡记录</p>}
      </div>
      <div className="action-grid">
        <button onClick={onEdit}>✎ 编辑任务</button><button onClick={onArchive}>{task.archived ? "↩ 移出归档" : "□ 归档任务"}</button>
      </div>
      <button className="danger-link" onClick={onDelete}>删除这个任务</button>
    </Modal>
  );
}

function TaskEditor({ task, categories, onClose, onSave }) {
  const isNew = !task.createdAt;
  const [form, setForm] = useState({ ...task });
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  return (
    <Modal title={isNew ? "种下新任务" : "编辑任务"} onClose={onClose}>
      <label className="field"><span>任务名称</span><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="比如：读完《小王子》" /></label>
      <div className="field"><span>可爱图标</span><div className="icon-picker">{ICONS.map(icon => <button key={icon} className={form.icon === icon ? "selected" : ""} onClick={() => set("icon", icon)}>{icon}</button>)}</div></div>
      <div className="field"><span>主题颜色</span><div className="color-picker">{COLORS.map(color => <button key={color} className={form.color === color ? "selected" : ""} style={{ background: color }} onClick={() => set("color", color)} />)}</div></div>
      <label className="field"><span>分类</span><select value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></label>
      <div className="segmented"><button className={form.type === "quantity" ? "selected" : ""} onClick={() => set("type", "quantity")}>累计总量</button><button className={form.type === "streak" ? "selected" : ""} onClick={() => { set("type", "streak"); if (form.unit === "页" || form.unit === "集") set("unit", "天"); }}>坚持天数</button></div>
      <div className="two-fields">
        <label className="field"><span>目标值</span><input type="number" min="1" value={form.target} onChange={e => set("target", Number(e.target.value))} /></label>
        <label className="field"><span>单位</span><input value={form.unit} onChange={e => set("unit", e.target.value)} /></label>
      </div>
      <div className="two-fields">
        <label className="field"><span>开始日期</span><input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></label>
        <label className="field"><span>结束日期</span><input type="date" value={form.endDate} min={form.startDate} onChange={e => set("endDate", e.target.value)} /></label>
      </div>
      <label className="field"><span>提醒时间（设备内提示）</span><input type="time" value={form.reminder} onChange={e => set("reminder", e.target.value)} /></label>
      <label className="field"><span>给自己的备注</span><textarea value={form.note} onChange={e => set("note", e.target.value)} placeholder="写下一句温柔的提醒…" /></label>
      <button className="primary full" disabled={!form.name.trim() || form.target <= 0} onClick={() => onSave({ ...form, name: form.name.trim(), id: form.id || uid(), createdAt: form.createdAt || Date.now(), archived: form.archived || false, completedAt: form.completedAt || null })}>{isNew ? "种下这颗种子" : "保存修改"}</button>
    </Modal>
  );
}

function CheckinEditor({ task, onClose, onSave }) {
  const [amount, setAmount] = useState(task.type === "streak" ? 1 : 1);
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState("");
  return (
    <Modal title="记录进展" onClose={onClose}>
      <div className="checkin-title"><span style={{ background: `${task.color}22` }}>{task.icon}</span><div><p>{task.name}</p><small>每一次记录都值得被看见</small></div></div>
      <label className="field"><span>打卡日期</span><input type="date" max={todayKey()} value={date} onChange={e => setDate(e.target.value)} /><small>可以选择过去的日期进行补签</small></label>
      {task.type === "quantity" ? <label className="field"><span>这次完成了多少（{task.unit}）</span><input className="large-input" type="number" min="0.1" step="0.1" value={amount} onChange={e => setAmount(Number(e.target.value))} /></label> :
        <div className="streak-note">🌞 周期任务同一天只计为 1 个有效坚持日</div>}
      <label className="field"><span>记录此刻</span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="今天有什么小小收获？" /></label>
      <button className="primary full" disabled={amount <= 0} onClick={() => onSave({ id: uid(), taskId: task.id, date, amount: task.type === "streak" ? 1 : amount, note: note.trim() })}>完成打卡</button>
    </Modal>
  );
}

function RecordEditor({ record, task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...record });
  return (
    <Modal title="编辑打卡记录" onClose={onClose}>
      <div className="checkin-title"><span>{task?.icon || "🌱"}</span><div><p>{task?.name}</p><small>修改后会自动重新计算进度</small></div></div>
      <label className="field"><span>日期</span><input type="date" max={todayKey()} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
      {task?.type !== "streak" && <label className="field"><span>完成量（{task?.unit}）</span><input type="number" min="0.1" step="0.1" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></label>}
      <label className="field"><span>备注</span><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
      <button className="primary full" onClick={() => onSave(form)}>保存修改</button>
      <button className="danger-link" onClick={() => confirm("确定删除这条打卡记录吗？") && onDelete()}>删除这条记录</button>
    </Modal>
  );
}

function CalendarPage({ data, onEditRecord }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayKey());
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const counts = {};
  data.records.forEach(r => counts[r.date] = (counts[r.date] || 0) + 1);
  const chosen = data.records.filter(r => r.date === selected).sort((a, b) => a.taskId.localeCompare(b.taskId));
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthRecords = data.records.filter(r => r.date.startsWith(monthPrefix));
  const move = n => setCursor(new Date(year, month + n, 1));
  return (
    <>
      <section className="calendar-card">
        <div className="month-switch"><button onClick={() => move(-1)}>‹</button><h2>{monthLabel(cursor)}</h2><button onClick={() => move(1)}>›</button></div>
        <div className="weekdays">{["一","二","三","四","五","六","日"].map(x => <span key={x}>{x}</span>)}</div>
        <div className="calendar-grid">
          {Array.from({ length: blanks }).map((_, i) => <i key={`b${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const key = `${monthPrefix}-${String(i + 1).padStart(2, "0")}`;
            const count = counts[key] || 0;
            return <button key={key} className={`${selected === key ? "selected" : ""} level-${Math.min(count, 4)}`} onClick={() => setSelected(key)}><span>{i + 1}</span>{count > 0 && <small>{count}</small>}</button>;
          })}
        </div>
        <div className="legend"><span>少</span>{[0,1,2,3,4].map(n => <i key={n} className={`level-${n}`} />)}<span>多</span></div>
      </section>
      <div className="stat-row"><Stat value={monthRecords.length} label="本月打卡" /><Stat value={fmt(monthRecords.reduce((s,r) => s + Number(r.amount), 0))} label="完成总量" /><Stat value={new Set(monthRecords.map(r => r.date)).size} label="活跃天数" /></div>
      <div className="section-heading"><div><p>{selected} 的记录</p><span>点击可修改</span></div></div>
      <div className="record-list">
        {chosen.map(r => { const t = data.tasks.find(x => x.id === r.taskId); return <button key={r.id} onClick={() => onEditRecord(r)}><i style={{ background: t?.color }}>{t?.icon}</i><span><b>{t?.name || "已删除任务"}</b><small>{r.note || "完成了一次打卡"}</small></span><strong>+{fmt(r.amount)} {t?.unit}</strong></button>; })}
        {!chosen.length && <Empty icon="☁️" title="这天很安静" text="选择有颜色的日期，可以查看和编辑记录。" />}
      </div>
    </>
  );
}

function AnalyticsPage({ data }) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const records = data.records.filter(r => r.date.startsWith(prefix));
  const active = data.tasks.filter(t => !t.archived);
  const done = active.filter(t => taskProgress(t, data.records).done).length;
  const streak = currentStreak(data.records);
  const byCategory = data.categories.map(c => ({ ...c, count: records.filter(r => data.tasks.find(t => t.id === r.taskId)?.categoryId === c.id).length })).filter(c => c.count);
  const max = Math.max(...byCategory.map(c => c.count), 1);
  const best = [...byCategory].sort((a,b) => b.count - a.count)[0];
  return (
    <>
      <section className="quote-card"><span>“</span><p>{best ? `这个月，你在「${best.name}」上投入最多。稳定的小步，正在变成看得见的成长。` : "完成第一次打卡后，这里会长出属于你的月度小结。"}</p></section>
      <div className="analytics-grid"><Stat value={records.length} label="本月打卡" accent /><Stat value={`${streak} 天`} label="连续打卡" /><Stat value={fmt(records.reduce((s,r) => s + Number(r.amount), 0))} label="本月完成量" /><Stat value={`${active.length ? Math.round(done / active.length * 100) : 0}%`} label="任务完成率" /></div>
      <section className="panel"><div className="section-heading"><div><p>分类投入</p><span>按本月打卡次数</span></div></div>
        <div className="bar-chart">{byCategory.length ? byCategory.map(c => <div key={c.id}><span>{c.icon} {c.name}</span><i><b style={{ width: `${c.count / max * 100}%`, background: c.color }} /></i><strong>{c.count} 次</strong></div>) : <p className="muted centered">本月还没有数据</p>}</div>
      </section>
      <section className="panel"><div className="section-heading"><div><p>近 7 天节奏</p><span>保持轻松就好</span></div></div><MiniBars records={data.records} /></section>
    </>
  );
}

function MiniBars({ records }) {
  const items = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const key = localDateKey(d);
    return { key, label: ["日","一","二","三","四","五","六"][d.getDay()], count: records.filter(r => r.date === key).length };
  });
  const max = Math.max(...items.map(x => x.count), 1);
  return <div className="mini-bars">{items.map(item => <div key={item.key}><i><b style={{ height: `${Math.max(item.count / max * 100, 8)}%` }} /></i><span>{item.label}</span></div>)}</div>;
}

function GardenPage({ data }) {
  const points = growthPoints(data.records);
  const level = Math.floor(points / 100) + 1;
  const rewards = [
    [0, "🌱", "第一株新芽"], [60, "🌼", "太阳花"], [150, "🌳", "苹果树"],
    [280, "🐦", "蓝色小鸟"], [450, "🏡", "林间小屋"], [700, "🦌", "森林朋友"]
  ];
  return (
    <>
      <section className="garden-scene">
        <div className="sun">☀</div><div className="cloud c1">☁</div><div className="cloud c2">☁</div>
        <div className="garden-items">{rewards.map(r => points >= r[0] && <span key={r[0]} title={r[2]}>{r[1]}</span>)}</div>
        <div className="ground" />
      </section>
      <section className="level-card"><div><span>花园等级</span><strong>Lv. {level}</strong></div><div className="progress"><i style={{ width: `${points % 100}%` }} /></div><p><b>{points}</b> 成长值 · 再获得 {100 - points % 100} 点升级</p></section>
      <div className="section-heading"><div><p>收藏图鉴</p><span>打卡会获得成长值</span></div></div>
      <div className="reward-grid">{rewards.map(r => <article key={r[0]} className={points >= r[0] ? "unlocked" : ""}><span>{points >= r[0] ? r[1] : "🔒"}</span><b>{r[2]}</b><small>{points >= r[0] ? "已解锁" : `${r[0]} 成长值`}</small></article>)}</div>
    </>
  );
}

function MorePage({ data, update, flash }) {
  const [categoryEditor, setCategoryEditor] = useState(false);
  const fileRef = useRef(null);
  const archived = data.tasks.filter(t => t.archived);
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `口袋花园备份-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); flash("备份文件已生成");
  };
  const importData = event => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.records) || !Array.isArray(parsed.categories)) throw new Error();
        if (confirm("导入会覆盖当前全部数据，确定继续吗？")) { update(d => Object.assign(d, parsed)); flash("备份已恢复"); }
      } catch { alert("这个文件不是有效的口袋花园备份。"); }
    };
    reader.readAsText(file); event.target.value = "";
  };
  return (
    <>
      <section className="settings-group"><h2>花园管理</h2>
        <button onClick={() => setCategoryEditor(true)}><span>🏷️</span><div><b>自定义分类</b><small>{data.categories.length} 个分类</small></div><i>›</i></button>
        <button onClick={exportData}><span>📤</span><div><b>导出备份</b><small>保存到“文件”或 iCloud Drive</small></div><i>›</i></button>
        <button onClick={() => fileRef.current?.click()}><span>📥</span><div><b>导入恢复</b><small>从 JSON 备份恢复全部数据</small></div><i>›</i></button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
      </section>
      <section className="settings-group"><h2>已归档任务</h2>
        {archived.length ? archived.map(t => <button key={t.id} onClick={() => update(d => { d.tasks.find(x => x.id === t.id).archived = false; })}><span>{t.icon}</span><div><b>{t.name}</b><small>点击移回任务清单</small></div><i>↩</i></button>) : <p className="muted settings-empty">还没有归档任务</p>}
      </section>
      <section className="privacy-card"><span>🔐</span><div><b>你的数据只属于你</b><p>任务和打卡保存在这台设备的浏览器中，不会上传到账号或服务器。建议定期导出备份。</p></div></section>
      <section className="about"><span>🌱</span><p>口袋花园 · PWA 版</p><small>把每一次坚持，种成自己的风景。</small></section>
      {categoryEditor && <CategoryEditor categories={data.categories} usedCategoryIds={new Set(data.tasks.map(t => t.categoryId))} onClose={() => setCategoryEditor(false)} onSave={categories => { update(d => d.categories = categories); setCategoryEditor(false); flash("分类已保存"); }} />}
    </>
  );
}

function CategoryEditor({ categories, usedCategoryIds, onClose, onSave }) {
  const [items, setItems] = useState(structuredClone(categories));
  const used = new Set(items.map(i => i.icon));
  return (
    <Modal title="自定义分类" onClose={onClose}>
      <p className="modal-intro">分类可以自由添加、改名和换颜色。正在被任务使用的分类不能直接删除。</p>
      <div className="category-list">{items.map((item, index) => <div key={item.id}>
        <button className="category-icon" onClick={() => { const next = ICONS.find(x => !used.has(x)) || ICONS[(ICONS.indexOf(item.icon) + 1) % ICONS.length]; setItems(a => a.map((x,i) => i === index ? { ...x, icon: next } : x)); }}>{item.icon}</button>
        <input value={item.name} onChange={e => setItems(a => a.map((x,i) => i === index ? { ...x, name: e.target.value } : x))} />
        <input className="native-color" type="color" value={item.color} onChange={e => setItems(a => a.map((x,i) => i === index ? { ...x, color: e.target.value } : x))} />
        <button className="remove" disabled={usedCategoryIds.has(item.id)} title={usedCategoryIds.has(item.id) ? "该分类正在被任务使用" : "删除分类"} onClick={() => setItems(a => a.filter((_,i) => i !== index))}>×</button>
      </div>)}</div>
      <button className="secondary full" onClick={() => setItems(a => [...a, { id: uid(), name: "新分类", icon: "🌱", color: COLORS[a.length % COLORS.length] }])}>＋ 添加分类</button>
      <button className="primary full" disabled={!items.length || items.some(i => !i.name.trim())} onClick={() => onSave(items.map(i => ({ ...i, name: i.name.trim() })))}>保存分类</button>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal"><header><button onClick={onClose}>‹</button><h2>{title}</h2><i /></header><div className="modal-body">{children}</div></section></div>;
}

function Stat({ value, label, accent }) {
  return <article className={`stat ${accent ? "accent" : ""}`}><strong>{value}</strong><span>{label}</span></article>;
}

function Empty({ icon, title, text, action }) {
  return <div className="empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action && <button className="secondary" onClick={action}>新建任务</button>}</div>;
}

function emptyTask(categories) {
  return { id: "", name: "", categoryId: categories[0]?.id || "", icon: "🌱", color: COLORS[0], type: "quantity", target: 30, unit: "次", startDate: todayKey(), endDate: "", reminder: "", note: "", archived: false, completedAt: null, createdAt: null };
}

function taskProgress(task, records) {
  const own = records.filter(r => r.taskId === task.id);
  const current = task.type === "streak" ? new Set(own.map(r => r.date)).size : own.reduce((s, r) => s + Number(r.amount), 0);
  const percent = Math.min(current / Math.max(Number(task.target), 1) * 100, 100);
  return { current, percent, done: current >= Number(task.target) };
}

function refreshCompletions(data) {
  data.tasks.forEach(task => {
    const done = taskProgress(task, data.records).done;
    if (done && !task.completedAt) task.completedAt = new Date().toISOString();
    if (!done) task.completedAt = null;
  });
}

function currentStreak(records) {
  const dates = new Set(records.map(r => r.date));
  let d = new Date(), count = 0;
  if (!dates.has(localDateKey(d))) d.setDate(d.getDate() - 1);
  while (dates.has(localDateKey(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

function growthPoints(records) {
  return records.reduce((sum, record) => sum + 10 + Math.min(20, Math.round(Number(record.amount))), 0);
}
