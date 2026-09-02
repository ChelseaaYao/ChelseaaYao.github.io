// Size Book —— 买过的衣服尺码参考（数据 assets/data/health/sizes.json，加密同 health）
// 数据格式：{ long:[长袖], tshirts:[短袖], pants:[长裤], shorts:[短裤], skirts:[半身裙], dresses:[连衣裙] }
//   条目：{ img:"closet/ 下文件名(可选)", brand, item, size,
//          各围度 cm（可只记部分）, n:"备注(可选)" }
//   long/tshirts 围度：bust 胸围 / shoulder 肩宽 / length 衣长(后中) / sleeve 袖长 / hem 下摆围 / cuff 袖口
//   pants/shorts 围度：waist 腰围 / hips 臀围 / rise 前裆 / thigh 大腿围 / hem 脚口 / inseam 内长 / length 裤长
//   skirts 围度：waist 腰围 / hips 臀围 / length 裙长 / hem 摆围
//   dresses 围度：length 裙长 / bust 胸围 / waist 腰围 / hips 臀围 / shoulder 肩宽 / sleeve 袖长
// 图片放 assets/img/closet/（注意：图片本身不加密，仅数据加密）
(function(){
  const box = document.getElementById("sizes");
  if (!box) return;

  const base = new URL("../data/health/", document.currentScript.src);
  const load = f => window.GATE
    ? window.GATE.json(new URL(`${f}.enc`, base))
    : fetch(new URL(f, base)).then(r => r.json());

  const f1 = n => (Math.round(n * 10) / 10) + "";
  const TOPK = [["length","衣长"],["bust","胸围"],["waist","腰围"],["shoulder","肩宽"],["sleeve","袖长"],["hem","下摆围"],["cuff","袖口"]];
  const BTMK = [["waist","腰围"],["hips","臀围"],["rise","前裆"],["thigh","大腿围"],["hem","脚口"],["inseam","内长"],["length","裤长"]];
  const KEYS = {
    long:    TOPK,
    tshirts: TOPK,
    pants:  BTMK,
    shorts: BTMK,
    skirts: [["waist","腰围"],["hips","臀围"],["length","裙长"],["hem","摆围"]],
    dresses: [["length","裙长"],["bust","胸围"],["waist","腰围"],["hips","臀围"],["shoulder","肩宽"],["sleeve","袖长"]],
  };

  Promise.all([load("sizes.json"), load("measurements.json").catch(() => [])])
    .then(([sz, ms]) => render(sz, ms))
    .catch(() => { box.innerHTML = '<div class="empty">Failed to load — open via the website, not file:// 👗</div>'; });

  // 分区表格：图 | 单品 | 尺码 | 各围度列 | 合身度（该分区没人记的围度列自动隐藏）
  function sectionTable(list, cat){
    const cols = KEYS[cat].filter(([k]) => list.some(e => e[k] != null));
    let h = `<div class="tbl-wrap"><table><thead><tr><th class="l" colspan="2">ITEM</th><th>SIZE</th>` +
      cols.map(([, lab]) => `<th class="m">${lab}</th>`).join("") + `</tr></thead><tbody>`;
    list.forEach(e => {
      h += `<tr>
        <td class="pc">${e.img ? `<img src="../../assets/img/closet/${e.img}" alt="" loading="lazy" onerror="this.style.display='none'">` : `<span class="noimg">${{pants:"👖",shorts:"🩳",skirts:"🎀",dresses:"👗"}[cat] || "👕"}</span>`}</td>
        <td class="l">${e.brand ? `<b>${e.brand}</b>` : ""}<div class="inm">${e.item || ""}</div>${e.n ? `<div class="nt">${e.n}</div>` : ""}</td>
        <td><span class="size">${e.size || "–"}</span></td>` +
        cols.map(([k]) => `<td class="v">${e[k] != null ? f1(e[k]) : "–"}</td>`).join("") + `</tr>`;
    });
    h += `</tbody></table></div>`;

    // 窄屏卡片版（CSS 按屏宽二选一显示）
    h += `<div class="mlist">` + list.map(e => {
      return `<div class="mit">
        <div class="ph">${e.img ? `<img src="../../assets/img/closet/${e.img}" alt="" loading="lazy" onerror="this.style.display='none'">` : `<span class="noimg">${{pants:"👖",shorts:"🩳",skirts:"🎀",dresses:"👗"}[cat] || "👕"}</span>`}</div>
        <div class="info">
          <div class="ttl">${e.brand ? `<b>${e.brand}</b>` : ""}${e.size ? `<span class="size">${e.size}</span>` : ""}</div>
          <div class="inm">${e.item || ""}</div>
          <div class="mrow">${KEYS[cat].filter(([k]) => e[k] != null)
            .map(([k, lab]) => `<span class="mk"><i>${lab}</i>${f1(e[k])}</span>`).join("")}</div>
          ${e.n ? `<div class="nt">${e.n}</div>` : ""}
        </div></div>`;
    }).join("") + `</div>`;
    return h;
  }

  function render(sz, ms){
    let html = "";

    // 我的最新围度（对照用，来自 Body Check）
    const sorted = (ms || []).slice().sort((a, b) => new Date(a.d.replace(/\./g, "/")) - new Date(b.d.replace(/\./g, "/")));
    const last = sorted[sorted.length - 1];
    if (last){
      const MK = [["bust","胸围"],["waist","腰围"],["hips","臀围"],["thigh","大腿围"],["arm","上臂围"],["calf","小腿围"]];
      html += `<div class="card"><h2>📏&ensp;My Latest<span class="gp">from Body Check · ${last.d.split(".").slice(1).join(".")}</span></h2>
        <div class="mrow my">${MK.filter(([k]) => last[k] != null)
          .map(([k, lab]) => `<span class="mk"><i>${lab}</i>${f1(last[k])} cm</span>`).join("")}</div></div>`;
    }

    [["long", "🧥&ensp;Long Sleeve"], ["tshirts", "👕&ensp;T-Shirts"],
     ["pants", "👖&ensp;Pants"], ["shorts", "🩳&ensp;Shorts"],
     ["skirts", "🎀&ensp;Skirts"], ["dresses", "👗&ensp;Dresses"]].forEach(([cat, title]) => {
      // 同品牌排在一起（品牌顺序按首次出现）
      const raw = sz[cat] || [];
      const bo = [...new Set(raw.map(e => e.brand || ""))];
      const list = raw.slice().sort((a, b) => bo.indexOf(a.brand || "") - bo.indexOf(b.brand || ""));
      html += `<div class="card"><h2>${title}<span class="gp">${list.length} items</span></h2>
        ${list.length ? sectionTable(list, cat) : '<div class="empty">Nothing here yet 🛍️</div>'}</div>`;
    });
    box.innerHTML = html;
  }

  // 图片浮窗：点缩略图放大
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `<span class="lb-x">✕</span><img alt="">`;
  document.body.appendChild(lb);
  lb.addEventListener("click", () => lb.classList.remove("on"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("on"); });
  box.addEventListener("click", e => {
    const img = e.target.closest(".ph img, td.pc img");
    if (!img) return;
    lb.querySelector("img").src = img.src;
    lb.classList.add("on");
  });
})();
