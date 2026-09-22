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
        airline:"China Southern", code:"CZ", color:"#0066b3", logo:"../../assets/icons/airlines/CZ.png", flight:"CZ328 ➡️ CZ3401",
        dep:"22:00", depAp:"LAX", arr:"11:15", arrAp:"CTU", plus:"+2", depD:"12.4", arrD:"12.6",
        dur:"21h 15m",
        tags:["✅ 已出票"],
        pick:true,
        day:"12.4.2026 Friday",
        segments:[
          { dep:"22:00", depD:"12.4", depAp:"洛杉矶国际机场（LAX）B",
            arr:"05:55", arrD:"12.6", arrAp:"广州白云国际机场（CAN）T2",
            dur:"15h 55m", info:"CZ328 · 经济舱 · Boeing 777-300 · 含餐" },
          { transfer:"广州转机 2h 35m · 行李直挂，无需提取重挂" },
          { dep:"08:30", depD:"12.6", depAp:"广州白云国际机场（CAN）T2",
            arr:"11:15", arrD:"12.6", arrAp:"成都双流国际机场（CTU）T1",
            dur:"2h 45m", info:"CZ3401 · 经济舱 · Boeing 737 · 小食" },
        ],
        baggage:{
          note:"每人均享以上额度 · 行李直挂成都，转机无需提取",
          items:[
            { icon:"🎒", name:"Personal item", allow:"×1", size:"随身小包" },
            { icon:"👜", name:"Carry-on", allow:"1 × 8 kg", size:"55 × 40 × 20 cm" },
            { icon:"🧳", name:"Checked", allow:"2 × 23 kg", size:"三边和 ≤ 158 cm" },
          ],
        },
      },
    ],
  },
  {
    route: "🐼 成都 → 🌴 LAX",
    date: "1.3 出发 · 当天到 LA 🏠 · 天府 TFU 出发",
    options: [
      {
        airline:"Sichuan Airlines", code:"3U", color:"#c0392b", logo:"../../assets/icons/airlines/3U.png", flight:"3U3837",
        dep:"22:00", depAp:"TFU", arr:"19:00", arrAp:"LAX", depD:"1.3", arrD:"1.3",
        dur:"13h 00m", stop:"直飞",
        tags:["✅ 已出票 · 9.22","⚠️ 常晚点 30+ 分钟"],
        pick:true,
        day:"1.3.2027 Sunday",
        segments:[
          { dep:"22:00", depD:"1.3", depAp:"成都天府国际机场（TFU）T1",
            arr:"19:00", arrD:"1.3", arrAp:"洛杉矶国际机场（LAX）TB",
            dur:"13h 00m", info:"3U3837 · 经济舱 O · Airbus A350 · 直飞" },
        ],
        baggage:{
          note:"客票行李额 1PC · 单件 ≤ 23 kg 为川航国际经济舱标准",
          items:[
            { icon:"🎒", name:"Personal item", allow:"×1", size:"随身小包" },
            { icon:"👜", name:"Carry-on", allow:"1 × 5 kg", size:"55 × 40 × 20 cm" },
            { icon:"🧳", name:"Checked", allow:"1 × 23 kg", size:"三边和 ≤ 158 cm" },
          ],
        },
      },
    ],
  },
];
