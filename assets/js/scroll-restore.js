// 全站通用：记住每个页面的滚动位置，跳转离开再回来时停在原处（而不是顶部）
// 用法：在页面 </body> 前最后一个引入本文件
// 注意：内容异步渲染（如 gate 解密后才出）的页面，加载瞬间页面还很矮，scrollTo 会被钳到顶部，
// 所以用 rAF 循环持续补偿恢复，直到滚到位 / 用户自己动手 / 超时（4s）
(function(){
  const key = "scroll:" + location.pathname;
  const target = +sessionStorage.getItem(key) || 0;
  let settled = target === 0, userMoved = false;

  const stop = () => { userMoved = true; };
  addEventListener("wheel", stop, { passive: true, once: true });
  addEventListener("touchstart", stop, { passive: true, once: true });

  if (target > 0){
    const t0 = Date.now();
    const tryRestore = () => {
      if (userMoved){ settled = true; return; }
      scrollTo(0, target);
      if (Math.abs(scrollY - target) < 2 || Date.now() - t0 > 4000){ settled = true; return; }
      requestAnimationFrame(tryRestore);
    };
    tryRestore();
  }

  // 恢复完成前不记录（避免被钳在顶部的中间状态覆盖存档）
  addEventListener("scroll", () => {
    if (settled || userMoved) sessionStorage.setItem(key, scrollY);
  }, { passive: true });
})();
