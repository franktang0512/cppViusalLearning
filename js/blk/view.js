/* ================= Scratch / Blockly 課的畫面 =================
   網址 ?course=blk。版面、步驟控制、說明框、測資、判題、追蹤表都跟 C++ 共用（js/ui.js），
   這裡只負責：程式碼區換成積木工作區、標題列的按鈕、記憶體區畫變數和清單、每一步讓那塊積木亮起來。
   ST.code 是目前工作區的 JSON；學生排的積木存在瀏覽器（blkviz-code-課號-外觀），重新整理不會不見。 */
const BLKV={ws:null,lid:null,look:null,dirty:false,loading:false};
const blkReady=()=>typeof Blockly!=="undefined"&&!!Blockly.inject;
function blkGetLook(){try{return JSON.parse(localStorage.getItem("blkviz-look"))==="blockly"?"blockly":"scratch"}catch(e){return"scratch"}}
function blkSaved(L,look){try{return localStorage.getItem("blkviz-code-"+L.id+"-"+look)}catch(e){return null}}
// 這一課在這個外觀一開始的積木：課程給的（scratch: code、blockly: blocklyCode），沒有的話 Scratch 先放一塊綠旗
function blkLessonCode(L,look){
  const c=look==="blockly"?L.blocklyCode:L.code;
  if(c)return typeof c==="string"?c:JSON.stringify(c);
  return look==="scratch"?JSON.stringify({blocks:{languageVersion:0,blocks:[{type:"event_whenflagclicked",x:40,y:40}]}}):"{}";
}
// 打開一課時：決定外觀、拿出這一課的積木（學生改過的優先）
function blkPrepare(L){
  BLKV.look=blkGetLook();
  ST.code=blkSaved(L,BLKV.look)||blkLessonCode(L,BLKV.look);
}
// 把積木放進程式碼區
function blkMount(L){
  document.body.classList.add("blk-course");
  const area=document.getElementById("codeArea");
  if(!blkReady()){area.innerHTML=`<div class="blk-fail">${T("積木編輯器載入失敗。這個課程需要連上網路（從 jsDelivr 載入 Blockly），請檢查網路後重新整理。","The block editor failed to load. This course needs the Internet (Blockly is loaded from jsDelivr). Check your connection and reload.")}</div>`;blkActions();return}
  blkDefine();
  if(BLKV.ro){BLKV.ro.disconnect();BLKV.ro=null}
  if(BLKV.ws){BLKV.ws.dispose();BLKV.ws=null}
  area.innerHTML=`<div id="blkWs" class="blk-ws"></div>`;
  const look=BLKV.look;
  const ws=Blockly.inject("blkWs",{toolbox:blkToolbox(look),renderer:look==="scratch"?"zelos":"geras",theme:blkTheme(look),
    grid:{spacing:24,length:3,colour:"#e3e6ee",snap:true},trashcan:true,sounds:false,
    zoom:{controls:true,wheel:true,startScale:look==="scratch"?0.75:0.85,maxScale:2.5,minScale:0.4,scaleSpeed:1.15},move:{scrollbars:true,drag:true,wheel:false}});
  blkRegister(ws,look);
  BLKV.ws=ws;BLKV.lid=L.id;BLKV.loading=true;
  try{const j=ST.code&&ST.code.trim()?JSON.parse(ST.code):{};Blockly.serialization.workspaces.load(j,ws)}catch(e){console.warn(e)}
  try{ST.code=JSON.stringify(blkSave(ws))}catch(e){}   // 換成 Blockly 存檔的樣子（每塊積木都有編號，執行時才能讓它亮起來）
  BLKV.loading=false;BLKV.dirty=false;
  ws.addChangeListener(ev=>{
    if(BLKV.loading||ev.isUiEvent)return;
    const now=JSON.stringify(blkSave(ws));
    if(now===ST.code)return;   // 載入積木時晚到的通知：內容沒變，不算改過
    ST.code=now;
    try{localStorage.setItem("blkviz-code-"+L.id+"-"+look,ST.code)}catch(e){}
    if(!BLKV.dirty){BLKV.dirty=true;stop();ws.highlightBlock(null);blkActions();
      document.getElementById("note").innerHTML=T("積木改過了。按上面的 <b>🏁 執行</b>，用新的積木重新執行。","The blocks have changed. Press <b>🏁 Run</b> above to run the new blocks.")}
    if(!ST.trace.length)renderBlkMem(null,false);   // 還沒執行：記憶體跟著工作區的變數、清單更新
  });
  blkActions();
  setTimeout(()=>Blockly.svgResize(ws),0);
  // 程式碼區變大變小（拖分隔線、收合目錄、視窗改變）時，工作區跟著重畫成新的大小
  if(typeof ResizeObserver!=="undefined"){BLKV.ro=new ResizeObserver(()=>{if(BLKV.ws===ws)Blockly.svgResize(ws)});BLKV.ro.observe(document.getElementById("blkWs"))}
}
addEventListener("resize",()=>{if(BLKV.ws)Blockly.svgResize(BLKV.ws)});
// 頁面文字裡的 🏁（說明、標籤、說明框……）都換成積木上那一面綠旗，不然瀏覽器會畫成黑白格子旗
function blkFlags(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.includes("🏁")&&!n.parentElement.closest("svg,textarea,input,script,style,title")?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  const list=[];while(w.nextNode())list.push(w.currentNode);
  list.forEach(n=>{
    const f=document.createDocumentFragment();
    n.nodeValue.split("🏁").forEach((t,i)=>{if(i){const im=document.createElement("img");im.className="blk-flag";im.src=BLK_FLAG;im.alt="🏁";f.appendChild(im)}if(t)f.appendChild(document.createTextNode(t))});
    n.replaceWith(f);
  });
}
addEventListener("DOMContentLoaded",()=>{
  if(typeof COURSE==="undefined"||COURSE!=="blk")return;
  blkFlags(document.body);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)blkFlags(n);else if(n.nodeType===3&&n.parentElement)blkFlags(n.parentElement)}))).observe(document.body,{childList:true,subtree:true});
});
// 「積木」標題列上的按鈕：🏁 執行、Scratch / Blockly、還原
function blkActions(){
  const acts=document.getElementById("editActions");if(!acts)return;
  const L=ST.L,look=BLKV.look,edited=!!blkSaved(L,look);   // 學生動過積木才會存下來
  acts.innerHTML=`<button class="small-btn run" id="blkRun"><img class="blk-flag" src="${BLK_FLAG}" alt=""> ${T("執行","Run")}</button>`+
    `<span class="blk-looks"><button class="small-btn" data-look="scratch" aria-pressed="${look==="scratch"}">Scratch</button><button class="small-btn" data-look="blockly" aria-pressed="${look==="blockly"}">Blockly</button></span>`+
    (edited?`<button class="small-btn" id="blkRestore" title="${T("回到這一課一開始的積木","Go back to this lesson's starting blocks")}">${T("還原","Restore")}</button>`:"");
  document.getElementById("blkRun").onclick=blkGo;
  acts.querySelectorAll("[data-look]").forEach(b=>b.onclick=()=>{
    if(b.dataset.look===look)return;
    try{localStorage.setItem("blkviz-look",JSON.stringify(b.dataset.look))}catch(e){}
    blkPrepare(L);blkMount(L);blkGo();
  });
  const r=document.getElementById("blkRestore");
  if(r)r.onclick=()=>{if(!confirm(T("要清掉你排的積木，回到這一課一開始的樣子嗎？","Clear your blocks and go back to this lesson's starting blocks?")))return;
    try{localStorage.removeItem("blkviz-code-"+L.id+"-"+look)}catch(e){}ST.code=blkLessonCode(L,look);blkMount(L);blkGo()};
}
// 🏁：用目前的積木重新執行，跳到最後（看得到輸出和判題）；想看過程，按「重來」再「下一步」
function blkGo(){
  stop();BLKV.dirty=false;
  if(BLKV.ws)ST.code=JSON.stringify(blkSave(BLKV.ws));   // 直接拿工作區現在的積木（改變的通知會晚一點才到）
  if(ST.L.tests&&picks().length)runPicked();else{ST.ran=false;ST.results={};rerun()}
  go(ST.trace.length,false);blkActions();
}
// 每一步：讓這一步執行的那一塊積木亮起來
function blkSync(s){
  const ws=BLKV.ws;if(!ws)return;
  const id=!BLKV.dirty&&s&&s.bid?s.bid:null;ws.highlightBlock(id);
  // 亮起來的積木不在畫面裡（例如跳進函式），就捲過去；已經看得到就不動
  const b=id&&ws.getBlockById(id);
  if(b)try{const r=b.getBoundingRectangle(),m=ws.getMetricsManager().getViewMetrics(true);
    const seen=r.left>=m.left&&r.left<=m.left+m.width-40&&r.top>=m.top&&r.top<=m.top+m.height-30;   // 積木的左上角看得到就好
    if(!seen)ws.centerOnBlock(id,true)}catch(e){}
}

/* ---------- 記憶體：用跟 C++ 一樣的格子畫變數和清單 ---------- */
function renderBlkMem(s,flash){
  const box=document.getElementById("mem"),leg=document.getElementById("memLegend");
  const esc2=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fmt=v=>v===undefined?"":v===null?"null":typeof v==="string"?v:typeof v==="boolean"?(v?"true":"false"):String(v);
  let B=s&&s.blk;
  // 還沒執行：先列出工作區裡有的變數、清單
  if(!B){
    const ws=BLKV.ws;if(!ws){box.innerHTML=`<div class="empty">${T("還沒有變數或清單","No variables or lists yet")}</div>`;leg.textContent="";return}
    const sc=BLKV.look==="scratch";
    B={scratch:sc,vars:ws.getVariablesOfType("").map(v=>({name:v.name,val:sc?0:undefined})),lists:ws.getVariablesOfType("list").map(v=>({name:v.name,items:[]})),frames:[],answer:"",changed:[],read:[]};
  }
  const ch=new Set(B.changed),rd=new Set(B.read);
  const hit=k=>(flash&&ch.has(k)?" flash":"")+(rd.has(k)?" rd":"");
  const cell=(v,i,k,last)=>`<div class="cell${last?" last":""}"><div class="cv${hit(k)}">${esc2(fmt(v))||"&nbsp;"}</div><div class="ci">${i}</div></div>`;
  const row=(name,a,key,ty)=>`<div><div class="arr-head"><div class="addr"></div><div class="meta"><span class="nm">${esc2(name)}</span> <span class="ty">${ty}・${T(`${a.length} 項`,`${a.length} items`)}</span></div></div>`+
    `<div class="arr">${a.length?a.map((x,i)=>cell(x,i+1,key+":"+i,i===a.length-1)).join(""):`<div class="cell last"><div class="cv${hit(key)}" style="min-width:5em">${T("空的","empty")}</div><div class="ci">&nbsp;</div></div>`}</div></div>`;
  // 清單裡放清單（Blockly 的二維表格）：一列一排畫出來
  const one=(name,v,key,ty)=>Array.isArray(v)?(v.length&&v.every(Array.isArray)?v.map((rw,i)=>row(T(`${name} 第 ${i+1} 列`,`${name} row ${i+1}`),rw,key+":"+i,ty)).join(""):row(name,v,key,ty)):
    `<div class="var"><div class="addr"></div><div class="box${hit(key)}" style="--n:${Math.max(1,Math.ceil((String(fmt(v)).length*12+16)/30))}"><div class="val${v===undefined?" g":""}">${esc2(fmt(v))}</div></div><div class="meta"><div class="nm">${esc2(name)}</div><div class="ty">${ty}</div></div></div>`;
  let h="";
  const asks=(ST.code||"").includes("event_askandwait")||(ST.code||"").includes("event_answer");
  if(B.scratch&&asks)h+=one(T("詢問的答案","answer"),B.answer,"answer",T("「詢問並等待」拿到的值","the value from \"ask and wait\""));
  h+=B.vars.map(x=>one(x.name,x.val,"v:"+x.name,T("變數","variable"))).join("");
  B.frames.forEach((f,i)=>{h+=`<div class="grp fn">${T(`函式 ${esc2(f.label)} 的參數・第 ${i+1} 層${i===B.frames.length-1?"（正在執行）":""}`,`Inputs of ${esc2(f.label)} · level ${i+1}${i===B.frames.length-1?" (running)":""}`)}</div>`+
    (f.vars.map(x=>one(x.name,x.val,"p"+i+":"+x.name,T("參數","input"))).join("")||`<div class="empty">${T("（沒有參數）","(no inputs)")}</div>`)});
  h+=B.lists.map(l=>row(l.name,l.items,"l:"+l.name,T("清單","list"))).join("");
  box.innerHTML=h||`<div class="empty">${T("還沒有變數或清單","No variables or lists yet")}</div>`;
  leg.textContent=!h?T("到「變數」、「清單」分類建立一個，就會出現在這裡。","Make one in the Variables or Lists category, and it will appear here."):
    T("閃黃＝這一步被改的格子，藍框＝這一步讀取的格子。清單從第 1 項開始數（C++ 的陣列從 [0] 開始）。","Yellow flash = changed in this step. Blue box = read in this step. List items start at 1 (C++ arrays start at [0]).");
}
