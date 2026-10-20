/* ================= 版面：拖曳分隔線調整每一區的大小，內容照比例放大縮小 =================
   寬螢幕（1400px 以上，課文｜程式碼｜記憶體三欄）才有：
     課文和程式碼之間、程式碼和記憶體之間：直的分隔線，左右拖
     記憶體和輸入輸出之間：橫的分隔線，上下拖
   一區被拉大，裡面的字、格子、箭頭就跟著放大（CSS zoom）；倍率 = 現在的寬度 ÷ 原本版面的寬度。
   拉好的大小存在瀏覽器裡（ckviz-layout），雙擊分隔線還原。
   積木課的積木工作區不放大（Blockly 自己有放大縮小的按鈕，外面再放大，滑鼠會對不準）。 */
(function(){
  const V=$("cppView");if(!V)return;
  const head=V.querySelector(".lesson-head"),grid=V.querySelector(".grid"),code=grid.querySelector(".panel"),right=grid.querySelector(".right");
  const mem=right.querySelector(".panel"),io=right.querySelector(".io-grid"),judge=$("judge");
  const mq=matchMedia("(min-width:1400px)");
  const DEF={lw:30,cf:1/2.05,ioh:236};   // 原本的版面：課文 30%、程式碼和右邊 1 : 1.05、輸入輸出 236px
  let S={...DEF,...store.get("ckviz-layout",{})};
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  // ---------- 分隔線 ----------
  const bar=(cls,where,ref)=>{const d=document.createElement("div");d.className="split "+cls;d.setAttribute("role","separator");
    d.title=T("拖曳調整大小，裡面的字會跟著放大縮小（雙擊還原）","Drag to resize; the content grows and shrinks with it (double-click to reset)");
    where.insertBefore(d,ref);return d};
  const sL=bar("v",V,grid),sC=bar("v",grid,right),sR=bar("h",right,io);
  function drag(el,move,reset){
    el.addEventListener("pointerdown",e=>{if(!mq.matches)return;e.preventDefault();el.setPointerCapture(e.pointerId);el.classList.add("on");document.body.classList.add("resizing")});
    el.addEventListener("pointermove",e=>{if(!el.hasPointerCapture(e.pointerId))return;move(e);apply()});
    const up=e=>{if(!el.hasPointerCapture(e.pointerId))return;el.releasePointerCapture(e.pointerId);el.classList.remove("on");document.body.classList.remove("resizing");store.set("ckviz-layout",S)};
    el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
    el.addEventListener("dblclick",()=>{reset();apply();store.set("ckviz-layout",S)});
  }
  drag(sL,e=>{const r=V.getBoundingClientRect();S.lw=clamp((e.clientX-r.left-16)/(r.width-32)*100,15,60)},()=>{S.lw=DEF.lw});
  drag(sC,e=>{const r=grid.getBoundingClientRect();S.cf=clamp((e.clientX-r.left)/r.width,.2,.8)},()=>{S.cf=DEF.cf});
  drag(sR,e=>{const r=right.getBoundingClientRect(),j=judge.hidden?0:judge.getBoundingClientRect().height+10;S.ioh=clamp(r.bottom-j-e.clientY-5,110,r.height-j-160)},()=>{S.ioh=DEF.ioh});
  // ---------- 放大倍率 ----------
  const zoom=(el,z)=>{el.style.zoom=Math.abs(z-1)<.03?"":z.toFixed(3)};
  function apply(){
    V.style.setProperty("--lw",S.lw+"%");
    grid.style.setProperty("--cf",S.cf+"fr");grid.style.setProperty("--rf",(1-S.cf)+"fr");
    const parts=[head,mem,io,judge,...code.children];
    if(!mq.matches){parts.concat(code).forEach(el=>el.style.zoom="");io.style.height=judge.style.height="";return}
    // 原本的版面在這個視窗大小下，每一區有多寬
    const W=V.clientWidth-32-10-8,refL=Math.max(240,W*DEF.lw/100),G=W-refL-10-8;
    const L=head.getBoundingClientRect().width,C=code.getBoundingClientRect().width,R=right.getBoundingClientRect().width;
    const zl=clamp(L/refL,.8,2.2),zc=clamp(C/(G*DEF.cf),.8,2.2),zr=clamp(R/(G*(1-DEF.cf)),.8,2.2);
    const zio=clamp(Math.min(zr*S.ioh/DEF.ioh,zr*1.6),.8,2.6);
    zoom(head,zl);zoom(mem,zr);zoom(judge,zr);zoom(io,zio);
    // 程式碼區：整區一起放大；積木課只放大標題列、按鈕和說明，積木工作區不動
    if(COURSE==="blk"){code.style.zoom="";[...code.children].forEach(c=>{if(c.id!=="codeArea")zoom(c,zc)})}
    else{[...code.children].forEach(c=>c.style.zoom="");zoom(code,zc)}
    // zoom 也會放大元素自己設定的高度，所以高度要除回去，外面看起來才是拉出來的大小
    io.style.height=(S.ioh/zio).toFixed(1)+"px";judge.style.height=(180/zr).toFixed(1)+"px";
    requestAnimationFrame(()=>{if(typeof drawArrows==="function")drawArrows()});
  }
  addEventListener("resize",apply);
  mq.addEventListener("change",apply);
  apply();
})();
