"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PLANTS, PlantArt, plantById } from "./plants";

const STORAGE_KEY = "pocket-garden-data-v2";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const COLORS = ["#e9899d", "#eead84", "#e5b751", "#7aaa82", "#66a7a0", "#77a3c2", "#9a82bd", "#ca7fa5"];
const ICONS = ["🌱", "📖", "🎬", "✍️", "🎧", "🗣️", "🎓", "💻", "🧠", "🎨", "🎹", "🏃", "🧘", "💪", "🥗", "💧", "🧹", "💰", "🐾", "✨", "🌙", "☀️", "💗", "🌸"];
const MOODS = [
  { id: "sweet", name: "甜蜜", icon: "💗", color: "#ee91ad" },
  { id: "happy", name: "开心", icon: "☀️", color: "#efb84c" },
  { id: "calm", name: "平静", icon: "🌿", color: "#79a987" },
  { id: "tired", name: "疲惫", icon: "🫧", color: "#8eabc0" },
  { id: "sad", name: "难过", icon: "🌧️", color: "#7594b4" },
  { id: "anxious", name: "焦虑", icon: "🌪️", color: "#9a8db5" },
  { id: "angry", name: "生气", icon: "🔥", color: "#d76f62" },
  { id: "swing", name: "大起大落", icon: "🎢", color: "#bd7f9f" }
];
const DEFAULT_CATEGORIES = [
  { id: "reading", name: "阅读", icon: "📖", color: "#e9899d" },
  { id: "watching", name: "影视", icon: "🎬", color: "#70a7bd" },
  { id: "learning", name: "学习", icon: "🎓", color: "#9a82bd" },
  { id: "language", name: "语言", icon: "🗣️", color: "#bd7fa5" },
  { id: "health", name: "健康", icon: "🏃", color: "#79a886" },
  { id: "life", name: "生活", icon: "✨", color: "#e5b751" }
];

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const pad = value => String(value).padStart(2, "0");
const localDateKey = value => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const todayKey = () => localDateKey(new Date());
const parseLocalDate = key => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (key, amount) => {
  const date = parseLocalDate(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
};
const fmt = value => Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 1 });
const monthLabel = date => `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
const dateFromTimestamp = value => value ? localDateKey(new Date(value)) : "";

function sampleData() {
  const now = todayKey();
  const yesterday = addDays(now, -1);
  const ids = [uid(), uid(), uid()];
  return migrateData({
    version: 4,
    categories: DEFAULT_CATEGORIES,
    tasks: [
      { id: ids[0], name: "读完《小王子》", categoryId: "reading", icon: "📖", color: "#e9899d", type: "quantity", target: 120, unit: "页", startDate: now, endDate: "", reminder: "", note: "睡前读一点", archived: false, completedAt: null, createdAt: Date.now() - 3000, plantId: "sakura" },
      { id: ids[1], name: "看完一部好剧", categoryId: "watching", icon: "🎬", color: "#70a7bd", type: "quantity", target: 12, unit: "集", startDate: now, endDate: "", reminder: "", note: "", archived: false, completedAt: null, createdAt: Date.now() - 2000, plantId: "hydrangea" },
      { id: ids[2], name: "日语学习 30 天", categoryId: "language", icon: "🗣️", color: "#9a82bd", type: "streak", target: 30, unit: "天", startDate: now, endDate: addDays(now, 29), reminder: "20:00", note: "每天至少 15 分钟", archived: false, completedAt: null, createdAt: Date.now() - 1000, plantId: "star_tree" }
    ],
    records: [
      { id: uid(), taskId: ids[0], date: yesterday, amount: 12, note: "读到了狐狸出现" },
      { id: uid(), taskId: ids[2], date: now, amount: 1, note: "复习五十音" }
    ],
    moods: [],
    settings: {}
  });
}

function migrateData(source) {
  const data = structuredClone(source || {});
  data.version = 4;
  data.categories = Array.isArray(data.categories) && data.categories.length ? data.categories : DEFAULT_CATEGORIES;
  if (!data.categories.some(category => category.name === "学习")) data.categories.push(DEFAULT_CATEGORIES[2]);
  data.records = Array.isArray(data.records) ? data.records : [];
  data.moods = Array.isArray(data.moods) ? data.moods : [];
  data.tasks = (Array.isArray(data.tasks) ? data.tasks : []).map((task, index) => ({
    ...task,
    plantId: PLANTS.some(plant => plant.id === task.plantId) ? task.plantId : PLANTS[index % PLANTS.length].id,
    sortOrder: Number.isFinite(task.sortOrder) ? task.sortOrder : index,
    seriesId: task.seriesId || task.id,
    stageNumber: task.stageNumber || 1,
    archived: Boolean(task.archived),
    completedAt: task.completedAt || null
  }));
  data.settings = {
    todaySort: "manual",
    todayView: "list",
    gardenRange: "month",
    ...data.settings
  };
  refreshCompletions(data);
  return data;
}

function loadData() {
  if (typeof window === "undefined") return sampleData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateData(JSON.parse(raw)) : sampleData();
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
  const [moodDate, setMoodDate] = useState(null);
  const [completionTaskId, setCompletionTaskId] = useState(null);
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
    window.setTimeout(() => setToast(""), 2400);
  };
  const update = updater => setData(current => {
    const next = structuredClone(current);
    updater(next);
    refreshCompletions(next);
    return next;
  });
  const selectedTask = data?.tasks.find(task => task.id === selectedTaskId);
  const completionTask = data?.tasks.find(task => task.id === completionTaskId);

  const saveRecord = (task, record) => {
    const wasDone = taskProgress(task, data.records).done;
    let after;
    if (task.type === "streak") {
      const dates = new Set(data.records.filter(item => item.taskId === task.id).map(item => item.date));
      after = dates.has(record.date) ? dates.size : dates.size + 1;
    } else {
      after = taskProgress(task, data.records).current + Number(record.amount);
    }
    update(next => next.records.push(record));
    setCheckinTask(null);
    flash("打卡成功，植物又长大了一点");
    if (!wasDone && after >= Number(task.target)) setCompletionTaskId(task.id);
  };

  const quickCheckin = task => {
    if (task.type === "quantity") {
      setCheckinTask(task);
      return;
    }
    if (data.records.some(record => record.taskId === task.id && record.date === todayKey())) {
      flash("今天已经打过卡啦");
      return;
    }
    saveRecord(task, { id: uid(), taskId: task.id, date: todayKey(), amount: 1, note: "" });
  };

  const continueStage = task => {
    const newId = uid();
    let endDate = "";
    if (task.startDate && task.endDate) {
      const duration = Math.max(0, Math.round((parseLocalDate(task.endDate) - parseLocalDate(task.startDate)) / 86400000));
      endDate = addDays(todayKey(), duration);
    }
    const clone = {
      ...task,
      id: newId,
      seriesId: task.seriesId || task.id,
      continuedFromId: task.id,
      stageNumber: Number(task.stageNumber || 1) + 1,
      startDate: todayKey(),
      endDate,
      archived: false,
      completedAt: null,
      createdAt: Date.now(),
      sortOrder: Math.max(0, ...data.tasks.map(item => Number(item.sortOrder) || 0)) + 1
    };
    update(next => next.tasks.push(clone));
    setCompletionTaskId(null);
    setSelectedTaskId(newId);
    flash(`第 ${clone.stageNumber} 阶段已经开始`);
  };

  if (!data) return <div className="loading"><span>🌱</span><p>正在唤醒花园…</p></div>;

  const titles = { today: "今天，种点什么？", calendar: "打卡日历", analytics: "成长小结", garden: "我的口袋花园", more: "更多设置" };
  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div><p className="eyebrow">POCKET GARDEN</p><h1>{titles[tab]}</h1></div>
        {tab === "today" && <button className="round-button" onClick={() => setTaskEditor(emptyTask(data))} aria-label="新建任务">＋</button>}
      </header>

      {installHint && <section className="install-card"><span>📱</span><div><strong>把花园放到桌面</strong><p>点 Safari 的分享按钮，再选“添加到主屏幕”。</p></div><button onClick={() => setInstallHint(false)}>×</button></section>}

      <div className="page">
        {tab === "today" && <Today data={data} update={update} onOpen={setSelectedTaskId} onQuick={quickCheckin} onNew={() => setTaskEditor(emptyTask(data))} onMood={() => setMoodDate(todayKey())} />}
        {tab === "calendar" && <CalendarPage data={data} onEditRecord={setRecordEditor} onMood={setMoodDate} />}
        {tab === "analytics" && <AnalyticsPage data={data} />}
        {tab === "garden" && <GardenPage data={data} update={update} onOpen={setSelectedTaskId} />}
        {tab === "more" && <MorePage data={data} update={update} flash={flash} />}
      </div>

      <nav className="tabbar" aria-label="主导航">
        {[["today","⌂","今日"],["calendar","▦","日历"],["analytics","◒","分析"],["garden","♧","花园"],["more","•••","更多"]].map(item => (
          <button key={item[0]} className={tab === item[0] ? "active" : ""} onClick={() => { setTab(item[0]); setSelectedTaskId(null); }}>
            <span>{item[1]}</span><small>{item[2]}</small>
          </button>
        ))}
      </nav>

      {selectedTask && <TaskDetail task={selectedTask} data={data} onClose={() => setSelectedTaskId(null)}
        onEdit={() => setTaskEditor(selectedTask)} onCheckin={() => quickCheckin(selectedTask)} onEditRecord={setRecordEditor}
        onContinue={() => continueStage(selectedTask)}
        onArchive={() => { update(next => { const task = next.tasks.find(item => item.id === selectedTask.id); task.archived = !task.archived; }); setSelectedTaskId(null); flash(selectedTask.archived ? "已移回今日清单" : "已放入归档"); }}
        onDelete={() => { if (confirm(`确定删除“${selectedTask.name}”及它的全部记录吗？`)) { update(next => { next.tasks = next.tasks.filter(item => item.id !== selectedTask.id); next.records = next.records.filter(record => record.taskId !== selectedTask.id); }); setSelectedTaskId(null); flash("任务已删除"); } }}
      />}
      {taskEditor && <TaskEditor task={taskEditor} categories={data.categories} onClose={() => setTaskEditor(null)}
        onSave={task => { update(next => { const index = next.tasks.findIndex(item => item.id === task.id); index >= 0 ? next.tasks[index] = task : next.tasks.push(task); }); setTaskEditor(null); flash(taskEditor.createdAt ? "任务已更新" : "新种子已经种下"); }}
      />}
      {checkinTask && <CheckinEditor task={checkinTask} existing={data.records.filter(record => record.taskId === checkinTask.id)} onClose={() => setCheckinTask(null)} onSave={record => saveRecord(checkinTask, record)} />}
      {recordEditor && <RecordEditor record={recordEditor} task={data.tasks.find(task => task.id === recordEditor.taskId)} onClose={() => setRecordEditor(null)}
        onSave={record => { update(next => { const index = next.records.findIndex(item => item.id === record.id); next.records[index] = record; }); setRecordEditor(null); flash("记录已更新"); }}
        onDelete={() => { update(next => { next.records = next.records.filter(item => item.id !== recordEditor.id); }); setRecordEditor(null); flash("记录已删除"); }}
      />}
      {moodDate && <MoodEditor date={moodDate} value={data.moods.find(item => item.date === moodDate)} onClose={() => setMoodDate(null)}
        onSave={mood => { update(next => { next.moods = next.moods.filter(item => item.date !== mood.date); next.moods.push(mood); }); setMoodDate(null); flash("今天的心情已收好"); }}
        onDelete={() => { update(next => next.moods = next.moods.filter(item => item.date !== moodDate)); setMoodDate(null); flash("心情记录已删除"); }}
      />}
      {completionTask && <CompletionModal task={completionTask} onClose={() => setCompletionTaskId(null)} onContinue={() => continueStage(completionTask)}
        onArchive={() => { update(next => next.tasks.find(item => item.id === completionTask.id).archived = true); setCompletionTaskId(null); flash("成熟植物已收藏，任务已归档"); }}
      />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Today({ data, update, onOpen, onQuick, onNew, onMood }) {
  const active = data.tasks.filter(task => !task.archived);
  const tasks = sortTasks(active, data);
  const todayRecords = data.records.filter(record => record.date === todayKey());
  const todayMood = data.moods.find(item => item.date === todayKey());
  const mood = MOODS.find(item => item.id === todayMood?.mood);
  const greeting = timeGreeting();
  const moveTask = (task, direction) => update(next => {
    const ordered = next.tasks.filter(item => !item.archived).sort((a,b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex(item => item.id === task.id);
    const swap = ordered[index + direction];
    if (!swap) return;
    const currentOrder = task.sortOrder;
    next.tasks.find(item => item.id === task.id).sortOrder = swap.sortOrder;
    next.tasks.find(item => item.id === swap.id).sortOrder = currentOrder;
  });
  return (
    <>
      <section className="today-overview">
        <div className="today-greeting">
          <span>{greeting}</span>
          <h2>小步前进，也算抵达。</h2>
          <p>今天已完成 <b>{todayRecords.length}</b> 次打卡</p>
        </div>
        <button className={`today-mood ${todayMood ? "filled" : ""}`} onClick={onMood}>
          <span>{mood?.icon || "♡"}</span>
          <b>{mood?.name || "心情"}</b>
        </button>
      </section>

      <div className="task-toolbar">
        <strong>{tasks.length} 个进行中的任务</strong>
        <label><span>排序</span><select value={data.settings.todaySort} onChange={event => update(next => next.settings.todaySort = event.target.value)}>
          <option value="manual">自定义</option><option value="created">最新创建</option><option value="progress">按进度</option><option value="name">按名称</option>
        </select></label>
      </div>

      <div className="task-list dense-list">
        {tasks.length ? tasks.map(task => <TaskCard key={task.id} task={task} data={data} manual={data.settings.todaySort === "manual"} onMove={moveTask} onOpen={onOpen} onQuick={onQuick} />) :
          <Empty icon="🌷" title="这里还没有任务" text="种下第一颗任务种子吧。" action={onNew} />}
      </div>
    </>
  );
}

function TaskCard({ task, data, manual, onMove, onOpen, onQuick }) {
  const progress = taskProgress(task, data.records);
  const category = data.categories.find(item => item.id === task.categoryId);
  const checkedToday = data.records.some(record => record.taskId === task.id && record.date === todayKey());
  const disabled = progress.done || (task.type === "streak" && checkedToday);
  return (
    <article className={`task-card ${progress.done ? "done" : ""}`} style={{ "--accent": task.color }} onClick={() => onOpen(task.id)}>
      <span className="task-icon" aria-hidden="true">{task.icon}</span>
      <div className="task-main">
        <div className="task-title"><h3>{task.name}</h3><span>{progress.done ? "✓" : `${Math.round(progress.percent)}%`}</span></div>
        <div className="task-subline"><span>{category?.name || "未分类"} · 第 {task.stageNumber || 1} 阶段</span><b>{fmt(progress.current)} / {fmt(task.target)} {task.unit}</b></div>
        <div className="progress"><i style={{ width: `${progress.percent}%` }} /></div>
      </div>
      {manual && <div className="order-buttons inline"><button aria-label="上移" onClick={event => { event.stopPropagation(); onMove(task, -1); }}>↑</button><button aria-label="下移" onClick={event => { event.stopPropagation(); onMove(task, 1); }}>↓</button></div>}
      <button className={`quick-check ${checkedToday ? "checked" : ""}`} disabled={disabled} onClick={event => { event.stopPropagation(); onQuick(task); }} aria-label={task.type === "quantity" ? "填写本次进度" : "今日快速打卡"}>
        <b>{progress.done || (checkedToday && task.type === "streak") ? "✓" : task.type === "quantity" ? "＋" : "✓"}</b>
        <small>{progress.done ? "完成" : checkedToday && task.type === "streak" ? "已打卡" : task.type === "quantity" ? "记录" : "打卡"}</small>
      </button>
    </article>
  );
}

function TaskDetail({ task, data, onClose, onEdit, onCheckin, onEditRecord, onArchive, onDelete, onContinue }) {
  const progress = taskProgress(task, data.records);
  const records = data.records.filter(record => record.taskId === task.id).sort((a,b) => b.date.localeCompare(a.date));
  return (
    <Modal title="任务详情" onClose={onClose}>
      <section className="detail-hero" style={{ "--accent": task.color }}>
        <div className="detail-plant"><PlantArt id={task.plantId} stage={plantStage(progress.percent, progress.done)} /></div>
        <p>{data.categories.find(category => category.id === task.categoryId)?.name} · 第 {task.stageNumber || 1} 阶段</p>
        <h2>{task.name}</h2>{task.note && <span>{task.note}</span>}
        <div className="progress large"><i style={{ width: `${progress.percent}%` }} /></div>
        <strong>{fmt(progress.current)} / {fmt(task.target)} {task.unit} · {plantById(task.plantId).name}</strong>
      </section>
      {progress.done ? <button className="primary full celebration-button" onClick={onContinue}>🌱 开启相同的下一阶段</button> : <button className="primary full" onClick={onCheckin}>{task.type === "quantity" ? "＋ 记录一次进度" : "✓ 今天打卡"}</button>}
      <div className="detail-facts"><span><small>开始日期</small>{task.startDate}</span><span><small>结束日期</small>{task.endDate || "未设置"}</span><span><small>每日提醒</small>{task.reminder || "未设置"}</span></div>
      <div className="section-heading"><div><p>打卡记录</p><span>{records.length} 次 · 点击可修改</span></div></div>
      <div className="record-list">
        {records.map(record => <button key={record.id} onClick={() => onEditRecord(record)}><i style={{ background: task.color }}>{record.date.slice(8)}</i><span><b>{record.date}</b><small>{record.note || "完成了一次打卡"}</small></span><strong>{task.type === "quantity" ? `+${fmt(record.amount)} ${task.unit}` : "完成"}</strong></button>)}
        {!records.length && <p className="muted centered">还没有打卡记录</p>}
      </div>
      <aside className="archive-note"><b>“归档”是什么意思？</b><p>归档只是把任务从“今日”收起来，所有打卡和花园植物都会保留。完成任务不必归档；想继续时可以开启下一阶段。</p></aside>
      <div className="action-grid"><button onClick={onEdit}>✎ 编辑任务</button><button onClick={onArchive}>{task.archived ? "↩ 移出归档" : "⌁ 归档任务"}</button></div>
      <button className="danger-link" onClick={onDelete}>删除这个任务</button>
    </Modal>
  );
}

function TaskEditor({ task, categories, onClose, onSave }) {
  const isNew = !task.createdAt;
  const [form, setForm] = useState({ ...task });
  const [plantFilter, setPlantFilter] = useState("all");
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const kinds = [["all","全部"],["flower","花朵"],["tree","树木"],["bush","灌木"],["succulent","多肉"],["fantasy","幻想"]];
  const visiblePlants = plantFilter === "all" ? PLANTS : PLANTS.filter(plant => plant.kind === plantFilter || (plantFilter === "tree" && ["conifer","willow","bamboo"].includes(plant.kind)));
  const randomPlant = () => set("plantId", PLANTS[Math.floor(Math.random() * PLANTS.length)].id);
  return (
    <Modal title={isNew ? "种下新任务" : "编辑任务"} onClose={onClose}>
      <label className="field"><span>任务名称</span><input value={form.name} onChange={event => set("name", event.target.value)} placeholder="比如：读完《小王子》" /></label>
      <div className="field"><span>任务小图标（也可以直接输入自己的 Emoji）</span><div className="custom-icon-row"><input className="emoji-input" value={form.icon} onChange={event => set("icon", event.target.value.slice(0, 4))} /><div className="icon-picker">{ICONS.map(icon => <button type="button" key={icon} className={form.icon === icon ? "selected" : ""} onClick={() => set("icon", icon)}>{icon}</button>)}</div></div></div>
      <div className="field"><span>主题颜色</span><div className="color-picker">{COLORS.map(color => <button type="button" key={color} className={form.color === color ? "selected" : ""} style={{ background: color }} onClick={() => set("color", color)} />)}<input aria-label="自定义颜色" type="color" value={form.color} onChange={event => set("color", event.target.value)} /></div></div>
      <label className="field"><span>分类</span><select value={form.categoryId} onChange={event => set("categoryId", event.target.value)}>{categories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}</select></label>
      <div className="segmented"><button type="button" className={form.type === "quantity" ? "selected" : ""} onClick={() => set("type", "quantity")}>累计总量</button><button type="button" className={form.type === "streak" ? "selected" : ""} onClick={() => { set("type", "streak"); set("unit", "天"); }}>坚持天数</button></div>
      <div className="two-fields"><label className="field"><span>目标值</span><input type="number" min="1" value={form.target} onChange={event => set("target", Number(event.target.value))} /></label><label className="field"><span>单位</span><input value={form.unit} disabled={form.type === "streak"} onChange={event => set("unit", event.target.value)} /></label></div>
      <div className="two-fields"><label className="field"><span>开始日期</span><input type="date" value={form.startDate} onChange={event => set("startDate", event.target.value)} /></label><label className="field"><span>结束日期</span><input type="date" value={form.endDate} min={form.startDate} onChange={event => set("endDate", event.target.value)} /></label></div>
      <label className="field"><span>提醒时间</span><input type="time" value={form.reminder} onChange={event => set("reminder", event.target.value)} /><small>PWA 无法像原生 App 一样保证系统通知，这里会保存你的提醒计划。</small></label>
      <label className="field"><span>给自己的备注</span><textarea value={form.note} onChange={event => set("note", event.target.value)} placeholder="写下一句温柔的提醒…" /></label>

      <section className="plant-picker-section">
        <div className="picker-heading"><div><b>为任务选择一株植物</b><small>它会随着任务进度慢慢长大</small></div><button type="button" onClick={randomPlant}>✦ 帮我随机选一个</button></div>
        <div className="mini-chips">{kinds.map(([id,name]) => <button type="button" key={id} className={plantFilter === id ? "selected" : ""} onClick={() => setPlantFilter(id)}>{name}</button>)}</div>
        <div className="plant-picker">{visiblePlants.map(plant => <button type="button" key={plant.id} className={form.plantId === plant.id ? "selected" : ""} onClick={() => set("plantId", plant.id)}><PlantArt id={plant.id} stage={4} /><span>{plant.name}</span>{form.plantId === plant.id && <i>✓</i>}</button>)}</div>
      </section>
      <button className="primary full sticky-save" disabled={!form.name.trim() || Number(form.target) <= 0 || !form.plantId} onClick={() => onSave({
        ...form, name: form.name.trim(), icon: form.icon || "🌱", id: form.id || uid(), createdAt: form.createdAt || Date.now(),
        archived: Boolean(form.archived), completedAt: form.completedAt || null, sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : Date.now(),
        seriesId: form.seriesId || form.id || uid(), stageNumber: form.stageNumber || 1
      })}>{isNew ? "种下这颗任务种子" : "保存修改"}</button>
    </Modal>
  );
}

function CheckinEditor({ task, existing, onClose, onSave }) {
  const [amount, setAmount] = useState(task.type === "streak" ? "1" : "");
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState("");
  const duplicate = task.type === "streak" && existing.some(record => record.date === date);
  return (
    <Modal title="记录进度" onClose={onClose}>
      <div className="checkin-title"><div className="mini-plant"><PlantArt id={task.plantId} stage={2} /></div><div><p>{task.name}</p><small>每一次记录都值得被看见</small></div></div>
      <label className="field"><span>打卡日期</span><input type="date" max={todayKey()} value={date} onChange={event => setDate(event.target.value)} /><small>可以选择过去的日期进行补签。</small></label>
      {task.type === "quantity" ? <label className="field"><span>这次完成了多少（{task.unit}）</span><input autoFocus inputMode="decimal" className="large-input" type="number" min="0.1" step="0.1" value={amount} placeholder="请输入" onChange={event => setAmount(event.target.value)} /></label> :
        <div className={`streak-note ${duplicate ? "warning" : ""}`}>{duplicate ? "这一天已经打过卡，可以去日历中修改记录。" : "🌱 同一天只会计算为 1 个有效坚持日。"}</div>}
      <label className="field"><span>记录此刻（选填）</span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="今天有什么小小收获？" /></label>
      <button className="primary full" disabled={duplicate || Number(amount) <= 0} onClick={() => onSave({ id: uid(), taskId: task.id, date, amount: task.type === "streak" ? 1 : Number(amount), note: note.trim() })}>完成打卡</button>
    </Modal>
  );
}

function RecordEditor({ record, task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...record });
  return (
    <Modal title="编辑打卡记录" onClose={onClose}>
      <div className="checkin-title"><div className="mini-plant"><PlantArt id={task?.plantId || "peach"} stage={3} /></div><div><p>{task?.name}</p><small>修改后会自动重新计算进度</small></div></div>
      <label className="field"><span>日期</span><input type="date" max={todayKey()} value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
      {task?.type !== "streak" && <label className="field"><span>完成量（{task?.unit}）</span><input type="number" min="0.1" step="0.1" value={form.amount} onChange={event => setForm({ ...form, amount: Number(event.target.value) })} /></label>}
      <label className="field"><span>备注</span><textarea value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} /></label>
      <button className="primary full" onClick={() => onSave(form)}>保存修改</button>
      <button className="danger-link" onClick={() => confirm("确定删除这条打卡记录吗？") && onDelete()}>删除这条记录</button>
    </Modal>
  );
}

function MoodEditor({ date, value, onClose, onSave, onDelete }) {
  const [mood, setMood] = useState(value?.mood || "");
  const [note, setNote] = useState(value?.note || "");
  return (
    <Modal title={`${date} · 心情小结`} onClose={onClose}>
      <p className="mood-intro">此刻不需要“正确”的心情，只要选择最接近的一种。</p>
      <div className="mood-picker">{MOODS.map(item => <button key={item.id} className={mood === item.id ? "selected" : ""} style={{ "--mood": item.color }} onClick={() => setMood(item.id)}><span>{item.icon}</span><b>{item.name}</b></button>)}</div>
      <label className="field"><span>今天想对自己说（选填）</span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="一句话、一个瞬间，都可以…" /></label>
      <button className="primary full" disabled={!mood} onClick={() => onSave({ date, mood, note: note.trim() })}>保存今天的心情</button>
      {value && <button className="danger-link" onClick={onDelete}>删除这条心情记录</button>}
    </Modal>
  );
}

function CompletionModal({ task, onClose, onContinue, onArchive }) {
  return (
    <Modal title="一株植物成熟啦" onClose={onClose}>
      <section className="completion-card"><div className="sparkles">✦　·　✧</div><PlantArt id={task.plantId} stage={4} /><h2>{plantById(task.plantId).name}</h2><p>“{task.name}”第 {task.stageNumber || 1} 阶段已经完成。这株植物会永久留在你的花园里。</p></section>
      <button className="primary full" onClick={onContinue}>🌱 继续相同的下一阶段</button>
      <button className="secondary full" onClick={onClose}>保留任务，稍后再决定</button>
      <button className="quiet-button" onClick={onArchive}>收进归档，不再显示在今日</button>
    </Modal>
  );
}

function CalendarPage({ data, onEditRecord, onMood }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayKey());
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const counts = {};
  data.records.forEach(record => counts[record.date] = (counts[record.date] || 0) + 1);
  const monthPrefix = `${year}-${pad(month + 1)}`;
  const monthRecords = data.records.filter(record => record.date.startsWith(monthPrefix));
  const selectedRecords = data.records.filter(record => record.date === selected);
  const selectedMood = data.moods.find(item => item.date === selected);
  const move = amount => setCursor(new Date(year, month + amount, 1));
  return (
    <>
      <section className="calendar-card">
        <div className="month-switch"><button onClick={() => move(-1)}>‹</button><h2>{monthLabel(cursor)}</h2><button onClick={() => move(1)}>›</button></div>
        <div className="weekdays">{["一","二","三","四","五","六","日"].map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {Array.from({ length: blanks }).map((_,index) => <i key={`blank-${index}`} />)}
          {Array.from({ length: days }).map((_,index) => {
            const key = `${monthPrefix}-${pad(index + 1)}`;
            const count = counts[key] || 0;
            const mood = data.moods.find(item => item.date === key);
            return <button key={key} className={`${selected === key ? "selected" : ""} level-${Math.min(count,4)}`} onClick={() => setSelected(key)}><span>{index + 1}</span>{mood ? <small className="calendar-mood">{MOODS.find(item => item.id === mood.mood)?.icon}</small> : count > 0 && <small>{count}</small>}</button>;
          })}
        </div>
        <div className="legend"><span>少</span>{[0,1,2,3,4].map(level => <i key={level} className={`level-${level}`} />)}<span>多</span></div>
      </section>
      <div className="stat-row"><Stat value={monthRecords.length} label="本月打卡次数" /><Stat value={new Set(monthRecords.map(record => record.date)).size} label="活跃天数" /><Stat value={currentStreak(data.records)} label="连续天数" /></div>
      <button className={`day-mood-summary ${selectedMood ? "filled" : ""}`} onClick={() => onMood(selected)}><span>{selectedMood ? MOODS.find(item => item.id === selectedMood.mood)?.icon : "♡"}</span><div><b>{selectedMood ? `${MOODS.find(item => item.id === selectedMood.mood)?.name}的一天` : "补记这天的心情"}</b><small>{selectedMood?.note || selected}</small></div><i>›</i></button>
      <div className="section-heading"><div><p>{selected} 的记录</p><span>{selectedRecords.length} 次打卡 · 点击可修改</span></div></div>
      <div className="record-list">
        {selectedRecords.map(record => { const task = data.tasks.find(item => item.id === record.taskId); return <button key={record.id} onClick={() => onEditRecord(record)}><i style={{ background: task?.color }}>{task?.icon}</i><span><b>{task?.name || "已删除任务"}</b><small>{record.note || "完成了一次打卡"}</small></span><strong>{task?.type === "quantity" ? `+${fmt(record.amount)} ${task?.unit}` : "完成"}</strong></button>; })}
        {!selectedRecords.length && <Empty icon="☁️" title="这天很安静" text="你仍然可以补记心情，或选择其他日期。" />}
      </div>
    </>
  );
}

function AnalyticsPage({ data }) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const records = data.records.filter(record => record.date.startsWith(prefix));
  const activeDays = new Set(records.map(record => record.date)).size;
  const completed = data.tasks.filter(task => task.completedAt && dateFromTimestamp(task.completedAt).startsWith(prefix)).length;
  const activeTasks = data.tasks.filter(task => !task.archived);
  const byCategory = data.categories.map(category => ({ ...category, count: records.filter(record => data.tasks.find(task => task.id === record.taskId)?.categoryId === category.id).length })).filter(category => category.count);
  const max = Math.max(1, ...byCategory.map(category => category.count));
  const best = [...byCategory].sort((a,b) => b.count - a.count)[0];
  const moodCounts = MOODS.map(mood => ({ ...mood, count: data.moods.filter(item => item.date.startsWith(prefix) && item.mood === mood.id).length })).filter(item => item.count);
  return (
    <>
      <section className="quote-card"><span>“</span><p>{best ? `这个月，你在「${best.name}」上留下了最多足迹。${records.length} 次真实的打卡，正在长成自己的节奏。` : "完成第一次打卡后，这里会长出属于你的月度小结。"}</p></section>
      <div className="analytics-grid"><Stat value={records.length} label="本月打卡次数" accent /><Stat value={`${currentStreak(data.records)} 天`} label="当前连续" /><Stat value={activeDays} label="本月活跃天数" /><Stat value={completed} label="完成任务阶段" /></div>
      <section className="panel"><div className="section-heading"><div><p>任务完成率</p><span>当前未归档任务</span></div><b className="panel-number">{activeTasks.length ? Math.round(activeTasks.filter(task => taskProgress(task, data.records).done).length / activeTasks.length * 100) : 0}%</b></div><div className="progress large"><i style={{ width: `${activeTasks.length ? activeTasks.filter(task => taskProgress(task, data.records).done).length / activeTasks.length * 100 : 0}%` }} /></div></section>
      <section className="panel"><div className="section-heading"><div><p>分类占比</p><span>按本月打卡次数计算</span></div></div><div className="bar-chart">{byCategory.length ? byCategory.map(category => <div key={category.id}><span>{category.icon} {category.name}</span><i><b style={{ width: `${category.count / max * 100}%`, background: category.color }} /></i><strong>{category.count} 次</strong></div>) : <p className="muted centered">本月还没有数据</p>}</div></section>
      <section className="panel"><div className="section-heading"><div><p>近 7 天节奏</p><span>按打卡次数，不混合不同单位</span></div></div><MiniBars records={data.records} /></section>
      <section className="panel"><div className="section-heading"><div><p>本月心情</p><span>{data.moods.filter(item => item.date.startsWith(prefix)).length} 天有记录</span></div></div><div className="mood-summary">{moodCounts.length ? moodCounts.map(item => <div key={item.id}><span>{item.icon}</span><b>{item.name}</b><small>{item.count} 天</small></div>) : <p className="muted centered">记录心情后，这里会出现你的情绪天气。</p>}</div></section>
    </>
  );
}

function MiniBars({ records }) {
  const items = Array.from({ length: 7 }).map((_,index) => {
    const date = new Date(); date.setDate(date.getDate() - 6 + index);
    const key = localDateKey(date);
    return { key, label: ["日","一","二","三","四","五","六"][date.getDay()], count: records.filter(record => record.date === key).length };
  });
  const max = Math.max(1, ...items.map(item => item.count));
  return <div className="mini-bars">{items.map(item => <div key={item.key}><i><b style={{ height: `${item.count ? Math.max(item.count / max * 100, 12) : 0}%` }} /></i><span>{item.label}</span><small>{item.count || ""}</small></div>)}</div>;
}

function GardenPage({ data, update, onOpen }) {
  const [view, setView] = useState("garden");
  const range = data.settings.gardenRange || "month";
  const plants = tasksForRange(data, range);
  const points = growthPoints(data);
  const usedPlants = new Set(data.tasks.map(task => task.plantId));
  return (
    <>
      <div className="garden-tabs"><button className={view === "garden" ? "active" : ""} onClick={() => setView("garden")}>我的花园</button><button className={view === "catalog" ? "active" : ""} onClick={() => setView("catalog")}>植物图鉴</button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>成长档案</button></div>
      {view === "garden" && <>
        <div className="range-switch">{[["week","周"],["month","月"],["year","年"],["all","总计"]].map(([id,label]) => <button key={id} className={range === id ? "active" : ""} onClick={() => update(next => next.settings.gardenRange = id)}>{label}</button>)}</div>
        <section className="island-scene">
          <div className="garden-sky"><span>· ✦</span><i>☁</i></div>
          <div className="island-soil" /><div className="island-grass" />
          <div className="island-plants">{plants.slice(0,24).map((task,index) => {
            const progress = taskProgress(task, data.records);
            const position = gardenPosition(index, plants.length);
            return <button key={task.id} style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: Math.round(position.y) }} onClick={() => onOpen(task.id)} aria-label={`查看${task.name}`}><PlantArt id={task.plantId} stage={plantStage(progress.percent, progress.done)} /><span>{progress.done ? "成熟" : `${Math.round(progress.percent)}%`}</span></button>;
          })}</div>
          {!plants.length && <div className="garden-empty"><PlantArt id="daisy" stage={1} /><b>这段时间还没有植物</b><small>完成打卡后，幼苗会在这里出现。</small></div>}
        </section>
        <div className="garden-caption"><span>点击植物，可以查看它代表的任务</span>{plants.length > 24 && <b>另有 {plants.length - 24} 株收进档案</b>}</div>
        <section className="level-card"><div><span>花园等级</span><strong>Lv. {Math.floor(points / 100) + 1}</strong></div><div className="progress"><i style={{ width: `${points % 100}%` }} /></div><p><b>{points}</b> 成长值 · 打卡一次 +10，完成阶段 +50</p></section>
      </>}
      {view === "catalog" && <>
        <section className="catalog-summary"><div><b>{usedPlants.size}</b><span>/ {PLANTS.length} 已种植</span></div><p>所有植物都可以自由选择，也可以让花园随机替你挑一株。</p></section>
        <div className="catalog-grid">{PLANTS.map(plant => <article key={plant.id} className={usedPlants.has(plant.id) ? "discovered" : ""}><PlantArt id={plant.id} stage={4} /><b>{plant.name}</b><small>{usedPlants.has(plant.id) ? "已在花园出现" : "等待被种下"}</small></article>)}</div>
      </>}
      {view === "history" && <GardenHistory data={data} onOpen={onOpen} />}
    </>
  );
}

function GardenHistory({ data, onOpen }) {
  const completed = data.tasks.filter(task => task.completedAt).sort((a,b) => b.completedAt.localeCompare(a.completedAt));
  const series = Object.values(data.tasks.reduce((map,task) => { const key = task.seriesId || task.id; map[key] ||= []; map[key].push(task); return map; }, {})).sort((a,b) => Math.max(...b.map(item => item.createdAt)) - Math.max(...a.map(item => item.createdAt)));
  return (
    <>
      <section className="history-hero"><span>成熟植物</span><b>{completed.length}</b><small>每一株都代表一个完成的任务阶段</small></section>
      <div className="section-heading"><div><p>阶段旅程</p><span>连续开启的任务会归在一起</span></div></div>
      <div className="series-list">{series.map(items => {
        const latest = [...items].sort((a,b) => b.stageNumber - a.stageNumber)[0];
        return <button key={latest.seriesId || latest.id} onClick={() => onOpen(latest.id)}><PlantArt id={latest.plantId} stage={taskProgress(latest, data.records).done ? 4 : 3} /><span><b>{latest.name}</b><small>已开启 {items.length} 个阶段 · 完成 {items.filter(item => item.completedAt).length} 个</small></span><i>›</i></button>;
      })}{!series.length && <Empty icon="🌱" title="旅程还没开始" text="创建任务后，这里会记录每一个阶段。" />}</div>
    </>
  );
}

function MorePage({ data, update, flash }) {
  const [categoryEditor, setCategoryEditor] = useState(false);
  const fileRef = useRef(null);
  const archived = data.tasks.filter(task => task.archived);
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `口袋花园备份-${todayKey()}.json`; link.click(); URL.revokeObjectURL(link.href); flash("备份文件已生成");
  };
  const importData = event => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = migrateData(JSON.parse(reader.result));
        if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.records)) throw new Error();
        if (confirm("导入会覆盖当前全部数据，确定继续吗？")) { setTimeout(() => update(next => Object.assign(next, parsed)), 0); flash("备份已恢复"); }
      } catch { alert("这个文件不是有效的口袋花园备份。"); }
    };
    reader.readAsText(file); event.target.value = "";
  };
  return (
    <>
      <section className="settings-group"><h2>花园管理</h2>
        <button onClick={() => setCategoryEditor(true)}><span>🏷️</span><div><b>自定义分类</b><small>{data.categories.length} 个分类，可自定义名称和图标</small></div><i>›</i></button>
        <button onClick={exportData}><span>📤</span><div><b>导出备份</b><small>保存到“文件”或 iCloud Drive</small></div><i>›</i></button>
        <button onClick={() => fileRef.current?.click()}><span>📥</span><div><b>导入恢复</b><small>从 JSON 备份恢复全部数据</small></div><i>›</i></button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
      </section>
      <section className="settings-group archive-group"><h2>已归档任务</h2><p className="group-explain">归档不是“完成”。它只是把暂时不想看到的任务收起来，记录和植物都会保留。</p>
        {archived.length ? archived.map(task => <button key={task.id} onClick={() => update(next => next.tasks.find(item => item.id === task.id).archived = false)}><span>{task.icon}</span><div><b>{task.name}</b><small>{task.completedAt ? "已完成 · 点击移回今日" : "进行中 · 点击移回今日"}</small></div><i>↩</i></button>) : <p className="muted settings-empty">还没有归档任务</p>}
      </section>
      <section className="privacy-card"><span>🔐</span><div><b>你的数据只属于你</b><p>任务、心情和打卡保存在这台设备的浏览器中，不会上传到账号或服务器。建议定期导出备份。</p></div></section>
      <section className="about"><span>🌱</span><p>口袋花园 · PWA 版</p><small>把每一次坚持，种成自己的风景。</small></section>
      {categoryEditor && <CategoryEditor categories={data.categories} usedCategoryIds={new Set(data.tasks.map(task => task.categoryId))} onClose={() => setCategoryEditor(false)} onSave={categories => { update(next => next.categories = categories); setCategoryEditor(false); flash("分类已保存"); }} />}
    </>
  );
}

function CategoryEditor({ categories, usedCategoryIds, onClose, onSave }) {
  const [items, setItems] = useState(structuredClone(categories));
  return (
    <Modal title="自定义分类" onClose={onClose}>
      <p className="modal-intro">分类可以自由添加、改名、换颜色和输入任意 Emoji。正在被任务使用的分类不能直接删除。</p>
      <div className="category-list">{items.map((item,index) => <div key={item.id}>
        <input className="category-icon-input" value={item.icon} onChange={event => setItems(current => current.map((entry,i) => i === index ? { ...entry, icon: event.target.value.slice(0,4) } : entry))} />
        <input value={item.name} onChange={event => setItems(current => current.map((entry,i) => i === index ? { ...entry, name: event.target.value } : entry))} />
        <input className="native-color" type="color" value={item.color} onChange={event => setItems(current => current.map((entry,i) => i === index ? { ...entry, color: event.target.value } : entry))} />
        <button className="remove" disabled={usedCategoryIds.has(item.id)} title={usedCategoryIds.has(item.id) ? "该分类正在被任务使用" : "删除分类"} onClick={() => setItems(current => current.filter((_,i) => i !== index))}>×</button>
      </div>)}</div>
      <button className="secondary full" onClick={() => setItems(current => [...current, { id: uid(), name: "新分类", icon: "🌱", color: COLORS[current.length % COLORS.length] }])}>＋ 添加分类</button>
      <button className="primary full" disabled={!items.length || items.some(item => !item.name.trim())} onClick={() => onSave(items.map(item => ({ ...item, name: item.name.trim(), icon: item.icon || "🌱" })))}>保存分类</button>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, []);
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="modal"><header><button onClick={onClose}>‹</button><h2>{title}</h2><i /></header><div className="modal-body">{children}</div></section></div>;
}

function Stat({ value, label, accent }) {
  return <article className={`stat ${accent ? "accent" : ""}`}><strong>{value}</strong><span>{label}</span></article>;
}

function Empty({ icon, title, text, action }) {
  return <div className="empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action && <button className="secondary" onClick={action}>新建任务</button>}</div>;
}

function emptyTask(data) {
  return {
    id: "", name: "", categoryId: data.categories[0]?.id || "", icon: "🌱", color: COLORS[0], type: "quantity", target: 30, unit: "次",
    startDate: todayKey(), endDate: "", reminder: "", note: "", archived: false, completedAt: null, createdAt: null,
    plantId: PLANTS[Math.floor(Math.random() * PLANTS.length)].id, sortOrder: Math.max(0, ...data.tasks.map(task => Number(task.sortOrder) || 0)) + 1, seriesId: "", stageNumber: 1
  };
}

function taskProgress(task, records) {
  const own = records.filter(record => record.taskId === task.id);
  const current = task.type === "streak" ? new Set(own.map(record => record.date)).size : own.reduce((sum,record) => sum + Number(record.amount), 0);
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
  const dates = new Set(records.map(record => record.date));
  let date = new Date(), count = 0;
  if (!dates.has(localDateKey(date))) date.setDate(date.getDate() - 1);
  while (dates.has(localDateKey(date))) { count++; date.setDate(date.getDate() - 1); }
  return count;
}

function growthPoints(data) {
  return data.records.length * 10 + data.tasks.filter(task => task.completedAt).length * 50;
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "夜深了，辛苦啦";
  if (hour < 11) return "早上好";
  if (hour < 13) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 23) return "晚上好";
  return "夜深了，早点休息";
}

function plantStage(percent, done) {
  if (done) return 4;
  if (percent <= 0) return 0;
  if (percent < 25) return 1;
  if (percent < 60) return 2;
  return 3;
}

function sortTasks(tasks, data) {
  const sort = data.settings.todaySort;
  const copy = [...tasks];
  if (sort === "created") return copy.sort((a,b) => b.createdAt - a.createdAt);
  if (sort === "progress") return copy.sort((a,b) => taskProgress(b, data.records).percent - taskProgress(a, data.records).percent);
  if (sort === "name") return copy.sort((a,b) => a.name.localeCompare(b.name, "zh-CN"));
  return copy.sort((a,b) => a.sortOrder - b.sortOrder);
}

function tasksForRange(data, range) {
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setHours(0,0,0,0); startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return data.tasks.filter(task => {
    if (range === "all") return true;
    const ownDates = data.records.filter(record => record.taskId === task.id).map(record => parseLocalDate(record.date));
    const marker = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
    const dates = [...ownDates, marker];
    if (range === "week") return dates.some(date => date >= startOfWeek);
    if (range === "month") return dates.some(date => date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth());
    return dates.some(date => date.getFullYear() === now.getFullYear());
  });
}

function gardenPosition(index, total) {
  const columns = 5;
  const row = Math.floor(index / columns);
  const column = index % columns;
  const x = 17 + column * 16 + (row % 2 ? 7 : 0);
  const y = 25 + row * 12 + Math.abs(column - 2) * 4;
  return { x: Math.min(86, x), y: Math.min(74, y) };
}
