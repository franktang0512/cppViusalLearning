/* ================= 迷你 Python 直譯器：跟 C++ 那個一樣，把每一步錄成快照 =================
   只支援教學會用到的部分：print、input、int/float/str/bool、list、if/elif/else、while、for、
   f-string（{x} 和 {x:.2f}）、map(int, input().split())。
   記憶體模型照 Python 的觀念：變數是「名字」，指向一個「物件」；= 是把名字貼到物件上。
   快照格式和 C++ 一樣（line、span、note、out、pos、lastRead……），另外多一個 py：{names, objs}，給 js/py/view.js 畫圖。 */
(function(){
const LIMIT=3000;
const BRK={brk:1},CNT={cnt:1},LIM={lim:1};
const KW=new Set(["if","elif","else","while","for","in","break","continue","pass","and","or","not","True","False","None","def","return","global","is","class","lambda"]);
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const cerr=(pos,msg)=>({compile:true,pos,msg});
const MODS={itertools:["permutations","combinations"],collections:["deque"],bisect:["bisect_left","bisect_right"],heapq:["heappush","heappop","heapify"]};   // 支援的模組，和裡面可以 import 的名字

/* ---------- 斷詞：Python 用縮排分區塊，所以要產生 INDENT / DEDENT ---------- */
function tokenize(src,base=0,inline=false){
  const toks=[],ind=[0];let depth=0,i=0;const n=src.length;
  const OPS=["**=","//=","<<=",">>=","&=","|=","^=","<<",">>","**","//","==","!=","<=",">=","+=","-=","*=","/=","%=","->"];
  let lineStart=true;
  while(i<n){
    if(lineStart&&depth===0&&!inline){
      let j=i,w=0;while(j<n&&(src[j]===" "||src[j]==="\t")){w+=src[j]==="\t"?4:1;j++}
      if(j>=n||src[j]==="\n"||src[j]==="#"){while(j<n&&src[j]!=="\n")j++;i=j+1;continue}  // 空白行、註解行
      if(w>ind[ind.length-1]){if(!toks.length||toks[toks.length-1].t!=="nl"&&toks[toks.length-1].t!=="dedent")throw cerr(base+j,(ENG()?"This line has extra spaces at the start (indentation). Only the lines under if, while, and for should move to the right.":"這一行前面多了空白（縮排）。只有 if、while、for 下面的程式才要往右縮。"));ind.push(w);toks.push({t:"indent",v:"",s:base+j,e:base+j})}
      while(w<ind[ind.length-1]){ind.pop();toks.push({t:"dedent",v:"",s:base+j,e:base+j})}
      if(w!==ind[ind.length-1])throw cerr(base+j,(ENG()?"The indentation does not line up: where this line moves back to the left does not match any level above. Lines at the same level must start with the same number of spaces.":"縮排沒有對齊：這一行往左退的位置，跟上面任何一層都對不起來。同一層的程式，前面的空白要一樣多。"));
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
    if(!op&&"+-*/%<>=()[]{},:.&|^~".includes(c))op=c;
    if(!op){
      if(c.charCodeAt(0)>127)throw cerr(base+st,(ENG()?`Cannot understand "${c}". Did you type a full-width symbol? Symbols in code (brackets, quotes, commas, colons) must be half-width.`:`看不懂「${c}」。是不是打成全形符號了？程式碼裡的符號（括號、引號、逗號、冒號）都要用半形。`));
      throw cerr(base+st,(ENG()?`Cannot understand the symbol "${c}"`:`看不懂的符號「${c}」`));
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
    if(j>=src.length||(!triple&&src[j]==="\n"))throw cerr(base+i,(ENG()?`The string is missing its closing quote ${q}`:`字串少了結尾的引號 ${q}`));
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
  const expect=(v,msg)=>{if(!is(v)){const t=peek();throw cerr(t.t==="nl"?t.s:t.s,msg||(ENG()?`There should be "${v}" here`:`這裡應該要有「${v}」`))}return next()};
  function endStmt(){const t=peek();if(t.t==="nl"){next();return}if(t.t==="eof"||t.t==="dedent")return;
    throw cerr(t.s,t.t==="op"&&t.v==="="?(ENG()?"You cannot use = here. To check if two things are \"equal\", write ==.":"這裡不能用 =。如果是要比較「相等」，要寫 ==。"):(ENG()?`There is an extra "${t.v}" at the end of this line. Write only one statement on a line. To print several things together, put commas between them.`:`這一行後面多了「${t.v}」。一行只能寫一個指令；如果是要把好幾個東西一起印出來，要用逗號隔開。`))}
  function block(){
    expect(":",(ENG()?"Add a colon : at the end of this line (if, elif, else, while, and for lines all need one)":"這一行的最後要加冒號 :（if、elif、else、while、for 的那一行都要）"));
    if(peek().t!=="nl"){const s=simple();return[s]}  // if x: print(x) 寫在同一行
    next();if(peek().t!=="indent")throw cerr(peek().s,(ENG()?"The lines under the colon must be indented (usually 4 spaces) to show they belong to the line above.":"冒號下面的程式要往右縮排（通常是 4 個空白），表示它屬於上面那一行。"));
    next();const body=[];while(peek().t!=="dedent"&&peek().t!=="eof")body.push(stmt());if(peek().t==="dedent")next();return body;
  }
  function stmt(){
    const t=peek();
    if(t.t==="indent")throw cerr(t.s,(ENG()?"This line has extra spaces at the start (indentation).":"這一行前面多了空白（縮排）。"));
    if(is("if")){next();inCond=true;const c0=expr();inCond=false;const br=[{cond:c0,s:t.s}];br[0].e=T[p-1].e;br[0].body=block();let els=null;
      while(is("elif")){const t2=next();inCond=true;const c=expr();inCond=false;const b={cond:c,s:t2.s,e:T[p-1].e};b.body=block();br.push(b)}
      if(is("else")){const t3=next();els={s:t3.s,e:t3.e,body:block()}}
      return{k:"if",br,els,s:t.s,e:br[0].e}}
    if(is("else")||is("elif"))throw cerr(t.s,(ENG()?`This ${t.v} cannot find its if. Check that ${t.v} lines up with the if above (the same indentation).`:`這個 ${t.v} 找不到對應的 if。檢查 ${t.v} 有沒有跟上面的 if 對齊（縮排一樣多）。`));
    if(is("while")){next();inCond=true;const cond=expr();inCond=false;const e=T[p-1].e;return{k:"while",cond,body:block(),s:t.s,e}}
    if(is("for")){next();let tg=postfix();if(is(",")){const items=[tg];while(is(",")){next();items.push(postfix())}tg={k:"tuple",items,s:tg.s,e:items[items.length-1].e}}tg=target(tg);if(!is("in"))throw cerr(peek().s,(ENG()?"Write for like this: for variable in range:, for example for i in range(5):":"for 的寫法是 for 變數 in 範圍:，例如 for i in range(5):"));next();const it=expr();const e=T[p-1].e;return{k:"for",tg,it,body:block(),s:t.s,e}}
    if(is("class")){next();const nm=next();if(nm.t!=="id")throw cerr(nm.s,(ENG()?"class must be followed by a name, for example class Student:":"class 後面要接名字，例如 class Student:"));
      if(is("(")){next();if(!is(")"))throw cerr(peek().s,(ENG()?"Classes on this website do not support inheritance yet. Leave the brackets empty.":"這個網頁的 class 還不支援繼承，括號裡請留空"));next()}
      const he=T[p-1].e;const body=block();
      for(const x of body)if(x.k!=="def"&&x.k!=="pass")throw cerr(x.s,(ENG()?"Inside a class, you can only write def (methods) or pass for now":"class 裡面目前只能寫 def（方法）或 pass"));
      return{k:"class",name:nm.v,methods:body.filter(x=>x.k==="def"),s:t.s,e:he}}
    if(is("def")){next();const nm=next();if(nm.t!=="id")throw cerr(nm.s,(ENG()?"def must be followed by the function name, for example def add(a, b):":"def 後面要接函式的名字，例如 def add(a, b):"));
      expect("(",(ENG()?"Add brackets ( ) after the function name, for example def add(a, b):":"函式名字後面要加括號 ( )，例如 def add(a, b):"));const params=[];
      while(!is(")")){const q=next();if(q.t!=="id")throw cerr(q.s,(ENG()?"Put the parameter names inside the brackets, with commas between them":"括號裡要放參數的名字，用逗號隔開"));let d=null;
        if(is("=")){next();d=expr()}else if(params.some(x=>x.d))throw cerr(q.s,(ENG()?"Parameters without a default value must come before parameters with a default value":"沒有預設值的參數，要寫在有預設值的參數前面"));
        if(params.some(x=>x.name===q.v))throw cerr(q.s,(ENG()?`The parameter ${q.v} is used twice`:`參數 ${q.v} 重複了`));
        params.push({name:q.v,d,s:q.s});if(is(","))next();else if(!is(")"))throw cerr(peek().s,(ENG()?"Put commas between the parameters":"參數之間要用逗號隔開"))}
      next();const he=T[p-1].e;inDef++;const body=block();inDef--;
      const D={k:"def",name:nm.v,params,body,s:t.s,e:he};scope(D);return D}
    return simple();
  }
  function simple(){
    const t=peek();
    if(is("pass")){next();endStmt();return{k:"pass",s:t.s,e:t.e}}
    if(is("return")){if(!inDef)throw cerr(t.s,(ENG()?"return can only be used inside a function (def)":"return 只能寫在函式（def）裡面"));next();let x=null,e=t.e;
      if(peek().t!=="nl"&&peek().t!=="eof"&&peek().t!=="dedent"){x=exprList();e=x.e}endStmt();return{k:"return",x,s:t.s,e}}
    if(is("global")){if(!inDef)throw cerr(t.s,(ENG()?"global must be inside a function. It says that this name means the one outside (global)":"global 要寫在函式裡面，說明這個名字要用外面（全域）的那一個"));next();const ns=[];let e=t.e;
      for(;;){const q=next();if(q.t!=="id")throw cerr(q.s,(ENG()?"global must be followed by variable names":"global 後面要接變數的名字"));ns.push(q.v);e=q.e;if(!is(","))break;next()}endStmt();return{k:"global",names:ns,s:t.s,e}}
    if(t.t==="id"&&(t.v==="import"||t.v==="from")){next();const m=next();
      if(t.v==="from"){
        if(!MODS[m.v])throw cerr(m.s,(ENG()?`This website does not support the ${m.v} module yet`:`這個網頁目前還不支援 ${m.v} 模組`));
        const k=next();if(k.t!=="id"||k.v!=="import")throw cerr(k.s,(ENG()?"Write it like this: from module import name, for example from collections import deque":"寫法是 from 模組 import 名字，例如 from collections import deque"));
        const ns=[];let e=k.e;for(;;){const q=next();if(q.t!=="id")throw cerr(q.s,(ENG()?"import must be followed by a name":"import 後面要接名字"));
          if(!MODS[m.v].includes(q.v))throw cerr(q.s,(ENG()?`On this website, the ${m.v} module only has: ${MODS[m.v].join(", ")}`:`這個網頁的 ${m.v} 模組目前只有：${MODS[m.v].join("、")}`));ns.push(q.v);e=q.e;if(!is(","))break;next()}
        endStmt();return{k:"from",mod:m.v,names:ns,s:t.s,e}}
      if(!["sys","copy"].includes(m.v)&&!MODS[m.v])throw cerr(m.s,(ENG()?`This website does not support the ${m.v} module yet`:`這個網頁目前還不支援 ${m.v} 模組`));
      endStmt();return{k:"import",name:m.v,s:t.s,e:m.e}}
    if(is("break")||is("continue")){next();endStmt();return{k:t.v,s:t.s,e:t.e}}
    const x=exprList();
    if(is("=")){
      const tg=target(x);next();const r=exprList();
      if(is("="))throw cerr(peek().s,(ENG()?"This website does not support chained assignment (a = b = 0) yet. Please write it on two lines.":"這個網頁還不支援連續指定（a = b = 0），請分成兩行寫。"));
      endStmt();return{k:"assign",tg,x:r,s:x.s,e:r.e};
    }
    const at=peek();
    if(at.t==="op"&&["+=","-=","*=","/=","//=","%=","**=","&=","|=","^=","<<=",">>="].includes(at.v)){
      if(x.k!=="name"&&x.k!=="index"&&x.k!=="attr")throw cerr(x.s,(ENG()?`The left side of ${at.v} must be a variable`:`${at.v} 的左邊要是一個變數`));
      next();const r=expr();endStmt();return{k:"aug",op:at.v.slice(0,-1),tg:x,x:r,s:x.s,e:r.e};
    }
    endStmt();return{k:"expr",x,s:x.s,e:x.e};
  }
  function target(x){
    if(x.k==="name"||x.k==="index"||x.k==="attr")return x;
    if(x.k==="tuple"){x.items.forEach(target);return x}
    if(x.k==="call")throw cerr(x.s,(ENG()?"The left side of = cannot be a function call. Is it the wrong way around? Write variable = function(...)":"等號左邊不能是函式呼叫。是不是寫反了？要寫成 變數 = 函式(...)"));
    throw cerr(x.s,(ENG()?"The left side of = must be a variable name (= sticks the value on the right onto the name on the left; it is not the \"equals\" in math)":"等號左邊必須是變數名稱（= 是把右邊的值貼上左邊的名字，不是數學的等於）"));
  }
  function exprList(){const x=expr();if(!is(","))return x;const items=[x];while(is(",")){next();if(peek().t==="nl"||is("=")||is(")"))break;items.push(expr())}return{k:"tuple",items,s:x.s,e:items[items.length-1].e}}
  const expr=()=>is("lambda")?lambdaE():orE();
  function lambdaE(){const t=next();const params=[];
    while(!is(":")){const q=next();if(q.t!=="id")throw cerr(q.s,(ENG()?"lambda must be followed by parameter names, for example lambda x: x * 2":"lambda 後面要接參數的名字，例如 lambda x: x * 2"));params.push({name:q.v,d:null,s:q.s});
      if(is(","))next();else if(!is(":"))throw cerr(peek().s,(ENG()?"Put a colon : after the parameters of lambda":"lambda 的參數後面要接冒號 :"))}
    next();const x=expr();
    const D={k:"def",name:"lambda",lambda:true,params,body:[{k:"return",x,s:x.s,e:x.e}],s:t.s,e:x.e};scope(D);return{k:"lambda",D,s:t.s,e:x.e}}
  function orE(){let l=andE();while(is("or")){next();const r=andE();l={k:"bool",op:"or",l,r,s:l.s,e:r.e}}return l}
  function andE(){let l=notE();while(is("and")){next();const r=notE();l={k:"bool",op:"and",l,r,s:l.s,e:r.e}}return l}
  function notE(){if(is("not")){const t=next();const x=notE();return{k:"not",x,s:t.s,e:x.e}}return cmpE()}
  function cmpE(){
    const first=borE(),ops=[],items=[first];
    for(;;){const t=peek();
      if(t.t==="op"&&["<",">","==","!=","<=",">="].includes(t.v)){next();ops.push(t.v);items.push(borE());continue}
      if(is("in")){next();ops.push("in");items.push(borE());continue}
      if(is("is")){next();if(is("not")){next();ops.push("is not")}else ops.push("is");items.push(borE());continue}
      if(is("not")&&is("in",1)){next();next();ops.push("not in");items.push(borE());continue}
      if(t.t==="op"&&t.v==="="&&inCond)throw cerr(t.s,(ENG()?"Use == to check if things are \"equal\" in a condition. One equals sign = sticks a value on a name, and cannot be used in the condition of if or while.":"條件裡要用 == 比較「相等」。一個等號 = 是把值貼到名字上，不能放在 if、while 的條件裡。"));
      break}
    return ops.length?{k:"cmp",ops,items,s:first.s,e:items[items.length-1].e}:first;
  }
  let inCond=false,inDef=0;
  function scope(D){
    const loc=new Set(D.params.map(x=>x.name)),glo=new Set();
    const tgt=x=>{if(x.k==="name")loc.add(x.id);else if(x.k==="tuple")x.items.forEach(tgt)};
    const walk=ss=>ss.forEach(st=>{
      if(st.k==="assign")tgt(st.tg);else if(st.k==="aug")tgt(st.tg);else if(st.k==="def"||st.k==="class")loc.add(st.name);else if(st.k==="import")loc.add(st.name);else if(st.k==="from")st.names.forEach(n=>loc.add(n));
      else if(st.k==="global")st.names.forEach(n=>glo.add(n));
      else if(st.k==="for"){tgt(st.tg);walk(st.body)}else if(st.k==="while")walk(st.body);
      else if(st.k==="if"){st.br.forEach(b=>walk(b.body));if(st.els)walk(st.els.body)}});
    walk(D.body);glo.forEach(n=>loc.delete(n));D.locals=loc;D.globals=glo;
  }
  const bin=(sub,ops)=>()=>{let l=sub();while(peek().t==="op"&&ops.includes(peek().v)){const op=next().v;const r=sub();l={k:"bin",op,l,r,s:l.s,e:r.e}}return l};
  const mulE=bin(()=>unary(),["*","/","//","%"]);
  const addE=bin(mulE,["+","-"]);
  const shiftE=bin(addE,["<<",">>"]),bandE=bin(shiftE,["&"]),bxorE=bin(bandE,["^"]),borE=bin(bxorE,["|"]);
  function unary(){const t=peek();if(t.t==="op"&&(t.v==="-"||t.v==="+"||t.v==="~")){next();const x=unary();return{k:"un",op:t.v,x,s:t.s,e:x.e}}return power()}
  function power(){const b=postfix();if(is("**")){next();const e=unary();return{k:"bin",op:"**",l:b,r:e,s:b.s,e:e.e}}return b}
  function postfix(){
    let x=primary();
    for(;;){
      if(is("(")){next();const args=[],kw=[];
        while(!is(")")){
          if(peek().t==="eof"||peek().t==="nl")throw cerr(x.s,(ENG()?"This ( has no matching )":"這個 ( 沒有對應的 )"));
          if(peek().t==="id"&&is("=",1)){const k=next();next();kw.push({name:k.v,x:expr(),s:k.s})}
          else{if(kw.length)throw cerr(peek().s,(ENG()?"Named arguments (for example sep=) must come last":"有名字的參數（例如 sep=）要放在最後面"));args.push(expr())}
          if(is(",")){next();continue}
          if(!is(")")){const t=peek();throw cerr(t.s,t.t==="str"||t.t==="num"||t.t==="id"?(ENG()?"Put commas , between the things inside the brackets":"括號裡的東西之間要用逗號 , 隔開"):(ENG()?`There should be ")" here`:`這裡應該要有「)」`))}
        }
        const c=next();x={k:"call",f:x,args,kw,s:x.s,e:c.e};continue}
      if(is("[")){const ob=next();let lo=null,hi=null,st=null,sl=false;
        if(!is(":")){if(is("]"))throw cerr(ob.s,(ENG()?"Put an index inside [ ], for example a[0]":"[ ] 裡面要放索引，例如 a[0]"));lo=expr()}
        if(is(":")){sl=true;next();if(!is("]")&&!is(":"))hi=expr();if(is(":")){next();if(!is("]"))st=expr()}}  // 切片 a[lo:hi:st]，每一段都可以省略
        const c=expect("]");x=sl?{k:"slice",obj:x,lo,hi,st,s:x.s,e:c.e}:{k:"index",obj:x,i:lo,s:x.s,e:c.e};continue}
      if(is(".")){next();const m=next();if(m.t!=="id")throw cerr(m.s,(ENG()?"A dot must be followed by a name, for example s.split()":"點後面要接名稱，例如 s.split()"));x={k:"attr",obj:x,name:m.v,s:x.s,e:m.e};continue}
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
    if(t.t==="op"&&t.v==="("){if(is(")")){const c=next();return{k:"tuple",items:[],s:t.s,e:c.e}}const x=exprList();const c=expect(")",(ENG()?"This ( has no matching )":"這個 ( 沒有對應的 )"));return{...x,s:t.s,e:c.e,paren:true}}
    if(t.t==="op"&&t.v==="{"){  // {鍵: 值, ...} 是 dict；{a, b} 是 set；{} 是空的 dict
      if(is("}")){const c=next();return{k:"dict",items:[],s:t.s,e:c.e}}
      const first=expr();
      if(is(":")){next();const items=[[first,expr()]];
        while(is(",")){next();if(is("}"))break;const k=expr();expect(":",(ENG()?"Each item of a dict is written as key: value":"dict 的每一項要寫成 鍵: 值"));items.push([k,expr()])}
        const c=expect("}",(ENG()?"This { has no matching }":"這個 { 沒有對應的 }"));return{k:"dict",items,s:t.s,e:c.e}}
      const items=[first];while(is(",")){next();if(is("}"))break;items.push(expr())}
      const c=expect("}",(ENG()?"This { has no matching }":"這個 { 沒有對應的 }"));return{k:"setlit",items,s:t.s,e:c.e};
    }
    if(t.t==="op"&&t.v==="["&&!is("]")){  // list 生成式：[算式 for 名字 in 範圍 if 條件]
      const save=p;const x=expr();
      if(is("for")){next();let tg=postfix();if(is(",")){const its=[tg];while(is(",")){next();its.push(postfix())}tg={k:"tuple",items:its,s:tg.s,e:its[its.length-1].e}}target(tg);
        if(!is("in"))throw cerr(peek().s,(ENG()?"Write it like this: [expression for name in range]":"寫法是 [算式 for 名字 in 範圍]"));next();const it=orE();let cond=null;if(is("if")){next();cond=orE()}
        const c=expect("]",(ENG()?"This [ has no matching ]":"這個 [ 沒有對應的 ]"));return{k:"listcomp",x,tg,it,cond,s:t.s,e:c.e}}
      p=save;
    }
    if(t.t==="op"&&t.v==="["){const items=[];while(!is("]")){items.push(expr());if(is(","))next();else if(!is("]"))throw cerr(peek().s,(ENG()?"Put commas between the items in a list":"list 裡面的東西要用逗號隔開"))}const c=next();return{k:"list",items,s:t.s,e:c.e}}
    if(t.t==="nl"||t.t==="eof")throw cerr(t.s,(ENG()?"This line does not seem to be finished":"這一行好像還沒寫完"));
    if(t.t==="kw")throw cerr(t.s,(ENG()?`"${t.v}" is a Python keyword and cannot be used here`:`「${t.v}」是 Python 的保留字，不能放在這裡`));
    throw cerr(t.s,(ENG()?`"${t.v}" should not be here`:`這裡不該出現「${t.v}」`));
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
        if(j>=raw.length)throw cerr(t.body+i,(ENG()?"A { in the f-string has no matching }":"f 字串的 { 沒有對應的 }"));
        let inner=raw.slice(i+1,j),spec="";const ci=inner.lastIndexOf(":");if(ci>=0&&!/[\[\(]/.test(inner.slice(ci))){spec=inner.slice(ci+1);inner=inner.slice(0,ci)}
        if(!inner.trim())throw cerr(t.body+i,(ENG()?"Put an expression inside { } in an f-string, for example {x}":"f 字串的 { } 裡面要放算式，例如 {x}"));
        const sub=tokenize(inner,t.body+i+1,true),save={T:T.slice(),p};
        T.length=0;T.push(...sub);p=0;const x=expr();if(peek().t!=="eof")throw cerr(peek().s,(ENG()?"Only one expression can go inside { } in an f-string":"f 字串的 { } 裡面只能放一個算式"));
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
  /* 名字放在「框」裡：frames[0] 是全域，每呼叫一次函式就多一個框（呼叫堆疊）。
     names 永遠指著最上面那個框的 Map；key 是「第幾層:名字」，用來標記這一步改到、讀到哪個名字 */
  const MAXDEPTH=200;   // 真的 Python 大約 1000 層才 RecursionError；這個網頁跑在瀏覽器裡，先停在 200 層
  const SHOWN=10;       // 呼叫堆疊很高的時候，快照只畫全域和最上面 10 層（中間的省略），畫面才跑得動
  const frames=[{names:new Map(),label:(ENG()?"global":"全域"),depth:0,key:"main"}];let callSeq=0;let names=frames[0].names;
  const G=()=>frames[0].names,top=()=>frames[frames.length-1];
  function where(name){  // 這個名字現在指的是哪一個框裡的（找不到是 null；區域變數還沒給值是 {unbound}）
    const F=top();
    if(F.depth>0){
      if(F.fn.globals.has(name))return G().has(name)?{m:G(),k:"0:"+name}:null;
      if(F.names.has(name))return{m:F.names,k:F.depth+":"+name};
      if(F.fn.locals.has(name))return{unbound:true};
    }
    return G().has(name)?{m:G(),k:"0:"+name}:null;
  }
  const S={out:"",inp:input||"",pos:0,lastRead:null,notes:[],changed:new Set(),read:new Set(),fresh:new Set(),dead:[],lastPrint:"",printed:false,
    cells:new Set(),cellRead:new Set()};  // list 裡被改、被讀的格子：「list 的 id:第幾格」
  const trace=[];
  /* 物件 */
  const mk=(t,v)=>{const o={id:++oid,t,v};heap.set(o.id,o);S.fresh.add(o.id);return o};
  const view=(vn,ids)=>{const o=mk("view",ids);o.vn=vn;return o};
  const I=v=>mk("int",BigInt(v)),F=v=>mk("float",v),Str=v=>mk("str",v),B=v=>mk("bool",!!v),NONE=()=>mk("none",null);
  const TN={deque:"deque",func:"function",int:"int",float:"float",str:"str",bool:"bool",none:"NoneType",list:"list",tuple:"tuple",map:"map",range:"range",type:"type",builtin:"builtin_function_or_method",module:"module",stdin:"stdin",dict:"dict",set:"set"};
  const tn=o=>o.t==="view"?o.vn:o.t==="inst"?o.v.cls.v.name:o.t==="class"?"class":TN[o.t];
  const REFT=new Set(["inst","list","dict","set","tuple"]);   // 屬性指著這些東西時，畫成箭頭
  // dict 的 v 是 [[鍵的 id, 值的 id], ...]（照放進去的順序）；set 的 v 是 [id, ...]；
  // view 是 d.keys()、d.values()、d.items() 拿到的東西，vn 是它的型別名稱
  const SEQ=new Set(["list","tuple","map","set","view","deque"]);
  // 模組裡的函式（from collections import deque 之後，deque(...) 會走到這裡）
  const EXTRA={
    permutations(n){return itr(n,"permutations")},combinations(n){return itr(n,"combinations")},
    heappush(n){const[h,x]=heapArgs(n,2);h.v.push(x.id);hDown(h,0,h.v.length-1);heapDone(n,h);
      S.info=(ENG()?`<code>${esc(txt(n))}</code>: put ${esc(repr(x))} at the end, then let it <b>float up</b> (swap it with its parent while it is smaller). The smallest one is always in box 0.`:`<code>${esc(txt(n))}</code>：把 ${esc(repr(x))} 放到最後，再一路<b>往上浮</b>（比父親小就交換），最小的永遠在第 0 格。`);return NONE()},
    heappop(n){const[h]=heapArgs(n,1);if(!h.v.length)throw rterr(n,(ENG()?"<b>IndexError</b>: the heap is empty, so you cannot heappop":"<b>IndexError</b>：heap 是空的，不能 heappop"));
      const last=h.v.pop();let r=last;if(h.v.length){r=h.v[0];h.v[0]=last;hUp(h,0)}heapDone(n,h);
      note((ENG()?`ℹ <code>${esc(txt(n))}</code>: take box 0 (the smallest), ${esc(repr(heap.get(r)))}, move the last one to box 0, and then let it <b>sink down</b>.`:`ℹ <code>${esc(txt(n))}</code>：拿走第 0 格（最小的）${esc(repr(heap.get(r)))}，把最後一個搬到第 0 格，再<b>往下沉</b>。`));return heap.get(r)},
    heapify(n){const[h]=heapArgs(n,1);for(let i=(h.v.length>>1)-1;i>=0;i--)hUp(h,i);heapDone(n,h);
      S.info=(ENG()?`<code>${esc(txt(n))}</code>: rearrange the list in place into a <b>min-heap</b>: no position is bigger than its children, and the smallest is in box 0.`:`<code>${esc(txt(n))}</code>：把 list 就地整理成<b>小頂堆</b>：每個位置都不比它的孩子大，最小的在第 0 格。`);return NONE()},
    bisect_left(n){return bis(n,"left")},bisect_right(n){return bis(n,"right")},
    deque(n){const as=n.args.map(ev);if(as.length>1)throw rterr(n,(ENG()?"deque( ) can be empty, or have one list inside":"deque( ) 裡面可以不放，或放一個 list"));
      const d=mk("deque",as.length?iterItems(as[0],n).map(o=>o.id):[]);return d},
  };
  const dfind=(d,k)=>d.v.findIndex(([kid])=>same(heap.get(kid),k));
  const sfind=(s,k)=>s.v.findIndex(id=>same(heap.get(id),k));
  function floatStr(x){
    if(Number.isNaN(x))return"nan";if(!isFinite(x))return x>0?"inf":"-inf";
    if(Number.isInteger(x)&&Math.abs(x)<1e16)return x.toFixed(1);
    let s=String(x);if(/e/.test(s)){s=s.replace(/e([+-])(\d)$/,"e$10$2")}return s;
  }
  function str(o){  // print 印出來的樣子
    switch(o.t){case"int":return o.v.toString();case"float":return floatStr(o.v);case"str":return o.v;case"bool":return o.v?"True":"False";case"none":return"None";
      case"list":return`[${o.v.map(i=>repr(heap.get(i))).join(", ")}]`;case"tuple":return`(${o.v.map(i=>repr(heap.get(i))).join(", ")}${o.v.length===1?",":""})`;
      case"dict":return`{${o.v.map(([k,v])=>repr(heap.get(k))+": "+repr(heap.get(v))).join(", ")}}`;
      case"set":return o.v.length?`{${o.v.map(i=>repr(heap.get(i))).join(", ")}}`:"set()";
      case"view":return o.vn.startsWith("itertools")?`<${o.vn} object>`:`${o.vn}([${o.v.map(i=>repr(heap.get(i))).join(", ")}])`;
      case"deque":return`deque([${o.v.map(i=>repr(heap.get(i))).join(", ")}])`;
      case"type":return`<class '${o.v}'>`;case"func":return`<function ${o.v.D.name}>`;case"inst":return(ENG()?`<${o.v.cls.v.name} object>`:`<${o.v.cls.v.name} 物件>`);case"class":return`<class '${o.v.name}'>`;case"map":return"<map object>";case"module":return`<module '${o.v}'>`;case"stdin":return"<stdin>";case"range":return`range(${o.v.join(", ")})`;case"builtin":return`<built-in function ${o.v}>`}
    return"?";
  }
  function repr(o){if(o.t==="str")return"'"+o.v.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n")+"'";return str(o)}
  /* 快照：只畫得到的物件（有名字指著，或在 list 裡） */
  function reach(all=true){
    const seen=new Set(),order=[];
    const walk=id=>{if(seen.has(id))return;seen.add(id);order.push(id);const o=heap.get(id);if(!o)return;
      if(SEQ.has(o.t))o.v.forEach(walk);else if(o.t==="dict")o.v.forEach(([k,v])=>{walk(k);walk(v)});else if(o.t==="inst")o.v.f.forEach(([,v])=>walk(v))};
    for(const F of shownFrames(all))if(F.names)for(const id of F.names.values())walk(id);
    return order;
  }
  function shownFrames(all){return all||frames.length<=SHOWN+1?frames:[frames[0],{gap:frames.length-1-SHOWN},...frames.slice(-SHOWN)]}
  function snap(node,note,extra={},force){
    if(!force&&trace.length>=LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    const live=reach(false);
    const objs=live.map(id=>{const o=heap.get(id);const v={id,t:o.t,tn:tn(o),repr:repr(o)};
      if(SEQ.has(o.t))v.items=o.v.map(i=>{const x=heap.get(i);return{id:i,t:x.t,repr:repr(x),ref:x.t==="list"||x.t==="tuple"}});
      if(o.t==="inst")v.fields=o.v.f.map(([k,i])=>{const x=heap.get(i);return{k,v:repr(x),ref:REFT.has(x.t)?i:null}});
      if(o.t==="class")v.sig=`class ${o.v.name}`;
      if(v.items)v.items.forEach((it,i)=>{if(heap.get(it.id).t==="inst")it.oref=it.id});
      if(o.t==="func")v.sig=`def ${o.v.D.name}(${o.v.D.params.map(q=>q.name).join(", ")})`;
      if(o.t==="dict")v.kv=o.v.map(([k,x])=>({k:repr(heap.get(k)),v:repr(heap.get(x))}));
      if(o.t==="str"&&o.v.length<=40)v.chars=[...o.v];   // 字串的每一個字（課程有 strCells 才畫成格子）
      return v});
    const fr=shownFrames(false).map(F=>F.gap?{gap:F.gap,names:[]}:{label:F.label,depth:F.depth,key:F.key,fn:F.fn?F.fn.name:"main",names:[...F.names.entries()].filter(([,id])=>heap.get(id).t!=="module"&&heap.get(id).t!=="builtin").map(([name,id])=>({name,ref:id,key:F.depth+":"+name}))});  // import 進來的模組不畫
    const T0=fr[fr.length-1],nm=fr.length>1?[...T0.names,...fr[0].names.filter(x=>!T0.names.some(y=>y.name===x.name))]:fr[0].names;  // 現在看得到的名字
    trace.push({line:node?lineOf(node.s):0,span:node?[node.s,node.e]:[0,0],note:note+warn,out:S.out,pos:S.pos,fail:false,lastRead:S.lastRead,
      changed:[...S.changed].map(n=>"n:"+n+":0"),read:[...S.read].map(n=>"n:"+n+":0"),
      vars:nm.map(x=>({id:"n:"+x.key,name:x.name,type:"py",values:[repr(heap.get(x.ref))],init:[true],isArr:false})),
      py:{retv:S.retv||null,names:nm,frames:fr,objs,changed:[...S.changed],read:[...S.read],fresh:[...S.fresh].filter(id=>live.includes(id)),dead:S.dead.slice(),cells:[...S.cells],cellRead:[...S.cellRead]},frames:[{key:"main",label:"main"}],refs:[],...extra});
    S.retv=null;S.changed.clear();S.read.clear();S.fresh.clear();S.dead=[];S.notes=[];S.lastRead=null;S.cells.clear();S.cellRead.clear();
  }
  const rterr=(node,msg)=>({rt:true,node,msg});
  const note=m=>{if(!S.notes.includes(m))S.notes.push(m)};
  const kind=o=>o.t==="inst"?o.v.cls.v.name+(ENG()?" object":" 物件"):({deque:"deque",class:"class",func:(ENG()?"a function":"函式"),int:(ENG()?"an integer (int)":"整數（int）"),float:(ENG()?"a decimal (float)":"小數（float）"),str:(ENG()?"a string (str)":"字串（str）"),bool:(ENG()?"a boolean (bool)":"布林（bool）"),none:"None",list:(ENG()?"a list":"串列（list）"),tuple:"tuple",map:(ENG()?"a map object":"map 物件"),dict:"dict",set:"set"}[o.t]||tn(o));
  const isNum=o=>o.t==="int"||o.t==="float"||o.t==="bool";
  const num=o=>o.t==="bool"?BigInt(o.v?1:0):o.v;
  const toF=o=>o.t==="float"?o.v:Number(num(o));
  function truthy(o){switch(o.t){case"int":return o.v!==0n;case"float":return o.v!==0;case"str":return o.v!=="";case"bool":return o.v;case"none":return false;case"list":case"tuple":case"dict":case"set":case"view":case"deque":return o.v.length>0}return true}
  // dict 的鍵、set 的元素不能是會被改的東西
  function hashable(k,n){if(k.t==="list"||k.t==="dict"||k.t==="set")throw rterr(n,(ENG()?`<b>TypeError</b>: ${kind(k)} cannot be a dict key, and cannot be put in a set (its contents can change, so Python does not allow it). Use a tuple instead.`:`<b>TypeError</b>：${kind(k)}不能當 dict 的鍵，也不能放進 set（它的內容可以被改，Python 不允許）。可以改用 tuple。`))}
  function lookup(n){
    const w=where(n.id);
    if(w&&w.unbound)throw rterr(n,(ENG()?`<b>UnboundLocalError</b>: <code>${esc(n.id)}</code> is assigned (=, +=) in this function, so Python treats it as a <b>local variable</b>. But it is used before it has a value.<br>To use the ${esc(n.id)} outside (global), write <code>global ${esc(n.id)}</code> at the start of the function.`:`<b>UnboundLocalError</b>：<code>${esc(n.id)}</code> 在這個函式裡有被指定（=、+=），所以 Python 把它當成<b>區域變數</b>；可是它還沒有給值，就先被拿來用了。<br>如果要用外面（全域）的 ${esc(n.id)}，要在函式一開始寫 <code>global ${esc(n.id)}</code>。`));
    if(w){S.read.add(w.k);return heap.get(w.m.get(n.id))}
    if(BUILTINS[n.id])return mk("builtin",n.id);
    throw rterr(n,(ENG()?`<b>NameError</b>: the name <code>${esc(n.id)}</code> is used before it is stuck on anything.<br>In Python, a variable must get a value with = before you can use it. Also check for typos (upper and lower case must be the same too).`:`<b>NameError</b>：名字 <code>${esc(n.id)}</code> 還沒有貼到任何東西上，就被拿來用了。<br>Python 的變數要先用 = 給值，才能使用；也檢查一下是不是打錯字（大小寫也要一樣）。`));
  }
  /* ---------- 算式 ---------- */
  function arith(op,a,b,n){
    const T_=`<code>${esc(txt(n))}</code>`;
    if(op==="+"&&a.t==="str"&&b.t==="str")return Str(a.v+b.v);
    if(op==="+"&&a.t==="list"&&b.t==="list")return mk("list",[...a.v,...b.v]);
    if(op==="*"&&(a.t==="str"&&b.t==="int"||a.t==="int"&&b.t==="str")){const s=a.t==="str"?a:b,k=Number(a.t==="int"?a.v:b.v);return Str(k>0?s.v.repeat(k):"")}
    if(op==="*"&&(a.t==="list"&&b.t==="int"||a.t==="int"&&b.t==="list")){
      const l=a.t==="list"?a:b,k=Number(a.t==="int"?a.v:b.v);if(k*l.v.length>200)throw rterr(n,(ENG()?"This website can only draw lists with up to 200 boxes. Please make it smaller.":"這個網頁最多只能畫 200 格的 list，請開小一點。"));
      const v=[];for(let i=0;i<k;i++)v.push(...l.v);
      if(l.v.some(i=>heap.get(i).t==="list"))note((ENG()?`⚠ <code>${esc(txt(n))}</code>: the list inside is <b>not copied</b>. Only "the arrow pointing to it" is repeated ${k} times, so all ${v.length} boxes point to the <b>same</b> list! Look at the arrows on the right.`:`⚠ <code>${esc(txt(n))}</code>：裡面的 list <b>沒有被複製</b>，只是把「指向它的箭頭」重複 ${k} 次，所以 ${v.length} 格都指著<b>同一個</b> list！看右邊的箭頭。`));
      else note((ENG()?`ℹ <code>${esc(txt(n))}</code>: repeat the list ${k} times to get ${v.length} boxes.`:`ℹ <code>${esc(txt(n))}</code>：把 list 重複 ${k} 次，得到 ${v.length} 格。`));return mk("list",v)}
    if(!isNum(a)||!isNum(b)){
      if((a.t==="str")!==(b.t==="str")&&op==="+")throw rterr(n,(ENG()?`<b>TypeError</b>: ${T_} tries to join ${kind(a)} and ${kind(b)} with +, and Python does not change types for you.<br>To join them as text, turn the number into a string with <code>str( )</code>. To add them, turn the string into a number with <code>int( )</code>.`:`<b>TypeError</b>：${T_} 想把${kind(a)}和${kind(b)}用 + 接起來，Python 不會自動幫你轉換。<br>要接成一段文字：用 <code>str( )</code> 把數字變成字串；要做加法：用 <code>int( )</code> 把字串變成數字。`));
      throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot use ${esc(op)} on ${kind(a)} and ${kind(b)} (${T_}).`:`<b>TypeError</b>：${kind(a)}和${kind(b)}不能用 ${esc(op)} 計算（${T_}）。`));
    }
    if(["&","|","^","<<",">>"].includes(op)){
      if(a.t==="float"||b.t==="float")throw rterr(n,(ENG()?`<b>TypeError</b>: the bitwise operator ${esc(op)} only works on integers`:`<b>TypeError</b>：位元運算 ${esc(op)} 只能用在整數上`));
      if(a.t==="bool"&&b.t==="bool"&&["&","|","^"].includes(op))return B(op==="&"?a.v&&b.v:op==="|"?a.v||b.v:a.v!==b.v);
      const x=num(a),y=num(b);
      if((op==="<<"||op===">>")&&y<0n)throw rterr(n,(ENG()?"<b>ValueError</b>: you cannot shift by a negative number of bits":"<b>ValueError</b>：位移的格數不能是負的"));
      if(op==="<<"&&y>10000n)throw rterr(n,(ENG()?"That shifts too many bits. This website cannot work it out":"位移太多格了，這個網頁算不動"));
      return I(op==="&"?x&y:op==="|"?x|y:op==="^"?x^y:op==="<<"?x<<y:x>>y);
    }
    if(op==="/"){const y=toF(b);if(y===0)throw rterr(n,(ENG()?`<b>ZeroDivisionError</b>: division by 0! The program stops here.`:`<b>ZeroDivisionError</b>：除以 0！程式在這裡停下來了。`));return F(toF(a)/y)}
    if(a.t==="float"||b.t==="float"){
      const x=toF(a),y=toF(b);
      if((op==="//"||op==="%")&&y===0)throw rterr(n,(ENG()?`<b>ZeroDivisionError</b>: division by 0!`:`<b>ZeroDivisionError</b>：除以 0！`));
      if(op==="+")return F(x+y);if(op==="-")return F(x-y);if(op==="*")return F(x*y);if(op==="**")return F(Math.pow(x,y));
      if(op==="//")return F(Math.floor(x/y));if(op==="%")return F(x-Math.floor(x/y)*y);
    }
    const x=num(a),y=num(b);
    if(op==="+")return I(x+y);if(op==="-")return I(x-y);if(op==="*")return I(x*y);
    if(op==="**"){if(y<0n)return F(Math.pow(Number(x),Number(y)));if(y>100000n)throw rterr(n,(ENG()?"The power is too big. This website cannot work it out.":"指數太大了，這個網頁算不動。"));return I(x**y)}
    if(y===0n)throw rterr(n,(ENG()?`<b>ZeroDivisionError</b>: division by 0! The program stops here.`:`<b>ZeroDivisionError</b>：除以 0！程式在這裡停下來了。`));
    let q=x/y;if((x%y!==0n)&&((x<0n)!==(y<0n)))q-=1n;   // // 是「往下」取整數（往負無限大），不是直接丟掉小數
    if(op==="//"){if(x<0n!==y<0n&&x%y!==0n)note((ENG()?`ℹ <code>${esc(txt(n))}</code>: // rounds <b>down</b> to an integer. ${x} ÷ ${y} = ${(Number(x)/Number(y)).toString()}, and rounding down gives ${q} (it does not just drop the decimal part).`:`ℹ <code>${esc(txt(n))}</code>：// 是<b>往下</b>取整數。${x} ÷ ${y} = ${(Number(x)/Number(y)).toString()}，往下取是 ${q}（不是直接把小數丟掉）。`));return I(q)}
    if(op==="%")return I(x-q*y);
  }
  function compare(op,a,b,n){
    if(op==="=="||op==="!="){const eq=same(a,b);return op==="=="?eq:!eq}
    if(op==="is"||op==="is not"){const r=a===b||a.t==="none"&&b.t==="none"||a.t==="bool"&&b.t==="bool"&&a.v===b.v;
      if(["int","float","str"].includes(a.t)||["int","float","str"].includes(b.t))note((ENG()?`ℹ <code>${esc(txt(n))}</code>: <b>do not compare numbers and strings with is</b>. Real Python sometimes lets equal numbers or strings share one object, so the result is not reliable. To check if the values are the same, use ==.`:`ℹ <code>${esc(txt(n))}</code>：數字和字串<b>不要用 is 比</b>。真的 Python 有時候會讓相同的數字、字串共用同一個物件，結果說不準；比「值一樣不一樣」要用 ==。`));
      else if(a.t!=="none"&&b.t!=="none")note((ENG()?`ℹ <code>${esc(txt(n))}</code>: is checks if the two sides are <b>the same object</b> (the arrows point to the same thing), not if the values are the same.`:`ℹ <code>${esc(txt(n))}</code>：is 是看兩邊是不是<b>同一個物件</b>（箭頭指著同一個東西），不是看值一不一樣。`));
      return op==="is"?r:!r}
    if(op==="in"||op==="not in"){let r;if(b.t==="str"){if(a.t!=="str")throw rterr(n,(ENG()?"<b>TypeError</b>: the left side of in must be a string":"<b>TypeError</b>：in 左邊要是字串"));r=b.v.includes(a.v)}else if(b.t==="list"||b.t==="tuple"||b.t==="view"||b.t==="deque")r=b.v.some(i=>same(a,heap.get(i)));
      else if(b.t==="dict"){hashable(a,n);r=dfind(b,a)>=0;note((ENG()?`ℹ <code>${esc(txt(n))}</code>: in on a dict checks if it has the <b>key</b> (not the value).`:`ℹ <code>${esc(txt(n))}</code>：在 dict 裡用 in，是看<b>鍵</b>有沒有在裡面（不是看值）。`))}
      else if(b.t==="set"){hashable(a,n);r=sfind(b,a)>=0}else throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot use in with ${kind(b)}`:`<b>TypeError</b>：${kind(b)}不能用 in`));return op==="in"?r:!r}
    if((a.t==="tuple"||a.t==="list")&&a.t===b.t){
      const n_=Math.min(a.v.length,b.v.length);
      for(let i=0;i<n_;i++){const p=heap.get(a.v[i]),q=heap.get(b.v[i]);if(!same(p,q))return compare(op,p,q,n)}
      return{"<":a.v.length<b.v.length,">":a.v.length>b.v.length,"<=":a.v.length<=b.v.length,">=":a.v.length>=b.v.length}[op];
    }
    let x,y;
    if(isNum(a)&&isNum(b)){if(a.t==="float"||b.t==="float"){x=toF(a);y=toF(b)}else{x=num(a);y=num(b)}}
    else if(a.t==="str"&&b.t==="str"){x=a.v;y=b.v}
    else throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot compare ${kind(a)} and ${kind(b)} (<code>${esc(txt(n))}</code>). Did you forget to turn the input into a number with int( )?`:`<b>TypeError</b>：${kind(a)}和${kind(b)}不能比大小（<code>${esc(txt(n))}</code>）。是不是忘了用 int( ) 把輸入轉成數字？`));
    return{"<":x<y,">":x>y,"<=":x<=y,">=":x>=y}[op];
  }
  function same(a,b){
    if(isNum(a)&&isNum(b)){if(a.t==="float"||b.t==="float")return toF(a)===toF(b);return num(a)===num(b)}
    if(a.t!==b.t)return false;
    if(a.t==="list"||a.t==="tuple"||a.t==="deque")return a.v.length===b.v.length&&a.v.every((x,i)=>same(heap.get(x),heap.get(b.v[i])));
    if(a.t==="set")return a.v.length===b.v.length&&a.v.every(x=>sfind(b,heap.get(x))>=0);   // set 不看順序
    if(a.t==="dict")return a.v.length===b.v.length&&a.v.every(([k,v])=>{const j=dfind(b,heap.get(k));return j>=0&&same(heap.get(v),heap.get(b.v[j][1]))});
    if(a.t==="view")return a===b;
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
      case"dict":{const d=mk("dict",[]);for(const[kx,vx]of n.items){const k=ev(kx);hashable(k,kx);const v=ev(vx);const j=dfind(d,k);if(j>=0)d.v[j][1]=v.id;else d.v.push([k.id,v.id])}return d}
      case"setlit":{const s=mk("set",[]);for(const x of n.items){const o=ev(x);hashable(o,x);if(sfind(s,o)<0)s.v.push(o.id)}return s}
      case"slice":return slice(n);
      case"lambda":return mk("func",{D:n.D,defs:[]});
      case"listcomp":{
        const items=iterItems(ev(n.it),n.it);
        // 生成式裡的名字只在 [ ] 裡面用，跑完要還原（Python 3 不會把它留在外面）
        const tn_=[];const coll=t=>{if(t.k==="name")tn_.push(t.id);else if(t.k==="tuple")t.items.forEach(coll)};coll(n.tg);
        const saved=tn_.map(nm=>[nm,names.has(nm)?names.get(nm):null]);const out=[];
        try{for(const o of items){assignTo(n.tg,o,[]);if(n.cond&&!truthy(ev(n.cond)))continue;out.push(ev(n.x).id)}}
        finally{for(const[nm,id]of saved){if(id==null)names.delete(nm);else names.set(nm,id)}tn_.forEach(nm=>{const k=top().depth+":"+nm;S.changed.delete(k);S.read.delete(k)})}
        const r=mk("list",out),inner=heap.get(out[0]);
        note((ENG()?`ℹ <code>${esc(txt(n))}</code>: <b>${esc(txt(n.tg))}</b> takes ${items.length} values in order. Each time, <code>${esc(txt(n.x))}</code> is <b>worked out again</b> and put into a new list${n.cond?" (only the ones where if is true)":""}. That makes ${out.length} boxes.`:`ℹ <code>${esc(txt(n))}</code>：<b>${esc(txt(n.tg))}</b> 依序拿 ${items.length} 次，每一次都<b>重新算一次</b> <code>${esc(txt(n.x))}</code>，放進新的 list${n.cond?"（只留 if 成立的）":""}，共 ${out.length} 格。`)
          +(inner&&inner.t==="list"&&out.length>1?(ENG()?`Every row is a list <b>made separately</b>, so they do not affect each other.`:`每一列都是<b>另外做出來的</b> list，互不影響。`):""));
        return r}
      case"bin":return arith(n.op,ev(n.l),ev(n.r),n);
      case"un":{const a=ev(n.x);if(!isNum(a))throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot put ${n.op} in front of ${kind(a)}`:`<b>TypeError</b>：${kind(a)}前面不能加 ${n.op}`));if(n.op==="+")return a;
        if(n.op==="~"){if(a.t==="float")throw rterr(n,(ENG()?"<b>TypeError</b>: you cannot use ~ on a decimal":"<b>TypeError</b>：小數不能用 ~"));return I(-num(a)-1n)}return a.t==="float"?F(-a.v):I(-num(a))}
      case"not":return B(!truthy(ev(n.x)));
      case"bool":{const a=ev(n.l);
        if(n.op==="and"&&!truthy(a)){note((ENG()?`ℹ <code>${esc(txt(n.l))}</code> is already False, so the right side of and is <b>not run</b> (short-circuiting).`:`ℹ <code>${esc(txt(n.l))}</code> 已經是 False，and 右邊<b>不會執行</b>（短路）。`));return a}
        if(n.op==="or"&&truthy(a)){note((ENG()?`ℹ <code>${esc(txt(n.l))}</code> is already True, so the right side of or is <b>not run</b> (short-circuiting).`:`ℹ <code>${esc(txt(n.l))}</code> 已經是 True，or 右邊<b>不會執行</b>（短路）。`));return a}
        return ev(n.r)}
      case"cmp":{let a=ev(n.items[0]);for(let i=0;i<n.ops.length;i++){const b=ev(n.items[i+1]);if(!compare(n.ops[i],a,b,n))return B(false);a=b}return B(true)}
      case"index":{
        const o=ev(n.obj),k=ev(n.i);
        if(o.t==="dict"){hashable(k,n.i);const j=dfind(o,k);
          if(j<0)throw rterr(n,(ENG()?`<b>KeyError</b>: <code>${esc(txt(n.obj))}</code> has no key ${esc(repr(k))}.<br>Before you take it, check with <code>${esc(repr(k))} in ${esc(txt(n.obj))}</code>, or use <code>.get(key, default)</code> instead.`:`<b>KeyError</b>：<code>${esc(txt(n.obj))}</code> 裡面沒有鍵 ${esc(repr(k))}。<br>拿之前可以先用 <code>${esc(repr(k))} in ${esc(txt(n.obj))}</code> 檢查，或改用 <code>.get(鍵, 預設值)</code>。`));
          S.cellRead.add(o.id+":"+j);return heap.get(o.v[j][1])}
        if(o.t==="set")throw rterr(n,(ENG()?`<b>TypeError</b>: a set has no order, so you cannot use [ ] to take an item. To check if something is in it, use <code>in</code>.`:`<b>TypeError</b>：set 沒有順序，不能用 [ ] 拿第幾個。要檢查有沒有某個東西，用 <code>in</code>。`));
        if(o.t!=="list"&&o.t!=="str"&&o.t!=="tuple"&&o.t!=="deque")throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot use [ ] to take things out of ${kind(o)}`:`<b>TypeError</b>：${kind(o)}不能用 [ ] 拿裡面的東西`));
        if(k.t!=="int")throw rterr(n,(ENG()?`<b>TypeError</b>: put an integer inside [ ]. <code>${esc(txt(n.i))}</code> is ${kind(k)}`:`<b>TypeError</b>：[ ] 裡面要放整數，<code>${esc(txt(n.i))}</code> 是${kind(k)}`));
        const len=o.t==="str"?o.v.length:o.v.length;let i=Number(k.v);const orig=i;if(i<0)i+=len;
        if(i<0||i>=len)throw rterr(n,(ENG()?`<b>IndexError</b>: <code>${esc(txt(n.obj))}</code> has only ${len} items (index 0 to ${len-1}${len?`, or -1 to -${len}`:""}). There is no item ${orig}.`:`<b>IndexError</b>：<code>${esc(txt(n.obj))}</code> 只有 ${len} 個（索引 0 ～ ${len-1}${len?`，或 -1 ～ -${len}`:""}），沒有第 ${orig} 個。`));
        if(orig<0)note((ENG()?`ℹ The index ${orig} counts back from the end: <code>${esc(txt(n))}</code> is item ${i}.`:`ℹ 索引 ${orig} 是從後面數回來：<code>${esc(txt(n))}</code> 就是第 ${i} 個。`));
        if(o.t==="list"||o.t==="str"||o.t==="deque")S.cellRead.add(o.id+":"+i);
        return o.t==="str"?Str(o.v[i]):heap.get(o.v[i]);
      }
      case"attr":{
        if(n.obj.k==="name"&&n.obj.id==="sys"&&where("sys")&&n.name==="stdin")return mk("stdin",null);
        const o=ev(n.obj);
        if(o.t==="inst"){const j=o.v.f.findIndex(([k])=>k===n.name);if(j>=0){S.cellRead.add(o.id+":"+j);return heap.get(o.v.f[j][1])}
          if(o.v.cls.v.m.has(n.name))throw rterr(n,(ENG()?`.${esc(n.name)} is a method. Add brackets ( ) after it to run it`:`.${esc(n.name)} 是方法，後面要加括號 ( ) 才會執行`));
          throw rterr(n,(ENG()?`<b>AttributeError</b>: this ${esc(tn(o))} object has no attribute <code>${esc(n.name)}</code>. Did you forget to write <code>self.${esc(n.name)} = ...</code> first? Or is it a typo?`:`<b>AttributeError</b>：這個 ${esc(tn(o))} 物件沒有 <code>${esc(n.name)}</code> 這個屬性。是不是忘了先寫 <code>self.${esc(n.name)} = ...</code>？還是打錯字了？`))}
        if(o.t==="none")throw rterr(n,(ENG()?`<b>AttributeError</b>: <code>${esc(txt(n.obj))}</code> is <b>None</b>, so there is no .${esc(n.name)} to take. Did you already reach the end of the linked list (None)?`:`<b>AttributeError</b>：<code>${esc(txt(n.obj))}</code> 是 <b>None</b>，沒有 .${esc(n.name)} 可以拿。是不是已經走到串列的最後面（None）了？`));
        throw rterr(n,(ENG()?`Add brackets ( ) after .${esc(n.name)} to run it, for example .${esc(n.name)}()`:`.${esc(n.name)} 後面要加括號 ( ) 才會執行，例如 .${esc(n.name)}()`));
      }
      case"call":return call(n);
      case"fstr":{let s="";for(const p of n.parts){if(p.lit!=null){s+=p.lit;continue}const o=ev(p.x);s+=fmtSpec(o,p.spec,p.x)}return Str(s)}
    }
    throw rterr(n,(ENG()?"This website does not support this way of writing it yet":"這個網頁還不支援這種寫法"));
  }
  // 切片 a[lo:hi:st]：做出一個新的字串或 list，從 lo 拿到 hi 的前一個
  function slice(n){
    const o=ev(n.obj);
    if(o.t!=="str"&&o.t!=="list"&&o.t!=="tuple")throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot slice ${kind(o)}`:`<b>TypeError</b>：${kind(o)}不能切片`));
    const len=o.v.length;
    const gi=x=>{if(!x)return null;const k=ev(x);if(k.t==="none")return null;if(k.t!=="int")throw rterr(x,(ENG()?`<b>TypeError</b>: put integers inside the [ : ] of a slice. <code>${esc(txt(x))}</code> is ${kind(k)}`:`<b>TypeError</b>：切片的 [ : ] 裡面要放整數，<code>${esc(txt(x))}</code> 是${kind(k)}`));return Number(k.v)};
    let a=gi(n.lo),b=gi(n.hi),c=gi(n.st);if(c===null)c=1;
    if(c===0)throw rterr(n,(ENG()?"<b>ValueError</b>: the step of a slice cannot be 0":"<b>ValueError</b>：切片的間隔不能是 0"));
    const fix=(x,def)=>{if(x===null)return def;if(x<0){x+=len;if(x<0)x=c<0?-1:0}else if(x>=len)x=c<0?len-1:len;return x};
    a=fix(a,c>0?0:len-1);b=fix(b,c>0?len:-1);
    const idx=[];for(let i=a;c>0?i<b:i>b;i+=c)idx.push(i);
    if(o.t!=="tuple")idx.forEach(i=>S.cellRead.add(o.id+":"+i));
    const r=o.t==="str"?Str(idx.map(i=>o.v[i]).join("")):mk(o.t,idx.map(i=>o.v[i]));
    const what=o.t==="str"?(ENG()?"string":"字串"):o.t==="list"?"list":"tuple";
    if(c===1)note((ENG()?`ℹ <code>${esc(txt(n))}</code>: take item ${a} to item ${b-1} (<b>not including</b> item ${b}) and make a new ${what} ${esc(repr(r))}. The old one does not change.`:`ℹ <code>${esc(txt(n))}</code>：從第 ${a} 個拿到第 ${b-1} 個（<b>不包含</b>第 ${b} 個），做出一個新的${what} ${esc(repr(r))}。原本的不會變。`));
    else note((ENG()?`ℹ <code>${esc(txt(n))}</code>: ${c>0?`jump ${c} forward`:`jump ${-c} backward`} each time, take items ${idx.join(", ")||"(none)"}, and make a new ${what} ${esc(repr(r))}.`:`ℹ <code>${esc(txt(n))}</code>：每次${c>0?`往後跳 ${c}`:`往前跳 ${-c}`}格，拿到第 ${idx.join("、")||"（沒有）"} 個，做出新的${what} ${esc(repr(r))}。`));
    return r;
  }
  function fmtSpec(o,spec,n){
    if(!spec)return str(o);
    const m=spec.match(/^\.(\d+)f$/);
    if(m){if(!isNum(o))throw rterr(n,(ENG()?`<b>ValueError</b>: { :${esc(spec)}} only works on numbers`:`<b>ValueError</b>：{ :${esc(spec)}} 只能用在數字上`));const d=+m[1];note((ENG()?`ℹ <code>{${esc(txt(n))}:${esc(spec)}}</code>: print ${d} decimal places (rounded, with 0s added if needed).`:`ℹ <code>{${esc(txt(n))}:${esc(spec)}}</code>：印到小數點後 ${d} 位（四捨五入，不夠補 0）。`));return toF(o).toFixed(d)}
    if(spec==="d"&&o.t==="int")return o.v.toString();
    if(spec==="g"){
      // :g 跟 C++ 的 cout 一樣：最多 6 位有效數字，後面多餘的 0 和小數點都拿掉
      if(!isNum(o))throw rterr(n,(ENG()?`<b>ValueError</b>: { :g} only works on numbers`:`<b>ValueError</b>：{ :g} 只能用在數字上`));
      const x=toF(o);let r;
      if(x===0)r="0";else if(!isFinite(x))r=x>0?"inf":"-inf";
      else{const e=Math.floor(Math.log10(Math.abs(x)));
        if(e<-4||e>=6){let[m,ex]=x.toExponential(5).split("e");m=String(+m);const k=parseInt(ex,10);r=m+"e"+(k<0?"-":"+")+String(Math.abs(k)).padStart(2,"0")}
        else r=String(+x.toPrecision(6))}
      note((ENG()?`ℹ <code>{${esc(txt(n))}:g}</code>: print at most 6 significant digits, and leave out extra 0s at the end, so ${esc(str(o))} is printed as ${esc(r)}.`:`ℹ <code>{${esc(txt(n))}:g}</code>：最多印 6 位有效數字，後面多的 0 不印，所以 ${esc(str(o))} 印成 ${esc(r)}。`));return r;
    }
    throw rterr(n,(ENG()?`This website only supports the formats {x}, {x:.2f}, and {x:g} for now`:`這個網頁目前只支援 {x}、{x:.2f}、{x:g} 這幾種格式`));
  }
  /* ---------- 內建函式 ---------- */
  const BUILTINS={print:1,input:1,int:1,float:1,str:1,bool:1,len:1,type:1,abs:1,round:1,max:1,min:1,sum:1,range:1,list:1,map:1,ord:1,chr:1,sorted:1,set:1,dict:1};
  // heapq：跟 CPython 一模一樣的做法（所以 list 裡的順序跟真的 Python 一樣）
  // itertools：把每一種排法、選法都做成 tuple（照真的 Python 的順序）
  function itr(n,kindName){
    const as=n.args.map(ev);if(as.length<1||as.length>2||as.length===2&&as[1].t!=="int")throw rterr(n,(ENG()?`${kindName}( ) needs: a group of things, and how many to choose`:`${kindName}( ) 裡面要放：一串東西，和要選幾個`));
    const items=iterItems(as[0],n),k=as.length===2?Number(as[1].v):items.length;if(kindName==="combinations"&&as.length<2)throw rterr(n,(ENG()?"combinations( ) must say how many to choose, for example combinations(a, 2)":"combinations( ) 一定要寫要選幾個，例如 combinations(a, 2)"));
    const out=[];
    const perm=(cur,used)=>{if(out.length>LIMIT)throw LIM;if(cur.length===k){out.push(cur.slice());return}for(let i=0;i<items.length;i++)if(!used[i]){used[i]=1;cur.push(i);perm(cur,used);cur.pop();used[i]=0}};
    const comb=(st,cur)=>{if(out.length>LIMIT)throw LIM;if(cur.length===k){out.push(cur.slice());return}for(let i=st;i<items.length;i++){cur.push(i);comb(i+1,cur);cur.pop()}};
    if(k<=items.length)(kindName==="permutations"?perm([],[]):comb(0,[]));
    note((ENG()?`ℹ <code>${esc(txt(n))}</code>: list ${kindName==="permutations"?"every order":"every choice (order does not matter)"}. There are ${out.length} in total, and each one is a tuple.`:`ℹ <code>${esc(txt(n))}</code>：${kindName==="permutations"?"每一種排法":"每一種選法（不管順序）"}都列出來，一共 ${out.length} 種，每一種是一個 tuple。`));
    return view("itertools."+kindName,out.map(ix=>mk("tuple",ix.map(i=>items[i].id)).id));
  }
  let hN=null;  // 正在執行的 heapq 呼叫（比大小出錯時，錯誤訊息要標在這裡）
  function heapArgs(n,k){hN=n;const as=n.args.map(ev);if(as.length!==k||as[0].t!=="list")throw rterr(n,k===2?(ENG()?"heappush( ) needs: a list, and the value to put in":"heappush( ) 裡面要放：一個 list、要放進去的值"):(ENG()?`${n.f.name||n.f.id}( ) needs a list inside`:`${n.f.name||n.f.id}( ) 裡面要放一個 list`));return as}
  const hLess=(a,b)=>compare("<",heap.get(a),heap.get(b),hN);
  function hDown(h,start,pos){const v=h.v,item=v[pos];while(pos>start){const pp=(pos-1)>>1;if(hLess(item,v[pp])){v[pos]=v[pp];pos=pp;continue}break}v[pos]=item}
  function hUp(h,pos){const v=h.v,end=v.length,start=pos,item=v[pos];let c=2*pos+1;
    while(c<end){const r=c+1;if(r<end&&!hLess(v[c],v[r]))c=r;v[pos]=v[c];pos=c;c=2*pos+1}v[pos]=item;hDown(h,start,pos)}
  function heapDone(n,h){const a=n.args[0];if(a&&a.k==="name"){const w=where(a.id);if(w&&w.k)S.changed.add(w.k)}h.v.forEach((x,i)=>S.cells.add(h.id+":"+i))}
  // bisect：在排好的 list 裡二分搜尋，找 x 應該插進去的位置
  function bis(n,side){
    const as=n.args.map(ev);if(as.length!==2||as[0].t!=="list")throw rterr(n,(ENG()?`bisect_${side}( ) needs: a sorted list, and the value to look for`:`bisect_${side}( ) 裡面要放：排好的 list、要找的值`));
    const a=as[0].v.map(i=>heap.get(i)),x=as[1];let l=0,r=a.length;
    while(l<r){const m=(l+r)>>1;if(side==="left"?compare("<",a[m],x,n):!compare("<",x,a[m],n))l=m+1;else r=m}
    note((ENG()?`ℹ <code>${esc(txt(n))}</code>: binary search finds that the first position ${side==="left"?"≥":"&gt;"} ${esc(repr(x))} is <b>${l}</b>${l===a.length?" (everything is smaller, so it is the length of the list)":""}.`:`ℹ <code>${esc(txt(n))}</code>：二分搜尋，找到第一個 ${side==="left"?"≥":"&gt;"} ${esc(repr(x))} 的位置是 <b>${l}</b>${l===a.length?"（全部都比它小，就是 list 的長度）":""}。`));
    return I(l);
  }
  function sortObjs(items,kwNodes,n){
    let rev=false,kf=null;
    for(const k of kwNodes){if(k.name==="reverse")rev=truthy(ev(k.x));else if(k.name==="key")kf=ev(k.x);else throw rterr(n,(ENG()?`Sorting only supports key= and reverse=. There is no ${esc(k.name)}=`:`排序只支援 key= 和 reverse=，沒有 ${esc(k.name)}=`))}
    let keys=items;
    if(kf){
      if(kf.t==="func")keys=items.map(o=>callUser(kf,n,{vals:[o],callText:`${kf.v.D.lambda?"lambda":kf.v.D.name}(${repr(o)})`}));
      else if(kf.t==="builtin"&&["len","abs","str"].includes(kf.v))keys=items.map(o=>kf.v==="len"?I(iterItems(o,n).length):kf.v==="abs"?(o.t==="float"?F(Math.abs(o.v)):I(num(o)<0n?-num(o):num(o))):Str(str(o)));
      else throw rterr(n,(ENG()?"key= must be followed by a function (your own function, a lambda, or len, abs, str)":"key= 後面要放一個函式（自己寫的函式、lambda，或 len、abs、str）"));
    }
    const idx=items.map((o,i)=>i).sort((i,j)=>{const a=keys[i],b=keys[j];const c=compare("<",a,b,n)?-1:compare("<",b,a,n)?1:0;return rev?-c:c});
    return{sorted:idx.map(i=>items[i]),rev,kf};
  }
  function iterItems(o,n){
    if(SEQ.has(o.t))return o.v.map(i=>heap.get(i));
    if(o.t==="dict")return o.v.map(([k])=>heap.get(k));   // for k in d：拿到的是鍵
    if(o.t==="str")return[...o.v].map(c=>Str(c));
    if(o.t==="stdin")throw rterr(n,(ENG()?"Put sys.stdin right after for ... in. It reads one line at a time":"sys.stdin 要直接放在 for ... in 後面，一次讀一行"));
    if(o.t==="range"){const[a,b,c]=o.v;const r=[];if(c===0)throw rterr(n,(ENG()?"The step of range cannot be 0":"range 的間隔不能是 0"));for(let i=a;c>0?i<b:i>b;i+=c){r.push(i);if(r.length>LIMIT)throw LIM}return r.map(i=>I(i))}
    throw rterr(n,(ENG()?`<b>TypeError</b>: you cannot take things out of ${kind(o)} one by one (it cannot go after for ... in)`:`<b>TypeError</b>：${kind(o)}不能一個一個拿出來（不能放在 for ... in 後面）`));
  }
  function call(n){
    if(n.f.k==="attr")return method(n);
    if(n.f.k!=="name")throw rterr(n,(ENG()?"This website only supports calling a function by its name":"這個網頁只支援直接呼叫函式名稱"));
    const f=n.f.id;
    const w=where(f),fo=w&&w.m?heap.get(w.m.get(f)):null;
    if(fo&&fo.t==="func"){S.read.add(w.k);return callUser(fo,n)}
    if(fo&&fo.t==="class"){S.read.add(w.k);return construct(fo,n)}
    if(fo&&fo.t==="builtin"&&EXTRA[fo.v]){S.read.add(w.k);return EXTRA[fo.v](n)}
    if(fo&&!BUILTINS[f])throw rterr(n,(ENG()?`<b>TypeError</b>: <code>${esc(f)}</code> is a variable (${kind(fo)}). You cannot call it with brackets.`:`<b>TypeError</b>：<code>${esc(f)}</code> 是一個變數（${kind(fo)}），不能加括號呼叫。`));
    if(fo&&BUILTINS[f])throw rterr(n,(ENG()?`<b>TypeError</b>: you used the name <code>${esc(f)}</code> for a variable, so the built-in ${esc(f)}( ) cannot be used anymore. Choose a different variable name.`:`<b>TypeError</b>：<code>${esc(f)}</code> 這個名字被你拿去當變數了，內建的 ${esc(f)}( ) 就用不到了。換一個變數名稱吧。`));
    if(!BUILTINS[f])throw rterr(n.f,(ENG()?`<b>NameError</b>: cannot find the function <code>${esc(f)}</code>. Is it a typo?<br>You must <b>def your function first</b> before you call it: the def must come <b>before</b> the line that calls it.`:`<b>NameError</b>：找不到函式 <code>${esc(f)}</code>。是不是打錯字了？<br>自己寫的函式要<b>先 def</b>，才能呼叫：def 要寫在呼叫它的那一行<b>前面</b>。`));
    const kw=Object.fromEntries(n.kw.map(k=>[k.name,k]));
    const A=()=>n.args.map(ev);
    const need=(as,k,lo=k)=>{if(as.length<lo||as.length>k)throw rterr(n,(ENG()?`<b>TypeError</b>: ${f}( ) needs ${lo===k?k:`${lo} to ${k}`} arguments, but ${as.length} are given here.`:`<b>TypeError</b>：${f}( ) 需要 ${lo===k?k:`${lo} ～ ${k}`} 個參數，這裡給了 ${as.length} 個。`))};
    switch(f){
      case"print":{
        const as=A();let sep=" ",end="\n";
        if(kw.sep){const o=ev(kw.sep.x);if(o.t!=="str")throw rterr(n,(ENG()?"sep= must be followed by a string":"sep= 後面要放字串"));sep=o.v}
        if(kw.end){const o=ev(kw.end.x);if(o.t!=="str")throw rterr(n,(ENG()?"end= must be followed by a string":"end= 後面要放字串"));end=o.v}
        for(const k of n.kw)if(k.name!=="sep"&&k.name!=="end")throw rterr(n,(ENG()?`print has no parameter ${esc(k.name)}= (you can use sep= and end=)`:`print 沒有 ${esc(k.name)}= 這個參數（可以用 sep= 和 end=）`));
        if(as.some(o=>o.t==="inst"))note((ENG()?"ℹ Printing an object directly only shows what kind of object it is (real Python also prints an address). To see what is inside, print its attributes, for example s.name.":"ℹ 直接 print 一個物件，只會印出它是哪一種物件（真的 Python 還會印出一串位址）。要看內容，要印它的屬性，例如 s.name。"));
        if(as.some(o=>o.t==="set"&&o.v.length>1))note((ENG()?"ℹ A set <b>has no fixed order</b>: the order real Python prints may be different from here. To print in order, use <code>sorted( )</code>.":"ℹ set <b>沒有固定的順序</b>：真的 Python 印出來的順序，可能跟這裡不一樣。要照順序印，用 <code>sorted( )</code>。"));
        const s=as.map(str).join(sep)+end;S.out+=s;S.lastPrint=s;S.printInfo={n:as.length,sep:!!kw.sep,end:!!kw.end};return NONE();
      }
      case"input":{
        const as=A();need(as,1,0);
        if(as.length){S.out+=str(as[0]);note((ENG()?`⚠ <code>input(${esc(txt(n.args[0]))})</code> first <b>prints the message</b> ${vis(str(as[0]))} on the screen. On an OJ, this also counts as part of your output!`:`⚠ <code>input(${esc(txt(n.args[0]))})</code> 會先把提示文字 ${vis(str(as[0]))} <b>印到螢幕上</b>。在 OJ 上，這也算是輸出的一部分！`))}
        if(S.pos>=S.inp.length)throw rterr(n,(ENG()?`<b>EOFError</b>: there is no more input, so input() cannot read anything.<br>Check that the number of input lines is the same as the number of times the program calls input().`:`<b>EOFError</b>：輸入已經沒有資料了，input() 讀不到東西。<br>檢查一下輸入的行數，跟程式呼叫 input() 的次數有沒有一樣多。`));
        const nl=S.inp.indexOf("\n",S.pos),end=nl<0?S.inp.length:nl,line=S.inp.slice(S.pos,end).replace(/\r$/,"");
        S.lastRead=[S.pos,nl<0?end:end+1];S.pos=nl<0?end:end+1;
        S.inputNote=(ENG()?`<code>input()</code> reads <b>a whole line</b> of input: it reads ${vis(line)} and gives the string <b>${esc(repr({t:"str",v:line}))}</b> (even if it looks like a number, it is a <b>string</b>).`:`<code>input()</code> 從輸入讀<b>一整行</b>：讀到 ${vis(line)}，得到字串 <b>${esc(repr({t:"str",v:line}))}</b>（就算看起來是數字，也是<b>字串</b>）。`);
        return Str(line);
      }
      case"int":{
        const as=A();need(as,1,0);if(!as.length)return I(0);const o=as[0];
        if(o.t==="int")return o;if(o.t==="bool")return I(o.v?1:0);
        if(o.t==="float"){const r=Math.trunc(o.v);note((ENG()?`ℹ <code>int(${esc(floatStr(o.v))})</code>: just <b>drops</b> the decimal part and gives ${r} (it does not round).`:`ℹ <code>int(${esc(floatStr(o.v))})</code>：直接把小數部分<b>丟掉</b>，得到 ${r}（不是四捨五入）。`));return I(r)}
        if(o.t==="str"){const s=o.v.trim();if(!/^[+-]?\d+$/.test(s))throw rterr(n,(ENG()?`<b>ValueError</b>: <code>int(${esc(repr(o))})</code> cannot be turned into an integer. int( ) only works on strings that "look like an integer"${/^[+-]?\d*\.\d+$/.test(s)?"; for a number with a decimal point, use float( )":""}${/\s/.test(s)?"; if a line has several numbers, cut it with .split() first":""}.`:`<b>ValueError</b>：<code>int(${esc(repr(o))})</code> 轉不成整數。int( ) 只能轉「看起來像整數」的字串${/^[+-]?\d*\.\d+$/.test(s)?"；有小數點的要用 float( )":""}${/\s/.test(s)?"；如果一行裡有好幾個數字，要先用 .split() 切開":""}。`));
          note((ENG()?`ℹ <code>int(${esc(repr(o))})</code>: turn the string into the integer ${BigInt(s)}.`:`ℹ <code>int(${esc(repr(o))})</code>：把字串轉成整數 ${BigInt(s)}。`));return I(BigInt(s))}
        throw rterr(n,(ENG()?`<b>TypeError</b>: ${kind(o)} cannot be turned into an int`:`<b>TypeError</b>：${kind(o)}不能轉成 int`));
      }
      case"float":{const as=A();need(as,1,0);if(!as.length)return F(0);const o=as[0];if(isNum(o))return F(toF(o));
        if(o.t==="str"){const s=o.v.trim();if(!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s))throw rterr(n,(ENG()?`<b>ValueError</b>: <code>float(${esc(repr(o))})</code> cannot be turned into a decimal.`:`<b>ValueError</b>：<code>float(${esc(repr(o))})</code> 轉不成小數。`));return F(parseFloat(s))}
        throw rterr(n,(ENG()?`<b>TypeError</b>: ${kind(o)} cannot be turned into a float`:`<b>TypeError</b>：${kind(o)}不能轉成 float`))}
      case"ord":{const as=A();need(as,1);const o=as[0];
        if(o.t!=="str"||[...o.v].length!==1)throw rterr(n,(ENG()?`<b>TypeError</b>: ord( ) needs <b>one character</b> (a string of length 1). Here it is ${esc(repr(o))}.`:`<b>TypeError</b>：ord( ) 裡面要放<b>一個字</b>（長度 1 的字串），這裡是 ${esc(repr(o))}。`));
        const c=o.v.codePointAt(0);note((ENG()?`ℹ <code>${esc(txt(n))}</code>: the number of ${esc(repr(o))} is ${c}.`:`ℹ <code>${esc(txt(n))}</code>：${esc(repr(o))} 的編號是 ${c}。`));return I(c)}
      case"chr":{const as=A();need(as,1);const o=as[0];
        if(o.t!=="int")throw rterr(n,(ENG()?`<b>TypeError</b>: chr( ) needs an integer (a character number)`:`<b>TypeError</b>：chr( ) 裡面要放整數（編號）`));const c=Number(o.v);
        if(c<0||c>0x10ffff)throw rterr(n,(ENG()?`<b>ValueError</b>: the number given to chr( ) is out of range`:`<b>ValueError</b>：chr( ) 的編號超出範圍`));note((ENG()?`ℹ <code>${esc(txt(n))}</code>: the number ${c} is ${esc(repr({t:"str",v:String.fromCodePoint(c)}))}.`:`ℹ <code>${esc(txt(n))}</code>：編號 ${c} 是 ${esc(repr({t:"str",v:String.fromCodePoint(c)}))}。`));return Str(String.fromCodePoint(c))}
      case"str":{const as=A();need(as,1,0);return Str(as.length?str(as[0]):"")}
      case"bool":{const as=A();need(as,1,0);return B(as.length?truthy(as[0]):false)}
      case"sorted":{const as=A();need(as,1);
        const r=sortObjs(iterItems(as[0],n),n.kw,n);
        note((ENG()?`ℹ <code>${esc(txt(n))}</code>: make a <b>new</b> list, sorted ${r.kf?"by the value from key, ":""}${r.rev?"from big to small":"from small to big"}${as[0].t==="dict"?" (a dict gives its <b>keys</b>)":""}. The old one does not change.`:`ℹ <code>${esc(txt(n))}</code>：做出一個<b>新的</b> list，${r.kf?"照 key 算出來的值":""}${r.rev?"由大到小":"由小到大"}排好${as[0].t==="dict"?"（dict 拿出來的是<b>鍵</b>）":""}。原本的不會變。`));
        return mk("list",r.sorted.map(o=>o.id))}
      case"set":{const as=A();need(as,1,0);const s=mk("set",[]);
        if(as.length){const items=iterItems(as[0],n);for(const o of items){hashable(o,n);if(sfind(s,o)<0)s.v.push(o.id)}
          if(items.length!==s.v.length)note((ENG()?`ℹ <code>${esc(txt(n))}</code>: put ${items.length} things into a set. Repeated ones are kept only once, so ${s.v.length} are left.`:`ℹ <code>${esc(txt(n))}</code>：${items.length} 個東西放進 set，重複的只留一個，剩下 ${s.v.length} 個。`))}
        return s}
      case"dict":{const as=A();need(as,0);return mk("dict",[])}
      case"len":{const as=A();need(as,1);const o=as[0];if(o.t==="str"||o.t==="list"||o.t==="tuple"||o.t==="dict"||o.t==="set"||o.t==="view"||o.t==="deque")return I(o.v.length);throw rterr(n,(ENG()?`<b>TypeError</b>: ${kind(o)} has no length`:`<b>TypeError</b>：${kind(o)}沒有長度`))}
      case"type":{const as=A();need(as,1);return mk("type",TN[as[0].t])}
      case"abs":{const as=A();need(as,1);const o=as[0];if(!isNum(o))throw rterr(n,(ENG()?`<b>TypeError</b>: abs( ) needs a number`:`<b>TypeError</b>：abs( ) 要放數字`));return o.t==="float"?F(Math.abs(o.v)):I(num(o)<0n?-num(o):num(o))}
      case"round":{const as=A();need(as,2,1);const o=as[0];if(!isNum(o))throw rterr(n,(ENG()?`<b>TypeError</b>: round( ) needs a number`:`<b>TypeError</b>：round( ) 要放數字`));
        if(as.length===2){const d=Number(num(as[1]));return F(Number(toF(o).toFixed(d)))}
        const x=toF(o),f=Math.floor(x),r=x-f===0.5?(f%2===0?f:f+1):Math.round(x);
        if(x-f===0.5)note((ENG()?`ℹ <code>round(${esc(floatStr(x))})</code>: when it is exactly in the middle (.5), Python picks the <b>even</b> side, which gives ${r}.`:`ℹ <code>round(${esc(floatStr(x))})</code>：剛好在中間（.5）時，Python 會取<b>偶數</b>那一邊，得到 ${r}。`));return I(r)}
      case"max":case"min":{let as=A();if(as.length===1)as=iterItems(as[0],n);if(!as.length)throw rterr(n,(ENG()?`<b>ValueError</b>: there is nothing inside ${f}( )`:`<b>ValueError</b>：${f}( ) 裡面是空的`));
        let best=as[0];for(const o of as.slice(1))if(compare(f==="max"?">":"<",o,best,n))best=o;return best}
      case"sum":{const as=A();need(as,1);let t=I(0);for(const o of iterItems(as[0],n))t=arith("+",t,o,n);return t}
      case"range":{const as=A();need(as,3,1);as.forEach(o=>{if(o.t!=="int")throw rterr(n,(ENG()?`<b>TypeError</b>: range( ) needs integers`:`<b>TypeError</b>：range( ) 裡面要放整數`))});const v=as.map(o=>Number(o.v));
        return mk("range",v.length===1?[0,v[0],1]:v.length===2?[v[0],v[1],1]:v)}
      case"list":{const as=A();need(as,1,0);return mk("list",as.length?iterItems(as[0],n).map(o=>o.id):[])}
      case"map":{
        if(n.args.length!==2||n.args[0].k!=="name"||!["int","float","str"].includes(n.args[0].id))throw rterr(n,(ENG()?"This website only supports map(int, ...), map(float, ...), and map(str, ...)":"這個網頁只支援 map(int, ...)、map(float, ...)、map(str, ...)"));
        const g=n.args[0].id,items=iterItems(ev(n.args[1]),n);
        const out=items.map(o=>callConv(g,o,n).id);
        note((ENG()?`ℹ <code>map(${g}, ...)</code>: do ${g}( ) on <b>each one</b> inside, which gives ${out.map(i=>esc(repr(heap.get(i)))).join(", ")}.`:`ℹ <code>map(${g}, ...)</code>：把裡面的<b>每一個</b>都做 ${g}( )，得到 ${out.map(i=>esc(repr(heap.get(i)))).join("、")}。`));
        return mk("map",out);
      }
    }
  }
  function callConv(g,o,n){
    if(g==="int"){if(o.t==="str"){const s=o.v.trim();if(!/^[+-]?\d+$/.test(s))throw rterr(n,(ENG()?`<b>ValueError</b>: <code>int(${esc(repr(o))})</code> cannot be turned into an integer.`:`<b>ValueError</b>：<code>int(${esc(repr(o))})</code> 轉不成整數。`));return I(BigInt(s))}if(o.t==="float")return I(Math.trunc(o.v));return isNum(o)?I(num(o)):(()=>{throw rterr(n,(ENG()?"cannot be turned into an int":"轉不成 int"))})()}
    if(g==="float"){if(o.t==="str"){const v=parseFloat(o.v);if(Number.isNaN(v))throw rterr(n,(ENG()?`<b>ValueError</b>: <code>float(${esc(repr(o))})</code> cannot be turned into a decimal.`:`<b>ValueError</b>：<code>float(${esc(repr(o))})</code> 轉不成小數。`));return F(v)}return F(toF(o))}
    return Str(str(o));
  }
  function method(n){
    const o=ev(n.f.obj),m=n.f.name;
    if(o.t==="inst"){const f=o.v.cls.v.m.get(m);if(!f)throw rterr(n,(ENG()?`<b>AttributeError</b>: ${esc(tn(o))} has no method .${esc(m)}( ).`:`<b>AttributeError</b>：${esc(tn(o))} 沒有 .${esc(m)}( ) 這個方法。`));return callUser(f,n,{self:o})}
    if(o.t==="none")throw rterr(n,(ENG()?`<b>AttributeError</b>: <code>${esc(txt(n.f.obj))}</code> is <b>None</b>, so there is no .${esc(m)}( ) to use.`:`<b>AttributeError</b>：<code>${esc(txt(n.f.obj))}</code> 是 <b>None</b>，沒有 .${esc(m)}( ) 可以用。`));
    const as=n.args.map(ev),T_=`<code>${esc(txt(n))}</code>`;
    if(o.t==="module"&&MODS[o.v]){if(!MODS[o.v].includes(m))throw rterr(n,(ENG()?`On this website, the ${o.v} module only has: ${MODS[o.v].join(", ")}`:`這個網頁的 ${o.v} 模組目前只有：${MODS[o.v].join("、")}`));return EXTRA[m](n)}
    if(o.t==="module"&&o.v==="copy"){
      if(as.length!==1||!["copy","deepcopy"].includes(m))throw rterr(n,(ENG()?"On this website, the copy module only supports copy.copy(x) and copy.deepcopy(x)":"這個網頁的 copy 模組只支援 copy.copy(x) 和 copy.deepcopy(x)"));
      const x=as[0];if(!["list","dict","set","tuple"].includes(x.t))return x;
      if(m==="copy"){const r=mk(x.t,x.t==="dict"?x.v.map(p=>p.slice()):x.v.slice());note((ENG()?`ℹ ${T_}: a <b>shallow copy</b> makes a new outer box, but the things inside are still the same objects.`:`ℹ ${T_}：<b>淺複製</b>：做出新的外殼，裡面的東西還是原本那幾個物件。`));return r}
      const memo=new Map();const deep=y=>{if(memo.has(y.id))return memo.get(y.id);if(!["list","dict","set","tuple"].includes(y.t))return y;
        const r=mk(y.t,[]);memo.set(y.id,r);r.v=y.t==="dict"?y.v.map(([k,v])=>[k,deep(heap.get(v)).id]):y.v.map(i=>deep(heap.get(i)).id);return r};
      const r=deep(x);note((ENG()?`ℹ ${T_}: a <b>deep copy</b> goes in level by level and makes a new copy of every list (dict, set).`:`ℹ ${T_}：<b>深複製</b>：一層一層往裡面，每一個 list（dict、set）都做一份新的。`));return r}
    if(o.t==="str"){
      switch(m){
        case"split":{let parts;
          if(!as.length){parts=o.v.trim().split(/\s+/).filter(x=>x!=="");note((ENG()?`ℹ ${T_}: cut it at the <b>spaces</b> (many spaces in a row count as one), which gives ${parts.length} strings.`:`ℹ ${T_}：依照<b>空白</b>切開（連續好幾個空白也只算一次），得到 ${parts.length} 個字串。`))}
          else{if(as[0].t!=="str")throw rterr(n,(ENG()?".split( ) needs a string inside":".split( ) 裡面要放字串"));parts=o.v.split(as[0].v);note((ENG()?`ℹ ${T_}: cut it at ${esc(repr(as[0]))}, which gives ${parts.length} strings.`:`ℹ ${T_}：依照 ${esc(repr(as[0]))} 切開，得到 ${parts.length} 個字串。`))}
          return mk("list",parts.map(x=>Str(x).id))}
        case"strip":return Str(o.v.trim());
        case"upper":return Str(o.v.toUpperCase());
        case"lower":return Str(o.v.toLowerCase());
        case"join":{if(as.length!==1)throw rterr(n,(ENG()?".join( ) needs a list inside":".join( ) 裡面要放一個 list"));const items=iterItems(as[0],n);
          const bad=items.find(x=>x.t!=="str");if(bad)throw rterr(n,(ENG()?`<b>TypeError</b>: join only works on strings, but there is ${kind(bad)} ${esc(repr(bad))} inside. Turn each one into a string with <code>map(str, ...)</code> first.`:`<b>TypeError</b>：join 只能接字串，裡面有${kind(bad)} ${esc(repr(bad))}。可以先用 <code>map(str, ...)</code> 把每一個都變成字串。`));
          const r=items.map(x=>x.v).join(o.v);note((ENG()?`ℹ ${T_}: join ${items.length} strings with ${esc(repr(o))}, which gives ${esc(repr({t:"str",v:r}))}.`:`ℹ ${T_}：用 ${esc(repr(o))} 把 ${items.length} 個字串接起來，得到 ${esc(repr({t:"str",v:r}))}。`));return Str(r)}
        case"find":{if(as.length!==1||as[0].t!=="str")throw rterr(n,(ENG()?".find( ) needs a string inside":".find( ) 裡面要放一個字串"));const r=o.v.indexOf(as[0].v);
          note((ENG()?`ℹ ${T_}: ${r<0?`cannot find ${esc(repr(as[0]))}, so it gives <b>-1</b>.`:`${esc(repr(as[0]))} first appears at item ${r}.`}`:`ℹ ${T_}：${r<0?`找不到 ${esc(repr(as[0]))}，所以得到 <b>-1</b>。`:`${esc(repr(as[0]))} 第一次出現在第 ${r} 個。`}`));return I(r)}
        case"replace":{if(as.length!==2||as[0].t!=="str"||as[1].t!=="str")throw rterr(n,(ENG()?".replace( ) needs two strings inside: the old one and the new one":".replace( ) 裡面要放兩個字串：舊的、新的"));
          const r=as[0].v===""?o.v:o.v.split(as[0].v).join(as[1].v);note((ENG()?`ℹ ${T_}: replace every ${esc(repr(as[0]))} with ${esc(repr(as[1]))} and make a <b>new</b> string. The old string does not change.`:`ℹ ${T_}：把每一個 ${esc(repr(as[0]))} 換成 ${esc(repr(as[1]))}，做出<b>新的</b>字串。原本的字串不會變。`));return Str(r)}
        case"count":{if(as.length!==1||as[0].t!=="str")throw rterr(n,(ENG()?".count( ) needs a string inside":".count( ) 裡面要放一個字串"));return I(as[0].v===""?o.v.length+1:o.v.split(as[0].v).length-1)}
        case"isdigit":return B(/^[0-9]+$/.test(o.v));
      }
      throw rterr(n,(ENG()?`This website does not support the string method .${esc(m)}() yet`:`這個網頁還不支援字串的 .${esc(m)}()`));
    }
    if(o.t==="list"){
      switch(m){
        case"append":{if(as.length!==1)throw rterr(n,(ENG()?".append( ) needs one thing inside":".append( ) 裡面要放一個東西"));o.v.push(as[0].id);markList(n.f.obj);S.cells.add(o.id+":"+(o.v.length-1));
          S.info=(ENG()?`<code>${esc(txt(n))}</code>: add ${esc(repr(as[0]))} to the <b>end</b> of the list. Now it has ${o.v.length} items.`:`<code>${esc(txt(n))}</code>：把 ${esc(repr(as[0]))} 加到 list 的<b>最後面</b>，現在有 ${o.v.length} 個。`);return NONE()}
        case"index":{if(as.length!==1)throw rterr(n,(ENG()?".index( ) needs the thing to look for inside":".index( ) 裡面要放要找的東西"));const i=o.v.findIndex(id=>same(heap.get(id),as[0]));
          if(i<0)throw rterr(n,(ENG()?`<b>ValueError</b>: ${esc(repr(as[0]))} is not in the list. Before .index( ), check if it is there with in.`:`<b>ValueError</b>：list 裡沒有 ${esc(repr(as[0]))}。用 .index( ) 之前，可以先用 in 檢查有沒有。`));
          for(let k=0;k<=i;k++)S.cellRead.add(o.id+":"+k);note((ENG()?`ℹ ${T_}: look one by one from item 0 (linear search). It looked at ${i+1} items and found it at item ${i}.`:`ℹ ${T_}：從第 0 個開始一個一個找（線性搜尋），看了 ${i+1} 個，在第 ${i} 個找到。`));return I(i)}
        case"count":{if(as.length!==1)throw rterr(n,(ENG()?".count( ) needs the thing to count inside":".count( ) 裡面要放要數的東西"));return I(o.v.filter(id=>same(heap.get(id),as[0])).length)}
        case"sort":{if(as.length)throw rterr(n,(ENG()?"Only key= or reverse= can go inside .sort( )":".sort( ) 括號裡只能放 key= 或 reverse="));const r=sortObjs(o.v.map(i=>heap.get(i)),n.kw,n);
          o.v=r.sorted.map(x=>x.id);markList(n.f.obj);o.v.forEach((x,i)=>S.cells.add(o.id+":"+i));
          S.info=(ENG()?`${T_}: sort the list <b>itself</b> ${r.kf?"by the value from key, ":""}${r.rev?"from big to small":"from small to big"} (it does not make a new list).`:`${T_}：把 list <b>自己</b>${r.kf?"照 key 算出來的值":""}${r.rev?"由大到小":"由小到大"}排好（不會做出新的 list）。`);return NONE()}
        case"copy":{if(as.length)throw rterr(n,(ENG()?".copy( ) needs nothing inside the brackets":".copy( ) 括號裡不用放東西"));note((ENG()?`ℹ <code>${esc(txt(n))}</code>: make a <b>new</b> list with the same things inside, but it is a different object.`:`ℹ <code>${esc(txt(n))}</code>：做出一個<b>新的</b> list，裡面的東西一樣，但是是另一個物件。`));return mk("list",o.v.slice())}
        case"pop":{if(!o.v.length)throw rterr(n,(ENG()?"<b>IndexError</b>: the list is empty, so you cannot pop. Before you pop, check if the list still has something in it.":"<b>IndexError</b>：list 是空的，不能 pop。pop 之前先檢查 list 裡還有沒有東西。"));
          if(as.length>1||as.length&&as[0].t!=="int")throw rterr(n,(ENG()?".pop( ) can be empty, or have one integer inside (which item)":".pop( ) 裡面可以不放，或放一個整數（第幾個）"));
          let i=as.length?Number(as[0].v):o.v.length-1;if(i<0)i+=o.v.length;
          if(i<0||i>=o.v.length)throw rterr(n,(ENG()?`<b>IndexError</b>: the list has only ${o.v.length} items, so there is no item ${Number(as[0].v)} to pop`:`<b>IndexError</b>：list 只有 ${o.v.length} 個，沒有第 ${Number(as[0].v)} 個可以 pop`));
          const id=o.v.splice(i,1)[0];markList(n.f.obj);
          note(i===o.v.length?(ENG()?`ℹ ${T_}: take off <b>the last one</b>, ${esc(repr(heap.get(id)))}, and give it back.`:`ℹ ${T_}：拿掉<b>最後一個</b> ${esc(repr(heap.get(id)))}，交回來。`)
            :(ENG()?`ℹ ${T_}: take off item ${i}, ${esc(repr(heap.get(id)))}. <b>The ${o.v.length-i} items after it must all move forward one box</b>.`:`ℹ ${T_}：拿掉第 ${i} 個 ${esc(repr(heap.get(id)))}，<b>後面的 ${o.v.length-i} 個都要往前搬一格</b>。`));
          return heap.get(id)}
      }
      throw rterr(n,(ENG()?`This website does not support the list method .${esc(m)}() yet`:`這個網頁還不支援 list 的 .${esc(m)}()`));
    }
    if(o.t==="deque"){
      const one=()=>{if(as.length!==1)throw rterr(n,(ENG()?`.${m}( ) needs one thing inside`:`.${m}( ) 裡面要放一個東西`))},empty=()=>{if(!o.v.length)throw rterr(n,(ENG()?`<b>IndexError</b>: the deque is empty, so you cannot ${m}.`:`<b>IndexError</b>：deque 是空的，不能 ${m}。`))};
      switch(m){
        case"append":one();o.v.push(as[0].id);markList(n.f.obj);S.cells.add(o.id+":"+(o.v.length-1));S.info=(ENG()?`${T_}: put ${esc(repr(as[0]))} at the <b>end</b>. Now it has ${o.v.length} items.`:`${T_}：把 ${esc(repr(as[0]))} 放到<b>最後面</b>，現在有 ${o.v.length} 個。`);return NONE();
        case"appendleft":one();o.v.unshift(as[0].id);markList(n.f.obj);S.cells.add(o.id+":0");S.info=(ENG()?`${T_}: put ${esc(repr(as[0]))} at the <b>front</b>. Now it has ${o.v.length} items.`:`${T_}：把 ${esc(repr(as[0]))} 放到<b>最前面</b>，現在有 ${o.v.length} 個。`);return NONE();
        case"pop":{empty();const id=o.v.pop();markList(n.f.obj);note((ENG()?`ℹ ${T_}: take off the one at the <b>end</b>, ${esc(repr(heap.get(id)))}, and give it back.`:`ℹ ${T_}：拿掉<b>最後面</b>的 ${esc(repr(heap.get(id)))}，交回來。`));return heap.get(id)}
        case"popleft":{empty();const id=o.v.shift();markList(n.f.obj);note((ENG()?`ℹ ${T_}: take off the one at the <b>front</b>, ${esc(repr(heap.get(id)))}, and give it back (nothing after it needs to move, so it is fast).`:`ℹ ${T_}：拿掉<b>最前面</b>的 ${esc(repr(heap.get(id)))}，交回來（不用搬動後面的東西，很快）。`));return heap.get(id)}
      }
      throw rterr(n,(ENG()?`This website does not support the deque method .${esc(m)}() yet`:`這個網頁還不支援 deque 的 .${esc(m)}()`));
    }
    if(o.t==="dict"){
      switch(m){
        case"get":{if(as.length<1||as.length>2)throw rterr(n,(ENG()?".get( ) needs a key inside, and maybe a default value too":".get( ) 裡面要放鍵，可以再加一個預設值"));hashable(as[0],n);const j=dfind(o,as[0]);
          if(j>=0){S.cellRead.add(o.id+":"+j);return heap.get(o.v[j][1])}
          note((ENG()?`ℹ ${T_}: the dict has no key ${esc(repr(as[0]))}, so it gives ${as.length===2?`the default value ${esc(repr(as[1]))}`:"None"} (it does not give an error like [ ] does).`:`ℹ ${T_}：dict 裡沒有鍵 ${esc(repr(as[0]))}，所以得到${as.length===2?`預設值 ${esc(repr(as[1]))}`:" None"}（不會像 [ ] 一樣出錯）。`));return as.length===2?as[1]:NONE()}
        case"keys":return view("dict_keys",o.v.map(([k])=>k));
        case"values":return view("dict_values",o.v.map(([,v])=>v));
        case"items":return view("dict_items",o.v.map(([k,v])=>mk("tuple",[k,v]).id));
      }
      throw rterr(n,(ENG()?`This website does not support the dict method .${esc(m)}() yet`:`這個網頁還不支援 dict 的 .${esc(m)}()`));
    }
    if(o.t==="set"){
      switch(m){
        case"add":{if(as.length!==1)throw rterr(n,(ENG()?".add( ) needs one thing inside":".add( ) 裡面要放一個東西"));hashable(as[0],n);const j=sfind(o,as[0]);
          if(j>=0){S.cellRead.add(o.id+":"+j);S.info=(ENG()?`${T_}: ${esc(repr(as[0]))} is <b>already in the set</b>. A set does not keep repeats, so nothing changes.`:`${T_}：${esc(repr(as[0]))} <b>已經在 set 裡了</b>，set 不會重複放，所以什麼都沒變。`)}
          else{o.v.push(as[0].id);markList(n.f.obj);S.cells.add(o.id+":"+(o.v.length-1));S.info=(ENG()?`${T_}: put ${esc(repr(as[0]))} into the set. Now it has ${o.v.length} items.`:`${T_}：把 ${esc(repr(as[0]))} 放進 set，現在有 ${o.v.length} 個。`)}
          return NONE()}
        case"remove":case"discard":{if(as.length!==1)throw rterr(n,(ENG()?`.${m}( ) needs one thing inside`:`.${m}( ) 裡面要放一個東西`));const j=sfind(o,as[0]);
          if(j<0){if(m==="remove")throw rterr(n,(ENG()?`<b>KeyError</b>: ${esc(repr(as[0]))} is not in the set, so you cannot remove it. With discard, there is no error even if it is not there.`:`<b>KeyError</b>：set 裡沒有 ${esc(repr(as[0]))}，不能 remove。用 discard 的話，沒有也不會出錯。`));S.info=(ENG()?`${T_}: ${esc(repr(as[0]))} was not in the set, so nothing changes.`:`${T_}：set 裡本來就沒有 ${esc(repr(as[0]))}，什麼都沒變。`);return NONE()}
          o.v.splice(j,1);markList(n.f.obj);S.info=(ENG()?`${T_}: take ${esc(repr(as[0]))} out of the set. ${o.v.length} items are left.`:`${T_}：把 ${esc(repr(as[0]))} 從 set 拿掉，剩下 ${o.v.length} 個。`);return NONE()}
      }
      throw rterr(n,(ENG()?`This website does not support the set method .${esc(m)}() yet`:`這個網頁還不支援 set 的 .${esc(m)}()`));
    }
    throw rterr(n,(ENG()?`<b>AttributeError</b>: ${kind(o)} has no .${esc(m)}( ) to use`:`<b>AttributeError</b>：${kind(o)}沒有 .${esc(m)}( ) 可以用`));
  }
  // 自己寫的函式：呼叫的時候多一層框，參數貼到傳進來的物件上
  function construct(c,n){
    const inst=mk("inst",{cls:c,f:[]}),init=c.v.m.get("__init__");
    if(init)callUser(init,n,{self:inst,ctor:true});
    else{if(n.args.length||n.kw.length)throw rterr(n,(ENG()?`<b>TypeError</b>: ${esc(c.v.name)} has no __init__, so nothing can go inside the brackets when you make an object.`:`<b>TypeError</b>：${esc(c.v.name)} 沒有寫 __init__，建立物件時括號裡不能放東西。`));
      note((ENG()?`ℹ <code>${esc(txt(n))}</code>: make a new <b>${esc(c.v.name)}</b> object (it has no attributes yet).`:`ℹ <code>${esc(txt(n))}</code>：做出一個新的 <b>${esc(c.v.name)}</b> 物件（現在還沒有任何屬性）。`))}
    return inst;
  }
  function callUser(fo,n,opt={}){
    const D=fo.v.D,P=D.params,C=`<code>${esc(txt(n))}</code>`,cls=opt.self?opt.self.v.cls.v.name:"";
    const as=[...(opt.self?[opt.self]:[]),...(opt.vals||n.args.map(ev))],kws=opt.vals?[]:n.kw.map(k=>({name:k.name,o:ev(k.x)}));
    const C_=opt.callText?`<code>${esc(opt.callText)}</code>`:C;
    if(as.length>P.length)throw rterr(n,(ENG()?`<b>TypeError</b>: ${esc(D.name)}( ) has only ${P.length} parameters, but ${C} gives ${as.length}.`:`<b>TypeError</b>：${esc(D.name)}( ) 只有 ${P.length} 個參數，${C} 卻給了 ${as.length} 個。`));
    const vals=P.map((q,i)=>as[i]||null),how=P.map((q,i)=>as[i]?"":null);
    for(const k of kws){const i=P.findIndex(q=>q.name===k.name);
      if(i<0)throw rterr(n,(ENG()?`<b>TypeError</b>: ${esc(D.name)}( ) has no parameter called <code>${esc(k.name)}</code>.`:`<b>TypeError</b>：${esc(D.name)}( ) 沒有叫做 <code>${esc(k.name)}</code> 的參數。`));
      if(vals[i])throw rterr(n,(ENG()?`<b>TypeError</b>: the parameter <code>${esc(k.name)}</code> is given twice.`:`<b>TypeError</b>：參數 <code>${esc(k.name)}</code> 給了兩次。`));vals[i]=k.o;how[i]=""}
    P.forEach((q,i)=>{if(vals[i])return;if(fo.v.defs[i]){vals[i]=fo.v.defs[i];how[i]=(ENG()?" (not given, so it uses the default value)":"（沒給，用預設值）");return}
      throw rterr(n,(ENG()?`<b>TypeError</b>: ${C} is missing the parameter <code>${esc(q.name)}</code>. def ${esc(D.name)}( ) has ${P.length} parameters, and the call must give each one.`:`<b>TypeError</b>：${C} 少給了參數 <code>${esc(q.name)}</code>。def ${esc(D.name)}( ) 有 ${P.length} 個參數，呼叫的時候要一個一個給。`))});
    if(frames.length>MAXDEPTH)throw rterr(n,(ENG()?`<b>RecursionError</b>: functions keep calling functions, and it is more than ${MAXDEPTH} levels deep! Most likely the recursion <b>has no stopping condition</b>, or the stopping condition is never true.<br>(Real Python stops at about 1000 levels. This website runs in the browser, so it stops at ${MAXDEPTH} levels.)`:`<b>RecursionError</b>：函式一層呼叫一層，已經超過 ${MAXDEPTH} 層了！很可能是遞迴<b>忘了寫終止條件</b>，或終止條件永遠不會成立。<br>（真的 Python 大約到 1000 層才會停下來；這個網頁跑在瀏覽器裡，先停在 ${MAXDEPTH} 層。）`));
    const short=o=>{const r=repr(o);return r.length<=10?r:o.t==="list"?"[…]":o.t==="str"?r.slice(0,8)+"…'":r.slice(0,9)+"…"};  // 標題太長會把名字欄撐寬
    let lab=opt.self?`${cls}.${D.name}(${vals.slice(1).map(short).join(", ")})`:`${D.name}(${vals.map(short).join(", ")})`;if(lab.length>28)lab=lab.slice(0,26)+"…)";
    const F={names:new Map(),label:lab,fn:D,depth:frames.length,key:"c"+(++callSeq)};frames.push(F);names=F.names;
    P.forEach((q,i)=>{F.names.set(q.name,vals[i].id);S.changed.add(F.depth+":"+q.name)});
    const saved={inputNote:S.inputNote,printInfo:S.printInfo,info:S.info,userCall:S.userCall};
    if(opt.ctor)snap(D,(ENG()?`${C}: make a new <b>${esc(cls)}</b> object, and call <b>__init__</b> to give it starting values: <b>self</b> points to this new object${P.length>1?", "+P.slice(1).map((q,i)=>`<b>${esc(q.name)}</b> is stuck on ${esc(repr(vals[i+1]))}${how[i+1]}`).join(", "):""}.`:`${C}：做出一個新的 <b>${esc(cls)}</b> 物件，自動呼叫 <b>__init__</b> 給它初始值：<b>self</b> 指著這個新物件${P.length>1?"，"+P.slice(1).map((q,i)=>`<b>${esc(q.name)}</b> 貼到 ${esc(repr(vals[i+1]))}${how[i+1]}`).join("、"):""}。`));
    else snap(D,(ENG()?`Call ${C_}: jump into the ${opt.self?"method":"function"} <b>${esc(D.name)}</b>${P.length?", "+P.map((q,i)=>`the parameter <b>${esc(q.name)}</b> is stuck on ${esc(repr(vals[i]))}${how[i]}`).join(", "):""}.<br>The call stack has one more level (now ${frames.length} levels): ${esc(D.name)} has its <b>own</b> set of names (local variables).`:`呼叫 ${C_}：跳進${opt.self?"方法":"函式"} <b>${esc(D.name)}</b>${P.length?"，"+P.map((q,i)=>`參數 <b>${esc(q.name)}</b> 貼到 ${esc(repr(vals[i]))}${how[i]}`).join("、"):""}。<br>呼叫堆疊多了一層（現在 ${frames.length} 層）：${esc(D.name)} 有一組<b>自己的</b>名字（區域變數）。`));
    let ret;
    try{body(D.body);ret=NONE();snap(D,opt.ctor?(ENG()?`__init__ is done. The new ${esc(cls)} object is ready.`:`__init__ 跑完了，新的 ${esc(cls)} 物件準備好了。`):(ENG()?`${esc(D.name)} has finished without a return, so it gives back <b>None</b>.`:`${esc(D.name)} 的程式跑完了，沒有遇到 return，自動交回 <b>None</b>。`))}
    catch(e){if(e&&e.ret)ret=e.v;else if(e===BRK||e===CNT)throw rterr(n,(ENG()?"break / continue can only be used inside a loop":"break / continue 只能用在迴圈裡面"));else throw e}
    frames.pop();names=top().names;Object.assign(S,saved);
    if(opt.ctor){S.userCall={name:cls,v:opt.self};note((ENG()?`ℹ Done: ${C} gives a new <b>${esc(cls)}</b> object.`:`ℹ 建立好了：${C} 得到一個新的 <b>${esc(cls)}</b> 物件。`));return ret}
    S.userCall={name:D.name,v:ret};
    note((ENG()?`ℹ ${esc(D.name)}( ) ends and goes back to where it was called, with the return value <b>${esc(repr(ret))}</b>. The local variables of ${esc(D.name)} are all gone.`:`ℹ ${esc(D.name)}( ) 結束，回到呼叫它的地方，拿到回傳值 <b>${esc(repr(ret))}</b>。${esc(D.name)} 的區域變數都不見了。`));
    return ret;
  }
  function markList(x){if(x.k==="name"){const w=where(x.id);if(w&&w.k)S.changed.add(w.k)}}
  /* ---------- 指定：把名字貼到物件上 ---------- */
  function bind(name,o){
    const F=top(),m=F.depth>0&&F.fn.globals.has(name)?G():names;
    const old=m.has(name)?m.get(name):null;
    m.set(name,o.id);S.changed.add((m===names?F.depth:0)+":"+name);
    return old;
  }
  function deadAfter(olds){
    const live=new Set(reach());const gone=olds.filter(id=>id!=null&&!live.has(id)&&heap.has(id));
    gone.forEach(id=>S.dead.push(repr(heap.get(id))));
    return gone.map(id=>esc(repr(heap.get(id))));
  }
  function assignTo(tg,o,parts){
    if(tg.k==="name"){const old=bind(tg.id,o);parts.push({name:tg.id,o,old});return}
    if(tg.k==="attr"){
      const c=ev(tg.obj);
      if(c.t==="none")throw rterr(tg,(ENG()?`<b>AttributeError</b>: <code>${esc(txt(tg.obj))}</code> is <b>None</b>, so you cannot set .${esc(tg.name)}.`:`<b>AttributeError</b>：<code>${esc(txt(tg.obj))}</code> 是 <b>None</b>，不能設定 .${esc(tg.name)}。`));
      if(c.t!=="inst")throw rterr(tg,(ENG()?`<b>AttributeError</b>: you cannot add your own attribute (.${esc(tg.name)}) to ${kind(c)}.`:`<b>AttributeError</b>：${kind(c)}不能加上自己的屬性（.${esc(tg.name)}）。`));
      const j=c.v.f.findIndex(([k])=>k===tg.name);
      if(j<0){c.v.f.push([tg.name,o.id]);S.cells.add(c.id+":"+(c.v.f.length-1));parts.push({label:txt(tg),o,old:null,newAttr:tg.name});return}
      const old=c.v.f[j][1];c.v.f[j][1]=o.id;S.cells.add(c.id+":"+j);parts.push({label:txt(tg),o,old});return;
    }
    if(tg.k==="index"){
      const c=ev(tg.obj),k=ev(tg.i);
      if(c.t==="dict"){hashable(k,tg.i);const j=dfind(c,k);markList(tg.obj);
        if(j<0){c.v.push([k.id,o.id]);S.cells.add(c.id+":"+(c.v.length-1));parts.push({label:txt(tg),o,old:null,newKey:repr(k)});return}
        const old=c.v[j][1];c.v[j][1]=o.id;S.cells.add(c.id+":"+j);parts.push({label:txt(tg),o,old});return}
      if(c.t==="str")throw rterr(tg,(ENG()?"<b>TypeError</b>: you cannot change the characters inside a string (strings cannot be changed). To change it, make a new string.":"<b>TypeError</b>：字串不能改裡面的字（字串是不能改的物件）。要改就做一個新的字串。"));
      if(c.t!=="list")throw rterr(tg,(ENG()?`<b>TypeError</b>: you cannot use [ ] to change what is inside ${kind(c)}`:`<b>TypeError</b>：${kind(c)}不能用 [ ] 改內容`));
      let i=Number(k.v);if(i<0)i+=c.v.length;if(i<0||i>=c.v.length)throw rterr(tg,(ENG()?`<b>IndexError</b>: <code>${esc(txt(tg.obj))}</code> has only ${c.v.length} items. There is no item ${Number(k.v)}.`:`<b>IndexError</b>：<code>${esc(txt(tg.obj))}</code> 只有 ${c.v.length} 個，沒有第 ${Number(k.v)} 個。`));
      const old=c.v[i];c.v[i]=o.id;markList(tg.obj);S.cells.add(c.id+":"+i);parts.push({label:txt(tg),o,old});return;
    }
    if(tg.k==="tuple"){
      const items=SEQ.has(o.t)?o.v.map(i=>heap.get(i)):o.t==="str"?[...o.v].map(c=>Str(c)):null;
      if(!items)throw rterr(tg,(ENG()?`<b>TypeError</b>: ${kind(o)} cannot be split up among several names`:`<b>TypeError</b>：${kind(o)}不能拆開分給好幾個名字`));
      if(items.length!==tg.items.length)throw rterr(tg,(ENG()?`<b>ValueError</b>: there are ${tg.items.length} names on the left but ${items.length} values on the right, so they do not match.${items.length<tg.items.length?" (Is the input missing some numbers?)":""}`:`<b>ValueError</b>：左邊有 ${tg.items.length} 個名字，右邊卻有 ${items.length} 個值，對不起來。${items.length<tg.items.length?"（是不是輸入的數字太少了？）":""}`));
      tg.items.forEach((t,i)=>assignTo(t,items[i],parts));
    }
  }
  function vis(s){return`<span class="vis">${esc(s).replace(/ /g,"␣").replace(/\n/g,"↵").replace(/\t/g,"⇥")}</span>`}
  function rhsNote(x,o){
    const R=`<code>${esc(txt(x))}</code>`,V=`<b>${esc(repr(o))}</b>`;
    if(x.k==="num"||x.k==="str"||x.k==="const")return(ENG()?`Make ${kind(o)} object ${V}`:`建立一個 ${kind(o)} 物件 ${V}`);
    if(x.k==="name")return null;
    return(ENG()?`Work out the right side first: ${R} → ${V} (${kind(o)})`:`先算右邊 ${R} → ${V}（${kind(o)}）`);
  }
  function execAssign(st){
    S.inputNote=null;
    const o=ev(st.x);const parts=[];
    if(st.tg.k==="tuple"&&st.x.k==="tuple")note((ENG()?`ℹ The right side is <b>all worked out first</b> (${esc(repr(o))}), and then stuck on the names on the left in order. So a swap does not need a temporary variable.`:`ℹ 右邊會<b>先全部算好</b>（${esc(repr(o))}），再依序貼到左邊的名字上，所以交換不需要暫存變數。`));
    assignTo(st.tg,o,parts);
    const dead=deadAfter(parts.map(p=>p.old));
    let msg="";
    if(S.inputNote)msg+=S.inputNote+"<br>";
    if(parts.length===1&&st.tg.k==="name"){
      const p=parts[0],N=`<b>${esc(p.name)}</b>`;
      if(st.x.k==="name")msg+=(ENG()?`Stick the name ${N} on <b>the same object</b> ${esc(repr(o))} that <code>${esc(st.x.id)}</code> points to (nothing is copied: two names point to the same thing).`:`把名字 ${N} 貼到 <code>${esc(st.x.id)}</code> 指著的<b>同一個物件</b> ${esc(repr(o))} 上（沒有複製，兩個名字指著同一個東西）。`);
      else msg+=(ENG()?`${rhsNote(st.x,o)}, then stick the name ${N} on it.`:`${rhsNote(st.x,o)}，再把名字 ${N} 貼上去。`);
      if(p.old!=null&&p.old!==o.id)msg+=(ENG()?` ${N} pointed to ${esc(repr(heap.get(p.old)))} before; now it points to the new object.`:` ${N} 原本指著 ${esc(repr(heap.get(p.old)))}，現在改指新的物件。`);
    }else if(st.tg.k==="index"&&parts[0].newKey!=null){msg+=(ENG()?`${rhsNote(st.x,o)||`Take the object that <code>${esc(txt(st.x))}</code> points to`}. The dict had <b>no</b> key ${esc(parts[0].newKey)}, so a new item ${esc(parts[0].newKey)}: ${esc(repr(o))} is <b>added</b>.`:`${rhsNote(st.x,o)||`拿 <code>${esc(txt(st.x))}</code> 指著的物件`}。dict 裡原本<b>沒有</b>鍵 ${esc(parts[0].newKey)}，所以<b>新增</b>一項 ${esc(parts[0].newKey)}: ${esc(repr(o))}。`)}
    else if(st.tg.k==="attr"){msg+=(ENG()?`${rhsNote(st.x,o)||`Take the object that <code>${esc(txt(st.x))}</code> points to`}, ${parts[0].newAttr?`the object gets a new attribute <b>${esc(parts[0].newAttr)}</b>, `:""}and put it in <b>${esc(txt(st.tg))}</b>.`:`${rhsNote(st.x,o)||`拿 <code>${esc(txt(st.x))}</code> 指著的物件`}，${parts[0].newAttr?`物件多了一個屬性 <b>${esc(parts[0].newAttr)}</b>，`:""}放進 <b>${esc(txt(st.tg))}</b>。`)}
    else if(st.tg.k==="index"){msg+=(ENG()?`${rhsNote(st.x,o)||`Take the object that <code>${esc(txt(st.x))}</code> points to`}, and put it in the box <b>${esc(txt(st.tg))}</b>.`:`${rhsNote(st.x,o)||`拿 <code>${esc(txt(st.x))}</code> 指著的物件`}，放進 <b>${esc(txt(st.tg))}</b> 那一格。`)}
    else msg+=(ENG()?`Stick the values on the right on the names in order: ${parts.map(p=>`<b>${esc(p.name||p.label)}</b> → ${esc(repr(p.o))}`).join(", ")}.`:`把右邊的值依序貼到名字上：${parts.map(p=>`<b>${esc(p.name||p.label)}</b> → ${esc(repr(p.o))}`).join("、")}。`);
    if(dead.length)msg+=(ENG()?`<br>No name points to ${dead.join(", ")} anymore, so Python throws it away (<b>garbage collection</b>).`:`<br>${dead.join("、")} 已經沒有名字指著了，Python 會自動把它<b>回收</b>。`);
    snap(st,msg);
  }
  function execAug(st){
    S.inputNote=null;
    const tg=st.tg,cur=tg.k==="name"?lookup(tg):ev(tg),r=ev(st.x),o=arith(st.op,cur,r,st);
    const parts=[];assignTo(tg,o,parts);const dead=deadAfter(parts.map(p=>p.old));
    const L=esc(txt(tg));
    snap(st,(ENG()?`<code>${L} ${st.op}= ${esc(txt(st.x))}</code> means ${L} = ${L} ${st.op} ${esc(txt(st.x))}: ${esc(repr(cur))} ${st.op} ${esc(repr(r))} = <b>${esc(repr(o))}</b>, and ${L} now points to this new object.`:`<code>${L} ${st.op}= ${esc(txt(st.x))}</code> 就是 ${L} = ${L} ${st.op} ${esc(txt(st.x))}：${esc(repr(cur))} ${st.op} ${esc(repr(r))} = <b>${esc(repr(o))}</b>，${L} 改指這個新的物件。`)+(dead.length?(ENG()?`<br>No name points to ${dead.join(", ")} anymore, so it will be thrown away.`:`<br>${dead.join("、")} 沒有名字指著了，會被回收。`):""));
  }
  function condText(c,o){const t=truthy(o);return(ENG()?`<code>${esc(txt(c))}</code> → <b>${t?"true (True)":"false (False)"}</b>`:`<code>${esc(txt(c))}</code> → <b>${t?"成立 (True)":"不成立 (False)"}</b>`)}
  function body(stmts){for(const s of stmts)exec(s)}
  function exec(st){
    switch(st.k){
      case"pass":snap(st,(ENG()?"<code>pass</code>: do nothing.":"<code>pass</code>：什麼都不做。"));return;
      case"class":{const m=new Map();for(const d of st.methods)m.set(d.name,mk("func",{D:d,defs:d.params.map(q=>q.d?ev(q.d):null)}));
        bind(st.name,mk("class",{name:st.name,m}));
        snap(st,(ENG()?`Define class <b>${esc(st.name)}</b>: a new type${m.size?`, with the methods ${[...m.keys()].map(esc).join(", ")}`:""}. There is no ${esc(st.name)} object yet. Write ${esc(st.name)}( ) to make one.`:`定義 class <b>${esc(st.name)}</b>：一種新的型別${m.size?`，裡面有方法 ${[...m.keys()].map(esc).join("、")}`:""}。現在還沒有任何 ${esc(st.name)} 物件，要寫 ${esc(st.name)}( ) 才會做出來。`));return}
      case"def":{const defs=st.params.map(q=>q.d?ev(q.d):null);bind(st.name,mk("func",{D:st,defs}));
        snap(st,(ENG()?`Define the function <b>${esc(st.name)}</b>: remember this code and stick the name ${esc(st.name)} on it. <b>It does not run yet</b>. It runs only when ${esc(st.name)}( ) is called.`:`定義函式 <b>${esc(st.name)}</b>：先把這段程式記下來，貼上名字 ${esc(st.name)}。<b>現在還不會執行</b>，要等到呼叫 ${esc(st.name)}( ) 的時候才會跑。`));return}
      case"global":snap(st,(ENG()?`<code>${esc(txt(st))}</code>: in this function, ${st.names.map(esc).join(", ")} means the one outside (global), not a new local variable.`:`<code>${esc(txt(st))}</code>：在這個函式裡，${st.names.map(esc).join("、")} 指的是外面（全域）的那一個，不是新的區域變數。`));return;
      case"return":{const o=st.x?ev(st.x):NONE();const F=top();if(o.t!=="none")S.retv={key:F.key,v:repr(o)};
        if(F.fn.lambda){snap(st,(ENG()?`lambda works out <code>${esc(txt(st.x))}</code> → <b>${esc(repr(o))}</b> and gives it back.`:`lambda 算出 <code>${esc(txt(st.x))}</code> → <b>${esc(repr(o))}</b>，交回去。`));throw{ret:true,v:o}}
        snap(st,(ENG()?`<code>${esc(txt(st))}</code>: give <b>${esc(repr(o))}</b> back to where ${esc(F.label)} was called. The function <b>ends</b> here, and the code after it does not run.`:`<code>${esc(txt(st))}</code>：把 <b>${esc(repr(o))}</b> 交回給呼叫 ${esc(F.label)} 的地方。函式到這裡就<b>結束</b>了，後面的程式不會執行。`)+(st.x&&st.x.k==="tuple"?(ENG()?"<br>ℹ Several values separated by commas are packed into one tuple and given back together.":"<br>ℹ 用逗號隔開好幾個值，會包成一個 tuple 一起交回去。"):""));
        throw{ret:true,v:o}}
      case"from":st.names.forEach(nm=>bind(nm,mk("builtin",nm)));
        snap(st,(ENG()?`<code>${esc(txt(st))}</code>: take ${st.names.join(", ")} from the ${st.mod} module. After this, you can write ${st.names[0]}( ) directly.`:`<code>${esc(txt(st))}</code>：從 ${st.mod} 模組拿出 ${st.names.join("、")}，之後可以直接寫 ${st.names[0]}( )。`));return;
      case"import":bind(st.name,mk("module",st.name));
        snap(st,st.name==="sys"?(ENG()?"<code>import sys</code>: bring in the sys module, so you can write <code>sys.stdin</code> (read all the input).":"<code>import sys</code>：把 sys 模組拿進來用，之後就可以寫 <code>sys.stdin</code>（讀所有的輸入）。"):(ENG()?`<code>import ${st.name}</code>: bring in the ${st.name} module, so you can write <code>${st.name}.name</code> to use the functions in it.`:`<code>import ${st.name}</code>：把 ${st.name} 模組拿進來用，之後就可以寫 <code>${st.name}.名字</code> 用它裡面的函式。`));return;
      case"assign":execAssign(st);return;
      case"aug":execAug(st);return;
      case"expr":{
        S.inputNote=null;S.printInfo=null;S.info=null;S.userCall=null;const o=ev(st.x);
        if(S.info){snap(st,S.info);return}
        if(S.printInfo){const pi=S.printInfo;let m=(ENG()?`Print on the screen: ${vis(S.lastPrint)}`:`印到螢幕：${vis(S.lastPrint)}`);
          if(!S.printed&&pi.n>1&&!pi.sep)m+=(ENG()?`<br>ℹ print adds <b>one space</b> between things, and <b>starts a new line</b> at the end.`:`<br>ℹ print 會自動在每個東西中間加<b>一個空白</b>、最後自動<b>換行</b>。`);
          if(pi.sep||pi.end)m+=(ENG()?`<br>ℹ ${pi.sep?"sep= replaces the spaces between things":""}${pi.sep&&pi.end?", and ":""}${pi.end?"end= replaces the new line at the end":""}.`:`<br>ℹ ${pi.sep?"sep= 換掉中間的空白":""}${pi.sep&&pi.end?"、":""}${pi.end?"end= 換掉最後的換行":""}。`);
          S.printed=true;snap(st,(S.inputNote?S.inputNote+"<br>":"")+m);return}
        if(S.inputNote){snap(st,S.inputNote+(ENG()?"<br>The string that was read is not stuck on any name, so it is thrown away right away.":"<br>讀到的字串沒有貼到任何名字上，所以馬上就被丟掉了。"));return}
        if(S.userCall&&st.x.k==="call"){const u=S.userCall;snap(st,(ENG()?`${esc(u.name)}( ) is done. Back to this line.`:`${esc(u.name)}( ) 執行完了，回到這一行。`)+(u.v.t!=="none"?(ENG()?`<br>ℹ The return value ${esc(repr(u.v))} is not kept or printed, so it is just thrown away.`:`<br>ℹ 回傳值 ${esc(repr(u.v))} 沒有存起來、也沒有印出來，就這樣丟掉了。`):""));return}
        snap(st,(ENG()?`Work out <code>${esc(txt(st.x))}</code> → ${esc(repr(o))}.`:`計算 <code>${esc(txt(st.x))}</code> → ${esc(repr(o))}。`)+(st.x.k!=="call"?(ENG()?"<br>ℹ The value is not printed or kept, so nothing is left. To see it, use print( ).":"<br>ℹ 算出來的值沒有印出來、也沒有存起來，所以什麼都不會留下。要看到它，用 print( )。"):""));return;
      }
      case"if":{
        for(const b of st.br){const o=ev(b.cond);const t=truthy(o);
          snap(b,(ENG()?`Check ${condText(b.cond,o)}, so `:`判斷 ${condText(b.cond,o)}，`)+(t?(ENG()?"run the indented lines under it.":"執行底下縮排的程式。"):(ENG()?"skip the indented lines under it.":"跳過底下縮排的程式。")));
          if(t){body(b.body);return}}
        if(st.els){snap(st.els,(ENG()?"None of the conditions above is true, so run the lines under <code>else</code>.":"上面的條件都不成立，執行 <code>else</code> 底下的程式。"));body(st.els.body)}
        return;
      }
      case"while":{let round=0;
        for(;;){const o=ev(st.cond),t=truthy(o);snap(st,(ENG()?`Check ${condText(st.cond,o)}, so `:`檢查 ${condText(st.cond,o)}，`)+(t?(ENG()?`enter the loop (round ${++round}).`:`進入迴圈（第 ${++round} 輪）。`):(ENG()?"<b>leave the loop</b>.":"<b>離開迴圈</b>。")));if(!t)break;
          try{body(st.body)}catch(e){if(e===BRK)break;if(e===CNT)continue;throw e}}
        return}
      case"for":{
        const it=ev(st.it);let round=0;
        if(it.t==="stdin"){
          // for line in sys.stdin：每一輪才讀下一行，讀到沒有了（EOF）就結束
          for(;;){
            if(S.pos>=S.inp.length){snap(st,(ENG()?`All the input has been read (<b>EOF</b>), so <b>leave the for loop</b> (${round} rounds in total).`:`輸入已經讀完了（<b>EOF</b>），<b>離開 for 迴圈</b>（共 ${round} 輪）。`));return}
            const nl=S.inp.indexOf("\n",S.pos),end=nl<0?S.inp.length:nl+1,line=S.inp.slice(S.pos,end);
            S.lastRead=[S.pos,end];S.pos=end;round++;
            const parts=[];assignTo(st.tg,Str(line),parts);
            snap(st,(ENG()?`Round ${round}: read <b>the next line</b> of input, ${vis(line)}, and stick <b>${esc(txt(st.tg))}</b> on it${line.endsWith("\n")?" (the new line at the end is included; split() ignores it)":""}.`:`第 ${round} 輪：從輸入讀<b>下一行</b> ${vis(line)}，把 <b>${esc(txt(st.tg))}</b> 貼上去${line.endsWith("\n")?"（最後的換行也在裡面，split() 會自動忽略它）":""}。`));
            try{body(st.body)}catch(e){if(e===BRK)break;if(e===CNT)continue;throw e}
          }
          return;
        }
        const items=iterItems(it,st.it);
        if(it.t==="range"&&!st._told){const[a,b,c]=it.v;note((ENG()?`ℹ <code>${esc(txt(st.it))}</code> makes ${items.slice(0,6).map(o=>o.v.toString()).join(", ")}${items.length>6?"...":""} in order (starting from ${a}, <b>not including</b> ${b}${c!==1?`, adding ${c} each time`:""}), ${items.length} numbers in total.`:`ℹ <code>${esc(txt(st.it))}</code> 會依序產生 ${items.slice(0,6).map(o=>o.v.toString()).join("、")}${items.length>6?"……":""}（從 ${a} 開始，<b>不包含</b> ${b}${c!==1?`，每次加 ${c}`:""}），共 ${items.length} 個。`))}
        for(const o of items){round++;const parts=[];assignTo(st.tg,o,parts);
          snap(st,(ENG()?`Round ${round}: stick <b>${esc(txt(st.tg))}</b> on ${esc(repr(o))}.`:`第 ${round} 輪：把 <b>${esc(txt(st.tg))}</b> 貼到 ${esc(repr(o))}。`));
          try{body(st.body)}catch(e){if(e===BRK)break;if(e===CNT)continue;throw e}}
        snap(st,(ENG()?`Everything has been taken, so <b>leave the for loop</b> (${round} rounds in total).`:`全部都拿過了，<b>離開 for 迴圈</b>（共 ${round} 輪）。`));return}
      case"break":snap(st,(ENG()?"<code>break</code>: leave the nearest loop right away.":"<code>break</code>：立刻跳出最近的那一層迴圈。"));throw BRK;
      case"continue":snap(st,(ENG()?"<code>continue</code>: skip the rest of this round and go straight to the next round.":"<code>continue</code>：這一輪剩下的不做了，直接進入下一輪。"));throw CNT;
    }
  }
  try{
    for(const s of prog)exec(s);
    snap(null,(ENG()?"The program has run to the last line. It is finished.":"程式執行到最後一行，結束了。"));trace[trace.length-1].done=true;
    if(prog.length){const last=prog[prog.length-1];trace[trace.length-1].line=lineOf(last.s)}
  }catch(e){
    if(e&&e.rt){S.notes=[];snap(e.node,`<div class="err">💥 ${e.msg}</div>`,{error:true,done:true},true)}
    else if(e===LIM)snap(null,(ENG()?`<div class="err">It ran more than ${LIMIT} steps, so it stopped. It is probably an <b>infinite loop</b>: check if the loop condition can ever become False.</div>`:`<div class="err">已經執行超過 ${LIMIT} 步，先停下來了。很可能是<b>無窮迴圈</b>：檢查迴圈的條件有沒有機會變成 False。</div>`),{error:true,done:true},true);
    else if(e instanceof RangeError){S.notes=[];snap(null,(ENG()?`<div class="err">💥 <b>RecursionError</b>: functions call functions too deeply, and this website cannot go on. Most likely the recursion has no stopping condition.</div>`:`<div class="err">💥 <b>RecursionError</b>：函式一層呼叫一層，太深了，這個網頁跑不動了。很可能是遞迴忘了寫終止條件。</div>`),{error:true,done:true},true)}
    else if(e===BRK||e===CNT)snap(null,(ENG()?`<div class="err">break / continue can only be used inside a loop.</div>`:`<div class="err">break / continue 只能用在迴圈裡面。</div>`),{error:true,done:true},true);
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
