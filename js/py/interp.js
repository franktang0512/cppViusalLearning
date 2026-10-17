/* ================= 迷你 Python 直譯器：跟 C++ 那個一樣，把每一步錄成快照 =================
   只支援教學會用到的部分：print、input、int/float/str/bool、list、if/elif/else、while、for、
   f-string（{x} 和 {x:.2f}）、map(int, input().split())。
   記憶體模型照 Python 的觀念：變數是「名字」，指向一個「物件」；= 是把名字貼到物件上。
   快照格式和 C++ 一樣（line、span、note、out、pos、lastRead……），另外多一個 py：{names, objs}，給 js/py/view.js 畫圖。 */
(function(){
const LIMIT=3000;
const BRK={brk:1},CNT={cnt:1},LIM={lim:1};
const KW=new Set(["if","elif","else","while","for","in","break","continue","pass","and","or","not","True","False","None","def","return"]);
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const cerr=(pos,msg)=>({compile:true,pos,msg});

/* ---------- 斷詞：Python 用縮排分區塊，所以要產生 INDENT / DEDENT ---------- */
function tokenize(src,base=0,inline=false){
  const toks=[],ind=[0];let depth=0,i=0;const n=src.length;
  const OPS=["**=","//=","**","//","==","!=","<=",">=","+=","-=","*=","/=","%=","->"];
  let lineStart=true;
  while(i<n){
    if(lineStart&&depth===0&&!inline){
      let j=i,w=0;while(j<n&&(src[j]===" "||src[j]==="\t")){w+=src[j]==="\t"?4:1;j++}
      if(j>=n||src[j]==="\n"||src[j]==="#"){while(j<n&&src[j]!=="\n")j++;i=j+1;continue}  // 空白行、註解行
      if(w>ind[ind.length-1]){if(!toks.length||toks[toks.length-1].t!=="nl"&&toks[toks.length-1].t!=="dedent")throw cerr(base+j,"這一行前面多了空白（縮排）。只有 if、while、for 下面的程式才要往右縮。");ind.push(w);toks.push({t:"indent",v:"",s:base+j,e:base+j})}
      while(w<ind[ind.length-1]){ind.pop();toks.push({t:"dedent",v:"",s:base+j,e:base+j})}
      if(w!==ind[ind.length-1])throw cerr(base+j,"縮排沒有對齊：這一行往左退的位置，跟上面任何一層都對不起來。同一層的程式，前面的空白要一樣多。");
      i=j;lineStart=false;continue;
    }
    const c=src[i];
    if(c==="\n"){if(depth===0&&!inline){toks.push({t:"nl",v:"",s:base+i,e:base+i});lineStart=true}i++;continue}
    if(c===" "||c==="\t"||c==="\r"){i++;continue}
    if(c==="#"){while(i<n&&src[i]!=="\n")i++;continue}
    if(c==="\\"&&src[i+1]==="\n"){i+=2;continue}
    const st=i;
    if(/[0-9]/.test(c)||(c==="."&&/[0-9]/.test(src[i+1]||""))){
      while(i<n&&/[0-9_]/.test(src[i]))i++;let fl=false;
      if(src[i]==="."&&/[0-9]/.test(src[i+1]||"")||src[i]==="."&&!/[A-Za-z_]/.test(src[i+1]||"")){fl=true;i++;while(i<n&&/[0-9_]/.test(src[i]))i++}
      if(/[eE]/.test(src[i]||"")&&/[0-9+-]/.test(src[i+1]||"")){fl=true;i+=2;while(i<n&&/[0-9]/.test(src[i]))i++}
      const raw=src.slice(st,i).replace(/_/g,"");toks.push({t:"num",v:raw,fl,s:base+st,e:base+i});continue;
    }
    if(/[A-Za-z_\u4e00-\u9fff]/.test(c)){
      while(i<n&&/[A-Za-z0-9_\u4e00-\u9fff]/.test(src[i]))i++;const w=src.slice(st,i);
      if((w==="f"||w==="F")&&(src[i]==='"'||src[i]==="'")){const r=readStr(src,i,base);toks.push({t:"fstr",v:r.v,raw:r.raw,s:base+st,e:base+r.end,body:base+i+1});i=r.end;continue}
      toks.push({t:KW.has(w)?"kw":"id",v:w,s:base+st,e:base+i});continue;
    }
    if(c==='"'||c==="'"){const r=readStr(src,i,base);toks.push({t:"str",v:r.v,s:base+st,e:base+r.end});i=r.end;continue}
    let op=OPS.find(o=>src.startsWith(o,i));
    if(!op&&"+-*/%<>=()[]{},:.".includes(c))op=c;
    if(!op){
      if(c.charCodeAt(0)>127)throw cerr(base+st,`看不懂「${c}」。是不是打成全形符號了？程式碼裡的符號（括號、引號、逗號、冒號）都要用半形。`);
      throw cerr(base+st,`看不懂的符號「${c}」`);
    }
    if("([{".includes(op))depth++;if(")]}".includes(op))depth=Math.max(0,depth-1);
    i+=op.length;toks.push({t:"op",v:op,s:base+st,e:base+i});
  }
  if(!inline){if(toks.length&&toks[toks.length-1].t!=="nl")toks.push({t:"nl",v:"",s:base+n,e:base+n});while(ind.length>1){ind.pop();toks.push({t:"dedent",v:"",s:base+n,e:base+n})}}
  toks.push({t:"eof",v:"",s:base+n,e:base+n});return toks;
}
function readStr(src,i,base){
  const q=src[i];const triple=src.startsWith(q.repeat(3),i);let j=i+(triple?3:1),v="",raw="";
  for(;;){
    if(j>=src.length||(!triple&&src[j]==="\n"))throw cerr(base+i,`字串少了結尾的引號 ${q}`);
    if(triple?src.startsWith(q.repeat(3),j):src[j]===q)break;
    if(src[j]==="\\"){const d=src[j+1];v+={n:"\n",t:"\t","\\":"\\","'":"'",'"':'"',"0":"\0"}[d]??("\\"+d);raw+=src[j]+d;j+=2;continue}
    v+=src[j];raw+=src[j];j++;
  }
  return{v,raw,end:j+(triple?3:1)};
}

/* ---------- 語法分析 ---------- */
function parse(src){
  const T=tokenize(src);let p=0;
  const peek=(k=0)=>T[Math.min(p+k,T.length-1)],next=()=>T[p++];
  const is=(v,k=0)=>{const t=peek(k);return(t.t==="op"||t.t==="kw")&&t.v===v};
  const expect=(v,msg)=>{if(!is(v)){const t=peek();throw cerr(t.t==="nl"?t.s:t.s,msg||`這裡應該要有「${v}」`)}return next()};
  function endStmt(){const t=peek();if(t.t==="nl"){next();return}if(t.t==="eof"||t.t==="dedent")return;
    throw cerr(t.s,t.t==="op"&&t.v==="="?"這裡不能用 =。如果是要比較「相等」，要寫 ==。":`這一行後面多了「${t.v}」。一行只能寫一個指令；如果是要把好幾個東西一起印出來，要用逗號隔開。`)}
  function block(){
    expect(":","這一行的最後要加冒號 :（if、elif、else、while、for 的那一行都要）");
    if(peek().t!=="nl"){const s=simple();return[s]}  // if x: print(x) 寫在同一行
    next();if(peek().t!=="indent")throw cerr(peek().s,"冒號下面的程式要往右縮排（通常是 4 個空白），表示它屬於上面那一行。");
    next();const body=[];while(peek().t!=="dedent"&&peek().t!=="eof")body.push(stmt());if(peek().t==="dedent")next();return body;
  }
  function stmt(){
    const t=peek();
    if(t.t==="indent")throw cerr(t.s,"這一行前面多了空白（縮排）。");
    if(is("if")){next();inCond=true;const c0=expr();inCond=false;const br=[{cond:c0,s:t.s}];br[0].e=T[p-1].e;br[0].body=block();let els=null;
      while(is("elif")){const t2=next();inCond=true;const c=expr();inCond=false;const b={cond:c,s:t2.s,e:T[p-1].e};b.body=block();br.push(b)}
      if(is("else")){const t3=next();els={s:t3.s,e:t3.e,body:block()}}
      return{k:"if",br,els,s:t.s,e:br[0].e}}
    if(is("else")||is("elif"))throw cerr(t.s,`這個 ${t.v} 找不到對應的 if。檢查 ${t.v} 有沒有跟上面的 if 對齊（縮排一樣多）。`);
    if(is("while")){next();inCond=true;const cond=expr();inCond=false;const e=T[p-1].e;return{k:"while",cond,body:block(),s:t.s,e}}
    if(is("for")){next();const tg=target(primary());if(!is("in"))throw cerr(peek().s,"for 的寫法是 for 變數 in 範圍:，例如 for i in range(5):");next();const it=expr();const e=T[p-1].e;return{k:"for",tg,it,body:block(),s:t.s,e}}
    if(is("def"))throw cerr(t.s,"函式（def）會在後面的章節教，這個網頁目前還沒支援。");
    return simple();
  }
  function simple(){
    const t=peek();
    if(is("pass")){next();endStmt();return{k:"pass",s:t.s,e:t.e}}
    if(t.t==="id"&&(t.v==="import"||t.v==="from")){next();const m=next();
      if(t.v==="from"||m.v!=="sys")throw cerr(m.s,"這個網頁目前只支援 import sys");
      endStmt();return{k:"import",name:"sys",s:t.s,e:m.e}}
    if(is("break")||is("continue")){next();endStmt();return{k:t.v,s:t.s,e:t.e}}
    const x=exprList();
    if(is("=")){
      const tg=target(x);next();const r=exprList();
      if(is("="))throw cerr(peek().s,"這個網頁還不支援連續指定（a = b = 0），請分成兩行寫。");
      endStmt();return{k:"assign",tg,x:r,s:x.s,e:r.e};
    }
    const at=peek();
    if(at.t==="op"&&["+=","-=","*=","/=","//=","%=","**="].includes(at.v)){
      if(x.k!=="name"&&x.k!=="index")throw cerr(x.s,`${at.v} 的左邊要是一個變數`);
      next();const r=expr();endStmt();return{k:"aug",op:at.v.slice(0,-1),tg:x,x:r,s:x.s,e:r.e};
    }
    endStmt();return{k:"expr",x,s:x.s,e:x.e};
  }
  function target(x){
    if(x.k==="name"||x.k==="index")return x;
    if(x.k==="tuple"){x.items.forEach(target);return x}
    if(x.k==="call")throw cerr(x.s,"等號左邊不能是函式呼叫。是不是寫反了？要寫成 變數 = 函式(...)");
    throw cerr(x.s,"等號左邊必須是變數名稱（= 是把右邊的值貼上左邊的名字，不是數學的等於）");
  }
  function exprList(){const x=expr();if(!is(","))return x;const items=[x];while(is(",")){next();if(peek().t==="nl"||is("=")||is(")"))break;items.push(expr())}return{k:"tuple",items,s:x.s,e:items[items.length-1].e}}
  const expr=()=>orE();
  function orE(){let l=andE();while(is("or")){next();const r=andE();l={k:"bool",op:"or",l,r,s:l.s,e:r.e}}return l}
  function andE(){let l=notE();while(is("and")){next();const r=notE();l={k:"bool",op:"and",l,r,s:l.s,e:r.e}}return l}
  function notE(){if(is("not")){const t=next();const x=notE();return{k:"not",x,s:t.s,e:x.e}}return cmpE()}
  function cmpE(){
    const first=addE(),ops=[],items=[first];
    for(;;){const t=peek();
      if(t.t==="op"&&["<",">","==","!=","<=",">="].includes(t.v)){next();ops.push(t.v);items.push(addE());continue}
      if(is("in")){next();ops.push("in");items.push(addE());continue}
      if(is("not")&&is("in",1)){next();next();ops.push("not in");items.push(addE());continue}
      if(t.t==="op"&&t.v==="="&&inCond)throw cerr(t.s,"條件裡要用 == 比較「相等」。一個等號 = 是把值貼到名字上，不能放在 if、while 的條件裡。");
      break}
    return ops.length?{k:"cmp",ops,items,s:first.s,e:items[items.length-1].e}:first;
  }
  let inCond=false;
  const bin=(sub,ops)=>()=>{let l=sub();while(peek().t==="op"&&ops.includes(peek().v)){const op=next().v;const r=sub();l={k:"bin",op,l,r,s:l.s,e:r.e}}return l};
  const mulE=bin(()=>unary(),["*","/","//","%"]);
  const addE=bin(mulE,["+","-"]);
  function unary(){const t=peek();if(t.t==="op"&&(t.v==="-"||t.v==="+")){next();const x=unary();return{k:"un",op:t.v,x,s:t.s,e:x.e}}return power()}
  function power(){const b=postfix();if(is("**")){next();const e=unary();return{k:"bin",op:"**",l:b,r:e,s:b.s,e:e.e}}return b}
  function postfix(){
    let x=primary();
    for(;;){
      if(is("(")){next();const args=[],kw=[];
        while(!is(")")){
          if(peek().t==="eof"||peek().t==="nl")throw cerr(x.s,"這個 ( 沒有對應的 )");
          if(peek().t==="id"&&is("=",1)){const k=next();next();kw.push({name:k.v,x:expr(),s:k.s})}
          else{if(kw.length)throw cerr(peek().s,"有名字的參數（例如 sep=）要放在最後面");args.push(expr())}
          if(is(",")){next();continue}
          if(!is(")")){const t=peek();throw cerr(t.s,t.t==="str"||t.t==="num"||t.t==="id"?"括號裡的東西之間要用逗號 , 隔開":`這裡應該要有「)」`)}
        }
        const c=next();x={k:"call",f:x,args,kw,s:x.s,e:c.e};continue}
      if(is("[")){next();const i=expr();const c=expect("]");x={k:"index",obj:x,i,s:x.s,e:c.e};continue}
      if(is(".")){next();const m=next();if(m.t!=="id")throw cerr(m.s,"點後面要接名稱，例如 s.split()");x={k:"attr",obj:x,name:m.v,s:x.s,e:m.e};continue}
      return x;
    }
  }
  function primary(){
    const t=next();
    if(t.t==="num"){if(t.fl)return{k:"num",v:parseFloat(t.v),fl:true,s:t.s,e:t.e};return{k:"num",v:BigInt(t.v),s:t.s,e:t.e}}
    if(t.t==="str"){let v=t.v,e=t.e;while(peek().t==="str"){const u=next();v+=u.v;e=u.e}return{k:"str",v,s:t.s,e}}
    if(t.t==="fstr")return fstring(t);
    if(t.t==="kw"&&["True","False","None"].includes(t.v))return{k:"const",v:t.v,s:t.s,e:t.e};
    if(t.t==="id")return{k:"name",id:t.v,s:t.s,e:t.e};
    if(t.t==="op"&&t.v==="("){if(is(")")){const c=next();return{k:"tuple",items:[],s:t.s,e:c.e}}const x=exprList();const c=expect(")","這個 ( 沒有對應的 )");return{...x,s:t.s,e:c.e,paren:true}}
    if(t.t==="op"&&t.v==="["){const items=[];while(!is("]")){items.push(expr());if(is(","))next();else if(!is("]"))throw cerr(peek().s,"list 裡面的東西要用逗號隔開")}const c=next();return{k:"list",items,s:t.s,e:c.e}}
    if(t.t==="nl"||t.t==="eof")throw cerr(t.s,"這一行好像還沒寫完");
    if(t.t==="kw")throw cerr(t.s,`「${t.v}」是 Python 的保留字，不能放在這裡`);
    throw cerr(t.s,`這裡不該出現「${t.v}」`);
  }
  // f"...{x}...{y:.2f}..."：把大括號裡的算式拿出來另外分析
  function fstring(t){
    const parts=[],raw=t.raw;let i=0,lit="";
    while(i<raw.length){
      const c=raw[i];
      if(c==="{"&&raw[i+1]==="{"){lit+="{";i+=2;continue}
      if(c==="}"&&raw[i+1]==="}"){lit+="}";i+=2;continue}
      if(c==="{"){
        if(lit)parts.push({lit:unesc(lit)});lit="";
        let j=i+1,d=0;while(j<raw.length&&!(raw[j]==="}"&&d===0)){if(raw[j]==="(")d++;if(raw[j]===")")d--;j++}
        if(j>=raw.length)throw cerr(t.body+i,"f 字串的 { 沒有對應的 }");
        let inner=raw.slice(i+1,j),spec="";const ci=inner.lastIndexOf(":");if(ci>=0&&!/[\[\(]/.test(inner.slice(ci))){spec=inner.slice(ci+1);inner=inner.slice(0,ci)}
        if(!inner.trim())throw cerr(t.body+i,"f 字串的 { } 裡面要放算式，例如 {x}");
        const sub=tokenize(inner,t.body+i+1,true),save={T:T.slice(),p};
        T.length=0;T.push(...sub);p=0;const x=expr();if(peek().t!=="eof")throw cerr(peek().s,"f 字串的 { } 裡面只能放一個算式");
        T.length=0;T.push(...save.T);p=save.p;
        parts.push({x,spec});i=j+1;continue;
      }
      lit+=c;i++;
    }
    if(lit)parts.push({lit:unesc(lit)});
    return{k:"fstr",parts,s:t.s,e:t.e};
  }
  const unesc=s=>s.replace(/\\(.)/g,(m,d)=>({n:"\n",t:"\t","\\":"\\","'":"'",'"':'"'}[d]??m));
  const prog=[];while(peek().t!=="eof"){if(peek().t==="nl"){next();continue}if(peek().t==="dedent"){next();continue}prog.push(stmt())}
  return prog;
}

/* ---------- 執行 ---------- */
function run(prog,src,input){
  const starts=[0];for(let i=0;i<src.length;i++)if(src[i]==="\n")starts.push(i+1);
  const lineOf=off=>{let l=0;while(l+1<starts.length&&starts[l+1]<=off)l++;return l+1};
  const txt=n=>src.slice(n.s,n.e);
  const heap=new Map();let oid=0;
  const names=new Map();  // 名字 → 物件 id
  const S={out:"",inp:input||"",pos:0,lastRead:null,notes:[],changed:new Set(),read:new Set(),fresh:new Set(),dead:[],lastPrint:"",printed:false,
    cells:new Set(),cellRead:new Set()};  // list 裡被改、被讀的格子：「list 的 id:第幾格」
  const trace=[];
  /* 物件 */
  const mk=(t,v)=>{const o={id:++oid,t,v};heap.set(o.id,o);S.fresh.add(o.id);return o};
  const I=v=>mk("int",BigInt(v)),F=v=>mk("float",v),Str=v=>mk("str",v),B=v=>mk("bool",!!v),NONE=()=>mk("none",null);
  const TN={int:"int",float:"float",str:"str",bool:"bool",none:"NoneType",list:"list",tuple:"tuple",map:"map",range:"range",type:"type",builtin:"builtin_function_or_method",module:"module",stdin:"stdin"};
  function floatStr(x){
    if(Number.isNaN(x))return"nan";if(!isFinite(x))return x>0?"inf":"-inf";
    if(Number.isInteger(x)&&Math.abs(x)<1e16)return x.toFixed(1);
    let s=String(x);if(/e/.test(s)){s=s.replace(/e([+-])(\d)$/,"e$10$2")}return s;
  }
  function str(o){  // print 印出來的樣子
    switch(o.t){case"int":return o.v.toString();case"float":return floatStr(o.v);case"str":return o.v;case"bool":return o.v?"True":"False";case"none":return"None";
      case"list":return`[${o.v.map(i=>repr(heap.get(i))).join(", ")}]`;case"tuple":return`(${o.v.map(i=>repr(heap.get(i))).join(", ")}${o.v.length===1?",":""})`;
      case"type":return`<class '${o.v}'>`;case"map":return"<map object>";case"module":return`<module '${o.v}'>`;case"stdin":return"<stdin>";case"range":return`range(${o.v.join(", ")})`;case"builtin":return`<built-in function ${o.v}>`}
    return"?";
  }
  function repr(o){if(o.t==="str")return"'"+o.v.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n")+"'";return str(o)}
  /* 快照：只畫得到的物件（有名字指著，或在 list 裡） */
  function reach(){
    const seen=new Set(),order=[];
    const walk=id=>{if(seen.has(id))return;seen.add(id);order.push(id);const o=heap.get(id);if(o&&(o.t==="list"||o.t==="tuple"||o.t==="map"))o.v.forEach(walk)};
    for(const id of names.values())walk(id);
    return order;
  }
  function snap(node,note,extra={},force){
    if(!force&&trace.length>=LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    const live=reach();
    const objs=live.map(id=>{const o=heap.get(id);const v={id,t:o.t,tn:TN[o.t],repr:repr(o)};
      if(o.t==="list"||o.t==="tuple"||o.t==="map")v.items=o.v.map(i=>{const x=heap.get(i);return{id:i,t:x.t,repr:repr(x),ref:x.t==="list"||x.t==="tuple"}});
      return v});
    const nm=[...names.entries()].filter(([,id])=>heap.get(id).t!=="module").map(([name,id])=>({name,ref:id}));  // import 進來的模組不畫
    trace.push({line:node?lineOf(node.s):0,span:node?[node.s,node.e]:[0,0],note:note+warn,out:S.out,pos:S.pos,fail:false,lastRead:S.lastRead,
      changed:[...S.changed].map(n=>"n:"+n+":0"),read:[...S.read].map(n=>"n:"+n+":0"),
      vars:nm.map(x=>({id:"n:"+x.name,name:x.name,type:"py",values:[repr(heap.get(x.ref))],init:[true],isArr:false})),
      py:{names:nm,objs,changed:[...S.changed],read:[...S.read],fresh:[...S.fresh].filter(id=>live.includes(id)),dead:S.dead.slice(),cells:[...S.cells],cellRead:[...S.cellRead]},frames:[{key:"main",label:"main"}],refs:[],...extra});
    S.changed.clear();S.read.clear();S.fresh.clear();S.dead=[];S.notes=[];S.lastRead=null;S.cells.clear();S.cellRead.clear();
  }
  const rterr=(node,msg)=>({rt:true,node,msg});
  const note=m=>{if(!S.notes.includes(m))S.notes.push(m)};
  const kind=o=>({int:"整數（int）",float:"小數（float）",str:"字串（str）",bool:"布林（bool）",none:"None",list:"串列（list）",tuple:"tuple",map:"map 物件"}[o.t]||o.t);
  const isNum=o=>o.t==="int"||o.t==="float"||o.t==="bool";
  const num=o=>o.t==="bool"?BigInt(o.v?1:0):o.v;
  const toF=o=>o.t==="float"?o.v:Number(num(o));
  function truthy(o){switch(o.t){case"int":return o.v!==0n;case"float":return o.v!==0;case"str":return o.v!=="";case"bool":return o.v;case"none":return false;case"list":case"tuple":return o.v.length>0}return true}
  function lookup(n){
    if(names.has(n.id)){S.read.add(n.id);return heap.get(names.get(n.id))}
    if(BUILTINS[n.id])return mk("builtin",n.id);
    throw rterr(n,`<b>NameError</b>：名字 <code>${esc(n.id)}</code> 還沒有貼到任何東西上，就被拿來用了。<br>Python 的變數要先用 = 給值，才能使用；也檢查一下是不是打錯字（大小寫也要一樣）。`);
  }
  /* ---------- 算式 ---------- */
  function arith(op,a,b,n){
    const T_=`<code>${esc(txt(n))}</code>`;
    if(op==="+"&&a.t==="str"&&b.t==="str")return Str(a.v+b.v);
    if(op==="+"&&a.t==="list"&&b.t==="list")return mk("list",[...a.v,...b.v]);
    if(op==="*"&&(a.t==="str"&&b.t==="int"||a.t==="int"&&b.t==="str")){const s=a.t==="str"?a:b,k=Number(a.t==="int"?a.v:b.v);return Str(k>0?s.v.repeat(k):"")}
    if(op==="*"&&(a.t==="list"&&b.t==="int"||a.t==="int"&&b.t==="list")){
      const l=a.t==="list"?a:b,k=Number(a.t==="int"?a.v:b.v);if(k*l.v.length>200)throw rterr(n,"這個網頁最多只能畫 200 格的 list，請開小一點。");
      const v=[];for(let i=0;i<k;i++)v.push(...l.v);
      note(`ℹ <code>${esc(txt(n))}</code>：把 list 重複 ${k} 次，得到 ${v.length} 格。`);return mk("list",v)}
    if(!isNum(a)||!isNum(b)){
      if((a.t==="str")!==(b.t==="str")&&op==="+")throw rterr(n,`<b>TypeError</b>：${T_} 想把${kind(a)}和${kind(b)}用 + 接起來，Python 不會自動幫你轉換。<br>要接成一段文字：用 <code>str( )</code> 把數字變成字串；要做加法：用 <code>int( )</code> 把字串變成數字。`);
      throw rterr(n,`<b>TypeError</b>：${kind(a)}和${kind(b)}不能用 ${esc(op)} 計算（${T_}）。`);
    }
    if(op==="/"){const y=toF(b);if(y===0)throw rterr(n,`<b>ZeroDivisionError</b>：除以 0！程式在這裡停下來了。`);return F(toF(a)/y)}
    if(a.t==="float"||b.t==="float"){
      const x=toF(a),y=toF(b);
      if((op==="//"||op==="%")&&y===0)throw rterr(n,`<b>ZeroDivisionError</b>：除以 0！`);
      if(op==="+")return F(x+y);if(op==="-")return F(x-y);if(op==="*")return F(x*y);if(op==="**")return F(Math.pow(x,y));
      if(op==="//")return F(Math.floor(x/y));if(op==="%")return F(x-Math.floor(x/y)*y);
    }
    const x=num(a),y=num(b);
    if(op==="+")return I(x+y);if(op==="-")return I(x-y);if(op==="*")return I(x*y);
    if(op==="**"){if(y<0n)return F(Math.pow(Number(x),Number(y)));if(y>100000n)throw rterr(n,"指數太大了，這個網頁算不動。");return I(x**y)}
    if(y===0n)throw rterr(n,`<b>ZeroDivisionError</b>：除以 0！程式在這裡停下來了。`);
    let q=x/y;if((x%y!==0n)&&((x<0n)!==(y<0n)))q-=1n;   // // 是「往下」取整數（往負無限大），不是直接丟掉小數
    if(op==="//"){if(x<0n!==y<0n&&x%y!==0n)note(`ℹ <code>${esc(txt(n))}</code>：// 是<b>往下</b>取整數。${x} ÷ ${y} = ${(Number(x)/Number(y)).toString()}，往下取是 ${q}（不是直接把小數丟掉）。`);return I(q)}
    if(op==="%")return I(x-q*y);
  }
  function compare(op,a,b,n){
    if(op==="=="||op==="!="){const eq=same(a,b);return op==="=="?eq:!eq}
    if(op==="in"||op==="not in"){let r;if(b.t==="str"){if(a.t!=="str")throw rterr(n,"<b>TypeError</b>：in 左邊要是字串");r=b.v.includes(a.v)}else if(b.t==="list"||b.t==="tuple")r=b.v.some(i=>same(a,heap.get(i)));else throw rterr(n,`<b>TypeError</b>：${kind(b)}不能用 in`);return op==="in"?r:!r}
    let x,y;
    if(isNum(a)&&isNum(b)){if(a.t==="float"||b.t==="float"){x=toF(a);y=toF(b)}else{x=num(a);y=num(b)}}
    else if(a.t==="str"&&b.t==="str"){x=a.v;y=b.v}
    else throw rterr(n,`<b>TypeError</b>：${kind(a)}和${kind(b)}不能比大小（<code>${esc(txt(n))}</code>）。是不是忘了用 int( ) 把輸入轉成數字？`);
    return{"<":x<y,">":x>y,"<=":x<=y,">=":x>=y}[op];
  }
  function same(a,b){
    if(isNum(a)&&isNum(b)){if(a.t==="float"||b.t==="float")return toF(a)===toF(b);return num(a)===num(b)}
    if(a.t!==b.t)return false;
    if(a.t==="list"||a.t==="tuple")return a.v.length===b.v.length&&a.v.every((x,i)=>same(heap.get(x),heap.get(b.v[i])));
    return a.v===b.v;
  }
  function ev(n){
    switch(n.k){
      case"num":return n.fl?F(n.v):I(n.v);
      case"str":return Str(n.v);
      case"const":return n.v==="None"?NONE():B(n.v==="True");
      case"name":return lookup(n);
      case"list":return mk("list",n.items.map(x=>ev(x).id));
      case"tuple":return mk("tuple",n.items.map(x=>ev(x).id));
      case"bin":return arith(n.op,ev(n.l),ev(n.r),n);
      case"un":{const a=ev(n.x);if(!isNum(a))throw rterr(n,`<b>TypeError</b>：${kind(a)}前面不能加 ${n.op}`);if(n.op==="+")return a;return a.t==="float"?F(-a.v):I(-num(a))}
      case"not":return B(!truthy(ev(n.x)));
      case"bool":{const a=ev(n.l);
        if(n.op==="and"&&!truthy(a)){note(`ℹ <code>${esc(txt(n.l))}</code> 已經是 False，and 右邊<b>不會執行</b>（短路）。`);return a}
        if(n.op==="or"&&truthy(a)){note(`ℹ <code>${esc(txt(n.l))}</code> 已經是 True，or 右邊<b>不會執行</b>（短路）。`);return a}
        return ev(n.r)}
      case"cmp":{let a=ev(n.items[0]);for(let i=0;i<n.ops.length;i++){const b=ev(n.items[i+1]);if(!compare(n.ops[i],a,b,n))return B(false);a=b}return B(true)}
      case"index":{
        const o=ev(n.obj),k=ev(n.i);
        if(o.t!=="list"&&o.t!=="str"&&o.t!=="tuple")throw rterr(n,`<b>TypeError</b>：${kind(o)}不能用 [ ] 拿裡面的東西`);
        if(k.t!=="int")throw rterr(n,`<b>TypeError</b>：[ ] 裡面要放整數，<code>${esc(txt(n.i))}</code> 是${kind(k)}`);
        const len=o.t==="str"?o.v.length:o.v.length;let i=Number(k.v);const orig=i;if(i<0)i+=len;
        if(i<0||i>=len)throw rterr(n,`<b>IndexError</b>：<code>${esc(txt(n.obj))}</code> 只有 ${len} 個（索引 0 ～ ${len-1}${len?`，或 -1 ～ -${len}`:""}），沒有第 ${orig} 個。`);
        if(orig<0)note(`ℹ 索引 ${orig} 是從後面數回來：<code>${esc(txt(n))}</code> 就是第 ${i} 個。`);
        if(o.t==="list")S.cellRead.add(o.id+":"+i);
        return o.t==="str"?Str(o.v[i]):heap.get(o.v[i]);
      }
      case"attr":{
        if(n.obj.k==="name"&&n.obj.id==="sys"&&names.has("sys")&&n.name==="stdin")return mk("stdin",null);
        throw rterr(n,`.${esc(n.name)} 後面要加括號 ( ) 才會執行，例如 .${esc(n.name)}()`);
      }
      case"call":return call(n);
      case"fstr":{let s="";for(const p of n.parts){if(p.lit!=null){s+=p.lit;continue}const o=ev(p.x);s+=fmtSpec(o,p.spec,p.x)}return Str(s)}
    }
    throw rterr(n,"這個網頁還不支援這種寫法");
  }
  function fmtSpec(o,spec,n){
    if(!spec)return str(o);
    const m=spec.match(/^\.(\d+)f$/);
    if(m){if(!isNum(o))throw rterr(n,`<b>ValueError</b>：{ :${esc(spec)}} 只能用在數字上`);const d=+m[1];note(`ℹ <code>{${esc(txt(n))}:${esc(spec)}}</code>：印到小數點後 ${d} 位（四捨五入，不夠補 0）。`);return toF(o).toFixed(d)}
    if(spec==="d"&&o.t==="int")return o.v.toString();
    if(spec==="g"){
      // :g 跟 C++ 的 cout 一樣：最多 6 位有效數字，後面多餘的 0 和小數點都拿掉
      if(!isNum(o))throw rterr(n,`<b>ValueError</b>：{ :g} 只能用在數字上`);
      const x=toF(o);let r;
      if(x===0)r="0";else if(!isFinite(x))r=x>0?"inf":"-inf";
      else{const e=Math.floor(Math.log10(Math.abs(x)));
        if(e<-4||e>=6){let[m,ex]=x.toExponential(5).split("e");m=String(+m);const k=parseInt(ex,10);r=m+"e"+(k<0?"-":"+")+String(Math.abs(k)).padStart(2,"0")}
        else r=String(+x.toPrecision(6))}
      note(`ℹ <code>{${esc(txt(n))}:g}</code>：最多印 6 位有效數字，後面多的 0 不印，所以 ${esc(str(o))} 印成 ${esc(r)}。`);return r;
    }
    throw rterr(n,`這個網頁目前只支援 {x}、{x:.2f}、{x:g} 這幾種格式`);
  }
  /* ---------- 內建函式 ---------- */
  const BUILTINS={print:1,input:1,int:1,float:1,str:1,bool:1,len:1,type:1,abs:1,round:1,max:1,min:1,sum:1,range:1,list:1,map:1};
  function iterItems(o,n){
    if(o.t==="list"||o.t==="tuple"||o.t==="map")return o.v.map(i=>heap.get(i));
    if(o.t==="str")return[...o.v].map(c=>Str(c));
    if(o.t==="stdin")throw rterr(n,"sys.stdin 要直接放在 for ... in 後面，一次讀一行");
    if(o.t==="range"){const[a,b,c]=o.v;const r=[];if(c===0)throw rterr(n,"range 的間隔不能是 0");for(let i=a;c>0?i<b:i>b;i+=c){r.push(i);if(r.length>LIMIT)throw LIM}return r.map(i=>I(i))}
    throw rterr(n,`<b>TypeError</b>：${kind(o)}不能一個一個拿出來（不能放在 for ... in 後面）`);
  }
  function call(n){
    if(n.f.k==="attr")return method(n);
    if(n.f.k!=="name")throw rterr(n,"這個網頁只支援直接呼叫函式名稱");
    const f=n.f.id;
    if(names.has(f)&&!BUILTINS[f])throw rterr(n,`<b>TypeError</b>：<code>${esc(f)}</code> 是一個變數（${kind(heap.get(names.get(f)))}），不能加括號呼叫。`);
    if(names.has(f)&&BUILTINS[f])throw rterr(n,`<b>TypeError</b>：<code>${esc(f)}</code> 這個名字被你拿去當變數了，內建的 ${esc(f)}( ) 就用不到了。換一個變數名稱吧。`);
    if(!BUILTINS[f])throw rterr(n.f,`<b>NameError</b>：找不到函式 <code>${esc(f)}</code>。是不是打錯字了？`);
    const kw=Object.fromEntries(n.kw.map(k=>[k.name,k]));
    const A=()=>n.args.map(ev);
    const need=(as,k,lo=k)=>{if(as.length<lo||as.length>k)throw rterr(n,`<b>TypeError</b>：${f}( ) 需要 ${lo===k?k:`${lo} ～ ${k}`} 個參數，這裡給了 ${as.length} 個。`)};
    switch(f){
      case"print":{
        const as=A();let sep=" ",end="\n";
        if(kw.sep){const o=ev(kw.sep.x);if(o.t!=="str")throw rterr(n,"sep= 後面要放字串");sep=o.v}
        if(kw.end){const o=ev(kw.end.x);if(o.t!=="str")throw rterr(n,"end= 後面要放字串");end=o.v}
        for(const k of n.kw)if(k.name!=="sep"&&k.name!=="end")throw rterr(n,`print 沒有 ${esc(k.name)}= 這個參數（可以用 sep= 和 end=）`);
        const s=as.map(str).join(sep)+end;S.out+=s;S.lastPrint=s;S.printInfo={n:as.length,sep:!!kw.sep,end:!!kw.end};return NONE();
      }
      case"input":{
        const as=A();need(as,1,0);
        if(as.length){S.out+=str(as[0]);note(`⚠ <code>input(${esc(txt(n.args[0]))})</code> 會先把提示文字 ${vis(str(as[0]))} <b>印到螢幕上</b>。在 OJ 上，這也算是輸出的一部分！`)}
        if(S.pos>=S.inp.length)throw rterr(n,`<b>EOFError</b>：輸入已經沒有資料了，input() 讀不到東西。<br>檢查一下輸入的行數，跟程式呼叫 input() 的次數有沒有一樣多。`);
        const nl=S.inp.indexOf("\n",S.pos),end=nl<0?S.inp.length:nl,line=S.inp.slice(S.pos,end).replace(/\r$/,"");
        S.lastRead=[S.pos,nl<0?end:end+1];S.pos=nl<0?end:end+1;
        S.inputNote=`<code>input()</code> 從輸入讀<b>一整行</b>：讀到 ${vis(line)}，得到字串 <b>${esc(repr({t:"str",v:line}))}</b>（就算看起來是數字，也是<b>字串</b>）。`;
        return Str(line);
      }
      case"int":{
        const as=A();need(as,1,0);if(!as.length)return I(0);const o=as[0];
        if(o.t==="int")return o;if(o.t==="bool")return I(o.v?1:0);
        if(o.t==="float"){const r=Math.trunc(o.v);note(`ℹ <code>int(${esc(floatStr(o.v))})</code>：直接把小數部分<b>丟掉</b>，得到 ${r}（不是四捨五入）。`);return I(r)}
        if(o.t==="str"){const s=o.v.trim();if(!/^[+-]?\d+$/.test(s))throw rterr(n,`<b>ValueError</b>：<code>int(${esc(repr(o))})</code> 轉不成整數。int( ) 只能轉「看起來像整數」的字串${/^[+-]?\d*\.\d+$/.test(s)?"；有小數點的要用 float( )":""}${/\s/.test(s)?"；如果一行裡有好幾個數字，要先用 .split() 切開":""}。`);
          note(`ℹ <code>int(${esc(repr(o))})</code>：把字串轉成整數 ${BigInt(s)}。`);return I(BigInt(s))}
        throw rterr(n,`<b>TypeError</b>：${kind(o)}不能轉成 int`);
      }
      case"float":{const as=A();need(as,1,0);if(!as.length)return F(0);const o=as[0];if(isNum(o))return F(toF(o));
        if(o.t==="str"){const s=o.v.trim();if(!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s))throw rterr(n,`<b>ValueError</b>：<code>float(${esc(repr(o))})</code> 轉不成小數。`);return F(parseFloat(s))}
        throw rterr(n,`<b>TypeError</b>：${kind(o)}不能轉成 float`)}
      case"str":{const as=A();need(as,1,0);return Str(as.length?str(as[0]):"")}
      case"bool":{const as=A();need(as,1,0);return B(as.length?truthy(as[0]):false)}
      case"len":{const as=A();need(as,1);const o=as[0];if(o.t==="str"||o.t==="list"||o.t==="tuple")return I(o.v.length);throw rterr(n,`<b>TypeError</b>：${kind(o)}沒有長度`)}
      case"type":{const as=A();need(as,1);return mk("type",TN[as[0].t])}
      case"abs":{const as=A();need(as,1);const o=as[0];if(!isNum(o))throw rterr(n,`<b>TypeError</b>：abs( ) 要放數字`);return o.t==="float"?F(Math.abs(o.v)):I(num(o)<0n?-num(o):num(o))}
      case"round":{const as=A();need(as,2,1);const o=as[0];if(!isNum(o))throw rterr(n,`<b>TypeError</b>：round( ) 要放數字`);
        if(as.length===2){const d=Number(num(as[1]));return F(Number(toF(o).toFixed(d)))}
        const x=toF(o),f=Math.floor(x),r=x-f===0.5?(f%2===0?f:f+1):Math.round(x);
        if(x-f===0.5)note(`ℹ <code>round(${esc(floatStr(x))})</code>：剛好在中間（.5）時，Python 會取<b>偶數</b>那一邊，得到 ${r}。`);return I(r)}
      case"max":case"min":{let as=A();if(as.length===1)as=iterItems(as[0],n);if(!as.length)throw rterr(n,`<b>ValueError</b>：${f}( ) 裡面是空的`);
        let best=as[0];for(const o of as.slice(1))if(compare(f==="max"?">":"<",o,best,n))best=o;return best}
      case"sum":{const as=A();need(as,1);let t=I(0);for(const o of iterItems(as[0],n))t=arith("+",t,o,n);return t}
      case"range":{const as=A();need(as,3,1);as.forEach(o=>{if(o.t!=="int")throw rterr(n,`<b>TypeError</b>：range( ) 裡面要放整數`)});const v=as.map(o=>Number(o.v));
        return mk("range",v.length===1?[0,v[0],1]:v.length===2?[v[0],v[1],1]:v)}
      case"list":{const as=A();need(as,1,0);return mk("list",as.length?iterItems(as[0],n).map(o=>o.id):[])}
      case"map":{
        if(n.args.length!==2||n.args[0].k!=="name"||!["int","float","str"].includes(n.args[0].id))throw rterr(n,"這個網頁只支援 map(int, ...)、map(float, ...)、map(str, ...)");
        const g=n.args[0].id,items=iterItems(ev(n.args[1]),n);
        const out=items.map(o=>callConv(g,o,n).id);
        note(`ℹ <code>map(${g}, ...)</code>：把裡面的<b>每一個</b>都做 ${g}( )，得到 ${out.map(i=>esc(repr(heap.get(i)))).join("、")}。`);
        return mk("map",out);
      }
    }
  }
  function callConv(g,o,n){
    if(g==="int"){if(o.t==="str"){const s=o.v.trim();if(!/^[+-]?\d+$/.test(s))throw rterr(n,`<b>ValueError</b>：<code>int(${esc(repr(o))})</code> 轉不成整數。`);return I(BigInt(s))}if(o.t==="float")return I(Math.trunc(o.v));return isNum(o)?I(num(o)):(()=>{throw rterr(n,"轉不成 int")})()}
    if(g==="float"){if(o.t==="str"){const v=parseFloat(o.v);if(Number.isNaN(v))throw rterr(n,`<b>ValueError</b>：<code>float(${esc(repr(o))})</code> 轉不成小數。`);return F(v)}return F(toF(o))}
    return Str(str(o));
  }
  function method(n){
    const o=ev(n.f.obj),m=n.f.name,as=n.args.map(ev),T_=`<code>${esc(txt(n))}</code>`;
    if(o.t==="str"){
      switch(m){
        case"split":{let parts;
          if(!as.length){parts=o.v.trim().split(/\s+/).filter(x=>x!=="");note(`ℹ ${T_}：依照<b>空白</b>切開（連續好幾個空白也只算一次），得到 ${parts.length} 個字串。`)}
          else{if(as[0].t!=="str")throw rterr(n,".split( ) 裡面要放字串");parts=o.v.split(as[0].v);note(`ℹ ${T_}：依照 ${esc(repr(as[0]))} 切開，得到 ${parts.length} 個字串。`)}
          return mk("list",parts.map(x=>Str(x).id))}
        case"strip":return Str(o.v.trim());
        case"upper":return Str(o.v.toUpperCase());
        case"lower":return Str(o.v.toLowerCase());
      }
      throw rterr(n,`這個網頁還不支援字串的 .${esc(m)}()`);
    }
    if(o.t==="list"){
      switch(m){
        case"append":{if(as.length!==1)throw rterr(n,".append( ) 裡面要放一個東西");o.v.push(as[0].id);markList(n.f.obj);S.cells.add(o.id+":"+(o.v.length-1));
          S.info=`<code>${esc(txt(n))}</code>：把 ${esc(repr(as[0]))} 加到 list 的<b>最後面</b>，現在有 ${o.v.length} 個。`;return NONE()}
        case"copy":{if(as.length)throw rterr(n,".copy( ) 括號裡不用放東西");note(`ℹ <code>${esc(txt(n))}</code>：做出一個<b>新的</b> list，裡面的東西一樣，但是是另一個物件。`);return mk("list",o.v.slice())}
        case"pop":{if(!o.v.length)throw rterr(n,"<b>IndexError</b>：list 是空的，不能 pop");const id=o.v.pop();markList(n.f.obj);return heap.get(id)}
      }
      throw rterr(n,`這個網頁還不支援 list 的 .${esc(m)}()`);
    }
    throw rterr(n,`<b>AttributeError</b>：${kind(o)}沒有 .${esc(m)}( ) 可以用`);
  }
  function markList(x){if(x.k==="name")S.changed.add(x.id)}
  /* ---------- 指定：把名字貼到物件上 ---------- */
  function bind(name,o){
    const old=names.has(name)?names.get(name):null;
    names.set(name,o.id);S.changed.add(name);
    return old;
  }
  function deadAfter(olds){
    const live=new Set(reach());const gone=olds.filter(id=>id!=null&&!live.has(id)&&heap.has(id));
    gone.forEach(id=>S.dead.push(repr(heap.get(id))));
    return gone.map(id=>esc(repr(heap.get(id))));
  }
  function assignTo(tg,o,parts){
    if(tg.k==="name"){const old=bind(tg.id,o);parts.push({name:tg.id,o,old});return}
    if(tg.k==="index"){
      const c=ev(tg.obj),k=ev(tg.i);
      if(c.t==="str")throw rterr(tg,"<b>TypeError</b>：字串不能改裡面的字（字串是不能改的物件）。要改就做一個新的字串。");
      if(c.t!=="list")throw rterr(tg,`<b>TypeError</b>：${kind(c)}不能用 [ ] 改內容`);
      let i=Number(k.v);if(i<0)i+=c.v.length;if(i<0||i>=c.v.length)throw rterr(tg,`<b>IndexError</b>：<code>${esc(txt(tg.obj))}</code> 只有 ${c.v.length} 個，沒有第 ${Number(k.v)} 個。`);
      const old=c.v[i];c.v[i]=o.id;markList(tg.obj);S.cells.add(c.id+":"+i);parts.push({label:txt(tg),o,old});return;
    }
    if(tg.k==="tuple"){
      const items=o.t==="list"||o.t==="tuple"||o.t==="map"?o.v.map(i=>heap.get(i)):o.t==="str"?[...o.v].map(c=>Str(c)):null;
      if(!items)throw rterr(tg,`<b>TypeError</b>：${kind(o)}不能拆開分給好幾個名字`);
      if(items.length!==tg.items.length)throw rterr(tg,`<b>ValueError</b>：左邊有 ${tg.items.length} 個名字，右邊卻有 ${items.length} 個值，對不起來。${items.length<tg.items.length?"（是不是輸入的數字太少了？）":""}`);
      tg.items.forEach((t,i)=>assignTo(t,items[i],parts));
    }
  }
  function vis(s){return`<span class="vis">${esc(s).replace(/ /g,"␣").replace(/\n/g,"↵").replace(/\t/g,"⇥")}</span>`}
  function rhsNote(x,o){
    const R=`<code>${esc(txt(x))}</code>`,V=`<b>${esc(repr(o))}</b>`;
    if(x.k==="num"||x.k==="str"||x.k==="const")return`建立一個 ${kind(o)} 物件 ${V}`;
    if(x.k==="name")return null;
    return`先算右邊 ${R} → ${V}（${kind(o)}）`;
  }
  function execAssign(st){
    S.inputNote=null;
    const o=ev(st.x);const parts=[];
    if(st.tg.k==="tuple"&&st.x.k==="tuple")note(`ℹ 右邊會<b>先全部算好</b>（${esc(repr(o))}），再依序貼到左邊的名字上，所以交換不需要暫存變數。`);
    assignTo(st.tg,o,parts);
    const dead=deadAfter(parts.map(p=>p.old));
    let msg="";
    if(S.inputNote)msg+=S.inputNote+"<br>";
    if(parts.length===1&&st.tg.k==="name"){
      const p=parts[0],N=`<b>${esc(p.name)}</b>`;
      if(st.x.k==="name")msg+=`把名字 ${N} 貼到 <code>${esc(st.x.id)}</code> 指著的<b>同一個物件</b> ${esc(repr(o))} 上（沒有複製，兩個名字指著同一個東西）。`;
      else msg+=`${rhsNote(st.x,o)}，再把名字 ${N} 貼上去。`;
      if(p.old!=null&&p.old!==o.id)msg+=` ${N} 原本指著 ${esc(repr(heap.get(p.old)))}，現在改指新的物件。`;
    }else if(st.tg.k==="index"){msg+=`${rhsNote(st.x,o)||`拿 <code>${esc(txt(st.x))}</code> 指著的物件`}，放進 <b>${esc(txt(st.tg))}</b> 那一格。`}
    else msg+=`把右邊的值依序貼到名字上：${parts.map(p=>`<b>${esc(p.name||p.label)}</b> → ${esc(repr(p.o))}`).join("、")}。`;
    if(dead.length)msg+=`<br>${dead.join("、")} 已經沒有名字指著了，Python 會自動把它<b>回收</b>。`;
    snap(st,msg);
  }
  function execAug(st){
    S.inputNote=null;
    const tg=st.tg,cur=tg.k==="name"?lookup(tg):ev(tg),r=ev(st.x),o=arith(st.op,cur,r,st);
    const parts=[];assignTo(tg,o,parts);const dead=deadAfter(parts.map(p=>p.old));
    const L=esc(txt(tg));
    snap(st,`<code>${L} ${st.op}= ${esc(txt(st.x))}</code> 就是 ${L} = ${L} ${st.op} ${esc(txt(st.x))}：${esc(repr(cur))} ${st.op} ${esc(repr(r))} = <b>${esc(repr(o))}</b>，${L} 改指這個新的物件。`+(dead.length?`<br>${dead.join("、")} 沒有名字指著了，會被回收。`:""));
  }
  function condText(c,o){const t=truthy(o);return`<code>${esc(txt(c))}</code> → <b>${t?"成立 (True)":"不成立 (False)"}</b>`}
  function body(stmts){for(const s of stmts)exec(s)}
  function exec(st){
    switch(st.k){
      case"pass":snap(st,"<code>pass</code>：什麼都不做。");return;
      case"import":names.set("sys",mk("module","sys").id);snap(st,"<code>import sys</code>：把 sys 模組拿進來用，之後就可以寫 <code>sys.stdin</code>（讀所有的輸入）。");return;
      case"assign":execAssign(st);return;
      case"aug":execAug(st);return;
      case"expr":{
        S.inputNote=null;S.printInfo=null;S.info=null;const o=ev(st.x);
        if(S.info){snap(st,S.info);return}
        if(S.printInfo){const pi=S.printInfo;let m=`印到螢幕：${vis(S.lastPrint)}`;
          if(!S.printed&&pi.n>1&&!pi.sep)m+=`<br>ℹ print 會自動在每個東西中間加<b>一個空白</b>、最後自動<b>換行</b>。`;
          if(pi.sep||pi.end)m+=`<br>ℹ ${pi.sep?"sep= 換掉中間的空白":""}${pi.sep&&pi.end?"、":""}${pi.end?"end= 換掉最後的換行":""}。`;
          S.printed=true;snap(st,(S.inputNote?S.inputNote+"<br>":"")+m);return}
        if(S.inputNote){snap(st,S.inputNote+"<br>讀到的字串沒有貼到任何名字上，所以馬上就被丟掉了。");return}
        snap(st,`計算 <code>${esc(txt(st.x))}</code> → ${esc(repr(o))}。`+(st.x.k!=="call"?"<br>ℹ 算出來的值沒有印出來、也沒有存起來，所以什麼都不會留下。要看到它，用 print( )。":""));return;
      }
      case"if":{
        for(const b of st.br){const o=ev(b.cond);const t=truthy(o);
          snap(b,`判斷 ${condText(b.cond,o)}，`+(t?"執行底下縮排的程式。":"跳過底下縮排的程式。"));
          if(t){body(b.body);return}}
        if(st.els){snap(st.els,"上面的條件都不成立，執行 <code>else</code> 底下的程式。");body(st.els.body)}
        return;
      }
      case"while":{let round=0;
        for(;;){const o=ev(st.cond),t=truthy(o);snap(st,`檢查 ${condText(st.cond,o)}，`+(t?`進入迴圈（第 ${++round} 輪）。`:"<b>離開迴圈</b>。"));if(!t)break;
          try{body(st.body)}catch(e){if(e===BRK)break;if(e===CNT)continue;throw e}}
        return}
      case"for":{
        const it=ev(st.it);let round=0;
        if(it.t==="stdin"){
          // for line in sys.stdin：每一輪才讀下一行，讀到沒有了（EOF）就結束
          for(;;){
            if(S.pos>=S.inp.length){snap(st,`輸入已經讀完了（<b>EOF</b>），<b>離開 for 迴圈</b>（共 ${round} 輪）。`);return}
            const nl=S.inp.indexOf("\n",S.pos),end=nl<0?S.inp.length:nl+1,line=S.inp.slice(S.pos,end);
            S.lastRead=[S.pos,end];S.pos=end;round++;
            const parts=[];assignTo(st.tg,Str(line),parts);
            snap(st,`第 ${round} 輪：從輸入讀<b>下一行</b> ${vis(line)}，把 <b>${esc(txt(st.tg))}</b> 貼上去${line.endsWith("\n")?"（最後的換行也在裡面，split() 會自動忽略它）":""}。`);
            try{body(st.body)}catch(e){if(e===BRK)break;if(e===CNT)continue;throw e}
          }
          return;
        }
        const items=iterItems(it,st.it);
        if(it.t==="range"&&!st._told){const[a,b,c]=it.v;note(`ℹ <code>${esc(txt(st.it))}</code> 會依序產生 ${items.slice(0,6).map(o=>o.v.toString()).join("、")}${items.length>6?"……":""}（從 ${a} 開始，<b>不包含</b> ${b}${c!==1?`，每次加 ${c}`:""}），共 ${items.length} 個。`)}
        for(const o of items){round++;const parts=[];assignTo(st.tg,o,parts);
          snap(st,`第 ${round} 輪：把 <b>${esc(txt(st.tg))}</b> 貼到 ${esc(repr(o))}。`);
          try{body(st.body)}catch(e){if(e===BRK)break;if(e===CNT)continue;throw e}}
        snap(st,`全部都拿過了，<b>離開 for 迴圈</b>（共 ${round} 輪）。`);return}
      case"break":snap(st,"<code>break</code>：立刻跳出最近的那一層迴圈。");throw BRK;
      case"continue":snap(st,"<code>continue</code>：這一輪剩下的不做了，直接進入下一輪。");throw CNT;
    }
  }
  try{
    for(const s of prog)exec(s);
    snap(null,"程式執行到最後一行，結束了。");trace[trace.length-1].done=true;
    if(prog.length){const last=prog[prog.length-1];trace[trace.length-1].line=lineOf(last.s)}
  }catch(e){
    if(e&&e.rt){S.notes=[];snap(e.node,`<div class="err">💥 ${e.msg}</div>`,{error:true,done:true},true)}
    else if(e===LIM)snap(null,`<div class="err">已經執行超過 ${LIMIT} 步，先停下來了。很可能是<b>無窮迴圈</b>：檢查迴圈的條件有沒有機會變成 False。</div>`,{error:true,done:true},true);
    else if(e===BRK||e===CNT)snap(null,`<div class="err">break / continue 只能用在迴圈裡面。</div>`,{error:true,done:true},true);
    else throw e;
  }
  return trace;
}
window.pyCompileAndRun=function(src,input){
  let prog;
  try{prog=parse(src)}catch(e){if(e.compile){const line=src.slice(0,e.pos).split("\n").length;return{error:{line,msg:e.msg},trace:[]}}throw e}
  return{trace:run(prog,src,input)};
};
})();
