// Size Book —— 买过的衣服尺码参考（数据 assets/data/health/sizes.json，加密同 health）
// 数据格式：{ tops:[条目], bottoms:[条目] }
//   条目：{ img:"closet/ 下文件名(可选)", brand, item, size, fit:"ok|loose|tight",
//          各围度 cm（可只记部分）, n:"备注(可选)" }
//   tops 围度：bust 胸围 / shoulder 肩宽 / length 衣长(后中) / sleeve 袖长 / hem 下摆围 / cuff 袖口
//   bottoms 围度：waist 腰围 / hips 臀围 / rise 前裆 / thigh 大腿围 / inseam 内长 / length 裤长
// 图片放 assets/img/closet/（注意：图片本身不加密，仅数据加密）
(function(){
  const box = document.getElementById("sizes");
  if (!box) return;

  const base = new URL("../data/health/", document.currentScript.src);
  const load = f => window.GATE
    ? window.GATE.json(new URL(`${f}.enc`, base))
    : fetch(new URL(f, base)).then(r => r.json());

  const f1 = n => (Math.round(n * 10) / 10) + "";
  const FIT = {
    ok:    ["fit-ok", "✅ 合身"],
    loose: ["fit-loose", "⬆️ 偏大"],
    tight: ["fit-tight", "⬇️ 偏小"],
  };
  const KEYS = {
    tops:    [["bust","胸围"],["waist","腰围"],["shoulder","肩宽"],["length","衣长"],["sleeve","袖长"],["hem","下摆围"],["cuff","袖口"]],
    bottoms: [["waist","腰围"],["hips","臀围"],["rise","前裆"],["thigh","大腿围"],["inseam","内长"],["length","裤长"]],
  };

  Promise.all([load("sizes.json"), load("measurements.json").catch(() => [])])
    .then(([sz, ms]) => render(sz, ms))
    .catch(() => { box.innerHTML = '<div class="empty">Failed to load — open via the website, not file:// 👗</div>'; });

  // 分区表格：图 | 单品 | 尺码 | 各围度列 | 合身度（该分区没人记的围度列自动隐藏）
  function sectionTable(list, cat){
    const cols = KEYS[cat].filter(([k]) => list.some(e => e[k] != null));
    const hasFit = list.some(e => FIT[e.fit]);   // 没人记合身度就不出这列
    let h = `<div class="tbl-wrap"><table><thead><tr><th class="pc"></th><th class="l">ITEM</th><th>SIZE</th>` +
      cols.map(([, lab]) => `<th class="m">${lab}</th>`).join("") + (hasFit ? `<th>FIT</th>` : "") + `</tr></thead><tbody>`;
    list.forEach(e => {
      const fit = FIT[e.fit];
      h += `<tr>
        <td class="pc">${e.img ? `<img src="../../assets/img/closet/${e.img}" alt="" loading="lazy" onerror="this.style.display='none'">` : `<span class="noimg">${cat === "tops" ? "👕" : "👖"}</span>`}</td>
        <td class="l">${e.brand ? `<b>${e.brand}</b>` : ""}<div class="inm">${e.item || ""}</div>${e.n ? `<div class="nt">${e.n}</div>` : ""}</td>
        <td><span class="size">${e.size || "–"}</span></td>` +
        cols.map(([k]) => `<td class="v">${e[k] != null ? f1(e[k]) : "–"}</td>`).join("") +
        (hasFit ? `<td>${fit ? `<span class="fit ${fit[0]}">${fit[1]}</span>` : "–"}</td>` : "") + `</tr>`;

    });
    return h + `</tbody></table></div>`;
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

    [["tops", "👕&ensp;Tops"], ["bottoms", "👖&ensp;Bottoms"]].forEach(([cat, title]) => {
      const list = sz[cat] || [];
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
    const img = e.target.closest(".ph img");
    if (!img) return;
    lb.querySelector("img").src = img.src;
    lb.classList.add("on");
  });
})();
