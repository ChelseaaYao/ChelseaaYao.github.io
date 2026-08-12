#!/usr/bin/env node
// 数据加密：把 assets/data/<相册>/*.json 加密成同名 .json.enc（AES-256-GCM，密钥由密码 PBKDF2 派生）
// 明文 JSON 和本文件读取的密码都不进 git（见 .gitignore），仓库/线上只有 .enc 密文。
//
// 用法：
//   1. 在 scripts/.gate-secrets.json 里写各目录的密码：{"health":"密码","ledger":"密码"}（留空=跳过）
//   2. 改完明文数据后运行：node scripts/encrypt-data.js
//   3. 提交生成的 .enc 文件
//
// 每个目录首次加密时生成随机盐存进 <目录>/.salt（也不进 git；盐本身不是秘密，
// 同时会写进每个 .enc 信封里供前端派生密钥用）。改密码后删掉 .salt 重新生成也行。
const fs = require("fs"), path = require("path");
const { webcrypto: wc } = require("crypto");
const IT = 310000;   // PBKDF2 迭代次数（前端解密从信封里读，两边不用同步改）

async function deriveKey(pw, salt){
  const km = await wc.subtle.importKey("raw", Buffer.from(pw, "utf8"), "PBKDF2", false, ["deriveKey"]);
  return wc.subtle.deriveKey({ name: "PBKDF2", salt, iterations: IT, hash: "SHA-256" }, km,
    { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
}

(async () => {
  const root = path.join(__dirname, "..");
  const secrets = JSON.parse(fs.readFileSync(path.join(__dirname, ".gate-secrets.json"), "utf8"));
  for (const [name, pw] of Object.entries(secrets)){
    const dir = path.join(root, "assets/data", name);
    if (!pw){ console.log(`- ${name}: 密码为空，跳过`); continue; }
    if (!fs.existsSync(dir)){ console.log(`- ${name}: 目录不存在，跳过`); continue; }

    const saltFile = path.join(dir, ".salt");
    let salt;
    if (fs.existsSync(saltFile)){
      salt = Buffer.from(fs.readFileSync(saltFile, "utf8").trim(), "base64");
    } else {
      salt = Buffer.from(wc.getRandomValues(new Uint8Array(16)));
      fs.writeFileSync(saltFile, salt.toString("base64"));
    }
    const key = await deriveKey(pw, salt);

    for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))){
      const pt = fs.readFileSync(path.join(dir, f));
      const iv = wc.getRandomValues(new Uint8Array(12));
      const ct = Buffer.from(await wc.subtle.encrypt({ name: "AES-GCM", iv }, key, pt));
      const env = { v: 1, it: IT, salt: salt.toString("base64"),
        iv: Buffer.from(iv).toString("base64"), ct: ct.toString("base64") };
      fs.writeFileSync(path.join(dir, f + ".enc"), JSON.stringify(env));
      console.log(`✓ ${name}/${f} → ${f}.enc`);
    }
  }
})();
