/* ================= Python 課程：切換課程、記憶體區（名字 → 物件）、語法上色 =================
   網址加上 ?course=py 就是 Python 課程；沒有就是 C++。兩邊的進度分開存。 */
// ?course=blk 是積木課（js/blk/）：目前只有章節規劃和積木工作區
const COURSE=(()=>{try{const c=new URLSearchParams(location.search).get("course");return c==="py"||c==="blk"?c:"cpp"}catch(e){return"cpp"}})();
const SK=COURSE==="py"?"pyviz-":COURSE==="blk"?"blkviz-":"ckviz-";   // localStorage 的前綴：已看過、上次看到哪一課、自己的測資
const PY_CHAPTERS=[];
function runCode(src,input){return COURSE==="py"?pyCompileAndRun(src,input):COURSE==="blk"?blkRun(src,input):compileAndRun(src,input)}

// 區塊放大（CSS zoom，見 js/layout.js）以後，getBoundingClientRect 量到的是放大後的大小，
// offsetWidth 還是原本的大小；畫在區塊裡的箭頭要除以放大倍率，換回區塊自己的單位
function zoomOf(el){const w=el.offsetWidth;return w?el.getBoundingClientRect().width/w||1:1}
function zRect(el,z){const r=el.getBoundingClientRect();return{left:r.left/z,right:r.right/z,top:r.top/z,bottom:r.bottom/z,width:r.width/z,height:r.height/z}}

/* ---------- 記憶體區：左邊是名字，右邊是物件，箭頭表示「這個名字貼在哪個物件上」 ---------- */
function renderPyMem(s,flash){
  const box=document.getElementById("mem"),leg=document.getElementById("memLegend");
  if(!s||!s.py||!s.py.names.length&&!(s.py.dead||[]).length){box.innerHTML=`<div class="empty">還沒有任何名字（變數）</div>`;leg.textContent="";return}
  const P=s.py,ch=new Set(P.changed),rd=new Set(P.read),fresh=new Set(P.fresh);
  const e=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const nameDiv=n=>`<div class="pyname${flash&&ch.has(n.key)?" flash":""}${rd.has(n.key)?" rd":""}" data-ref="${n.ref}">${e(n.name)}</div>`;
  // 有呼叫函式的時候，名字分成一層一層（呼叫堆疊）：最下面是全域，最上面是正在執行的函式
  const FR=P.frames||[{label:"全域",names:P.names}];
  const names=FR.length>1?FR.map((F,d)=>F.gap?`<div class="pyframe gap">⋯ 中間還有 ${F.gap} 層，先不畫 ⋯</div>`:`<div class="pyframe${d===FR.length-1?" cur":""}">${d===0?"全域":`${e(F.label)} 第 ${F.depth+1} 層${d===FR.length-1?"・執行中":""}`}</div>`+F.names.map(nameDiv).join("")).join(""):FR[0].names.map(nameDiv).join("");
  const cellCh=new Set(P.cells||[]),cellRd=new Set(P.cellRead||[]);
  // 課程的 markers：{a:["i"]} → 在 list a 的第 i 格下面標 i（跟 C++ 一樣）
  const intOf=nm=>{const n=P.names.find(x=>x.name===nm);if(!n)return null;const o=P.objs.find(x=>x.id===n.ref);return o&&o.t==="int"?+o.repr:null};
  const markAt=(o,i,len)=>{const ns=P.names.filter(n=>n.ref===o.id).map(n=>n.name);const mk=ns.flatMap(n=>{const m=(ST.L.markers||{})[n];return Array.isArray(m)?m:[]});
    return mk.filter(m=>{const v=intOf(m);return v!==null&&(v===i||v<0&&v+len===i)}).join(",")};
  const hit=k=>(flash&&cellCh.has(k)?" flash":"")+(cellRd.has(k)?" rd":"");
  // 一排格子：list、tuple、set、字串都用這個畫；set 沒有順序，不寫索引
  const row=(o,vals,idx)=>vals.length?vals.map((v,i)=>`<div class="cell${i===vals.length-1?" last":""}"><div class="cv${hit(o.id+":"+i)}">${e(v)}</div><div class="ci">${idx?`[${i}]`:"&nbsp;"}</div>${idx?`<div class="mk">${markAt(o,i,vals.length)}</div>`:""}</div>`).join("")
    :`<div class="cell last"><div class="cv" style="min-width:4em">空的</div><div class="ci">&nbsp;</div></div>`;
  const obj=o=>{
    const fl=flash&&fresh.has(o.id)?" flash":"";
    if(o.kv){  // dict：一列一項，左邊是鍵、右邊是值
      const rows=o.kv.length?o.kv.map((x,i)=>`<div class="kvr${hit(o.id+":"+i)}"><div class="kk">${e(x.k)}</div><div class="kar">→</div><div class="kvv">${e(x.v)}</div></div>`).join(""):`<div class="kvr"><div class="kk">空的</div></div>`;
      return`<div class="pyobj seq${fl}" data-oid="${o.id}"><div class="pytag">dict・${o.kv.length} 項（鍵 → 值）</div><div class="kvt">${rows}</div></div>`;
    }
    if(o.t==="list"&&o.items.length&&o.items.every(x=>x.t==="list"))return grid(o,fl);
    if(o.items&&o.items.some(x=>x.oref))  // list 裡放的是物件：每一格畫一個箭頭
      return`<div class="pyobj seq${fl}" data-oid="${o.id}"><div class="pytag">${e(o.tn)}・${o.items.length} 個</div><div class="arr">${o.items.map((x,i)=>`<div class="cell${i===o.items.length-1?" last":""}"><div class="cv${hit(o.id+":"+i)}">${x.oref?`<span class="pdot pref" data-ref="${x.oref}"></span>`:e(x.repr)}</div><div class="ci">[${i}]</div></div>`).join("")}</div></div>`;
    if(o.items){
      const set=o.t==="set";
      return`<div class="pyobj seq${fl}" data-oid="${o.id}"><div class="pytag">${e(o.tn)}・${o.items.length} 個${set?"（沒有順序）":""}</div><div class="arr">${row(o,o.items.map(x=>x.repr),!set)}</div></div>`;
    }
    if(o.fields){  // 自己用 class 做的物件：一列一個屬性；指著別的物件的屬性畫成箭頭
      const rows=o.fields.length?o.fields.map((f,i)=>`<div class="fld${hit(o.id+":"+i)}"><span class="fk">${e(f.k)}</span><span class="fv">${f.ref?`<span class="pdot pref" data-ref="${f.ref}"></span>`:e(f.v)}</span></div>`).join(""):`<div class="fld"><span class="fk">（還沒有屬性）</span></div>`;
      return`<div class="pyobj inst${fl}" data-oid="${o.id}"><div class="pytag">${e(o.tn)} 物件</div><div class="flds">${rows}</div></div>`;
    }
    if(o.t==="class")return`<div class="pyobj${fl}" data-oid="${o.id}"><div class="pytag">class</div><div class="pyval pyfn">${e(o.sig)}</div></div>`;
    if(o.t==="func")return`<div class="pyobj${fl}" data-oid="${o.id}"><div class="pytag">function</div><div class="pyval pyfn">${e(o.sig||o.repr)}</div></div>`;
    if(o.chars&&ST.L.strCells&&o.chars.length)  // 教字串的課：把字串畫成一格一個字
      return`<div class="pyobj seq${fl}" data-oid="${o.id}"><div class="pytag">str・${o.chars.length} 個字</div><div class="arr">${row(o,o.chars.map(c=>c===" "?"␣":c),true)}</div></div>`;
    return`<div class="pyobj${fl}" data-oid="${o.id}"><div class="pytag">${e(o.tn)}</div><div class="pyval">${e(o.repr)}</div></div>`;
  };
  /* 二維 list：外層一格一列，每一格用箭頭指向那一列的 list。
     同一個 list 只畫一次，所以 [[0] * 3] * 2 會看到兩個箭頭指著同一列。
     課程的 markers 可以寫 {g:{r:["i"], c:["j"]}}：第 i 列旁邊標 i，那一列的第 j 格下面標 j（r、c 照順序配對） */
  const rowsDrawn=new Set();  // 每一列只畫一次：別的二維 list 也指著它的話，箭頭跨過去
  function grid(o,fl){
    const ns=P.names.filter(n=>n.ref===o.id).map(n=>n.name);
    const mk=ns.map(n=>(ST.L.markers||{})[n]).find(m=>m&&!Array.isArray(m))||{},rm=mk.r||[],cm=mk.c||[];
    const at=(v,len)=>v===null?null:v<0?v+len:v,R=o.items.length;
    const drawn=rowsDrawn;let html="";
    o.items.forEach((x,i)=>{
      const rl=rm.filter(m=>at(intOf(m),R)===i);
      html+=`<div class="g2c${hit(o.id+":"+i)}" data-ref="${x.id}"><span class="ci">[${i}]</span><span class="mk">${e(rl.join(","))}</span><span class="g2dot"></span></div>`;
      if(drawn.has(x.id)){html+=`<div></div>`;return}
      drawn.add(x.id);const ro=P.objs.find(z=>z.id===x.id);
      // 這一列的第幾格要標記：找出「列的標記指著這一列」的那幾組 r、c
      const cols=new Map();rm.forEach((m,k)=>{if(at(intOf(m),R)!==i||!cm[k])return;const j=at(intOf(cm[k]),ro.items.length);if(j===null)return;cols.set(j,[...(cols.get(j)||[]),cm[k]])});
      const cells=ro.items.length?ro.items.map((y,j)=>`<div class="cell${j===ro.items.length-1?" last":""}"><div class="cv${hit(ro.id+":"+j)}">${e(y.repr)}</div><div class="ci">[${j}]</div><div class="mk">${e((cols.get(j)||[]).join(","))}</div></div>`).join("")
        :`<div class="cell last"><div class="cv" style="min-width:4em">空的</div><div class="ci">&nbsp;</div></div>`;
      html+=`<div class="pyobj seq g2row${flash&&fresh.has(ro.id)?" flash":""}" data-oid="${ro.id}"><div class="arr">${cells}</div></div>`;
    });
    return`<div class="pyobj seq${fl}" data-oid="${o.id}"><div class="pytag">list・${R} 列（每一格指著一列）</div><div class="g2">${html}</div></div>`;
  }
  // 只畫有名字直接指著的物件；list 裡面的東西直接寫在格子裡
  const top=new Set(FR.flatMap(F=>F.names.map(n=>n.ref)));
  // 物件一律畫出來（鏈結串列的節點常常沒有名字指著）；樹的節點另外排成一棵樹；物件的屬性指著的 list 也要畫
  P.objs.forEach(o=>{if(o.t==="inst"){top.add(o.id);(o.fields||[]).forEach(f=>{if(f.ref)top.add(f.ref)})}});
  // 樹：物件有 left、right 兩個屬性時，照「左邊的在左、右邊的在右、孩子在下一層」排好（跟 C++ 的樹狀圖一樣）
  const TNs=P.objs.filter(o=>o.fields&&o.fields.some(f=>f.k==="left")&&o.fields.some(f=>f.k==="right")),inTree=new Set(TNs.map(o=>o.id));
  let treeHTML="";
  if(TNs.length){
    const by=new Map(TNs.map(o=>[o.id,o])),kid=(o,k)=>{const f=o.fields.find(x=>x.k===k);return f&&f.ref&&by.has(f.ref)?by.get(f.ref):null};
    const pointed=new Set();TNs.forEach(o=>["left","right"].forEach(k=>{const c=kid(o,k);if(c&&c!==o)pointed.add(c.id)}));
    const pos=new Map();let col=0,maxD=0;
    const place=(o,d)=>{if(!o||pos.has(o.id))return;pos.set(o.id,null);place(kid(o,"left"),d+1);pos.set(o.id,{x:col++,d});maxD=Math.max(maxD,d);place(kid(o,"right"),d+1)};
    TNs.filter(o=>!pointed.has(o.id)).forEach(o=>place(o,0));TNs.forEach(o=>place(o,0));
    const DX=62,DY=74,W=(col-1)*DX+124,H=maxD*DY+62;
    treeHTML=`<div class="pytree" style="width:${W}px;height:${H}px">${TNs.map(o=>{const q=pos.get(o.id);
      const cells=o.fields.map((f,i)=>`<div class="cell${i===o.fields.length-1?" last":""}"><div class="cv${hit(o.id+":"+i)}">${f.ref?`<span class="pdot pref" data-ref="${f.ref}"></span>`:f.v==="None"&&(f.k==="left"||f.k==="right")?"∅":e(f.v)}</div><div class="ci">${e(f.k)}</div></div>`).join("");
      return`<div class="tnode" style="left:${q.x*DX}px;top:${q.d*DY}px"><div class="pyobj tn${flash&&fresh.has(o.id)?" flash":""}" data-oid="${o.id}"><div class="arr">${cells}</div></div></div>`}).join("")}</div>`;
  }
  const objs=P.objs.filter(o=>top.has(o.id)&&!inTree.has(o.id)).map(obj).join("");
  const dead=(P.dead||[]).length?`<div class="pydead">🗑 回收：${P.dead.map(e).join("、")}（沒有名字指著了）</div>`:"";
  box.innerHTML=`<div class="pymem"><div class="pycol"><div class="pyhead">名字（變數）</div>${names}</div><div class="pycol objs"><div class="pyhead">物件（資料）</div>${objs}</div>${treeHTML?`<div class="pytreerow"><div class="pyhead">樹（物件的 left、right）</div>${treeHTML}</div>`:""}</div>${dead}`;
  leg.textContent="箭頭＝這個名字貼在哪個物件上。"+(P.changed.length||P.fresh.length?"閃黃＝這一步新貼上的名字、新做出來的物件。":"")+(P.read.length?"藍框＝這一步讀取的名字。":"");
  // list 太長的時候，橫向捲到這一步有動到（或有標記）的那一格
  box.querySelectorAll(".pyobj .arr").forEach(a=>{
    if(a.scrollWidth<=a.clientWidth)return;
    const c=[...a.querySelectorAll(".cell")].find(c=>c.querySelector(".cv.flash,.cv.rd"))||[...a.querySelectorAll(".cell")].find(c=>(c.querySelector(".mk")||{}).textContent);
    const Z=zoomOf(a),R=e=>zRect(e,Z);
    if(c)a.scrollLeft=Math.max(0,a.scrollLeft+R(c).left-R(a).left-a.clientWidth/2+c.offsetWidth/2);
  });
  pyArrows(box);
}
function pyArrows(box){
  const old=box.querySelector("svg.arrows");if(old)old.remove();
  if(!box.querySelector(".pymem")||!box.offsetParent)return;
  const Z=zoomOf(box),R=e=>zRect(e,Z);   // 區塊放大以後，換回 box 自己的單位
  const B=R(box),ox=box.scrollLeft-B.left,oy=box.scrollTop-B.top;let paths="";
  box.querySelectorAll(".pyname").forEach(nm=>{
    const t=box.querySelector(`[data-oid="${nm.dataset.ref}"]`);if(!t)return;
    const a=R(nm),b=R(t);
    const x1=a.right+ox,y1=a.top+a.height/2+oy,x2=b.left+ox-2,y2=Math.min(b.top+22,b.top+b.height/2)+oy,m=(x1+x2)/2;
    paths+=`<path class="ln" d="M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}"/><circle cx="${x1}" cy="${y1}" r="3.5"/>`;
  });
  // 物件的屬性、list 的格子 → 它指著的物件（在下面就從上面進去，在上面就從下面進去）
  box.querySelectorAll(".pref[data-ref]").forEach(d=>{
    const t=box.querySelector(`.pyobj[data-oid="${d.dataset.ref}"]`);if(!t)return;
    const a=R(d),b=R(t);
    const x1=a.left+a.width/2+ox,y1=a.top+a.height/2+oy,below=b.top>a.bottom,x2=b.left+Math.min(34,b.width/2)+ox,y2=(below?b.top-2:b.bottom+2)+oy,dy=below?-34:34;
    paths+=`<path class="ln" d="M${x1},${y1} C${x1+46},${y1} ${x2},${y2+dy} ${x2},${y2}"/><circle cx="${x1}" cy="${y1}" r="3.5"/>`;
  });
  // 二維 list：外層的格子 → 那一列的 list
  box.querySelectorAll(".g2c[data-ref]").forEach(c=>{
    const t=box.querySelector(`.g2row[data-oid="${c.dataset.ref}"]`);if(!t)return;
    const d=c.querySelector(".g2dot").getBoundingClientRect(),b=R(t);
    const x1=d.left+d.width/2+ox,y1=d.top+d.height/2+oy,x2=b.left+ox-2,y2=b.top+Math.min(28,b.height/2)+oy,m=(x1+x2)/2;
    paths+=`<path class="ln" d="M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}"/><circle cx="${x1}" cy="${y1}" r="3.5"/>`;
  });
  box.insertAdjacentHTML("beforeend",`<svg class="arrows" width="${box.scrollWidth}" height="${box.scrollHeight}" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${paths}</svg>`);
}

/* ---------- Python 語法上色 ---------- */
function pyHl(s){
  const e=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const re=/(#.*$)|([fF]?"(?:[^"\\]|\\.)*"?|[fF]?'(?:[^'\\]|\\.)*'?)|\b(if|elif|else|while|for|in|break|continue|pass|and|or|not|True|False|None|def|return|global|is|class|lambda)\b|\b(print|input|int|float|str|bool|len|range|type|map|abs|round|max|min|sum|list|ord|chr|sorted|set|dict|deque)\b|\b(\d+(?:\.\d+)?)\b/g;
  let o="",last=0,m;
  while((m=re.exec(s))){o+=e(s.slice(last,m.index));const c=m[1]?"cm":m[2]?"str":m[3]?"kw":m[4]?"io":"num";o+=`<span class="${c}">${e(m[0])}</span>`;last=re.lastIndex}
  return o+e(s.slice(last));
}

/* ---------- 頁面上的切換按鈕、頁尾說明 ---------- */
(function(){
  const c=document.getElementById("courseCpp"),p=document.getElementById("coursePy"),b=document.getElementById("courseBlk");
  if(c&&p){c.setAttribute("aria-pressed",COURSE==="cpp");p.setAttribute("aria-pressed",COURSE==="py")}
  if(b)b.setAttribute("aria-pressed",COURSE==="blk");
  if(COURSE==="py"){
    const f=document.querySelector("footer");
    if(f){f.dataset.zh="教學用簡化模型：只支援 Python 的一部分語法（print、input、數字、字串、list、tuple、dict、set、if、while、for、def、class，和 collections.deque、heapq、bisect、itertools、copy 的一部分）。";
      f.dataset.en="A simple model for teaching: it supports only part of Python (print, input, numbers, strings, list, tuple, dict, set, if, while, for, def, class, and parts of collections.deque, heapq, bisect, itertools and copy).";f.textContent=f.dataset.zh}
  }
  if(COURSE==="blk"){
    const f=document.querySelector("footer"),h=document.querySelector("#cppView .ph h2");
    if(f){f.dataset.zh="Scratch 模式照 Scratch 的算法（文字會轉成數字、清單從第 1 項開始）；Blockly 模式照 JavaScript 的算法。「詢問並等待」依序拿輸入裡用空白、換行或逗號隔開的值。";
      f.dataset.en="Scratch mode follows Scratch's rules (text is turned into numbers, and lists start at item 1). Blockly mode follows JavaScript's rules. \"Ask and wait\" takes the input values in order, separated by spaces, new lines, or commas.";f.textContent=f.dataset.zh}
    if(h){h.dataset.zh="積木";h.dataset.en="Blocks";h.textContent="積木"}
  }
})();
