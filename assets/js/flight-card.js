// 机票卡片渲染模板（全站通用，勿放数据）
// 页面用法：先引入某个行程的数据文件（assets/js/flights/*.js，定义 FLIGHT_GROUPS），
// 再引入本文件；页面需有 <div id="flights"> 和 <b id="progress">，样式在 assets/css/flights.css
(function(){
  const box = document.getElementById("flights");
  if (!box || typeof FLIGHT_GROUPS === "undefined") return;

  // 价格日志 → 最新价 + 历史涨跌
  const fmt$ = n => n.toLocaleString("en-US",
    Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function priceBlock(prices){
    const hist = prices || [];
    const cur = hist[hist.length - 1];
    if (!cur) return "";
    let html = `<div class="pr">$${fmt$(cur.price)}<span class="on">@ ${cur.on}</span></div>`;
    if (hist.length > 1){
      html += '<div class="hist">' + hist.map((p, i) => {
        let arr = "";
        if (i > 0) arr = p.price > hist[i-1].price ? '<span class="up">↑</span>'
                       : p.price < hist[i-1].price ? '<span class="down">↓</span>' : "→";
        return `${arr}${p.on} $${fmt$(p.price)}`;
      }).join('<span class="sep">·</span>') + "</div>";
    }
    return html;
  }

  const progress = document.getElementById("progress");
  if (progress){
    const n = FLIGHT_GROUPS.length;
    progress.textContent = `${n} flight${n === 1 ? "" : "s"}`;
  }

  // perks 按「·」+emoji 拆成不可断行的小块（· 前后空格可有可无）：窄屏时整项换行，不从中间断开
  const perksHTML = perks => (perks || "")
    .split(/\s*·\s*(?=\p{Extended_Pictographic})/u)
    .map(p => `<span class="pk">${p}</span>`)
    .join('<span class="psep">·</span>');

  // 行李额面板：三栏（随身 / 手提 / 托运），数据 o.baggage = { note, items:[{icon,name,allow,size}] }
  const baggageHTML = bg => !bg ? "" :
    `<div class="bag"><div class="bag-grid">` +
      bg.items.map(it =>
        `<div class="bag-col"><div class="bic">${it.icon}</div>` +
        `<div class="bnm">${it.name}</div>` +
        `<div class="bqty">${it.allow}</div>` +
        (it.size ? `<div class="bsz">${it.size}</div>` : "") + `</div>`).join("") +
    `</div>` + (bg.note ? `<div class="bag-note">${bg.note}</div>` : "") + `</div>`;

  // 「渠道 × 时间」价格矩阵：行 = 票档/订票渠道，列 = 查价日期，每列最低价标绿
  function fareMatrix(fares){
    const dates = [];
    fares.forEach(f => (f.prices || []).forEach(p => { if (!dates.includes(p.on)) dates.push(p.on); }));
    const colMin = {};
    dates.forEach(d => {
      const vals = fares.map(f => (f.prices || []).find(p => p.on === d)).filter(Boolean).map(p => p.price);
      colMin[d] = vals.length ? Math.min(...vals) : null;
    });
    let h = '<table class="fm-tbl"><thead><tr><th>Fare / Channel</th><th class="tk">Terms</th>' +
      dates.map(d => `<th class="d">${d}</th>`).join("") + "</tr></thead><tbody>";
    fares.forEach(f => {
      h += `<tr${f.pick ? ' class="pick"' : ""}><td class="nm">${f.pick ? "⭐ " : ""}${f.name}` +
        `${f.via ? `<span class="via">（${f.via}）</span>` : ""}</td>` +
        `<td class="tk">${perksHTML(f.perks)}</td>` +
        dates.map(d => {
          const p = (f.prices || []).find(x => x.on === d);
          if (!p) return `<td class="d" data-d="${d}">–</td>`;
          const low = colMin[d] !== null && p.price <= colMin[d];
          return `<td class="d${low ? " low" : ""}" data-d="${d}">$${fmt$(p.price)}</td>`;
        }).join("") + "</tr>";
    });
    return h + "</tbody></table>";
  }
  FLIGHT_GROUPS.forEach(grp => {
    const sec = document.createElement("section");
    sec.className = "leg";
    sec.innerHTML = `<h2>${grp.route}<span class="gd">${grp.date}</span></h2>`;

    const grid = document.createElement("div");
    grid.className = "opts";
    if (grp.options.length === 0){
      grid.innerHTML = '<div class="empty">还没有候选航班</div>';
    } else {
      let lastDay = null;
      grp.options.forEach(o => {
        // 航班带 day 字段时，日期变化处插入日期小标题
        if (o.day && o.day !== lastDay){
          const dh = document.createElement("div");
          dh.className = "day-h";
          const dm = o.day.match(/^(.+?)\s+(\S+)$/);
          dh.innerHTML = `<span class="de">📆</span>&ensp;${dm ? `${dm[1]} <span class="dw">${dm[2]}</span>` : o.day}`;
          grid.appendChild(dh);
          lastDay = o.day;
        }
        const card = document.createElement("div");
        card.className = "opt" + (o.pick ? " pick" : "");

        // 时间条：结构化字段（dep/arr/机场/时长）优先，否则退回 time 字符串
        let timeHTML;
        if (o.dep){
          timeHTML =
            `<div class="tpt"><b>${o.dep}${o.depD ? `<span class="dts">（${o.depD}）</span>` : ""}</b><span class="ap">${o.depAp || ""}</span></div>` +
            `<div class="tmid"><div class="trow"><span class="tline"></span><span class="tdur">${o.dur || ""}</span><span class="tline"></span></div></div>` +
            `<div class="tpt right"><b>${o.arr}${o.arrD ? `<span class="dts">（${o.arrD}）</span>` : ""}${o.plus ? `<sup>${o.plus}</sup>` : ""}</b><span class="ap">${o.arrAp || ""}</span></div>`;
        } else {
          timeHTML = (o.time || "")
            .replace(/\(\+(\d+)\)/, '<sup>+$1</sup>')
            .replace(/\s*[–-]\s*/, '<span class="tline"></span>');
        }
        const code = o.code || (o.airline || "?").slice(0, 2).toUpperCase();

        const topHTML =
          `<div class="top">` +
            `<div class="left">` +
              (o.logo
                ? `<div class="av logo"><img src="${o.logo}" alt="${o.airline || ""}"></div>`
                : `<div class="av" style="background:${o.color || "#4a505a"}">${code}</div>`) +
              `<div class="al">${o.link
                ? `<a class="alink" href="${o.link}" target="_blank">${o.airline} <span class="ext">↗</span></a>`
                : o.airline}` +
                `${o.flight ? `<div class="fno">${o.flight}</div>` : ""}` +
                `${o.note ? `<div class="nt">${o.note}</div>` : ""}</div>` +
            `</div>` +
            `<div class="mid">` +
              `<div class="tm">${timeHTML}</div>` +
              `${(o.tags || []).length || o.stop ? `<div class="chips">` +
                `${o.stop ? `<span class="chip dur">${o.stop}</span>` : ""}` +
                `${(o.tags || []).map(t =>
                `<span class="chip${/nonstop|直飞/i.test(t) ? " dur" : ""}">${t}</span>`).join("")}` +
                `</div>` : ""}` +
            `</div>` +
            (o.prices ? `<div class="pricebox">${priceBlock(o.prices)}</div>` : "") +
          `</div>`;

        const faresHTML = o.fares ? `<div class="fares">` + o.fares.map(f =>
          `<div class="fare${f.pick ? " pick" : ""}">` +
            `<span class="fname">${f.pick ? "⭐ " : ""}${f.name}${f.via ? `<span class="via">（${f.via}）</span>` : ""}</span>` +
            `<span class="fperks">${perksHTML(f.perks)}${f.fee ? `<span class="ffee">${f.fee}</span>` : ""}</span>` +
            `<div class="fprice">${priceBlock(f.prices)}</div>` +
          `</div>`
        ).join("") + `</div>` : "";

        // 行李额面板常驻展开，不参与折叠
        const bagHTML = baggageHTML(o.baggage);
        // 有票档 → 卡片收起时只显示最低价（多档带"起"），点击展开「渠道 × 时间」价格矩阵
        if (o.fares && o.fares.length){
          const latest = o.fares
            .map(f => (f.prices || [])[(f.prices || []).length - 1])
            .filter(Boolean).map(p => p.price);
          const minHTML = latest.length
            ? `<div class="pr">$${fmt$(Math.min(...latest))}${o.fares.length > 1 ? '<span class="on">起</span>' : ""}</div>`
            : "";
          card.innerHTML = topHTML.slice(0, -6) +
            `<div class="pricebox">${minHTML}</div>` +
            `</div>` +
            `<div class="fdetail">${fareMatrix(o.fares)}<div class="fold">收起 ⬆️</div></div>` +
            bagHTML +
            (o.foot ? `<div class="foot">${o.foot}</div>` : "");
          card.classList.add("has-fares");
          // 点卡片任意处展开；只有点"收起"才合上
          card.addEventListener("click", e => {
            if (e.target.closest("a")) return;
            if (e.target.closest(".fold")){ card.classList.remove("open"); return; }
            card.classList.add("open");
          });
        } else {
          card.innerHTML = topHTML + faresHTML + bagHTML +
            (o.foot ? `<div class="foot">${o.foot}</div>` : "");
        }
        grid.appendChild(card);
      });
    }
    sec.appendChild(grid);
    box.appendChild(sec);
  });
})();
