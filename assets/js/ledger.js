// 记账本渲染器 —— 数据在 assets/data/ledger/（index.json + 每月一个 JSON，规则见 LEDGER.md）
// 更新方式：Chelsea 发新的月度表格给 Claude，解析后新增当月 JSON 并更新 index.json，本文件不动
(function(){
  const box = document.getElementById("ledger");
  if (!box) return;

  const MNAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmt = n => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const monOf = i => +i.d.split(".")[0];
  const dayOf = i => +i.d.split(".")[1];

  const base = new URL("../data/ledger/", document.currentScript.src);
  // gate 加密模式下走 GATE 解密 .enc 密文；否则直接读明文 JSON
  const load = f => window.GATE
    ? window.GATE.json(new URL(`${f}.enc`, base))
    : fetch(new URL(f, base)).then(r => r.json());
  load("index.json")
    .then(idx => Promise.all(idx.months.map(m => load(`${m}.json`)))
      .then(files => init(idx, files.flat())))
    .catch(() => {
      box.innerHTML = '<div class="empty">数据加载失败 —— 本地 file:// 打开无法读取 JSON，请通过网站访问 📒</div>';
    });

  function init(idx, ALL){
    const YEAR = idx.year, PERIOD = idx.period;
    const CAT = {};   // name → {emoji,color}
    idx.categories.forEach(c => CAT[c.name] = c);
    const months = [...new Set(ALL.map(monOf))].sort((a, b) => a - b);

    // 交易可带 card 字段（=卡 id），缺省记在第一张卡；点明细行卡名或表头 Card 可筛选
    const CARDS = idx.cards || [];
    const CARD = {}; CARDS.forEach(c => CARD[c.id] = c);
    const cardOf = i => CARD[i.card] || CARDS[0];
    let mf = 0;   // 默认 All 视图
    let catf = null;
    let cardf = null;   // 卡筛选（卡 id），只作用于明细列表
    let sortBy = "date";   // date=日期降序 amt=金额降序

    // 每月 × 分类 合计（净额，负数按 0 参与堆叠）
    let M_BY_CAT = {}, M_TOTAL = {}, AVG = 0;
    function calcMonthly(src){
      M_BY_CAT = {}; M_TOTAL = {};
      months.forEach(m => {
        const t = {};
        src.filter(i => monOf(i) === m).forEach(i => t[i.cat] = (t[i.cat] || 0) + i.a);
        M_BY_CAT[m] = t;
        M_TOTAL[m] = Object.values(t).reduce((s, v) => s + v, 0);
      });
      AVG = months.length > 1
        ? months.slice(0, -1).reduce((s, m) => s + M_TOTAL[m], 0) / (months.length - 1)
        : (M_TOTAL[months[0]] || 0);
    }

    const tabs = document.createElement("div");
    tabs.className = "mtabs";
    tabs.innerHTML = `<span class="mt${mf === 0 ? " on" : ""}" data-m="0">All</span>` +
      months.map(m => `<span class="mt${mf === m ? " on" : ""}" data-m="${m}">${MNAMES[m]}</span>`).join("");
    tabs.addEventListener("click", e => {
      const t = e.target.closest(".mt");
      if (!t) return;
      mf = +t.dataset.m;
      tabs.querySelectorAll(".mt").forEach(x => x.classList.toggle("on", x === t));
      render();
    });

    // 排除开关：Fixed Costs（房租/车保险/注册费等）、Investment ——影响所有图表和明细
    let exFixed = false, exInv = false;
    const isFixed = i => i.cat === "Fixed Costs";
    const xtabs = document.createElement("div");
    xtabs.className = "xtabs";
    xtabs.innerHTML = `<span class="xt" data-x="fixed"><i class="sw"></i>📌 excl. Fixed Costs</span>` +
      `<span class="xt" data-x="inv"><i class="sw"></i>📈 excl. Investment</span>`;
    xtabs.addEventListener("click", e => {
      const t = e.target.closest(".xt");
      if (!t) return;
      if (t.dataset.x === "fixed") exFixed = !exFixed; else exInv = !exInv;
      t.classList.toggle("on");
      render();
    });
    const hsT = document.getElementById("hs-toggles");
    if (hsT) hsT.appendChild(xtabs);   // 开关放在 Total Spending 旁边

    // 月度堆叠柱状图：柱高 = 当月总消费，分段 = 各分类（固定色），点柱子切换月份
    // 月均（不含最新的一个月，因为还没过完）
    function monthlyChart(){
      const SLOT = 88, BW = 38, TOP = 26, BOT = 22, H = 190;
      const W = months.length * SLOT + 16;
      const maxT = Math.max(...months.map(m => M_TOTAL[m]));
      let out = "";
      // 平均线（虚线）；坐标取整 +0.5 让 1px 线落在整像素上
      const ay = Math.round(TOP + H - AVG / maxT * H) + 0.5;
      out += `<line x1="10" x2="${W - 6}" y1="${ay}" y2="${ay}" class="avgline"/>` +
        `<text x="${W - 6}" y="${ay - 5}" class="avglab" text-anchor="end">avg $${Math.round(AVG).toLocaleString()}</text>`;
      months.forEach((m, mi) => {
        const x = 16 + mi * SLOT + (SLOT - BW) / 2;
        const dim = mf && mf !== m;
        // 段边界先按比例浮点累计，再取整到整像素：缝恒为 1px、底边齐平，不会半像素发虚。
        // 分段一律直角，整根柱子用一个圆角 clipPath 裁出轮廓——侧边才是一条直线，不会被段角削出波浪
        let bf = TOP + H, b = TOP + H, si = 0, bar = "";
        [...idx.categories].reverse().forEach(c => {
          const v = Math.max(0, M_BY_CAT[m][c.name] || 0);
          if (!v) return;
          bf -= Math.max(1.5, v / maxT * H);
          const t = Math.round(bf);
          const h = Math.max(1, b - t - (si++ ? 1 : 0));   // 段间 1px 缝；最底段贴基线
          bar += `<rect x="${x}" y="${b - (si > 1 ? 1 : 0) - h}" width="${BW}" height="${h}" fill="${c.color}">` +
            `<title>${MNAMES[m]} · ${c.name} ${fmt(v)}</title></rect>`;
          b = t;
        });
        const y = b;
        out += `<g class="mbar${dim ? " dim" : ""}" data-m="${m}">` +
          `<clipPath id="bc${m}"><rect x="${x}" y="${y}" width="${BW}" height="${TOP + H - y}" rx="3"/></clipPath>` +
          `<g clip-path="url(#bc${m})">${bar}</g>` +
          `<text x="${x + BW / 2}" y="${y - 7}" class="mc-total" text-anchor="middle">$${Math.round(M_TOTAL[m]).toLocaleString()}</text>` +
          `<text x="${x + BW / 2}" y="${TOP + H + 16}" class="mc-mon${mf === m ? " on" : ""}" text-anchor="middle">${MNAMES[m]}</text></g>`;
      });
      // width/height 写死 = 1:1 渲染不放大，文字和页面字号一致；手机端靠 max-width 缩小
      return `<svg width="${W}" height="${TOP + H + BOT}" viewBox="0 0 ${W} ${TOP + H + BOT}" class="mchart">${out}</svg>`;
    }

    // 环形图：每分类一片（当前范围金额降序），切片间留缝
    function donutSVG(slices, total){
      const R = 62, W = 26, C = 85;
      let a0 = -Math.PI / 2, out = "";
      slices.forEach(s => {
        const a1 = a0 + s.val / total * 2 * Math.PI;
        const g = 2 / R, s0 = a0 + g / 2, s1 = Math.max(s0 + 0.004, a1 - g / 2);
        const large = (s1 - s0) > Math.PI ? 1 : 0;
        out += `<path d="M ${C + R * Math.cos(s0)} ${C + R * Math.sin(s0)} ` +
          `A ${R} ${R} 0 ${large} 1 ${C + R * Math.cos(s1)} ${C + R * Math.sin(s1)}" ` +
          `fill="none" stroke="${s.color}" stroke-width="${W}" ` +
          `data-name="${s.name}" data-val="${s.val}"/>`;
        a0 = a1;
      });
      return `<svg viewBox="0 0 170 170" class="donut">${out}` +
        `<text x="85" y="82" class="dc-num" text-anchor="middle"></text>` +
        `<text x="85" y="99" class="dc-lab" text-anchor="middle"></text></svg>`;
    }

    function render(){
      box.innerHTML = "";
      const DATA = ALL.filter(i => !(exFixed && isFixed(i)) && !(exInv && i.cat === "Investment"));
      calcMonthly(DATA);
      const inMonth = DATA.filter(i => !mf || monOf(i) === mf);

      const byCat = {};
      inMonth.forEach(i => { byCat[i.cat] = (byCat[i.cat] || 0) + i.a; });
      // 当前范围没有消费的分类不显示（分类多了列表太长）
      const cats = idx.categories
        .map(c => ({ name: c.name, total: byCat[c.name] || 0 }))
        .filter(c => c.total !== 0)
        .sort((a, b) => b.total - a.total);

      const grand = inMonth.reduce((s, i) => s + i.a, 0);
      const maxTotal = cats.length ? cats[0].total : 1;
      // All 视图下每个分类的月均（不含最新一个月）
      const nAvg = months.length - 1;
      const avgOf = c => months.slice(0, -1).reduce((s, m) => s + (M_BY_CAT[m][c] || 0), 0) / nAvg;

      const lab = document.getElementById("hs-label"), num = document.getElementById("hs-num");
      if (lab) lab.textContent = "Total Spending · " + (mf ? `${MNAMES[mf]} ${YEAR}` : PERIOD);
      if (num) num.textContent = fmt(grand);

      const slices = cats.filter(c => c.total > 0)
        .map(c => ({ name: c.name, val: c.total, color: CAT[c.name].color }));

      // 月度趋势卡（点柱子切换月份）
      const mc = document.createElement("section");
      mc.className = "card";
      mc.innerHTML = `<h2>📈&ensp;Monthly<span class="gp">${months.length} months · avg $${Math.round(AVG).toLocaleString()}/mo (excl. latest)</span></h2>` +
        `<div class="mchart-wrap">${monthlyChart()}</div>`;
      mc.querySelectorAll(".mbar").forEach(g => {
        g.addEventListener("click", () => {
          const m = +g.dataset.m;
          mf = mf === m ? 0 : m;
          tabs.querySelectorAll(".mt").forEach(x => x.classList.toggle("on", +x.dataset.m === mf));
          render();
        });
      });
      mc.appendChild(tabs);   // 月份胶囊放在卡片底部
      box.appendChild(mc);

      // 迷你月历（选中月份时和饼图并列）：每天只显示总花费，悬停看明细
      let calHTML = "";
      if (mf){
        const days = new Date(YEAR, mf, 0).getDate();
        const first = (new Date(YEAR, mf - 1, 1).getDay() + 6) % 7;   // 周一开头
        const byDay = {};   // 月历不受分类筛选影响，始终显示全月
        inMonth.forEach(i => (byDay[dayOf(i)] = byDay[dayOf(i)] || []).push(i));
        let cells = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
          .map(w => `<div class="cw">${w}</div>`).join("");
        for (let i = 0; i < first; i++) cells += `<div class="cday pad"></div>`;
        for (let d = 1; d <= days; d++){
          const list = byDay[d] || [];
          const sum = list.reduce((s, i) => s + i.a, 0);
          cells += `<div class="cday"${list.length
              ? ` data-day="${mf}.${d}" title="${list.map(i => `${i.t} ${fmt(i.a)}`).join("&#10;")}"` : ""}>` +
            `<span class="cn">${d}</span>` +
            (list.length ? `<span class="dsum${sum < 0 ? " refund" : ""}">${fmt(sum)}</span>` : "") +
            `</div>`;
        }
        for (let i = (first + days) % 7; i && i < 7; i++) cells += `<div class="cday pad"></div>`;
        calHTML = `<div class="calmini"><div class="calhead">📅&ensp;${MNAMES[mf]} ${YEAR}</div>` +
          `<div class="calgrid">${cells}</div></div>`;
      } else {
        // All 视图：右边放商户排行榜（Top 7）
        const byT = {};
        inMonth.forEach(i => {
          const t = byT[i.t] = byT[i.t] || { sum: 0, n: 0, cat: i.cat };
          t.sum += i.a; t.n++;
        });
        const top = Object.entries(byT).sort((a, b) => b[1].sum - a[1].sum).slice(0, 6);
        const RK = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"];
        calHTML = `<div class="calmini">` +
          `<div class="tgrid">` + top.map(([name, v], i) =>
            `<div class="tcard"><span class="trk${i > 2 ? " num" : ""}">${RK[i]}</span>` +
            `<span class="tn">${name}</span>` +
            `<span class="tv" style="color:${CAT[v.cat].color}">${fmt(v.sum)}</span>` +
            `<span class="tct">${v.n} 笔</span></div>`
          ).join("") + `</div></div>`;
      }

      // 上：Category 卡（饼图 + 迷你月历并列，分类行横贯在下，行可点筛选）
      const sm = document.createElement("section");
      sm.className = "card";
      sm.innerHTML = `<h2>📊&ensp;Category<span class="gp">${fmt(grand)}</span></h2>` +
        `<div class="sumtop"><div class="dwrap">${donutSVG(slices, grand)}</div>${calHTML}</div>` +
        `<div class="srows">` +
        cats.map(c =>
          `<div class="srow${catf === c.name ? " on" : ""}" data-cat="${c.name}">` +
          `<i class="dotc" style="background:${CAT[c.name].color}"></i>` +
          `<span class="sn">${CAT[c.name].emoji}&ensp;${c.name}</span>` +
          `<span class="sbar"><i style="width:${c.total > 0 ? Math.max(2, c.total / maxTotal * 100) : 0}%;background:${CAT[c.name].color}"></i></span>` +
          (!mf && nAvg > 0 ? `<span class="sav">avg $${Math.round(avgOf(c.name)).toLocaleString()}/mo</span>` : "") +
          `<span class="sv${c.total > 0 ? "" : " zero"}"${c.total > 0 ? ` style="color:${CAT[c.name].color}"` : ""}>${fmt(c.total)}</span></div>`
        ).join("") + `</div>`;
      sm.addEventListener("click", e => {
        const r = e.target.closest(".srow");
        if (!r) return;
        catf = catf === r.dataset.cat ? null : r.dataset.cat;
        render();
      });
      box.appendChild(sm);

      const svg = sm.querySelector(".donut");
      const dnum = svg.querySelector(".dc-num"), dlab = svg.querySelector(".dc-lab");
      const setCenter = (n, v, pct) => { dnum.textContent = v; dlab.textContent = pct ? `${n} · ${pct}%` : n; };
      const reset = () => setCenter("Total", fmt(grand), 0);
      reset();
      svg.querySelectorAll("path").forEach(p => {
        p.addEventListener("mouseenter", () => {
          svg.querySelectorAll("path").forEach(x => x.classList.toggle("dim", x !== p));
          setCenter(p.dataset.name, fmt(+p.dataset.val), Math.round(p.dataset.val / grand * 100));
        });
        p.addEventListener("mouseleave", () => {
          svg.querySelectorAll("path").forEach(x => x.classList.remove("dim"));
          reset();
        });
        p.addEventListener("click", e => {
          e.stopPropagation();
          catf = catf === p.dataset.name ? null : p.dataset.name;
          render();
        });
      });

      // 下：全部明细（日期降序），行尾彩色分类标签
      const rows = inMonth
        .filter(i => !catf || i.cat === catf)
        .filter(i => !cardf || (cardOf(i) && cardOf(i).id === cardf))
        .sort((a, b) => sortBy === "amt"
          ? b.a - a.a
          : (monOf(b) - monOf(a)) || (dayOf(b) - dayOf(a)));
      const total = rows.reduce((s, i) => s + i.a, 0);
      // 选中分类时算它的月均（口径同顶部 avg：不含最新一个月，因为还没过完）
      const catAvg = catf && months.length > 1
        ? months.slice(0, -1).reduce((s, m) => s + (M_BY_CAT[m][catf] || 0), 0) / (months.length - 1)
        : 0;

      const tx = document.createElement("section");
      tx.className = "card";
      tx.innerHTML =
        `<h2>🧾&ensp;Transactions${catf ? `<span class="ft" style="color:${CAT[catf].color};border-color:${CAT[catf].color}">${CAT[catf].emoji} ${catf} ✕</span>` : ""}` +
        (cardf ? `<span class="ft ftcard">💳 ${CARD[cardf].label} ✕</span>` : "") +
        `<span class="gp"><span class="st">${sortBy === "date" ? "by date ↓" : "by amount ↓"}</span>` +
        (catf && months.length > 1 ? `<span class="dot">·</span><span style="color:${CAT[catf].color}">avg $${Math.round(catAvg).toLocaleString()}/mo</span>` : "") +
        `<span class="dot">·</span><span>${rows.length} 笔</span><span class="dot">·</span>` +
        `<span class="gt"${catf ? ` style="color:${CAT[catf].color}"` : ""}>💰 ${fmt(total)}</span></span></h2>` +
        `<div class="thead"><span class="d">Date</span><span class="it">Merchant</span>` +
        `<span class="ctag">Category</span><span class="cardn"><select class="cardsel" title="按卡筛选">` +
        `<option value="">Card ▾</option>` +
        CARDS.map(c => `<option value="${c.id}"${cardf === c.id ? " selected" : ""}>${c.label || c.name}</option>`).join("") +
        `</select></span><span class="amt">Amount</span></div>` +
        rows.map((i, idx) => {
          const nd = !idx || rows[idx - 1].d !== i.d;   // 新的一天才画分隔线、显示日期
          const wk = "周" + "日一二三四五六"[new Date(YEAR, monOf(i) - 1, dayOf(i)).getDay()];
          return `<div class="row${nd ? " nd" : ""}" data-day="${i.d}"><span class="d">${nd ? `${i.d}.${YEAR}<span class="dwk">${wk}</span>` : ""}</span>` +
            `<span class="it">${i.t}${i.n ? `<span class="tnote">${i.n}</span>` : ""}</span>` +
            `<span class="ctag" style="color:${CAT[i.cat].color}">${CAT[i.cat].emoji} ${i.cat}</span>` +
            `<span class="cardn sel" data-card="${cardOf(i) ? cardOf(i).id : ""}">${cardOf(i) ? (cardOf(i).label || cardOf(i).name) : ""}</span>` +
            `<span class="amt ${i.a < 0 ? "refund" : ""}"${i.a < 0 ? "" : ` style="color:${CAT[i.cat].color}"`}>${fmt(i.a)}</span></div>`;
        }).join("");
      const ftEl = tx.querySelector(".ft:not(.ftcard)");
      if (ftEl) ftEl.addEventListener("click", () => { catf = null; render(); });
      const ftcEl = tx.querySelector(".ftcard");
      if (ftcEl) ftcEl.addEventListener("click", () => { cardf = null; render(); });
      tx.querySelector(".st").addEventListener("click", () =>
        { sortBy = sortBy === "date" ? "amt" : "date"; render(); });
      // 表头下拉框选卡；点明细行卡名也可切换筛选
      tx.querySelector(".cardsel").addEventListener("change", e => {
        cardf = e.target.value || null;
        render();
      });
      tx.addEventListener("click", e => {
        const c = e.target.closest(".cardn.sel");
        if (!c) return;
        cardf = cardf === c.dataset.card ? null : c.dataset.card;
        render();
      });
      box.appendChild(tx);

      // 点月历某天 → 滚到明细里那一天，行高亮一下
      const grid = sm.querySelector(".calgrid");
      if (grid) grid.addEventListener("click", e => {
        const c = e.target.closest(".cday[data-day]");
        if (!c) return;
        const rows2 = tx.querySelectorAll(`.row[data-day="${c.dataset.day}"]`);
        if (!rows2.length) return;   // 该天的行被分类筛选滤掉了就不动
        rows2[0].scrollIntoView({ behavior: "smooth", block: "start" });
        rows2.forEach(r => { r.classList.remove("flash"); void r.offsetWidth; r.classList.add("flash"); });
      });
    }
    render();
  }
})();
