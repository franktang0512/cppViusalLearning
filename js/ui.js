/* ================= 介面 ================= */
const $=id=>document.getElementById(id);
const ALL=[];CHAPTERS.forEach(ch=>(ch.lessons||[]).forEach(l=>{l.ch=ch;ALL.push(l)}));
// 有預期輸出的課都整理成 tests 清單；題目的第一組測資就是一開始的輸入
ALL.forEach(l=>{
  if(!l.tests&&l.expected!=null)l.tests=[{input:l.input??"",output:l.expected,note:""}];
  if(l.tests&&l.input===undefined)l.input=l.tests[0].input===""?null:l.tests[0].input;
});
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let seen=new Set(store.get("ckviz-seen",[]));
const ST={L:null,code:"",input:"",trace:[],error:null,k:0,editing:false,playing:null,ws:false,tab:"mem",edits:{},inputs:{},tis:{},results:{},picks:{},ran:false};

/* ---------- 目錄 ---------- */
function renderNav(){
  let h=`<p class="brand">看得見的 C++</p><p class="brand-sub">每一章先看觀念，再看例題：一步一步看程式怎麼解決問題、變數怎麼變化、OJ 怎麼判。</p>
  <div class="progress">已看過 ${[...seen].filter(id=>ALL.some(l=>l.id===id)).length} / ${ALL.length} 課<div class="bar"><i style="width:${100*seen.size/ALL.length}%"></i></div></div>`;
  let part="";
  for(const ch of CHAPTERS){
    if(ch.part!==part){part=ch.part;h+=`<div class="part">${part}</div>`}
    if(ch.lessons){
      h+=`<div class="ch"><div class="ch-title"><span class="ch-no">${ch.id}</span>${ch.title}</div><ul class="ls">`+
        ch.lessons.map(l=>`<li><button data-l="${l.id}" aria-current="${ST.L&&ST.L.id===l.id}"><span class="lid">${l.id}</span><span>${l.title}</span>${l.example?'<span class="ex-tag">例題</span>':""}${seen.has(l.id)?'<span class="seen">✓</span>':""}</button></li>`).join("")+`</ul></div>`;
    }else{
      h+=`<div class="ch soon"><div class="ch-title"><span class="ch-no">${ch.id}</span>${ch.title}<span class="soon-tag">製作中</span></div>`+
        (ch.soon.length?`<ul class="soon-list">${ch.soon.map(s=>`<li>${s}</li>`).join("")}</ul>`:"")+`</div>`;
    }
  }
  $("nav").innerHTML=h;
  $("nav").querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{openLesson(b.dataset.l);setMode("cpp");$("nav").classList.remove("open")});
}

/* ---------- 語法上色 ---------- */
function hl(s){
  if(/^\s*#/.test(s))return`<span class="pp">${esc(s)}</span>`;
  const re=/(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*'?)|\b(int|long|double|float|char|bool|void|if|else|while|for|break|continue|return|true|false|const|using|namespace)\b|\b(cin|cout|endl)\b|\b(\d+(?:\.\d+)?)\b/g;
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
  seen.add(L.id);store.set("ckviz-seen",[...seen]);store.set("ckviz-last",L.id);
  const i=ALL.indexOf(L);
  $("crumb").textContent=`第 ${L.ch.id} 章・${L.ch.title}・${L.example?"例題 ":""}${L.id}`;
  $("title").textContent=L.title;
  $("goal").textContent=L.goal;$("goal").dataset.label=L.example?"例題":"這一課";
  $("task").innerHTML=(L.task?`<div class="task">${esc(L.task)}</div>`:"")+(L.table?`<table class="ptable">${L.table.map((r,i)=>`<tr>${r.map(c=>i?`<td>${esc(c)}</td>`:`<th>${esc(c)}</th>`).join("")}</tr>`).join("")}</table>`:"")+`<div id="tests"></div>`;
  $("tags").innerHTML=`<span class="tag-new">${L.example?"重點":"新"}：${esc(L.isNew)}</span>`+(L.uses?`<span class="tag-use">用到：${esc(L.uses)}</span>`:"");
  $("prevL").disabled=i===0;$("nextL").disabled=i===ALL.length-1;
  $("inwrap").innerHTML="";
  renderNav();renderTests();rerun();
  document.querySelector("main").scrollTop=0;
}
function rerun(){
  // 有測資的題目：學生選好一筆測資、按「執行」之前，不跑程式
  if(ST.L.tests&&!ST.ran){ST.trace=[];ST.error=null;ST.k=0;updateTests();render(false);return}
  const r=compileAndRun(ST.code,ST.input);
  ST.trace=r.trace;ST.error=r.error||null;ST.k=0;
  updateTests();render(false);
}

/* ---------- 測資：題目給的 + 學生自己設計的 3 筆。一次只選一筆，按「執行」才判題 ---------- */
const MINE_NOTE=["例如：一般的情況","例如：剛好在邊界上","例如：最小值、0 或很大的數"];
const hasMine=L=>!!(L.example&&L.tests&&L.tests.some(t=>t.input));
function myTests(L){const d=store.get("ckviz-mine-"+L.id,null);return Array.isArray(d)&&d.length===3?d:[0,1,2].map(()=>({input:"",output:"",note:""}))}
function testList(L){
  if(!L.tests)return[];
  return[...L.tests.map((t,i)=>({...t,key:"g"+i,label:`測資 ${i+1}`})),
    ...(hasMine(L)?myTests(L).map((t,i)=>({...t,key:"m"+i,label:`我的 ${i+1}`,mine:true})):[])];
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
  const r=compileAndRun(ST.code,t.input);
  ST.results={[t.key]:t.mine&&!t.output.trim()?(r.error?"CE":"—"):judge(r,t.output)};
  ST.ran=true;watchTest(t.key);
}
function watchTest(key){
  const L=ST.L,t=testList(L).find(x=>x.key===key);if(!t)return;
  ST.tis[L.id]=key;ST.input=t.input;ST.inputs[L.id]=ST.input;stop();rerun();
}
function renderTests(){
  const L=ST.L,box=$("tests");if(!box)return;
  if(!L.tests){box.innerHTML="";return}
    const pick=k=>`<td class="pick"><input type="radio" name="pick-${L.id}" data-pick="${k}" aria-label="選這筆測資"${picks()[0]===k?" checked":""}></td>`;
  const watch=(k,lb)=>`<td class="tlabel">${lb}</td>`;
  let h=`<table class="tests"><thead><tr><th>選</th><th>測資</th><th>輸入</th><th>預期輸出</th><th>結果</th></tr></thead><tbody>`+
    L.tests.map((t,i)=>`<tr data-row="g${i}">${pick("g"+i)}${watch("g"+i,`測資 ${i+1}`)}
      <td><pre>${t.input?esc(t.input):'<span class="noinput">（不用輸入）</span>'}</pre></td><td><pre>${esc(t.output)}</pre></td>
      <td><span class="verdict" data-v="g${i}"></span></td></tr>`+(t.note?`<tr class="subrow" data-sub="g${i}"><td></td><td colspan="4" class="tnote">${esc(t.note)}</td></tr>`:"")).join("")+`</tbody></table>`;
  if(hasMine(L)){
    const ex=i=>L.tests[i%L.tests.length];
    h+=`<div class="mine-head"><b>我的測資</b><span class="hint">自己想 3 組測資：輸入什麼、應該輸出什麼、想測什麼。</span></div>
    <table class="tests mine"><thead><tr><th>選</th><th>測資</th><th>輸入</th><th>預期輸出</th><th>結果</th></tr></thead><tbody>`+
      myTests(L).map((t,i)=>`<tr data-row="m${i}">${pick("m"+i)}${watch("m"+i,`我的 ${i+1}`)}
        <td><textarea rows="2" spellcheck="false" data-m="${i}" data-f="input" placeholder="例如：${esc(ex(i).input)}">${esc(t.input)}</textarea></td>
        <td><textarea rows="2" spellcheck="false" data-m="${i}" data-f="output" placeholder="例如：${esc(ex(i).output)}">${esc(t.output)}</textarea></td>
        <td><span class="verdict" data-v="m${i}"></span></td></tr>
        <tr class="subrow" data-sub="m${i}"><td></td><td colspan="4"><input data-m="${i}" data-f="note" aria-label="測試重點" placeholder="測試重點，${MINE_NOTE[i]}" value="${esc(t.note).replace(/"/g,"&quot;")}"></td></tr>`).join("")+`</tbody></table>`;
  }
  box.innerHTML=h+`<div class="runbar"><button class="btn primary" id="runTests">▶ 執行這筆測資</button><span class="hint" id="testsHint"></span></div>`;
  // 換選另一筆：清掉上一筆的結果和逐步執行，回到「還沒執行」，避免學生搞混
  box.querySelectorAll("[data-pick]").forEach(rb=>rb.onchange=()=>{
    const P=picks();P.length=0;P.push(rb.dataset.pick);ST.ran=false;ST.results={};delete ST.tis[L.id];stop();rerun();
  });
  box.querySelectorAll("tr[data-row]").forEach(tr=>tr.addEventListener("click",e=>{
    if(e.target.closest("textarea,input"))return;const rb=tr.querySelector("[data-pick]");if(!rb.checked){rb.checked=true;rb.onchange()}
  }));
  $("runTests").onclick=runPicked;
  box.querySelectorAll("[data-m]").forEach(el=>el.addEventListener("input",()=>{
    const d=myTests(L),i=+el.dataset.m;d[i][el.dataset.f]=el.value;store.set("ckviz-mine-"+L.id,d);
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
  $("testsHint").textContent=!picks().length?"先選一筆測資，再按「執行」。":
    custom?"你改了輸入，現在跑的是自訂輸入。重新選一筆測資就會換回來。":
    ST.ran?`正在看「${lb}」：下面的程式、記憶體、輸出都是這一筆。`:`選了「${lb}」，按「執行」開始。`;
}

/* ---------- 畫面 ---------- */
function render(flash){
  const L=ST.L,N=ST.trace.length,k=ST.k,s=k>0?ST.trace[k-1]:null,nx=k<N?ST.trace[k]:null;
  // 程式碼
  if(ST.editing){
    if(!$("editor")){
      $("codeArea").innerHTML=`<textarea class="editor" id="editor" spellcheck="false" aria-label="編輯程式碼"></textarea>
        <div class="edit-bar"><button class="btn primary" id="runEdit">執行修改後的程式</button><button class="btn" id="cancelEdit">取消</button><button class="btn" id="restore">還原成原本的程式</button></div>`;
      const ed=$("editor");ed.value=ST.code;
      ed.addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();const a=ed.selectionStart;ed.setRangeText("    ",a,ed.selectionEnd,"end")}});
      $("runEdit").onclick=()=>{ST.code=ed.value;ST.edits[L.id]=ST.code;ST.editing=false;if(L.tests&&picks().length)runPicked();else{ST.ran=false;ST.results={};rerun()}};
      $("cancelEdit").onclick=()=>{ST.editing=false;render(false)};
      $("restore").onclick=()=>{ed.value=L.code};
      ed.focus();
    }
  }else{
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
  $("editBtn").setAttribute("aria-pressed",ST.editing);
  // 控制
  const dis=!!ST.error||ST.editing;
  $("prev").disabled=dis||k===0;$("reset").disabled=dis||k===0;
  $("next").disabled=$("end").disabled=$("play").disabled=dis||k===N;
  $("scrub").max=N;$("scrub").value=k;$("scrub").disabled=dis;
  const waiting=!!(L.tests&&!ST.ran);
  $("count").textContent=ST.error||waiting?"":`第 ${k} / ${N} 步`;
  $("play").textContent=ST.playing?"⏸ 暫停":"▶ 自動";
  // 說明
  let note;
  if(ST.error)note=`<div class="err"><b>編譯錯誤（第 ${ST.error.line} 行）：</b>${ST.error.msg}</div><div class="hint" style="margin-top:6px">按「改改看」修正後再執行。</div>`;
  else if(waiting)note=`先在上面<b>選一筆測資</b>，再按「▶ 執行這筆測資」。程式會用那一筆測資的輸入來跑。`;
  else if(k===0)note=`按「下一步」開始。程式從 <code>main</code> 的第一行開始，一次執行一小步。`;
  else{
    note=s.note;
    if(L.tips){const lt=ST.code.split("\n")[s.line-1]||"";for(const[m,t]of Object.entries(L.tips))if(lt.includes(m))note+=`<div class="tip">💡 ${t}</div>`}
  }
  // 顏色說明、說明文字、提問都放在同一個固定大小的框裡，畫面才不會跳
  const legend=!ST.error&&k>=1&&k<=2?`<div class="hint" style="margin-bottom:4px">黃色＝剛剛執行的那一行，底線＝那一行裡正在執行的部分，▸＝下一步。</div>`:"";
  const ask=(k===0&&L.predict&&!ST.error)?`<div class="ask"><b>先猜猜看：</b>${esc(L.predict)}</div>`:(s&&s.done&&L.ask)?`<div class="ask"><b>想一想：</b>${esc(L.ask)}</div>`:"";
  $("note").innerHTML=legend+note+ask;
  renderMem(s,flash);renderTT();renderIO(s,flash);renderJudge(s);
}

function memLegend(s){
  const prev=ST.k>1?ST.trace[ST.k-2]:null,items=[];
  const fresh=s.vars.filter(v=>!prev||!prev.vars.some(p=>p.id===v.id));
  if(fresh.length){const ts=[...new Set(fresh.map(v=>v.type))].filter(t=>t!=="string");
    if(ts.length)items.push(`每個小格代表 1 byte（${ts.map(t=>`${TNAME[t]} 佔 ${SIZE[t]} 格`).join("、")}）`)}
  if(s.vars.some(v=>v.init.some(x=>!x)))items.push("灰字＝垃圾值（還沒給過值）");
  if(s.read.length)items.push("藍框＝這一步讀取的格子");
  if(s.changed.length)items.push("閃黃＝這一步被改的格子");
  return items.join("。")+(items.length?"。":"");
}
function renderMem(s,flash){
  const box=$("mem");$("memLegend").textContent=s&&s.vars.length?memLegend(s):"";
  if(!s||!s.vars.length){box.innerHTML=`<div class="empty">還沒有宣告任何變數</div>`;return}
  const ch=new Set(s.changed),rd=new Set(s.read);
  const all=s.vars;const hasG=all.some(v=>v.scope==="global");
  const byName={};all.forEach(v=>{if(!v.isArr)byName[v.name]=v});
  let h="";
  for(const grp of hasG?["global","main"]:["main"]){
    const vs=all.filter(v=>v.scope===grp);
    if(hasG)h+=`<div class="grp">${grp==="global"?"全域變數（main 外面）":"main 裡面的變數"}</div>`;
    if(!vs.length){h+=`<div class="empty">（沒有）</div>`;continue}
    for(const v of vs){
      if(!v.isArr){
        const key=v.id+":0",fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"",g=!v.init[0];
        const extra=v.type==="char"?` ・ ASCII ${v.values[0]}`:v.type==="string"?` ・ 長度 ${v.values[0].length}`:"";
        h+=`<div class="var"><div class="addr" title="位址只是示意，真實電腦每次執行都可能不同">0x${v.addr.toString(16)}</div>
          <div class="box${fl}${r}" style="--n:${Math.min(SIZE[v.type],8)}">${"<span></span>".repeat(Math.min(SIZE[v.type],8))}<div class="val${g?" g":""}">${esc(fmtVal(v.type,v.values[0]))}</div></div>
          <div class="meta"><div class="nm">${esc(v.name)}${g?'<span class="gtag">垃圾值</span>':""}</div><div class="ty">${TNAME[v.type]}・${SIZE[v.type]} byte${SIZE[v.type]>1?"s":""}${extra}</div></div></div>`;
      }else{
        const mk=(ST.L.markers||{})[v.name]||[];
        const oob=s.oob&&s.oob.id===v.id?s.oob.i:null;
        const show=Math.min(v.len,60);
        let cells="";
        const markAt=i=>mk.filter(n=>byName[n]&&byName[n].values[0]===i).join(",");
        for(let i=0;i<show;i++){
          const key=v.id+":"+i,fl=flash&&ch.has(key)?" flash":"",r=rd.has(key)?" rd":"";
          cells+=`<div class="cell${i===show-1&&oob===null?" last":""}"><div class="cv${fl}${r}${v.init[i]?"":" g"}">${esc(fmtVal(v.type,v.values[i]))}</div><div class="ci">[${i}]</div><div class="mk">${markAt(i)}</div></div>`;
        }
        if(v.len>show)cells+=`<div class="cell last"><div class="cv">…</div><div class="ci">共 ${v.len} 格</div></div>`;
        if(oob!==null)cells+=`<div class="cell oob"><div class="cv">?</div><div class="ci">[${oob}]</div><div class="mk">${markAt(oob)}</div></div>`;
        h+=`<div><div class="arr-head"><div class="addr" title="位址只是示意，真實電腦每次執行都可能不同">0x${v.addr.toString(16)}</div><div class="meta"><span class="nm">${esc(v.name)}</span> <span class="ty">${TNAME[v.type]}[${v.len}]・每格 ${SIZE[v.type]} bytes</span></div></div><div class="arr">${cells}</div></div>`;
      }
    }
  }
  box.innerHTML=h;
}

function renderTT(){
  const k=ST.k,T=ST.trace;
  if(!k){$("tt").innerHTML=`<div class="empty">開始執行後，這裡會列出每一步的變數值。</div>`;return}
  const cols=[];const seenC=new Set();
  for(let i=0;i<k;i++)for(const v of T[i].vars)if(!v.isArr&&!seenC.has(v.name)){seenC.add(v.name);cols.push(v.name)}
  let h=`<table class="tt"><thead><tr><th>步</th><th>行</th>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}<th style="text-align:left">印出</th></tr></thead><tbody>`;
  const from=Math.max(0,k-300);
  for(let i=from;i<k;i++){
    const s=T[i],ch=new Set(s.changed),prev=i?T[i-1].out:"";
    const o=s.out.slice(prev.length).replace(/ /g,"␣").replace(/\n/g,"↵");
    h+=`<tr${i===k-1?' class="now"':""}><td>${i+1}</td><td>${s.line||""}</td>`+cols.map(c=>{
      let v=null;for(const x of s.vars)if(!x.isArr&&x.name===c)v=x;
      if(!v)return"<td></td>";
      return`<td${ch.has(v.id+":0")?' class="ch"':""}>${esc(v.init[0]?fmtVal(v.type,v.values[0]):"?")}</td>`;
    }).join("")+`<td class="o">${esc(o)}</td></tr>`;
  }
  $("tt").innerHTML=h+"</tbody></table>";
  const w=$("tt");w.scrollTop=w.scrollHeight;
}

function wsVis(t){return esc(t).replace(/ /g,'<span class="wsv">␣</span>').replace(/\n/g,'<span class="wsv">↵</span>\n')}
function renderIO(s,flash){
  const L=ST.L;const usesCin=/\bcin\b/.test(ST.code);
  if(L.tests&&!ST.ran){$("inwrap").innerHTML=`<p class="noinput">執行之後，這裡會顯示那一筆測資的輸入。</p>`}
  else if(L.input===null&&!usesCin&&!ST.input){$("inwrap").innerHTML=`<p class="noinput">這個程式沒有用到 cin，不需要輸入。</p>`}
  else{
    if(!$("stdin")){
      $("inwrap").innerHTML=`<textarea class="stdin" id="stdin" rows="2" spellcheck="false" aria-label="程式的輸入"></textarea><div class="hint">可以直接修改，改完會從頭執行。</div><div class="buf" id="buf"></div><div id="failtag"></div>`;
      $("stdin").addEventListener("input",e=>{ST.input=e.target.value;ST.inputs[L.id]=ST.input;stop();rerun()});
    }
    if($("stdin").value!==ST.input)$("stdin").value=ST.input;
    const pos=s?s.pos:0,lr=s&&s.lastRead;let b="";const inp=ST.input;
    for(let i=0;i<inp.length&&i<600;i++){
      const c=inp[i];const ws=c===" "||c==="\n"||c==="\t";
      let cls=ws?"ws":"";if(i<pos)cls+=" used";if(lr&&i>=lr[0]&&i<lr[1])cls+=" got";if(i===pos)cls+=" cur";
      b+=`<span class="${cls}">${c===" "?"␣":c==="\n"?"↵":c==="\t"?"⇥":esc(c)}</span>`+(c==="\n"?"<br>":"");
    }
    b+=`<span class="${pos>=inp.length?"cur":""}"> </span><span class="eof">${pos>=inp.length&&inp.length?"（已讀完）":""}</span>`;
    $("buf").innerHTML=inp.length?b:`<span class="noinput">（輸入是空的）</span>`;
    $("failtag").innerHTML=s&&s.fail?`<span class="failtag">cin 已經處於失敗狀態</span>`:"";
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
  if(!ST.ran||!c){j.hidden=false;j.innerHTML=`<div class="ph"><h2>判題</h2></div><span class="verdict wait">還沒執行</span>`;return}
  j.hidden=false;const head=`<div class="ph"><h2>${c.label} 判題</h2></div>`;
  if(c.mine&&!c.output.trim()&&ST.input===c.input){j.innerHTML=`${head}<span class="verdict wait">沒有填預期輸出，只執行、不判題</span>`;return}
  if(ST.input!==c.input){j.innerHTML=`<div class="ph"><h2>判題</h2></div><span class="verdict wait">自訂輸入沒有預期輸出，不判題</span>`;return}
  if(!s||!s.done){j.innerHTML=`${head}<span class="verdict wait">程式執行完才會判題</span><div class="hint" style="margin-top:6px">可以按「到最後」直接看結果。</div>`;return}
  const a=normLines(s.out),e=normLines(c.output);
  let first=-1;for(let i=0;i<Math.max(a.length,e.length);i++)if(a[i]!==e[i]){first=i;break}
  const re=!!s.error;const ok=!re&&first<0;
  const lines=(arr,mark)=>arr.map((l,i)=>`<span${i===first&&mark?' class="bad"':""}>${wsVis(l)||" "}</span>`).join("\n");
  j.innerHTML=`${head}
    <span class="verdict ${ok?"ac":"wa"}">${ok?"AC 通過":re?"RE 執行錯誤":"WA 答案錯誤"}</span>
    ${ok?"":re?"":`<span class="hint" style="margin-left:8px">第 ${first+1} 行開始不一樣</span>`}
    <div class="cmp"><div><div class="hint">你的輸出</div><pre>${lines(a,true)}</pre></div><div><div class="hint">正確答案</div><pre>${lines(e,true)}</pre></div></div>
    ${ok||re?"":`<div class="hint" style="margin-top:6px">多數 OJ 會忽略行尾空白和最後的空行，但多印、少印任何文字都會判錯。</div>`}`;
}

/* ---------- 操作 ---------- */
function go(k,flash){ST.k=Math.max(0,Math.min(ST.trace.length,k));render(flash)}
function stop(){if(ST.playing){clearInterval(ST.playing);ST.playing=null;$("play").textContent="▶ 自動"}}
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
$("tabMem").onclick=()=>{$("memView").hidden=false;$("ttView").hidden=true;$("tabMem").setAttribute("aria-pressed","true");$("tabTT").setAttribute("aria-pressed","false")};
$("tabTT").onclick=()=>{$("memView").hidden=true;$("ttView").hidden=false;$("tabMem").setAttribute("aria-pressed","false");$("tabTT").setAttribute("aria-pressed","true");renderTT()};
$("prevL").onclick=()=>{const i=ALL.indexOf(ST.L);if(i>0)openLesson(ALL[i-1].id)};
$("nextL").onclick=()=>{const i=ALL.indexOf(ST.L);if(i<ALL.length-1)openLesson(ALL[i+1].id)};
$("menu").onclick=()=>$("nav").classList.toggle("open");
document.addEventListener("keydown",e=>{
  if(/TEXTAREA|INPUT/.test(e.target.tagName))return;
  if(e.key==="ArrowRight"&&!$("next").disabled){e.preventDefault();$("next").click()}
  if(e.key==="ArrowLeft"&&!$("prev").disabled){e.preventDefault();$("prev").click()}
});
/* ---------- 模式切換：C++ / 流程圖 ---------- */
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
openLesson(store.get("ckviz-last","0-1"));
setMode(new URLSearchParams(location.search).get("mode")||store.get("ckviz-mode","cpp"));

