// 页面密码门，两种模式：
//   加密模式（真锁）：<script src="gate.js" data-enc="<某个 .json.enc 的相对 URL>"></script>
//     数据文件是 AES-256-GCM 密文（scripts/encrypt-data.js 生成），密码经 PBKDF2 派生密钥，
//     解密成功才放行；页面脚本通过 window.GATE.json(url) 取数据。密码错误只能得到乱码。
//     注意：本脚本要放在页面渲染脚本【之前】，渲染脚本才能拿到 window.GATE。
//   哈希模式（防君子）：<script src="gate.js" data-hash="<密码的sha256>"></script>
//     仅前端校验，内容未加密。生成哈希：
//     node -e "const c=require('crypto');console.log(c.createHash('sha256').update('你的密码').digest('hex'))"
// 同一浏览器标签页内输对一次即免重输（sessionStorage）。
(function(){
  const script = document.currentScript;
  const HASH = script.dataset.hash;
  const ENC = script.dataset.enc;
  const KEY = "gate:" + location.pathname;

  // 先立刻遮住整页，避免内容闪现
  const style = document.createElement("style");
  style.textContent = `
    #gate{position:fixed;inset:0;background:var(--bg,#1c1e22);z-index:99;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;}
    #gate .lock{font-size:44px;}
    #gate .tip{font-family:Georgia,"Songti SC",serif;color:#9aa1ab;font-size:14px;letter-spacing:1px;}
    #gate input{background:#282b31;border:1px solid #3a3f48;border-radius:10px;color:#e8eaed;
      font-size:16px;padding:10px 16px;width:220px;text-align:center;outline:none;}
    #gate input:focus{border-color:#4a505a;}
    #gate input.err{border-color:#e06c75;animation:shake .3s;}
    #gate input:disabled{opacity:.5;}
    @keyframes shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
  `;
  document.head.appendChild(style);

  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  // ── 加密模式 ──
  if (ENC){
    const probeURL = new URL(ENC, location.href);
    let resolveKey;
    const keyReady = new Promise(r => { resolveKey = r; });

    // 页面脚本用这个取数据：GATE.json("…/xxx.json.enc") → 解密后的对象
    window.GATE = {
      json: async url => {
        const env = await (await fetch(url)).json();
        const key = await keyReady;
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(env.iv) }, key, b64(env.ct));
        return JSON.parse(new TextDecoder().decode(pt));
      }
    };

    const derive = async (pw, env) => {
      const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(env.salt), iterations: env.it, hash: "SHA-256" }, km,
        { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    };
    // 用探针文件试解密验证密码（GCM 校验失败会 throw）
    const tryUnlock = async pw => {
      const env = await (await fetch(probeURL)).json();
      const key = await derive(pw, env);
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(env.iv) }, key, b64(env.ct));
      return key;
    };

    const gate = document.createElement("div");
    gate.id = "gate";
    gate.innerHTML = `<div class="lock">🔒</div><div class="tip">This page is private. Enter password</div>
      <input type="password" autofocus>`;
    document.body.appendChild(gate);
    const input = gate.querySelector("input");

    const unlocked = key => { resolveKey(key); gate.remove(); };

    const saved = sessionStorage.getItem(KEY);
    if (saved){
      tryUnlock(saved).then(unlocked).catch(() => sessionStorage.removeItem(KEY));
    }
    input.focus();
    input.addEventListener("keydown", async e => {
      if (e.key !== "Enter" || !input.value) return;
      input.disabled = true;
      try {
        const key = await tryUnlock(input.value);
        sessionStorage.setItem(KEY, input.value);
        unlocked(key);
      } catch {
        input.disabled = false;
        input.classList.add("err");
        input.value = "";
        input.focus();
        setTimeout(() => input.classList.remove("err"), 350);
      }
    });
    return;
  }

  // ── 哈希模式 ──
  const sha = async s => {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  };

  if (sessionStorage.getItem(KEY) === HASH) return;

  const gate = document.createElement("div");
  gate.id = "gate";
  gate.innerHTML = `<div class="lock">🔒</div><div class="tip">This page is private. Enter password</div>
    <input type="password" autofocus>`;
  document.body.appendChild(gate);
  const input = gate.querySelector("input");
  input.focus();

  input.addEventListener("keydown", async e => {
    if (e.key !== "Enter") return;
    if (await sha(input.value) === HASH){
      sessionStorage.setItem(KEY, HASH);
      gate.remove();
    } else {
      input.classList.add("err");
      input.value = "";
      setTimeout(() => input.classList.remove("err"), 350);
    }
  });
})();
