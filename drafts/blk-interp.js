/* ================= 積木課的執行器：一塊一塊執行積木，每一步記一張快照 =================
   直接讀 Blockly 存下來的 JSON（Blockly.serialization.workspaces.save 的結果），不轉成 JavaScript，
   所以就算沒有載入 Blockly（例如自動檢查），也能執行課程裡的積木。
   跟 Scratch 一樣：數字和文字會自動轉換；清單從第 1 項開始數；「詢問並等待」一次讀輸入的一行。
   快照的格式跟 C++ 的一樣（out、pos、lastRead、note、done、error……），所以步驟控制、追蹤表、判題都能共用；
   積木課自己的資料放在 s.blk（變數、清單、自訂積木的參數），s.bid 是這一步亮起來的那一塊積木。 */
const BLK_LIMIT=3000;
function blkRun(src,input){
  const tx=(zh,en)=>typeof T==="function"?T(zh,en):zh;
  const trace=[];
  let J;
  try{J=typeof src==="string"?(src.trim()?JSON.parse(src):{}):src||{}}catch(e){J=null}
  const errOnly=msg=>({trace:[{line:0,note:`<div class="err">💥 ${msg}</div>`,out:"",pos:0,vars:[],changed:[],read:[],error:true,done:true,blk:{vars:[],lists:[],frames:[]}}]});
  if(!J)return errOnly(tx("積木的資料壞掉了，讀不出來。","The block data is broken and cannot be read."));
  const tops=(J.blocks&&J.blocks.blocks)||[];
  const varName=new Map((J.variables||[]).map(v=>[v.id,v.name]));
  const starts=tops.filter(b=>b.type==="blk_start");
  const procs=new Map();tops.filter(b=>b.type==="procedures_defnoreturn"||b.type==="procedures_defreturn").forEach(b=>procs.set(b.fields&&b.fields.NAME,b));
  if(!starts.length)return errOnly(tx("找不到「當綠旗被點擊」。程式要從這一塊開始，請把它拉到工作區，下面接上要執行的積木。","Cannot find \"when green flag clicked\". The program starts from this block. Drag it into the workspace and put your blocks under it."));
  // ---------- 狀態 ----------
  const G=new Map(),L=new Map();   // 全域變數（名字 → 值）、清單（名字 → 陣列）
  (J.variables||[]).forEach(v=>{if(v.type==="list")L.set(v.name,[]);else G.set(v.name,0)});
  const frames=[];                  // 自訂積木的參數：一層一層 {label, vars: Map}
  const S={out:"",pos:0,fail:false,answer:"",lastRead:null,changed:new Set(),read:new Set(),notes:[]};
  const inp=input||"";
  const STOP={stop:1},BRK={brk:1},LIM={lim:1};
  // ---------- 小工具 ----------
  const inputOf=(b,n)=>b&&b.inputs&&b.inputs[n]?(b.inputs[n].block||b.inputs[n].shadow||null):null;
  const fieldOf=(b,n)=>b&&b.fields?b.fields[n]:undefined;
  const vname=(b,f="VAR")=>{const x=fieldOf(b,f);return x&&typeof x==="object"?(varName.get(x.id)||x.name||"?"):String(x||"?")};
  const isNumStr=s=>typeof s==="string"&&s.trim()!==""&&!isNaN(+s);
  const num=v=>typeof v==="number"?v:typeof v==="boolean"?(v?1:0):isNumStr(v)?+v:0;
  const str=v=>typeof v==="boolean"?(v?"true":"false"):typeof v==="number"?fmtNum(v):String(v);
  const fmtNum=v=>!isFinite(v)?(v>0?"Infinity":v<0?"-Infinity":"NaN"):String(v);
  const show=v=>typeof v==="string"?`「${esc(v)}」`:esc(str(v));
  const truthy=v=>typeof v==="boolean"?v:typeof v==="number"?v!==0:v!==""&&v!=="0"&&v.toLowerCase()!=="false";
  const note=m=>{if(!S.notes.includes(m))S.notes.push(m)};
  const findVar=n=>{for(let i=frames.length-1;i>=0;i--)if(frames[i].vars.has(n))return{m:frames[i].vars,k:"p"+i+":"+n};return{m:G,k:"v:"+n}};
  // ---------- 快照 ----------
  function snap(b,msg,extra={}){
    if(trace.length>=BLK_LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    const vars=[...G].map(([n,v])=>({name:n,val:v}));
    const lists=[...L].map(([n,a])=>({name:n,items:a.slice()}));
    const fr=frames.map(f=>({label:f.label,vars:[...f.vars].map(([n,v])=>({name:n,val:v}))}));
    // 追蹤表用的格式（跟 C++ 一樣）：一個變數一欄
    const tv=[...vars.map(x=>({id:"v:"+x.name,name:x.name,type:"blk",isArr:false,init:[true],values:[str(x.val)]})),
      ...fr.flatMap((f,i)=>f.vars.map(x=>({id:"p"+i+":"+x.name,name:x.name,type:"blk",isArr:false,init:[true],values:[str(x.val)]})))];
    trace.push({line:0,span:null,bid:b&&b.id,note:msg+warn,out:S.out,pos:S.pos,fail:S.fail,lastRead:S.lastRead,
      vars:tv,changed:[...S.changed].map(k=>k.startsWith("v:")||k.startsWith("p")?k+":0":k),read:[...S.read],
      blk:{vars,lists,frames:fr,answer:S.answer,changed:[...S.changed],read:[...S.read]},...extra});
    S.changed.clear();S.read.clear();S.notes=[];S.lastRead=null;
  }
  // ---------- 積木的文字（說明用）：src 是積木本身的樣子 ----------
  function src(b){
    if(!b)return"?";
    const I=n=>src(inputOf(b,n)),F=n=>fieldOf(b,n);
    switch(b.type){
      case"math_number":return String(F("NUM"));
      case"text":return`"${F("TEXT")}"`;
      case"variables_get":return vname(b);
      case"blk_answer":return tx("詢問的答案","answer");
      case"blk_arith":return`(${I("A")} ${{ADD:"+",MINUS:"-",MULTIPLY:"×",DIVIDE:"÷"}[F("OP")]} ${I("B")})`;
      case"blk_mod":return`(${I("A")} ${tx("除以","mod")} ${I("B")} ${tx("的餘數","")})`.replace(" )",")");
      case"blk_round":return`${tx("四捨五入","round")}(${I("A")})`;
      case"blk_mathfn":return`${fnName(F("OP"))}(${I("A")})`;
      case"blk_random":return`${tx("隨機取數","random")}(${I("FROM")}, ${I("TO")})`;
      case"blk_compare":return`${I("A")} ${{LT:"<",LTE:"≤",EQ:"=",NEQ:"≠",GT:">",GTE:"≥"}[F("OP")]} ${I("B")}`;
      case"blk_logic":return`(${I("A")}) ${F("OP")==="AND"?tx("且","and"):tx("或","or")} (${I("B")})`;
      case"blk_not":return`${tx("不成立","not")} (${I("A")})`;
      case"blk_join":return`${tx("字串組合","join")}(${I("A")}, ${I("B")})`;
      case"blk_letter":return`${I("S")} ${tx("的第","letter")} ${I("N")} ${tx("個字","")}`.trim();
      case"blk_strlen":return`${I("S")} ${tx("的長度","length")}`;
      case"blk_contains":return`${I("S")} ${tx("包含","contains")} ${I("T")}`;
      case"blk_list_item":return`${vname(b,"LIST")} ${tx("的第","item")} ${I("INDEX")} ${tx("項","")}`.trim();
      case"blk_list_length":return`${vname(b,"LIST")} ${tx("的項目數","length")}`;
      case"blk_list_has":return`${vname(b,"LIST")} ${tx("包含","contains")} ${I("ITEM")}`;
      case"blk_list_indexof":return`${I("ITEM")} ${tx("在","in")} ${vname(b,"LIST")} ${tx("裡是第幾項","position")}`;
      case"procedures_callreturn":return`${b.extraState&&b.extraState.name}(${((b.extraState&&b.extraState.params)||[]).map((p,i)=>I("ARG"+i)).join(", ")})`;
    }
    return b.type;
  }
  const fnName=op=>({ABS:tx("絕對值","abs"),FLOOR:tx("無條件捨去","floor"),CEIL:tx("無條件進位","ceil"),SQRT:tx("平方根","sqrt")}[op]||op);
  // ---------- 算值：回傳 {v: 值, t: 代入以後的樣子} ----------
  function ev(b){
    if(!b)return{v:0,t:"0"};
    const I=n=>ev(inputOf(b,n)),F=n=>fieldOf(b,n);
    switch(b.type){
      case"math_number":{const v=+F("NUM");return{v,t:fmtNum(v)}}
      case"text":{const s=String(F("TEXT")??"");return{v:isNumStr(s)?s:s,t:`"${s}"`}}
      case"variables_get":{const n=vname(b),r=findVar(n);S.read.add(r.k);const v=r.m.has(n)?r.m.get(n):0;return{v,t:typeof v==="string"?`"${v}"`:str(v)}}
      case"blk_answer":return{v:S.answer,t:typeof S.answer==="string"?`"${S.answer}"`:str(S.answer)};
      case"blk_arith":{const a=I("A"),c=I("B"),op=F("OP"),x=num(a.v),y=num(c.v);
        if(op==="DIVIDE"&&y===0)note(tx(`⚠ 除以 0！結果是 ${x===0?"NaN（不是數字）":"Infinity（無限大）"}，Scratch 不會當掉，但答案一定錯了。`,`⚠ Division by 0! The result is ${x===0?"NaN (not a number)":"Infinity"}. Scratch does not crash, but the answer is surely wrong.`));
        const v=op==="ADD"?x+y:op==="MINUS"?x-y:op==="MULTIPLY"?x*y:x/y;
        return{v,t:`${a.t} ${{ADD:"+",MINUS:"-",MULTIPLY:"×",DIVIDE:"÷"}[op]} ${c.t}`}}
      case"blk_mod":{const a=I("A"),c=I("B"),x=num(a.v),y=num(c.v);const v=y===0?NaN:((x%y)+y)%y;return{v,t:`${a.t} mod ${c.t}`}}
      case"blk_round":{const a=I("A");return{v:Math.round(num(a.v)),t:`${tx("四捨五入","round")}(${a.t})`}}
      case"blk_mathfn":{const a=I("A"),x=num(a.v),op=F("OP");const v=op==="ABS"?Math.abs(x):op==="FLOOR"?Math.floor(x):op==="CEIL"?Math.ceil(x):Math.sqrt(x);return{v,t:`${fnName(op)}(${a.t})`}}
      case"blk_random":{const a=I("FROM"),c=I("TO");let lo=num(a.v),hi=num(c.v);if(lo>hi)[lo,hi]=[hi,lo];
        const v=Number.isInteger(lo)&&Number.isInteger(hi)?lo+Math.floor(rnd()*(hi-lo+1)):lo+rnd()*(hi-lo);
        note(tx(`ℹ 隨機取數：這次拿到 ${fmtNum(v)}。每次執行都可能不一樣。`,`ℹ Random: this time it is ${fmtNum(v)}. It may be different each time.`));return{v,t:fmtNum(v)}}
      case"blk_compare":{const a=I("A"),c=I("B"),op=F("OP");
        const both=x=>typeof x==="number"||isNumStr(x);const nm=both(a.v)&&both(c.v);
        const x=nm?num(a.v):str(a.v).toLowerCase(),y=nm?num(c.v):str(c.v).toLowerCase();
        const v=op==="LT"?x<y:op==="LTE"?x<=y:op==="EQ"?x===y:op==="NEQ"?x!==y:op==="GT"?x>y:x>=y;
        return{v,t:`${a.t} ${{LT:"<",LTE:"≤",EQ:"=",NEQ:"≠",GT:">",GTE:"≥"}[op]} ${c.t}`}}
      case"blk_logic":{const a=I("A"),and=F("OP")==="AND";
        if(and&&!truthy(a.v)){note(tx("ℹ 左邊已經不成立，「且」的右邊不用算了。","ℹ The left side is already false, so the right side of \"and\" is skipped."));return{v:false,t:`${a.t} ${tx("且","and")} …`}}
        if(!and&&truthy(a.v)){note(tx("ℹ 左邊已經成立，「或」的右邊不用算了。","ℹ The left side is already true, so the right side of \"or\" is skipped."));return{v:true,t:`${a.t} ${tx("或","or")} …`}}
        const c=I("B");return{v:truthy(c.v),t:`(${a.t}) ${and?tx("且","and"):tx("或","or")} (${c.t})`}}
      case"blk_not":{const a=I("A");return{v:!truthy(a.v),t:`${tx("不成立","not")} (${a.t})`}}
      case"blk_join":{const a=I("A"),c=I("B");const v=str(a.v)+str(c.v);return{v,t:`"${v}"`}}
      case"blk_letter":{const n=I("N"),s=I("S"),k=Math.round(num(n.v)),t=str(s.v);
        if(k<1||k>t.length)note(tx(`⚠ ${show(t)} 只有 ${t.length} 個字，沒有第 ${k} 個字，拿到的是空的。`,`⚠ ${show(t)} has only ${t.length} characters. There is no character ${k}, so the result is empty.`));
        const v=t.charAt(k-1);return{v,t:`"${v}"`}}
      case"blk_strlen":{const s=I("S");const v=str(s.v).length;return{v,t:String(v)}}
      case"blk_contains":{const s=I("S"),c=I("T");const v=str(s.v).toLowerCase().includes(str(c.v).toLowerCase());return{v,t:`${s.t} ${tx("包含","contains")} ${c.t}`}}
      case"blk_list_item":{const n=vname(b,"LIST"),a=L.get(n)||[],k=Math.round(num(I("INDEX").v));
        if(k>=1&&k<=a.length)S.read.add("l:"+n+":"+(k-1));
        else note(tx(`⚠ 清單 ${esc(n)} 只有 ${a.length} 項，沒有第 ${k} 項，拿到的是空的。`,`⚠ The list ${esc(n)} has only ${a.length} items. There is no item ${k}, so the result is empty.`));
        const v=k>=1&&k<=a.length?a[k-1]:"";return{v,t:typeof v==="string"?`"${v}"`:str(v)}}
      case"blk_list_length":{const n=vname(b,"LIST"),a=L.get(n)||[];S.read.add("l:"+n);return{v:a.length,t:String(a.length)}}
      case"blk_list_has":{const n=vname(b,"LIST"),a=L.get(n)||[],x=I("ITEM");S.read.add("l:"+n);const v=a.some(y=>str(y).toLowerCase()===str(x.v).toLowerCase());return{v,t:`${esc(n)} ${tx("包含","contains")} ${x.t}`}}
      case"blk_list_indexof":{const n=vname(b,"LIST"),a=L.get(n)||[],x=I("ITEM");S.read.add("l:"+n);const v=a.findIndex(y=>str(y).toLowerCase()===str(x.v).toLowerCase())+1;return{v,t:String(v)}}
      case"procedures_callreturn":{const v=call(b,true);return{v,t:typeof v==="string"?`"${v}"`:str(v)}}
    }
    throw{rt:tx(`這個網頁還不認得「${esc(b.type)}」這種積木。`,`This page does not know the block "${esc(b.type)}" yet.`),b};
  }
  // 隨機數：固定種子，同一份積木、同一筆輸入，每次跑出來的過程都一樣（往回看步驟才不會變）
  let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
  // ---------- 執行一串積木 ----------
  function runStack(b){while(b){exec(b);b=b.next&&b.next.block}}
  function exec(b){
    const I=n=>inputOf(b,n),F=n=>fieldOf(b,n);
    switch(b.type){
      case"blk_say":{const x=ev(I("TEXT")),s=str(x.v);S.out+=s+"\n";
        snap(b,tx(`說出 ${show(s)}：印到螢幕上，最後自動換行。`,`Say ${show(s)}: print it on the screen, then start a new line.`));return}
      case"blk_ask":{
        if(S.pos>=inp.length){S.fail=true;S.answer="";snap(b,tx("詢問並等待：輸入已經<b>全部讀完了</b>，「詢問的答案」變成空的。","Ask and wait: the input is <b>all used up</b>, so \"answer\" becomes empty."));return}
        const nl=inp.indexOf("\n",S.pos),end=nl<0?inp.length:nl;let line=inp.slice(S.pos,end).replace(/\r$/,"");
        S.lastRead=[S.pos,nl<0?end:end+1];S.pos=nl<0?end:end+1;
        const t=line.trim();S.answer=t!==""&&!isNaN(+t)?+t:line;
        snap(b,tx(`詢問並等待：從輸入讀<b>一行</b>，得到 ${show(line)}，放進「詢問的答案」${typeof S.answer==="number"?"（是數字，可以直接拿來算）":""}。`,
          `Ask and wait: read <b>one line</b> of input and get ${show(line)}. It goes into "answer"${typeof S.answer==="number"?" (it is a number, so you can calculate with it)":""}.`));return}
      case"variables_set":{const n=vname(b),x=ev(I("VALUE")),r=findVar(n),old=r.m.get(n);r.m.set(n,x.v);S.changed.add(r.k);
        snap(b,tx(`把變數 <b>${esc(n)}</b> 設為 ${show(x.v)}`+(srcIsLit(I("VALUE"))?"":`（${esc(src(I("VALUE")))} → ${esc(x.t)}）`)+`。原本是 ${show(old)}。`,
          `Set the variable <b>${esc(n)}</b> to ${show(x.v)}`+(srcIsLit(I("VALUE"))?"":` (${esc(src(I("VALUE")))} → ${esc(x.t)})`)+`. It was ${show(old)}.`));return}
      case"math_change":{const n=vname(b),d=ev(I("DELTA")),r=findVar(n),old=r.m.get(n),v=num(old)+num(d.v);r.m.set(n,v);S.changed.add(r.k);
        snap(b,tx(`變數 <b>${esc(n)}</b> 改變 ${show(d.v)}：${show(old)} → ${show(v)}。`,`Change the variable <b>${esc(n)}</b> by ${show(d.v)}: ${show(old)} → ${show(v)}.`));return}
      case"blk_if":case"blk_ifelse":{const c=ev(I("COND")),ok=truthy(c.v),hasElse=b.type==="blk_ifelse";
        snap(b,tx(`如果 〈${esc(src(I("COND")))}〉：${esc(c.t)} → <b>${ok?"成立":"不成立"}</b>，`+(ok?"執行「那麼」裡面的積木。":hasElse?"執行「否則」裡面的積木。":"跳過裡面的積木。"),
          `If 〈${esc(src(I("COND")))}〉: ${esc(c.t)} → <b>${ok?"true":"false"}</b>, `+(ok?"so run the blocks inside \"then\".":hasElse?"so run the blocks inside \"else\".":"so skip the blocks inside.")));
        if(ok)runStack(I("DO"));else if(hasElse)runStack(I("ELSE"));return}
      case"blk_repeat":{const n=Math.round(num(ev(I("TIMES")).v));
        for(let k=1;k<=n;k++){snap(b,tx(`重複 ${n} 次：第 <b>${k}</b> 次。`,`Repeat ${n} times: time <b>${k}</b>.`));if(loopBody(I("DO")))return}
        snap(b,tx(`重複 ${n} 次：做完了，<b>離開迴圈</b>。`,`Repeat ${n} times: done, so <b>leave the loop</b>.`));return}
      case"blk_repeat_until":case"blk_while":{const until=b.type==="blk_repeat_until";let k=0;
        for(;;){const c=ev(I("COND")),ok=truthy(c.v),go=until?!ok:ok;
          snap(b,until?tx(`重複直到 〈${esc(src(I("COND")))}〉：${esc(c.t)} → ${ok?"成立":"不成立"}，`+(go?`繼續做（第 <b>${++k}</b> 次）。`:"<b>停下來，離開迴圈</b>。"),
            `Repeat until 〈${esc(src(I("COND")))}〉: ${esc(c.t)} → ${ok?"true":"false"}, `+(go?`so keep going (time <b>${++k}</b>).`:"so <b>stop and leave the loop</b>."))
            :tx(`當 〈${esc(src(I("COND")))}〉 時重複：${esc(c.t)} → ${ok?"成立":"不成立"}，`+(go?`進入迴圈（第 <b>${++k}</b> 次）。`:"<b>離開迴圈</b>。"),
            `While 〈${esc(src(I("COND")))}〉: ${esc(c.t)} → ${ok?"true":"false"}, `+(go?`so enter the loop (time <b>${++k}</b>).`:"so <b>leave the loop</b>."));
          if(!go)return;if(loopBody(I("DO")))return}}
      case"blk_break":snap(b,tx("跳出迴圈：最近的那一層迴圈立刻結束。","Break: the nearest loop ends right away."));throw BRK;
      case"blk_stop":snap(b,tx("停止程式：後面的積木都不執行了。","Stop: the rest of the blocks will not run."));throw STOP;
      case"blk_list_add":{const n=vname(b,"LIST"),a=L.get(n)||(L.set(n,[]),L.get(n)),x=ev(I("ITEM"));a.push(x.v);S.changed.add("l:"+n+":"+(a.length-1));
        snap(b,tx(`把 ${show(x.v)} 加到清單 <b>${esc(n)}</b> 的最後面，現在有 ${a.length} 項。`,`Add ${show(x.v)} to the end of the list <b>${esc(n)}</b>. Now it has ${a.length} items.`));return}
      case"blk_list_delete":{const n=vname(b,"LIST"),a=L.get(n)||[],k=Math.round(num(ev(I("INDEX")).v));
        if(k<1||k>a.length){note(tx(`⚠ 清單 ${esc(n)} 只有 ${a.length} 項，沒有第 ${k} 項，什麼都沒刪。`,`⚠ The list ${esc(n)} has only ${a.length} items. There is no item ${k}, so nothing is deleted.`));snap(b,tx("刪除清單的項目：沒有這一項。","Delete an item: there is no such item."));return}
        const v=a.splice(k-1,1)[0];S.changed.add("l:"+n);snap(b,tx(`刪除清單 <b>${esc(n)}</b> 的第 ${k} 項（${show(v)}），後面的項目往前補，現在有 ${a.length} 項。`,`Delete item ${k} (${show(v)}) of the list <b>${esc(n)}</b>. The items after it move forward. Now it has ${a.length} items.`));return}
      case"blk_list_clear":{const n=vname(b,"LIST");L.set(n,[]);S.changed.add("l:"+n);snap(b,tx(`把清單 <b>${esc(n)}</b> 的項目全部刪掉，現在是空的。`,`Delete all items of the list <b>${esc(n)}</b>. Now it is empty.`));return}
      case"blk_list_insert":{const n=vname(b,"LIST"),a=L.get(n)||(L.set(n,[]),L.get(n)),x=ev(I("ITEM")),k=Math.round(num(ev(I("INDEX")).v));
        if(k<1||k>a.length+1){note(tx(`⚠ 清單 ${esc(n)} 只有 ${a.length} 項，不能插在第 ${k} 項。`,`⚠ The list ${esc(n)} has only ${a.length} items, so you cannot insert at item ${k}.`));snap(b,tx("插入清單：位置不對，什麼都沒做。","Insert: the position is wrong, so nothing happens."));return}
        a.splice(k-1,0,x.v);S.changed.add("l:"+n+":"+(k-1));snap(b,tx(`把 ${show(x.v)} 插在清單 <b>${esc(n)}</b> 的第 ${k} 項，原本的項目往後移，現在有 ${a.length} 項。`,`Insert ${show(x.v)} at item ${k} of the list <b>${esc(n)}</b>. The items after it move back. Now it has ${a.length} items.`));return}
      case"blk_list_replace":{const n=vname(b,"LIST"),a=L.get(n)||[],k=Math.round(num(ev(I("INDEX")).v)),x=ev(I("ITEM"));
        if(k<1||k>a.length){note(tx(`⚠ 清單 ${esc(n)} 只有 ${a.length} 項，沒有第 ${k} 項可以取代。`,`⚠ The list ${esc(n)} has only ${a.length} items. There is no item ${k} to replace.`));snap(b,tx("取代清單的項目：沒有這一項。","Replace an item: there is no such item."));return}
        const old=a[k-1];a[k-1]=x.v;S.changed.add("l:"+n+":"+(k-1));snap(b,tx(`把清單 <b>${esc(n)}</b> 的第 ${k} 項換成 ${show(x.v)}（原本是 ${show(old)}）。`,`Replace item ${k} of the list <b>${esc(n)}</b> with ${show(x.v)} (it was ${show(old)}).`));return}
      case"procedures_callnoreturn":call(b,false);return;
      case"procedures_ifreturn":{const c=ev(I("CONDITION"));const ok=truthy(c.v);
        snap(b,tx(`如果 〈${esc(src(I("CONDITION")))}〉 就回傳：${ok?"成立，回傳":"不成立，繼續往下"}。`,`If 〈${esc(src(I("CONDITION")))}〉 return: ${ok?"true, so return":"false, so keep going"}.`));
        if(ok)throw{ret:true,v:inputOf(b,"VALUE")?ev(inputOf(b,"VALUE")).v:0};return}
    }
    // 算值的積木單獨放著：算一次，結果不用
    ev(b);snap(b,tx(`算出 ${esc(src(b))}。`,`Compute ${esc(src(b))}.`));
  }
  const srcIsLit=b=>b&&(b.type==="math_number"||b.type==="text");
  function loopBody(b){try{runStack(b)}catch(e){if(e===BRK)return true;throw e}return false}
  // ---------- 自訂積木（Blockly 的 procedures） ----------
  function call(b,wantValue){
    const nm=b.extraState&&b.extraState.name,D=procs.get(nm);
    if(!D)throw{rt:tx(`找不到自訂積木「${esc(nm)}」的定義。`,`Cannot find the definition of the custom block "${esc(nm)}".`),b};
    if(frames.length>=60)throw{rt:tx("自訂積木一層呼叫一層，已經超過 60 層了！如果是遞迴，檢查有沒有停下來的條件。","The custom blocks call each other more than 60 levels deep! If it is recursion, check the stopping condition."),b};
    const ps=(D.extraState&&D.extraState.params||[]).map(p=>p.name);
    const args=ps.map((p,i)=>ev(inputOf(b,"ARG"+i)).v);
    const m=new Map();ps.forEach((p,i)=>{m.set(p,args[i]);S.changed.add("p"+frames.length+":"+p)});
    frames.push({label:nm,vars:m});
    snap(b,tx(`呼叫自訂積木 <b>${esc(nm)}</b>：跳到它的定義去執行`+(ps.length?`，參數 ${ps.map((p,i)=>`${esc(p)} = ${show(args[i])}`).join("、")}`:"")+"。",
      `Call the custom block <b>${esc(nm)}</b>: jump to its definition`+(ps.length?`, with ${ps.map((p,i)=>`${esc(p)} = ${show(args[i])}`).join(", ")}`:"")+"."));
    let ret=0;
    try{runStack(inputOf(D,"STACK"));if(D.type==="procedures_defreturn")ret=inputOf(D,"RETURN")?ev(inputOf(D,"RETURN")).v:0}
    catch(e){if(e&&e.ret)ret=e.v;else{frames.pop();throw e}}
    frames.pop();
    snap(b,tx(`自訂積木 <b>${esc(nm)}</b> 做完了，回到呼叫它的地方`+(wantValue?`，帶回 ${show(ret)}`:"")+"。",`The custom block <b>${esc(nm)}</b> is done. Go back to where it was called`+(wantValue?`, with the value ${show(ret)}`:"")+"."));
    return ret;
  }
  // ---------- 開始 ----------
  try{
    for(const st of starts){
      snap(st,tx("綠旗被點擊：從「當綠旗被點擊」下面的積木開始，<b>由上而下</b>一塊一塊執行。","The green flag is clicked: start from the blocks under \"when green flag clicked\" and run them one by one, <b>from top to bottom</b>."));
      try{runStack(st.next&&st.next.block)}catch(e){if(e!==BRK)throw e}
    }
    snap(null,tx("積木都執行完了，程式結束。","All the blocks have run. The program ends."));trace[trace.length-1].done=true;
  }catch(e){
    if(e===STOP)trace[trace.length-1].done=true;
    else if(e===LIM){trace.push({line:0,note:`<div class="err">${tx(`已經執行超過 ${BLK_LIMIT} 步，先停下來了。很可能是<b>無窮迴圈</b>：檢查迴圈的條件有沒有機會改變。`,`It ran more than ${BLK_LIMIT} steps, so it stopped. It is probably an <b>infinite loop</b>: check if the loop condition can ever change.`)}</div>`,out:S.out,pos:S.pos,vars:[],changed:[],read:[],error:true,done:true,blk:trace.length?trace[trace.length-1].blk:{vars:[],lists:[],frames:[]}})}
    else if(e&&e.rt){S.notes=[];trace.length=Math.min(trace.length,BLK_LIMIT-1);snap(e.b,`<div class="err">💥 ${e.rt}</div>`,{error:true,done:true})}
    else throw e;
  }
  return{trace};
}

/* ---------- 看文字程式碼：把積木翻成 C++ 或 Python（給學生對照，銜接文字式程式設計） ---------- */
function blkToCode(src,lang){
  let J;try{J=typeof src==="string"?JSON.parse(src||"{}"):src}catch(e){return""}
  const tops=(J.blocks&&J.blocks.blocks)||[],varName=new Map((J.variables||[]).map(v=>[v.id,v.name]));
  const py=lang==="py",ind=n=>"    ".repeat(n);
  const inputOf=(b,n)=>b&&b.inputs&&b.inputs[n]?(b.inputs[n].block||b.inputs[n].shadow||null):null;
  const F=(b,n)=>b&&b.fields?b.fields[n]:undefined;
  const vname=(b,f="VAR")=>{const x=F(b,f);return x&&typeof x==="object"?(varName.get(x.id)||"v"):String(x||"v")};
  const id=s=>{let t=String(s).replace(/[^A-Za-z0-9_一-鿿]/g,"_");if(/^[0-9]/.test(t))t="_"+t;return t||"v"};
  const lists=new Set((J.variables||[]).filter(v=>v.type==="list").map(v=>v.name));
  const strVars=new Set();  // C++：被設成文字的變數宣告成 string
  const scan=b=>{if(!b)return;if(b.type==="variables_set"){const v=inputOf(b,"VALUE");if(v&&(v.type==="text"&&isNaN(+F(v,"TEXT"))||v.type==="blk_join"))strVars.add(vname(b))}
    Object.values(b.inputs||{}).forEach(x=>scan(x.block||x.shadow));scan(b.next&&b.next.block)};
  tops.forEach(scan);
  const E=b=>{
    if(!b)return"0";const I=n=>E(inputOf(b,n));
    switch(b.type){
      case"math_number":return String(F(b,"NUM"));
      case"text":{const s=String(F(b,"TEXT")??"");return!isNaN(+s)&&s.trim()!==""?s:JSON.stringify(s)}
      case"variables_get":return id(vname(b));
      case"blk_answer":return"answer";
      case"blk_arith":{const op={ADD:"+",MINUS:"-",MULTIPLY:"*",DIVIDE:"/"}[F(b,"OP")];return`(${I("A")} ${op} ${I("B")})`}
      case"blk_mod":return`(${I("A")} % ${I("B")})`;
      case"blk_round":return py?`round(${I("A")})`:`round(${I("A")})`;
      case"blk_mathfn":{const op=F(b,"OP");return py?{ABS:`abs(${I("A")})`,FLOOR:`math.floor(${I("A")})`,CEIL:`math.ceil(${I("A")})`,SQRT:`math.sqrt(${I("A")})`}[op]:{ABS:`fabs(${I("A")})`,FLOOR:`floor(${I("A")})`,CEIL:`ceil(${I("A")})`,SQRT:`sqrt(${I("A")})`}[op]}
      case"blk_random":return py?`random.randint(${I("FROM")}, ${I("TO")})`:`(${I("FROM")} + rand() % (${I("TO")} - ${I("FROM")} + 1))`;
      case"blk_compare":{const op={LT:"<",LTE:"<=",EQ:"==",NEQ:"!=",GT:">",GTE:">="}[F(b,"OP")];return`${I("A")} ${op} ${I("B")}`}
      case"blk_logic":return`(${I("A")}) ${F(b,"OP")==="AND"?(py?"and":"&&"):(py?"or":"||")} (${I("B")})`;
      case"blk_not":return py?`not (${I("A")})`:`!(${I("A")})`;
      case"blk_join":return py?`str(${I("A")}) + str(${I("B")})`:`(string(${I("A")}) + string(${I("B")}))`;
      case"blk_letter":return`${I("S")}[${I("N")} - 1]`;
      case"blk_strlen":return py?`len(${I("S")})`:`${I("S")}.length()`;
      case"blk_contains":return py?`(${I("T")} in ${I("S")})`:`(${I("S")}.find(${I("T")}) != string::npos)`;
      case"blk_list_item":return`${id(vname(b,"LIST"))}[${I("INDEX")} - 1]`;
      case"blk_list_length":return py?`len(${id(vname(b,"LIST"))})`:`${id(vname(b,"LIST"))}.size()`;
      case"blk_list_has":return py?`(${I("ITEM")} in ${id(vname(b,"LIST"))})`:`(find(${id(vname(b,"LIST"))}.begin(), ${id(vname(b,"LIST"))}.end(), ${I("ITEM")}) != ${id(vname(b,"LIST"))}.end())`;
      case"blk_list_indexof":return py?`(${id(vname(b,"LIST"))}.index(${I("ITEM")}) + 1)`:`(find(${id(vname(b,"LIST"))}.begin(), ${id(vname(b,"LIST"))}.end(), ${I("ITEM")}) - ${id(vname(b,"LIST"))}.begin() + 1)`;
      case"procedures_callreturn":return`${id(b.extraState&&b.extraState.name)}(${((b.extraState&&b.extraState.params)||[]).map((p,i)=>I("ARG"+i)).join(", ")})`;
    }
    return"/* ? */";
  };
  const S=(b,d)=>{let o="";while(b){o+=St(b,d);b=b.next&&b.next.block}return o};
  const blockBody=(b,d)=>{const s=S(b,d);return s||(py?ind(d)+"pass\n":"")};
  const St=(b,d)=>{
    const I=n=>E(inputOf(b,n)),X=n=>inputOf(b,n),p=ind(d);
    switch(b.type){
      case"blk_say":return py?`${p}print(${I("TEXT")})\n`:`${p}cout << ${I("TEXT")} << endl;\n`;
      case"blk_ask":return py?`${p}answer = input()\n`:`${p}getline(cin, answer);\n`;
      case"variables_set":return py?`${p}${id(vname(b))} = ${I("VALUE")}\n`:`${p}${id(vname(b))} = ${I("VALUE")};\n`;
      case"math_change":return py?`${p}${id(vname(b))} += ${I("DELTA")}\n`:`${p}${id(vname(b))} += ${I("DELTA")};\n`;
      case"blk_if":return py?`${p}if ${I("COND")}:\n${blockBody(X("DO"),d+1)}`:`${p}if (${I("COND")}) {\n${S(X("DO"),d+1)}${p}}\n`;
      case"blk_ifelse":return py?`${p}if ${I("COND")}:\n${blockBody(X("DO"),d+1)}${p}else:\n${blockBody(X("ELSE"),d+1)}`:`${p}if (${I("COND")}) {\n${S(X("DO"),d+1)}${p}} else {\n${S(X("ELSE"),d+1)}${p}}\n`;
      case"blk_repeat":return py?`${p}for _ in range(${I("TIMES")}):\n${blockBody(X("DO"),d+1)}`:`${p}for (int k = 0; k < ${I("TIMES")}; k++) {\n${S(X("DO"),d+1)}${p}}\n`;
      case"blk_repeat_until":return py?`${p}while not (${I("COND")}):\n${blockBody(X("DO"),d+1)}`:`${p}while (!(${I("COND")})) {\n${S(X("DO"),d+1)}${p}}\n`;
      case"blk_while":return py?`${p}while ${I("COND")}:\n${blockBody(X("DO"),d+1)}`:`${p}while (${I("COND")}) {\n${S(X("DO"),d+1)}${p}}\n`;
      case"blk_break":return py?`${p}break\n`:`${p}break;\n`;
      case"blk_stop":return py?`${p}exit()\n`:`${p}return 0;\n`;
      case"blk_list_add":return py?`${p}${id(vname(b,"LIST"))}.append(${I("ITEM")})\n`:`${p}${id(vname(b,"LIST"))}.push_back(${I("ITEM")});\n`;
      case"blk_list_delete":return py?`${p}del ${id(vname(b,"LIST"))}[${I("INDEX")} - 1]\n`:`${p}${id(vname(b,"LIST"))}.erase(${id(vname(b,"LIST"))}.begin() + ${I("INDEX")} - 1);\n`;
      case"blk_list_clear":return py?`${p}${id(vname(b,"LIST"))}.clear()\n`:`${p}${id(vname(b,"LIST"))}.clear();\n`;
      case"blk_list_insert":return py?`${p}${id(vname(b,"LIST"))}.insert(${I("INDEX")} - 1, ${I("ITEM")})\n`:`${p}${id(vname(b,"LIST"))}.insert(${id(vname(b,"LIST"))}.begin() + ${I("INDEX")} - 1, ${I("ITEM")});\n`;
      case"blk_list_replace":return py?`${p}${id(vname(b,"LIST"))}[${I("INDEX")} - 1] = ${I("ITEM")}\n`:`${p}${id(vname(b,"LIST"))}[${I("INDEX")} - 1] = ${I("ITEM")};\n`;
      case"procedures_callnoreturn":return`${p}${id(b.extraState&&b.extraState.name)}(${((b.extraState&&b.extraState.params)||[]).map((q,i)=>I("ARG"+i)).join(", ")})${py?"":";"}\n`;
      case"procedures_ifreturn":return py?`${p}if ${E(X("CONDITION"))}:\n${ind(d+1)}return ${X("VALUE")?E(X("VALUE")):""}\n`:`${p}if (${E(X("CONDITION"))}) return ${X("VALUE")?E(X("VALUE")):""};\n`;
    }
    return py?`${p}${E(b)}\n`:`${p}${E(b)};\n`;
  };
  const vars=(J.variables||[]).filter(v=>v.type!=="list").map(v=>v.name);
  const procs=tops.filter(b=>b.type==="procedures_defnoreturn"||b.type==="procedures_defreturn");
  const starts=tops.filter(b=>b.type==="blk_start");
  let o="";
  if(py){
    const used=JSON.stringify(J);if(used.includes("blk_mathfn"))o+="import math\n";if(used.includes("blk_random"))o+="import random\n";if(o)o+="\n";
    if(vars.length)o+=vars.map(v=>`${id(v)} = 0`).join("\n")+"\n";
    if(lists.size)o+=[...lists].map(v=>`${id(v)} = []`).join("\n")+"\n";
    if(vars.length||lists.size)o+="\n";
    procs.forEach(D=>{const ps=(D.extraState&&D.extraState.params||[]).map(q=>id(q.name));
      o+=`def ${id(F(D,"NAME"))}(${ps.join(", ")}):\n${(vars.length||lists.size)?ind(1)+"global "+[...vars.filter(v=>!ps.includes(id(v))).map(id),...[...lists].map(id)].join(", ")+"\n":""}${blockBody(inputOf(D,"STACK"),1)}${D.type==="procedures_defreturn"?ind(1)+"return "+E(inputOf(D,"RETURN"))+"\n":""}\n`});
    starts.forEach(st=>{o+=S(st.next&&st.next.block,0)});
    return o.trimEnd()+"\n";
  }
  o+="#include <iostream>\n#include <string>\n"+(lists.size?"#include <vector>\n":"")+(JSON.stringify(J).includes("blk_mathfn")?"#include <cmath>\n":"")+"using namespace std;\n\n";
  if(vars.length)o+=vars.map(v=>`${strVars.has(v)?"string":"double"} ${id(v)} = ${strVars.has(v)?'""':"0"};`).join("\n")+"\n";
  if(lists.size)o+=[...lists].map(v=>`vector<double> ${id(v)};`).join("\n")+"\n";
  if(JSON.stringify(J).includes("blk_ask"))o+="string answer;  // 詢問的答案\n";
  if(vars.length||lists.size)o+="\n";
  procs.forEach(D=>{const ps=(D.extraState&&D.extraState.params||[]).map(q=>"double "+id(q.name));
    o+=`${D.type==="procedures_defreturn"?"double":"void"} ${id(F(D,"NAME"))}(${ps.join(", ")}) {\n${S(inputOf(D,"STACK"),1)}${D.type==="procedures_defreturn"?ind(1)+"return "+E(inputOf(D,"RETURN"))+";\n":""}}\n\n`});
  o+="int main() {\n";starts.forEach(st=>{o+=S(st.next&&st.next.block,1)});o+="    return 0;\n}\n";
  return o;
}
