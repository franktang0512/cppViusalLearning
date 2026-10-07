/* ================= 迷你 C++ 直譯器：把程式執行過程錄成一格一格的快照 ================= */
const SIZE={int:4,ll:8,double:8,char:1,bool:1,string:32,stack:48,ptr:8};
const TNAME={int:"int",ll:"long long",double:"double",char:"char",bool:"bool",string:"string",stack:"stack",ptr:"指標"};
const GARB={int:[32764,4199,-1294,21845,7,-86,1,6422,-17,327],ll:[140737488355,4198400],double:[6.95e-310],char:[-52,113,-91,64,7],bool:[0]};
const LIMIT=3000;
const BRK={brk:1},CNT={cnt:1},RET={ret:1},LIM={lim:1};
const KW=new Set(["int","long","double","float","char","bool","string","stack","void","if","else","while","for","break","continue","return","true","false","const","using","namespace","unsigned"]);
const MATH={abs:1,max:2,min:2,round:1,floor:1,ceil:1,sqrt:1,pow:2,strlen:1};

function esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function cerr(pos,msg){return{compile:true,pos,msg}}
function unesc(c){return{n:"\n",t:"\t","0":"\0","\\":"\\","'":"'",'"':'"'}[c]??c}
function charLit(v){const c=v<0?v+256:v;if(c===10)return"'\\n'";if(c===0)return"'\\0'";if(c===32)return"' '";if(c<32||c===127)return`(${c})`;return`'${String.fromCharCode(c)}'`}
function fmtVal(t,v){
  if(t==="char")return charLit(v);
  if(t==="bool")return v?"true":"false";
  if(t==="string")return`"${v}"`;
  if(t==="stack")return`[${v.join(", ")}]`;
  if(t==="ptr")return v===null?"nullptr":"0x"+v.addr.toString(16);
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
  if(v.t==="ptr")return v.v===null?"0":"0x"+v.v.addr.toString(16);
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
    if(!op&&"+-*/%<>=!(){}[];,&?:.".includes(c))op=c;
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
  const TYPES=["int","long","double","float","char","bool","string","stack","const","unsigned"];
  const isType=(k=0)=>{const t=peek(k);return t.t==="kw"&&TYPES.includes(t.v)};
  function skipStd(){if(peek().t==="id"&&peek().v==="std"&&is("::",1))p+=2}
  function parseType(){
    while(is("const")||is("unsigned"))next();
    skipStd();const t=next();
    if(t.v==="long"){if(is("long"))next();if(is("int"))next();return"ll"}
    if(t.v==="float")return"double";
    if(t.v==="stack"){expect("<");lastElem=parseType();if(lastElem==="stack")throw cerr(t.s,"這個網頁還不支援 stack 裡面再放 stack");expect(">");return"stack"}
    if(!["int","double","char","bool","string"].includes(t.v))throw cerr(t.s,"這裡應該是型別，例如 int");
    return t.v;
  }
  let lastElem=null;
  function parseDecl(){
    const st=peek().s,type=parseType(),elem=type==="stack"?lastElem:null,items=[];
    do{
      let ref=false;if(is("&")){next();ref=true}
      let ptr=false;while(is("*")){next();if(ptr)throw cerr(peek().s,"這個網頁還不支援指標的指標（**）");ptr=true}
      const id=next();if(id.t!=="id")throw cerr(id.s,"型別後面要接變數名稱");
      const it={name:id.v,s:id.s,ptr,ref};
      if(ref&&!is("="))throw cerr(id.s,`參考（別名）宣告時一定要綁定一個變數，例如 int &${id.v} = a;`);
      if(is("[")){next();if(is("]"))it.auto=true;else it.size=parseExpr();expect("]")}
      if(is("=")){next();
        if(is("{")){next();it.list=[];if(!is("}")){do{it.list.push(parseAssign())}while(is(",")&&next())}expect("}")}
        else it.init=parseAssign();
      }
      it.e=T[p-1].e;items.push(it);
    }while(is(",")&&next());
    if(type==="stack"&&items.some(it=>it.size||it.auto||it.init||it.list))throw cerr(st,"stack 宣告時不用給大小或初始值，例如 stack<int> st;");
    return{k:"decl",type,elem,items,s:st,e:T[p-1].e};
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
      if(!["var","idx","deref"].includes(l.k))throw cerr(l.s,"等號左邊必須是變數");
      return{k:"assign",op,l,r,s:l.s,e:r.e};
    }
    return l;
  }
  const bin=(sub,ops)=>()=>{let l=sub();while(peek().t==="op"&&ops.includes(peek().v)){const op=next().v;const r=sub();l={k:"bin",op,l,r,s:l.s,e:r.e}}return l};
  const parseMul=bin(()=>parseUnary(),["*","/","%"]);
  const parseAdd=bin(parseMul,["+","-"]);
  function parseShift(){
    skipStd();const t=peek();
    if(t.t==="id"&&t.v==="cin"&&!is(".",1)){next();
      if(is("<<"))throw cerr(peek().s,"cin 要用 >>（箭頭指向變數，資料流進變數裡）");
      const targets=[];while(is(">>")){const op=next();const x=parseUnary();if(!["var","idx","deref"].includes(x.k))throw cerr(x.s,"cin >> 後面要接變數");targets.push({x,s:op.s,e:x.e})}
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
    if(t.t==="op"&&t.v==="*"){next();const x=parseUnary();return{k:"deref",x,s:t.s,e:x.e}}
    if(t.t==="op"&&t.v==="&"){next();const x=parseUnary();if(!["var","idx","deref"].includes(x.k))throw cerr(x.s,"& 後面要接變數，例如 &a");return{k:"addr",x,s:t.s,e:x.e}}
    if(t.t==="op"&&(t.v==="++"||t.v==="--")){next();const x=parseUnary();return{k:"pre",op:t.v,x,s:t.s,e:x.e}}
    if(is("(")&&isType(1)){next();const ty=parseType();expect(")");const x=parseUnary();return{k:"cast",type:ty,x,s:t.s,e:x.e}}
    return parsePostfix();
  }
  function parsePostfix(){
    let x=parsePrimary();
    for(;;){
      if(is("[")){next();const i=parseExpr();const c=expect("]");x={k:"idx",a:x,i,s:x.s,e:c.e}}
      else if(is("++")||is("--")){const o=next();x={k:"post",op:o.v,x,s:x.s,e:o.e}}
      else if(is(".")){next();const m=next();if(m.t!=="id")throw cerr(m.s,"點後面要接名稱，例如 s.length()");
        expect("(");const args=[];if(!is(")")){do{args.push(parseAssign())}while(is(",")&&next())}const c=expect(")");
        x={k:"method",obj:x,name:m.v,args,s:x.s,e:c.e}}
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
      if(t.v==="nullptr"||t.v==="NULL")return{k:"lit",val:{t:"ptr",v:null},s:t.s,e:t.e};
      if(t.v==="getline"&&is("(")){next();skipStd();const c0=next();
        if(c0.v!=="cin")throw cerr(c0.s,"getline 的寫法是 getline(cin, 變數)");
        expect(",");const x=parsePostfix();if(!["var","idx"].includes(x.k))throw cerr(x.s,"getline 的第二個參數要是 string 變數");
        const c=expect(")");return{k:"getline",x,s:t.s,e:c.e}}
      if(is("(")){next();const args=[];if(!is(")")){do{args.push(parseAssign())}while(is(",")&&next())}const c=expect(")");
        if(!MATH[t.v]){calls.push({f:t.v,s:t.s});return{k:"ucall",f:t.v,args,s:t.s,e:c.e}}
        return{k:"call",f:t.v,args,s:t.s,e:c.e}}
      return{k:"var",name:t.v,s:t.s,e:t.e};
    }
    if(t.t==="op"&&t.v==="("){const x=parseExpr();const c=expect(")");return{...x,s:t.s,e:c.e,paren:true}}
    if(t.t==="eof")throw cerr(t.s,"程式好像還沒寫完（少了 } 或 ;？）");
    throw cerr(t.s,`這裡不該出現「${t.v}」`);
  }
  function parseParams(){
    const ps=[];if(is(")"))return ps;
    if(is("void")&&is(")",1)){next();return ps}
    do{
      const st=peek().s,base=parseType();let ref=false,arr=false,ptr=false;
      while(is("*")){next();ptr=true}
      const type=ptr?"ptr":base,elem=ptr?base:null;
      if(is("&")){next();ref=true}
      const id=next();if(id.t!=="id")throw cerr(id.s,"參數的型別後面要接名稱，例如 int a");
      if(is("[")){next();if(!is("]"))parseExpr();expect("]");arr=true}
      if(ref&&arr)throw cerr(st,"陣列參數不用加 &，本來就是同一塊記憶體");
      let def=null;
      if(is("=")){const eq=next();if(ref||arr)throw cerr(eq.s,"傳參考和陣列參數不能有預設值");def=parseAssign()}
      if(ptr&&(ref||arr))throw cerr(st,"這個網頁還不支援這種指標參數");
      ps.push({type,elem,name:id.v,ref,arr,def,s:st});
    }while(is(",")&&next());
    let seenDef=false;
    for(const pm of ps){if(pm.def)seenDef=true;else if(seenDef)throw cerr(pm.s,`有預設值的參數要放在後面：${pm.name} 前面的參數有預設值，所以 ${pm.name} 也要有預設值，或把有預設值的參數移到 ${pm.name} 後面。（呼叫時傳進去的值是從左邊開始對上參數的，前面的參數有預設值、後面的卻沒有，就對不起來了。）`)}
    return ps;
  }
  const prog={globals:[],main:null,funcs:{}};
  let calls=[];const known=new Set(),protos={},late=[];
  while(peek().t!=="eof"){
    if(is("using")){while(!is(";")&&peek().t!=="eof")next();expect(";","semi");continue}
    if(isType()||is("void")){
      const save=p;let ret="void",retElem=null;if(is("void"))next();else ret=parseType();
      if(ret!=="void"&&is("*")&&peek(1).t==="id"&&is("(",2)){next();retElem=ret;ret="ptr"}
      const nm=peek();
      if(nm.t==="id"&&is("(",1)){
        next();expect("(");const params=parseParams();expect(")");
        if(is(";")){next();known.add(nm.v);protos[nm.v]=params;continue}  // 只有宣告（函式原型），定義在後面
        const pr=protos[nm.v];
        if(pr){
          if(pr.length!==params.length)throw cerr(nm.s,`${nm.v}() 的參數個數跟上面的宣告不一樣`);
          params.forEach((pm,i)=>{if(pm.def&&pr[i].def)throw cerr(pm.s,`預設值只要寫一次：上面的宣告已經寫了，這裡不要再寫`);if(!pm.def)pm.def=pr[i].def});
        }
        known.add(nm.v);calls=[];
        const body=parseBlock();
        for(const c of calls)if(!known.has(c.f))late.push(c);
        if(nm.v==="main"){prog.main=body;continue}
        if(prog.funcs[nm.v])throw cerr(nm.s,`函式 ${nm.v}() 定義了兩次`);
        if(MATH[nm.v]||nm.v==="getline")throw cerr(nm.s,`${nm.v} 是內建的名字，請換一個函式名稱`);
        prog.funcs[nm.v]={name:nm.v,ret,retElem,params,body,s:nm.s};continue;
      }
      p=save;prog.globals.push(parseDecl());expect(";","semi");continue;
    }
    throw cerr(peek().s,`看不懂「${peek().v}」`);
  }
  for(const c of late)throw cerr(c.s,prog.funcs[c.f]
    ?`要先宣告才能呼叫：${c.f}() 寫在呼叫它的地方後面。把整個 ${c.f} 函式搬到上面，或在上面先寫一行函式原型（例如 int ${c.f}(int n);）。`
    :`找不到函式 ${c.f}()。是不是名字打錯了，或還沒寫這個函式？`);
  if(!prog.main)throw cerr(0,"找不到 int main() { ... }");
  return prog;
}

/* ---------- 執行並錄下每一步 ---------- */
function run(prog,src,input){
  const starts=[0];for(let i=0;i<src.length;i++)if(src[i]==="\n")starts.push(i+1);
  const lineOf=off=>{let l=0;while(l+1<starts.length&&starts[l+1]<=off)l++;return l+1};
  const S={frames:[{key:"main",label:"main"}],refs:[],vars:[],scopes:[],out:"",inp:input||"",pos:0,fail:false,lastRead:null,addr:0x61fe00,gaddr:0x404040,gi:{},changed:new Set(),read:new Set(),notes:[],inCond:false,quiet:false,info:null,lastCout:""};
  const trace=[];let idc=0,fid=0;
  const txt=n=>src.slice(n.s,n.e);
  const code=n=>`<code>${esc(txt(n))}</code>`;
  function snap(node,note,extra={},force){
    if(!force&&trace.length>=LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    trace.push({line:lineOf(node.s),span:[node.s,node.e],note:note+warn,
      vars:S.vars.map(v=>({...v,values:v.values.map(x=>Array.isArray(x)?x.slice():x),init:v.init.slice()})),
      out:S.out,pos:S.pos,fail:S.fail,lastRead:S.lastRead,changed:[...S.changed],read:[...S.read],
      frames:S.frames.map(f=>({key:f.key,label:f.label})),refs:S.refs.map(({sc,...r})=>r),...extra});
    S.changed.clear();S.read.clear();S.notes=[];S.lastRead=null;
  }
  const rterr=(node,msg,extra={})=>({rt:true,node,msg,...extra});
  const note=m=>{if(!S.quiet&&!S.notes.includes(m))S.notes.push(m)};

  function lookup(name,node){
    for(let i=S.scopes.length-1;i>=0;i--){const v=S.scopes[i].get(name);if(v)return v}
    if(name==="cin"||name==="cout")throw rterr(node,`${name} 必須寫在算式的最前面`);
    throw rterr(node,`變數 <code>${esc(name)}</code> 還沒有宣告就使用了（真正的 C++ 會出現編譯錯誤）。`);
  }
  let declElem=null;
  function declare(type,name,len,node,global){
    const sc=S.scopes[S.scopes.length-1];
    if(sc.has(name))throw rterr(node,`<code>${esc(name)}</code> 在同一個區塊裡宣告了兩次（真正的 C++ 會編譯錯誤）。`);
    const n=len??1,sz=SIZE[type];
    const v={id:idc++,name,type,elem:declElem,isArr:len!=null,len:n,addr:global?S.gaddr:S.addr,values:[],init:[],scope:global?"global":S.frames[S.frames.length-1].key};
    if(global)S.gaddr+=sz*n;else S.addr+=sz*n;
    const g=GARB[type];
    for(let i=0;i<n;i++){
      if(type==="string"){v.values.push("");v.init.push(true)}
      else if(type==="ptr"){if(global){v.values.push(null);v.init.push(true)}else{v.values.push({id:-1,i:0,addr:0x7ff3a8+(idc*16)%4096,sz:4});v.init.push(false)}}
      else if(type==="stack"){v.values.push([]);v.init.push(true)}
      else if(global){v.values.push(0);v.init.push(true)}
      else{S.gi[type]=(S.gi[type]||0);v.values.push(g[S.gi[type]++%g.length]);v.init.push(false)}
    }
    sc.set(name,v);S.vars.push(v);return v;
  }
  function popScope(at,msg){
    const sc=S.scopes.pop();
    if(sc.aliases)S.refs=S.refs.filter(r=>r.sc!==sc);
    const freed=[...sc.entries()].filter(([k])=>!(sc.aliases&&sc.aliases.has(k))).map(([,v])=>v);if(!freed.length)return;
    S.vars=S.vars.filter(v=>!freed.includes(v));
    S.addr=Math.min(S.addr,...freed.filter(v=>v.scope!=="global").map(v=>v.addr));
    if(at)snap(at,msg(freed.map(v=>`<code>${esc(v.name)}</code>`).join("、")));
  }
  function conv(type,val){
    let v=val.v;
    if(type==="string")return val.t==="string"?v:val.t==="char"?String.fromCharCode(v<0?v+256:v):String(v);
    if(type==="ptr")return val.t==="ptr"?val.v:null;
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
  const truthy=v=>v.t==="ptr"?v.v!==null:v.v!==0;
  const ptrTo=(v,i)=>({id:v.id,i,addr:v.addr+i*SIZE[v.type],sz:SIZE[v.type]});
  const pval=(v,i)=>({t:"ptr",v:ptrTo(v,i),elem:v.type});
  function targetLabel(pv){if(pv===null)return"（不指向任何東西）";const v=S.vars.find(x=>x.id===pv.id);return v?(v.isArr?`${v.name}[${pv.i}]`:v.name):"（已經被收回的變數）"}
  function derefRef(pv,node,name){
    const N=`<code>${esc(name)}</code>`;
    if(pv===null)throw rterr(node,`${N} 是 <b>nullptr</b>，沒有指向任何東西，不能用 * 去拿值。`);
    if(pv.id<0)throw rterr(node,`${N} 還沒有給值，裡面是亂七八糟的位址（<b>野指標</b>）。用 * 去讀寫它，真正的 C++ 可能改到別人的記憶體或當掉。<br>先寫 ${esc(name)} = &amp;變數; 讓它指向一個變數。`);
    const v=S.vars.find(x=>x.id===pv.id);
    if(!v)throw rterr(node,`${N} 指向的變數已經被收回了（<b>懸空指標</b>），不能再用。`);
    if(pv.i<0||pv.i>=v.len)throw rterr(node,`<b>指標超出範圍！</b>${N} 指到了 ${esc(v.name)}[${pv.i}]，可是 ${esc(v.name)} 只有 ${v.len} 格。`,{oob:v.isArr?{id:v.id,i:pv.i}:null});
    return{v,i:pv.i,key:v.id+":"+pv.i,label:v.isArr?`${v.name}[${pv.i}]`:v.name};
  }
  function arith(op,a,b,node){
    if(a.t==="ptr"||b.t==="ptr"){
      if(op==="-"&&a.t==="ptr"&&b.t==="ptr"){if(!a.v||!b.v||a.v.id!==b.v.id)throw rterr(node,"只有指向同一個陣列的兩個指標可以相減");return{t:"int",v:a.v.i-b.v.i}}
      const P=a.t==="ptr"?a:b,k=a.t==="ptr"?b.v:a.v;
      if((op!=="+"&&op!=="-")||(op==="-"&&b.t==="ptr")||typeof k!=="number")throw rterr(node,"指標只能加減一個整數（往後或往前移幾格）");
      if(P.v===null||P.v.id<0)throw rterr(node,"這個指標沒有指向任何變數，不能加減");
      const d=op==="+"?k:-k;
      return{t:"ptr",v:{...P.v,i:P.v.i+d,addr:P.v.addr+d*P.v.sz},elem:P.elem};
    }
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
    if(n.k==="deref"){
      const pv=ev(n.x);if(pv.t!=="ptr")throw rterr(n,`* 只能用在指標上，<code>${esc(txt(n.x))}</code> 不是指標。`);
      const r=derefRef(pv.v,n,txt(n.x));
      if(!S.quiet)note(`ℹ <code>*${esc(txt(n.x))}</code>：到 ${esc(txt(n.x))} 存的位址 ${fmtVal("ptr",pv.v)} 去，也就是 <b>${esc(r.label)}</b>。`);
      return r;
    }
    if(n.k==="var"){const v=lookup(n.name,n);if(v.isArr)throw rterr(n,`<code>${esc(v.name)}</code> 是陣列，要用 ${esc(v.name)}[索引] 指定是哪一格。`);return{v,i:0,key:v.id+":0",label:v.name}}
    if(n.k==="idx"){
      if(n.a.k!=="var")throw rterr(n,"只支援「陣列名稱[索引]」的寫法");
      const v=lookup(n.a.name,n.a);
      if(v.type==="ptr"&&!v.isArr){
        const base=load({v,i:0,key:v.id+":0",label:v.name}).v,k=Math.trunc(ev(n.i).v);
        if(base===null||base.id<0)return derefRef(base,n,v.name);
        return derefRef({...base,i:base.i+k,addr:base.addr+k*base.sz},n,`${v.name}[${k}]`);
      }
      if(v.type==="string"&&!v.isArr){
        const i=Math.trunc(ev(n.i).v),str=v.values[0],N=esc(v.name);
        if(i<0||i>str.length)throw rterr(n,`<b>字串越界！</b><code>${N}</code> 的長度是 ${str.length}（${N}[0] ～ ${N}[${str.length-1}]），程式卻存取了 ${N}[${i}]。<br>真正的 C++ 不會提醒你，可能讀到奇怪的值或直接當掉。`);
        return{v,i:0,si:i,str:true,node:n,key:v.id+":c"+i,label:`${v.name}[${i}]`};
      }
      if(!v.isArr)throw rterr(n,`<code>${esc(v.name)}</code> 不是陣列，不能用 []。`);
      const i=Math.trunc(ev(n.i).v);
      if(i<0||i>=v.len)throw rterr(n,`<b>陣列越界！</b><code>${esc(v.name)}</code> 只有 ${v.len} 格（${esc(v.name)}[0] ～ ${esc(v.name)}[${v.len-1}]），程式卻存取了 ${esc(v.name)}[${i}]。<br>真正的 C++ 不會提醒你：可能讀到別的變數的值、偷偷改掉別的變數，或直接當掉。`,{oob:{id:v.id,i}});
      return{v,i,key:v.id+":"+i,label:`${v.name}[${i}]`};
    }
    throw rterr(n,"這裡需要一個變數");
  }
  // 讀一個位置目前的值（不算「讀取」，畫面不會標藍框）
  const peekv=r=>r.str?{t:"char",v:r.v.values[0].charCodeAt(r.si)||0}:{t:r.v.type,v:r.v.values[r.i]};
  function load(r){
    if(r.str){
      if(!S.quiet){S.read.add(r.key);if(r.si===r.v.values[0].length)note(`ℹ <code>${esc(r.label)}</code> 剛好是字串的結尾，讀到的是 <b>'\\0'</b>（數值 0）。`)}
      return peekv(r);
    }
    if(!S.quiet){S.read.add(r.key);if(!r.v.init[r.i])note(`⚠ <code>${esc(r.label)}</code> 還沒給過值，讀到的是<b>垃圾值</b> ${fmtVal(r.v.type,r.v.values[r.i])}。`)}
    return{t:r.v.type,v:r.v.values[r.i]};
  }
  function store(r,val){
    if(r.str){
      const str=r.v.values[0];
      if(r.si>=str.length)throw rterr(r.node,`<b>字串越界！</b>${esc(r.v.name)} 的長度是 ${str.length}，不能改 ${esc(r.label)}。要讓字串變長，請用 + 接上去。`);
      const c=conv("char",val);r.v.values[0]=str.slice(0,r.si)+String.fromCharCode(c<0?c+256:c)+str.slice(r.si+1);S.changed.add(r.key);return;
    }
    r.v.values[r.i]=conv(r.v.type,val);r.v.init[r.i]=true;S.changed.add(r.key);
  }
  // char 陣列：從第 0 格讀到 '\0' 為止
  function charArrText(v,node){
    let i=0,t="";
    while(i<v.len&&v.values[i]!==0){if(!S.quiet)S.read.add(v.id+":"+i);const c=v.values[i];t+=String.fromCharCode(c<0?c+256:c);i++}
    if(i<v.len){if(!S.quiet)S.read.add(v.id+":"+i)}
    else note(`⚠ <code>${esc(v.name)}</code> 裡面找不到 <b>'\\0'</b>！真正的 C++ 會繼續印出陣列後面的記憶體，直到碰巧遇到 0 為止。`);
    return t;
  }
  const charArr=n=>{if(n.k!=="var")return null;let v=null;for(let i=S.scopes.length-1;i>=0&&!v;i--)v=S.scopes[i].get(n.name)||null;return v&&v.isArr&&v.type==="char"?v:null};
  const IMPURE={impure:1};
  function ev(n){
    switch(n.k){
      case"lit":return n.val;
      case"str":return{t:"string",v:n.v};
      case"endl":throw rterr(n,"endl 只能放在 cout << 後面");
      case"var":{const v=lookup(n.name,n);if(v.isArr){if(!S.quiet)S.read.add(v.id+":0");return pval(v,0)}return load(ref(n))}
      case"idx":case"deref":return load(ref(n));
      case"addr":{
        if(n.x.k==="var"){const v=lookup(n.x.name,n.x);if(v.isArr)return pval(v,0)}
        const r=ref(n.x);if(r.str)throw rterr(n,"這個網頁還不支援取 string 裡某個字元的位址");
        return pval(r.v,r.i);
      }
      case"bin":{
        if(n.op==="&&"||n.op==="||"){
          const a=truthy(ev(n.l));
          if(n.op==="&&"&&!a){note(`ℹ <code>${esc(txt(n.l))}</code> 已經是 false，&& 右邊<b>不會執行</b>（短路求值）。`);return B(0)}
          if(n.op==="||"&&a){note(`ℹ <code>${esc(txt(n.l))}</code> 已經是 true，|| 右邊<b>不會執行</b>（短路求值）。`);return B(1)}
          return B(truthy(ev(n.r)));
        }
        const a=ev(n.l),b=ev(n.r);
        const num=q=>q.t==="ptr"?(q.v===null?0:q.v.addr):q.v;
        if(["<","<=",">",">=","==","!="].includes(n.op)){const x=num(a),y=num(b);return B({"<":x<y,"<=":x<=y,">":x>y,">=":x>=y,"==":x===y,"!=":x!==y}[n.op])}
        return arith(n.op,a,b,n);
      }
      case"un":{const a=ev(n.x);if(n.op==="!")return B(!truthy(a));const t=a.t==="double"?"double":a.t==="ll"?"ll":"int";return{t,v:n.op==="-"?-a.v:a.v}}
      case"cast":{const a=ev(n.x);return{t:n.type,v:conv(n.type,a)}}
      case"ucall":return callFn(n);
      case"call":{
        if(n.f==="strlen"){const v=n.args.length===1?charArr(n.args[0]):null;if(!v)throw rterr(n,"strlen( ) 裡面要放 char 陣列，例如 strlen(s)");
          let i=0;while(i<v.len&&v.values[i]!==0){if(!S.quiet)S.read.add(v.id+":"+i);i++}return{t:"int",v:i}}
        const as=n.args.map(ev);
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
        const now=peekv(r);
        S.info={kind:"inc",label:r.label,op:n.op,old:fmtVal(old.t,old.v),now:fmtVal(now.t,now.v)};
        return n.k==="pre"?now:old;
      }
      case"assign":{
        if(S.quiet)throw IMPURE;
        const r=ref(n.l);const pre=subOf(n.r);const oldInit=r.v.init[r.i];const o0=peekv(r),oldV=fmtVal(o0.t,o0.v);
        let val=ev(n.r);const rv=fmtVal(val.t,val.v);
        if(r.v.type==="ptr"&&!r.str&&n.op==="="&&val.t!=="ptr"&&!(val.v===0&&val.t==="int"))throw rterr(n,`<code>${esc(r.label)}</code> 是指標，只能放「位址」（例如 &amp;a）或 nullptr。`);
        if(val.t==="ptr"&&r.v.type!=="ptr")throw rterr(n,`<code>${esc(txt(n.r))}</code> 是位址，不能放進 ${TNAME[r.v.type]} 變數 <code>${esc(r.label)}</code>。是不是忘了加 *？`);
        if(n.op!=="="){const cur=load(r);val=arith(n.op[0],cur,val,n)}
        if(S.inCond&&n.op==="=")note(`⚠ 條件裡的 <code>=</code> 是「<b>指定</b>」，不是比較！<code>${esc(r.label)}</code> 被設成 ${fmtVal(o0.t,conv(o0.t,val))}。比較要用 <code>==</code>。`);
        store(r,val);const nw=peekv(r);
        S.info={kind:"assign",label:r.label,op:n.op,rk:n.r.k,text:txt(n.r),sub:pre,raw:fmtVal(val.t,val.v),rv,val:fmtVal(nw.t,nw.v),old:oldV,oldInit};
        if(r.v.type==="ptr"&&!r.str)S.info={kind:"msg",text:nw.v===null?`把 nullptr 放進 <b>${esc(r.label)}</b>：${esc(r.label)} 現在<b>不指向任何東西</b>。`:`把位址 ${fmtVal("ptr",nw.v)} 放進 <b>${esc(r.label)}</b>：${esc(r.label)} 現在<b>指向 ${esc(targetLabel(nw.v))}</b>。`};
        return nw;
      }
      case"method":{
        if(n.obj.k==="var"&&n.obj.name==="cin"){
          if(n.name!=="ignore")throw rterr(n,"這個網頁只支援 cin.ignore()");
          if(S.quiet)throw IMPURE;return evIgnore(n);
        }
        const o=n.obj.k==="var"?lookup(n.obj.name,n.obj):null;
        if(o&&o.type==="stack"&&!o.isArr)return stackMethod(o,n);
        if(!o||o.type!=="string"||o.isArr)throw rterr(n,`只有 string 變數可以用 .${esc(n.name)}()`);
        if(n.name==="length"||n.name==="size"){if(!S.quiet)S.read.add(o.id+":0");return{t:"int",v:o.values[0].length}}
        throw rterr(n,`這個網頁還不支援 .${esc(n.name)}()`);
      }
      case"getline":if(S.quiet)throw IMPURE;return evGetline(n);
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
      case"idx":{S.quiet=true;try{const r=ref(n),x=peekv(r);s=fmtVal(x.t,x.v)}catch(e){s=txt(n)}finally{S.quiet=false}break}
      case"method":{if(n.obj.k==="var"&&n.obj.name==="cin")throw IMPURE;S.quiet=true;try{const x=ev(n);s=fmtVal(x.t,x.v)}catch(e){s=txt(n)}finally{S.quiet=false}break}
      case"bin":s=`${subText(n.l)} ${n.op} ${subText(n.r)}`;break;
      case"un":s=n.op+subText(n.x);break;
      case"cast":s=`(${TNAME[n.type]})${subText(n.x)}`;break;
      case"call":s=`${n.f}(${n.args.map(subText).join(", ")})`;break;
      case"deref":{S.quiet=true;try{const r=ref(n),x=peekv(r);s=fmtVal(x.t,x.v)}catch(e){s=txt(n)}finally{S.quiet=false}break}
      case"addr":s=txt(n);break;
      default:throw IMPURE;
    }
    return n.paren?`(${s})`:s;
  }
  function subOf(n){try{return subText(n)}catch(e){return null}}
  function evCout(n){
    let s="";
    for(const it of n.items){const ca=charArr(it);if(it.k==="endl")s+="\n";else if(it.k==="str")s+=it.v;else if(ca)s+=charArrText(ca,it);else s+=fmtOut(ev(it))}
    S.out+=s;S.lastCout=s;return B(1);
  }
  function evCin(n){
    let ok=true;
    for(const tg of n.targets){
      const ca=charArr(tg.x);
      if(ca){ok=readCharArr(ca,tg)&&ok;continue}
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
  function readCharArr(v,tg){
    const N=esc(v.name);let msg,ok=true;
    if(S.fail){ok=false;msg=`cin 之前已經失敗了，這次<b>什麼都不做</b>。`}
    else{
      let p=S.pos;while(p<S.inp.length&&/\s/.test(S.inp[p]))p++;
      const skipped=p>S.pos;
      if(p>=S.inp.length){S.pos=p;S.fail=true;ok=false;msg=`輸入緩衝區已經沒有資料了（<b>EOF</b>）→ 讀取失敗，<b>${N}</b> 保持原樣。`}
      else{
        const w=S.inp.slice(p).match(/^\S+/)[0];
        if(w.length+1>v.len)throw rterr(tg.x,`<b>放不下！</b><code>${N}</code> 只有 ${v.len} 格，最多放 ${v.len-1} 個字（最後一格要留給 '\\0'），但輸入的「${esc(w)}」有 ${w.length} 個字。<br>真正的 C++ 不會阻止你，多出來的字會蓋掉陣列後面的記憶體。`);
        for(let i=0;i<=w.length;i++){v.values[i]=i<w.length?w.charCodeAt(i):0;v.init[i]=true;S.changed.add(v.id+":"+i)}
        S.lastRead=[p,p+w.length];S.pos=p+w.length;
        msg=`${skipped?"跳過空白和換行，":""}讀到空白或換行為止：讀出「${esc(w)}」，一個字元放一格（${N}[0] ～ ${N}[${w.length-1}]），再在 ${N}[${w.length}] 自動補上 <b>'\\0'</b> 當結尾。`;
      }
    }
    snap(tg,msg);return ok;
  }
  // 呼叫自訂函式：開一層新的記憶體（呼叫堆疊），參數放進去，做完再收回
  function frameName(v){if(v.scope==="global")return"全域";const f=S.frames.find(f=>f.key===v.scope);return f?f.label:"?"}
  function callFn(n){
    if(S.quiet)throw IMPURE;
    const F=prog.funcs[n.f];
    if(!F)throw rterr(n,`找不到函式 <code>${esc(n.f)}()</code>。是不是名字打錯了，或還沒寫這個函式？`);
    const need=F.params.filter(pm=>!pm.def).length;
    if(n.args.length<need||n.args.length>F.params.length)throw rterr(n,`<code>${esc(n.f)}()</code> 需要 ${need===F.params.length?need:`${need} ～ ${F.params.length}`} 個參數，這裡給了 ${n.args.length} 個。`);
    if(S.frames.length>=60)throw rterr(n,`函式一層呼叫一層，已經超過 60 層了！如果是遞迴，檢查<b>終止條件</b>有沒有寫對。（真正的 C++ 會 stack overflow 當掉）`);
    const bind=F.params.map((pm,i)=>{
      const a=n.args[i];
      if(!a)return{pm,val:ev(pm.def),dflt:true};
      if(pm.ref||pm.arr){
        if(a.k!=="var")throw rterr(a,pm.arr?`參數 <code>${esc(pm.name)}</code> 是陣列，這裡要放陣列的名稱。`:`參數 <code>${esc(pm.name)}</code> 是傳參考（&amp;），這裡要放一個變數，不能放算式或數字。`);
        const v=lookup(a.name,a);
        if(pm.arr&&!v.isArr)throw rterr(a,`參數 <code>${esc(pm.name)}</code> 是陣列，但 <code>${esc(a.name)}</code> 不是陣列。`);
        if(pm.ref&&v.isArr)throw rterr(a,`<code>${esc(a.name)}</code> 是陣列，參數要寫成 ${esc(pm.name)}[]。`);
        return{pm,alias:v};
      }
      return{pm,val:ev(a)};
    });
    const saved={scopes:S.scopes,addr:S.addr};
    const fr={key:"f"+(++fid),label:n.f};S.frames.push(fr);
    const m=new Map();S.scopes=[saved.scopes[0],m];
    const parts=[];
    for(const b of bind){
      const N=`<b>${esc(b.pm.name)}</b>`;
      if(b.alias){m.set(b.pm.name,b.alias);S.refs.push({frame:fr.key,name:b.pm.name,target:b.alias.name,tid:b.alias.id,targetFrame:frameName(b.alias),arr:b.pm.arr});
        parts.push(b.pm.arr?`${N} 就是 ${frameName(b.alias)} 的陣列 <b>${esc(b.alias.name)}</b>（<b>同一塊記憶體</b>，沒有複製）`:`${N} 是 ${frameName(b.alias)} 的 <b>${esc(b.alias.name)}</b> 的另一個名字（傳參考）`)}
      else{
        if(b.pm.type==="ptr"&&b.val.t!=="ptr"&&!(b.val.t==="int"&&b.val.v===0))throw rterr(n,`參數 <code>${esc(b.pm.name)}</code> 是指標，這裡要放「位址」，例如 <code>&amp;a</code>。是不是忘了加 &amp;？`);
        if(b.pm.type!=="ptr"&&b.val.t==="ptr")throw rterr(n,`參數 <code>${esc(b.pm.name)}</code> 是 ${TNAME[b.pm.type]}，這裡卻放了位址。`);
        declElem=b.pm.elem;const v=declare(b.pm.type,b.pm.name,null,n,false);declElem=null;store({v,i:0,key:v.id+":0"},b.val);parts.push(`${N} = ${esc(fmtVal(v.type,v.values[0]))}${b.dflt?"（沒給，用<b>預設值</b>）":""}`)}
    }
    const caller=S.frames[S.frames.length-2].label;
    snap(n,`呼叫 <code>${esc(txt(n))}</code>：從 ${caller} 跳進 <b>${esc(n.f)}</b> 函式，記憶體多開一層。`+(parts.length?`<br>參數：${parts.join("，")}。`:""));
    let ret=null,at={s:F.body.close,e:F.body.close+1};
    try{for(const st of F.body.body)exec(st)}
    catch(e){if(e&&e.fret){ret=e.val;at=e.node}else throw e}
    let out=null;
    if(F.ret!=="void"){
      if(ret===null){note(`⚠ <b>${esc(n.f)}</b> 應該要 return 一個 ${TNAME[F.ret]}，可是沒有 return 就結束了，帶回去的是<b>垃圾值</b>。`);out={t:F.ret,v:F.ret==="string"?"":GARB[F.ret]?GARB[F.ret][0]:0}}
      else{
        if(F.ret==="ptr"&&ret.t!=="ptr"&&!(ret.t==="int"&&ret.v===0))throw rterr(at,`<b>${esc(n.f)}</b> 要回傳一個位址（指標），這裡卻回傳了 ${esc(fmtVal(ret.t,ret.v))}。`);
        out={t:F.ret,v:conv(F.ret,ret),elem:F.retElem};
        if(F.ret==="ptr"&&out.v&&S.vars.some(v=>v.id===out.v.id&&v.scope===fr.key)){
          const lv=S.vars.find(v=>v.id===out.v.id);
          note(`⚠ 回傳的是 <b>${esc(n.f)}</b> 自己的區域變數 <code>${esc(lv.name)}</code> 的位址！${esc(n.f)} 一結束，${esc(lv.name)} 就被收回了，拿到這個位址的人會變成<b>懸空指標</b>。`);
        }
      }
    }else if(ret!==null&&ret.t!=="void")throw rterr(at,`<b>${esc(n.f)}</b> 是 void 函式，不能 return 一個值。`);
    const freed=S.vars.filter(v=>v.scope===fr.key);
    S.vars=S.vars.filter(v=>v.scope!==fr.key);S.refs=S.refs.filter(r=>r.frame!==fr.key);
    S.frames.pop();S.scopes=saved.scopes;S.addr=saved.addr;
    const back=out?`，把 <b>${esc(fmtVal(out.t,out.v))}</b> 帶回 ${caller} 呼叫它的地方`:`，回到 ${caller}`;
    snap(at,`${ret!==null?`<code>${esc(txt(at))}</code>`:`${esc(n.f)} 執行到最後`}：<b>${esc(n.f)}</b> 結束${back}。`+(freed.length?`<br>${esc(n.f)} 的 ${freed.map(v=>`<code>${esc(v.name)}</code>`).join("、")} 都被收回了。`:""));
    return out||{t:"void",v:0};
  }
  function stackMethod(o,n){
    const a=o.values[0],N=esc(o.name),need=k=>{if(n.args.length!==k)throw rterr(n,`${N}.${n.name}() ${k?"裡面要放一個值":"的括號裡不用放東西"}`)};
    const top=()=>{if(!a.length)throw rterr(n,`<b>stack 是空的！</b><code>${N}</code> 裡面沒有東西，不能 ${n.name}()。<br>先用 <code>${N}.empty()</code> 檢查，不是空的才能拿。`)};
    switch(n.name){
      case"push":{need(1);if(S.quiet)throw IMPURE;const x=ev(n.args[0]),v=conv(o.elem,x);a.push(v);S.changed.add(o.id+":k"+(a.length-1));
        S.info={kind:"msg",text:`<code>${N}.push(${esc(txt(n.args[0]))})</code>：把 ${fmtVal(o.elem,v)} 放到 ${N} 的<b>最上面</b>，現在有 ${a.length} 個。`};return B(1)}
      case"pop":{need(0);if(S.quiet)throw IMPURE;top();const v=a.pop();
        S.info={kind:"msg",text:`<code>${N}.pop()</code>：把最上面的 ${fmtVal(o.elem,v)} <b>拿掉</b>，剩下 ${a.length} 個。`+(a.length?`現在最上面是 ${fmtVal(o.elem,a[a.length-1])}。`:"現在是空的。")};return B(1)}
      case"top":{need(0);top();if(!S.quiet)S.read.add(o.id+":k"+(a.length-1));return{t:o.elem,v:a[a.length-1]}}
      case"empty":{need(0);if(!S.quiet)S.read.add(o.id+":0");return B(!a.length)}
      case"size":{need(0);if(!S.quiet)S.read.add(o.id+":0");return{t:"int",v:a.length}}
    }
    throw rterr(n,`stack 沒有 .${esc(n.name)}()，可以用 push、pop、top、empty、size`);
  }
  function evGetline(n){
    const r=ref(n.x);if(r.str||r.v.type!=="string")throw rterr(n.x,"getline 要讀進 string 變數");
    const L=`<b>${esc(r.label)}</b>`;let msg,ok=true;
    if(S.fail){ok=false;msg=`cin 之前已經失敗了，這次<b>什麼都不做</b>，${L} 保持原值。`}
    else if(S.pos>=S.inp.length){S.fail=true;ok=false;msg=`輸入緩衝區已經沒有資料了（<b>EOF</b>）→ getline 失敗，${L} 保持原值。`}
    else{
      const nl=S.inp.indexOf("\n",S.pos),end=nl<0?S.inp.length:nl,line=S.inp.slice(S.pos,end);
      store(r,{t:"string",v:line});S.lastRead=[S.pos,nl<0?end:end+1];
      msg=line===""&&nl===S.pos
        ?`getline 從目前的位置讀到換行為止，但目前的位置<b>剛好就是一個換行</b>（上一個 cin &gt;&gt; 留下來的）→ 讀到<b>空字串</b>，${L} 變成 ""。`
        :`getline 讀<b>一整行</b>（空白也算進去），讀到換行為止：讀出「${esc(line)}」放進 ${L}，那個換行被丟掉。`;
      S.pos=nl<0?end:end+1;
    }
    snap(n,msg);return B(ok);
  }
  function evIgnore(n){
    let msg;
    if(S.pos<S.inp.length){const c=S.inp[S.pos];S.lastRead=[S.pos,S.pos+1];S.pos++;msg=`<code>cin.ignore()</code>：把輸入緩衝區裡的下一個字元${vis(c)}<b>丟掉</b>。`}
    else msg=`<code>cin.ignore()</code>：輸入緩衝區已經沒有字元可以丟了。`;
    snap(n,msg);return B(1);
  }
  function condText(c,pre,t){
    if(c.k==="getline")return t?"getline 讀取<b>成功</b> → 條件成立":"getline 讀取<b>失敗</b> → 條件不成立";
    if(c.k==="cin")return t?"cin 讀取<b>成功</b> → 條件成立":"cin 讀取<b>失敗</b> → 條件不成立";
    const raw=txt(c);const sub=pre&&pre!==raw?`：${esc(pre)}`:"";
    return `<code>${esc(raw)}</code>${sub} → <b>${t?"成立 (true)":"不成立 (false)"}</b>`;
  }
  function evCond(c){const pre=subOf(c);S.inCond=true;const v=ev(c);S.inCond=false;return{t:truthy(v),pre}}
  function vis(s){return`<span class="vis">${esc(s).replace(/ /g,"␣").replace(/\n/g,"↵").replace(/\t/g,"⇥")}</span>`}
  function exprNote(I){
    if(!I)return null;
    const L=`<b>${esc(I.label)}</b>`;
    if(I.kind==="msg")return I.text;
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
    if(x.k==="cin"||x.k==="getline"||x.k==="ucall"||x.k==="method"&&x.obj.k==="var"&&x.obj.name==="cin"){ev(x);return}
    if(x.k==="cout"){ev(x);snap(x,`${prefix}印到螢幕：${vis(S.lastCout)}`);return}
    S.info=null;ev(x);
    snap(x,prefix+(exprNote(S.info)||`計算 <code>${esc(txt(x))}</code>。`));
  }
  // 參考：在目前的區塊裡多一個名字，指到同一個變數，不開新的格子
  function declAlias(it,type){
    if(it.size||it.auto||it.list)throw rterr(it,"這個網頁還不支援陣列的參考");
    const x=it.init;
    if(!x||x.k!=="var")throw rterr(it,`參考（別名）要綁定一個變數，例如 int &${esc(it.name)} = a;，不能綁數字或算式。`);
    const v=lookup(x.name,x);
    if(v.isArr)throw rterr(it,"這個網頁還不支援陣列的參考");
    if(v.type!==type)throw rterr(it,`<code>${esc(x.name)}</code> 是 ${TNAME[v.type]}，不能當 ${TNAME[type]} 的別名。`);
    const sc=S.scopes[S.scopes.length-1];
    if(sc.has(it.name))throw rterr(it,`<code>${esc(it.name)}</code> 在同一個區塊裡宣告了兩次。`);
    sc.set(it.name,v);(sc.aliases||(sc.aliases=new Set())).add(it.name);
    const fk=S.frames[S.frames.length-1].key;
    S.refs.push({frame:fk,name:it.name,target:v.name,tid:v.id,targetFrame:frameName(v),alias:true,sc});
    return `宣告參考 <b>${esc(it.name)}</b>：${esc(it.name)} 是 <b>${esc(v.name)}</b> 的<b>別名</b>，兩個名字指的是同一個格子，<b>沒有</b>開新的記憶體。`;
  }
  function declPtr(it,elem,global){
    if(it.size||it.auto||it.list)throw rterr(it,"這個網頁還不支援指標陣列");
    const val=it.init?ev(it.init):null;
    if(val&&val.t!=="ptr"&&!(val.t==="int"&&val.v===0))throw rterr(it,`指標只能放「位址」（例如 &amp;a）或 nullptr。`);
    declElem=elem;const v=declare("ptr",it.name,null,it,global);declElem=null;
    const N=`<b>${esc(it.name)}</b>`,T=`${TNAME[elem]}*`;
    if(val){store({v,i:0,key:v.id+":0"},val);const pv=v.values[0];
      return pv===null?`宣告指標 ${N}（${T}，8 bytes），放進 nullptr：現在不指向任何東西。`:`宣告指標 ${N}（${T}，8 bytes），放進位址 ${fmtVal("ptr",pv)}：${N} 現在<b>指向 ${esc(targetLabel(pv))}</b>。`}
    S.changed.add(v.id+":0");
    return global?`宣告指標 ${N}（${T}）：全域指標一開始是 nullptr。`:`宣告指標 ${N}（${T}，8 bytes）：用來存一個 ${TNAME[elem]} 的「位址」。還沒給值 → 裡面是亂七八糟的位址（<b>野指標</b>），還不能用 *${esc(it.name)}。`;
  }
  function execDecl(d,global){
    const parts=[];const T=TNAME[d.type],sz=SIZE[d.type];const B_=n=>`${n} byte${n>1?"s":""}`;
    for(const it of d.items){
      if(it.ref){parts.push(declAlias(it,d.type));continue}
      if(it.ptr){parts.push(declPtr(it,d.type,global));continue}
      let len=null;
      if(it.size){len=Math.trunc(ev(it.size).v);if(len<=0)throw rterr(it,"陣列大小必須大於 0");if(len>200)throw rterr(it,"這個網頁最多只能顯示 200 格的陣列，請開小一點。")}
      if(it.auto){if(it.list)len=it.list.length;else if(it.init&&it.init.k==="str"&&d.type==="char")len=it.init.v.length+1;else throw rterr(it,"[ ] 裡沒寫大小時，一定要給初始值");if(!len)throw rterr(it,"陣列大小必須大於 0")}
      const pre=it.init?subOf(it.init):null;const val=it.init?ev(it.init):null;
      declElem=d.elem;const v=declare(d.type,it.name,len,it,global);declElem=null;const N=`<b>${esc(it.name)}</b>`;
      if(len!=null){
        if(it.list){
          if(it.list.length>len)throw rterr(it,`大括號裡有 ${it.list.length} 個值，但陣列只有 ${len} 格。`);
          for(let i=0;i<len;i++){v.values[i]=i<it.list.length?conv(d.type,ev(it.list[i])):0;v.init[i]=true;S.changed.add(v.id+":"+i)}
          parts.push(`宣告陣列 ${N}：連續 ${len} 格 ${T}，每格 ${B_(sz)}，共 ${B_(len*sz)}。`+(it.list.length<len?`大括號裡只給了 ${it.list.length} 個值，<b>剩下的格子自動補 0</b>。`:""));
        }else if(it.init){
          if(d.type!=="char"||it.init.k!=="str")throw rterr(it,`陣列要用 { } 給初始值${d.type==="char"?"，或用 \"文字\"":""}。`);
          const str=it.init.v;
          if(str.length+1>len)throw rterr(it,`"${esc(str)}" 有 ${str.length} 個字，加上結尾的 '\\0' 要 ${str.length+1} 格，但 ${esc(it.name)} 只有 ${len} 格。`);
          for(let i=0;i<len;i++){v.values[i]=i<str.length?str.charCodeAt(i):0;v.init[i]=true;S.changed.add(v.id+":"+i)}
          parts.push(`宣告 char 陣列 ${N}：連續 ${len} 格，每格 1 byte。"${esc(str)}" 一個字元放一格，後面自動補上 <b>'\\0'</b> 當結尾`+(len>str.length+1?`，剩下的格子也都是 0（'\\0'）。`:"。"));
        }else{
          for(let i=0;i<len;i++)S.changed.add(v.id+":"+i);
          parts.push(`宣告陣列 ${N}：連續 ${len} 格 ${T}，每格 ${B_(sz)}，共 ${B_(len*sz)}。`+(global?"全域陣列會<b>自動全部設成 0</b>。":"沒有初始化 → 每一格都是<b>垃圾值</b>。"));
        }
      }else if(val){
        store({v,i:0,key:v.id+":0"},val);const shown=fmtVal(d.type,v.values[0]);
        if(it.init.k==="lit")parts.push(`宣告 ${T} ${N}（${B_(sz)}），放進 ${shown}。`);
        else{const raw=fmtVal(val.t,val.v);const t=txt(it.init);
          parts.push(`宣告 ${T} ${N}：先算 <code>${esc(t)}</code> → ${pre&&pre!==t?esc(pre)+" = ":""}${raw}${raw!==shown?`，存成 ${T} 變成 ${shown}`:""}，放進 ${esc(it.name)}。`)}
      }else if(d.type==="stack"){
        S.changed.add(v.id+":0");
        parts.push(`宣告 <code>stack&lt;${TNAME[d.elem]}&gt;</code> ${N}：一個空的 stack，裡面還沒有東西。之後用 push 放進去、pop 拿出來，<b>只能動最上面那一個</b>。`);
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
      case"return":
        if(S.frames.length>1){const val=st.x?ev(st.x):null;throw{fret:true,val:val||{t:"void",v:0},node:st}}
        if(st.x)ev(st.x);snap(st,"<code>return 0</code>：main 結束，程式結束。");throw RET;
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
    else if(e&&e.fret)snap(e.node,`<div class="err">return 寫在不該寫的地方。</div>`,{error:true,done:true},true);
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


