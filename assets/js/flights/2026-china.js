// 2026 回国行程 —— 机票候选数据（配合 flight-card.js 渲染模板使用）
//
// 数据格式（模板约定，所有行程通用）：
// FLIGHT_GROUPS = [ 航段, ... ]
//   航段: { route:"LAX → 🇯🇵 Tokyo", date:"航段说明", options:[ 航班, ... ] }
//   航班: {
//     airline:"航司名", code:"两字码(圆徽章)", color:"#徽章色",
//     dep:"起飞时间", depAp:"起飞机场", arr:"落地时间", arrAp:"落地机场",
//     plus:"+2"(跨天,可省), dur:"12h 20m", stop:"Nonstop"(绿色标签,可省),
//     note:"日期等备注", link:"Google Flights 链接(标题可点,可省)",
//     fares:[ 票档, ... ]   // 一档一行
//   }
//   票档: { name:"档名", perks:"权益说明", prices:[{on:"月.日",price:数字},...], pick:false }
//   查价:往 prices 尾部加一条 { on, price }，自动显示涨跌趋势
//   选定:把那一档 pick 改成 true（高亮 ⭐，航段计入 picked）
const FLIGHT_GROUPS = [
  {
    route: "🌴 LAX → 🐼 成都",
    date: "12.4 – 12.6 · 落地 CTU 双流",
    options: [
      {
        airline:"China Southern", code:"CZ", color:"#0066b3", flight:"CZ328 ➡️ CZ3401",
        dep:"22:00", depAp:"LAX", arr:"11:15", arrAp:"CTU", plus:"+2", depD:"12.4", arrD:"12.6",
        dur:"21h 15m",
        tags:["转机 CAN 广州 · 停留 2h 35m","🛬 双流 CTU T1","✅ 已出票"],
        pick:true,
        day:"12.4.2026 Friday",
      },
      {
        airline:"Sichuan Airlines", code:"3U", color:"#c0392b", logo:"../../assets/icons/airlines/3U.png", flight:"3U3838",
        dep:"21:30", depAp:"LAX", arr:"08:10", arrAp:"TFU", plus:"+2", depD:"12.4", arrD:"12.6",
        dur:"18h 40m", stop:"直达 · 技术经停 HGH",
        day:"12.4.2026 Friday",
        fares:[
          { name:"Economy", via:"Google", perks:"🎒 随身小包+登机箱（17.6 lbs）· 🧳 免费托运 ×1（50.7 lbs · plus one ➕ $200）· 💰 取消/改签需付费",
            prices:[{ on:"7.30", price:552.50 }, { on:"8.21", price:576 }], pick:false },
          { name:"Economy", via:"Trip.com", perks:"🧳 免费托运 ×1（50 lbs）· 💰 取消 $250 起 · 改签 $130 起",
            prices:[{ on:"7.30", price:556 }], pick:false },
          { name:"Economy · Exclusive", via:"Trip.com", perks:"🧳 免费托运 ×2（各 50 lbs）· ✅ 免改签费 · 💰 取消 $150 起",
            prices:[{ on:"7.30", price:644 }], pick:false },
          { name:"Economy · Bgeflax", via:"Trip.com", perks:"🧳 免费托运 ×2（各 50 lbs）· ✅ 免改签费 · 💰 取消 $150 起 · 🆕 首次下单专享",
            prices:[{ on:"7.30", price:670 }], pick:false },
        ],
      },
    ],
  },
  {
    route: "🐼 成都 → 🌴 LAX",
    date: "1.1 / 1.2 出发 · 当天到 LA 🏠",
    options: [
      {
        airline:"Sichuan Airlines", code:"3U", color:"#c0392b", logo:"../../assets/icons/airlines/3U.png", flight:"3U3837",
        dep:"23:00", depAp:"TFU", arr:"19:30", arrAp:"LAX", depD:"1.1", arrD:"1.1",
        dur:"12h 30m", stop:"直飞",
        tags:["⚠️ 常晚点 30+ 分钟"],
        day:"1.1.2027 Friday",
        fares:[
          { name:"Economy", perks:"🎒 随身 ×1 免费 · 🧳 首件托运需付费 · plus one ➕ $200",
            prices:[{ on:"7.30", price:1283 }], pick:false },
        ],
      },
      {
        airline:"Cathay Pacific", code:"CX", color:"#006564", logo:"../../assets/icons/airlines/CX.png", flight:"CX917 ➡️ CX884",
        dep:"08:15", depAp:"CTU", arr:"09:15", arrAp:"LAX", depD:"1.1", arrD:"1.1",
        dur:"17h 00m",
        tags:["转机 HKG · 停留 1h 35m","🛫 双流 CTU 出发","⚠️ CX884 常晚点 30+ 分钟"],
        day:"1.1.2027 Friday",
        fares:[
          { name:"Economy", perks:"🎒 随身 ×1 免费 · 🧳 首件托运免费",
            prices:[{ on:"7.30", price:1132 }], pick:false },
        ],
      },
      {
        airline:"Cathay Pacific", code:"CX", color:"#006564", logo:"../../assets/icons/airlines/CX.png", flight:"CX987 ➡️ CX882",
        dep:"14:30", depAp:"CTU", arr:"16:20", arrAp:"LAX", depD:"1.2", arrD:"1.2",
        dur:"17h 50m",
        tags:["转机 HKG · 停留 2h 35m","🛫 双流 CTU 出发"],
        day:"1.2.2027 Saturday",
        fares:[
          { name:"Economy", perks:"🎒 随身 ×1 免费 · 🧳 首件托运免费",
            prices:[{ on:"7.30", price:1296 }], pick:false },
        ],
      },
    ],
  },
];
