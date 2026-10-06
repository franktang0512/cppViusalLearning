/* ================= 迷你 C++ 直譯器：把程式執行過程錄成一格一格的快照 ================= */
const SIZE={int:4,ll:8,double:8,char:1,bool:1,string:32};
const TNAME={int:"int",ll:"long long",double:"double",char:"char",bool:"bool",string:"string"};
const GARB={int:[32764,4199,-1294,21845,7,-86,1,6422,-17,327],ll:[140737488355,4198400],double:[6.95e-310],char:[0,64,8],bool:[0]};
const LIMIT=3000;
const BRK={brk:1},CNT={cnt:1},RET={ret:1},LIM={lim:1};
const KW=new Set(["int","long","double","float","char","bool","string","void","if","else","while","for","break","continue","return","true","false","const","using","namespace","unsigned"]);
const MATH={abs:1,max:2,min:2,round:1,floor:1,ceil:1,sqrt:1,pow:2};

function esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function cerr(pos,msg){return{compile:true,pos,msg}}
function unesc(c){return{n:"\n",t:"\t","0":"\0","\\":"\\","'":"'",'"':'"'}[c]??c}
function charLit(v){const c=v<0?v+256:v;if(c===10)return"'\\n'";if(c===0)return"'\\0'";if(c===32)return"' '";if(c<32||c===127)return`(${c})`;return`'${String.fromCharCode(c)}'`}
function fmtVal(t,v){
  if(t==="char")return charLit(v);
  if(t==="bool")return v?"true":"false";
  if(t==="string")return`"${v}"`;
  if(t==="double"){if(!isFinite(v))return String(v);if(Number.isInteger(v)&&Math.abs(v)<1e15)return v.toFixed(1);if(v!==0&&Math.abs(v)<1e-4)return v.toExponential(2);return String(+v.toPrecision(10))}
  return String(v);
}
function fmtDouble(x){
  if(isNaN(x))return"nan";if(!isFinite(x))return x>0?"inf":"-inf";if(x===0)return"0";
  const e=Math.floor(Math.log10(Math.abs(x)));
  if(e<-4||e>=6){let[m,ex]=x.toExponential(5).split("e");m=String(+m);const n=parseInt(ex,10);return m+"e"+(n<0?"-":"+")+String(Math.abs(n)).padStart(2,"0")}
  return String(+x.toPrecision(6));
}
function fmtOut(v){
  if(v.t==="double")return fmtDouble(v.v);
  if(v.t==="char"){const c=v.v<0?v.v+256:v.v;return String.fromCharCode(c)}
  return String(v.v);
}

/* ---------- 斷詞 ---------- */
function tokenize(src){
  const toks=[];let i=0;const n=src.length;
  const ops=["<<=",">>=","<<",">>","<=",">=","==","!=","&&","||","++","--","+=","-=","*=","/=","%=","::"];
  while(i<n){
    const c=src[i];
    if(/\s/.test(c)){i++;continue}
    if(c==="#"){while(i<n&&src[i]!=="\n")i++;continue}
    if(src.startsWith("//",i)){while(i<n&&src[i]!=="\n")i++;continue}
    if(src.startsWith("/*",i)){const j=src.indexOf("*/",i+2);i=j<0?n:j+2;continue}
    const st=i;
    if(/[0-9]/.test(c)||(c==="."&&/[0-9]/.test(src[i+1]||""))){
      while(i<n&&/[0-9.]/.test(src[i]))i++;
      if(/[eE]/.test(src[i]||"")&&/[0-9+-]/.test(src[i+1]||"")){i+=2;while(i<n&&/[0-9]/.test(src[i]))i++}
      while(i<n&&/[LlUu]/.test(src[i]))i++;
      toks.push({t:"num",v:src.slice(st,i),s:st,e:i});continue;
    }
    if(/[A-Za-z_]/.test(c)){while(i<n&&/[A-Za-z0-9_]/.test(src[i]))i++;const w=src.slice(st,i);toks.push({t:KW.has(w)?"kw":"id",v:w,s:st,e:i});continue}
    if(c==='"'){i++;let v="";while(i<n&&src[i]!=='"'&&src[i]!=="\n"){if(src[i]==="\\"){v+=unesc(src[i+1]);i+=2}else v+=src[i++]}
      if(src[i]!=='"')throw cerr(st,'字串少了結尾的雙引號 "');i++;toks.push({t:"str",v,s:st,e:i});continue}
    if(c==="'"){i++;let v;if(src[i]==="\\"){v=unesc(src[i+1]);i+=2}else v=src[i++];
      if(src[i]!=="'")throw cerr(st,"字元要用單引號包住「一個」字，例如 'A'；好幾個字要用雙引號");i++;toks.push({t:"chr",v:(v||"\0").charCodeAt(0),s:st,e:i});continue}
    let op=ops.find(o=>src.startsWith(o,i));
    if(!op&&"+-*/%<>=!(){}[];,&?:".includes(c))op=c;
    if(!op){
      if(c.charCodeAt(0)>127)throw cerr(st,`看不懂「${c}」。是不是打成全形符號了？程式碼裡的符號都要用半形。`);
      throw cerr(st,`看不懂的符號「${c}」`);
    }
    i+=op.length;toks.push({t:"op",v:op,s:st,e:i});
  }
  toks.push({t:"eof",v:"",s:n,e:n});return toks;
}

/* ---------- 語法分析 ---------- */
function parse(src){
  const T=tokenize(src);let p=0;
  const peek=(k=0)=>T[Math.min(p+k,T.length-1)],next=()=>T[p++];
  const is=(v,k=0)=>{const t=peek(k);return(t.t==="op"||t.t==="kw")&&t.v===v};
  const expect=(v,hint)=>{if(!is(v)){const t=peek();const at=hint==="semi"?T[p-1].e:t.s;throw cerr(at,hint==="semi"?"這行結尾好像少了分號 ;":`這裡應該要有「${v}」`)}return next()};
  const TYPES=["int","long","double","float","char","bool","string","const","unsigned"];
  const isType=(k=0)=>{const t=peek(k);return t.t==="kw"&&TYPES.includes(t.v)};
  function skipStd(){if(peek().t==="id"&&peek().v==="std"&&is("::",1))p+=2}
  function parseType(){
    while(is("const")||is("unsigned"))next();
    skipStd();const t=next();
    if(t.v==="long"){if(is("long"))next();if(is("int"))next();return"ll"}
    if(t.v==="float")return"double";
    if(!["int","double","char","bool","string"].includes(t.v))throw cerr(t.s,"這裡應該是型別，例如 int");
    return t.v;
  }
  function parseDecl(){
    const st=peek().s,type=parseType(),items=[];
    do{
      const id=next();if(id.t!=="id")throw cerr(id.s,"型別後面要接變數名稱");
      const it={name:id.v,s:id.s};
      if(is("[")){next();it.size=parseExpr();expect("]")}
      if(is("=")){next();
        if(is("{")){next();it.list=[];if(!is("}")){do{it.list.push(parseAssign())}while(is(",")&&next())}expect("}")}
        else it.init=parseAssign();
      }
      it.e=T[p-1].e;items.push(it);
    }while(is(",")&&next());
    return{k:"decl",type,items,s:st,e:T[p-1].e};
  }
  function parseBlock(){
    const o=expect("{");const body=[];
    while(!is("}")){if(peek().t==="eof")throw cerr(o.s,"這個 { 沒有對應的 }");body.push(parseStmt())}
    const c=next();return{k:"block",body,s:o.s,e:c.e,close:c.s};
  }
  function parseStmt(){
    const t=peek();
    if(is("{"))return parseBlock();
    if(is(";")){next();return{k:"empty",s:t.s,e:t.e}}
    if(is("if")){next();expect("(");const cond=parseExpr();expect(")");const then=parseStmt();let els=null;if(is("else")){next();els=parseStmt()}return{k:"if",cond,then,els,s:t.s,e:T[p-1].e}}
    if(is("while")){next();expect("(");const cond=parseExpr();expect(")");return{k:"while",cond,body:parseStmt(),s:t.s,e:t.e}}
    if(is("for")){next();const op=expect("(");let init=null;
      if(!is(";")){if(isType())init=parseDecl();else{const x=parseExpr();init={k:"expr",x,s:x.s,e:x.e}}}
      expect(";","semi");const cond=is(";")?null:parseExpr();expect(";","semi");const upd=is(")")?null:parseExpr();const cp=expect(")");
      return{k:"for",init,cond,upd,body:parseStmt(),s:t.s,e:cp.e}}
    if(is("break")||is("continue")){next();expect(";","semi");return{k:t.v,s:t.s,e:t.e}}
    if(is("return")){next();const x=is(";")?null:parseExpr();expect(";","semi");return{k:"return",x,s:t.s,e:T[p-1].e}}
    if(is("else"))throw cerr(t.s,"這個 else 找不到對應的 if。檢查上面的 if 是不是多了分號，或大括號沒配對");
    if(isType()){const d=parseDecl();expect(";","semi");return d}
    const x=parseExpr();expect(";","semi");return{k:"expr",x,s:x.s,e:x.e};
  }
  const parseExpr=()=>parseAssign();
  function parseAssign(){
    const l=parseOr();
    if(peek().t==="op"&&["=","+=","-=","*=","/=","%="].includes(peek().v)){
      const op=next().v;const r=parseAssign();
      if(!["var","idx"].includes(l.k))throw cerr(l.s,"等號左邊必須是變數");
      return{k:"assign",op,l,r,s:l.s,e:r.e};
    }
    return l;
  }
  const bin=(sub,ops)=>()=>{let l=sub();while(peek().t==="op"&&ops.includes(peek().v)){const op=next().v;const r=sub();l={k:"bin",op,l,r,s:l.s,e:r.e}}return l};
  const parseMul=bin(()=>parseUnary(),["*","/","%"]);
  const parseAdd=bin(parseMul,["+","-"]);
  function parseShift(){
    skipStd();const t=peek();
    if(t.t==="id"&&t.v==="cin"){next();
      if(is("<<"))throw cerr(peek().s,"cin 要用 >>（箭頭指向變數，資料流進變數裡）");
      const targets=[];while(is(">>")){const op=next();const x=parsePostfix();if(!["var","idx"].includes(x.k))throw cerr(x.s,"cin >> 後面要接變數");targets.push({x,s:op.s,e:x.e})}
      if(!targets.length)throw cerr(t.s,"cin 後面要接 >> 變數");return{k:"cin",targets,s:t.s,e:T[p-1].e}}
    if(t.t==="id"&&t.v==="cout"){next();
      if(is(">>"))throw cerr(peek().s,"cout 要用 <<（資料流向螢幕）");
      const items=[];while(is("<<")){next();skipStd();items.push(parseAdd())}
      if(!items.length)throw cerr(t.s,"cout 後面要接 << 要印的東西");return{k:"cout",items,s:t.s,e:T[p-1].e}}
    return parseAdd();
  }
  const parseRel=bin(parseShift,["<","<=",">",">="]);
  const parseEq=bin(parseRel,["==","!="]);
  const parseAnd=bin(parseEq,["&&"]);
  const parseOr=bin(parseAnd,["||"]);
  function parseUnary(){
    const t=peek();
    if(t.t==="op"&&["-","+","!"].includes(t.v)){next();const x=parseUnary();return{k:"un",op:t.v,x,s:t.s,e:x.e}}
    if(t.t==="op"&&(t.v==="++"||t.v==="--")){next();const x=parseUnary();return{k:"pre",op:t.v,x,s:t.s,e:x.e}}
    if(is("(")&&isType(1)){next();const ty=parseType();expect(")");const x=parseUnary();return{k:"cast",type:ty,x,s:t.s,e:x.e}}
    return parsePostfix();
  }
  function parsePostfix(){
    let x=parsePrimary();
    for(;;){
      if(is("[")){next();const i=parseExpr();const c=expect("]");x={k:"idx",a:x,i,s:x.s,e:c.e}}
      else if(is("++")||is("--")){const o=next();x={k:"post",op:o.v,x,s:x.s,e:o.e}}
      else break;
    }
    return x;
  }
  function parsePrimary(){
    skipStd();const t=next();
    if(t.t==="num"){const raw=t.v.replace(/[lLuU]/g,"");const isD=/[.eE]/.test(raw);
      if(isD)return{k:"lit",val:{t:"double",v:parseFloat(raw)},s:t.s,e:t.e};
      const v=parseInt(raw,10);return{k:"lit",val:{t:(/[lL]/.test(t.v)||v>2147483647)?"ll":"int",v},s:t.s,e:t.e}}
    if(t.t==="chr")return{k:"lit",val:{t:"char",v:t.v},s:t.s,e:t.e};
    if(t.t==="str")return{k:"str",v:t.v,s:t.s,e:t.e};
    if(t.t==="kw"&&(t.v==="true"||t.v==="false"))return{k:"lit",val:{t:"bool",v:t.v==="true"?1:0},s:t.s,e:t.e};
    if(t.t==="id"){
      if(t.v==="endl")return{k:"endl",s:t.s,e:t.e};
      if(is("(")){next();const args=[];if(!is(")")){do{args.push(parseAssign())}while(is(",")&&next())}const c=expect(")");
        if(!MATH[t.v])throw cerr(t.s,`這個網頁目前不支援函式 ${t.v}()`);
        return{k:"call",f:t.v,args,s:t.s,e:c.e}}
      return{k:"var",name:t.v,s:t.s,e:t.e};
    }
    if(t.t==="op"&&t.v==="("){const x=parseExpr();const c=expect(")");return{...x,s:t.s,e:c.e,paren:true}}
    if(t.t==="eof")throw cerr(t.s,"程式好像還沒寫完（少了 } 或 ;？）");
    throw cerr(t.s,`這裡不該出現「${t.v}」`);
  }
  const prog={globals:[],main:null};
  while(peek().t!=="eof"){
    if(is("using")){while(!is(";")&&peek().t!=="eof")next();expect(";","semi");continue}
    if(isType()||is("void")){
      const save=p;if(is("void"))next();else parseType();const nm=peek();
      if(nm.t==="id"&&is("(",1)){
        if(nm.v!=="main")throw cerr(nm.s,"這個網頁目前只支援 main 函式（自訂函式會在第 9 章出現）");
        next();expect("(");expect(")");prog.main=parseBlock();continue;
      }
      p=save;prog.globals.push(parseDecl());expect(";","semi");continue;
    }
    throw cerr(peek().s,`看不懂「${peek().v}」`);
  }
  if(!prog.main)throw cerr(0,"找不到 int main() { ... }");
  return prog;
}

/* ---------- 執行並錄下每一步 ---------- */
function run(prog,src,input){
  const starts=[0];for(let i=0;i<src.length;i++)if(src[i]==="\n")starts.push(i+1);
  const lineOf=off=>{let l=0;while(l+1<starts.length&&starts[l+1]<=off)l++;return l+1};
  const S={vars:[],scopes:[],out:"",inp:input||"",pos:0,fail:false,lastRead:null,addr:0x61fe00,gaddr:0x404040,gi:{},changed:new Set(),read:new Set(),notes:[],inCond:false,quiet:false,info:null,lastCout:""};
  const trace=[];let idc=0;
  const txt=n=>src.slice(n.s,n.e);
  const code=n=>`<code>${esc(txt(n))}</code>`;
  function snap(node,note,extra={},force){
    if(!force&&trace.length>=LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    trace.push({line:lineOf(node.s),span:[node.s,node.e],note:note+warn,
      vars:S.vars.map(v=>({...v,values:v.values.slice(),init:v.init.slice()})),
      out:S.out,pos:S.pos,fail:S.fail,lastRead:S.lastRead,changed:[...S.changed],read:[...S.read],...extra});
    S.changed.clear();S.read.clear();S.notes=[];S.lastRead=null;
  }
  const rterr=(node,msg,extra={})=>({rt:true,node,msg,...extra});
  const note=m=>{if(!S.quiet&&!S.notes.includes(m))S.notes.push(m)};

  function lookup(name,node){
    for(let i=S.scopes.length-1;i>=0;i--){const v=S.scopes[i].get(name);if(v)return v}
    if(name==="cin"||name==="cout")throw rterr(node,`${name} 必須寫在算式的最前面`);
    throw rterr(node,`變數 <code>${esc(name)}</code> 還沒有宣告就使用了（真正的 C++ 會出現編譯錯誤）。`);
  }
  function declare(type,name,len,node,global){
    const sc=S.scopes[S.scopes.length-1];
    if(sc.has(name))throw rterr(node,`<code>${esc(name)}</code> 在同一個區塊裡宣告了兩次（真正的 C++ 會編譯錯誤）。`);
    const n=len??1,sz=SIZE[type];
    const v={id:idc++,name,type,isArr:len!=null,len:n,addr:global?S.gaddr:S.addr,values:[],init:[],scope:global?"global":"main"};
    if(global)S.gaddr+=sz*n;else S.addr+=sz*n;
    const g=GARB[type];
    for(let i=0;i<n;i++){
      if(type==="string"){v.values.push("");v.init.push(true)}
      else if(global){v.values.push(0);v.init.push(true)}
      else{S.gi[type]=(S.gi[type]||0);v.values.push(g[S.gi[type]++%g.length]);v.init.push(false)}
    }
    sc.set(name,v);S.vars.push(v);return v;
  }
  function popScope(at,msg){
    const sc=S.scopes.pop();const freed=[...sc.values()];if(!freed.length)return;
    S.vars=S.vars.filter(v=>!freed.includes(v));
    S.addr=Math.min(S.addr,...freed.filter(v=>v.scope!=="global").map(v=>v.addr));
    if(at)snap(at,msg(freed.map(v=>`<code>${esc(v.name)}</code>`).join("、")));
  }
  function conv(type,val){
    let v=val.v;
    if(type==="string")return val.t==="string"?v:val.t==="char"?String.fromCharCode(v<0?v+256:v):String(v);
    if(val.t==="string")return 0;
    if(type==="double")return v;
    if(type==="bool")return v!==0?1:0;
    v=Math.trunc(v);
    if(type==="int"){const w=v|0;if(w!==v)note(`⚠ ${v} 超出 int 能存的範圍（−2147483648 ～ 2147483647），發生<b>溢位</b>，變成 ${w}。`);return w}
    if(type==="char")return(v<<24)>>24;
    return v;
  }
  const rank=t=>t==="double"?3:t==="ll"?2:1;
  const B=x=>({t:"bool",v:x?1:0});
  const truthy=v=>v.v!==0;
  function arith(op,a,b,node){
    if(a.t==="string"||b.t==="string"){
      if(op!=="+"||a.t!=="string"&&a.t!=="char"||b.t!=="string"&&b.t!=="char")throw rterr(node,"字串只能用 + 和字串（或字元）接起來。");
      const s=x=>x.t==="char"?String.fromCharCode(x.v):x.v;return{t:"string",v:s(a)+s(b)};
    }
    const t=Math.max(rank(a.t),rank(b.t))===3?"double":Math.max(rank(a.t),rank(b.t))===2?"ll":"int";
    const x=a.v,y=b.v;let r;
    if((op==="/"||op==="%")&&t!=="double"&&y===0)throw rterr(node,"除以 0！程式在這裡當掉了（Runtime Error）。");
    if(op==="%"&&t==="double")throw rterr(node,"% 只能用在整數上（真正的 C++ 會編譯錯誤）。");
    if(op==="+")r=x+y;else if(op==="-")r=x-y;else if(op==="*")r=x*y;
    else if(op==="/"){r=t==="double"?x/y:Math.trunc(x/y);if(t!=="double"&&x%y!==0)note(`ℹ ${x} / ${y}：兩邊都是整數 → <b>整數除法</b>，小數部分直接丟掉，得到 ${r}。`)}
    else r=x%y;
    if(t==="int"){const w=op==="*"?Math.imul(x,y):(r|0);if(w!==r){note(`⚠ ${x} ${op} ${y} = ${r} 超出 int 的範圍，發生<b>溢位</b>，結果變成 ${w}。`);r=w}}
    return{t,v:r};
  }
  function ref(n){
    if(n.k==="var"){const v=lookup(n.name,n);if(v.isArr)throw rterr(n,`<code>${esc(v.name)}</code> 是陣列，要用 ${esc(v.name)}[索引] 指定是哪一格。`);return{v,i:0,key:v.id+":0",label:v.name}}
    if(n.k==="idx"){
      if(n.a.k!=="var")throw rterr(n,"只支援「陣列名稱[索引]」的寫法");
      const v=lookup(n.a.name,n.a);if(!v.isArr)throw rterr(n,`<code>${esc(v.name)}</code> 不是陣列，不能用 []。`);
      const i=Math.trunc(ev(n.i).v);
      if(i<0||i>=v.len)throw rterr(n,`<b>陣列越界！</b><code>${esc(v.name)}</code> 只有 ${v.len} 格（${esc(v.name)}[0] ～ ${esc(v.name)}[${v.len-1}]），程式卻存取了 ${esc(v.name)}[${i}]。<br>真正的 C++ 不會提醒你：可能讀到別的變數的值、偷偷改掉別的變數，或直接當掉。`,{oob:{id:v.id,i}});
      return{v,i,key:v.id+":"+i,label:`${v.name}[${i}]`};
    }
    throw rterr(n,"這裡需要一個變數");
  }
  function load(r){
    if(!S.quiet){S.read.add(r.key);if(!r.v.init[r.i])note(`⚠ <code>${esc(r.label)}</code> 還沒給過值，讀到的是<b>垃圾值</b> ${fmtVal(r.v.type,r.v.values[r.i])}。`)}
    return{t:r.v.type,v:r.v.values[r.i]};
  }
  function store(r,val){r.v.values[r.i]=conv(r.v.type,val);r.v.init[r.i]=true;S.changed.add(r.key)}
  const IMPURE={impure:1};
  function ev(n){
    switch(n.k){
      case"lit":return n.val;
      case"str":return{t:"string",v:n.v};
      case"endl":throw rterr(n,"endl 只能放在 cout << 後面");
      case"var":case"idx":return load(ref(n));
      case"bin":{
        if(n.op==="&&"||n.op==="||"){
          const a=truthy(ev(n.l));
          if(n.op==="&&"&&!a){note(`ℹ <code>${esc(txt(n.l))}</code> 已經是 false，&& 右邊<b>不會執行</b>（短路求值）。`);return B(0)}
          if(n.op==="||"&&a){note(`ℹ <code>${esc(txt(n.l))}</code> 已經是 true，|| 右邊<b>不會執行</b>（短路求值）。`);return B(1)}
          return B(truthy(ev(n.r)));
        }
        const a=ev(n.l),b=ev(n.r);
        if(["<","<=",">",">=","==","!="].includes(n.op)){const x=a.v,y=b.v;return B({"<":x<y,"<=":x<=y,">":x>y,">=":x>=y,"==":x===y,"!=":x!==y}[n.op])}
        return arith(n.op,a,b,n);
      }
      case"un":{const a=ev(n.x);if(n.op==="!")return B(!truthy(a));const t=a.t==="double"?"double":a.t==="ll"?"ll":"int";return{t,v:n.op==="-"?-a.v:a.v}}
      case"cast":{const a=ev(n.x);return{t:n.type,v:conv(n.type,a)}}
      case"call":{const as=n.args.map(ev);
        if(as.length!==MATH[n.f])throw rterr(n,`${n.f} 需要 ${MATH[n.f]} 個參數`);
        if(as.some(a=>a.t==="string"))throw rterr(n,`${n.f} 不能用在字串上`);
        if(n.f==="abs")return{t:as[0].t,v:Math.abs(as[0].v)};
        if(n.f==="pow")return{t:"double",v:Math.pow(as[0].v,as[1].v)};
        if(MATH[n.f]===1)return{t:"double",v:{round:x=>Math.sign(x)*Math.round(Math.abs(x)),floor:Math.floor,ceil:Math.ceil,sqrt:Math.sqrt}[n.f](as[0].v)};
        const t=Math.max(rank(as[0].t),rank(as[1].t))===3?"double":Math.max(rank(as[0].t),rank(as[1].t))===2?"ll":as[0].t;
        return{t,v:n.f==="max"?Math.max(as[0].v,as[1].v):Math.min(as[0].v,as[1].v)}}
      case"pre":case"post":{
        if(S.quiet)throw IMPURE;
        const r=ref(n.x);const old=load(r);const nv=arith(n.op==="++"?"+":"-",old,{t:"int",v:1},n);store(r,nv);
        const now={t:r.v.type,v:r.v.values[r.i]};
        S.info={kind:"inc",label:r.label,op:n.op,old:fmtVal(r.v.type,old.v),now:fmtVal(r.v.type,now.v)};
        return n.k==="pre"?now:old;
      }
      case"assign":{
        if(S.quiet)throw IMPURE;
        const r=ref(n.l);const pre=subOf(n.r);const oldInit=r.v.init[r.i];const oldV=fmtVal(r.v.type,r.v.values[r.i]);
        let val=ev(n.r);const rv=fmtVal(val.t,val.v);
        if(n.op!=="="){const cur=load(r);val=arith(n.op[0],cur,val,n)}
        if(S.inCond&&n.op==="=")note(`⚠ 條件裡的 <code>=</code> 是「<b>指定</b>」，不是比較！<code>${esc(r.label)}</code> 被設成 ${fmtVal(r.v.type,conv(r.v.type,val))}。比較要用 <code>==</code>。`);
        store(r,val);
        S.info={kind:"assign",label:r.label,op:n.op,rk:n.r.k,text:txt(n.r),sub:pre,raw:fmtVal(val.t,val.v),rv,val:fmtVal(r.v.type,r.v.values[r.i]),old:oldV,oldInit};
        return{t:r.v.type,v:r.v.values[r.i]};
      }
      case"cin":if(S.quiet)throw IMPURE;return evCin(n);
      case"cout":if(S.quiet)throw IMPURE;return evCout(n);
    }
    throw rterr(n,"這個網頁還不支援這種寫法");
  }
  function subText(n){
    let s;
    switch(n.k){
      case"lit":s=n.val.t==="char"?charLit(n.val.v):n.val.t==="bool"?(n.val.v?"true":"false"):txt(n);break;
      case"var":{const v=lookup(n.name,n);s=v.isArr?v.name:fmtVal(v.type,v.values[0]);break}
      case"idx":{S.quiet=true;try{const r=ref(n);s=fmtVal(r.v.type,r.v.values[r.i])}catch(e){s=txt(n)}finally{S.quiet=false}break}
      case"bin":s=`${subText(n.l)} ${n.op} ${subText(n.r)}`;break;
      case"un":s=n.op+subText(n.x);break;
      case"cast":s=`(${TNAME[n.type]})${subText(n.x)}`;break;
      case"call":s=`${n.f}(${n.args.map(subText).join(", ")})`;break;
      default:throw IMPURE;
    }
    return n.paren?`(${s})`:s;
  }
  function subOf(n){try{return subText(n)}catch(e){return null}}
  function evCout(n){
    let s="";
    for(const it of n.items){if(it.k==="endl")s+="\n";else if(it.k==="str")s+=it.v;else s+=fmtOut(ev(it))}
    S.out+=s;S.lastCout=s;return B(1);
  }
  function evCin(n){
    let ok=true;
    for(const tg of n.targets){
      const r=ref(tg.x);const L=`<b>${esc(r.label)}</b>`;let msg;
      if(S.fail){ok=false;msg=`cin 之前已經失敗了，這次<b>什麼都不做</b>，${L} 保持原值。`}
      else{
        let p=S.pos;while(p<S.inp.length&&/\s/.test(S.inp[p]))p++;
        const skipped=p>S.pos;
        if(p>=S.inp.length){S.pos=p;S.fail=true;ok=false;msg=`輸入緩衝區已經沒有資料了（讀到結尾 <b>EOF</b>）→ 讀取失敗，${L} 保持原值。`}
        else if(r.v.type==="string"){const m=S.inp.slice(p).match(/^\S+/)[0];store(r,{t:"string",v:m});S.lastRead=[p,p+m.length];S.pos=p+m.length;msg=`${skipped?"跳過空白和換行，":""}string 一路讀到空白或換行為止：讀出「${esc(m)}」放進 ${L}。`}
        else if(r.v.type==="char"){store(r,{t:"char",v:S.inp.charCodeAt(p)});S.lastRead=[p,p+1];S.pos=p+1;msg=`${skipped?"跳過空白和換行，":""}char 只拿<b>一個字元</b>：讀出「${esc(S.inp[p])}」放進 ${L}。`}
        else{
          const rest=S.inp.slice(p);
          const m=r.v.type==="double"?rest.match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/):rest.match(/^[+-]?\d+/);
          if(!m){store(r,{t:"int",v:0});S.fail=true;ok=false;S.pos=p;msg=`讀到「${esc(S.inp[p])}」，不是數字 → <b>讀取失敗</b>，${L} 被設成 0。<br>從現在開始，所有的 cin 都會直接失敗。`}
          else{store(r,{t:r.v.type==="double"?"double":"ll",v:r.v.type==="double"?parseFloat(m[0]):parseInt(m[0],10)});S.lastRead=[p,p+m[0].length];S.pos=p+m[0].length;
            msg=`${skipped?"跳過前面的空白和換行，":""}讀出「${esc(m[0])}」，轉成數字放進 ${L}。`}
        }
      }
      snap(tg,msg);
    }
    return B(ok);
  }
  function condText(c,pre,t){
    if(c.k==="cin")return t?"cin 讀取<b>成功</b> → 條件成立":"cin 讀取<b>失敗</b> → 條件不成立";
    const raw=txt(c);const sub=pre&&pre!==raw?`：${esc(pre)}`:"";
    return `<code>${esc(raw)}</code>${sub} → <b>${t?"成立 (true)":"不成立 (false)"}</b>`;
  }
  function evCond(c){const pre=subOf(c);S.inCond=true;const v=ev(c);S.inCond=false;return{t:truthy(v),pre}}
  function vis(s){return`<span class="vis">${esc(s).replace(/ /g,"␣").replace(/\n/g,"↵").replace(/\t/g,"⇥")}</span>`}
  function exprNote(I){
    if(!I)return null;
    const L=`<b>${esc(I.label)}</b>`;
    if(I.kind==="inc")return`<code>${esc(I.label)}${I.op}</code>：${L} 從 ${I.old} 變成 ${I.now}。`;
    if(I.op!=="="){const o=I.op[0];return`<code>${esc(I.label)} ${I.op} ${esc(I.text)}</code> 就是 ${esc(I.label)} = ${esc(I.label)} ${o} ${esc(I.text)}：${I.old} ${o} ${I.rv} = ${I.val}。`}
    const over=I.oldInit&&I.old!==I.val?` 原本的 ${I.old} 被蓋掉了。`:"";
    const conv=I.raw!==I.val?`，存進 ${esc(I.label)} 變成 ${I.val}`:"";
    if(I.rk==="lit")return`把 ${I.val} 放進 ${L}。${over}`;
    if(I.rk==="var"||I.rk==="idx")return`把 <code>${esc(I.text)}</code> 的值 ${I.rv} 複製一份，放進 ${L}${conv}。${over}`;
    const sub=I.sub&&I.sub!==I.text?`${esc(I.sub)} = `:"";
    return`先算右邊 <code>${esc(I.text)}</code> → ${sub}${I.raw}${conv}，再放進 ${L}。${over}`;
  }
  function execExpr(x,prefix=""){
    if(x.k==="cin"){ev(x);return}
    if(x.k==="cout"){ev(x);snap(x,`${prefix}印到螢幕：${vis(S.lastCout)}`);return}
    S.info=null;ev(x);
    snap(x,prefix+(exprNote(S.info)||`計算 <code>${esc(txt(x))}</code>。`));
  }
  function execDecl(d,global){
    const parts=[];const T=TNAME[d.type],sz=SIZE[d.type];const B_=n=>`${n} byte${n>1?"s":""}`;
    for(const it of d.items){
      let len=null;
      if(it.size){len=Math.trunc(ev(it.size).v);if(len<=0)throw rterr(it,"陣列大小必須大於 0");if(len>200)throw rterr(it,"這個網頁最多只能顯示 200 格的陣列，請開小一點。")}
      const pre=it.init?subOf(it.init):null;const val=it.init?ev(it.init):null;
      const v=declare(d.type,it.name,len,it,global);const N=`<b>${esc(it.name)}</b>`;
      if(len!=null){
        if(it.list){
          if(it.list.length>len)throw rterr(it,`大括號裡有 ${it.list.length} 個值，但陣列只有 ${len} 格。`);
          for(let i=0;i<len;i++){v.values[i]=i<it.list.length?conv(d.type,ev(it.list[i])):0;v.init[i]=true;S.changed.add(v.id+":"+i)}
          parts.push(`宣告陣列 ${N}：連續 ${len} 格 ${T}，每格 ${B_(sz)}，共 ${B_(len*sz)}。`+(it.list.length<len?`大括號裡只給了 ${it.list.length} 個值，<b>剩下的格子自動補 0</b>。`:""));
        }else{
          for(let i=0;i<len;i++)S.changed.add(v.id+":"+i);
          parts.push(`宣告陣列 ${N}：連續 ${len} 格 ${T}，每格 ${B_(sz)}，共 ${B_(len*sz)}。`+(global?"全域陣列會<b>自動全部設成 0</b>。":"沒有初始化 → 每一格都是<b>垃圾值</b>。"));
        }
      }else if(val){
        store({v,i:0,key:v.id+":0"},val);const shown=fmtVal(d.type,v.values[0]);
        if(it.init.k==="lit")parts.push(`宣告 ${T} ${N}（${B_(sz)}），放進 ${shown}。`);
        else{const raw=fmtVal(val.t,val.v);const t=txt(it.init);
          parts.push(`宣告 ${T} ${N}：先算 <code>${esc(t)}</code> → ${pre&&pre!==t?esc(pre)+" = ":""}${raw}${raw!==shown?`，存成 ${T} 變成 ${shown}`:""}，放進 ${esc(it.name)}。`)}
      }else{
        S.changed.add(v.id+":0");
        parts.push(`宣告 ${T} ${N}：向記憶體借 ${B_(sz)} 的空間。`+(global?"全域變數自動設成 0。":"沒有給初始值 → 裡面是<b>垃圾值</b>。"));
      }
    }
    snap(d,parts.join("<br>"));
  }
  function loopBody(body){try{exec(body)}catch(e){if(e===BRK)return"brk";if(e===CNT)return"cnt";throw e}return""}
  function exec(st){
    switch(st.k){
      case"block":{
        S.scopes.push(new Map());
        try{for(const s of st.body)exec(s)}
        catch(e){if(e===BRK||e===CNT)popScope({s:st.close,e:st.close+1},n=>`離開大括號，${n} 的空間被收回。`);else S.scopes.pop();throw e}
        popScope({s:st.close,e:st.close+1},n=>`離開大括號，${n} 的空間被收回，之後就不能再用了。`);return;
      }
      case"empty":return;
      case"decl":execDecl(st,false);return;
      case"expr":execExpr(st.x);return;
      case"if":{
        const{t,pre}=evCond(st.cond);
        snap(st.cond,`判斷 ${condText(st.cond,pre,t)}，`+(t?"執行 if 裡面的程式。":st.els?"執行 else 的部分。":"跳過 if 的內容。"));
        if(t)exec(st.then);else if(st.els)exec(st.els);return;
      }
      case"while":{
        let round=0;
        for(;;){const{t,pre}=evCond(st.cond);
          snap(st.cond,`檢查 ${condText(st.cond,pre,t)}，`+(t?`進入迴圈（第 ${++round} 輪）。`:"<b>離開迴圈</b>。"));
          if(!t)break;if(loopBody(st.body)==="brk")break}
        return;
      }
      case"for":{
        S.scopes.push(new Map());let round=0;
        try{
          if(st.init){if(st.init.k==="decl")execDecl(st.init,false);else execExpr(st.init.x,"初始化（只做一次）：")}
          for(;;){
            if(st.cond){const{t,pre}=evCond(st.cond);snap(st.cond,`檢查 ${condText(st.cond,pre,t)}，`+(t?`進入迴圈（第 ${++round} 輪）。`:"<b>離開迴圈</b>。"));if(!t)break}
            if(loopBody(st.body)==="brk")break;
            if(st.upd)execExpr(st.upd,"更新：");
          }
        }catch(e){S.scopes.pop();throw e}
        popScope({s:st.s,e:st.e},n=>`for 迴圈結束，${n} 的空間被收回（它只活在這個 for 迴圈裡）。`);return;
      }
      case"break":snap(st,"<code>break</code>：立刻跳出最近的那一層迴圈。");throw BRK;
      case"continue":snap(st,"<code>continue</code>：這一輪剩下的不做了，直接進入下一輪（for 迴圈會先做「更新」）。");throw CNT;
      case"return":if(st.x)ev(st.x);snap(st,"<code>return 0</code>：main 結束，程式結束。");throw RET;
    }
  }
  try{
    S.scopes.push(new Map());
    for(const g of prog.globals)execDecl(g,true);
    S.scopes.push(new Map());
    for(const s of prog.main.body)exec(s);
    snap({s:prog.main.close,e:prog.main.close+1},"main 執行到最後，程式結束。");
    trace[trace.length-1].done=true;
  }catch(e){
    if(e===RET)trace[trace.length-1].done=true;
    else if(e&&e.rt){S.notes=[];snap(e.node,`<div class="err">💥 ${e.msg}</div>`,{error:true,done:true,oob:e.oob||null},true)}
    else if(e===LIM)snap({s:0,e:0},`<div class="err">已經執行超過 ${LIMIT} 步，先停下來了。很可能是<b>無窮迴圈</b>：檢查迴圈的條件有沒有機會變成 false。</div>`,{error:true,done:true,line:0},true);
    else if(e===BRK||e===CNT)snap({s:0,e:0},`<div class="err">break / continue 只能用在迴圈裡面。</div>`,{error:true,done:true},true);
    else throw e;
  }
  return trace;
}
function compileAndRun(src,input){
  let prog;
  try{prog=parse(src)}catch(e){if(e.compile){const line=src.slice(0,e.pos).split("\n").length;return{error:{line,msg:e.msg},trace:[]}}throw e}
  return{trace:run(prog,src,input)};
}


