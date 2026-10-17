/* ================= 介面 ================= */
const $=id=>document.getElementById(id);
// Python 課程（網址 ?course=py）：整套換成 js/py/lessons.js 的章節
if(COURSE==="py"){CHAPTERS.length=0;PY_CHAPTERS.forEach(c=>CHAPTERS.push(c))}
CHAPTERS.sort((a,b)=>a.id-b.id);
const ALL=[];CHAPTERS.forEach(ch=>(ch.lessons||[]).forEach(l=>{l.ch=ch;ALL.push(l)}));
// 有預期輸出的課都整理成 tests 清單；題目的第一組測資就是一開始的輸入
ALL.forEach(l=>{
  if(!l.tests&&l.expected!=null)l.tests=[{input:l.input??"",output:l.expected,note:""}];
  if(l.tests&&l.input===undefined)l.input=l.tests[0].input===""?null:l.tests[0].input;
});
applyLang();
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let seen=new Set(store.get(SK+"seen",[]));
const ST={L:null,code:"",input:"",trace:[],error:null,k:0,editing:false,playing:null,ws:false,tab:"mem",edits:{},inputs:{},tis:{},results:{},picks:{},ran:false};

/* ---------- 目錄 ---------- */
function renderNav(){
  let h=`<p class="brand">${COURSE==="py"?T("看得見的 Python","Step Into Python"):T("看得見的 C++","Step Into C++")}</p><p class="brand-sub">${T("每一章先看觀念，再看例題：一步一步看程式怎麼解決問題、變數怎麼變化、OJ 怎麼判。","Each chapter shows the idea first, then examples: watch step by step how a program solves a problem, how variables change, and how the OJ judges it.")}</p>
  <div class="progress">${T("已看過","Viewed")} ${[...seen].filter(id=>ALL.some(l=>l.id===id)).length} / ${ALL.length} ${T("課","lessons")}<div class="bar"><i style="width:${100*seen.size/ALL.length}%"></i></div></div>`;
  let part="";
  for(const ch of CHAPTERS){
    if(ch.part!==part){part=ch.part;h+=`<div class="part">${part}</div>`}
    if(ch.lessons){
      h+=`<div class="ch"><div class="ch-title"><span class="ch-no">${ch.id}</span>${ch.title}</div><ul class="ls">`+
        ch.lessons.map(l=>`<li><button data-l="${l.id}" aria-current="${ST.L&&ST.L.id===l.id}"><span class="lid">${l.id}</span><span>${l.title}</span>${l.example?`<span class="ex-tag">${T("例題","Example")}</span>`:""}${seen.has(l.id)?'<span class="seen">✓</span>':""}</button></li>`).join("")+`</ul>${ch.soon&&ch.soon.length?`<div class="soon-more"><span class="soon-tag">${T("製作中","Coming soon")}</span><ul class="soon-list">${ch.soon.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}</div>`;
    }else{
      h+=`<div class="ch soon"><div class="ch-title"><span class="ch-no">${ch.id}</span>${ch.title}<span class="soon-tag">${T("製作中","Coming soon")}</span></div>`+
        (ch.soon.length?`<ul class="soon-list">${ch.soon.map(s=>`<li>${s}</li>`).join("")}</ul>`:"")+`</div>`;
    }
  }
  // 重畫目錄時保留捲動的位置，點了以後不會跳回最上面；第一次打開時捲到目前這一課
  const nav=$("nav"),keep=nav.scrollTop,first=!nav.dataset.drawn;
  nav.innerHTML=h;nav.dataset.drawn="1";
  if(first){const cur=nav.querySelector('[aria-current="true"]');if(cur)cur.scrollIntoView({block:"center"})}
  else nav.scrollTop=keep;
  $("nav").querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{openLesson(b.dataset.l);setMode("cpp");$("nav").classList.remove("open")});
}

/* ---------- 語法上色 ---------- */
function hl(s){
  if(COURSE==="py")return pyHl(s);
  if(/^\s*#/.test(s))return`<span class="pp">${esc(s)}</span>`;
  const re=/(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*'?)|\b(int|long|double|float|char|bool|string|stack|queue|deque|vector|list|priority_queue|struct|new|delete|void|nullptr|if|else|while|for|break|continue|return|true|false|const|using|namespace)\b|\b(cin|cout|endl|getline|strlen)\b|\b(\d+(?:\.\d+)?)\b/g;
  let o="",last=0,m;
  while((m=re.exec(s))){
    o+=esc(s.slice(last,m.index));
    const c=m[1]?"cm":(m[2]||m[3])?"str":m[4]?"kw":m[5]?"io":"num";
    o+=`<span class="${c}">${esc(m[0])}</span>`;last=re.lastIndex;
  }
  return o+esc(s.slice(last));
}

/* ---------- 開啟課程與執行 ---------- */
function openLesson(id){
  stop();
  const L=ALL.find(l=>l.id===id)||ALL[0];ST.L=L;
  ST.code=ST.edits[L.id]??L.code;ST.input=L.tests?"":ST.inputs[L.id]??(L.input??"");ST.editing=false;
  ST.ran=false;ST.results={};delete ST.tis[L.id];
  seen.add(L.id);store.set(SK+"seen",[...seen]);store.set(SK+"last",L.id);
  const i=ALL.indexOf(L);
  $("crumb").textContent=T(`第 ${L.ch.id} 章・${L.ch.title}・${L.example?"例題 ":""}${L.id}`,`Chapter ${L.ch.id} · ${L.ch.title} · ${L.example?"Example ":""}${L.id}`);
  $("title").textContent=L.title;
  $("goal").textContent=L.goal;$("goal").dataset.label=L.example?T("例題","Example"):T("這一課","This lesson");
  $("task").innerHTML=(L.task?`<div class="task">${esc(L.task)}</div>`:"")+(L.table?`<table class="ptable">${L.table.map((r,i)=>`<tr>${r.map(c=>i?`<td>${esc(c)}</td>`:`<th>${esc(c)}</th>`).join("")}</tr>`).join("")}</table>`:"")+`<div id="tests"></div>`;
  $("tags").innerHTML=`<span class="tag-new">${L.example?T("重點","Key point"):T("新","New")}${T("：",": ")}${esc(L.isNew)}</span>`+(L.uses?`<span class="tag-use">${T("用到：","Uses: ")}${esc(L.uses)}</span>`:"");
  $("prevL").disabled=i===0;$("nextL").disabled=i===ALL.length-1;
  $("inwrap").innerHTML="";
  // 有測資的題目：一打開就先用第 1 筆測資跑，不用再自己按「執行」
  if(L.tests&&!picks().length)picks().push("g0");
  renderNav();renderTests();if(L.tests)runPicked();else rerun();
  document.querySelector("main").scrollTop=0;
}
function rerun(){
  // 有測資的題目：學生選好一筆測資、按「執行」之前，不跑程式
  if(ST.L.tests&&!ST.ran){ST.trace=[];ST.error=null;ST.k=0;updateTests();render(false);return}
  const r=runCode(ST.code,ST.input);
  ST.trace=r.trace;ST.error=r.error||null;ST.k=0;
  updateTests();render(false);
}

/* ---------- 測資：題目給的 + 學生自己設計的 3 筆。一次只選一筆，按「執行」才判題 ---------- */
const MINE_NOTE=()=>T(["例如：一般的情況","例如：剛好在邊界上","例如：最小值、0 或很大的數"],["e.g. a normal case","e.g. right on the edge","e.g. the smallest value, 0, or a very big number"]);
const hasMine=L=>!!(L.example&&L.tests&&L.tests.some(t=>t.input));
function myTests(L){const d=store.get(SK+"mine-"+L.id,null);return Array.isArray(d)&&d.length===3?d:[0,1,2].map(()=>({input:"",output:"",note:""}))}
function testList(L){
  if(!L.tests)return[];
  return[...L.tests.map((t,i)=>({...t,key:"g"+i,label:T(`測資 ${i+1}`,`Test ${i+1}`)})),
    ...(hasMine(L)?myTests(L).map((t,i)=>({...t,key:"m"+i,label:T(`我的 ${i+1}`,`Mine ${i+1}`),mine:true})):[])];
}
function curTest(){const all=testList(ST.L);return all.find(t=>t.key===ST.tis[ST.L.id])||null}
const picks=()=>ST.picks[ST.L.id]||(ST.picks[ST.L.id]=[]);
function judge(r,expected){
  if(r.error)return"CE";const s=r.trace[r.trace.length-1];
  if(!s||s.error)return"RE";
  const a=normLines(s.out),e=normLines(expected);return a.length===e.length&&a.every((x,i)=>x===e[i])?"AC":"WA";
}
function runPicked(){
  const L=ST.L,t=testList(L).find(t=>t.key===picks()[0]);
  if(!t){ST.ran=false;ST.results={};rerun();return}
  const r=runCode(ST.code,t.input);
  ST.results={[t.key]:t.mine&&!t.output.trim()?(r.error?"CE":"—"):judge(r,t.output)};
  ST.ran=true;watchTest(t.key);
}
function watchTest(key){
  const L=ST.L,t=testList(L).find(x=>x.key===key);if(!t)return;
  ST.tis[L.id]=key;ST.input=t.input;ST.inputs[L.id]=ST.input;stop();rerun();
}
const TH=()=>T("<th>選</th><th>測資</th><th>輸入</th><th>預期輸出</th><th>結果</th>","<th>Pick</th><th>Test</th><th>Input</th><th>Expected</th><th>Result</th>");
function renderTests(){
  const L=ST.L,box=$("tests");if(!box)return;
  if(!L.tests){box.innerHTML="";return}
    const pick=k=>`<td class="pick"><input type="radio" name="pick-${L.id}" data-pick="${k}" aria-label="${T("選這筆測資","Pick this test")}"${picks()[0]===k?" checked":""}></td>`;
  const watch=(k,lb)=>`<td class="tlabel">${lb}</td>`;
  let h=`<table class="tests"><thead><tr>${TH()}</tr></thead><tbody>`+
    L.tests.map((t,i)=>`<tr data-row="g${i}">${pick("g"+i)}${watch("g"+i,T(`測資 ${i+1}`,`Test ${i+1}`))}
      <td><pre>${t.input?esc(t.input):`<span class="noinput">${T("（不用輸入）","(no input)")}</span>`}</pre></td><td><pre>${esc(t.output)}</pre></td>
      <td><span class="verdict" data-v="g${i}"></span></td></tr>`+(t.note?`<tr class="subrow" data-sub="g${i}"><td></td><td colspan="4" class="tnote">${esc(t.note)}</td></tr>`:"")).join("")+`</tbody></table>`;
  if(hasMine(L)){
    const ex=i=>L.tests[i%L.tests.length];
    h+=`<div class="mine-head"><b>${T("我的測資","My tests")}</b><span class="hint">${T("自己想 3 組測資：輸入什麼、應該輸出什麼、想測什麼。","Make 3 tests yourself: the input, the right output, and what you want to test.")}</span></div>
    <table class="tests mine"><thead><tr>${TH()}</tr></thead><tbody>`+
      myTests(L).map((t,i)=>`<tr data-row="m${i}">${pick("m"+i)}${watch("m"+i,T(`我的 ${i+1}`,`Mine ${i+1}`))}
        <td><textarea rows="2" spellcheck="false" data-m="${i}" data-f="input" placeholder="${T("例如：","e.g. ")}${esc(ex(i).input)}">${esc(t.input)}</textarea></td>
        <td><textarea rows="2" spellcheck="false" data-m="${i}" data-f="output" placeholder="${T("例如：","e.g. ")}${esc(ex(i).output)}">${esc(t.output)}</textarea></td>
        <td><span class="verdict" data-v="m${i}"></span></td></tr>
        <tr class="subrow" data-sub="m${i}"><td></td><td colspan="4"><input data-m="${i}" data-f="note" aria-label="${T("測試重點","What it tests")}" placeholder="${T("測試重點，","What it tests, ")}${MINE_NOTE()[i]}" value="${esc(t.note).replace(/"/g,"&quot;")}"></td></tr>`).join("")+`</tbody></table>`;
  }
  box.innerHTML=h+`<div class="runbar"><button class="btn primary" id="runTests">${T("▶ 執行這筆測資","▶ Run this test")}</button><span class="hint" id="testsHint"></span></div>`;
  // 換選另一筆：直接用那一筆重新跑（上一筆的結果一起清掉，不會搞混）
  box.querySelectorAll("[data-pick]").forEach(rb=>rb.onchange=()=>{
    const P=picks();P.length=0;P.push(rb.dataset.pick);ST.results={};delete ST.tis[L.id];stop();runPicked();
  });
  box.querySelectorAll("tr[data-row]").forEach(tr=>tr.addEventListener("click",e=>{
    if(e.target.closest("textarea,input"))return;const rb=tr.querySelector("[data-pick]");if(!rb.checked){rb.checked=true;rb.onchange()}
  }));
  $("runTests").onclick=runPicked;
  box.querySelectorAll("[data-m]").forEach(el=>el.addEventListener("input",()=>{
    const d=myTests(L),i=+el.dataset.m;d[i][el.dataset.f]=el.value;store.set(SK+"mine-"+L.id,d);
    if(el.dataset.f!=="note"&&picks()[0]==="m"+i&&ST.ran){ST.ran=false;ST.results={};stop();rerun()}
  }));
}
function updateTests(){
  const box=$("tests");if(!box||!ST.L.tests)return;
  const c=curTest(),custom=ST.ran&&c&&ST.input!==c.input,R=ST.results;
  box.querySelectorAll("[data-row]").forEach(tr=>{const k=tr.dataset.row,on=picks()[0]===k&&!custom;
    tr.classList.toggle("sel",on);const sub=box.querySelector(`[data-sub="${k}"]`);if(sub)sub.classList.toggle("sel",on)});
  box.querySelectorAll("[data-v]").forEach(v=>{const r=R[v.dataset.v]||"";v.textContent=r;v.className="verdict"+(r==="AC"?" ac":r&&r!=="—"?" wa":"")});
  $("runTests").disabled=!picks().length;
  const lb=(testList(ST.L).find(t=>t.key===picks()[0])||{}).label;
  $("testsHint").textContent=!picks().length?T("先選一筆測資，再按「執行」。","Pick a test first, then press Run."):
    custom?T("你改了輸入，現在跑的是自訂輸入。重新選一筆測資就會換回來。","You changed the input, so this is your own input now. Pick a test again to go back."):
    ST.ran?T(`正在看「${lb}」：下面的程式、記憶體、輸出都是這一筆。`,`Watching "${lb}": the code, memory, and output below are for this test.`):T(`選了「${lb}」，按「執行」開始。`,`"${lb}" is picked. Press Run to start.`);
}

/* ---------- 畫面 ---------- */
function render(flash){
  const L=ST.L,N=ST.trace.length,k=ST.k,s=k>0?ST.trace[k-1]:null,nx=k<N?ST.trace[k]:null;
  // 程式碼
  // 改改看：執行／取消／還原的按鈕放在「程式碼」標題列上，程式再長、捲到哪裡都看得到
  const acts=$("editActions"),edited=ST.code!==L.code;
  if(ST.editing){
    if(!$("editor")){
      $("codeArea").innerHTML=`<textarea class="editor" id="editor" spellcheck="false" aria-label="${T("編輯程式碼","Edit the code")}"></textarea>`;
      acts.innerHTML=`<button class="small-btn run" id="runEdit">${T("▶ 執行修改後的程式","▶ Run my changes")}</button><button class="small-btn" id="cancelEdit">${T("取消","Cancel")}</button><button class="small-btn" id="restore">${T("還原","Restore")}</button>`;
      const ed=$("editor");ed.value=ST.code;
      const fit=()=>{ed.style.height="auto";ed.style.height=Math.max(ed.scrollHeight+4,200)+"px"};fit();ed.addEventListener("input",fit);
      const runIt=()=>{ST.code=ed.value;ST.edits[L.id]=ST.code;ST.editing=false;if(L.tests&&picks().length)runPicked();else{ST.ran=false;ST.results={};rerun()}};
      ed.addEventListener("keydown",e=>{
        if(e.key==="Tab"){e.preventDefault();const a=ed.selectionStart;ed.setRangeText("    ",a,ed.selectionEnd,"end")}
        if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();runIt()}
        if(e.key==="Escape"){ST.editing=false;render(false)}
      });
      $("runEdit").onclick=runIt;
      $("cancelEdit").onclick=()=>{ST.editing=false;render(false)};
      $("restore").onclick=()=>{ed.value=L.code;fit();ed.focus()};
      ed.focus();
    }
  }else{
    // 跑的是改過的程式時，標題列提醒一下，也可以一鍵還原
    acts.innerHTML=edited?`<span class="edited-tag">${T("已修改","Edited")}</span><button class="small-btn" id="restoreRun">${T("還原","Restore")}</button>`:"";
    if(edited)$("restoreRun").onclick=()=>{stop();ST.code=L.code;delete ST.edits[L.id];if(L.tests&&picks().length)runPicked();else{ST.ran=false;ST.results={};rerun()}};
    const lines=ST.code.split("\n");let off=0;
    const cur=s?s.line:-1,nxl=nx&&!s?.done?nx.line:-1,bad=ST.error?ST.error.line:-1;
    $("codeArea").innerHTML=`<div class="code">`+lines.map((t,i)=>{
      const n=i+1,ls=off;off+=t.length+1;let c="ln";
      if(n===bad)c+=" bad";else if(n===cur)c+=s.error?" bad":" cur";else if(n===nxl)c+=" nxt";
      let body;
      if(n===cur&&s.span&&s.span[0]>=ls&&s.span[1]<=ls+t.length&&s.span[1]-s.span[0]<t.trim().length){
        const a=s.span[0]-ls,b=s.span[1]-ls;body=hl(t.slice(0,a))+"<mark>"+hl(t.slice(a,b))+"</mark>"+hl(t.slice(b));
      }else body=hl(t);
      return`<div class="${c}"><span class="no">${n}</span><span>${body||" "}</span></div>`;
    }).join("")+`</div>`;
  }
  if(!ST.editing){const cl=$("codeArea").querySelector(".ln.cur,.ln.bad"),box=$("codeArea");
    if(cl&&box.scrollHeight>box.clientHeight){const t=cl.offsetTop-box.offsetTop;if(t<box.scrollTop+20||t>box.scrollTop+box.clientHeight-50)box.scrollTop=t-box.clientHeight/3}}
  $("editBtn").setAttribute("aria-pressed",ST.editing);$("editBtn").hidden=ST.editing;
  // 改程式的時候，一步一步的按鈕用不到，先藏起來，免得看起來能按卻沒反應
  $("ctl").hidden=$("scrubrow").hidden=ST.editing;
  if(ST.editing){
    $("note").innerHTML=T(`<b>✏️ 正在改程式</b><br>改好之後，按「程式碼」右上角的 <b>▶ 執行修改後的程式</b>（或按 <kbd>Ctrl</kbd> + <kbd>Enter</kbd>），就會從頭一步一步執行你改過的程式。<br>不想改了就按「取消」（或 <kbd>Esc</kbd>）；「還原」會變回原本的程式。`,
      `<b>✏️ Editing</b><br>When you are done, press <b>▶ Run my changes</b> at the top right of "Code" (or <kbd>Ctrl</kbd> + <kbd>Enter</kbd>) to run your program step by step.<br>"Cancel" (or <kbd>Esc</kbd>) stops editing; "Restore" brings back the original program.`);
    renderTT();return;
  }
  // 控制
  const dis=!!ST.error||ST.editing;
  $("prev").disabled=dis||k===0;$("reset").disabled=dis||k===0;
  $("next").disabled=$("end").disabled=$("play").disabled=dis||k===N;
  $("scrub").max=N;$("scrub").value=k;$("scrub").disabled=dis;
  const waiting=!!(L.tests&&!ST.ran);
  $("count").textContent=ST.error||waiting?"":T(`第 ${k} / ${N} 步`,`Step ${k} / ${N}`);
  $("play").textContent=ST.playing?T("⏸ 暫停","⏸ Pause"):T("▶ 自動","▶ Auto");
  // 說明
  let note;
  if(ST.error)note=T(`<div class="err"><b>編譯錯誤（第 ${ST.error.line} 行）：</b>${ST.error.msg}</div><div class="hint" style="margin-top:6px">按「改改看」修正後再執行。</div>`,
    `<div class="err"><b>Compile error (line ${ST.error.line}): </b>${ST.error.msg}</div><div class="hint" style="margin-top:6px">Press "Edit", fix it, and run again.</div>`);
  else if(waiting)note=T(`先在上面<b>選一筆測資</b>，再按「▶ 執行這筆測資」。程式會用那一筆測資的輸入來跑。`,`First <b>pick a test</b> above, then press "▶ Run this test". The program will use the input of that test.`);
  else if(k===0)note=COURSE==="py"?T(`按「下一步」開始。程式從第一行開始，一次執行一小步。`,`Press "Next" to start. The program starts at the first line and runs one small step at a time.`):T(`按「下一步」開始。程式從 <code>main</code> 的第一行開始，一次執行一小步。`,`Press "Next" to start. The program starts at the first line of <code>main</code> and runs one small step at a time.`);
  else{
    note=s.note;
    if(L.tips){const lt=ST.code.split("\n")[s.line-1]||"";for(const[m,t]of Object.entries(L.tips))if(lt.includes(m))note+=`<div class="tip">💡 ${t}</div>`}
  }
  // 顏色說明、說明文字、提問都放在同一個固定大小的框裡，畫面才不會跳
  const legend=!ST.error&&k>=1&&k<=2?`<div class="hint" style="margin-bottom:4px">${T("黃色＝剛剛執行的那一行，底線＝那一行裡正在執行的部分，▸＝下一步。","Yellow = the line that just ran. Underline = the part of that line that is running. ▸ = the next step.")}</div>`:"";
  const ask=(k===0&&L.predict&&!ST.error)?`<div class="ask"><b>${T("先猜猜看：","Guess first: ")}</b>${esc(L.predict)}</div>`:(s&&s.done&&L.ask)?`<div class="ask"><b>${T("想一想：","Think about it: ")}</b>${esc(L.ask)}</div>`:"";
  $("note").innerHTML=legend+note+ask;
  (COURSE==="py"?renderPyMem:renderMem)(s,flash);renderTT();renderIO(s,flash);renderJudge(s);renderGraph(L,s);renderDC(L,s);
}

function memLegend(s){
  const prev=ST.k>1?ST.trace[ST.k-2]:null,items=[];
  const fresh=s.vars.filter(v=>!prev||!prev.vars.some(p=>p.id===v.id));
  if(fresh.length){const ts=[...new Set(fresh.map(v=>v.type))].filter(t=>t!=="string");
    const ts2=ts.filter(t=>t!=="struct");if(ts2.length)items.push(T(`每個小格代表 1 byte（${ts2.map(t=>`${TNAME[t]} 佔 ${SIZE[t]} 格`).join("、")}）`,`Each small box is 1 byte (${ts2.map(t=>`${TNAME[t]} uses ${SIZE[t]}`).join(", ")})`))}
  if(s.vars.some(v=>v.init.some(x=>!x)))items.push(T("灰字＝垃圾值（還沒給過值）","Gray = garbage value (no value given yet)"));
  if(s.read.length)items.push(T("藍框＝這一步讀取的格子","Blue box = read in this step"));
  if(s.vars.some(v=>v.type==="ptr"||v.sdef&&v.sdef.fields.some(f=>f.type==="ptr")))items.push(T("箭頭＝指標指向的地方","Arrow = where a pointer points"));
  if(s.vars.some(v=>v.type==="ptr"&&!v.isArr&&v.init[0]&&v.values[0]&&fnOut(s.vars,v.id,v.values[0].id)))items.push(T("粉紅箭頭＝從函式裡指到外面的變數","Pink arrow = from inside a function to a variable outside it"));
  if(s.vars.some(v=>v.plv>1))items.push(T("橘色箭頭＝指向另一個指標（指標的指標）","Orange arrow = points to another pointer (pointer to pointer)"));
  if(s.changed.length)items.push(T("閃黃＝這一步被改的格子","Yellow flash = changed in this step"));
  return T(items.join("。")+(items.length?"。":""),items.join(". ")+(items.length?".":""));
}
// 從函式裡指到外面（main、全域或別的函式）的指標：箭頭換顏色。指到 heap 的不算
let memVars=[];
const fnOut=(vars,sid,tid)=>{const a=vars.find(v=>v.id===sid),b=vars.find(v=>v.id===tid);return!!a&&!!b&&!["main","global","heap"].includes(a.scope)&&b.scope!==a.scope&&b.scope!=="heap"};
function renderMem(s,flash){
  const box=$("mem");$("memLegend").textContent=s&&s.vars.length?memLegend(s):"";
  if(!s||!s.vars.length){box.innerHTML=`<div class="empty">${T("還沒有宣告任何變數","No variables yet")}</div>`;return}
  const ch=new Set(s.changed),rd=new Set(s.read);
  const all=s.vars;memVars=all;const hasG=all.some(v=>v.scope==="global");
  const byName={};all.forEach(v=>{if(!v.isArr)byName[v.name]=v});
  let h="";
  // 呼叫堆疊：全域 → main → 被呼叫的函式（最下面一層是正在執行的）
  const frames=s.frames||[{key:"main",label:"main"}],refs=s.refs||[],multi=hasG||frames.length>1||all.some(v=>v.scope==="heap");
  // 二維陣列：先畫成表格；課程設定 flat 時，下面再畫出它在記憶體裡「攤平」的樣子
  function gridHTML(v){
    const[R,C]=v.dims,mk=(ST.L.markers||{})[v.name]||{},rm=mk.r||[],cm=mk.c||[],flat=!!ST.L.flat;
    const at=(ns,i)=>ns.filter(n=>byName[n]&&byName[n].values[0]===i).join(",");
    const oob=s.oob&&s.oob.id===v.id?s.oob.i:null;
    const cls=f=>{const key=v.id+":"+f;return(flash&&ch.has(key)?" flash":"")+(rd.has(key)?" rd":"")+(v.init[f]?"":" g")+(f===oob?" oob":"")};
    let t=`<table class="grid2"><tr><th></th><th></th>${Array.from({length:C},(_,c)=>`<th class="gcol"><b>${at(cm,c)}</b>[${c}]</th>`).join("")}</tr>`;
    for(let r=0;r<R;r++){
      t+=`<tr><th class="gmk">${at(rm,r)}</th><th class="grow">[${r}]</th>`;
      for(let c=0;c<C;c++){const f=r*C+c;t+=`<td class="gc${cls(f)}"${flat?"":` data-k="${v.id}:${f}"`}>${esc(fmtVal(v.type,v.values[f]))}</td>`}
      t+="</tr>";
    }
    t+="</table>";
    let strip="";
    if(flat){
      let cells="";
      for(let f=0;f<R*C;f++){const r=Math.floor(f/C),c=f%C;
        cells+=`<div class="cell band${r%2}${c===0?" rs":""}${f===R*C-1?" last":""}"><div class="cv${cls(f)}" data-k="${v.id}:${f}">${esc(fmtVal(v.type,v.values[f]))}</div><div class="ci">[${r}][${c}]</div><div class="mk">${c===0?"0x"+(v.addr+f*SIZE[v.type]).toString(16):""}</div></div>`}
      strip=`<div class="flatcap">在記憶體裡，其實是<b>一列接著一列</b>排成一長條（每格 ${SIZE[v.type]} bytes）：</div><div class="arr flat">${cells}</div>`;
    }
    return`<div><div class="arr-head"><div class="addr" title="位址只是示意，真實電腦每次執行都可能不同">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">${TNAME[v.type]}[${R}][${C}]・${R} 列 × ${C} 行</span></div></div>${t}${strip}</div>`;
  }
  // new 出來的空間：從沒有人（heap 裡）指著的節點開始，沿著指標欄位一路排下去
  function heapOrder(hs){
    const by=new Map(hs.map(v=>[v.id,v])),pointed=new Set();
    const nextOf=v=>{if(!v.sdef)return null;const k=v.sdef.fields.findIndex(f=>f.type==="ptr");const q=k>=0&&v.init[k]?v.values[k]:null;return q&&by.get(q.id)||null};
    hs.forEach(v=>{const n=nextOf(v);if(n&&n!==v)pointed.add(n.id)});
    const out=[],done=new Set();
    const walk=v=>{while(v&&!done.has(v.id)){done.add(v.id);out.push(v);v=nextOf(v)}};
    hs.filter(v=>!pointed.has(v.id)).forEach(walk);hs.forEach(walk);
    return out;
  }
  function heapHTML(v){
    if(v.sdef)return structHTML(v);
    const key=v.id+":0",fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"";
    return`<div class="hnode" data-sk="${v.id}:0"><div class="hhead"><span class="nm">${esc(v.name)}</span> <span class="addr">0x${v.addr.toString(16)}</span></div><div class="sbox"><div class="cell last"><div class="cv${fl}${r}${v.init[0]?"":" g"}" data-k="${key}">${esc(fmtVal(v.type,v.values[0]))}</div><div class="ci">${TNAME[v.type]}</div></div></div></div>`;
  }
  // 容器裡的一格：如果放的是指向 struct 的指標，顯示成「→ 它第一個欄位的值」
  const elN=(e,v)=>e==="struct"&&v.esdef?esc(v.esdef.name):TNAME[e];  // 容器裡放的型別名稱（struct / pair 寫出名字）
  const cellTxt=(t,x)=>{if(t==="ptr"){if(x===null)return"nullptr";const o=x&&all.find(q=>q.id===x.id);return o&&o.sdef?"→"+fmtVal(o.sdef.fields[0].type,o.values[0]):fmtVal("ptr",x)}return fmtVal(t,x)};
  // 樹狀圖：每個節點是 struct、有兩個指標欄位（左、右）時，畫成一層一層的樹
  function treeHTML(hs){
    if(!hs.length||!hs.every(v=>v.sdef&&v.sdef.fields.filter(f=>f.type==="ptr").length>=2))return null;
    const by=new Map(hs.map(v=>[v.id,v])),kids=new Map(),pointed=new Set();
    for(const v of hs){
      const ps=v.sdef.fields.map((f,k)=>f.type==="ptr"?k:-1).filter(k=>k>=0).slice(0,2);
      const ks=ps.map(k=>{const q=v.init[k]?v.values[k]:null;return q&&q.id>=0&&by.has(q.id)?by.get(q.id):null});
      kids.set(v.id,ks);ks.forEach(c=>{if(c&&c!==v)pointed.add(c.id)});
    }
    const pos=new Map();let col=0,maxD=0;
    const place=(v,d)=>{if(!v||pos.has(v.id))return;pos.set(v.id,null);const[l,r]=kids.get(v.id);place(l,d+1);pos.set(v.id,{x:col++,d});maxD=Math.max(maxD,d);place(r,d+1)};
    hs.filter(v=>!pointed.has(v.id)).forEach(v=>place(v,0));hs.forEach(v=>place(v,0));
    // 有哪些（不在 heap 裡的）指標變數指著這個節点
    const deep=frames[frames.length-1].key;
    const who=v=>[...all.filter(x=>x.type==="ptr"&&!x.heap&&!x.isArr&&x.init[0]&&x.values[0]&&x.values[0].id===v.id)
        .map(x=>`<span class="${x.scope!=="main"&&x.scope!=="global"&&x.scope!==deep?"old":""}">${esc(x.name)}</span>`),
      ...all.filter(x=>CONTS.includes(x.type)&&!x.isArr&&x.elem==="ptr"&&x.values[0].some(q=>q&&q.id===v.id)).map(x=>`<span class="tin">在 ${esc(x.name)} 裡</span>`)];  // 指著這個節點的指標變數
    const DX=60,DY=76,W=(col-1)*DX+132,H=maxD*DY+66;
    const nodes=hs.map(v=>{const q=pos.get(v.id),sd=v.sdef;
      const cells=sd.fields.map((f,k)=>{const key=v.id+":"+k,fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"",val=v.values[k],isP=f.type==="ptr";
        const txt=!v.init[k]?"?":isP?(val===null?"∅":"●"):fmtVal(f.type,val);
        return`<div class="cell${k===sd.fields.length-1?" last":""}"><div class="cv${fl}${r}${v.init[k]?"":" g"}${isP?" pv":""}" data-k="${key}"${isP&&v.init[k]?pAttr(val):""}>${esc(txt)}</div><div class="ci">${esc(f.name)}</div></div>`}).join("");
      const w=who(v);
      return`<div class="tnode" style="left:${q.x*DX}px;top:${q.d*DY}px"><div class="twho">${w.join("、")||"&nbsp;"}</div><div class="hnode" data-sk="${v.id}:0" title="${esc(v.name)}・0x${v.addr.toString(16)}"><div class="sbox">${cells}</div></div></div>`}).join("");
    return`<div class="tlegend">● 指向一個節點，∅ 是 nullptr（沒有孩子）。節點上面的名字是正在指著它的指標。</div><div class="htree" style="width:${W}px;height:${H}px">${nodes}</div>`;
  }
  // struct：一個元素是一排有名字的格子；struct 陣列一個元素一排
  function structHTML(v){
    const sd=v.sdef,F=sd.fields.length,mk=(ST.L.markers||{})[v.name]||[];
    const markAt=e=>mk.filter(n=>{const x=byName[n];if(!x)return false;const q=x.values[0];return x.type==="ptr"?!!(q&&q.id===v.id&&q.i===e):q===e}).join(",");
    const row=(e,names)=>sd.fields.map((f,k)=>{
      const slot=e*F+k,key=v.id+":"+slot,fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"",val=v.values[slot];
      return`<div class="cell${k===F-1?" last":""}"><div class="cv${fl}${r}${v.init[slot]?"":" g"}${f.type==="ptr"?" pv":""}" data-k="${key}"${f.type==="ptr"&&v.init[slot]?pAttr(val):""}>${esc(fmtVal(f.type,val))}</div>${names?`<div class="ci">.${esc(f.name)}</div>`:""}</div>`}).join("");
    const head=`<div class="arr-head"><div class="addr" title="位址只是示意，真實電腦每次執行都可能不同">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">${esc(sd.name)}${v.isArr?`[${v.len}]`:""}・${v.isArr?"每個 ":""}${sd.size} bytes</span></div></div>`;
    if(v.heap)return`<div class="hnode" data-sk="${v.id}:0"><div class="hhead"><span class="nm">${esc(v.name)}</span> <span class="addr" title="位址只是示意">0x${v.addr.toString(16)}</span></div><div class="sbox">${row(0,true)}</div></div>`;
    if(!v.isArr)return`<div>${head}<div class="sbox" data-sk="${v.id}:0">${row(0,true)}</div></div>`;
    const oob=s.oob&&s.oob.id===v.id?s.oob.i:null;
    let rows="";
    for(let e=0;e<v.len;e++)rows+=`<div class="srow"><div class="sidx">[${e}]<b>${markAt(e)}</b></div><div class="sbox" data-sk="${v.id}:${e}">${row(e,e===0)}</div></div>`;
    if(oob!==null)rows+=`<div class="srow"><div class="sidx oob">[${oob}]<b>${markAt(oob)}</b></div><div class="sbox oob">越界</div></div>`;
    return`<div>${head}${rows}</div>`;
  }
  const names=v=>esc(v.name)+refs.filter(r=>r.tid===v.id).map(r=>`<span class="alias">、${esc(r.name)}${r.frame!==v.scope?`<small>（${esc((frames.find(f=>f.key===r.frame)||{}).label||"")}）</small>`:""}</span>`).join("");
  const hasH=all.some(v=>v.scope==="heap");
  // 指標存的位址 → 畫箭頭用（data-p 指到 data-k / data-sk）
  const pAttr=pt=>pt&&pt.id>=0&&all.some(x=>x.id===pt.id)?` data-p="${pt.id}:${pt.i}"`:"";
  const ptrTxt=v=>(v.psdef?v.psdef.name:TNAME[v.elem])+"*".repeat(v.plv||1);
  for(const grp of [...(hasG?["global"]:[]),...frames.map(f=>f.key),...(hasH?["heap"]:[])]){
    const vs=all.filter(v=>v.scope===grp),rs=refs.filter(r=>r.frame===grp),fi=frames.findIndex(f=>f.key===grp);
    if(grp==="heap"){h+=`<div class="grp heap">heap：用 new 借來的空間（沒有名字，只能靠指標找到）</div>`}
    else if(multi)h+=`<div class="grp${fi>0?" fn":""}">${grp==="global"?T("全域變數（main 外面）","Global variables (outside main)"):fi===0?T("main 的變數","Variables of main"):T(`${esc(frames[fi].label)}() 的變數・呼叫堆疊第 ${fi+1} 層${fi===frames.length-1?"（正在執行）":""}`,`Variables of ${esc(frames[fi].label)}() · call stack level ${fi+1}${fi===frames.length-1?" (running)":""}`)}</div>`;
    for(const r of rs)h+=`<div class="refrow"><code>${esc(r.name)}</code> ${r.arr?"是陣列參數：":r.alias?"是別名（參考）：":"是傳參考（&amp;）："}就是 ${esc(r.targetFrame)} 的 <code>${esc(r.target)}</code>，${r.arr?"同一塊記憶體，沒有複製":"不是另外一個格子"}</div>`;
    if(!vs.length){if(!rs.length)h+=`<div class="empty">${T("（沒有）","(none)")}</div>`;continue}
    if(grp==="heap"){const tr=treeHTML(vs);h+=tr?`<div class="heaprow treerow">${tr}</div>`:`<div class="heaprow">${heapOrder(vs).map(heapHTML).join("")}</div>`;continue}
    for(const v of vs){
      if(v.sdef){h+=structHTML(v);continue}
      if(v.dims){h+=gridHTML(v);continue}
      if(["vector","deque","list"].includes(v.type)&&!v.isArr){
        const a=v.values[0],base=v.id+":k",all0=ch.has(base),rd0=rd.has(base),mk=(ST.L.markers||{})[v.name]||[];
        const markAt=i=>mk.filter(n=>byName[n]&&byName[n].values[0]===i).join(",");
        const cellHtml=(x,key,i,last,lab)=>{const fl=flash&&(all0||ch.has(key))?" flash":"",r=rd0||rd.has(key)?" rd":"";
          return`<div class="cell${last?" last":""}"><div class="cv${fl}${r}">${esc(fmtVal(v.elem==="vector"?v.elem2:v.elem,x))}</div><div class="ci">${lab}</div><div class="mk">${i===null?"":markAt(i)}</div></div>`};
        const tn=v.elem==="vector"?`vector&lt;${elN(v.elem2,v)}&gt;`:elN(v.elem,v);
        let body;
        if(v.elem==="vector"){
          // 二維 vector：一列畫一行，每一列可以不一樣長
          body=a.length?a.map((row,r)=>{const rk=base+r,rf=flash&&(all0||ch.has(rk))?" flash":"";
            const cells=row.length?row.map((x,c)=>cellHtml(x,rk+"_"+c,null,c===row.length-1,`[${c}]`)).join(""):`<div class="cell last"><div class="cv${rf}" style="min-width:4em">空的</div><div class="ci">&nbsp;</div></div>`;
            return`<div class="vrow"><span class="vrl${rf}">${esc(v.name)}[${r}]</span><div class="arr">${cells}</div><span class="vrn">${row.length} 個</span></div>`}).join(""):`<div class="arr"><div class="cell last"><div class="cv${flash&&all0?" flash":""}" style="min-width:5em">空的</div><div class="ci">&nbsp;</div></div></div>`;
        }else{
          const lab=i=>v.type==="vector"?`[${i}]`:v.type==="deque"?[i===0?"front":"",i===a.length-1?"back":""].filter(Boolean).join(" / ")||`[${i}]`:[i===0?"front":"",i===a.length-1?"back":""].filter(Boolean).join(" / ")||"&nbsp;";
          const cells=a.map((x,i)=>cellHtml(x,base+i,i,i===a.length-1,lab(i))+(v.type==="list"&&i<a.length-1?`<div class="lnk">→</div>`:"")).join("");
          body=`<div class="arr${v.type==="list"?" list":""}">${a.length?cells:`<div class="cell last"><div class="cv${flash&&all0?" flash":""}" style="min-width:5em">空的</div><div class="ci">&nbsp;</div></div>`}</div>`;
        }
        const note=v.type==="vector"?(v.elem==="vector"?`${a.length} 列`:`size = ${a.length}`):v.type==="deque"?`${a.length} 個・兩頭都能進出`:`${a.length} 個・一個接一個`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">${v.type}&lt;${tn}&gt;・${note}</span></div></div>${body}</div>`;
        continue;
      }
      if(v.type==="priority_queue"&&!v.isArr){
        const a=v.values[0],all0=ch.has(v.id+":0"),rd0=rd.has(v.id+":0"),mn=v.elem2==="min";
        let cells=a.map((x,i)=>{const k=v.id+":k"+i,fl=flash&&(all0||ch.has(k))?" flash":"",r=rd0||rd.has(k)?" rd":"";
          return`<div class="cell${i===a.length-1?" last":""}"><div class="cv${fl}${r}">${esc(cellTxt(v.elem,x))}</div><div class="ci">&nbsp;</div><div class="mk">${i===0?"top":""}</div></div>`}).join("");
        if(!a.length)cells=`<div class="cell last"><div class="cv${flash&&all0?" flash":""}" style="min-width:5em">空的</div><div class="ci">&nbsp;</div></div>`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">priority_queue&lt;${elN(v.elem,v)}&gt;・${a.length} 個・最${mn?"小":"大"}的在最前面</span></div></div><div class="arr">${cells}</div></div>`;
        continue;
      }
      if(v.type==="queue"&&!v.isArr){
        const a=v.values[0],all0=ch.has(v.id+":0"),rd0=rd.has(v.id+":0");
        let cells=a.map((x,i)=>{const k=v.id+":k"+i,fl=flash&&(all0||ch.has(k))?" flash":"",r=rd0||rd.has(k)?" rd":"";
          const lb=[i===0?"front":"",i===a.length-1?"back":""].filter(Boolean).join(" / ");
          return`<div class="cell${i===a.length-1?" last":""}"><div class="cv${fl}${r}">${esc(cellTxt(v.elem,x))}</div><div class="ci">&nbsp;</div><div class="mk">${lb}</div></div>`}).join("");
        if(!a.length)cells=`<div class="cell last"><div class="cv${flash&&all0?" flash":""}" style="min-width:5em">空的</div><div class="ci">&nbsp;</div></div>`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">queue&lt;${elN(v.elem,v)}&gt;・${a.length} 個・← 從左邊出去，從右邊進來 ←</span></div></div><div class="arr">${cells}</div></div>`;
        continue;
      }
      if(v.type==="stack"&&!v.isArr){
        // 直的畫：最上面（top）在上面，最下面是底
        const a=v.values[0],all0=ch.has(v.id+":0"),rd0=rd.has(v.id+":0");
        let cells="";
        for(let i=a.length-1;i>=0;i--){const k=v.id+":k"+i,fl=flash&&(all0||ch.has(k))?" flash":"",r=rd0||rd.has(k)?" rd":"";
          cells+=`<div class="srow"><span class="stag">${i===a.length-1?"top →":""}</span><div class="cv${fl}${r}">${esc(cellTxt(v.elem,a[i]))}</div><span class="stag">${i===0&&a.length>1?"← 底":""}</span></div>`}
        if(!a.length)cells=`<div class="srow"><span class="stag"></span><div class="cv empty${flash&&all0?" flash":""}">空的</div><span class="stag"></span></div>`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">stack&lt;${elN(v.elem,v)}&gt;・${a.length} 個</span></div></div><div class="vstack">${cells}<div class="sbase"></div></div></div>`;
        continue;
      }
      if(v.type==="string"&&!v.isArr){
        const str=v.values[0],all0=ch.has(v.id+":0"),rd0=rd.has(v.id+":0"),mk=(ST.L.markers||{})[v.name]||[];
        const markAt=i=>mk.filter(n=>byName[n]&&byName[n].values[0]===i).join(",");
        let cells="";
        for(let i=0;i<str.length&&i<60;i++){const k=v.id+":c"+i,fl=flash&&(all0||ch.has(k))?" flash":"",r=rd0||rd.has(k)?" rd":"";
          cells+=`<div class="cell${i===str.length-1?" last":""}"><div class="cv${fl}${r}">${esc(charLit(str.charCodeAt(i)))}</div><div class="ci">[${i}]</div><div class="mk">${markAt(i)}</div></div>`}
        if(!str.length)cells=`<div class="cell last"><div class="cv${flash&&all0?" flash":""}" style="min-width:5em">空字串</div><div class="ci">&nbsp;</div></div>`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意，真實電腦每次執行都可能不同">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${esc(v.name)}</span> <span class="ty">string・長度 ${str.length}</span></div></div><div class="arr">${cells}</div></div>`;
        continue;
      }
      if(!v.isArr){
        const key=v.id+":0",fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"",g=!v.init[0];
        const pt=v.type==="ptr"?v.values[0]:undefined,pTarget=pt===undefined?"":pt===null?"不指向任何東西":pt.id<0?"亂指（野指標）":(()=>{const t=all.find(x=>x.id===pt.id);return t?`指向 ${t.dims?`${t.name}[${Math.floor(pt.i/t.dims[1])}][${pt.i%t.dims[1]}]`:t.isArr?`${t.name}[${pt.i}]`:t.name}`:"指向已收回的空間（懸空指標）"})();
        const extra=v.type==="char"?` ・ ASCII ${v.values[0]}`:v.type==="string"?T(` ・ 長度 ${v.values[0].length}`,` · length ${v.values[0].length}`):v.type==="ptr"&&v.init[0]?` ・ <b>${esc(pTarget)}</b>`:"";
        h+=`<div class="var"><div class="addr" title="${T("位址只是示意，真實電腦每次執行都可能不同","The address is only an example. A real computer may use a different one each time.")}">0x${v.addr.toString(16)}</div>
          <div class="box${fl}${r}" data-k="${key}"${v.type==="ptr"?pAttr(pt):""} style="--n:${Math.min(SIZE[v.type],8)}">${"<span></span>".repeat(Math.min(SIZE[v.type],8))}<div class="val${g?" g":""}">${esc(fmtVal(v.type,v.values[0]))}</div></div>
          <div class="meta"><div class="nm">${names(v)}${g?`<span class="gtag">${T("垃圾值","garbage")}</span>`:""}</div><div class="ty">${v.type==="ptr"?ptrTxt(v):TNAME[v.type]}・${SIZE[v.type]} byte${SIZE[v.type]>1?"s":""}${extra}</div></div></div>`;
      }else{
        const mk=(ST.L.markers||{})[v.name]||[];
        const oob=s.oob&&s.oob.id===v.id?s.oob.i:null;
        const show=Math.min(v.len,60);
        let cells="";
        const markAt=i=>mk.filter(n=>{const x=byName[n];if(!x)return false;const q=x.values[0];return x.type==="ptr"?!!(q&&q.id===v.id&&q.i===i):q===i}).join(",");
        for(let i=0;i<show;i++){
          const key=v.id+":"+i,fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"";
          cells+=`<div class="cell${i===show-1&&oob===null?" last":""}"><div class="cv${fl}${r}${v.init[i]?"":" g"}" data-k="${key}">${esc(fmtVal(v.type,v.values[i]))}</div><div class="ci">[${i}]</div><div class="mk">${markAt(i)}</div></div>`;
        }
        if(v.len>show)cells+=`<div class="cell last"><div class="cv">…</div><div class="ci">共 ${v.len} 格</div></div>`;
        if(oob!==null)cells+=`<div class="cell oob"><div class="cv">?</div><div class="ci">[${oob}]</div><div class="mk">${markAt(oob)}</div></div>`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意，真實電腦每次執行都可能不同">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${names(v)}</span> <span class="ty">${TNAME[v.type]}[${v.len}]・${T(`每格 ${SIZE[v.type]} bytes`,`${SIZE[v.type]} bytes each`)}</span></div></div><div class="arr">${cells}</div></div>`;
      }
    }
  }
  box.innerHTML=h;
  // 攤平的長條太長時，捲到這一步有動到的那一格
  box.querySelectorAll(".arr.flat").forEach(st=>{const c=st.querySelector(".cv.oob,.cv.flash,.cv.rd")||[...st.querySelectorAll(".cv")].find(x=>box.querySelector(`[data-p="${x.dataset.k}"]`));if(c)st.scrollLeft=Math.max(0,c.parentElement.offsetLeft-st.offsetLeft-st.clientWidth/2)});
  drawArrows();
  // 陣列太長的時候，橫向捲到有標記（例如 i、k）或剛被改的那一格
  box.querySelectorAll(".arr").forEach(a=>{
    if(a.scrollWidth<=a.clientWidth)return;
    const c=[...a.querySelectorAll(".cell")].find(c=>c.querySelector(".cv.flash"))||[...a.querySelectorAll(".cell")].find(c=>(c.querySelector(".mk")||{}).textContent);
    if(c&&(c.offsetLeft<a.scrollLeft||c.offsetLeft+c.offsetWidth>a.scrollLeft+a.clientWidth))a.scrollLeft=Math.max(0,c.offsetLeft-a.clientWidth/2);
  });
  // 呼叫堆疊很深的時候，捲到正在執行的那一層
  const cur=[...box.querySelectorAll(".grp.fn")].pop();
  // 但如果函式拿到的是陣列（同一塊記憶體），陣列畫在上面，這時候不要捲走，讓陣列一直看得到
  const arrParam=(s.refs||[]).some(r=>r.arr);
  if(cur&&!arrParam&&box.scrollHeight>box.clientHeight)box.scrollTop=Math.max(0,cur.offsetTop-box.offsetTop-6);
  else if(arrParam)box.scrollTop=0;
  // 有樹狀圖的時候，捲到樹那裡（指標變數的名字已經標在節點上面了）
  const tr=box.querySelector(".htree");
  if(tr&&box.scrollHeight>box.clientHeight)box.scrollTop=Math.max(0,tr.offsetTop-box.offsetTop-44);
  // 二維表格很大的時候（例如 DP 表格），這一步改到或讀到的格子跑出畫面，就捲過去
  const gc=!tr&&!(cur&&!arrParam)&&(box.querySelector("table.grid2 td.flash")||box.querySelector("table.grid2 td.rd"));
  if(gc){
    const B=box.getBoundingClientRect(),G=gc.getBoundingClientRect(),y=G.top-B.top+box.scrollTop;
    if(box.scrollHeight>box.clientHeight&&(y<box.scrollTop+30||y+G.height>box.scrollTop+box.clientHeight-10))box.scrollTop=Math.max(0,y-box.clientHeight/2);
    let w=gc.closest("table").parentElement;while(w&&w!==box&&w.scrollWidth<=w.clientWidth)w=w.parentElement;
    if(w&&w!==box){const W=w.getBoundingClientRect(),x=gc.getBoundingClientRect().left-W.left+w.scrollLeft;
      if(x<w.scrollLeft+40||x+G.width>w.scrollLeft+w.clientWidth-10)w.scrollLeft=Math.max(0,x-w.clientWidth/2)}
  }
}

// 指標箭頭：從存位址的格子，畫到它指向的格子（或整個 struct）
function drawArrows(){
  if(COURSE==="py"){pyArrows($("mem"));return}   // Python：名字 → 物件的箭頭
  const box=$("mem");const old=box.querySelector("svg.arrows");if(old)old.remove();
  const srcs=[...box.querySelectorAll("[data-p]")];if(!srcs.length||!box.offsetParent)return;
  const B=box.getBoundingClientRect(),ox=box.scrollLeft-B.left,oy=box.scrollTop-B.top;
  // 右邊的走道：所有格子最右邊再往右一點，往 heap 的箭頭從這裡往下走
  const gut=Math.max(...[...box.querySelectorAll(".box,.sbox")].filter(e=>!e.closest(".heaprow")).map(e=>e.getBoundingClientRect().right))+ox+16;
  let paths="",nk=0;
  for(const s of srcs){
    const t=box.querySelector(`[data-sk="${s.dataset.p}"]`)||box.querySelector(`[data-k="${s.dataset.p}"]`);if(!t)continue;
    const a=s.getBoundingClientRect(),b=t.getBoundingClientRect(),k=nk++;
    // 指向「指標」的箭頭（指標的指標）換一個顏色，比較容易分開看
    // 顏色：從函式指到外面的是粉紅（優先），指向另一個指標的是橘色
    const tp=!!t.dataset.p&&t.matches(".box"),out=fnOut(memVars,+(s.dataset.k||"").split(":")[0],+s.dataset.p.split(":")[0]);
    const cls=out?"ln ln3":tp?"ln ln2":"ln",dc=out?' class="d3"':tp?' class="d2"':"";
    let x1=a.right+ox-4;const y1=a.top+a.height/2+oy;
    const stacked=t.matches(".box")||t.dataset.sk&&!t.closest(".heaprow"),toHeap=!!t.closest(".heaprow")&&!s.closest(".heaprow");
    let d;
    if(s.closest(".htree")&&t.closest(".htree")){
      const sx=a.left+a.width/2+ox,sy=a.bottom+oy-2,x2=b.left+b.width/2+ox,y2=b.top+oy-1,k=Math.max(16,(y2-sy)/2);
      d=`M${sx},${sy} C${sx},${sy+k} ${x2},${y2-k} ${x2},${y2}`;
      paths+=`<path class="ln" d="${d}"/><circle cx="${sx}" cy="${sy}" r="3"/>`;continue;
    }
    if(s.matches(".box")&&stacked&&tp&&!(b.top<a.bottom-4&&b.bottom>a.top+4)){
      // 指標的指標 → 指標：走右邊，跟左邊那條「指標 → 變數」的箭頭分開，不會交叉
      const x2=b.right+ox+1,y2=b.top+b.height/2+oy,cx=Math.max(a.right,b.right)+ox+26;
      d=`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }else if(s.matches(".box")&&stacked&&!(b.top<a.bottom-4&&b.bottom>a.top+4)){
      // 上下排的變數：從左邊（位址旁的空隙）繞過去，不會蓋到變數名稱
      x1=a.left+ox+4;const x2=b.left+ox-1,y2=b.top+b.height/2+oy,lx=Math.min(a.left,b.left)+ox-14-5*(k%3);
      d=`M${x1},${y1} C${lx},${y1} ${lx},${y2} ${x2},${y2}`;
    }else if(toHeap){
      // 往 heap：先往右走到走道，沿著走道往下，再從上面進到節點
      const gx=Math.max(gut,x1+12)+7*(k%5),x2=b.left+Math.min(b.width/2,34)+ox,below=b.top>=a.bottom-4,y2=(below?b.top-1:b.bottom+1)+oy,sg=below?1:-1;
      d=`M${x1},${y1} C${gx},${y1} ${gx},${y1} ${gx},${y1+14*sg} L${gx},${y2-34*sg} C${gx},${y2-12*sg} ${x2},${y2-30*sg} ${x2},${y2}`;
    }else if(b.top<a.bottom-4&&b.bottom>a.top+4){
      // 同一排：在右邊就直直畫過去，在左邊（或指向自己）就從下面繞回來
      const y2=b.top+b.height/2+oy;
      if(b.left+ox>x1+8){const x2=b.left+ox-1,m=(x1+x2)/2;d=`M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`}
      else{const x2=b.left+ox+10,y3=b.bottom+oy+1,low=Math.max(a.bottom,b.bottom)+oy+34;d=`M${x1},${y1} C${x1+40},${y1} ${x1+30},${low} ${(x1+x2)/2},${low} S${x2},${y3+30} ${x2},${y3}`}
    }else if(t.matches(".box")||t.dataset.sk&&!t.closest(".heaprow")){
      // 一般變數、struct：從右邊繞過去，箭頭從右邊進去
      const x2=b.right+ox+1,y2=b.top+b.height/2+oy,cx=Math.max(a.right,b.right)+ox+22+Math.min(50,Math.abs(y2-y1)*.12);
      d=`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }else if(s.matches(".box")&&t.closest(".cell")){
      // 指標 → 陣列的某一格：從指標格子的上緣（或下緣）直直接到那一格的下面（或上面）
      const cell=t.closest(".cell").getBoundingClientRect(),below=b.top>=a.bottom-4,x2=b.left+b.width/2+ox;
      const sx=Math.min(Math.max(x2,a.left+ox+18),a.right+ox-18),sy=(below?a.bottom:a.top)+oy,y2=(below?b.top-1:cell.bottom+1)+oy,k=Math.max(14,Math.abs(y2-sy)/2);
      x1=sx;d=`M${sx},${sy} C${sx},${below?sy+k:sy-k} ${x2},${below?y2-k:y2+k} ${x2},${y2}`;
      paths+=`<path class="ln" d="${d}"/><circle cx="${sx}" cy="${sy}" r="3.5"/>`;continue;
    }else{
      // 陣列的格子、heap 的節點：從上面或下面進去
      const below=b.top>=a.bottom-4,x2=b.left+Math.min(b.width/2,34)+ox,y2=(below?b.top-1:b.bottom+1)+oy,k=Math.max(30,Math.abs(y2-y1)/2);
      d=`M${x1},${y1} C${x1+50},${y1} ${x2},${below?y2-k:y2+k} ${x2},${y2}`;
    }
    paths+=`<path class="${cls}" d="${d}"/><circle${dc} cx="${x1}" cy="${y1}" r="3.5"/>`;
  }
  box.insertAdjacentHTML("beforeend",`<svg class="arrows" width="${box.scrollWidth}" height="${box.scrollHeight}" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="d2" d="M0,0 L10,5 L0,10 z"/></marker><marker id="ah3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="d3" d="M0,0 L10,5 L0,10 z"/></marker></defs>${paths}</svg>`);
}
addEventListener("resize",()=>drawArrows());
function renderTT(){
  const k=ST.k,TR=ST.trace;
  if(!k){$("tt").innerHTML=`<div class="empty">${T("開始執行後，這裡會列出每一步的變數值。","After the program starts, this table lists the variables at each step.")}</div>`;return}
  const cols=[];const seenC=new Set();
  for(let i=0;i<k;i++)for(const v of TR[i].vars){
    if(v.isArr||v.heap)continue;
    const cs=v.sdef?v.sdef.fields.map((f,fi)=>({name:v.name,fi,ft:f.type,label:v.name+"."+f.name})):[{name:v.name,fi:null,label:v.name}];
    for(const c of cs)if(!seenC.has(c.label)){seenC.add(c.label);cols.push(c)}
  }
  let h=`<table class="tt"><thead><tr><th>${T("步","Step")}</th><th>${T("行","Line")}</th>${cols.map(c=>`<th>${esc(c.label)}</th>`).join("")}<th style="text-align:left">${T("印出","Output")}</th></tr></thead><tbody>`;
  const from=Math.max(0,k-300);
  for(let i=from;i<k;i++){
    const s=TR[i],ch=new Set(s.changed),prev=i?TR[i-1].out:"";
    const o=s.out.slice(prev.length).replace(/ /g,"␣").replace(/\n/g,"↵");
    h+=`<tr${i===k-1?' class="now"':""}><td>${i+1}</td><td>${s.line||""}</td>`+cols.map(c=>{
      let v=null;for(const x of s.vars)if(!x.isArr&&!x.heap&&x.name===c.name&&!!x.sdef===(c.fi!==null))v=x;
      if(!v)return"<td></td>";
      const j=c.fi??0,t=c.fi!==null?c.ft:v.type;
      return`<td${ch.has(v.id+":"+j)?' class="ch"':""}>${esc(v.init[j]?fmtVal(t,v.values[j]):"?")}</td>`;
    }).join("")+`<td class="o">${esc(o)}</td></tr>`;
  }
  $("tt").innerHTML=h+"</tbody></table>";
  const w=$("tt");w.scrollTop=w.scrollHeight;
}

function wsVis(t){return esc(t).replace(/ /g,'<span class="wsv">␣</span>').replace(/\n/g,'<span class="wsv">↵</span>\n')}
function renderIO(s,flash){
  const L=ST.L;const usesCin=(COURSE==="py"?/\binput\s*\(/:/\bcin\b/).test(ST.code);
  if(L.tests&&!ST.ran){$("inwrap").innerHTML=`<p class="noinput">${T("執行之後，這裡會顯示那一筆測資的輸入。","After you run a test, its input is shown here.")}</p>`}
  else if(L.input===null&&!usesCin&&!ST.input){$("inwrap").innerHTML=`<p class="noinput">${COURSE==="py"?T("這個程式沒有用到 input()，不需要輸入。","This program does not use input(), so it needs no input."):T("這個程式沒有用到 cin，不需要輸入。","This program does not use cin, so it needs no input.")}</p>`}
  else{
    if(!$("stdin")){
      $("inwrap").innerHTML=`<textarea class="stdin" id="stdin" rows="2" spellcheck="false" aria-label="${T("程式的輸入","Program input")}"></textarea><div class="hint">${T("可以直接修改，改完會從頭執行。","You can change it. The program will run again from the start.")}</div><div class="buf" id="buf"></div><div id="failtag"></div>`;
      $("stdin").addEventListener("input",e=>{ST.input=e.target.value;ST.inputs[L.id]=ST.input;stop();rerun()});
    }
    if($("stdin").value!==ST.input)$("stdin").value=ST.input;
    const pos=s?s.pos:0,lr=s&&s.lastRead;let b="";const inp=ST.input;
    for(let i=0;i<inp.length&&i<600;i++){
      const c=inp[i];const ws=c===" "||c==="\n"||c==="\t";
      let cls=ws?"ws":"";if(i<pos)cls+=" used";if(lr&&i>=lr[0]&&i<lr[1])cls+=" got";if(i===pos)cls+=" cur";
      b+=`<span class="${cls}">${c===" "?"␣":c==="\n"?"↵":c==="\t"?"⇥":esc(c)}</span>`+(c==="\n"?"<br>":"");
    }
    b+=`<span class="${pos>=inp.length?"cur":""}"> </span><span class="eof">${pos>=inp.length&&inp.length?T("（已讀完）","(all read)"):""}</span>`;
    $("buf").innerHTML=inp.length?b:`<span class="noinput">${T("（輸入是空的）","(the input is empty)")}</span>`;
    $("failtag").innerHTML=s&&s.fail?`<span class="failtag">${T("cin 已經處於失敗狀態","cin is in a failed state")}</span>`:"";
  }
  const out=s?s.out:"",prevOut=ST.k>1?ST.trace[ST.k-2].out:"";
  const fresh=flash&&out.length>prevOut.length&&out.startsWith(prevOut);
  const show=t=>ST.ws?wsVis(t):esc(t);
  $("console").innerHTML=fresh?show(prevOut)+`<span class="new">${show(out.slice(prevOut.length))}</span>`:show(out);
  $("wsBtn").setAttribute("aria-pressed",ST.ws);
}

function normLines(t){const a=t.split("\n").map(l=>l.replace(/[ \t\r]+$/,""));while(a.length&&a[a.length-1]==="")a.pop();return a}
function renderJudge(s){
  const c=curTest(),j=$("judge");
  if(!ST.L.tests){j.hidden=true;return}
  if(!ST.ran||!c){j.hidden=false;j.innerHTML=`<div class="ph"><h2>${T("判題","Judge")}</h2></div><span class="verdict wait">${T("還沒執行","Not run yet")}</span>`;return}
  j.hidden=false;const head=`<div class="ph"><h2>${c.label} ${T("判題","judge")}</h2></div>`;
  if(c.mine&&!c.output.trim()&&ST.input===c.input){j.innerHTML=`${head}<span class="verdict wait">${T("沒有填預期輸出，只執行、不判題","No expected output, so it only runs and is not judged")}</span>`;return}
  if(ST.input!==c.input){j.innerHTML=`<div class="ph"><h2>${T("判題","Judge")}</h2></div><span class="verdict wait">${T("自訂輸入沒有預期輸出，不判題","Your own input has no expected output, so it is not judged")}</span>`;return}
  if(!s||!s.done){j.innerHTML=`${head}<span class="verdict wait">${T("程式執行完才會判題","It is judged when the program ends")}</span><div class="hint" style="margin-top:6px">${T("可以按「到最後」直接看結果。","Press \"To end\" to see the result now.")}</div>`;return}
  const a=normLines(s.out),e=normLines(c.output);
  let first=-1;for(let i=0;i<Math.max(a.length,e.length);i++)if(a[i]!==e[i]){first=i;break}
  const re=!!s.error;const ok=!re&&first<0;
  const lines=(arr,mark)=>arr.map((l,i)=>`<span${i===first&&mark?' class="bad"':""}>${wsVis(l)||" "}</span>`).join("\n");
  j.innerHTML=`${head}
    <span class="verdict ${ok?"ac":"wa"}">${ok?T("AC 通過","AC Accepted"):re?T("RE 執行錯誤","RE Runtime error"):T("WA 答案錯誤","WA Wrong answer")}</span>
    ${ok?"":re?"":`<span class="hint" style="margin-left:8px">${T(`第 ${first+1} 行開始不一樣`,`Different from line ${first+1}`)}</span>`}
    <div class="cmp"><div><div class="hint">${T("你的輸出","Your output")}</div><pre>${lines(a,true)}</pre></div><div><div class="hint">${T("正確答案","Correct answer")}</div><pre>${lines(e,true)}</pre></div></div>
    ${ok||re?"":`<div class="hint" style="margin-top:6px">${T("多數 OJ 會忽略行尾空白和最後的空行，但多印、少印任何文字都會判錯。","Most OJs ignore spaces at the end of a line and empty lines at the end. But any extra or missing text is wrong.")}</div>`}`;
}

/* ---------- 操作 ---------- */
function go(k,flash){ST.k=Math.max(0,Math.min(ST.trace.length,k));render(flash)}
function stop(){if(ST.playing){clearInterval(ST.playing);ST.playing=null;$("play").textContent=T("▶ 自動","▶ Auto")}}
$("next").onclick=()=>go(ST.k+1,true);
$("prev").onclick=()=>{stop();go(ST.k-1,false)};
$("reset").onclick=()=>{stop();go(0,false)};
$("end").onclick=()=>{stop();go(ST.trace.length,false)};
$("scrub").oninput=e=>{stop();go(+e.target.value,false)};
$("play").onclick=()=>{
  if(ST.playing){stop();render(false);return}
  ST.playing=setInterval(()=>{if(ST.k>=ST.trace.length){stop();render(false);return}go(ST.k+1,true)},650);render(false);
};
$("editBtn").onclick=()=>{stop();ST.editing=!ST.editing;render(false)};
$("wsBtn").onclick=()=>{ST.ws=!ST.ws;render(false)};
$("tabMem").onclick=()=>{$("memView").hidden=false;$("ttView").hidden=true;$("tabMem").setAttribute("aria-pressed","true");$("tabTT").setAttribute("aria-pressed","false");drawArrows()};
$("tabTT").onclick=()=>{$("memView").hidden=true;$("ttView").hidden=false;$("tabMem").setAttribute("aria-pressed","false");$("tabTT").setAttribute("aria-pressed","true");renderTT()};
$("prevL").onclick=()=>{const i=ALL.indexOf(ST.L);if(i>0)openLesson(ALL[i-1].id)};
$("nextL").onclick=()=>{const i=ALL.indexOf(ST.L);if(i<ALL.length-1)openLesson(ALL[i+1].id)};
$("menu").onclick=()=>$("nav").classList.toggle("open");
// 寬螢幕：整個左側目錄收合／展開，記住上次的狀態
function setNavHidden(h){
  document.querySelector(".app").classList.toggle("nav-hidden",h);
  $("navToggle").setAttribute("aria-expanded",!h);$("navToggle").title=h?T("展開目錄","Show lessons"):T("收合目錄","Hide lessons");
  store.set("ckviz-nav-hidden",h);
}
setNavHidden(store.get("ckviz-nav-hidden",false));
// 拖拉目錄右緣（或把手）調整寬度，字體會跟著變大變小；拉得太窄就直接收合
const NAV_MIN=200,NAV_FOLD=140;
const navMax=()=>Math.min(600,Math.round(innerWidth*.6));
function setNavWidth(w,save=true){
  w=Math.max(NAV_MIN,Math.min(navMax(),Math.round(w)));
  document.querySelector(".app").style.setProperty("--nav-w",w+"px");
  if(save)store.set("ckviz-nav-w",w);
}
setNavWidth(store.get("ckviz-nav-w",280),false);
let navDragged=false;
function startNavDrag(e){
  if(e.button!==0)return;
  const app=document.querySelector(".app"),x0=e.clientX,el=e.currentTarget;
  navDragged=false;el.setPointerCapture(e.pointerId);
  const move=ev=>{
    if(!navDragged&&Math.abs(ev.clientX-x0)<4)return; // 小於 4px 當成點一下
    navDragged=true;app.classList.add("nav-dragging");
    const x=ev.clientX-app.getBoundingClientRect().left;
    if(x<NAV_FOLD){setNavHidden(true);return}
    if(app.classList.contains("nav-hidden"))setNavHidden(false);
    setNavWidth(x);
  };
  const up=()=>{app.classList.remove("nav-dragging");if(navDragged)drawArrows();if(el.id!=="navToggle")navDragged=false;el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up)};
  el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
}
$("navToggle").addEventListener("pointerdown",startNavDrag);
$("navResizer").addEventListener("pointerdown",startNavDrag);
$("navResizer").ondblclick=()=>setNavWidth(280); // 雙擊右緣回到預設寬度
$("navToggle").onclick=()=>{
  if(navDragged){navDragged=false;return} // 剛拖完放開，不要順便收合
  setNavHidden(!document.querySelector(".app").classList.contains("nav-hidden"));
};
addEventListener("resize",()=>{if(innerWidth>860)setNavWidth(store.get("ckviz-nav-w",280),false)});
document.addEventListener("keydown",e=>{
  if(/TEXTAREA|INPUT/.test(e.target.tagName))return;
  if(e.key==="ArrowRight"&&!$("next").disabled){e.preventDefault();$("next").click()}
  if(e.key==="ArrowLeft"&&!$("prev").disabled){e.preventDefault();$("prev").click()}
});
/* ---------- 模式切換：C++ / 流程圖 ----------
   流程圖模式先暫停（index.html 裡的按鈕和 flowView 也註解掉了）。要恢復時，把下面這段和 index.html 的註解拿掉，
   再刪掉暫時用的 setMode。
const FLOW_URL="https://franktang0512.github.io/flowchart/";
function setMode(m){
  stop();
  const flow=m==="flow";
  $("cppView").hidden=flow;$("flowView").hidden=!flow;
  $("modeCpp").setAttribute("aria-pressed",!flow);$("modeFlow").setAttribute("aria-pressed",flow);
  if(flow&&!$("flowFrame").src)$("flowFrame").src=FLOW_URL;
  store.set("ckviz-mode",m);
}
$("modeCpp").onclick=()=>setMode("cpp");
$("modeFlow").onclick=()=>setMode("flow");
*/
// 暫時用的 setMode：只有 C++ 模式
function setMode(){$("cppView").hidden=false}
// 中英切換：按鈕上寫的是「要切換過去的語言」
function setLangBtn(){$("langBtn").textContent=LANG==="en"?"中文":"EN";$("langBtn").setAttribute("aria-label",LANG==="en"?"切換成中文":"Switch to English")}
$("langBtn").onclick=()=>{LANG=LANG==="en"?"zh":"en";store.set("ckviz-lang",LANG);applyLang();setLangBtn();
  setNavHidden(document.querySelector(".app").classList.contains("nav-hidden"));renderNav();openLesson(ST.L.id)};
setLangBtn();
openLesson(store.get(SK+"last","0-1"));
setMode("cpp");

