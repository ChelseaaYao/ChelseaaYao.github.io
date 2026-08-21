// 答谢宴 PLAN —— 按 时间 → 地点 → 策划 组织，每块下面若干小节
// 条目写法：字符串 = 未完成；完成后改成 { t:"条目", done:true }
const WEDDING_PLAN = [
  {
    title: "⏰&ensp;Time",
    color: "var(--cd)",
    venues: [
      { city:"🐼 成都", date:"12.12 – 12.13（待定）" },
      { city:"❄️ 沈阳", date:"12.20 ✅" },
    ],
    sections: [],
  },
  {
    title: "📍&ensp;Venue",
    color: "var(--bj)",
    scout: true,   // 酒店考察内容挂在这一块下面
    sections: [],
  },
  {
    title: "🎨&ensp;Planning",
    color: "var(--jp)",
    sections: [
      { name:"🎪&ensp;Decor",       items:["宴会布置", "流程安排", "花艺"] },
      { name:"📷&ensp;Photography", items:["跟拍摄影师", "摄像（optional）"] },
      { name:"👨‍👩‍👧‍👦&ensp;Guests",  items:["Guest List", "座位安排"] },
      { name:"🍽️&ensp;Catering",    items:["菜单确认", "酒水饮料"] },
    ],
  },
  {
    title: "👰&ensp;Wedding Photos",
    color: "var(--dl)",
    sections: [
      { name:"", items:["棚拍 ×2", "红底证件照 ×1"] },
    ],
  },
];

// 成都答谢宴酒店考察（2026.08）—— 数据改这里，页面自动渲染
const VENUE_SCOUT = {
  title: "🏨&ensp;成都酒店考察",
  note: "2026.08 · 12 月档期",
  medals: ["🥇", "🥈", "🥉", "4️⃣"],   // 按 hotels 顺序即排名
  hotels: [
    {
      name: "盛美利亚", rec: "⭐⭐⭐⭐⭐",
      photos: [   // 路径相对 pages/plan/wedding.html
        { src: "../../assets/img/wedding/melia-entrance.jpg",  alt: "酒店正门" },
        { src: "../../assets/img/wedding/melia-aerial.jpg",    alt: "锦城湖畔全貌" },
        { src: "../../assets/img/wedding/melia-lake.jpg",      alt: "临湖俯瞰" },
        { src: "../../assets/img/wedding/melia-courtyard.jpg", alt: "茶厅户外庭院" },
      ],
      meta: ["档次 ⭐⭐⭐⭐⭐", "价格 $$$$", "LED ✅", "停车 ⭐⭐⭐⭐⭐"],
      price: "宴席 ¥6200/桌起 · 包房 ¥800–850/间（带休息厅）",
      secs: [
        { h: "🏛️ 场地", items: ["独立宴会厅约 300㎡，容纳约 100 人 / 10 桌，层高 4.5m", "户外区 + 酒吧；私密性高，动线流畅"] },
        { h: "🌿 环境", items: ["锦城湖畔，庭院景观优美，宾客可步行至湖边"] },
        { h: "🅿️ 停车", items: ["地下停车场，宴会免费"] },
        { h: "🎁 赠送", items: ["饮料 ×4、甜品 ×100、矿泉水"] },
        { h: "🍵 茶水", items: ["单桌 ¥30/人，全员约 ¥3000；满 ¥1.5 万可不购买，不考虑"] },
      ],
      pros: ["仪式感最好", "动线设计最佳", "LED/投影设备齐全", "湖景环境加分", "庭院区域漂亮", "私密性最好"],
      cons: ["四家中价格最高"],
    },
    {
      name: "华尔道夫 Waldorf Astoria", rec: "⭐⭐⭐⭐☆",
      photos: [
        { src: "../../assets/img/wedding/waldorf-ballroom.jpg", alt: "宴会厅" },
      ],
      meta: ["档次 ⭐⭐⭐⭐⭐", "价格 $$$$$", "LED ✅", "停车 ⭐⭐⭐⭐"],
      price: "宴席 ¥5888/桌起 · 客房 ¥1500+/间",
      secs: [
        { h: "⚖️ 对比", items: ["餐标比盛美利亚低约 ¥400/桌，客房贵约 ¥700–800/间"] },
        { h: "🏛️ 纽约厅（约 200㎡）", items: ["厅狭长，容 8–10 桌；两桌并排需错开，否则过不了人", "有 LED、无舞台；吊顶偏会议风", "窗边有大承重柱；夜晚看不到双子塔"] },
        { h: "🍵 茶歇 · 机麻", items: ["茶水/机麻需另包一个厅：¥3000 含茶水 + 4 台机麻", "可摆 5–6 张茶桌，坐 20 多人"] },
        { h: "🚪 序厅动线", items: ["楼层似客房布局：两侧会议室，中间一条通道", "甜品台/拍照只能摆通道，过道不宽，仅室内灯光", "不如盛美利亚序厅宽敞明亮（有自然采光）"] },
        { h: "💄 化妆间", items: ["不保证提供化妆间"] },
        { h: "🅿️ 停车", items: ["与 in99 共用，车位充足，宴会免费；车场太大不易找位"] },
      ],
      pros: ["酒店档次最高", "品牌最好", "餐标较盛美利亚便宜约 ¥400/桌", "停车免费"],
      cons: ["客房最贵（约 ¥1500+/晚）", "厅型狭长，并排桌需错开摆放", "靠窗一面有大承重柱", "无舞台", "茶歇需另包厅：¥3000 含茶水 + 4 台机麻", "序厅过道窄、无自然采光", "不保证化妆间", "停车场太大，不易找车位"],
    },
    {
      name: "首座万豪（in99 对面）", rec: "⭐⭐⭐⭐☆",
      photos: [
        { src: "../../assets/img/wedding/marriott-ballroom.jpg", alt: "宴会厅实拍" },
      ],
      meta: ["档次 ⭐⭐⭐", "价格 $$", "LED ❌", "停车 ⭐⭐⭐"],
      price: "宴席 ¥4000/桌起 · 客房 ¥900/间",
      secs: [
        { h: "📅 档期", items: ["12 月目前全部可订；二楼宴会厅，容纳约 200–300 人"] },
        { h: "🏛️ 场地", items: ["推荐 6–8 桌，10 桌以下可包厅；舞台、背景需自行搭建"] },
        { h: "🅿️ 停车", items: ["与写字楼共用地下车库，免费 2 小时"] },
        { h: "🎁 赠送", items: ["下午茶甜点、饮料"] },
        { h: "🌿 环境", items: ["位于商业街，周边景观一般"] },
      ],
      pros: ["四家中性价比最高", "无场地费", "客房便宜（约 ¥900）", "商圈位置方便"],
      cons: ["酒店档次一般", "舞台需自行搭建", "周边景观普通", "免费停车仅 2 小时"],
    },
    {
      name: "木棉花酒店", rec: "⭐⭐⭐",
      meta: ["档次 ⭐⭐⭐⭐", "价格 $$$", "LED ❌", "停车 ⭐⭐⭐"],
      price: "宴席约 ¥53xx/桌起 · 服务费 ¥200",
      secs: [
        { h: "🏛️ 场地", items: ["位于万象城 5 楼平台，亮点是玻璃房", "赠送的化妆间是旁边酒店的客房"] },
        { h: "🍵 茶水", items: ["喝茶需单独再包一个厅"] },
        { h: "🌿 环境", items: ["位置较远，周围没什么景观"] },
        { h: "🅿️ 停车", items: ["万达附近，共用停车场"] },
        { h: "🎁 赠送", items: ["饮料", "化妆间（旁边酒店客房）"] },
      ],
      pros: ["玻璃房有亮点", "环境不错", "品牌口碑较好"],
      cons: ["无 LED", "喝茶需单独包厅", "位置较远、周围无景观", "动线一般（需绕新升降机）"],
    },
  ],
  checklist: [
    "最低起订桌数", "保底消费", "场地费", "服务费", "开瓶费", "是否可自带酒水",
    "是否可自带甜品/伴手礼", "是否赠送婚房/休息室", "是否赠送签到台", "是否赠送迎宾牌",
    "是否赠送 LED/投影/音响", "是否提供舞台", "是否提供试菜", "停车优惠政策",
    "定金比例", "退款政策", "档期保留时间", "布置限制（鲜花/背景板/气球等）",
  ],
};

// 宾客名单 —— 条目写法：字符串 = 1 人；{ name, n: 人数, note: 备注 } = 多人/带备注
const GUEST_LIST = {
  title: "👥&ensp;Guest List",
  note: "🐼 成都",   // 目前只记成都的
  groups: [
    { city: "👭 Friends", guests: [
      "王琴心", "曾莹洁", "孙兴发",
      { name: "杨潞钰", n: 2 },
      { name: "祁麟", n: 2 },
    ] },
  ],
};

(function(){
  const box = document.getElementById("plan");
  if (!box) return;

  const norm = it => typeof it === "string" ? { t: it, done: false } : it;

  // 图片浮窗：点酒店照片放大，点任意处 / ✕ / Esc 关闭
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `<span class="lb-x">✕</span><img alt="">`;
  document.body.appendChild(lb);
  lb.addEventListener("click", () => lb.classList.remove("on"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("on"); });
  box.addEventListener("click", e => {
    const img = e.target.closest(".hphotos img");
    if (!img) return;
    lb.querySelector("img").src = img.src;
    lb.classList.add("on");
  });

  WEDDING_PLAN.forEach(block => {
    const items = block.sections.flatMap(s => s.items.map(norm));
    const done = items.filter(i => i.done).length;

    const sec = document.createElement("section");
    sec.className = "block card";
    const pct = items.length ? Math.round(done / items.length * 100) : 0;
    sec.innerHTML =
      `<span class="accent" style="background:${block.color || "var(--sy)"}"></span>` +
      `<h2>${block.title}${items.length ? `<span class="gp">${done} / ${items.length} done</span>` : ""}</h2>` +
      (items.length ? `<div class="gbar"><i style="width:${pct}%;background:${block.color || "var(--sy)"}"></i></div>` : "") +
      (block.venues ? `<div class="venues">${block.venues.map(v =>
        `<span class="venue"><b>${v.city}</b> · <span class="vd${v.date.includes("待定") ? " tbd" : ""}">${v.date}</span></span>`).join("")}</div>` : "");

    if (block.sections.length){
      const grid = document.createElement("div");
      grid.className = "secs";
      block.sections.forEach(s => {
        const col = document.createElement("div");
        col.className = "sec";
        col.innerHTML =
          (s.name ? `<div class="sname">${s.name}</div>` : "") +
          s.items.map(norm).map(i =>
            `<div class="item${i.done ? " done" : ""}">${i.done ? '<span class="tick">✓</span>' : ""}${i.t}</div>`
          ).join("");
        grid.appendChild(col);
      });
      sec.appendChild(grid);
    }
    // 酒店考察内容并进"地点"块
    if (block.scout) sec.insertAdjacentHTML("beforeend", scoutHTML());
    box.appendChild(sec);
  });

  // 宾客名单卡（在所有模块下面）
  const cntOf = g => g.guests.reduce((s, p) => s + (typeof p === "string" ? 1 : (p.n || 1)), 0);
  const gl = document.createElement("section");
  gl.className = "block card";
  gl.innerHTML =
    `<span class="accent" style="background:var(--sy)"></span>` +
    `<h2>${GUEST_LIST.title}<span class="gp">${GUEST_LIST.note ? `${GUEST_LIST.note} · ` : ""}${GUEST_LIST.groups.reduce((s, g) => s + cntOf(g), 0)} 人</span></h2>` +
    GUEST_LIST.groups.map(g =>
      `<div class="ghead">${g.city}<span class="gcnt">${cntOf(g)} 人</span></div>` +
      (g.guests.length
        ? `<div class="gchips">${g.guests.map(p => {
            const o = typeof p === "string" ? { name: p } : p;
            return `<span class="gchip">${o.name}${o.n > 1 ? `<i>(${o.n})</i>` : ""}${o.note ? `<i>${o.note}</i>` : ""}</span>`;
          }).join("")}</div>`
        : `<div class="gempty">待补充</div>`)
    ).join("");
  box.appendChild(gl);

  function scoutHTML(){
    const s = VENUE_SCOUT;
    return `<div class="ckhead">${s.title}<span class="cknote">${s.note}</span></div>` +
      `<div class="hotels">` + s.hotels.map((h, hi) =>
        `<div class="hotel">` +
        `<div class="hname"><span class="hmedal">${s.medals[hi]}</span>${h.name}<span class="hrec">${h.rec}</span></div>` +
        (h.photos ? `<div class="hphotos">${h.photos.map(p =>
          `<img src="${p.src}" alt="${p.alt}" title="${p.alt}" loading="lazy">`).join("")}</div>` : "") +
        `<div class="hmeta">${h.meta.map(m => {
          const sp = m.indexOf(" ");
          const val = m.slice(sp + 1).replace(/(\$+)/, '<b class="dollars">$1</b>');
          return `<span class="mcell"><span class="ml">${m.slice(0, sp)}</span><span class="mv">${val}</span></span>`;
        }).join("")}</div>` +
        `<div class="hprice"><span class="hpico">💰</span><div class="hplines">${h.price.split(" · ").map(p => `<div>${p}</div>`).join("")}</div></div>` +
        (h.secs || []).map(s =>
          `<div class="hsh">${s.h}</div>` +
          s.items.map(it => `<div class="hkey">${it}</div>`).join("")
        ).join("") +
        (h.keys || []).map(k => `<div class="hkey">${k}</div>`).join("") +
        `<div class="hpros">${h.pros.map(p => `<span>✅ ${p}</span>`).join("")}</div>` +
        `<div class="hcons">${h.cons.map(c => `<span>❌ ${c}</span>`).join("")}</div>` +
        `</div>`).join("") +
      `</div>` +
      `<div class="ckhead">📋&ensp;To Confirm</div>` +
      `<div class="cklist">${s.checklist.map(c => `<div class="ck">□ ${c}</div>`).join("")}</div>`;
  }
})();
