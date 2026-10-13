/* ================= 分而治之的拆解圖：遞迴每一次「拆」，畫成樹的一段 =================
   課程用 dc:{fn, lo, hi, arr} 設定：
     fn      遞迴函式的名字（例如 "mergeSort"）
     lo、hi  這個函式表示範圍的兩個參數名稱（含頭含尾，例如 "l"、"r"）
     arr     被拆的那個陣列的名字（main 裡的陣列）
   每一次呼叫畫成一段，同一層畫在同一列；每一格都對齊陣列的位置，看得出來只是把同一塊記憶體切成小段，沒有複製。
   整棵樹的形狀從整個執行過程先算好，往下按只換顏色和數字，畫面不會跳。 */
function renderDC(L,s){
  const D=L.dc;if(!D)return;
  const box=document.getElementById("graphBox"),tr=(ST&&ST.trace)||[],cur=Math.max(0,tr.indexOf(s));
  // ---- 找出每一次呼叫：哪一層、範圍、誰呼叫它、從第幾步活到第幾步、回傳什麼
  const calls=new Map();
  tr.forEach((t,k)=>{
    let lv=-1;
    t.frames.forEach((f,d)=>{
      if(f.label!==D.fn)return;lv++;
      let c=calls.get(f.key);
      if(!c){
        const g=nm=>{const v=t.vars.find(x=>x.scope===f.key&&x.name===nm);return v&&v.init[0]?v.values[0]:null};
        const lo=g(D.lo),hi=g(D.hi);if(lo===null||hi===null)return;
        let p=null;for(let e=d-1;e>=0;e--)if(t.frames[e].label===D.fn){p=t.frames[e].key;break}
        c={key:f.key,lo,hi,lv,par:p,start:k,end:k,ret:null};calls.set(f.key,c);
      }
      c.end=k;
    });
    if(t.retv&&calls.has(t.retv.key))calls.get(t.retv.key).ret=t.retv.v;
  });
  // ---- 被拆的陣列
  const findArr=t=>t&&(t.vars.find(v=>v.name===D.arr&&v.isArr&&v.scope==="main")||t.vars.find(v=>v.name===D.arr&&v.isArr));
  let A=findArr(s);const any=A||tr.map(findArr).find(Boolean);
  const n=any?any.len:0;
  const segs=[...calls.values()].filter(c=>c.hi>=c.lo&&c.lo>=0&&c.hi<n);
  box.hidden=false;
  if(!n||!segs.length){box.innerHTML=`<div class="gtitle">拆解圖</div><div class="glegend dclegend">程式還沒開始拆。</div>`;return}
  // ---- 位置
  const W=360,cw=Math.min(34,(W-24)/n),x0=(W-cw*n)/2,ch=24,gap=28,levels=Math.max(...segs.map(c=>c.lv))+1,H=levels*(ch+gap)-gap+42;
  const X=i=>x0+i*cw,Y=lv=>6+lv*(ch+gap);
  const top=s&&s.frames.length?s.frames[s.frames.length-1].key:null,stack=new Set((s?s.frames:[]).map(f=>f.key));
  const st=c=>c.start>cur?"pend":c.key===top?"cur":stack.has(c.key)?"wait":"done";
  const changed=new Set(s?s.changed:[]);
  const byKey=new Map(segs.map(c=>[c.key,c]));
  let svg="";
  // 線：從上一層的那一段，連到它拆出來的這一段
  for(const c of segs){const p=c.par&&byKey.get(c.par);if(!p)continue;
    svg+=`<line class="dl ${st(c)}" x1="${X((p.lo+p.hi+1)/2)}" y1="${Y(p.lv)+ch}" x2="${X((c.lo+c.hi+1)/2)}" y2="${Y(c.lv)}"/>`}
  // 每一段：一格一格對齊陣列
  for(const c of segs){
    const k=st(c),y=Y(c.lv);let g=`<g class="seg ${k}">`;
    for(let i=c.lo;i<=c.hi;i++){
      const chg=A&&k==="cur"&&changed.has(A.id+":"+i)?" chg":"";
      // 做完的那一段：固定顯示它做完那一刻的樣子；其他的顯示目前的記憶體
      const src=k==="done"?findArr(tr[c.end])||A:A;
      const v=src&&src.init[i]?src.values[i]:"";
      g+=`<rect class="cell${chg}" x="${X(i)}" y="${y}" width="${cw}" height="${ch}"/><text x="${X(i)+cw/2}" y="${y+16}">${esc(String(v))}</text>`;
    }
    g+=`<rect class="box" x="${X(c.lo)-2}" y="${y-2}" width="${(c.hi-c.lo+1)*cw+4}" height="${ch+4}" rx="3"/>`;
    if(c.ret!==null&&cur>c.end)g+=`<text class="rv" x="${X((c.lo+c.hi+1)/2)}" y="${y+ch+13}">→ ${esc(c.ret)}</text>`;
    svg+=g+`</g>`;
  }
  // 陣列的位置：最上面標 [0] [1] ……
  let idx="";for(let i=0;i<n;i++)idx+=`<text class="di" x="${X(i)+cw/2}" y="${H-4}">[${i}]</text>`;
  const now=segs.find(c=>st(c)==="cur");
  const leg=[now?`<b>正在處理</b> ${esc(D.fn)}(${esc(D.lo)} = ${now.lo}, ${esc(D.hi)} = ${now.hi})：粗框那一段`:"粗框＝正在處理的那一段",
    "橘色虛框＝拆好了，等下一層做完回來","淡的虛線＝還沒輪到","底色＝這一段做完了（數字是它做完那一刻的樣子）"];
  if(segs.some(c=>c.ret!==null))leg.push("→ 後面是這一段回傳的答案");
  box.innerHTML=`<div class="gtitle">拆解圖<span>每一列是一層；同一直行就是同一格 ${esc(D.arr)}[i]</span></div>
    <svg class="graph dc" viewBox="0 0 ${W} ${H}" role="img" aria-label="分而治之的拆解圖">${svg}${idx}</svg>
    <div class="glegend dclegend">${leg.map(x=>`<span>${x}</span>`).join("")}</div>`;
}
