// Wellness dashboard —— 数据在 assets/data/health/（index.json + 每月一个 JSON，同 ledger 结构）
// index.json：{ unit, goal:目标体重(可空), profile:{height,age,sex},
//   period:{starts:[经期开始日]}（元素可为 "2026.1.17" 或 {d:"2026.1.17", days:4}，days 缺省 5）,
//   months:["2026-01",…] }
// 月度文件：[{ d:"2026.1.9", w:49.9, n:"备注(可选)" }]
// 更新方式：Chelsea 把新的体重/经期记录发给 Claude，追加进当月 JSON 并维护 index.json，本文件不动
(function(){
  const box = document.getElementById("health");
  if (!box) return;

  const base = new URL("../data/health/", document.currentScript.src);
  // 线上走 GATE 解密 .enc 密文；本地免密预览（无 gate.js）直接读明文 JSON
  const load = f => window.GATE
    ? window.GATE.json(new URL(`${f}.enc`, base))
    : fetch(new URL(f, base)).then(r => r.json());
  let RAW = null;
  load("index.json")
    .then(idx => Promise.all([
      Promise.all(idx.months.map(m => load(`${m}.json`))),
      load("workouts.json").catch(() => []),
    ]).then(([files, workouts]) => { RAW = { ...idx, entries: files.flat(), workouts }; render(); }))
    .catch(() => {
      box.innerHTML = '<div class="empty">Failed to load — open via the website, not file:// 🌿</div>';
    });

  // 单位开关：按斤显示（kg ×2），选择存 localStorage
  const JKEY = "well:jin";
  function render(){
    const jin = localStorage.getItem(JKEY) === "1";
    const tg = document.getElementById("jin-toggle");
    if (tg) tg.classList.toggle("on", jin);
    // BMI 和基础代谢（Mifflin-St Jeor，女性：10w + 6.25h − 5a − 161）都按 kg 原始体重算
    let bmr = null, bmi = null;
    const p = RAW.profile;
    if (p && RAW.entries.length){
      const lastW = RAW.entries.reduce((b, e) => dnum(e.d) > dnum(b.d) ? e : b).w;
      bmr = Math.round(10 * lastW + 6.25 * p.height - 5 * p.age - (p.sex === "F" ? 161 : -5));
      bmi = lastW / Math.pow(p.height / 100, 2);
    }
    init(jin
      ? { ...RAW, bmr, bmi, unit: "斤", goal: RAW.goal ? RAW.goal * 2 : RAW.goal,
          entries: RAW.entries.map(e => ({ ...e, w: e.w * 2 })) }
      : { ...RAW, bmr, bmi });
  }
  const tg = document.getElementById("jin-toggle");
  if (tg) tg.addEventListener("click", () => {
    localStorage.setItem(JKEY, localStorage.getItem(JKEY) === "1" ? "0" : "1");
    render();
  });

  const ddate = d => { const [y, m, dd] = d.split(".").map(Number); return new Date(y, m - 1, dd); };
  const dnum  = d => ddate(d).getTime();
  const dshow = d => d.split(".").slice(1).join(".");   // "2026.8.11" → "8.11"
  const WK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MN = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAY = 86400000;
  let ES_ALL = [];   // 全量记录（升序），供 rows 计算环比
  let UNIT = "kg";
  let WLOGS = [];    // 运动记录（Apple Fitness 手动同步）
  let WDAYS = {};    // 日期 → {类型: kcal}（同日按类型分开记）
  const wparts = o => Object.entries(o).map(([t, k]) => `${t === "strength" ? "🏋️" : "🏃"}${k}`);
  const f1 = n => (Math.round(n * 10) / 10).toFixed(1);
  const f2 = n => n.toFixed(2);
  const delta = (n, p = f2) => (n > 0 ? "+" : "−") + p(Math.abs(n));

  function init(DATA){
    WLOGS = DATA.workouts || [];
    WDAYS = {};
    WLOGS.forEach(w => {
      const o = WDAYS[w.d] = WDAYS[w.d] || {};
      o[w.type] = (o[w.type] || 0) + w.kcal;
    });
    const unit = DATA.unit || "kg";
    const goal = DATA.goal;
    const es = (DATA.entries || []).slice().sort((a, b) => dnum(a.d) - dnum(b.d));
    // 经期记录统一成 {d, days}，days 缺省 5
    const starts = ((DATA.period || {}).starts || [])
      .map(p => typeof p === "string" ? { d: p, days: 5 } : { d: p.d, days: p.days || 5 })
      .sort((a, b) => dnum(a.d) - dnum(b.d));
    const sdates = starts.map(s => s.d);

    if (!es.length){
      box.innerHTML = '<div class="card"><div class="empty">No data yet 🌿</div></div>';
      return;
    }

    ES_ALL = es;
    UNIT = unit;
    const last = es[es.length - 1], prev = es[es.length - 2];
    const avg30 = wavg(es, 30), avg30p = wavg(es, 30, 30);

    // 副标题：数据日期范围
    const sub = document.getElementById("sub-label");
    if (sub){
      const fd = d => { const [, m, dd] = d.split(".").map(Number); return `${MN[m]} ${dd}`; };
      const [y0] = es[0].d.split("."), [y1] = last.d.split(".");
      sub.textContent = `Weight & Cycle · ${y0 === y1 ? `${fd(es[0].d)} – ${fd(last.d)}, ${y1}` : `${fd(es[0].d)}, ${y0} – ${fd(last.d)}, ${y1}`}`;
    }

    // ── 顶部大数字 ──
    const hs = [];
    hs.push(stat("CURRENT", `${f2(last.w)}<i>${unit}</i>`, dshow(last.d)));
    if (avg30p !== null) hs.push(stat("30-DAY AVG", f2(avg30), `prev 30d ${f2(avg30p)} ( ${avg30 - avg30p <= 0 ? "⬇️" : "⬆️"} ${f2(Math.abs(avg30 - avg30p))} )`, avg30 - avg30p));
    if (goal) hs.push(stat("TO GOAL", f1(last.w - goal), `goal ${f1(goal)} ${unit}`));
    if (DATA.bmi) hs.push(stat("BMI", f1(DATA.bmi), DATA.bmi < 18.5 ? "underweight <18.5" : DATA.bmi < 24 ? "normal 18.5–24" : "over 24"));
    if (DATA.bmr) hs.push(stat("BMR", `${DATA.bmr}<i>kcal</i>`, `${DATA.profile.height}cm · ${DATA.profile.age}y`));
    document.getElementById("hs-row").innerHTML = hs.join("");

    // ── 对比行：较前一天 / 上周同日 / 上月同日（无当日记录时取往前最近一条）──
    const cmpBox = document.getElementById("cmp-row");
    if (cmpBox){
      const atOrBefore = t => { let r = null; for (const e of es){ if (dnum(e.d) <= t) r = e; else break; } return r; };
      const lastT = dnum(last.d);
      cmpBox.innerHTML = [["VS YESTERDAY", atOrBefore(lastT - DAY)],
          ["VS LAST WEEK", atOrBefore(lastT - 7 * DAY)],
          ["VS LAST MONTH", atOrBefore(lastT - 30 * DAY)]]
        .filter(([, e]) => e)
        .map(([k, e]) => {
          const df = last.w - e.w;
          return `<div class="cs"><span class="cs-v ${df <= 0 ? "good" : "bad"}">${df <= 0 ? "⬇️" : "⬆️"} ${f2(Math.abs(df))}</span>
            <span class="cs-k">${k}</span><span class="cs-sub">(${dshow(e.d)})</span></div>`;
        }).join("");
    }

    // Logs 默认选中当前月；当月还没数据就退到最近有数据的月份
    const months = monthsOf(es);
    const nw = new Date();
    const mk0 = months.includes(`${nw.getFullYear()}.${nw.getMonth() + 1}`)
      ? `${nw.getFullYear()}.${nw.getMonth() + 1}` : months[months.length - 1];

    // ── 卡片 ──
    box.innerHTML = `
      <div class="card"><h2>📉&ensp;Weight Trend
        <span class="rtabs">${["All","3M","30D"].map((t, i) => `<span class="rt${i === 1 ? " on" : ""}" data-r="${i}">${t}</span>`).join("")}</span>
      </h2><div class="chart-wrap" id="wchart"></div>
      <div class="legend"><span><i class="lw"></i>Weight</span><span><i class="lm"></i>7-pt avg</span>${starts.length ? '<span><i class="lp"></i>Period</span>' : ""}${goal ? '<span><i class="lg"></i>Goal</span>' : ""}</div></div>
      <div id="mcard">${monthCard(es, +last.d.split(".")[0])}</div>
      <div class="card"><h2>📋&ensp;Logs
        <span class="gp" id="lg-count">${es.length} entries</span>
        <span class="rtabs" style="margin-left:14px"><span class="lt on" data-p="w">Weight</span><span class="lt" data-p="k">Workouts</span></span></h2>
        <div class="mtabs">${["All", ...months].map((k, i) =>
          `<span class="mt${(i ? k : "") === mk0 ? " on" : ""}" data-m="${i ? k : ""}">${i ? MN[+k.split(".")[1]] : "All"}</span>`).join("")}</div>
        <div id="calbox"></div>
        <div class="lg-toggle" id="lg-toggle">Details ▾</div>
        <div id="lg-wrap" style="display:none">
          <div id="lg-weight"><div id="reclist"></div></div>
          <div id="lg-workout" style="display:none"></div>
        </div></div>
      ${starts.length ? periodCard(starts) : ""}`;

    // 趋势图范围切换
    const draw = r => {
      const from = r === 1 ? dnum(last.d) - 92 * DAY : r === 2 ? dnum(last.d) - 30 * DAY : -Infinity;
      const w = document.getElementById("wchart");
      w.innerHTML = chart(es.filter(e => dnum(e.d) >= from), goal, sdates);
      w.scrollLeft = w.scrollWidth;   // 移动端横滑时默认停在最新数据
    };
    draw(1);   // 默认近 3 月，全程太密
    // 其余横滑图（Cycle 时间轴）也默认滚到最右侧
    box.querySelectorAll(".chart-wrap").forEach(el => { el.scrollLeft = el.scrollWidth; });
    box.querySelectorAll(".rt").forEach(el => el.addEventListener("click", () => {
      box.querySelectorAll(".rt").forEach(x => x.classList.toggle("on", x === el));
      draw(+el.dataset.r);
    }));

    // 月均卡年份切换（数据跨年后自动多出年份标签）
    const bindYr = () => document.querySelectorAll("#mcard .yt").forEach(el =>
      el.addEventListener("click", () => {
        document.getElementById("mcard").innerHTML = monthCard(es, +el.dataset.y);
        bindYr();
      }));
    bindYr();

    // Logs 明细默认收起，点 Details 展开
    const lgt = document.getElementById("lg-toggle");
    lgt.addEventListener("click", () => {
      const w = document.getElementById("lg-wrap");
      const open = w.style.display === "none";
      w.style.display = open ? "" : "none";
      lgt.textContent = open ? "Hide details ▴" : "Details ▾";
    });

    // Logs 双开关：Weight / Workouts 各自独立点亮，亮谁显示谁，可同时显示（至少留一个）
    const ltSync = () => {
      const wOn = box.querySelector('.lt[data-p="w"]').classList.contains("on");
      const kOn = box.querySelector('.lt[data-p="k"]').classList.contains("on");
      document.getElementById("lg-weight").style.display = wOn ? "" : "none";
      document.getElementById("lg-workout").style.display = kOn ? "" : "none";
      // 月历只显示点亮项的数据（has-w=体重+经期，has-k=运动）
      const cb = document.getElementById("calbox");
      cb.classList.toggle("has-w", wOn);
      cb.classList.toggle("has-k", kOn);
      document.getElementById("lg-count").textContent =
        [wOn ? `${es.length} entries` : "", kOn ? `${WLOGS.length} workouts` : ""].filter(Boolean).join(" · ");
    };
    box.querySelectorAll(".lt").forEach(el => el.addEventListener("click", () => {
      if (el.classList.contains("on") && box.querySelectorAll(".lt.on").length === 1) return;
      el.classList.toggle("on");
      ltSync();
    }));
    ltSync();

    // 月历：所有月份竖排在一个滚动容器里，上下滑动翻月；标签和下方清单跟随滚动位置
    document.getElementById("calbox").innerHTML =
      `<div class="calgrid calweek">${["M","T","W","T","F","S","S"].map((w, i) =>
        `<div class="cw${i >= 5 ? " wk" : ""}">${w}</div>`).join("")}</div>` +
      `<div class="calscroll" id="calscroll">${months.map(mk => {
        const [yy, mm] = mk.split(".");
        return `<div class="calmonth" data-mk="${mk}"><div class="calm-h">${yy} · ${MN[+mm]}</div>${calmini(es, starts, mk)}</div>`;
      }).join("")}</div><div id="calstats">${mstats(es, mk0)}</div>`;
    const sc = document.getElementById("calscroll");
    const drawStats = mk => { document.getElementById("calstats").innerHTML = mstats(es, mk); };
    // 容器高度贴合当前月份，短月份（5 行）不留空白
    const fitCal = mk => {
      const el = sc.querySelector(`.calmonth[data-mk="${mk}"]`);
      if (el) sc.style.height = el.offsetHeight + "px";
    };

    // 记录列表月份切换：All=按月分组全列，选中某月=两个清单各自过滤
    const drawRecs = mk => {
      document.getElementById("reclist").innerHTML = mk
        ? rows(es.filter(e => e.d.startsWith(mk + ".")), starts, false)
        : rows(es, starts, true);
      document.getElementById("lg-workout").innerHTML = wrows(mk);
    };
    const setTab = mk => box.querySelectorAll(".mt").forEach(x => x.classList.toggle("on", x.dataset.m === mk));

    // 滚动月历 → 停稳后自动切到最近的月份；点标签 → 平滑滚过去（期间忽略滚动事件防打架）
    let curMk = mk0, lockUntil = 0;
    sc.addEventListener("scroll", () => {
      clearTimeout(sc._t);
      sc._t = setTimeout(() => {
        if (Date.now() < lockUntil) return;
        let best = null, bd = Infinity;
        sc.querySelectorAll(".calmonth").forEach(el => {
          const d = Math.abs(el.offsetTop - sc.scrollTop);
          if (d < bd){ bd = d; best = el; }
        });
        if (best && best.dataset.mk !== curMk){
          curMk = best.dataset.mk;
          setTab(curMk);
          drawRecs(curMk);
          drawStats(curMk);
          fitCal(curMk);
        }
      }, 120);
    });
    drawRecs(mk0);
    // 默认停在当前月
    fitCal(mk0);
    const el0 = sc.querySelector(`.calmonth[data-mk="${mk0}"]`);
    if (el0) sc.scrollTop = el0.offsetTop;
    box.querySelectorAll(".mt").forEach(el => el.addEventListener("click", () => {
      const mk = el.dataset.m;
      setTab(mk);
      drawRecs(mk);
      if (mk){
        curMk = mk;
        drawStats(mk);
        fitCal(mk);
        const t = sc.querySelector(`.calmonth[data-mk="${mk}"]`);
        if (t){ lockUntil = Date.now() + 800; sc.scrollTo({ top: t.offsetTop, behavior: "smooth" }); }
      }
    }));

    initTip();
  }

  // 悬浮提示：悬停带 data-tip 的节点显示 日期+星期+体重（只初始化一次）
  let tipReady = false;
  function initTip(){
    if (tipReady) return;
    tipReady = true;
    const tip = document.createElement("div");
    tip.className = "tip";
    document.body.appendChild(tip);
    box.addEventListener("mousemove", e => {
      let t = e.target.closest("[data-tip]");
      // 体重图内任意位置悬停：竖线 + 提示吸附到最近的数据点
      const svg = e.target.closest("svg.wchart");
      document.querySelectorAll(".xhair").forEach(l => { if (!svg || !svg.contains(l)) l.style.display = "none"; });
      if (svg && !t){
        let best = null, bd = Infinity;
        svg.querySelectorAll(".hit").forEach(c => {
          const r = c.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - e.clientX);
          if (d < bd){ bd = d; best = c; }
        });
        if (best) t = best;
      }
      if (svg && t && t.hasAttribute("cx")){
        const l = svg.querySelector(".xhair");
        if (l){
          l.setAttribute("x1", t.getAttribute("cx"));
          l.setAttribute("x2", t.getAttribute("cx"));
          l.style.display = "";
        }
      }
      if (t){
        tip.innerHTML = t.dataset.tip;   // data-tip 允许带简单标签（全部由本文件生成）
        tip.style.left = e.clientX + 14 + "px";
        tip.style.top = e.clientY + 16 + "px";
        tip.classList.add("on");
      } else tip.classList.remove("on");
    });
    box.addEventListener("mouseleave", () => {
      tip.classList.remove("on");
      document.querySelectorAll(".xhair").forEach(l => { l.style.display = "none"; });
    });
  }

  const monthsOf = es => [...new Set(es.map(e => e.d.split(".").slice(0, 2).join(".")))]
    .sort((a, b) => dnum(a + ".1") - dnum(b + ".1"));

  // 最近 days 天的平均体重；offset=再往前推的天数（用于对比前一段）
  function wavg(es, days, offset = 0){
    const end = dnum(es[es.length - 1].d) - offset * DAY;
    const sel = es.filter(e => dnum(e.d) > end - days * DAY && dnum(e.d) <= end);
    return sel.length ? sel.reduce((s, e) => s + e.w, 0) / sel.length : null;
  }

  function stat(label, num, sub, tone){
    const cls = tone === undefined ? "" : tone <= 0 ? " good" : " bad";
    return `<div class="hs"><div class="hs-label">${label}</div>
      <div class="hs-num${cls}">${num}</div><div class="hs-sub">${sub}</div></div>`;
  }

  // ── 体重折线图：x 按真实日期，叠加 7 次滑动均线、经期标记、目标虚线 ──
  function chart(es, goal, starts){
    if (es.length < 2) return '<div class="empty">Not enough data in range</div>';
    const W = 720, H = 310, L = 46, R = 16, T = 20, B = 36;
    const t0 = dnum(es[0].d), t1 = dnum(es[es.length - 1].d), span = Math.max(t1 - t0, 1);
    const ws = es.map(e => e.w).concat(goal ? [goal] : []);
    let lo = Math.min(...ws), hi = Math.max(...ws);
    const pad = Math.max((hi - lo) * 0.12, 0.3); lo -= pad; hi += pad;
    const x = t => L + (t - t0) / span * (W - L - R);
    const y = w => T + (hi - w) / (hi - lo) * (H - T - B);

    let s = "";
    for (let i = 0; i <= 4; i++){   // 横向网格
      const w = lo + (hi - lo) * i / 4, yy = y(w);
      s += `<line x1="${L}" y1="${yy}" x2="${W - R}" y2="${yy}" class="grid"/>
            <text x="${L - 7}" y="${yy + 3}" text-anchor="end" class="ax">${f1(w)}</text>`;
    }
    // x 轴：月初刻度；区间短(≤40天)则按周刻度
    const short = span <= 40 * DAY;
    for (let d = new Date(t0); d.getTime() <= t1; d.setDate(d.getDate() + 1)){
      const hit = short ? d.getDay() === 1 : d.getDate() === 1;
      if (!hit) continue;
      const xx = x(d.getTime());
      s += `<line x1="${xx}" y1="${T}" x2="${xx}" y2="${H - B}" class="grid"/>
            <text x="${xx}" y="${H - 20}" text-anchor="middle" class="ax">${short ? (d.getMonth() + 1) + "." + d.getDate() : MN[d.getMonth() + 1]}</text>`;
    }
    // 经期开始标记
    starts.filter(p => dnum(p) >= t0 && dnum(p) <= t1).forEach(p => {
      const xx = x(dnum(p));
      s += `<line x1="${xx}" y1="${T}" x2="${xx}" y2="${H - B}" class="pmark"/>
            <text x="${xx}" y="${T - 6}" text-anchor="middle" class="pflower">🌸</text>`;
    });
    // 训练日标记（贴 x 轴的绿点，悬停显示当日消耗）
    Object.keys(WDAYS).filter(d => dnum(d) >= t0 && dnum(d) <= t1).forEach(d => {
      s += `<circle cx="${x(dnum(d)).toFixed(1)}" cy="${H - B - 5}" r="3.2" class="wdot" data-tip="${dshow(d)} · ${wparts(WDAYS[d]).join(" + ")} kcal"/>`;
    });
    // 目标线
    if (goal) s += `<line x1="${L}" y1="${y(goal)}" x2="${W - R}" y2="${y(goal)}" class="goalln"/>
      <text x="${W - R}" y="${y(goal) - 5}" text-anchor="end" class="goal-lab">🎯 ${f1(goal)}</text>`;
    // 折线下方渐变面积
    const pts = es.map(e => `${x(dnum(e.d)).toFixed(1)},${y(e.w).toFixed(1)}`);
    s = `<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f28e54" stop-opacity=".28"/>
      <stop offset="100%" stop-color="#f28e54" stop-opacity="0"/></linearGradient></defs>` + s;
    s += `<polygon class="area" points="${pts.join(" ")} ${x(t1).toFixed(1)},${H - B} ${x(t0).toFixed(1)},${H - B}"/>`;
    // 7 次滑动均线（窗口=最近 7 条记录）
    const maVals = es.map((e, i) => {
      const win = es.slice(Math.max(0, i - 6), i + 1);
      return win.reduce((s, v) => s + v.w, 0) / win.length;
    });
    s += `<polyline class="ma" points="${es.map((e, i) => `${x(dnum(e.d)).toFixed(1)},${y(maVals[i]).toFixed(1)}`).join(" ")}"/>`;
    // 体重折线 + 点
    s += `<polyline class="line" points="${pts.join(" ")}"/>`;
    if (es.length <= 80) es.forEach(e => {   // 点太密时只画线，更清爽
      s += `<circle cx="${x(dnum(e.d))}" cy="${y(e.w)}" r="3" class="dot"/>`;
    });
    // 透明悬停热区（无论画不画点都能悬停出提示）：体重 + 7 点均值一起显示，箭头=与前一条记录比
    const trend = (cur, prev) => prev === undefined || cur === prev ? "" : cur > prev ? " ⬆️" : " ⬇️";
    es.forEach((e, i) => {
      s += `<circle cx="${x(dnum(e.d))}" cy="${y(e.w)}" r="8" class="hit" data-tip="${e.d.split(".").slice(1).join(".")} ${WK[ddate(e.d).getDay()]}&#10;<b class='tv'>${f2(e.w)} ${UNIT}</b>${trend(e.w, es[i - 1]?.w)}&#10;<b class='tm'>${f2(maVals[i])} ${UNIT}</b>${trend(maVals[i], maVals[i - 1])}"/>`;
    });
    s += `<line class="xhair" x1="0" x2="0" y1="${T}" y2="${H - B}" style="display:none"/>`;
    return `<svg class="chart wchart" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }

  // ── 生理周期卡：周期统计 + 每段周期条 + 下次预测 ──
  function cycleCalc(starts){
    const cyc = starts.slice(1).map((p, i) => Math.round((dnum(p.d) - dnum(starts[i].d)) / DAY));   // round 消除夏令时偏差
    const avg = cyc.reduce((s, v) => s + v, 0) / cyc.length;
    const mn = Math.min(...cyc), mx = Math.max(...cyc);
    const avgP = starts.reduce((s, v) => s + v.days, 0) / starts.length;   // 平均经期时长

    // 下次预测：上次开始日 + 平均周期
    const lastS = starts[starts.length - 1].d;
    const nxt = new Date(dnum(lastS) + Math.round(avg) * DAY);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const since = Math.round((today - ddate(lastS)) / DAY);
    const over = Math.round((today - nxt) / DAY);

    // 今天=本周期第几天；排卵日≈下次经期前 14 天，前 5 天+后 1 天为易孕窗口
    const cd = since + 1;
    const ovu = Math.round(avg) - 14;
    const phase = cd <= Math.round(avgP) ? "Period"
      : cd < ovu - 5 ? "Follicular"
      : cd <= ovu + 1 ? "Fertile"
      : cd <= Math.round(avg) ? "Luteal" : "Late";
    return { cyc, avg, mn, mx, avgP, lastS, nxt, today, since, over, cd, ovu, phase };
  }

  // 周期统计 chips（Cycle 卡片时间轴上方）
  function cycleChips(starts){
    const { avg, mn, mx, avgP, nxt, cd, phase, over } = cycleCalc(starts);
    const phc = { Period: "phP", Follicular: "phF", Fertile: "phO", Luteal: "phL", Late: "phX" }[phase];
    // 窄屏时 NEXT EST. 独占一行，补上倒计时填空（.cleft 仅移动端显示）
    const left = -over;
    const cleft = `<span class="cleft">· ${left > 0 ? `in <b>${left}</b> days` : left === 0 ? "today 🌸" : `<b>${-left}</b> days past`}</span>`;
    return `<div class="chips">${[["CYCLE DAY", "Day " + cd], ["PHASE", phase, "", phc],
        ["AVG CYCLE", f1(avg) + " days"], ["AVG PERIOD", f1(avgP) + " days"],
        ["MIN CYCLE", mn + " days"], ["MAX CYCLE", mx + " days"],
        ["NEXT EST.", `${nxt.getMonth() + 1}.${nxt.getDate()}${cleft}`, "nx"]]
      .map(([k, v, c, vc]) => `<div class="chip${c ? " " + c : ""}"><span class="ck">${k}</span><span class="cv${vc ? " " + vc : ""}">${v}</span></div>`).join("")}</div>`;
  }

  function periodCard(starts){
    const { cyc, nxt, today } = cycleCalc(starts);
    return `<div class="card"><h2>🌸&ensp;Cycle<span class="gp">${starts.length} logged</span></h2>
      ${cycleChips(starts)}
      <div class="chart-wrap">${periodTimeline(starts, cyc, nxt, today)}</div>
      <div class="legend"><span><i class="lo"></i>Fertile window</span><span><i class="lod"></i>Ovulation (est.)</span></div>
      ${starts.length > 1 ? hormoneSection(starts) : ""}</div>`;
  }

  // ── 经期时间轴：横条长度=持续天数 + 间隔天数 + 今天线 + 预测幽灵块 ──
  function periodTimeline(starts, cyc, nxt, today){
    const W = 720, H = 122, L = 14, R = 14, BY = 48, BH = 16;
    const t0 = dnum(starts[0].d) - 5 * DAY;
    const t1 = Math.max(today.getTime(), nxt.getTime() + 5 * DAY) + 6 * DAY;
    const x = t => L + (t - t0) / (t1 - t0) * (W - L - R);

    let s = "";
    // 月份网格
    for (let d = new Date(t0); d.getTime() <= t1; d.setDate(d.getDate() + 1))
      if (d.getDate() === 1){
        const xx = x(d.getTime());
        s += `<line x1="${xx}" y1="24" x2="${xx}" y2="${H - 26}" class="grid"/>
              <text x="${xx}" y="${H - 10}" text-anchor="middle" class="ax">${MN[d.getMonth() + 1]}</text>`;
      }
    // 排卵期色块：排卵日≈下段经期开始前 14 天，前 5 天+后 1 天为易孕窗口；开放周期按预测（est）
    const fertile = (ovuT, est) => {
      const od = new Date(ovuT);
      return `<rect x="${x(ovuT - 5 * DAY).toFixed(1)}" y="${BY}" width="${(x(ovuT + 2 * DAY) - x(ovuT - 5 * DAY)).toFixed(1)}" height="${BH}" rx="5" class="oblock${est ? " est" : ""}" data-tip="Fertile window${est ? " (est.)" : ""}"/>
              <rect x="${x(ovuT).toFixed(1)}" y="${BY - 3}" width="${(x(ovuT + DAY) - x(ovuT)).toFixed(1)}" height="${BH + 6}" rx="3" class="oday${est ? " est" : ""}" data-tip="Ovulation${est ? " (est.)" : ""} · ${od.getMonth() + 1}.${od.getDate()}"/>`;
    };
    starts.slice(1).forEach(p => { s += fertile(dnum(p.d) - 14 * DAY, false); });
    s += fertile(nxt.getTime() - 14 * DAY, true);

    // 经期色块 + 间隔标注
    starts.forEach((p, i) => {
      const xs = x(dnum(p.d)), xe = x(dnum(p.d) + p.days * DAY);
      s += `<rect x="${xs.toFixed(1)}" y="${BY}" width="${(xe - xs).toFixed(1)}" height="${BH}" rx="5" class="pblock" data-tip="Period · ${dshow(p.d)} · ${p.days} days"/>
            <text x="${((xs + xe) / 2).toFixed(1)}" y="${BY - 8}" text-anchor="middle" class="plab">${dshow(p.d)}</text>`;
      if (i < starts.length - 1){
        const xn = x(dnum(starts[i + 1].d));
        s += `<line x1="${xe + 2}" y1="${BY + BH / 2}" x2="${xn - 2}" y2="${BY + BH / 2}" class="cycln"/>
              <text x="${((xe + xn) / 2).toFixed(1)}" y="${BY + BH + 18}" text-anchor="middle" class="cyclab">${cyc[i]} days</text>`;
      }
    });
    // 下次预测幽灵块
    const gs = x(nxt.getTime()), ge = x(nxt.getTime() + 5 * DAY);
    s += `<rect x="${gs.toFixed(1)}" y="${BY}" width="${(ge - gs).toFixed(1)}" height="${BH}" rx="5" class="pghost" data-tip="Next est. ${nxt.getMonth() + 1}.${nxt.getDate()}"/>
          <text x="${((gs + ge) / 2).toFixed(1)}" y="${BY - 8}" text-anchor="middle" class="plab ghost">est. ${nxt.getMonth() + 1}.${nxt.getDate()}</text>`;
    // 今天参考线
    const xt = x(today.getTime());
    s += `<line x1="${xt}" y1="16" x2="${xt}" y2="${H - 26}" class="todayln"/>
          <text x="${xt}" y="12" text-anchor="middle" class="todaylab">today</text>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }

  // ── 激素变化（Cycle 卡片内小节）：教科书式典型曲线，按平均周期/经期长度缩放（示意图，非实测）──
  function hormoneSection(starts){
    const { avg, avgP, cd } = cycleCalc(starts);
    const CL = Math.round(avg), P = Math.round(avgP), ovu = CL - 14;
    const W = 720, H = 216, L = 16, R = 16, T = 26, B = 52;
    const x = d => L + d / CL * (W - L - R);
    const y = v => T + (1 - v) * (H - T - B);
    const g = (t, m, sd) => Math.exp(-((t - m) ** 2) / (2 * sd * sd));
    const midLu = ovu + (CL - ovu) / 2;   // 黄体中期（孕激素、雌激素第二峰）
    const E  = t => 0.14 + 0.72 * g(t, ovu - 1.5, 2.6) + 0.42 * g(t, midLu, 4.5);
    const LH = t => 0.10 + 0.82 * g(t, ovu - 0.5, 1.1);
    const PG = t => 0.08 + 0.74 * g(t, midLu, 4.2);
    const path = f => { const pts = []; for (let t = 0; t <= CL; t += 0.5) pts.push(`${x(t).toFixed(1)},${y(f(t)).toFixed(1)}`); return pts.join(" "); };

    const f0 = Math.max(P, ovu - 5);   // 相位分界防重叠（周期极短时兜底）
    let s = `<rect x="${x(0)}" y="${T}" width="${(x(P) - x(0)).toFixed(1)}" height="${H - T - B}" class="hbg hp"/>
      <rect x="${x(f0)}" y="${T}" width="${(x(ovu + 2) - x(f0)).toFixed(1)}" height="${H - T - B}" class="hbg ho"/>`;
    const SY = H - B + 14;
    [[0, P, "经期", "Period", "hp"], [P, f0, "卵泡期", "Follicular", "hf"],
     [f0, ovu + 2, "排卵期", "Ovulation", "ho"], [ovu + 2, CL, "黄体期", "Luteal", "hl"]].forEach(([a, b, cn, en, c]) => {
      const cx = ((x(a) + x(b)) / 2).toFixed(1);
      s += `<rect x="${x(a).toFixed(1)}" y="${SY}" width="${(x(b) - x(a)).toFixed(1)}" height="15" rx="4" class="hseg ${c}"/>
            <text x="${cx}" y="${SY + 11}" text-anchor="middle" class="hen">${en}</text>
            <text x="${cx}" y="${SY + 30}" text-anchor="middle" class="hlab">${cn}</text>`;
    });
    s += `<polyline class="hcurve hE" points="${path(E)}"/>
          <polyline class="hcurve hL" points="${path(LH)}"/>
          <polyline class="hcurve hP" points="${path(PG)}"/>`;
    if (cd <= CL){   // 超出平均周期（Late）时不画今天线
      const xt = x(cd - 0.5);
      s += `<line x1="${xt}" y1="${T - 4}" x2="${xt}" y2="${SY + 10}" class="todayln"/>
            <text x="${xt}" y="${T - 9}" text-anchor="middle" class="todaylab">today · day ${cd}</text>`;
    }
    return `<div class="hdiv"></div>
      <div class="chart-wrap"><svg class="chart nosc" viewBox="0 0 ${W} ${H}">${s}</svg></div>
      <div class="legend cen"><span><i class="hle"></i>雌激素</span><span><i class="hll"></i>黄体生成素</span><span><i class="hlp"></i>孕激素</span></div>`;
  }

  // ── 月均体重：小折线图（按年份筛选），点按环比涨跌着色，数值直接标在点上 ──
  function monthCard(all, yr){
    const years = [...new Set(all.map(e => +e.d.split(".")[0]))].sort((a, b) => a - b);
    const es = all.filter(e => +e.d.split(".")[0] === yr);
    const tabs = years.map(y => `<span class="rt yt${y === yr ? " on" : ""}" data-y="${y}">${y}</span>`).join("");
    const M = {};
    es.forEach(e => {
      const k = e.d.split(".").slice(0, 2).join(".");
      (M[k] = M[k] || []).push(e.w);
    });
    const ks = Object.keys(M).sort((a, b) => dnum(a + ".1") - dnum(b + ".1"));
    const avgs = ks.map(k => M[k].reduce((s, v) => s + v, 0) / M[k].length);

    const W = 720, H = 200, L = 58, R = 26, T = 30, B = 32;
    let lo = Math.min(...avgs), hi = Math.max(...avgs);
    const pad = Math.max((hi - lo) * 0.22, 0.15); lo -= pad; hi += pad;
    const x = i => ks.length > 1 ? L + i * (W - L - R) / (ks.length - 1) : (W + L - R) / 2;
    const y = w => T + (hi - w) / (hi - lo) * (H - T - B);

    let s = "";
    for (let i = 0; i <= 3; i++){
      const w = lo + (hi - lo) * i / 3, yy = y(w);
      s += `<line x1="${L}" y1="${yy}" x2="${W - R}" y2="${yy}" class="grid"/>
            <text x="${L - 7}" y="${yy + 3}" text-anchor="end" class="ax">${f1(w)}</text>`;
    }
    // 总平均参考线（数值放卡片标题，不占图面）+ Max/Min 月份圆环标记
    const tot = avgs.reduce((t, v) => t + v, 0) / avgs.length;
    s += `<line x1="${L}" y1="${y(tot)}" x2="${W - R}" y2="${y(tot)}" class="avgln"/>
          <text x="${W - R}" y="${y(tot) - 7}" text-anchor="end" class="avglab">avg ${f2(tot)}</text>`;
    const iMax = avgs.indexOf(Math.max(...avgs)), iMin = avgs.indexOf(Math.min(...avgs));
    if (ks.length > 1)
      s += `<circle cx="${x(iMax)}" cy="${y(avgs[iMax])}" r="7.5" class="ring max"/>
            <circle cx="${x(iMin)}" cy="${y(avgs[iMin])}" r="7.5" class="ring min"/>
            <polyline class="mline" points="${avgs.map((w, i) => `${x(i).toFixed(1)},${y(w).toFixed(1)}`).join(" ")}"/>`;
    ks.forEach((k, i) => {
      const df = i ? avgs[i] - avgs[i - 1] : null;
      const cls = df === null ? "" : df <= 0 ? " good" : " bad";
      const anchor = i === 0 ? "start" : i === ks.length - 1 ? "end" : "middle";   // 首尾错开，避免压到坐标轴
      s += `<circle cx="${x(i)}" cy="${y(avgs[i])}" r="4.5" class="mdot${cls}" data-tip="${MN[+k.split(".")[1]]} ${yr}&#10;avg <b class='tv'>${f2(avgs[i])} ${UNIT}</b>&#10;${M[k].length} logs${df === null ? "" : ` · <b class='${df <= 0 ? "tg" : "tb"}'>${delta(df)}</b>`}"/>
            <text x="${x(i)}" y="${y(avgs[i]) - 10}" text-anchor="${anchor}" class="mval${cls}${i % 2 ? " alt" : ""}">${f2(avgs[i])}</text>
            <text x="${x(i)}" y="${H - 10}" text-anchor="middle" class="mmon">${MN[+k.split(".")[1]]}</text>`;
    });
    return `<div class="card"><h2>📊&ensp;Monthly Avg
        <span class="rtabs">${tabs}</span></h2>
      <div class="chart-wrap"><svg class="chart nosc" viewBox="0 0 ${W} ${H}">${s}</svg></div></div>`;
  }

  // ── 迷你月历（参考薄荷健康）：周一开始，日期居中、体重在下，经期日期红字 ──
  function calmini(es, starts, mk){
    const [y, m] = mk.split(".").map(Number);
    const byDay = {};
    es.forEach(e => { if (e.d.startsWith(mk + ".")) byDay[+e.d.split(".")[2]] = e.w; });
    // 经期 = 开始日起持续 days 天（可跨月），本月内的日期标红
    const PS = new Set();
    starts.forEach(p => {
      const [py, pm, pd] = p.d.split(".").map(Number);
      for (let i = 0; i < p.days; i++){
        const dt = new Date(py, pm - 1, pd + i);
        if (dt.getFullYear() === y && dt.getMonth() === m - 1) PS.add(dt.getDate());
      }
    });
    const firstWd = (new Date(y, m - 1, 1).getDay() + 6) % 7;   // 周一起始
    const nDays = new Date(y, m, 0).getDate();
    const now = new Date();
    const td = now.getFullYear() === y && now.getMonth() === m - 1 ? now.getDate() : 0;
    let s = "";
    for (let i = 0; i < firstWd; i++) s += `<div class="cday"></div>`;
    for (let d = 1; d <= nDays; d++){
      const wk = WDAYS[`${y}.${m}.${d}`];
      s += `<div class="cday${d === td ? " today" : ""}${PS.has(d) ? " period" : ""}"><span class="cn">${d}</span>${
        byDay[d] !== undefined ? `<span class="dsum">${f2(byDay[d])}</span>` : ""}${
        wk ? `<span class="wsum">${wparts(wk).join(" ")}</span>` : ""}</div>`;
    }
    for (let t = firstWd + nDays; t % 7 !== 0; t++) s += `<div class="cday"></div>`;   // 补齐末行，网格线不缺角

    return `<div class="calwrap"><div class="calgrid">${s}</div></div>`;
  }

  // ── 月统计条：平均 / 最大 / 最小 / 变化（首末记录差）——固定在月历滚动区外，随当前月更新 ──
  function mstats(es, mk){
    const ws = es.filter(e => e.d.startsWith(mk + ".")).map(e => e.w);
    if (!ws.length) return "";
    const chg = ws[ws.length - 1] - ws[0];
    const mw = WLOGS.filter(w => w.d.startsWith(mk + "."));   // 当月运动
    return `<div class="mstats">
      <div class="ms"><span class="k">AVG</span><b class="hl">${f2(ws.reduce((s, v) => s + v, 0) / ws.length)}</b></div>
      <div class="ms"><span class="k">MAX</span><b>${f2(Math.max(...ws))}</b></div>
      <div class="ms"><span class="k">MIN</span><b>${f2(Math.min(...ws))}</b></div>
      <div class="ms"><span class="k">CHANGE</span><b class="${chg <= 0 ? "good" : "bad"}">${delta(chg)}</b></div>
      ${mw.length ? `<div class="ms"><span class="k">BURNED · ${mw.length}×</span><b class="wk">${mw.reduce((s, w) => s + w.kcal, 0)}<i>kcal</i></b></div>` : ""}
    </div>`;
  }

  // 某月消耗与上月同期对比（当前月按"过到第几天"截断上月，历史月全月对全月）
  function burnCmp(mk){
    const [y, m] = mk.split(".").map(Number);
    const now = new Date();
    const cutoff = (y === now.getFullYear() && m === now.getMonth() + 1) ? now.getDate() : 31;
    const pmk = m === 1 ? `${y - 1}.12` : `${y}.${m - 1}`;
    const psum = WLOGS.filter(w => w.d.startsWith(pmk + ".") && +w.d.split(".")[2] <= cutoff)
      .reduce((s, w) => s + w.kcal, 0);
    const csum = WLOGS.filter(w => w.d.startsWith(mk + ".")).reduce((s, w) => s + w.kcal, 0);
    if (!psum || !csum) return "";
    const up = csum >= psum;
    return `<span class="bcmp ${up ? "up" : "dn"}">${up ? "⬆️" : "⬇️"} ${Math.abs(csum - psum)} vs ${MN[+pmk.split(".")[1]]}</span>`;
  }

  // ── 运动清单（日期降序，按月分组，月头带小计+环比）；mk=只看某月 ──
  function wrows(mk){
    const logs = mk ? WLOGS.filter(w => w.d.startsWith(mk + ".")) : WLOGS;
    if (!logs.length) return '<div class="empty">No workouts this month 🏃</div>';
    const out = [];
    let mon = "";
    logs.slice().sort((a, b) => dnum(a.d) - dnum(b.d)).reverse().forEach(w => {
      const m = w.d.split(".").slice(0, 2).join(".");
      if (m !== mon){
        mon = m;
        const mws = WLOGS.filter(x => x.d.startsWith(m + "."));
        out.push(`<div class="mhead">${m.split(".")[0]} · ${MN[+m.split(".")[1]]}<span class="mhr">${mws.length}× · ${mws.reduce((s, x) => s + x.kcal, 0)} kcal${burnCmp(m)}</span></div>`);
      }
      const dt = ddate(w.d);
      out.push(`<div class="row"><span class="d">${dshow(w.d)}<span class="dwk">${WK[dt.getDay()]}</span></span>
        <span class="w wt">${w.type === "strength" ? "🏋️ Strength" : "🏃 Stepper"}</span>
        <span class="df wkk">${w.kcal} kcal</span></div>`);
    });
    return out.join("");
  }

  // ── 记录列表（日期降序），grouped=按月分组；经期内的日期标红 ──
  function rows(sel, starts, grouped){
    const PS = new Set();   // 经期覆盖的所有日期（开始日起 days 天）
    starts.forEach(p => {
      const [y, m, d] = p.d.split(".").map(Number);
      for (let i = 0; i < p.days; i++){
        const dt = new Date(y, m - 1, d + i);
        PS.add(`${dt.getFullYear()}.${dt.getMonth() + 1}.${dt.getDate()}`);
      }
    });
    const out = [];
    let mon = "";
    sel.slice().reverse().forEach(e => {
      const m = e.d.split(".").slice(0, 2).join(".");
      if (grouped && m !== mon){
        mon = m;
        out.push(`<div class="mhead">${m.split(".")[0]} · ${MN[+m.split(".")[1]]}</div>`);
      }
      const i = ES_ALL.indexOf(e);
      const df = i > 0 ? e.w - ES_ALL[i - 1].w : null;
      const zero = df !== null && Math.abs(df) < 0.005;
      const cls = df === null || zero ? "" : df <= 0 ? " good" : " bad";
      const dt = ddate(e.d);
      const wk = WDAYS[e.d];
      out.push(`<div class="row">
        <span class="d${PS.has(e.d) ? " pd" : ""}">${dshow(e.d)}<span class="dwk">${WK[dt.getDay()]}</span></span>
        <span class="w">${f2(e.w)}</span>
        <span class="df${cls}">${df === null ? "—" : zero ? "0.00" : delta(df)}</span>
        <span class="wq">${wk ? Object.entries(wk).map(([t, k]) =>
          t === "strength" ? `🏋️ Strength ${k}` : `🏃 Stepper ${k}`).join(" · ") : ""}</span>
        <span class="n">${e.n || ""}</span></div>`);
    });
    return out.join("");
  }
})();
