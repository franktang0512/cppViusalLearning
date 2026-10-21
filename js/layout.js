/* ================= 版面：拖曳分隔線調整每一區的大小，內容照比例放大縮小 =================
   寬螢幕（1400px 以上，課文｜程式碼｜記憶體三欄）才有：
     課文和程式碼之間、程式碼和記憶體之間：直的分隔線，左右拖
     記憶體和輸入輸出之間：橫的分隔線，上下拖
     按鈕列和下面的說明框之間：橫的分隔線（中間有把手），上下拖就是調說明框的高度
   說明框右上角的 ▾ 可以把說明框收起來（任何寬度都可以）。
   放不下的時候整頁往下捲（css/style.css 的寬螢幕版面），不會把每一區壓扁。
   一區被拉大，裡面的字、格子、箭頭就跟著放大（CSS zoom）；倍率 = 現在的寬度 ÷ 原本版面的寬度。
   拉好的大小存在瀏覽器裡（ckviz-layout），雙擊分隔線還原。
   程式碼區裡的程式碼、記憶體區不放大：拉寬、拉高就看得到更多程式碼（積木課的積木工作區也一樣，Blockly 自己有放大縮小的按鈕）。 */
(function(){
  const V=$("cppView");if(!V)return;
  const head=V.querySelector(".lesson-head"),grid=V.querySelector(".grid"),code=grid.querySelector(".panel"),right=grid.querySelector(".right");
  const mem=right.querySelector(".panel"),io=right.querySelector(".io-grid"),judge=$("judge");
  const note=$("note"),noteWrap=$("noteWrap"),noteTog=$("noteTog");
  const mq=matchMedia("(min-width:1400px)");
  const DEF={lw:30,cf:1/2.05,ioh:236};   // 原本的版面：課文 30%、程式碼和右邊 1 : 1.05、輸入輸出 236px
  let S={...DEF,...store.get("ckviz-layout",{})};
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  // ---------- 分隔線 ----------
  const bar=(cls,where,ref)=>{const d=document.createElement("div");d.className="split "+cls;d.setAttribute("role","separator");
    d.title=T("拖曳調整大小，裡面的字會跟著放大縮小（雙擊還原）","Drag to resize; the content grows and shrinks with it (double-click to reset)");
    where.insertBefore(d,ref);return d};
  const sL=bar("v",V,grid),sC=bar("v",grid,right),sR=bar("h",right,io);
  const sN=bar("h note-split",code,noteWrap);sN.title=T("上下拖曳調整說明框的高度（雙擊還原）","Drag up or down to change the height of the notes (double-click to reset)");
  function drag(el,move,reset){
    el.addEventListener("pointerdown",e=>{if(!mq.matches)return;e.preventDefault();el.setPointerCapture(e.pointerId);el.classList.add("on");document.body.classList.add("resizing")});
    el.addEventListener("pointermove",e=>{if(!el.hasPointerCapture(e.pointerId))return;move(e);apply()});
    const up=e=>{if(!el.hasPointerCapture(e.pointerId))return;el.releasePointerCapture(e.pointerId);el.classList.remove("on");document.body.classList.remove("resizing");store.set("ckviz-layout",S)};
    el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
    el.addEventListener("dblclick",()=>{reset();apply();store.set("ckviz-layout",S)});
  }
  drag(sL,e=>{const r=V.getBoundingClientRect();S.lw=clamp((e.clientX-r.left-16)/(r.width-32)*100,15,60)},()=>{S.lw=DEF.lw});
  drag(sC,e=>{const r=grid.getBoundingClientRect();S.cf=clamp((e.clientX-r.left)/r.width,.2,.8)},()=>{S.cf=DEF.cf});
  // 說明框的高度：說明框的底不動，分隔線拉到哪裡，說明框就從那裡（扣掉中間的按鈕列）開始
  drag(sN,e=>{const nr=note.getBoundingClientRect(),gap=nr.top-sN.getBoundingClientRect().bottom;S.nh=clamp(nr.bottom-e.clientY-5-gap,60,900)},()=>{S.nh=null});
  drag(sR,e=>{const r=right.getBoundingClientRect(),j=judge.hidden?0:judge.getBoundingClientRect().height+10;S.ioh=clamp(r.bottom-j-e.clientY-5,110,r.height-j-160)},()=>{S.ioh=DEF.ioh});
  // ---------- 放大倍率 ----------
  const zoom=(el,z)=>{el.style.zoom=Math.abs(z-1)<.03?"":z.toFixed(3)};
  function apply(){
    {const mb=document.querySelector(".modebar");V.style.setProperty("--stick",((mb?mb.offsetHeight:0)+8)+"px")}   // 程式碼區黏在切換課程那一列的下面
    V.style.setProperty("--lw",S.lw+"%");
    grid.style.setProperty("--cf",S.cf+"fr");grid.style.setProperty("--rf",(1-S.cf)+"fr");
    const parts=[head,mem,io,judge,...code.children];
    if(!mq.matches){parts.concat(code).forEach(el=>el.style.zoom="");io.style.height=judge.style.height=note.style.height="";return}
    // 原本的版面在這個視窗大小下，每一區有多寬
    const W=V.clientWidth-32-10-8,refL=Math.max(240,W*DEF.lw/100),G=W-refL-10-8;
    const L=head.getBoundingClientRect().width,C=code.getBoundingClientRect().width,R=right.getBoundingClientRect().width;
    const zl=clamp(L/refL,.8,2.2),zc=clamp(C/(G*DEF.cf),.8,2.2),zr=clamp(R/(G*(1-DEF.cf)),.8,2.2);
    const zio=clamp(Math.min(zr*S.ioh/DEF.ioh,zr*1.6),.8,2.6);
    // 記憶體區不放大：拉寬、拉高就看得到更多格子（放大了還是會被切掉）
    zoom(head,zl);mem.style.zoom="";zoom(judge,zr);zoom(io,zio);
    // 程式碼區：只放大標題列、按鈕和說明；程式碼（積木工作區）本身不放大，拉寬、拉高就看得到更多行
    code.style.zoom="";[...code.children].forEach(c=>{if(c.id==="codeArea")c.style.zoom="";else zoom(c,zc)});
    // zoom 也會放大元素自己設定的高度，所以高度要除回去，外面看起來才是拉出來的大小
    io.style.height=(S.ioh/zio).toFixed(1)+"px";judge.style.height=(180/zr).toFixed(1)+"px";
    note.style.height=S.nh?(S.nh/zc).toFixed(1)+"px":"";
    requestAnimationFrame(()=>{if(typeof drawArrows==="function")drawArrows()});
    if(COURSE==="blk"&&typeof BLKV!=="undefined"&&BLKV.ws)Blockly.svgResize(BLKV.ws);   // 積木工作區跟著變成拉出來的大小
  }
  // ---------- 說明框收起來 ----------
  function applyNote(){
    const off=!!S.noteOff;noteWrap.classList.toggle("off",off);sN.style.display=off?"none":"";
    noteTog.textContent=off?T("▸ 說明（收起來了，按這裡打開）","▸ Notes (hidden, click to show)"):"▾";
    const t=off?T("打開說明","Show the notes"):T("收起說明","Hide the notes");noteTog.title=t;noteTog.setAttribute("aria-label",t);noteTog.setAttribute("aria-expanded",!off);
  }
  noteTog.addEventListener("click",()=>{S.noteOff=!S.noteOff;applyNote();apply();store.set("ckviz-layout",S);
    if(COURSE==="blk"&&typeof BLKV!=="undefined"&&BLKV.ws)setTimeout(()=>Blockly.svgResize(BLKV.ws),0)});
  applyNote();
  addEventListener("resize",apply);
  mq.addEventListener("change",apply);
  apply();
})();
