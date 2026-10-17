/* ================= Python 課程：切換課程、記憶體區（名字 → 物件）、語法上色 =================
   網址加上 ?course=py 就是 Python 課程；沒有就是 C++。兩邊的進度分開存。 */
const COURSE=(()=>{try{return new URLSearchParams(location.search).get("course")==="py"?"py":"cpp"}catch(e){return"cpp"}})();
const SK=COURSE==="py"?"pyviz-":"ckviz-";   // localStorage 的前綴：已看過、上次看到哪一課、自己的測資
const PY_CHAPTERS=[];
function runCode(src,input){return COURSE==="py"?pyCompileAndRun(src,input):compileAndRun(src,input)}

/* ---------- 記憶體區：左邊是名字，右邊是物件，箭頭表示「這個名字貼在哪個物件上」 ---------- */
function renderPyMem(s,flash){
  const box=document.getElementById("mem"),leg=document.getElementById("memLegend");
  if(!s||!s.py||!s.py.names.length&&!(s.py.dead||[]).length){box.innerHTML=`<div class="empty">還沒有任何名字（變數）</div>`;leg.textContent="";return}
  const P=s.py,ch=new Set(P.changed),rd=new Set(P.read),fresh=new Set(P.fresh);
  const e=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const names=P.names.map(n=>`<div class="pyname${flash&&ch.has(n.name)?" flash":""}${rd.has(n.name)?" rd":""}" data-ref="${n.ref}">${e(n.name)}</div>`).join("");
  const cellCh=new Set(P.cells||[]),cellRd=new Set(P.cellRead||[]);
  // 課程的 markers：{a:["i"]} → 在 list a 的第 i 格下面標 i（跟 C++ 一樣）
  const intOf=nm=>{const n=P.names.find(x=>x.name===nm);if(!n)return null;const o=P.objs.find(x=>x.id===n.ref);return o&&o.t==="int"?+o.repr:null};
  const markAt=(o,i)=>{const ns=P.names.filter(n=>n.ref===o.id).map(n=>n.name);const mk=ns.flatMap(n=>(ST.L.markers||{})[n]||[]);
    return mk.filter(m=>{const v=intOf(m);return v!==null&&(v===i||v<0&&v+o.items.length===i)}).join(",")};
  const obj=o=>{
    const fl=flash&&fresh.has(o.id)?" flash":"";
    if(o.items){
      const cells=o.items.length?o.items.map((x,i)=>{const k=o.id+":"+i;
        return`<div class="cell${i===o.items.length-1?" last":""}"><div class="cv${flash&&cellCh.has(k)?" flash":""}${cellRd.has(k)?" rd":""}">${e(x.repr)}</div><div class="ci">[${i}]</div><div class="mk">${markAt(o,i)}</div></div>`}).join(""):`<div class="cell last"><div class="cv" style="min-width:4em">空的</div><div class="ci">&nbsp;</div></div>`;
      return`<div class="pyobj seq${fl}" data-oid="${o.id}"><div class="pytag">${e(o.tn)}・${o.items.length} 個</div><div class="arr">${cells}</div></div>`;
    }
    return`<div class="pyobj${fl}" data-oid="${o.id}"><div class="pytag">${e(o.tn)}</div><div class="pyval">${e(o.repr)}</div></div>`;
  };
  // 只畫有名字直接指著的物件；list 裡面的東西直接寫在格子裡
  const top=new Set(P.names.map(n=>n.ref));
  const objs=P.objs.filter(o=>top.has(o.id)).map(obj).join("");
  const dead=(P.dead||[]).length?`<div class="pydead">🗑 回收：${P.dead.map(e).join("、")}（沒有名字指著了）</div>`:"";
  box.innerHTML=`<div class="pymem"><div class="pycol"><div class="pyhead">名字（變數）</div>${names}</div><div class="pycol objs"><div class="pyhead">物件（資料）</div>${objs}</div></div>${dead}`;
  leg.textContent="箭頭＝這個名字貼在哪個物件上。"+(P.changed.length||P.fresh.length?"閃黃＝這一步新貼上的名字、新做出來的物件。":"")+(P.read.length?"藍框＝這一步讀取的名字。":"");
  // list 太長的時候，橫向捲到這一步有動到（或有標記）的那一格
  box.querySelectorAll(".pyobj .arr").forEach(a=>{
    if(a.scrollWidth<=a.clientWidth)return;
    const c=[...a.querySelectorAll(".cell")].find(c=>c.querySelector(".cv.flash,.cv.rd"))||[...a.querySelectorAll(".cell")].find(c=>(c.querySelector(".mk")||{}).textContent);
    if(c)a.scrollLeft=Math.max(0,a.scrollLeft+c.getBoundingClientRect().left-a.getBoundingClientRect().left-a.clientWidth/2+c.offsetWidth/2);
  });
  pyArrows(box);
}
function pyArrows(box){
  const old=box.querySelector("svg.arrows");if(old)old.remove();
  if(!box.querySelector(".pymem")||!box.offsetParent)return;
  const B=box.getBoundingClientRect(),ox=box.scrollLeft-B.left,oy=box.scrollTop-B.top;let paths="";
  box.querySelectorAll(".pyname").forEach(nm=>{
    const t=box.querySelector(`[data-oid="${nm.dataset.ref}"]`);if(!t)return;
    const a=nm.getBoundingClientRect(),b=t.getBoundingClientRect();
    const x1=a.right+ox,y1=a.top+a.height/2+oy,x2=b.left+ox-2,y2=Math.min(b.top+22,b.top+b.height/2)+oy,m=(x1+x2)/2;
    paths+=`<path class="ln" d="M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}"/><circle cx="${x1}" cy="${y1}" r="3.5"/>`;
  });
  box.insertAdjacentHTML("beforeend",`<svg class="arrows" width="${box.scrollWidth}" height="${box.scrollHeight}" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${paths}</svg>`);
}

/* ---------- Python 語法上色 ---------- */
function pyHl(s){
  const e=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const re=/(#.*$)|([fF]?"(?:[^"\\]|\\.)*"?|[fF]?'(?:[^'\\]|\\.)*'?)|\b(if|elif|else|while|for|in|break|continue|pass|and|or|not|True|False|None|def|return)\b|\b(print|input|int|float|str|bool|len|range|type|map|abs|round|max|min|sum|list|ord|chr)\b|\b(\d+(?:\.\d+)?)\b/g;
  let o="",last=0,m;
  while((m=re.exec(s))){o+=e(s.slice(last,m.index));const c=m[1]?"cm":m[2]?"str":m[3]?"kw":m[4]?"io":"num";o+=`<span class="${c}">${e(m[0])}</span>`;last=re.lastIndex}
  return o+e(s.slice(last));
}

/* ---------- 頁面上的切換按鈕、頁尾說明 ---------- */
(function(){
  const c=document.getElementById("courseCpp"),p=document.getElementById("coursePy");
  if(c&&p){c.setAttribute("aria-pressed",COURSE==="cpp");p.setAttribute("aria-pressed",COURSE==="py")}
  if(COURSE==="py"){
    const f=document.querySelector("footer");
    if(f){f.dataset.zh="教學用簡化模型：只支援 Python 的一部分語法（print、input、int、float、str、bool、list、if、while、for、f-string）。";
      f.dataset.en="A simple model for teaching: it supports only part of Python (print, input, int, float, str, bool, list, if, while, for, f-strings).";f.textContent=f.dataset.zh}
  }
})();
