/* ================= 圖論課的「圖」：把程式裡的變數畫成點和邊，跟著每一步變化 =================
   課程用 graph:{...} 設定要看哪些變數（名字都是程式裡的變數名稱，沒有就不畫那一項）：
     n、base        有幾個點、點從幾號開始（0 或 1）
     directed       有向圖畫箭頭
     pos            每個點的位置 [[x, y], ...]，0～100；沒給就排成一圈
     from           邊從哪裡來："g"（二維陣列當鄰接矩陣，或二維 vector 當鄰接串列），
                    或 ["eu", "ev"]（兩個陣列：第 i 條邊是 eu[i] → ev[i]）
     edges          程式還沒建好圖的時候，先畫這些邊（虛線）
     visit          visited 陣列：不是 0 的點塗滿（visitNonNeg:true 時改成「>= 0 就算走過」，給 dist 一開始是 -1 的寫法用）
     dist           距離陣列：寫在點的下面
     parent         parent 陣列：parent[v] → v 這條邊畫粗（走訪留下來的樹）
     comp           連通塊編號陣列：同一群同一個顏色
     weight         有權重的圖：矩陣裡的數字就是邊的長度，寫在邊的旁邊（edges 可以寫成 [u, v, 長度]）；
                    dist 裡 >= 1e9 的值畫成 ∞
     from 是二維 vector、裡面放 struct / pair 時：第一個欄位是鄰居，第二個欄位是長度
     from 也可以是 {arr, u, v, w, cur, pick}：struct 陣列存的邊（邊串列）。u、v、w 是欄位名稱（預設 u、v、w），
                    cur 是「現在看第幾條邊」的變數，pick 是「這條邊選了沒」的陣列（選了的畫粗）
     uf             並查集的 p 陣列：同一個老大的點同一個顏色；ufLinks:true 時再畫出 v → p[v] 的箭頭
     title          圖上面的標題（沒給就寫「圖（無向）」或「圖（有向）」）
     cur、nb        「現在在哪個點」「正在看哪個鄰居」的變數名稱
     queue          queue / stack / vector 的名字（裡面放 pair {距離, 點} 時，看最後一個欄位），或 {arr, front, rear}（用陣列做的 queue） */
function renderGraph(L,s){
  const box=document.getElementById("graphBox"),G=L.graph;
  if(!G){box.hidden=true;box.innerHTML="";return}
  box.hidden=false;
  const vars=s?s.vars:[],base=G.base||0,n=G.n,nodes=Array.from({length:n},(_,i)=>base+i);
  const find=nm=>{let v=null;for(const x of vars)if(x.name===nm)v=x;return v};  // 同名時拿最新（最深那一層）的
  const scal=nm=>{const v=nm&&find(nm);return v&&!v.isArr&&v.init[0]&&typeof v.values[0]==="number"?v.values[0]:null};
  const arrAt=(nm,k)=>{const v=nm&&find(nm);if(!v)return null;
    if(v.isArr&&!v.dims)return k<v.len&&v.init[k]?v.values[k]:null;
    if(v.type==="vector"&&Array.isArray(v.values[0]))return v.values[0][k]??null;return null};
  // ---- 邊
  let edges=[],live=false;
  const src=G.from;
  if(Array.isArray(src)){const a=find(src[0]),b=find(src[1]);
    if(a&&b){live=true;for(let i=0;i<Math.min(a.len,b.len);i++)if(a.init[i]&&b.init[i])edges.push([a.values[i],b.values[i]])}}
  else if(src&&src.arr){const v=find(src.arr);
    if(v&&v.sdef){live=true;const F=v.sdef.fields,K=F.length,fi=nm=>F.findIndex(f=>f.name===nm),a=fi(src.u||"u"),b=fi(src.v||"v"),c=fi(src.w||"w");
      for(let i=0;i<v.len;i++){const o=i*K;if(v.init[o+a]&&v.init[o+b])edges.push([v.values[o+a],v.values[o+b],null,c>=0&&v.init[o+c]?v.values[o+c]:null,i])}}}
  else if(src){const v=find(src);
    if(v&&v.dims){live=true;const[R,C]=v.dims;for(let i=0;i<R;i++)for(let j=0;j<C;j++)if(v.init[i*C+j]&&v.values[i*C+j])edges.push([i,j,null,v.values[i*C+j]])}
    else if(v&&v.type==="vector"&&v.elem==="vector"){live=true;v.values[0].forEach((row,u)=>row.forEach(w=>edges.push(w&&w.sdef?[u,w.vals[0],null,w.vals[1]]:[u,w])))}}
  if(G.uf&&G.ufLinks)nodes.forEach(v=>{const q=arrAt(G.uf,v);if(q!==null&&q!==v)edges.push([v,q])});
  // 課程給的 edges：程式還沒存起來的，先畫成虛線
  if(G.edges){const has=(u,v)=>edges.some(([a,b])=>a===u&&b===v||!G.directed&&a===v&&b===u);G.edges.forEach(([u,v,w])=>{if(!has(u,v))edges.push([u,v,"ghost",w])})}
  edges=edges.filter(([u,v])=>nodes.includes(u)&&nodes.includes(v)&&u!==v);
  if(!G.directed){const seen=new Set();edges=edges.filter(([u,v])=>{const k=Math.min(u,v)+"-"+Math.max(u,v);if(seen.has(k))return false;seen.add(k);return true})}
  // ---- 點的狀態
  const curs=vars.filter(x=>x.name===G.cur&&!x.isArr&&x.init[0]).map(x=>x.values[0]);
  const cur=curs.length?curs[curs.length-1]:null,onStack=new Set(curs.slice(0,-1)),nb=scal(G.nb);
  const inQ=new Set();
  if(G.queue){
    if(typeof G.queue==="string"){const q=find(G.queue);if(q&&Array.isArray(q.values[0]))q.values[0].forEach(x=>inQ.add(x&&x.sdef?x.vals[x.vals.length-1]:x))}
    else{const q=find(G.queue.arr),f=scal(G.queue.front),r=scal(G.queue.rear);if(q&&f!==null&&r!==null)for(let i=f;i<r&&i<q.len;i++)inQ.add(q.values[i])}
  }
  const changed=new Set(s?s.changed:[]);
  const flag=(nm,k)=>{const v=arrAt(nm,k);return v!==null&&v!==0};
  const visited=k=>{const v=arrAt(G.visit,k);return v!==null&&(G.visitNonNeg?v>=0:v!==0)};
  const visV=G.visit&&find(G.visit),justVis=k=>visV&&changed.has(visV.id+":"+k);
  // ---- 位置
  const W=360,H=G.h||210,R=17;
  const P=nodes.map((k,i)=>{const p=G.pos&&G.pos[i];
    if(p)return[24+p[0]/100*(W-48),22+p[1]/100*(H-58)];
    const a=-Math.PI/2+2*Math.PI*i/n;return[W/2+Math.cos(a)*(W/2-50),(H-36)/2+8+Math.sin(a)*((H-36)/2-26)]});
  const at=k=>P[k-base];
  // ---- 畫邊
  const tree=new Set();
  if(G.parent)nodes.forEach(v=>{const p=arrAt(G.parent,v);if(p!==null&&nodes.includes(p)&&p!==v)tree.add(p+"-"+v)});
  const isTree=(u,v)=>tree.has(u+"-"+v)||!G.directed&&tree.has(v+"-"+u);
  const eCur=src&&src.arr&&src.cur?scal(src.cur):null,picked=i=>src&&src.arr&&src.pick&&i!=null&&flag(src.pick,i);
  const isCheck=(u,v)=>cur!==null&&nb!==null&&(u===cur&&v===nb||!G.directed&&u===nb&&v===cur);
  let svg="";
  for(const[u,v,ghost,w,ei]of edges){
    const[a,b]=[at(u),at(v)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
    const ar=G.directed||G.ufLinks?3:0,x1=a[0]+ux*R,y1=a[1]+uy*R,x2=b[0]-ux*(R+ar),y2=b[1]-uy*(R+ar);
    const hit=isCheck(u,v)||ei!=null&&ei===eCur;
    const cls="ge"+(ghost?" ghost":"")+(isTree(u,v)||picked(ei)?" tree":"")+(hit?" check":"");
    svg+=`<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${G.directed||G.ufLinks?' marker-end="url(#garr)"':""}/>`;
    // 權重：寫在邊的中間，往旁邊推一點，不要壓在線上
    if(G.weight&&w!=null){const mx=(a[0]+b[0])/2-uy*11,my=(a[1]+b[1])/2+ux*11;
      svg+=`<text class="gw${ghost?" ghost":""}${hit?" check":""}" x="${mx}" y="${my+4}">${w}</text>`}
  }
  // ---- 畫點
  const comp=G.comp&&nodes.some(k=>flag(G.comp,k));
  // 並查集：一直往 p 走，走到 p[x] == x 的就是老大
  const boss=k=>{let x=k;for(let t=0;t<=n;t++){const q=arrAt(G.uf,x);if(q===null||!nodes.includes(q))return null;if(q===x)return x;x=q}return null};
  const ufOn=G.uf&&nodes.some(k=>boss(k)!==null);
  for(const k of nodes){
    const[x,y]=at(k),vis=G.visit&&visited(k);
    let cls="gn";
    if(ufOn){const b=boss(k);if(b!==null)cls+=" grp k"+(b%6)}else if(comp){const c=arrAt(G.comp,k);if(c)cls+=" grp k"+((c-1)%6)}else if(vis)cls+=" vis";
    if(inQ.has(k))cls+=" inq";if(onStack.has(k))cls+=" stk";if(k===cur)cls+=" cur";if(k===nb&&k!==cur)cls+=" nb";if(justVis(k))cls+=" pop";
    svg+=`<g class="${cls}"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y+5}">${k}</text>`;
    if(G.dist){const d=arrAt(G.dist,k);if(d!==null&&d>=0)svg+=`<text class="gd" x="${x}" y="${y+R+14}">${(ENG()&&G.distLabelEn)||G.distLabel||"d"}=${d>=1e9?"∞":d}</text>`}
    svg+=`</g>`;
  }
  // ---- 說明
  const leg=[];
  if(cur!==null)leg.push((ENG()?`<span class="gl cur"></span>current point ${G.cur} = ${cur}`:`<span class="gl cur"></span>現在的點 ${G.cur} = ${cur}`));
  if(nb!==null&&cur!==null)leg.push((ENG()?`<span class="gl nbl"></span>neighbor being checked ${G.nb} = ${nb}`:`<span class="gl nbl"></span>正在看的鄰居 ${G.nb} = ${nb}`));
  if(onStack.size)leg.push((ENG()?`<span class="gl stk"></span>still in the recursion, waiting to come back`:`<span class="gl stk"></span>還在遞迴中，等著回來`));
  if(G.queue&&inQ.size)leg.push((ENG()?`<span class="gl inq"></span>waiting in ${typeof G.queue==="string"?G.queue:G.queue.arr}`:`<span class="gl inq"></span>在 ${typeof G.queue==="string"?G.queue:G.queue.arr} 裡等著`));
  if(G.visit&&!comp)leg.push((ENG()?`<span class="gl vis"></span>${G.visitNonNeg?`${G.visit}[ ] is not -1`:`${G.visit}[ ] is true`} (visited)`:`<span class="gl vis"></span>${G.visitNonNeg?`${G.visit}[ ] 不是 -1`:`${G.visit}[ ] 是 true`}（走過了）`));
  if(comp)leg.push((ENG()?`same color = same group (same ${G.comp}[ ])`:`同一個顏色＝同一群（${G.comp}[ ] 一樣）`));
  if(ufOn)leg.push((ENG()?`same color = same group (same leader)`:`同一個顏色＝同一群（老大一樣）`)+(G.ufLinks?(ENG()?`; arrow v → ${G.uf}[v]`:`；箭頭 v → ${G.uf}[v]`):""));
  if(src&&src.arr&&eCur!==null)leg.push((ENG()?`<span class="gl nbl"></span>edge being checked ${src.arr}[${eCur}]`:`<span class="gl nbl"></span>正在看的邊 ${src.arr}[${eCur}]`));
  if(src&&src.arr&&src.pick&&edges.some(e=>picked(e[4])))leg.push((ENG()?`<span class="gl tre"></span>edges chosen`:`<span class="gl tre"></span>選進來的邊`));
  if(tree.size)leg.push((ENG()?`<span class="gl tre"></span>edges left by parent`:`<span class="gl tre"></span>parent 留下的邊`));
  if(G.weight)leg.push((ENG()?`the number on a line = the length of that edge`:`線上的數字＝這條邊的長度`));
  if(edges.some(e=>e[2]))leg.push((ENG()?`dashed line = the program has not stored this edge yet`:`虛線＝程式還沒把這條邊存起來`));
  box.innerHTML=(ENG()?`<div class="gtitle">${G.titleEn||G.title||"Graph"+(G.directed?" (directed)":" (undirected)")}<span>${G.ufLinks?"":edges.filter(e=>!e[2]).length+" edges"}</span></div>
    <svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph: ${n} points"><defs><marker id="garr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${svg}</svg>
    <div class="glegend">${leg.map(x=>`<span>${x}</span>`).join("")}</div>`:`<div class="gtitle">${G.title||"圖"+(G.directed?"（有向）":"（無向）")}<span>${G.ufLinks?"":edges.filter(e=>!e[2]).length+" 條邊"}</span></div>
    <svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="圖：${n} 個點"><defs><marker id="garr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${svg}</svg>
    <div class="glegend">${leg.map(x=>`<span>${x}</span>`).join("")}</div>`);
}
