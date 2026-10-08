/* ================= 迷你 C++ 直譯器：把程式執行過程錄成一格一格的快照 ================= */
const SIZE={int:4,ll:8,double:8,char:1,bool:1,string:32,stack:48,queue:48,deque:48,vector:24,list:24,ptr:8};
const TNAME={int:"int",ll:"long long",double:"double",char:"char",bool:"bool",string:"string",stack:"stack",queue:"queue",deque:"deque",vector:"vector",list:"list",ptr:"指標",struct:"struct"};
const GARB={int:[32764,4199,-1294,21845,7,-86,1,6422,-17,327],ll:[140737488355,4198400],double:[6.95e-310],char:[-52,113,-91,64,7],bool:[0]};
const LIMIT=3000;
const BRK={brk:1},CNT={cnt:1},RET={ret:1},LIM={lim:1};
const KW=new Set(["int","long","double","float","char","bool","string","stack","queue","deque","vector","list","void","if","else","while","for","break","continue","return","true","false","const","using","namespace","unsigned","struct","new","delete"]);
const CONTS=["stack","queue","deque","vector","list"];
const MATH={abs:1,max:2,min:2,round:1,floor:1,ceil:1,sqrt:1,pow:2,strlen:1};

function esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function cerr(pos,msg){return{compile:true,pos,msg}}
function unesc(c){return{n:"\n",t:"\t","0":"\0","\\":"\\","'":"'",'"':'"'}[c]??c}
function charLit(v){const c=v<0?v+256:v;if(c===10)return"'\\n'";if(c===0)return"'\\0'";if(c===32)return"' '";if(c<32||c===127)return`(${c})`;return`'${String.fromCharCode(c)}'`}
function fmtVal(t,v){
  if(t==="char")return charLit(v);
  if(t==="bool")return v?"true":"false";
  if(t==="string")return`"${v}"`;
  if(CONTS.includes(t))return`[${v.map(x=>Array.isArray(x)?`[${x.join(", ")}]`:x).join(", ")}]`;
  if(t==="ptr")return v===null?"nullptr":"0x"+v.addr.toString(16);
  if(t==="struct")return`{${v.vals.map((x,i)=>fmtVal(v.sdef.fields[i].type,x)).join(", ")}}`;
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
  const TYPES=["int","long","double","float","char","bool","string","stack","queue","deque","vector","list","const","unsigned"];
  const structs={};let lastSdef=null;
  const isType=(k=0)=>{const t=peek(k);return t.t==="kw"&&(TYPES.includes(t.v)||t.v==="struct")||t.t==="id"&&!!structs[t.v]};
  function skipStd(){if(peek().t==="id"&&peek().v==="std"&&is("::",1))p+=2}
  function parseType(){
    while(is("const")||is("unsigned"))next();
    skipStd();let t=next();
    if(t.v==="struct"){t=next();if(t.t!=="id"||!structs[t.v])throw cerr(t.s,`找不到 struct ${t.v}。要先在上面定義 struct ${t.v} { ... }; 才能用`)}
    if(t.t==="id"&&structs[t.v]){lastSdef=structs[t.v];return"struct"}
    if(t.v==="long"){if(is("long"))next();if(is("int"))next();return"ll"}
    if(t.v==="float")return"double";
    if(CONTS.includes(t.v)){expect("<");const inner=parseType();let inner2=null;
      if(CONTS.includes(inner)){if(t.v!=="vector"||inner!=="vector"||CONTS.includes(lastElem))throw cerr(t.s,`這個網頁只支援 vector<vector<型別>> 這一種兩層的寫法`);inner2=lastElem}
      if(inner==="struct")throw cerr(t.s,`這個網頁還不支援 ${t.v} 裡面放 struct`);
      lastElem=inner;lastElem2=inner2;closeAngle();return t.v}
    if(!["int","double","char","bool","string"].includes(t.v))throw cerr(t.s,"這裡應該是型別，例如 int");
    return t.v;
  }
  let lastElem=null,lastElem2=null;
  // 收尾的 >：vector<vector<int>> 最後的 >> 要拆成兩個 >
  const closeAngle=()=>{if(is(">>")){T[p]={...T[p],v:">",s:T[p].s+1};return}expect(">")};
  // struct 名稱 { 型別 欄位; ... };  → 算出每個欄位的位移（含對齊）
  function parseStructDef(){
    next();const nm=next();if(nm.t!=="id")throw cerr(nm.s,"struct 後面要接名稱，例如 struct Student");
    if(structs[nm.v])throw cerr(nm.s,`struct ${nm.v} 定義了兩次`);
    const o=expect("{"),fields=[],sd={name:nm.v,fields,size:0};
    structs[nm.v]=sd;  // 先登記名字，欄位裡才能寫 Node *next;
    while(!is("}")){
      if(peek().t==="eof")throw cerr(o.s,"這個 { 沒有對應的 }");
      if(!isType())throw cerr(peek().s,"struct 裡面要寫欄位，例如 int score;");
      const ft=peek(),type=parseType(),fsd=type==="struct"?lastSdef:null;
      if(type==="stack"||type==="queue")throw cerr(ft.s,"這個網頁還不支援在 struct 裡放 stack");
      do{
        let ptr=false;if(is("*")){next();ptr=true;if(is("*"))throw cerr(peek().s,"這個網頁還不支援指標的指標（**）")}
        if(is("&"))throw cerr(peek().s,"這個網頁還不支援參考當 struct 的欄位");
        if(!ptr&&fsd)throw cerr(ft.s,fsd===sd?`struct ${nm.v} 不能直接包含自己（那會無限大）。要用<b>指標</b>：${nm.v} *next;`:"這個網頁還不支援 struct 裡面再放 struct（可以放指標）");
        const id=next();if(id.t!=="id")throw cerr(id.s,"型別後面要接欄位名稱");
        if(is("["))throw cerr(peek().s,"這個網頁還不支援在 struct 裡放陣列");
        if(is("="))throw cerr(peek().s,"這個網頁還不支援欄位的預設值，請宣告變數時再用 { } 給值");
        if(fields.some(f=>f.name===id.v))throw cerr(id.s,`欄位 ${id.v} 重複了`);
        fields.push(ptr?{name:id.v,type:"ptr",elem:type,psdef:fsd}:{name:id.v,type});
      }while(is(",")&&next());
      expect(";","semi");
    }
    const c=next();
    if(!is(";"))throw cerr(c.e,"struct 定義的 } 後面一定要加分號 ;（這是很常見的錯誤）");
    next();
    if(!fields.length)throw cerr(nm.s,"struct 裡面至少要有一個欄位");
    let off=0,al=1;
    for(const f of fields){const sz=SIZE[f.type],a=Math.min(sz,8);off=Math.ceil(off/a)*a;f.off=off;f.size=sz;off+=sz;al=Math.max(al,a)}
    sd.size=Math.ceil(off/al)*al;
  }
  // { ... } 初始值，裡面可以再包 { }（struct 陣列）
  function parseBrace(){
    const o=expect("{"),items=[];
    if(!is("}")){do{items.push(is("{")?parseBrace():parseAssign())}while(is(",")&&next())}
    const c=expect("}");return{k:"brace",items,s:o.s,e:c.e};
  }
  function parseDecl(){
    const st=peek().s,type=parseType(),elem=CONTS.includes(type)?lastElem:null,elem2=CONTS.includes(type)?lastElem2:null,sdef=type==="struct"?lastSdef:null,items=[];
    do{
      let ref=false;if(is("&")){next();ref=true}
      let ptr=false;while(is("*")){next();if(ptr)throw cerr(peek().s,"這個網頁還不支援指標的指標（**）");ptr=true}
      const id=next();if(id.t!=="id")throw cerr(id.s,"型別後面要接變數名稱");
      const it={name:id.v,s:id.s,ptr,ref};
      if(is("(")&&["vector","deque","list"].includes(type)){next();it.ctor=[];if(!is(")")){do{it.ctor.push(parseAssign())}while(is(",")&&next())}expect(")")}
      if(ref&&!is("="))throw cerr(id.s,`參考（別名）宣告時一定要綁定一個變數，例如 int &${id.v} = a;`);
      if(is("[")){next();if(is("]"))it.auto=true;else it.size=parseExpr();expect("]")}
      if(is("[")){next();if(is("]"))throw cerr(peek().s,"二維陣列的第二個 [ ] 一定要寫大小（每一列有幾格），例如 int a[3][4]");it.size2=parseExpr();expect("]");
        if(is("["))throw cerr(peek().s,"這個網頁還不支援三維以上的陣列")}
      if(is("=")){next();
        if(is("{"))it.list=parseBrace().items;
        else it.init=parseAssign();
      }
      it.e=T[p-1].e;items.push(it);
    }while(is(",")&&next());
    if((type==="stack"||type==="queue")&&items.some(it=>it.size||it.auto||it.init||it.list))throw cerr(st,"stack 宣告時不用給大小或初始值，例如 stack<int> st;");
    return{k:"decl",type,elem,elem2,sdef,items,s:st,e:T[p-1].e};
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
    if(is("for")&&isType(2)){
      const save=p;next();expect("(");const ty=parseType(),el=lastElem;let rf=false;if(is("&")){next();rf=true}
      if(peek().t==="id"&&is(":",1)){const nm=next();next();const x=parseExpr();const cp=expect(")");
        return{k:"rfor",type:ty,elem:el,ref:rf,name:nm.v,x,body:parseStmt(),s:t.s,e:cp.e}}
      p=save;
    }
    if(is("for")){next();const op=expect("(");let init=null;
      if(!is(";")){if(isType())init=parseDecl();else{const x=parseExpr();init={k:"expr",x,s:x.s,e:x.e}}}
      expect(";","semi");const cond=is(";")?null:parseExpr();expect(";","semi");const upd=is(")")?null:parseExpr();const cp=expect(")");
      return{k:"for",init,cond,upd,body:parseStmt(),s:t.s,e:cp.e}}
    if(is("break")||is("continue")){next();expect(";","semi");return{k:t.v,s:t.s,e:t.e}}
    if(is("return")){next();const x=is(";")?null:parseExpr();expect(";","semi");return{k:"return",x,s:t.s,e:T[p-1].e}}
    if(is("struct")&&peek(1).t==="id"&&is("{",2)){parseStructDef();return{k:"empty",s:t.s,e:T[p-1].e}}
    if(is("delete")){next();if(is("["))throw cerr(peek().s,"這個網頁還不支援 delete[]");const x=parseExpr();expect(";","semi");return{k:"delete",x,s:t.s,e:T[p-1].e}}
    if(is("else"))throw cerr(t.s,"這個 else 找不到對應的 if。檢查上面的 if 是不是多了分號，或大括號沒配對");
    if(isType()){const d=parseDecl();expect(";","semi");return d}
    const x=parseExpr();expect(";","semi");return{k:"expr",x,s:x.s,e:x.e};
  }
  const parseExpr=()=>parseAssign();
  function parseAssign(){
    const l=parseOr();
    if(peek().t==="op"&&["=","+=","-=","*=","/=","%="].includes(peek().v)){
      const op=next().v;const r=parseAssign();
      if(!["var","idx","deref","mem"].includes(l.k))throw cerr(l.s,"等號左邊必須是變數");
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
      const targets=[];while(is(">>")){const op=next();const x=parseUnary();if(!["var","idx","deref","mem"].includes(x.k))throw cerr(x.s,"cin >> 後面要接變數");targets.push({x,s:op.s,e:x.e})}
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
    if(is("new")){next();const ty=parseType(),sd=ty==="struct"?lastSdef:null;
      if(ty==="stack")throw cerr(t.s,"這個網頁還不支援 new stack");
      if(is("["))throw cerr(peek().s,"這個網頁還不支援 new 陣列（new int[n]）");
      let brace=null,init=null,zero=false;
      if(is("{"))brace=parseBrace();
      else if(is("(")){next();if(is(")"))zero=true;else{if(sd)throw cerr(peek().s,`new ${sd.name}( ) 的括號裡不能放值，要給初始值請用 new ${sd.name}{ ... }`);init=parseAssign()}expect(")")}
      return{k:"new",type:ty,sdef:sd,brace,init,zero,s:t.s,e:T[p-1].e}}
    if(is("(")&&isType(1)){next();const ty=parseType();expect(")");const x=parseUnary();return{k:"cast",type:ty,x,s:t.s,e:x.e}}
    return parsePostfix();
  }
  function parsePostfix(){
    let x=parsePrimary();
    for(;;){
      if(is("[")){next();const i=parseExpr();const c=expect("]");x={k:"idx",a:x,i,s:x.s,e:c.e}}
      else if(is("++")||is("--")){const o=next();x={k:"post",op:o.v,x,s:x.s,e:o.e}}
      else if(is("-")&&is(">",1)&&peek(1).s===peek().e){p+=2;const m=next();if(m.t!=="id")throw cerr(m.s,"-> 後面要接欄位名稱，例如 p->next");
        x={k:"mem",obj:{k:"deref",x,arrow:true,s:x.s,e:x.e},name:m.v,arrow:true,s:x.s,e:m.e}}
      else if(is(".")){next();const m=next();if(m.t!=="id")throw cerr(m.s,"點後面要接名稱，例如 s.length() 或 a.score");
        if(!is("(")){x={k:"mem",obj:x,name:m.v,s:x.s,e:m.e};continue}
        expect("(");const args=[];if(!is(")")){do{args.push(parseAssign())}while(is(",")&&next())}const c=expect(")");
        x={k:"method",obj:x,name:m.v,args,s:x.s,e:c.e}}
      else break;
    }
    return x;
  }
  function parsePrimary(){
    skipStd();
    if(is("vector")&&is("<",1)){const st=peek().s;parseType();const el=lastElem;expect("(");const args=[];if(!is(")")){do{args.push(parseAssign())}while(is(",")&&next())}const c=expect(")");
      if(CONTS.includes(el))throw cerr(st,"這個網頁還不支援這種寫法");return{k:"vnew",elem:el,args,s:st,e:c.e}}
    const t=next();
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
        expect(",");const x=parsePostfix();if(!["var","idx","mem"].includes(x.k))throw cerr(x.s,"getline 的第二個參數要是 string 變數");
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
      const st=peek().s,base=parseType(),sdef=base==="struct"?lastSdef:null;let ref=false,arr=false,ptr=false;
      while(is("*")){next();ptr=true}
      const type=ptr?"ptr":base,elem=ptr?base:CONTS.includes(base)?lastElem:null;
      if(is("&")){next();ref=true}
      const id=next();if(id.t!=="id")throw cerr(id.s,"參數的型別後面要接名稱，例如 int a");
      let arr2=null;
      if(is("[")){next();if(!is("]"))parseExpr();expect("]");arr=true;
        if(is("[")){next();if(is("]"))throw cerr(peek().s,"二維陣列參數的第二個 [ ] 一定要寫大小，例如 int a[][4]");arr2=parseExpr();expect("]")}}
      if(ref&&arr)throw cerr(st,"陣列參數不用加 &，本來就是同一塊記憶體");
      let def=null;
      if(is("=")){const eq=next();if(ref||arr)throw cerr(eq.s,"傳參考和陣列參數不能有預設值");def=parseAssign()}
      if(ptr&&(ref||arr))throw cerr(st,"這個網頁還不支援這種指標參數");
      ps.push({type,elem,sdef:ptr?null:sdef,psdef:ptr?sdef:null,name:id.v,ref,arr,arr2,def,s:st});
    }while(is(",")&&next());
    let seenDef=false;
    for(const pm of ps){if(pm.def)seenDef=true;else if(seenDef)throw cerr(pm.s,`有預設值的參數要放在後面：${pm.name} 前面的參數有預設值，所以 ${pm.name} 也要有預設值，或把有預設值的參數移到 ${pm.name} 後面。（呼叫時傳進去的值是從左邊開始對上參數的，前面的參數有預設值、後面的卻沒有，就對不起來了。）`)}
    return ps;
  }
  const prog={globals:[],main:null,funcs:{}};
  let calls=[];const known=new Set(),protos={},late=[];
  while(peek().t!=="eof"){
    if(is("using")){while(!is(";")&&peek().t!=="eof")next();expect(";","semi");continue}
    if(is("struct")&&peek(1).t==="id"&&is("{",2)){parseStructDef();continue}
    if(isType()||is("void")){
      const save=p;let ret="void",retElem=null,retS=null;if(is("void"))next();else{ret=parseType();if(ret==="struct")retS=lastSdef}
      if(ret!=="void"&&is("*")&&peek(1).t==="id"&&is("(",2)){next();retElem=ret;ret="ptr";retS=null}
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
        prog.funcs[nm.v]={name:nm.v,ret,retElem,retS,params,body,s:nm.s};continue;
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
  const S={frames:[{key:"main",label:"main"}],refs:[],vars:[],scopes:[],out:"",inp:input||"",pos:0,fail:false,lastRead:null,addr:0x61fe00,gaddr:0x404040,gi:{},changed:new Set(),read:new Set(),notes:[],inCond:false,quiet:false,info:null,lastCout:"",haddr:0xa71ec0,hn:0};
  const trace=[];let idc=0,fid=0;
  const txt=n=>src.slice(n.s,n.e);
  const code=n=>`<code>${esc(txt(n))}</code>`;
  function snap(node,note,extra={},force){
    if(!force&&trace.length>=LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    trace.push({line:lineOf(node.s),span:[node.s,node.e],note:note+warn,
      vars:S.vars.map(v=>({...v,values:v.values.map(dcopy),init:v.init.slice()})),
      out:S.out,pos:S.pos,fail:S.fail,lastRead:S.lastRead,changed:[...S.changed],read:[...S.read],
      frames:S.frames.map(f=>({key:f.key,label:f.label})),refs:S.refs.map(({sc,...r})=>r),...extra});
    S.changed.clear();S.read.clear();S.notes=[];S.lastRead=null;
  }
  const rterr=(node,msg,extra={})=>({rt:true,node,msg,...extra});
  const dcopy=x=>Array.isArray(x)?x.map(dcopy):x;
  const note=m=>{if(!S.quiet&&!S.notes.includes(m))S.notes.push(m)};

  function lookup(name,node){
    for(let i=S.scopes.length-1;i>=0;i--){const v=S.scopes[i].get(name);if(v)return v}
    if(name==="cin"||name==="cout")throw rterr(node,`${name} 必須寫在算式的最前面`);
    throw rterr(node,`變數 <code>${esc(name)}</code> 還沒有宣告就使用了（真正的 C++ 會出現編譯錯誤）。`);
  }
  let declElem=null,declSdef=null,declElem2=null;
  function fresh(ft,global){
    if(ft==="string")return["",true];
    if(ft==="ptr")return global?[null,true]:[{id:-1,i:0,addr:0x7ff3a8+(idc*16)%4096,sz:4},false];
    if(global)return[0,true];
    S.gi[ft]=S.gi[ft]||0;const g=GARB[ft];return[g[S.gi[ft]++%g.length],false];
  }
  function declare(type,name,len,node,global){
    const sc=S.scopes[S.scopes.length-1];
    if(sc.has(name))throw rterr(node,`<code>${esc(name)}</code> 在同一個區塊裡宣告了兩次（真正的 C++ 會編譯錯誤）。`);
    const n=len??1,sd=type==="struct"?declSdef:null,sz=sd?sd.size:SIZE[type];
    const v={id:idc++,name,type,elem:declElem,elem2:declElem2,isArr:len!=null,len:n,addr:global?S.gaddr:S.addr,values:[],init:[],scope:global?"global":S.frames[S.frames.length-1].key};
    if(sd)v.sdef=sd;
    if(global)S.gaddr+=sz*n;else S.addr+=sz*n;
    const g=GARB[type];
    if(sd){
      for(let i=0;i<n;i++)for(const f of sd.fields){const[x,ok]=fresh(f.type,global);v.values.push(x);v.init.push(ok)}
      sc.set(name,v);S.vars.push(v);return v;
    }
    for(let i=0;i<n;i++){
      if(type==="string"){v.values.push("");v.init.push(true)}
      else if(type==="ptr"){if(global){v.values.push(null);v.init.push(true)}else{v.values.push({id:-1,i:0,addr:0x7ff3a8+(idc*16)%4096,sz:4});v.init.push(false)}}
      else if(CONTS.includes(type)){v.values.push([]);v.init.push(true)}
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
    if(CONTS.includes(type))return Array.isArray(v)?dcopy(v):[];
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
  const esz=v=>v.sdef?v.sdef.size:SIZE[v.type];
  const ptrTo=(v,i)=>({id:v.id,i,addr:v.addr+i*esz(v),sz:esz(v)});
  // struct：整個元素的參考（whole）和某個欄位的型別
  const tyOf=r=>r.ft||r.v.type;
  const wref=(v,e,label)=>({v,elem:e,i:e*v.sdef.fields.length,whole:true,key:v.id+":"+e*v.sdef.fields.length,label});
  const wslots=r=>r.v.sdef.fields.map((f,k)=>r.i+k);
  const sval=(sd,vals,init)=>({t:"struct",v:{sdef:sd,vals,init}});
  const fieldList=sd=>sd.fields.map(f=>`${esc(f.name)}（${TNAME[f.type]}）`).join("、");
  // 型別對不上就報錯：struct 只能放進同一種 struct
  function chkStruct(node,sd,val,label){
    const L=`<code>${esc(label)}</code>`;
    if(sd){
      if(val.t!=="struct")throw rterr(node,`${L} 是 struct ${esc(sd.name)}，只能放進一整個 ${esc(sd.name)}。要改其中一個欄位，請寫 ${esc(label)}.${esc(sd.fields[0].name)} = ...`);
      if(val.v.sdef!==sd)throw rterr(node,`${L} 是 ${esc(sd.name)}，不能放進 ${esc(val.v.sdef.name)}：不同的 struct 不能互相指定。`);
    }else if(val.t==="struct")throw rterr(node,`不能把整個 struct 放進 ${L}。要用其中一個欄位，例如 <code>${esc(val.v.sdef.fields[0].name)}</code>：寫成 變數.${esc(val.v.sdef.fields[0].name)}。`);
  }
  const pval=(v,i)=>({t:"ptr",v:ptrTo(v,i),elem:v.type});
  function targetLabel(pv){if(pv===null)return"（不指向任何東西）";const v=S.vars.find(x=>x.id===pv.id);return v?cellName(v,pv.i):"（已經被收回的變數）"}
  // 陣列第 i 格的名字：二維陣列寫成 a[列][行]
  const cellName=(v,i)=>v.dims?`${v.name}[${Math.floor(i/v.dims[1])}][${i%v.dims[1]}]`:v.isArr?`${v.name}[${i}]`:v.name;
  function derefRef(pv,node,name){
    const N=`<code>${esc(name)}</code>`;
    if(pv===null)throw rterr(node,`${N} 是 <b>nullptr</b>，沒有指向任何東西，不能用 * 或 -&gt; 去拿值。`);
    if(pv.id<0)throw rterr(node,`${N} 還沒有給值，裡面是亂七八糟的位址（<b>野指標</b>）。用 * 去讀寫它，真正的 C++ 可能改到別人的記憶體或當掉。<br>先寫 ${esc(name)} = &amp;變數; 讓它指向一個變數。`);
    const v=S.vars.find(x=>x.id===pv.id);
    if(!v)throw rterr(node,`${N} 指向的空間已經被收回了（變數離開了範圍，或已經被 delete）→ <b>懸空指標</b>，不能再用。`);
    if(pv.i<0||pv.i>=v.len)throw rterr(node,`<b>指標超出範圍！</b>${N} 指到了 ${v.dims?`${esc(v.name)} 的第 ${pv.i} 格`:`${esc(v.name)}[${pv.i}]`}，可是 ${esc(v.name)} 只有 ${v.len} 格${v.dims?`（${v.dims[0]} × ${v.dims[1]}）`:""}。`,{oob:v.isArr&&!v.dims?{id:v.id,i:pv.i}:null});
    const label=cellName(v,pv.i);
    if(v.sdef)return wref(v,pv.i,label);
    return{v,i:pv.i,key:v.id+":"+pv.i,label};
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
  function contOf(n){
    if(n.k==="var"){let v=null;for(let i=S.scopes.length-1;i>=0&&!v;i--)v=S.scopes[i].get(n.name)||null;
      return v&&CONTS.includes(v.type)&&!v.isArr?{arr:v.values[0],elem:v.elem,elem2:v.elem2,owner:v,type:v.type,label:v.name,key:v.id+":k"}:null}
    if(n.k==="idx"){const b=contOf(n.a);if(b&&b.elem==="vector"){const i=contIdx(b,n);return{arr:b.arr[i],elem:b.elem2,elem2:null,owner:b.owner,type:"vector",label:`${b.label}[${i}]`,key:b.key+i+"_"}}}
    return null;
  }
  function contIdx(b,n){
    if(b.type!=="vector"&&b.type!=="deque")throw rterr(n,`${b.type} 不能用 [ ] 拿第幾個。${b.type==="list"?"list 要從頭一個一個走，例如 for (int x : "+esc(b.label)+")。":""}`);
    const i=Math.trunc(ev(n.i).v),L=esc(b.label),len=b.arr.length;
    if(i<0||i>=len)throw rterr(n,`<b>越界！</b><code>${L}</code> 現在只有 ${len} 個${len?`（${L}[0] ～ ${L}[${len-1}]）`:""}，程式卻存取了 ${L}[${i}]。<br>vector 不會自己變大：要多放東西，請用 push_back。`);
    return i;
  }
  function ref(n){
    if(n.k==="idx"){const b=contOf(n.a);if(b){const i=contIdx(b,n);return{v:b.owner,i:0,cont:true,arr:b.arr,ci:i,et:b.elem,ft:b.elem,elem2:b.elem2,key:b.key+i,label:`${b.label}[${i}]`}}}
    if(n.k==="deref"){
      const pv=ev(n.x);if(pv.t!=="ptr")throw rterr(n,`* 只能用在指標上，<code>${esc(txt(n.x))}</code> 不是指標。`);
      const r=derefRef(pv.v,n,txt(n.x));
      if(!S.quiet&&!n.arrow)note(`ℹ <code>*${esc(txt(n.x))}</code>：到 ${esc(txt(n.x))} 存的位址 ${fmtVal("ptr",pv.v)} 去，也就是 <b>${esc(r.label)}</b>。`);
      return r;
    }
    if(n.k==="mem"){
      if(!["var","idx","mem","deref"].includes(n.obj.k))throw rterr(n,"這個網頁只支援「變數.欄位」、「陣列[索引].欄位」或「指標->欄位」的寫法");
      const b=ref(n.obj);
      if(n.arrow&&b.whole&&!S.quiet)note(`ℹ <code>${esc(txt(n.obj.x))}</code> 指向 <b>${esc(b.label)}</b>，所以 <code>${esc(txt(n))}</code> 就是 <b>${esc(b.label)}.${esc(n.name)}</b>。`);
      if(!b.whole&&tyOf(b)==="ptr")throw rterr(n,`<code>${esc(txt(n.obj))}</code> 是<b>指標</b>，不是 struct，不能直接用「.」。要寫 <code>${esc(txt(n.obj))}-&gt;${esc(n.name)}</code> 或 <code>(*${esc(txt(n.obj))}).${esc(n.name)}</code>。<br>（<code>*p.${esc(n.name)}</code> 的意思是 *(p.${esc(n.name)})，因為「.」比「*」先算，所以括號不能少。）`);
      if(!b.whole)throw rterr(n,`<code>${esc(txt(n.obj))}</code> 不是 struct，不能用 .${esc(n.name)}。`+(tyOf(b)==="string"?`（string 的 .length() 要加括號）`:""));
      const sd=b.v.sdef,fi=sd.fields.findIndex(f=>f.name===n.name);
      if(fi<0)throw rterr(n,`struct ${esc(sd.name)} 沒有叫做 <code>${esc(n.name)}</code> 的欄位。它的欄位有：${fieldList(sd)}。`);
      return{v:b.v,i:b.i+fi,ft:sd.fields[fi].type,fi,key:b.v.id+":"+(b.i+fi),label:`${b.label}.${n.name}`};
    }
    if(n.k==="var"){const v=lookup(n.name,n);if(v.isArr)throw rterr(n,`<code>${esc(v.name)}</code> 是陣列，要用 ${esc(v.name)}[索引] 指定是哪一格。`);if(v.sdef)return wref(v,0,v.name);return{v,i:0,key:v.id+":0",label:v.name}}
    if(n.k==="idx"&&n.a.k==="idx"&&n.a.a.k==="var"){
      const v=lookup(n.a.a.name,n.a.a);
      if(v.dims){
        const r=Math.trunc(ev(n.a.i).v),c=Math.trunc(ev(n.i).v),[R,C]=v.dims,N=esc(v.name),f=r*C+c;
        if(r<0||r>=R||c<0||c>=C){const hit=f>=0&&f<v.len;
          throw rterr(n,`<b>陣列越界！</b><code>${N}</code> 是 ${R} 列 × ${C} 行：列只能是 0 ～ ${R-1}，行只能是 0 ～ ${C-1}，程式卻存取了 ${N}[${r}][${c}]。<br>真正的 C++ 不會檢查，它直接算「第 ${r<0?`(${r})`:r} × ${C} + ${c<0?`(${c})`:c} = ${f} 格」`+(hit?`，碰到的其實是 <b>${N}[${Math.floor(f/C)}][${f%C}]</b>（別的格子被偷偷讀到或改掉）。`:"，已經超出整個陣列了。"),{oob:hit?{id:v.id,i:f}:null})}
        return{v,i:f,key:v.id+":"+f,label:`${v.name}[${r}][${c}]`};
      }
    }
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
      if(v.dims)throw rterr(n,`<code>${esc(v.name)}</code> 是二維陣列，<code>${esc(txt(n))}</code> 是<b>一整列</b>（${v.dims[1]} 格）。要再加一個 [行] 指定是哪一格，例如 ${esc(txt(n))}[0]。`);
      const i=Math.trunc(ev(n.i).v);
      if(v.sdef&&(i<0||i>=v.len))throw rterr(n,`<b>陣列越界！</b><code>${esc(v.name)}</code> 只有 ${v.len} 個 ${esc(v.sdef.name)}（${esc(v.name)}[0] ～ ${esc(v.name)}[${v.len-1}]），程式卻存取了 ${esc(v.name)}[${i}]。`,{oob:{id:v.id,i}});
      if(v.sdef)return wref(v,i,`${v.name}[${i}]`);
      if(i<0||i>=v.len)throw rterr(n,`<b>陣列越界！</b><code>${esc(v.name)}</code> 只有 ${v.len} 格（${esc(v.name)}[0] ～ ${esc(v.name)}[${v.len-1}]），程式卻存取了 ${esc(v.name)}[${i}]。<br>真正的 C++ 不會提醒你：可能讀到別的變數的值、偷偷改掉別的變數，或直接當掉。`,{oob:{id:v.id,i}});
      return{v,i,key:v.id+":"+i,label:`${v.name}[${i}]`};
    }
    throw rterr(n,"這裡需要一個變數");
  }
  // 讀一個位置目前的值（不算「讀取」，畫面不會標藍框）
  const peekv=r=>r.cont?{t:r.et,v:r.arr[r.ci],elem:r.elem2}:r.str?{t:"char",v:r.v.values[0].charCodeAt(r.si)||0}:r.whole?sval(r.v.sdef,wslots(r).map(k=>r.v.values[k]),wslots(r).map(k=>r.v.init[k])):{t:tyOf(r),v:r.v.values[r.i]};
  function load(r){
    if(r.cont){if(!S.quiet)S.read.add(r.key);return peekv(r)}
    if(r.str){
      if(!S.quiet){S.read.add(r.key);if(r.si===r.v.values[0].length)note(`ℹ <code>${esc(r.label)}</code> 剛好是字串的結尾，讀到的是 <b>'\\0'</b>（數值 0）。`)}
      return peekv(r);
    }
    if(r.whole){
      if(!S.quiet){const ks=wslots(r);ks.forEach(k=>S.read.add(r.v.id+":"+k));
        const bad=ks.filter(k=>!r.v.init[k]).map(k=>r.v.sdef.fields[k-r.i].name);
        if(bad.length)note(`⚠ <code>${esc(r.label)}</code> 的 ${bad.map(b=>`<code>${esc(b)}</code>`).join("、")} 還沒給過值，複製過去的是<b>垃圾值</b>。`)}
      return peekv(r);
    }
    if(!S.quiet){S.read.add(r.key);if(!r.v.init[r.i])note(`⚠ <code>${esc(r.label)}</code> 還沒給過值，讀到的是<b>垃圾值</b> ${fmtVal(tyOf(r),r.v.values[r.i])}。`)}
    return{t:tyOf(r),v:r.v.values[r.i]};
  }
  function store(r,val){
    if(r.cont){r.arr[r.ci]=conv(r.et,val);S.changed.add(r.key);return}
    if(r.str){
      const str=r.v.values[0];
      if(r.si>=str.length)throw rterr(r.node,`<b>字串越界！</b>${esc(r.v.name)} 的長度是 ${str.length}，不能改 ${esc(r.label)}。要讓字串變長，請用 + 接上去。`);
      const c=conv("char",val);r.v.values[0]=str.slice(0,r.si)+String.fromCharCode(c<0?c+256:c)+str.slice(r.si+1);S.changed.add(r.key);return;
    }
    if(r.whole){wslots(r).forEach((k,f)=>{r.v.values[k]=val.v.vals[f];r.v.init[k]=val.v.init[f];S.changed.add(r.v.id+":"+k)});return}
    r.v.values[r.i]=conv(tyOf(r),val);r.v.init[r.i]=true;S.changed.add(r.key);
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
      case"idx":{
        if(n.a.k==="var"){const v=lookup(n.a.name,n.a);
          if(v.dims){const r=Math.trunc(ev(n.i).v);if(r<0||r>=v.dims[0])throw rterr(n,`<b>陣列越界！</b><code>${esc(v.name)}</code> 只有 ${v.dims[0]} 列（0 ～ ${v.dims[0]-1}），沒有第 ${r} 列。`);
            if(!S.quiet)S.read.add(v.id+":"+r*v.dims[1]);return pval(v,r*v.dims[1])}}
        return load(ref(n));
      }
      case"deref":return load(ref(n));
      case"mem":{
        if(["var","idx","mem","deref"].includes(n.obj.k))return load(ref(n));
        const o=ev(n.obj);if(o.t!=="struct")throw rterr(n,`<code>${esc(txt(n.obj))}</code> 不是 struct，不能用 .${esc(n.name)}。`);
        const fi=o.v.sdef.fields.findIndex(f=>f.name===n.name);
        if(fi<0)throw rterr(n,`struct ${esc(o.v.sdef.name)} 沒有叫做 <code>${esc(n.name)}</code> 的欄位。它的欄位有：${fieldList(o.v.sdef)}。`);
        return{t:o.v.sdef.fields[fi].type,v:o.v.vals[fi]};
      }
      case"addr":{
        if(n.x.k==="var"){const v=lookup(n.x.name,n.x);if(v.isArr)return pval(v,0)}
        const r=ref(n.x);if(r.str)throw rterr(n,"這個網頁還不支援取 string 裡某個字元的位址");if(r.cont)throw rterr(n,"這個網頁還不支援取 vector 元素的位址");
        if(r.whole){const sz=r.v.sdef.size;return{t:"ptr",v:{id:r.v.id,i:r.elem,addr:r.v.addr+r.elem*sz,sz},elem:"struct"}}
        if(r.v.sdef)throw rterr(n,"這個網頁還不支援取 struct 欄位的位址");
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
        if(a.t==="struct"||b.t==="struct"){const sv=a.t==="struct"?a:b,f0=sv.v.sdef.fields.find(f=>f.type!=="string")||sv.v.sdef.fields[0];
          throw rterr(n,`整個 struct 不能直接用 <code>${esc(n.op)}</code> ${["<","<=",">",">=","==","!="].includes(n.op)?"比較":"計算"}，C++ 不知道要比哪一個欄位。請指定欄位，例如 <code>a.${esc(f0.name)} ${esc(n.op)} b.${esc(f0.name)}</code>。`)}
        const num=q=>q.t==="ptr"?(q.v===null?0:q.v.addr):q.v;
        if(["<","<=",">",">=","==","!="].includes(n.op)){const x=num(a),y=num(b);return B({"<":x<y,"<=":x<=y,">":x>y,">=":x>=y,"==":x===y,"!=":x!==y}[n.op])}
        return arith(n.op,a,b,n);
      }
      case"un":{const a=ev(n.x);if(a.t==="struct")throw rterr(n,"整個 struct 不能這樣算，請指定欄位");if(n.op==="!")return B(!truthy(a));const t=a.t==="double"?"double":a.t==="ll"?"ll":"int";return{t,v:n.op==="-"?-a.v:a.v}}
      case"cast":{const a=ev(n.x);return{t:n.type,v:conv(n.type,a)}}
      case"ucall":return callFn(n);
      case"vnew":{const k=n.args.length?Math.trunc(ev(n.args[0]).v):0,f=n.args[1]?conv(n.elem,ev(n.args[1])):n.elem==="string"?"":0;
        if(k<0||k>200)throw rterr(n,"vector 的大小要在 0 ～ 200 之間");return{t:"vector",v:Array(k).fill(f),elem:n.elem}}
      case"new":{
        if(S.quiet)throw IMPURE;
        const sd=n.sdef,sz=sd?sd.size:SIZE[n.type],TN=sd?sd.name:TNAME[n.type];
        const v={id:idc++,name:`${sd?"新節點":"新空間"}${++S.hn}`,type:n.type,elem:null,isArr:false,len:1,addr:S.haddr,values:[],init:[],scope:"heap",heap:true};
        if(sd)v.sdef=sd;
        S.haddr+=Math.ceil(sz/16)*16+16;
        const types=sd?sd.fields.map(f=>f.type):[n.type];
        types.forEach(ft=>{const[x,ok]=n.zero?[ft==="string"?"":ft==="ptr"?null:0,true]:fresh(ft,false);v.values.push(x);v.init.push(ok)});
        S.vars.push(v);
        if(n.brace){if(!sd)throw rterr(n,"這個網頁只支援 new struct{ ... } 這種寫法");fillStruct(v,0,n.brace.items,n)}
        else if(n.init){const x=ev(n.init);chkStruct(n.init,null,x,v.name);store({v,i:0,key:v.id+":0"},x)}
        else types.forEach((t,k)=>S.changed.add(v.id+":"+k));
        const garb=v.init.some(x=>!x);
        note(`ℹ <code>${esc(txt(n))}</code>：在 <b>heap</b> 借一塊 ${sz} bytes 的 ${esc(TN)}（畫面上叫它 <b>${v.name}</b>），把它的位址 ${fmtVal("ptr",{addr:v.addr})} 交回來。這塊空間<b>沒有名字</b>，只能靠指標找到它${garb?"；裡面還沒給值，是<b>垃圾值</b>":""}。`);
        return{t:"ptr",v:{id:v.id,i:0,addr:v.addr,sz},elem:sd?"struct":n.type};
      }
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
        const r=ref(n.x);if(r.whole)throw rterr(n,`<code>${esc(r.label)}</code> 是整個 struct，不能 ${n.op}。要指定欄位，例如 ${esc(r.label)}.${esc(r.v.sdef.fields[0].name)}${n.op}`);const old=load(r);const nv=arith(n.op==="++"?"+":"-",old,{t:"int",v:1},n);store(r,nv);
        const now=peekv(r);
        S.info={kind:"inc",label:r.label,op:n.op,old:fmtVal(old.t,old.v),now:fmtVal(now.t,now.v)};
        return n.k==="pre"?now:old;
      }
      case"assign":{
        if(S.quiet)throw IMPURE;
        const r=ref(n.l);const pre=subOf(n.r);const oldInit=r.v.init[r.i];const o0=peekv(r),oldV=fmtVal(o0.t,o0.v);
        let val=ev(n.r);const rv=fmtVal(val.t,val.v);
        if(n.op!=="="&&(r.whole||val.t==="struct"))throw rterr(n,`整個 struct 不能用 ${esc(n.op)}，請指定欄位。`);
        chkStruct(n,r.whole?r.v.sdef:null,val,r.label);
        if(tyOf(r)==="ptr"&&!r.str&&n.op==="="&&val.t!=="ptr"&&!(val.v===0&&val.t==="int"))throw rterr(n,`<code>${esc(r.label)}</code> 是指標，只能放「位址」（例如 &amp;a）或 nullptr。`);
        if(val.t==="ptr"&&tyOf(r)!=="ptr")throw rterr(n,`<code>${esc(txt(n.r))}</code> 是位址，不能放進 ${TNAME[tyOf(r)]} 變數 <code>${esc(r.label)}</code>。是不是忘了加 *？`);
        if(n.op!=="="){const cur=load(r);val=arith(n.op[0],cur,val,n)}
        if(S.inCond&&n.op==="=")note(`⚠ 條件裡的 <code>=</code> 是「<b>指定</b>」，不是比較！<code>${esc(r.label)}</code> 被設成 ${fmtVal(o0.t,conv(o0.t,val))}。比較要用 <code>==</code>。`);
        store(r,val);const nw=peekv(r);
        if(r.whole){const sd=r.v.sdef;S.info={kind:"msg",text:`<b>整個 struct 一起複製</b>：${sd.fields.map((f,k)=>`${esc(r.label)}.${esc(f.name)} = ${esc(fmtVal(f.type,nw.v.vals[k]))}`).join("、")}。<br>每個欄位都複製了一份，之後改 ${esc(r.label)} 不會影響 <code>${esc(txt(n.r))}</code>。`};return nw}
        S.info={kind:"assign",label:r.label,op:n.op,rk:n.r.k,text:txt(n.r),sub:pre,raw:fmtVal(val.t,val.v),rv,val:fmtVal(nw.t,nw.v),old:oldV,oldInit};
        if(tyOf(r)==="ptr"&&!r.str)S.info={kind:"msg",text:nw.v===null?`把 nullptr 放進 <b>${esc(r.label)}</b>：${esc(r.label)} 現在<b>不指向任何東西</b>。`:`把位址 ${fmtVal("ptr",nw.v)} 放進 <b>${esc(r.label)}</b>：${esc(r.label)} 現在<b>指向 ${esc(targetLabel(nw.v))}</b>。`};
        return nw;
      }
      case"method":{
        if(n.obj.k==="var"&&n.obj.name==="cin"){
          if(n.name!=="ignore")throw rterr(n,"這個網頁只支援 cin.ignore()");
          if(S.quiet)throw IMPURE;return evIgnore(n);
        }
        const cb=contOf(n.obj);
        if(cb&&["vector","deque","list"].includes(cb.type))return contMethod(cb,n);
        if(n.obj.k==="mem"||n.obj.k==="idx"){const r=ref(n.obj);
          if(r.ft==="string"&&(n.name==="length"||n.name==="size")){if(!S.quiet)S.read.add(r.key);return{t:"int",v:r.v.values[r.i].length}}
          throw rterr(n,`<code>${esc(txt(n.obj))}</code> 不能用 .${esc(n.name)}()`)}
        const o=n.obj.k==="var"?lookup(n.obj.name,n.obj):null;
        if(o&&o.type==="stack"&&!o.isArr)return stackMethod(o,n);
        if(o&&o.type==="queue"&&!o.isArr)return queueMethod(o,n);
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
      case"var":{const v=lookup(n.name,n);s=v.isArr||v.sdef?v.name:fmtVal(v.type,v.values[0]);break}
      case"mem":{S.quiet=true;try{const x=ev(n);s=fmtVal(x.t,x.v)}catch(e){s=txt(n)}finally{S.quiet=false}break}
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
    for(const it of n.items){const ca=charArr(it);if(it.k==="endl")s+="\n";else if(it.k==="str")s+=it.v;else if(ca)s+=charArrText(ca,it);else{const x=ev(it);if(x.t==="struct")throw rterr(it,`cout 不能直接印整個 struct，要一個欄位一個欄位印，例如 cout << ${esc(txt(it))}.${esc(x.v.sdef.fields[0].name)}`);s+=fmtOut(x)}}
    S.out+=s;S.lastCout=s;return B(1);
  }
  function evCin(n){
    let ok=true;
    for(const tg of n.targets){
      const ca=charArr(tg.x);
      if(ca){ok=readCharArr(ca,tg)&&ok;continue}
      const r=ref(tg.x);const L=`<b>${esc(r.label)}</b>`,ty=tyOf(r);let msg;
      if(r.whole)throw rterr(tg.x,`cin 不能一次讀進整個 struct，要一個欄位一個欄位讀，例如 cin >> ${esc(r.label)}.${esc(r.v.sdef.fields[0].name)}`);
      if(S.fail){ok=false;msg=`cin 之前已經失敗了，這次<b>什麼都不做</b>，${L} 保持原值。`}
      else{
        let p=S.pos;while(p<S.inp.length&&/\s/.test(S.inp[p]))p++;
        const skipped=p>S.pos;
        if(p>=S.inp.length){S.pos=p;S.fail=true;ok=false;msg=`輸入緩衝區已經沒有資料了（讀到結尾 <b>EOF</b>）→ 讀取失敗，${L} 保持原值。`}
        else if(ty==="string"){const m=S.inp.slice(p).match(/^\S+/)[0];store(r,{t:"string",v:m});S.lastRead=[p,p+m.length];S.pos=p+m.length;msg=`${skipped?"跳過空白和換行，":""}string 一路讀到空白或換行為止：讀出「${esc(m)}」放進 ${L}。`}
        else if(ty==="char"){store(r,{t:"char",v:S.inp.charCodeAt(p)});S.lastRead=[p,p+1];S.pos=p+1;msg=`${skipped?"跳過空白和換行，":""}char 只拿<b>一個字元</b>：讀出「${esc(S.inp[p])}」放進 ${L}。`}
        else{
          const rest=S.inp.slice(p);
          const m=ty==="double"?rest.match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/):rest.match(/^[+-]?\d+/);
          if(!m){store(r,{t:"int",v:0});S.fail=true;ok=false;S.pos=p;msg=`讀到「${esc(S.inp[p])}」，不是數字 → <b>讀取失敗</b>，${L} 被設成 0。<br>從現在開始，所有的 cin 都會直接失敗。`}
          else{store(r,{t:ty==="double"?"double":"ll",v:ty==="double"?parseFloat(m[0]):parseInt(m[0],10)});S.lastRead=[p,p+m[0].length];S.pos=p+m[0].length;
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
        if(pm.arr&&!pm.arr2&&v.dims)throw rterr(a,`<code>${esc(a.name)}</code> 是二維陣列，參數要寫成 ${esc(pm.name)}[][${v.dims[1]}]（第二個大小一定要寫）。`);
        if(pm.arr2&&!v.dims)throw rterr(a,`參數 <code>${esc(pm.name)}</code> 是二維陣列，但 <code>${esc(a.name)}</code> 不是。`);
        if(pm.arr2&&Math.trunc(ev(pm.arr2).v)!==v.dims[1])throw rterr(a,`參數 <code>${esc(pm.name)}</code> 每一列 ${Math.trunc(ev(pm.arr2).v)} 格，但 <code>${esc(a.name)}</code> 每一列 ${v.dims[1]} 格，對不起來。`);
        if(pm.ref&&v.isArr)throw rterr(a,`<code>${esc(a.name)}</code> 是陣列，參數要寫成 ${esc(pm.name)}[]。`);
        if((pm.sdef||v.sdef)&&pm.sdef!==v.sdef)throw rterr(a,`參數 <code>${esc(pm.name)}</code> 是 ${pm.sdef?esc(pm.sdef.name):TNAME[pm.type]}，但 <code>${esc(a.name)}</code> 是 ${v.sdef?esc(v.sdef.name):TNAME[v.type]}。`);
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
        chkStruct(n,b.pm.sdef,b.val,b.pm.name);
        declElem=b.pm.elem;declSdef=b.pm.sdef;const v=declare(b.pm.type,b.pm.name,null,n,false);declElem=null;declSdef=null;if(b.pm.psdef)v.psdef=b.pm.psdef;
        const r=v.sdef?wref(v,0,v.name):{v,i:0,key:v.id+":0"};store(r,b.val);const sh=peekv(r);
        parts.push(`${N} = ${esc(fmtVal(sh.t,sh.v))}${v.sdef?"（整個 struct <b>複製</b>一份）":""}${b.dflt?"（沒給，用<b>預設值</b>）":""}`)}
    }
    const caller=S.frames[S.frames.length-2].label;
    snap(n,`呼叫 <code>${esc(txt(n))}</code>：從 ${caller} 跳進 <b>${esc(n.f)}</b> 函式，記憶體多開一層。`+(parts.length?`<br>參數：${parts.join("，")}。`:""));
    let ret=null,at={s:F.body.close,e:F.body.close+1};
    try{for(const st of F.body.body)exec(st)}
    catch(e){if(e&&e.fret){ret=e.val;at=e.node}else throw e}
    let out=null;
    if(F.ret!=="void"){
      if(ret===null){note(`⚠ <b>${esc(n.f)}</b> 應該要 return 一個 ${F.retS?esc(F.retS.name):TNAME[F.ret]}，可是沒有 return 就結束了，帶回去的是<b>垃圾值</b>。`);
        out=F.retS?sval(F.retS,F.retS.fields.map(f=>f.type==="string"?"":GARB[f.type][0]),F.retS.fields.map(f=>f.type==="string")):{t:F.ret,v:F.ret==="string"?"":GARB[F.ret]?GARB[F.ret][0]:0}}
      else if(F.retS){chkStruct(at,F.retS,ret,n.f+"() 的回傳值");out=ret}
      else{
        chkStruct(at,null,ret,n.f+"() 的回傳值");
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
  function contMethod(b,n){
    const a=b.arr,N=esc(b.label),T=b.type,E=b.elem,need=k=>{if(n.args.length!==k)throw rterr(n,`${N}.${n.name}() ${k?"裡面要放一個值":"的括號裡不用放東西"}`)};
    const nonEmpty=()=>{if(!a.length)throw rterr(n,`<b>${T} 是空的！</b><code>${N}</code> 裡面沒有東西，不能 ${n.name}()。<br>先用 <code>${N}.empty()</code> 或 <code>${N}.size()</code> 檢查。`)};
    const val=()=>{const x=ev(n.args[0]);if(E==="vector"&&!Array.isArray(x.v))throw rterr(n,`${N} 的每一個元素都是一個 vector，這裡要放 vector`);return conv(E,x)};
    const show=x=>Array.isArray(x)?fmtVal("vector",x):fmtVal(E,x);
    const ok=new Set(T==="vector"?["push_back","pop_back","front","back","size","empty","clear"]:["push_back","push_front","pop_back","pop_front","front","back","size","empty","clear"]);
    if(!ok.has(n.name))throw rterr(n,`${T} 沒有 .${esc(n.name)}()。${T==="vector"&&/front/.test(n.name)?"vector 只能從後面加、從後面拿（push_back、pop_back）；兩頭都要進出請用 deque。":""}可以用：${[...ok].join("、")}`);
    const mut=()=>{if(S.quiet)throw IMPURE};
    switch(n.name){
      case"push_back":{need(1);mut();const v=val();a.push(v);S.changed.add(b.key+(a.length-1));
        S.info={kind:"msg",text:`<code>${esc(txt(n))}</code>：在 ${N} 的<b>最後面</b>加上 ${show(v)}，現在有 ${a.length} 個。`};return B(1)}
      case"push_front":{need(1);mut();const v=val();a.unshift(v);S.changed.add(b.key+"0");
        S.info={kind:"msg",text:`<code>${esc(txt(n))}</code>：在 ${N} 的<b>最前面</b>加上 ${show(v)}，現在有 ${a.length} 個。`};return B(1)}
      case"pop_back":{need(0);mut();nonEmpty();const v=a.pop();S.changed.add(b.key);
        S.info={kind:"msg",text:`<code>${esc(txt(n))}</code>：把<b>最後面</b>的 ${show(v)} 拿掉，剩下 ${a.length} 個。`};return B(1)}
      case"pop_front":{need(0);mut();nonEmpty();const v=a.shift();S.changed.add(b.key);
        S.info={kind:"msg",text:`<code>${esc(txt(n))}</code>：把<b>最前面</b>的 ${show(v)} 拿掉，剩下 ${a.length} 個。`};return B(1)}
      case"clear":{need(0);mut();a.length=0;S.changed.add(b.key);S.info={kind:"msg",text:`<code>${esc(txt(n))}</code>：把 ${N} 清空，現在 0 個。`};return B(1)}
      case"front":{need(0);nonEmpty();if(!S.quiet)S.read.add(b.key+"0");return{t:E,v:a[0],elem:b.elem2}}
      case"back":{need(0);nonEmpty();if(!S.quiet)S.read.add(b.key+(a.length-1));return{t:E,v:a[a.length-1],elem:b.elem2}}
      case"empty":{need(0);if(!S.quiet)S.read.add(b.key);return B(!a.length)}
      case"size":{need(0);if(!S.quiet)S.read.add(b.key);return{t:"int",v:a.length}}
    }
  }
  function queueMethod(o,n){
    const a=o.values[0],N=esc(o.name),need=k=>{if(n.args.length!==k)throw rterr(n,`${N}.${n.name}() ${k?"裡面要放一個值":"的括號裡不用放東西"}`)};
    const nonEmpty=()=>{if(!a.length)throw rterr(n,`<b>queue 是空的！</b><code>${N}</code> 裡面沒有東西，不能 ${n.name}()。<br>先用 <code>${N}.empty()</code> 檢查，不是空的才能拿。`)};
    switch(n.name){
      case"push":{need(1);if(S.quiet)throw IMPURE;const x=ev(n.args[0]),v=conv(o.elem,x);a.push(v);S.changed.add(o.id+":k"+(a.length-1));
        S.info={kind:"msg",text:`<code>${N}.push(${esc(txt(n.args[0]))})</code>：把 ${fmtVal(o.elem,v)} 排到 ${N} 的<b>最後面</b>，現在有 ${a.length} 個。`};return B(1)}
      case"pop":{need(0);if(S.quiet)throw IMPURE;nonEmpty();const v=a.shift();S.changed.add(o.id+":0");
        S.info={kind:"msg",text:`<code>${N}.pop()</code>：把<b>最前面</b>的 ${fmtVal(o.elem,v)} 拿走，剩下 ${a.length} 個。`+(a.length?`現在最前面是 ${fmtVal(o.elem,a[0])}。`:"現在是空的。")};return B(1)}
      case"front":{need(0);nonEmpty();if(!S.quiet)S.read.add(o.id+":k0");return{t:o.elem,v:a[0]}}
      case"back":{need(0);nonEmpty();if(!S.quiet)S.read.add(o.id+":k"+(a.length-1));return{t:o.elem,v:a[a.length-1]}}
      case"empty":{need(0);if(!S.quiet)S.read.add(o.id+":0");return B(!a.length)}
      case"size":{need(0);if(!S.quiet)S.read.add(o.id+":0");return{t:"int",v:a.length}}
      case"top":throw rterr(n,`queue 沒有 top()。queue 是排隊：看最前面用 <code>${N}.front()</code>，看最後面用 <code>${N}.back()</code>。`);
    }
    throw rterr(n,`queue 沒有 .${esc(n.name)}()，可以用 push、pop、front、back、empty、size`);
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
    const r=ref(n.x);if(r.str||tyOf(r)!=="string")throw rterr(n.x,"getline 要讀進 string 變數");
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
  function declAlias(it,type,sd){
    if(it.size||it.auto||it.list)throw rterr(it,"這個網頁還不支援陣列的參考");
    const x=it.init;
    if(!x||x.k!=="var")throw rterr(it,`參考（別名）要綁定一個變數，例如 int &${esc(it.name)} = a;，不能綁數字或算式。`);
    const v=lookup(x.name,x);
    if(v.isArr)throw rterr(it,"這個網頁還不支援陣列的參考");
    if(v.type!==type||(v.sdef||null)!==(sd||null))throw rterr(it,`<code>${esc(x.name)}</code> 是 ${v.sdef?esc(v.sdef.name):TNAME[v.type]}，不能當 ${sd?esc(sd.name):TNAME[type]} 的別名。`);
    const sc=S.scopes[S.scopes.length-1];
    if(sc.has(it.name))throw rterr(it,`<code>${esc(it.name)}</code> 在同一個區塊裡宣告了兩次。`);
    sc.set(it.name,v);(sc.aliases||(sc.aliases=new Set())).add(it.name);
    const fk=S.frames[S.frames.length-1].key;
    S.refs.push({frame:fk,name:it.name,target:v.name,tid:v.id,targetFrame:frameName(v),alias:true,sc});
    return `宣告參考 <b>${esc(it.name)}</b>：${esc(it.name)} 是 <b>${esc(v.name)}</b> 的<b>別名</b>，兩個名字指的是同一個格子，<b>沒有</b>開新的記憶體。`;
  }
  function declCont(it,d,global){
    if(it.size||it.auto)throw rterr(it,`${d.type} 不用寫 [ ]，大小可以寫在小括號裡，例如 ${d.type}<int> ${esc(it.name)}(5);`);
    const E=d.elem,T=`${d.type}&lt;${d.elem==="vector"?`vector&lt;${TNAME[d.elem2]}&gt;`:TNAME[E]}&gt;`;
    let arr=[],how;
    if(it.ctor){
      const k=it.ctor.length?Math.trunc(ev(it.ctor[0]).v):0;if(k<0||k>200)throw rterr(it,"大小要在 0 ～ 200 之間");
      let f=E==="vector"?[]:E==="string"?"":0,fv=null;
      if(it.ctor[1]){fv=ev(it.ctor[1]);if(E==="vector"&&!Array.isArray(fv.v))throw rterr(it,"每一個元素都是 vector，第二個值要放 vector，例如 vector<int>(4, 0)");f=conv(E,fv)}
      arr=Array.from({length:k},()=>dcopy(f));
      how=k?`一開始就有 <b>${k}</b> 個，每一個都是 ${Array.isArray(f)?fmtVal("vector",f):fmtVal(E,f)}${it.ctor[1]?"":"（沒給值就是 0）"}。`:"一開始是空的。";
    }else if(it.list){
      if(E==="vector")throw rterr(it,"這個網頁還不支援二維 vector 用 { } 給初始值，請用 vector<vector<int>> a(3, vector<int>(4, 0));");
      arr=it.list.map(x=>conv(E,ev(x)));how=`一開始放進 ${arr.length} 個：${fmtVal("vector",arr)}。`;
    }else if(it.init){
      const x=ev(it.init);if(!Array.isArray(x.v))throw rterr(it,`${d.type} 要用另一個 ${d.type} 或 { } 給初始值`);arr=dcopy(x.v);how=`複製 <code>${esc(txt(it.init))}</code> 的內容，共 ${arr.length} 個（是另外一份，不是同一個）。`;
    }else how="一開始是<b>空的</b>，裡面還沒有東西。";
    declElem=E;declElem2=d.elem2;const v=declare(d.type,it.name,null,it,global);declElem=null;declElem2=null;
    v.values[0]=arr;S.changed.add(v.id+":k");
    const tip={vector:"之後可以用 push_back 在後面加，用 [ ] 拿第幾個。",deque:"兩頭都可以加、都可以拿：push_front、push_back、pop_front、pop_back。",list:"像鏈結串列一樣一個接一個，兩頭都可以加、都可以拿，但不能用 [ ] 直接跳到第幾個。"}[d.type];
    return `宣告 <code>${T}</code> <b>${esc(it.name)}</b>：${how}${tip}`;
  }
  function declPtr(it,elem,global,sd){
    if(it.size||it.auto||it.list)throw rterr(it,"這個網頁還不支援指標陣列");
    const val=it.init?ev(it.init):null;
    if(val&&val.t!=="ptr"&&!(val.t==="int"&&val.v===0))throw rterr(it,`指標只能放「位址」（例如 &amp;a）或 nullptr。`);
    declElem=elem;const v=declare("ptr",it.name,null,it,global);declElem=null;if(sd)v.psdef=sd;
    const EN=sd?sd.name:TNAME[elem],N=`<b>${esc(it.name)}</b>`,T=`${EN}*`;
    if(val){store({v,i:0,key:v.id+":0"},val);const pv=v.values[0];
      return pv===null?`宣告指標 ${N}（${T}，8 bytes），放進 nullptr：現在不指向任何東西。`:`宣告指標 ${N}（${T}，8 bytes），放進位址 ${fmtVal("ptr",pv)}：${N} 現在<b>指向 ${esc(targetLabel(pv))}</b>。`}
    S.changed.add(v.id+":0");
    return global?`宣告指標 ${N}（${T}）：全域指標一開始是 nullptr。`:`宣告指標 ${N}（${T}，8 bytes）：用來存一個 ${esc(EN)} 的「位址」。還沒給值 → 裡面是亂七八糟的位址（<b>野指標</b>），還不能用 *${esc(it.name)}。`;
  }
  function fillStruct(v,e,items,node){
    const sd=v.sdef,F=sd.fields.length;
    if(items.length>F)throw rterr(node,`大括號裡有 ${items.length} 個值，但 struct ${esc(sd.name)} 只有 ${F} 個欄位：${fieldList(sd)}。`);
    sd.fields.forEach((f,k)=>{
      const x=items[k],slot=e*F+k;
      if(x){
        if(x.k==="brace")throw rterr(x,`欄位 ${esc(f.name)} 是 ${TNAME[f.type]}，這裡不用再包 { }。`);
        const val=ev(x);chkStruct(x,null,val,f.name);
        if(f.type==="ptr"?!(val.t==="ptr"||val.t==="int"&&val.v===0):val.t==="ptr")throw rterr(x,f.type==="ptr"?`欄位 <code>${esc(f.name)}</code> 是指標，只能放位址或 nullptr。`:`欄位 <code>${esc(f.name)}</code> 是 ${TNAME[f.type]}，不能放位址。`);
        if((f.type==="string")!==(val.t==="string"||val.t==="char"&&f.type==="string"))throw rterr(x,`欄位 <code>${esc(f.name)}</code> 是 ${TNAME[f.type]}，不能放 ${esc(txt(x))}。大括號裡的值要照<b>欄位的順序</b>寫：${fieldList(sd)}。`);
        v.values[slot]=conv(f.type,val);
      }else v.values[slot]=f.type==="string"?"":0;
      v.init[slot]=true;S.changed.add(v.id+":"+slot);
    });
  }
  function declStruct(it,sd,global){
    const N=`<b>${esc(it.name)}</b>`,T=esc(sd.name),pad=sd.size-sd.fields.reduce((a,f)=>a+f.size,0);
    const sizeNote=`共 ${sd.size} bytes${pad?`（其中 ${pad} bytes 是對齊用的空隙）`:""}`;
    let len=null;
    if(it.size){len=Math.trunc(ev(it.size).v);if(len<=0)throw rterr(it,"陣列大小必須大於 0");if(len>60)throw rterr(it,"這個網頁最多只能顯示 60 個 struct，請開小一點。")}
    if(it.auto){if(!it.list)throw rterr(it,"[ ] 裡沒寫大小時，一定要給初始值");len=it.list.length;if(!len)throw rterr(it,"陣列大小必須大於 0")}
    const val=it.init?ev(it.init):null;
    if(val){if(len!=null)throw rterr(it,"struct 陣列要用 { {...}, {...} } 給初始值");chkStruct(it.init,sd,val,it.name)}
    declSdef=sd;const v=declare("struct",it.name,len,it,global);declSdef=null;
    const F=sd.fields.length;
    if(len!=null){
      if(it.list){
        if(it.list.length>len)throw rterr(it,`大括號裡有 ${it.list.length} 個值，但陣列只有 ${len} 格。`);
        for(let e=0;e<len;e++){const x=it.list[e];
          if(x&&x.k!=="brace")throw rterr(x,`struct 陣列的每一個元素都要用 { } 包起來，例如 {"Amy", 90}。`);
          fillStruct(v,e,x?x.items:[],it)}
        return `宣告 struct 陣列 ${N}：連續 ${len} 個 ${T}，每個 ${sd.size} bytes。每個元素的值照欄位順序寫在 { } 裡`+(it.list.length<len?`，<b>沒給到的元素每個欄位都補 0</b>。`:"。");
      }
      for(let k=0;k<len*F;k++)S.changed.add(v.id+":"+k);
      return `宣告 struct 陣列 ${N}：連續 ${len} 個 ${T}，每個 ${T} 都有 ${fieldList(sd)}，${sizeNote}。`+(global?"全域的會<b>自動設成 0</b>。":sd.fields.some(f=>f.type!=="string")?"沒有初始化 → string 欄位是空字串，其他欄位都是<b>垃圾值</b>。":"");
    }
    if(it.list){
      fillStruct(v,0,it.list,it);
      return `宣告 ${T} ${N}（${sizeNote}），大括號裡的值<b>照欄位的順序</b>放進去：${sd.fields.map((f,k)=>`${esc(it.name)}.${esc(f.name)} = ${esc(fmtVal(f.type,v.values[k]))}`).join("、")}`+(it.list.length<F?`。沒給到的欄位<b>自動補 0</b>。`:"。");
    }
    if(val){
      store(wref(v,0,it.name),val);
      return `宣告 ${T} ${N}，把 <code>${esc(txt(it.init))}</code> <b>整個複製</b>過來：每個欄位都複製一份（${sd.fields.map((f,k)=>`${esc(f.name)} = ${esc(fmtVal(f.type,v.values[k]))}`).join("、")}）。`;
    }
    for(let k=0;k<F;k++)S.changed.add(v.id+":"+k);
    return `宣告 ${T} ${N}：一個變數裡面<b>綁了 ${F} 個欄位</b>：${fieldList(sd)}，${sizeNote}。`+(global?"全域的會<b>自動設成 0</b>。":sd.fields.some(f=>f.type!=="string")?"沒有給初始值 → string 欄位是空字串，其他欄位是<b>垃圾值</b>。":"");
  }
  function decl2D(it,d,global){
    if(d.type==="stack"||d.type==="queue")throw rterr(it,"這個網頁還不支援 stack 陣列");
    const C=Math.trunc(ev(it.size2).v);if(C<=0)throw rterr(it,"陣列大小必須大於 0");
    let R;if(it.auto){if(!it.list)throw rterr(it,"[ ] 裡沒寫大小時，一定要給初始值");R=it.list.length}else R=Math.trunc(ev(it.size).v);
    if(R<=0)throw rterr(it,"陣列大小必須大於 0");
    if(R*C>200)throw rterr(it,`${R} × ${C} = ${R*C} 格，這個網頁最多只能顯示 200 格，請開小一點。`);
    if(it.init)throw rterr(it,"二維陣列要用 { } 給初始值，例如 {{1, 2}, {3, 4}}");
    declElem=d.elem;const v=declare(d.type,it.name,R*C,it,global);declElem=null;v.dims=[R,C];
    const N=`<b>${esc(it.name)}</b>`,T=TNAME[d.type];
    const head=`宣告二維陣列 ${N}：一個 <b>${R} 列 × ${C} 行</b>的表格，共 ${R*C} 格 ${T}。<code>${esc(it.name)}[i][j]</code> 是第 i 列、第 j 行那一格（列和行都從 0 開始數）。`;
    for(let k=0;k<R*C;k++)S.changed.add(v.id+":"+k);
    if(!it.list)return head+(global?"全域陣列會<b>自動全部設成 0</b>。":"沒有初始化 → 每一格都是<b>垃圾值</b>。");
    const put=(f,x)=>{if(x.k==="brace")throw rterr(x,"大括號包太多層了：二維陣列最多兩層 { { } }");v.values[f]=conv(d.type,ev(x));v.init[f]=true};
    for(let f=0;f<R*C;f++){v.values[f]=d.type==="string"?"":0;v.init[f]=true}
    const rows=it.list.length>0&&it.list.every(x=>x.k==="brace");
    if(rows){
      if(it.list.length>R)throw rterr(it,`大括號裡有 ${it.list.length} 列，但 ${esc(it.name)} 只有 ${R} 列。`);
      it.list.forEach((rw,r)=>{if(rw.items.length>C)throw rterr(rw,`第 ${r} 列給了 ${rw.items.length} 個值，但每一列只有 ${C} 格。`);rw.items.forEach((x,c)=>put(r*C+c,x))});
      const full=it.list.length===R&&it.list.every(rw=>rw.items.length===C);
      return head+`每一組 { } 是一列，照順序放進第 0 列、第 1 列……`+(full?"":"沒給到的格子<b>自動補 0</b>。");
    }
    if(it.list.some(x=>x.k==="brace"))throw rterr(it,"大括號的寫法要一致：要嘛每一列都用 { } 包起來，要嘛全部不包");
    if(it.list.length>R*C)throw rterr(it,`大括號裡有 ${it.list.length} 個值，但 ${esc(it.name)} 只有 ${R*C} 格。`);
    it.list.forEach((x,f)=>put(f,x));
    return head+(it.list.length?`大括號裡沒有分列，就照順序<b>一列填滿再換下一列</b>`+(it.list.length<R*C?"，沒給到的格子自動補 0。":"。"):"<code>{ }</code> 裡什麼都沒寫 → 全部設成 0。");
  }
  function execDecl(d,global){
    const parts=[];const T=TNAME[d.type],sz=SIZE[d.type];const B_=n=>`${n} byte${n>1?"s":""}`;
    for(const it of d.items){
      if(["vector","deque","list"].includes(d.type)&&!it.ref&&!it.ptr){parts.push(declCont(it,d,global));continue}
      if(it.ref){parts.push(declAlias(it,d.type,d.sdef));continue}
      if(d.sdef&&!it.ptr){parts.push(declStruct(it,d.sdef,global));continue}
      if(it.ptr){parts.push(declPtr(it,d.type,global,d.sdef));continue}
      if(it.size2){parts.push(decl2D(it,d,global));continue}
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
      }else if(d.type==="queue"){
        S.changed.add(v.id+":0");
        parts.push(`宣告 <code>queue&lt;${TNAME[d.elem]}&gt;</code> ${N}：一個空的 queue，裡面還沒有東西。之後用 push 從<b>後面</b>放進去、pop 從<b>前面</b>拿出來，像排隊一樣。`);
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
  function leakNote(){const h=S.vars.filter(v=>v.heap);if(h.length)note(`ℹ heap 裡還有 ${h.length} 塊 new 出來的空間沒有 delete（${h.map(v=>esc(v.name)).join("、")}）。程式結束時系統會收回；但一直執行的程式（例如伺服器）如果忘了 delete，記憶體會越用越多（<b>記憶體洩漏</b>）。`)}
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
      case"delete":{
        const pv=ev(st.x),T=`<code>${esc(txt(st.x))}</code>`;
        if(pv.t!=="ptr")throw rterr(st,`delete 後面要放指標，${T} 不是指標。`);
        if(pv.v===null){snap(st,`${T} 是 nullptr，<code>delete</code> 什麼都不做。`);return}
        if(pv.v.id<0)throw rterr(st,`${T} 是<b>野指標</b>（還沒給值），不能 delete。`);
        const v=S.vars.find(x=>x.id===pv.v.id);
        if(!v)throw rterr(st,`${T} 指的空間<b>已經 delete 過了</b>！同一塊空間 delete 兩次，真正的程式會當掉。`);
        if(!v.heap)throw rterr(st,`${T} 指向 <code>${esc(v.name)}</code>，那是一般變數，會自動收回。<b>只有 new 借來的空間</b>才能 delete。`);
        S.vars=S.vars.filter(x=>x!==v);
        snap(st,`<code>delete ${esc(txt(st.x))}</code>：把 ${T} 指的 <b>${esc(v.name)}</b> 還給系統。<br>${T} 自己沒有變，還存著舊的位址 → 現在是<b>懸空指標</b>，不能再用 *${esc(txt(st.x))} 或 ${esc(txt(st.x))}-&gt;...（常常接著寫 ${esc(txt(st.x))} = nullptr;）。`);
        return;
      }
      case"rfor":{
        if(st.ref)throw rterr(st,`這個網頁還不支援 for (${esc(TNAME[st.type]||st.type)} &amp;${esc(st.name)} : …)，請先寫 for (${esc(TNAME[st.type]||st.type)} ${esc(st.name)} : …)。`);
        let get,len,label=esc(txt(st.x)),et,kOf;
        const cb=contOf(st.x);
        if(cb){if(cb.type==="stack"||cb.type==="queue")throw rterr(st,`${cb.type} 不能用 for ( : ) 走訪，只能看最${cb.type==="stack"?"上面":"前面"}那一個。`);
          get=k=>cb.arr[k];len=()=>cb.arr.length;et=cb.elem;kOf=k=>cb.key+k}
        else if(st.x.k==="var"){const v=lookup(st.x.name,st.x);
          if(v.isArr&&!v.dims&&!v.sdef){get=k=>v.values[k];len=()=>v.len;et=v.type;kOf=k=>v.id+":"+k}
          else if(v.type==="string"&&!v.isArr){get=k=>v.values[0].charCodeAt(k);len=()=>v.values[0].length;et="char";kOf=k=>v.id+":c"+k}
          else throw rterr(st,`<code>${label}</code> 不能用 for ( : ) 走訪`)}
        else throw rterr(st,"for ( : ) 的冒號後面要放一個 vector、陣列或字串");
        const n0=len();
        snap(st,`<code>for (${esc(TNAME[st.type]||st.type)} ${esc(st.name)} : ${label})</code>：從 ${label} 的第一個開始，<b>依序拿出每一個</b>，一共 ${n0} 個。`);
        for(let k=0;k<len();k++){
          S.scopes.push(new Map());
          declElem=st.elem;const v=declare(st.type,st.name,null,st,false);declElem=null;
          store({v,i:0,key:v.id+":0"},{t:et,v:dcopy(get(k))});S.read.add(kOf(k));
          snap(st,`第 ${k+1} 輪：把 ${label} 的第 ${k} 個（${esc(fmtVal(et==="vector"?"vector":et,get(k)))}）複製一份放進 <b>${esc(st.name)}</b>。`);
          const r=loopBody(st.body);
          popScope(null);
          if(r==="brk")break;
        }
        snap(st,`${label} 的每一個都拿過了，<b>離開迴圈</b>。`);return;
      }
      case"break":snap(st,"<code>break</code>：立刻跳出最近的那一層迴圈。");throw BRK;
      case"continue":snap(st,"<code>continue</code>：這一輪剩下的不做了，直接進入下一輪（for 迴圈會先做「更新」）。");throw CNT;
      case"return":
        if(S.frames.length>1){const val=st.x?ev(st.x):null;throw{fret:true,val:val||{t:"void",v:0},node:st}}
        if(st.x)ev(st.x);leakNote();snap(st,"<code>return 0</code>：main 結束，程式結束。");throw RET;
    }
  }
  try{
    S.scopes.push(new Map());
    for(const g of prog.globals)execDecl(g,true);
    S.scopes.push(new Map());
    for(const s of prog.main.body)exec(s);
    leakNote();snap({s:prog.main.close,e:prog.main.close+1},"main 執行到最後，程式結束。");
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


