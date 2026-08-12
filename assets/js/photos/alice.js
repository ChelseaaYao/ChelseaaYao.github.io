// alice 相册照片清单 —— 由 scripts/sync-photos.js 自动生成（meta 行除外），不要手动改其他部分
// 照片描述统一在 descriptions.js 里填
const GALLERY = {
  meta: { emoji:"🐕", title:"Alice", sub:"第一可爱小🐷" },  // ← 手动改这行（emoji/标题/副标题），同步会保留
  dir: "../../photos/moments/alice/",
  photos: [
    { file:"20250415-01.jpg", date:"4.15.2025" },
    { file:"20250429-01.jpg", date:"4.29.2025" },
    { file:"20250531-01.jpg", date:"5.31.2025" },
    { file:"20250601-01.jpg", date:"6.1.2025" },
    { file:"20260101-01.jpg", date:"1.1.2026" },
    { file:"20260220-01.jpg", date:"2.20.2026" },
    { file:"20260512-01.jpg", date:"5.12.2026" },
    { file:"20260523-01.jpg", date:"5.23.2026" },
    { file:"20260723-01.jpg", date:"7.23.2026" },
    { file:"20260731-01.jpg", date:"7.31.2026" },
  ],
};
