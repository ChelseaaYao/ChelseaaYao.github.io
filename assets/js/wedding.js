// 答谢宴 PLAN —— 按 时间 → 地点 → 策划 组织，每块下面若干小节
// 条目写法：字符串 = 未完成；完成后改成 { t:"条目", done:true }
const WEDDING_PLAN = [
  {
    title: "⏰&ensp;Time",
    color: "var(--cd)",
    venues: [
      { city:"🐼 成都", date:"12.12 ✅" },
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
    pscout: true,   // 策划考察内容挂在这一块下面
    sections: [],
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
      name: "盛美利亚", rec: "⭐⭐⭐⭐⭐", chosen: true,
      photos: [   // 路径相对 pages/plan/wedding.html
        { src: "../../assets/img/wedding/melia-entrance.jpg",  alt: "酒店正门" },
        { src: "../../assets/img/wedding/melia-aerial.jpg",    alt: "锦城湖畔全貌" },
        { src: "../../assets/img/wedding/melia-lake.jpg",      alt: "临湖俯瞰" },
        { src: "../../assets/img/wedding/melia-courtyard.jpg", alt: "茶厅户外庭院" },
      ],
      meta: ["档次 ⭐⭐⭐⭐⭐", "价格 $$$$$", "LED ✅", "停车 ⭐⭐⭐⭐⭐"],
      price: "宴席 ¥6200/桌起 · 包房 ¥800–850/间（带休息厅）",
      secs: [
        { h: "🏛️ 场地", items: ["独立宴会厅约 300㎡，容纳约 100 人 / 10 桌，层高 4.5m", "户外区 + 酒吧；私密性高，动线流畅"] },
        { h: "🌿 环境", items: ["锦城湖畔，庭院景观优美，宾客可步行至湖边"] },
        { h: "🅿️ 停车", items: ["地下停车场，宴会免费"] },
        { h: "🎁 赠送", items: ["饮料 ×4、甜品 ×100、矿泉水"] },
        { h: "🍵 茶水", items: ["单桌 ¥30/人，全员约 ¥3000；满 ¥1.5 万可不购买，不考虑"] },
      ],
      pros: ["仪式感最好", "动线设计最佳", "LED/投影设备齐全", "湖景环境加分", "庭院区域漂亮", "私密性最好"],
      cons: ["宴席价格最高（比华尔道夫贵约 ¥400/桌）"],
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
  ],
};

// 成都答谢宴策划考察 —— 结构同 VENUE_SCOUT，往 hotels 里加条目即可（chosen:true = 标红已定）
const PLANNER_SCOUT = {
  cls: "cols3",   // 三张卡并排
  medals: ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"],
  // 三家横向对比（明确说过的事实；未提到=未明确）
  compare: {
    head: ["对比项", "木朵拉｜康康", "一次心派对｜孙孙", "Winnie Wed｜文颖"],
    rows: [
      ["🧭 来源", "华尔道夫推荐", "酒店推荐", "自己联系"],
      ["🎯 定位", "婚礼策划/定制布置", "婚礼/派对布置，比较灵活", "婚礼工作室，全案型"],
      ["🎨 定制依据", "预算 + 要求 + 场地尺寸", "喜欢的风格 + 场地 + 预算", "喜好 + 色系 + 风格 + 预算 + 场地"],
      ["🏨 酒店经验", "熟悉华尔道夫，有晚宴案例", "熟悉酒店，了解屏幕等现场条件", "熟悉木棉花，经常去，有实际案例"],
      ["📍 场地经验", "未明确", "未明确", "未明确"],
      ["👥 设计团队", "未明确", "未明确", "2 名设计师"],
      ["✍️ 设计是否外包", "未明确", "未明确", "明确不外包，自己设计/画图"],
      ["💸 设计费", "未知", "未知", "不收"],
      ["💼 服务费", "未知", "未知", "不收"],
      ["👷 人工", "未明确", "包含", "包含"],
      ["📦 物料", "未明确", "包含", "包含在布置方案中"],
      ["💐 花艺", "未明确", "未明确具体范围", "包含所需花艺，含手捧/胸花等"],
      ["🚚 运输", "未明确", "包含", "婚礼当天实报实销"],
      ["🔧 搭建", "未明确", "布置服务中", "包含"],
      ["💡 灯光音响", "未明确", "未明确", "按需配置"],
      ["📋 婚礼/活动统筹", "未明确", "未明确", "明确包含"],
      ["🏃 当天执行", "未明确", "有现场布置人工", "明确全程执行"],
      ["⏰ 时间规划", "未明确", "未明确", "包含"],
      ["🧩 人员分工", "未明确", "未明确", "包含"],
      ["🖌️ VI/纸品设计", "未明确", "未明确", "包含：桌卡、纸品、细节卡片等"],
      ["📷 摄影/摄像", "未明确", "可提供合作资源，另收费", "可推荐，也可以自己找"],
      ["🎤 主持", "未明确", "可提供合作资源，另收费", "可推荐，也可自己找"],
      ["🎸 乐队", "未明确", "可提供，另收费", "未明确"],
      ["💄 化妆/婚纱", "未明确", "未明确", "可以推荐"],
      ["🎁 伴手礼", "未明确", "明确不做", "婚礼物资可以协助/推荐"],
      ["🔍 报价透明度", "⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
    ],
  },
  hotels: [
    {
      name: "木朵拉派对（康康）", rec: "",
      meta: ["来源 华尔道夫推荐", "报价 待询", "案例 晚宴 ✅", "场地 不限"],
      price: "报价待出 · 按预算 + 场地尺寸定制",
      secs: [
        { h: "💬 要点", items: [
          "哪个场地都能做",
          "有晚宴案例（PDF 可再要）",
        ] },
      ],
      pros: ["酒店渠道推荐", "按预算定制"],
      cons: ["报价还没出"],
    },
    {
      name: "一次心派对（孙孙）", rec: "",
      meta: ["来源 酒店推荐", "报价 几千–几万", "伴手礼 ❌", "场地 可推荐"],
      price: "一个区域 ¥4000–7000 · 两个区域约 ¥15000（可按预算定制）",
      secs: [
        { h: "💬 要点", items: [
          "布置含人工/物料/运输，可推荐场地",
          "甜品/摄影/摄像/主持/乐队有固定合作，另收费",
          "主厅 + 序厅 = 两个区域；舞台可搭屏幕下方，重点放合影区更省",
        ] },
      ],
      pros: ["报价范围明确", "配套资源全"],
      cons: ["伴手礼不做"],
    },
    {
      name: "Winnie Wed（文颖）", rec: "",
      meta: ["报价 ¥1.5万起", "定金 ¥2000", "设计/服务费 无", "外包 无"],
      price: "婚礼 ¥1.5 万起 · 无设计费/服务费，钱都在布置上",
      secs: [
        { h: "💬 要点", items: [
          "两名设计师定制，不外包，当天全程在场",
          "布置 + 花艺 + 灯光 + VI + 统筹督导全包",
          "喜欢的案例：木棉花二周年场约 ¥2.1 万",
          "付款分四步：档期定金 ¥2000；效果图确认签协议时付 50%；婚礼前一周付 40%；当天结束付尾款 10% + 运费实报",
          "建议：选层高稍高、门口外场宽敞的厅",
        ] },
      ],
      pros: ["定制不外包", "统筹督导全包", "无设计费/服务费"],
      cons: ["起步价 ¥1.5 万（答谢宴待确认）"],
    },
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
    // 酒店考察并进"地点"块，策划考察并进"策划"块
    if (block.scout) sec.insertAdjacentHTML("beforeend", scoutHTML(VENUE_SCOUT));
    if (block.pscout) sec.insertAdjacentHTML("beforeend", scoutHTML(PLANNER_SCOUT));
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

  function scoutHTML(s){
    const head = s.title ? `<div class="ckhead">${s.title}<span class="cknote">${s.note}</span></div>` : "";
    if (!s.hotels.length) return `${head}<div class="gempty">待考察 📝</div>`;
    const cmp = s.compare ? `<div class="ctabw"><table class="ctab"><thead><tr>${
      s.compare.head.map((h, i) => `<th>${i ? `<span class="cchip">${h}</span>` : h}</th>`).join("")}</tr></thead><tbody>${
      s.compare.rows.map(r => `<tr><td class="ci">${r[0]}</td>${
        r.slice(1).map(v => `<td class="${/^(未明确|未知)/.test(v) ? "mut" : ""}${/[★⭐]/.test(v) ? " star" : ""}">${v}</td>`).join("")}</tr>`).join("")
      }</tbody></table></div>` : "";
    return head + cmp +
      `<div class="hotels${s.cls ? " " + s.cls : ""}">` + s.hotels.map((h, hi) =>
        `<div class="hotel${h.chosen ? " chosen" : ""}">` +
        `<div class="hname"><span class="hmedal">${s.medals[hi]}</span>${h.name}${h.chosen ? '<span class="hpick">🥂 BOOKED</span>' : ""}<span class="hrec">${h.rec}</span></div>` +
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
      (s.checklist ? `<div class="ckhead">📋&ensp;To Confirm</div>` +
        `<div class="cklist">${s.checklist.map(c => `<div class="ck">□ ${c}</div>`).join("")}</div>` : "");
  }
})();
