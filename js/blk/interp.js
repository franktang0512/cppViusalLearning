/* ================= Scratch / Blockly 課的執行器：一塊一塊執行積木，每一步記一張快照 =================
   直接讀 Blockly 存下來的 JSON（Blockly.serialization.workspaces.save），不轉成 JavaScript，
   所以就算沒有載入 Blockly（例如自動檢查），也能執行課程裡的積木。
   規則照 individual_demo（比賽練習系統）：
     輸入：測資用空白、換行、逗號切成一個一個的值，每次「詢問並等待」（Blockly 的「輸入」）拿下一個，數字會轉成數字；
           拿完了還要詢問，就是「輸入（詢問）次數過多」。
     Scratch 模式：從「當 🏁 被點擊」開始，一定要剛好一塊；四則運算會把文字轉成數字，除以 0 算成 0；清單從第 1 項開始。
     Blockly 模式：沒有綠旗，工作區最上層的積木由上而下執行；算法跟 JavaScript 一樣（"3" + 2 會變成 "32"）。
   快照的格式跟 C++ 的一樣（out、pos、lastRead、note、done、error……），所以步驟控制、追蹤表、判題都能共用；
   積木課自己的資料放在 s.blk（變數、清單、函式的參數），s.bid 是這一步亮起來的那一塊積木。 */
const BLK_LIMIT=3000;
function blkRun(src,input){
  const tx=(zh,en)=>typeof T==="function"?T(zh,en):zh;
  const e=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const trace=[];
  let J;try{J=typeof src==="string"?(src.trim()?JSON.parse(src):{}):src||{}}catch(x){J=null}
  const errOnly=msg=>({trace:[{line:0,note:`<div class="err">💥 ${msg}</div>`,out:"",pos:0,vars:[],changed:[],read:[],error:true,done:true,blk:{vars:[],lists:[],frames:[]}}]});
  if(!J)return errOnly(tx("積木的資料壞掉了，讀不出來。","The block data is broken and cannot be read."));
  const tops=(J.blocks&&J.blocks.blocks)||[];
  const varInfo=new Map((J.variables||[]).map(v=>[v.id,v]));
  const scratch=tops.some(b=>/^(event_|scratch_)/.test(b.type));
  const procs=new Map();tops.filter(b=>b.type==="procedures_defnoreturn"||b.type==="procedures_defreturn").forEach(b=>procs.set(b.fields&&b.fields.NAME,b));
  // Scratch 模式的自訂積木（scratch_function_*）：名字和參數記在 extraState 的 <mutation name="…"><arg name="…" type="…"/></mutation> 裡
  const xmlUn=s=>s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,"&");
  const attr=(tag,n)=>{const m=new RegExp("\\b"+n+'="([^"]*)"').exec(tag);return m?xmlUn(m[1]):null};
  const fnInfo=b=>{const x=typeof b.extraState==="string"?b.extraState:"",head=/<mutation\b[^>]*>/.exec(x),ps=[],re=/<arg\b[^>]*>/g;let a;
    while((a=re.exec(x))){const n=attr(a[0],"name");if(n!==null)ps.push({name:n,type:attr(a[0],"type")||"NumberString"})}
    return{name:(head&&attr(head[0],"name"))??((b.fields&&b.fields.NAME)||""),params:ps}};
  const sfns=new Map();tops.filter(b=>b.type==="scratch_function_definition").forEach(b=>sfns.set(fnInfo(b).name,b));
  const isDef=b=>/^procedures_def/.test(b.type)||b.type==="scratch_function_definition";
  let starts;
  if(scratch){
    starts=tops.filter(b=>b.type==="event_whenflagclicked");
    if(starts.length!==1)return errOnly(starts.length?tx("Scratch 模式下，請恰好使用一個「當 🏁 被點擊」積木！","In Scratch mode, use exactly one \"when 🏁 clicked\" block!")
      :tx("找不到「當 🏁 被點擊」。程式要從這一塊開始，請到「事件」把它拉進工作區，下面接上要執行的積木。","Cannot find \"when 🏁 clicked\". The program starts from this block: drag it in from Events and put your blocks under it."));
  }else{
    // Blockly 模式：最上層的積木照位置由上而下（跟 Blockly 產生程式的順序一樣）
    starts=tops.filter(b=>!isDef(b)).sort((a,c)=>(a.y||0)-(c.y||0)||(a.x||0)-(c.x||0));
    if(!starts.length)return errOnly(tx("工作區裡還沒有積木。從左邊的分類把積木拖進來。","There are no blocks yet. Drag blocks in from the categories on the left."));
  }
  // ---------- 狀態 ----------
  const V=new Map(),LS=new Map();   // 變數（名字 → 值）、Scratch 的清單（名字 → 陣列）
  const params=new Set([...procs.values()].flatMap(d=>((d.extraState&&d.extraState.params)||[]).map(p=>p.name)));   // 函式的參數只在函式裡面
  (J.variables||[]).forEach(v=>{if(v.type==="list")LS.set(v.name,[]);else if(!params.has(v.name))V.set(v.name,scratch?0:undefined)});
  const frames=[];
  const S={out:"",pos:0,fail:false,answer:"",lastRead:null,changed:new Set(),read:new Set(),notes:[]};
  // 輸入切成一個一個的值（空白、換行、逗號隔開），記住每一個在輸入裡的位置（畫面標示用）
  const inp=input||"",toks=[];{const re=/[^\s,]+/g;let m;while((m=re.exec(inp)))toks.push({t:m[0],s:m.index,e:m.index+m[0].length})}
  let ti=0;
  const STOP={stop:1},BRK={brk:1},CNT={cnt:1},LIM={lim:1};
  // ---------- 小工具 ----------
  const inputOf=(b,n)=>b&&b.inputs&&b.inputs[n]?(b.inputs[n].block||b.inputs[n].shadow||null):null;
  const F=(b,n)=>b&&b.fields?b.fields[n]:undefined;
  const vname=(b,f="VAR")=>{const x=F(b,f);if(x&&typeof x==="object"){const v=varInfo.get(x.id);return v?v.name:(x.name||"?")}return String(x??"?")};
  const isNumStr=s=>typeof s==="string"&&s.trim()!==""&&!isNaN(+s);
  const toNum=v=>{const n=Number(v);return isNaN(n)?0:n};
  const jsStr=v=>v===undefined?"undefined":v===null?"null":Array.isArray(v)?v.map(jsStr).join(","):String(v);
  const show=v=>v===undefined?tx("（還沒有值）","(no value yet)"):typeof v==="string"?`「${e(v)}」`:Array.isArray(v)?`[${e(v.map(jsStr).join(", "))}]`:e(String(v));
  const truthy=v=>!!v;
  const note=m=>{if(!S.notes.includes(m))S.notes.push(m)};
  const findVar=n=>{for(let i=frames.length-1;i>=0;i--)if(frames[i].vars.has(n))return{m:frames[i].vars,k:"p"+i+":"+n};return{m:V,k:"v:"+n}};
  const getVar=n=>{const r=findVar(n);S.read.add(r.k);return r.m.get(n)};
  const setVar=(n,v)=>{const r=findVar(n);r.m.set(n,v);S.changed.add(r.k)};
  const list=n=>{if(!LS.has(n))LS.set(n,[]);return LS.get(n)};
  const cp=v=>Array.isArray(v)?v.slice():v;
  // ---------- 快照 ----------
  function snap(b,msg,extra={}){
    if(trace.length>=BLK_LIMIT)throw LIM;
    const warn=S.notes.length?`<div class="warn">${S.notes.join("<br>")}</div>`:"";
    const vars=[...V].map(([n,v])=>({name:n,val:cp(v)})),lists=[...LS].map(([n,a])=>({name:n,items:a.slice()}));
    const fr=frames.map(f=>({label:f.label,vars:[...f.vars].map(([n,v])=>({name:n,val:cp(v)}))}));
    // 追蹤表（跟 C++ 共用）：一個變數一欄
    const tv=[...vars.map(x=>({id:"v:"+x.name,name:x.name,type:"blk",isArr:Array.isArray(x.val),init:[x.val!==undefined],values:[x.val===undefined?"":jsStr(x.val)]})),
      ...fr.flatMap((f,i)=>f.vars.map(x=>({id:"p"+i+":"+x.name,name:x.name,type:"blk",isArr:false,init:[true],values:[jsStr(x.val)]})))];
    trace.push({line:0,span:null,bid:b&&b.id,note:msg+warn,out:S.out,pos:S.pos,fail:S.fail,lastRead:S.lastRead,
      vars:tv,changed:[...S.changed].map(k=>/^(v|p\d+):/.test(k)?k+":0":k),read:[...S.read],
      blk:{scratch,vars,lists,frames:fr,answer:S.answer,changed:[...S.changed],read:[...S.read]},...extra});
    S.changed.clear();S.read.clear();S.notes=[];S.lastRead=null;
  }
  // 詢問的問題會印到螢幕上（不換行，跟 Python 的 input("…") 一樣），OJ 也會比對
  function prompt(b){const q=jsStr(ev(inputOf(b,"TEXT")));S.out+=q;return q}
  // 讀一個輸入的值（詢問並等待、Blockly 的輸入）
  function readToken(b){
    if(ti>=toks.length)throw{rt:tx("輸入（詢問）次數過多：輸入的資料已經全部讀完了，可是程式還要再讀。檢查「詢問」的次數，或測資是不是少了。","Too many inputs (asks): all the input has been read, but the program wants more. Check how many times you ask, or whether the test input is missing something."),b};
    const k=toks[ti++];S.pos=k.e;S.lastRead=[k.s,k.e];const n=Number(k.t);return isNaN(n)?k.t:n;
  }
  // ---------- 積木的樣子（說明用） ----------
  const OPS={ADD:"+",MINUS:"-",MULTIPLY:"×",DIVIDE:"÷",POWER:"^",EQ:"=",NEQ:"≠",LT:"<",LTE:"≤",GT:">",GTE:"≥"};
  function blkSrc(b){
    if(!b)return"?";const I=n=>blkSrc(inputOf(b,n));
    switch(b.type){
      case"math_number":return String(F(b,"NUM"));
      case"text":case"scratch_text":return`"${F(b,"TEXT")??""}"`;
      case"variables_get":case"scratch_variables_get":return vname(b);
      case"event_answer":return tx("詢問的答案","answer");
      case"logic_boolean":return F(b,"BOOL")==="TRUE"?tx("真","true"):tx("假","false");
      case"scratch_math_arithmetic":case"math_arithmetic":return`(${I("A")} ${OPS[F(b,"OP")]} ${I("B")})`;
      case"scratch_logic_compare":case"logic_compare":return`${I("A")} ${OPS[F(b,"OP")]} ${I("B")}`;
      case"logic_operation":return`(${I("A")}) ${F(b,"OP")==="AND"?tx("且","and"):tx("或","or")} (${I("B")})`;
      case"logic_negate":return`${tx("不成立","not")} (${I("BOOL")})`;
      case"math_round":{const o=F(b,"OP");return`${o==="ROUNDUP"?tx("無條件進位","round up"):o==="ROUNDDOWN"?tx("無條件捨去","round down"):tx("四捨五入","round")} (${I("NUM")})`}
      case"math_modulo":return`${I("DIVIDEND")} ${tx("除以","mod")} ${I("DIVISOR")} ${tx("的餘數","")}`.trim();
      case"scratch_list_get_item":return`${vname(b,"LIST")} ${tx("的第","item")} ${I("INDEX")} ${tx("項","")}`.trim();
      case"scratch_list_length":return`${tx("清單","list")} ${vname(b,"LIST")} ${tx("的長度","length")}`;
      case"scratch_list_contain":return`${tx("清單","list")} ${vname(b,"LIST")} ${tx("包含","contains")} ${I("ITEM")}`;
      case"scratch_length":return`${tx("取得","length of")} ${I("VALUE")} ${tx("的長度","")}`.trim();
      case"scratch_function_param":return fnParam(b);
      case"procedures_callreturn":return`${b.extraState&&b.extraState.name}(${((b.extraState&&b.extraState.params)||[]).map((p,i)=>I("ARG"+i)).join(", ")})`;
    }
    return tx("［積木］","[block]");
  }
  // ---------- 算值 ----------
  function ev(b){
    if(!b)return scratch?"":undefined;
    const I=n=>ev(inputOf(b,n)),op=()=>F(b,"OP");
    switch(b.type){
      // 數字、文字、變數
      case"math_number":return Number(F(b,"NUM"));
      case"text":case"scratch_text":return String(F(b,"TEXT")??"");
      case"variables_get":case"scratch_variables_get":return getVar(vname(b));
      case"event_answer":return S.answer;
      case"logic_boolean":return F(b,"BOOL")==="TRUE";
      case"logic_null":return null;
      // Scratch 的運算（四則運算把文字轉成數字，除以 0 算成 0）
      case"scratch_math_arithmetic":{const x=toNum(I("A")),y=toNum(I("B")),o=op();
        if(o==="DIVIDE"&&y===0){note(tx("⚠ 除以 0：這個系統算成 0。","⚠ Division by 0: this system makes it 0."));return 0}
        return o==="ADD"?x+y:o==="MINUS"?x-y:o==="MULTIPLY"?x*y:x/y}
      case"scratch_logic_compare":{const a=I("A"),c=I("B"),num=x=>typeof x==="number"||isNumStr(x);const nm=num(a)&&num(c);
        const x=nm?Number(a):String(a),y=nm?Number(c):String(c),o=op();
        return o==="EQ"?x===y:o==="NEQ"?x!==y:o==="LT"?x<y:o==="LTE"?x<=y:o==="GT"?x>y:x>=y}
      case"scratch_string_join":return jsStr(I("TEXT0"))+jsStr(I("TEXT1"));
      case"scratch_string_char_at":{const s=jsStr(I("STRING")),k=toNum(I("INDEX"));
        if(k<1||k>s.length)note(tx(`⚠ ${show(s)} 只有 ${s.length} 個字，沒有第 ${k} 個字。`,`⚠ ${show(s)} has only ${s.length} characters. There is no character ${k}.`));return s.charAt(k-1)}
      case"scratch_string_contains":return jsStr(I("STRING1")).includes(jsStr(I("STRING2")));
      case"scratch_length":{const v=I("VALUE");return Array.isArray(v)?v.length:jsStr(v).length}
      // Scratch 的清單
      case"scratch_list_get":{const n=vname(b,"LIST");S.read.add("l:"+n);return list(n).slice()}
      case"scratch_list_get_item":{const n=vname(b,"LIST"),a=list(n),k=toNum(I("INDEX"));
        if(k>=1&&k<=a.length)S.read.add("l:"+n+":"+(k-1));else note(tx(`⚠ 清單 ${e(n)} 只有 ${a.length} 項，沒有第 ${k} 項，拿到的是 undefined（沒有值）。`,`⚠ The list ${e(n)} has only ${a.length} items. There is no item ${k}, so you get undefined.`));
        return a[k-1]}
      case"scratch_list_length":{const n=vname(b,"LIST");S.read.add("l:"+n);return list(n).length}
      case"scratch_list_contain":{const n=vname(b,"LIST"),it=I("ITEM");S.read.add("l:"+n);return list(n).some(x=>isNaN(x)?String(x).trim()===String(it).trim():Number(x)===Number(it))}
      case"scratch_list_indexof":{const n=vname(b,"LIST"),it=I("ITEM");S.read.add("l:"+n);const key=x=>isNaN(x)?String(x).trim():Number(x);return list(n).map(key).indexOf(key(it))+1||0}
      // Blockly 內建：邏輯
      case"logic_compare":{const a=I("A"),c=I("B"),o=op();return o==="EQ"?a==c:o==="NEQ"?a!=c:o==="LT"?a<c:o==="LTE"?a<=c:o==="GT"?a>c:a>=c}
      case"logic_operation":{const a=I("A"),and=op()==="AND";
        if(and&&!truthy(a)){note(tx("ℹ 左邊已經不成立，「且」的右邊不用算了。","ℹ The left side is already false, so the right side of \"and\" is skipped."));return a}
        if(!and&&truthy(a)){note(tx("ℹ 左邊已經成立，「或」的右邊不用算了。","ℹ The left side is already true, so the right side of \"or\" is skipped."));return a}
        return I("B")}
      case"logic_negate":return!truthy(I("BOOL"));
      case"logic_ternary":return truthy(I("IF"))?I("THEN"):I("ELSE");
      // Blockly 內建：數學
      case"math_arithmetic":{const a=I("A"),c=I("B"),o=op();return o==="ADD"?a+c:o==="MINUS"?a-c:o==="MULTIPLY"?a*c:o==="DIVIDE"?a/c:Math.pow(a,c)}
      case"math_single":{const x=Number(I("NUM")),o=op();return{ROOT:Math.sqrt(x),ABS:Math.abs(x),NEG:-x,LN:Math.log(x),LOG10:Math.log10(x),EXP:Math.exp(x),POW10:Math.pow(10,x)}[o]}
      case"math_trig":{const x=Number(I("NUM")),o=op(),r=x/180*Math.PI;return{SIN:Math.sin(r),COS:Math.cos(r),TAN:Math.tan(r),ASIN:Math.asin(x)/Math.PI*180,ACOS:Math.acos(x)/Math.PI*180,ATAN:Math.atan(x)/Math.PI*180}[o]}
      case"math_constant":return{PI:Math.PI,E:Math.E,GOLDEN_RATIO:(1+Math.sqrt(5))/2,SQRT2:Math.SQRT2,SQRT1_2:Math.SQRT1_2,INFINITY:Infinity}[F(b,"CONSTANT")];
      case"math_number_property":{const x=Number(I("NUMBER_TO_CHECK")),p=F(b,"PROPERTY");
        if(p==="DIVISIBLE_BY")return x%Number(I("DIVISOR"))===0;
        if(p==="PRIME"){if(x<2||x%1)return false;for(let d=2;d*d<=x;d++)if(x%d===0)return false;return true}
        return{EVEN:x%2===0,ODD:Math.abs(x%2)===1,WHOLE:x%1===0,POSITIVE:x>0,NEGATIVE:x<0}[p]}
      case"math_round":{const x=Number(I("NUM")),o=op();return o==="ROUNDUP"?Math.ceil(x):o==="ROUNDDOWN"?Math.floor(x):Math.round(x)}
      case"math_on_list":{const a=(I("LIST")||[]).map(Number),o=op();if(!a.length)return o==="SUM"?0:undefined;
        const sum=a.reduce((p,q)=>p+q,0),srt=a.slice().sort((p,q)=>p-q);
        return{SUM:sum,MIN:Math.min(...a),MAX:Math.max(...a),AVERAGE:sum/a.length,MEDIAN:a.length%2?srt[(a.length-1)/2]:(srt[a.length/2-1]+srt[a.length/2])/2,
          STD_DEV:Math.sqrt(a.reduce((p,q)=>p+(q-sum/a.length)**2,0)/a.length),RANDOM:a[Math.floor(rnd()*a.length)],
          MODE:(()=>{const c=new Map();a.forEach(x=>c.set(x,(c.get(x)||0)+1));const m=Math.max(...c.values());return[...c].filter(([,k])=>k===m).map(([x])=>x)})()}[o]}
      case"math_modulo":return Number(I("DIVIDEND"))%Number(I("DIVISOR"));
      case"math_constrain":return Math.min(Math.max(Number(I("VALUE")),Number(I("LOW"))),Number(I("HIGH")));
      case"math_random_int":{let lo=Number(I("FROM")),hi=Number(I("TO"));if(lo>hi)[lo,hi]=[hi,lo];const v=Math.floor(rnd()*(hi-lo+1)+lo);
        note(tx(`ℹ 隨機取數：這次拿到 ${v}。每次執行都可能不一樣。`,`ℹ Random: this time it is ${v}. It may be different each time.`));return v}
      case"math_random_float":return rnd();
      // Blockly 內建：文字
      case"text_join":{const n=(b.extraState&&b.extraState.itemCount)??2;let s="";for(let i=0;i<n;i++){const x=inputOf(b,"ADD"+i);s+=x?jsStr(ev(x)):""}return s}
      case"text_length":{const v=I("VALUE");return Array.isArray(v)?v.length:jsStr(v).length}
      case"text_isEmpty":return!jsStr(I("VALUE")).length;
      case"text_indexOf":{const s=jsStr(I("VALUE")),f=jsStr(I("FIND"));return(F(b,"END")==="LAST"?s.lastIndexOf(f):s.indexOf(f))+1}
      case"text_charAt":{const s=jsStr(I("VALUE")),w=F(b,"WHERE")||"FROM_START",k=w==="FIRST"?1:w==="LAST"?s.length:w==="RANDOM"?1+Math.floor(rnd()*s.length):w==="FROM_END"?s.length-toNum(I("AT"))+1:toNum(I("AT"));return s.charAt(k-1)}
      case"text_getSubstring":{const s=jsStr(I("STRING")),at=(w,n)=>w==="FIRST"?1:w==="LAST"?s.length:w==="FROM_END"?s.length-toNum(I(n))+1:toNum(I(n));
        return s.slice(at(F(b,"WHERE1"),"AT1")-1,at(F(b,"WHERE2"),"AT2"))}
      case"text_changeCase":{const s=jsStr(I("TEXT")),c=F(b,"CASE");return c==="UPPERCASE"?s.toUpperCase():c==="LOWERCASE"?s.toLowerCase():s.replace(/\S+/g,w=>w[0].toUpperCase()+w.slice(1).toLowerCase())}
      case"text_trim":{const s=jsStr(I("TEXT")),m=F(b,"MODE");return m==="LEFT"?s.trimStart():m==="RIGHT"?s.trimEnd():s.trim()}
      case"text_prompt_ext":{prompt(b);const v=readToken(b);S.answer=v;return F(b,"TYPE")==="NUMBER"?Number(v):jsStr(v)}
      // Blockly 內建：清單（從第 1 項開始）
      case"lists_create_empty":return[];
      case"lists_create_with":{const n=(b.extraState&&b.extraState.itemCount)??3,a=[];for(let i=0;i<n;i++){const x=inputOf(b,"ADD"+i);a.push(x?ev(x):null)}return a}
      case"lists_repeat":{const it=I("ITEM"),n=toNum(I("NUM"));return Array.from({length:Math.max(0,n)},()=>it)}
      case"lists_length":{const v=I("VALUE");return Array.isArray(v)?v.length:jsStr(v).length}
      case"lists_isEmpty":{const v=I("VALUE");return!(v&&v.length)}
      case"lists_indexOf":{const a=I("VALUE")||[],f=I("FIND");return(F(b,"END")==="LAST"?a.lastIndexOf(f):a.indexOf(f))+1}
      case"lists_getIndex":return listIndex(b,true);
      case"lists_getSublist":{const a=I("LIST")||[],at=(w,n)=>w==="FIRST"?1:w==="LAST"?a.length:w==="FROM_END"?a.length-toNum(I(n))+1:toNum(I(n));
        return a.slice(at(F(b,"WHERE1"),"AT1")-1,at(F(b,"WHERE2"),"AT2"))}
      case"lists_sort":{const a=(I("LIST")||[]).slice(),t=F(b,"TYPE"),d=Number(F(b,"DIRECTION"))||1;
        const cmp=t==="NUMERIC"?(p,q)=>Number(p)-Number(q):t==="IGNORE_CASE"?(p,q)=>jsStr(p).toLowerCase()<jsStr(q).toLowerCase()?-1:jsStr(p).toLowerCase()>jsStr(q).toLowerCase()?1:0:(p,q)=>jsStr(p)<jsStr(q)?-1:jsStr(p)>jsStr(q)?1:0;
        return a.sort((p,q)=>cmp(p,q)*d)}
      case"lists_split":{const x=I("INPUT"),dl=jsStr(I("DELIM"));return F(b,"MODE")==="JOIN"?(x||[]).map(jsStr).join(dl):jsStr(x).split(dl)}
      case"lists_reverse":return(I("LIST")||[]).slice().reverse();
      case"procedures_callreturn":return call(b,true);
      // Scratch 的自訂積木的參數：拿「正在執行的那一個定義」的值
      case"scratch_function_param":{const n=fnParam(b),i=frames.length-1;
        if(i>=0&&frames[i].scratch&&frames[i].vars.has(n)){S.read.add("p"+i+":"+n);return frames[i].vars.get(n)}
        note(tx(`⚠ 參數「${e(n)}」只能用在它自己的「定義」積木裡面，這裡拿到的是 0。`,`⚠ The input "${e(n)}" can only be used inside its own "define" block. Here it is 0.`));return 0}
    }
    throw{rt:tx(`這個網頁還不支援「${e(b.type)}」這種積木。`,`This page does not support the block "${e(b.type)}" yet.`),b};
  }
  // Blockly 的「取得 / 取出並移除 / 移除」清單的某一項
  // 清單積木接的是變數的話，回傳那個變數在記憶體區的代號（v:名字）
  const listKey=x=>x&&(x.type==="variables_get")?findVar(vname(x)).k:null;
  function listIndex(b,wantValue){
    const a=ev(inputOf(b,"VALUE")),lk=listKey(inputOf(b,"VALUE"));if(!Array.isArray(a))throw{rt:tx("「清單」積木接的不是清單。","The list block is not given a list."),b};
    const w=F(b,"WHERE")||"FROM_START",m=F(b,"MODE")||"GET";
    const k=w==="FIRST"?1:w==="LAST"?a.length:w==="RANDOM"?1+Math.floor(rnd()*a.length):w==="FROM_END"?a.length-toNum(ev(inputOf(b,"AT")))+1:toNum(ev(inputOf(b,"AT")));
    if(k<1||k>a.length)note(tx(`⚠ 清單只有 ${a.length} 項，沒有第 ${k} 項。`,`⚠ The list has only ${a.length} items. There is no item ${k}.`));
    const v=a[k-1];if(m!=="GET"){a.splice(k-1,1);if(lk)S.changed.add(lk)}else if(lk&&k>=1&&k<=a.length)S.read.add(lk+":"+(k-1));return wantValue?v:undefined;
  }
  // 隨機數：固定種子，同一份積木、同一筆輸入，每次跑出來的過程都一樣（往回看步驟才不會變）
  let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
  // ---------- 執行一串積木 ----------
  function runStack(b){while(b){exec(b);b=b.next&&b.next.block}}
  // 迴圈裡面：中斷 → 回傳 true（離開迴圈）；繼續下一個 → 這一輪結束
  function loopBody(b){try{runStack(b)}catch(x){if(x===BRK)return true;if(x===CNT)return false;throw x}return false}
  function exec(b){
    const I=n=>inputOf(b,n);
    switch(b.type){
      case"event_say":case"text_print":{const v=ev(I("TEXT")),s=jsStr(v);S.out+=s+"\n";
        snap(b,tx(`${b.type==="event_say"?"說出":"印出"} ${show(v)}：印到螢幕上，最後換行。`,`${b.type==="event_say"?"Say":"Print"} ${show(v)}: print it on the screen, then start a new line.`));return}
      case"event_askandwait":{const q=prompt(b),v=readToken(b);S.answer=v;
        snap(b,(q?tx(`先把問題 ${show(q)} 印到螢幕上（OJ 也會比對它！）。`,`First print the question ${show(q)} on the screen (the OJ checks it too!). `):"")+tx(`詢問並等待：從輸入拿下一個值，得到 ${show(v)}，放進「詢問的答案」${typeof v==="number"?"（是數字）":""}。`,`Ask and wait: take the next value of the input, ${show(v)}, and put it in "answer"${typeof v==="number"?" (it is a number)":""}.`));return}
      case"variables_set":case"scratch_variables_set":{const n=vname(b),v=ev(I("VALUE")),old=findVar(n).m.get(n);setVar(n,cp(v));
        snap(b,tx(`把變數 <b>${e(n)}</b> 設為 ${show(v)}`+(isLit(I("VALUE"))?"":`（${e(blkSrc(I("VALUE")))}）`)+`。原本是 ${show(old)}。`,`Set the variable <b>${e(n)}</b> to ${show(v)}`+(isLit(I("VALUE"))?"":` (${e(blkSrc(I("VALUE")))})`)+`. It was ${show(old)}.`));return}
      case"math_change":case"scratch_variables_change":{const n=vname(b),d=ev(I("DELTA")),old=findVar(n).m.get(n);
        const v=b.type==="math_change"?(typeof old==="number"?old:0)+Number(d):toNum(old)+toNum(d);setVar(n,v);
        snap(b,tx(`變數 <b>${e(n)}</b> 加上 ${show(d)}：${show(old)} → ${show(v)}。`,`Change the variable <b>${e(n)}</b> by ${show(d)}: ${show(old)} → ${show(v)}.`));return}
      case"text_append":{const n=vname(b),v=jsStr(findVar(n).m.get(n)??"")+jsStr(ev(I("TEXT")));setVar(n,v);
        snap(b,tx(`在變數 <b>${e(n)}</b> 後面接上文字，變成 ${show(v)}。`,`Append text to <b>${e(n)}</b>. Now it is ${show(v)}.`));return}
      case"scratch_if":case"scratch_ifElse":{const c=ev(I("IF0")),ok=truthy(c),hasElse=b.type==="scratch_ifElse";
        snap(b,tx(`如果 〈${e(blkSrc(I("IF0")))}〉：<b>${ok?"成立":"不成立"}</b>，`+(ok?"執行「那麼」裡面的積木。":hasElse?"執行「否則」裡面的積木。":"跳過裡面的積木。"),
          `If 〈${e(blkSrc(I("IF0")))}〉: <b>${ok?"true":"false"}</b>, so `+(ok?"run the blocks inside \"then\".":hasElse?"run the blocks inside \"else\".":"skip the blocks inside.")));
        if(ok)runStack(I("DO0"));else if(hasElse)runStack(I("ELSE"));return}
      case"controls_if":{const n=((b.extraState&&b.extraState.elseIfCount)||0)+1,hasElse=!!(b.extraState&&b.extraState.hasElse);
        for(let i=0;i<n;i++){const ok=truthy(ev(I("IF"+i)));
          snap(b,tx(`${i?"否則如果":"如果"} 〈${e(blkSrc(I("IF"+i)))}〉：<b>${ok?"成立":"不成立"}</b>`+(ok?"，執行這一段。":"。"),`${i?"Else if":"If"} 〈${e(blkSrc(I("IF"+i)))}〉: <b>${ok?"true":"false"}</b>`+(ok?", so run this part.":".")));
          if(ok){runStack(I("DO"+i));return}}
        if(hasElse){snap(b,tx("上面的條件都不成立，執行「否則」。","None of the conditions is true, so run \"else\"."));runStack(I("ELSE"))}return}
      case"scratch_repeat_ext":case"controls_repeat_ext":{const n=toNum(ev(I("TIMES")));
        for(let k=1;k<=n;k++){snap(b,tx(`重複 ${n} 次：第 <b>${k}</b> 次。`,`Repeat ${n} times: time <b>${k}</b>.`));if(loopBody(I("DO")))return}
        snap(b,tx(`重複 ${n} 次：做完了，<b>離開迴圈</b>。`,`Repeat ${n} times: done, so <b>leave the loop</b>.`));return}
      case"scratch_while":case"scratch_whileUntil":case"controls_whileUntil":{const until=F(b,"MODE")==="UNTIL",cn=b.type==="controls_whileUntil"?"BOOL":"BOOL";let k=0;
        for(;;){const ok=truthy(ev(I(cn))),go=until?!ok:ok;
          snap(b,(until?tx(`重複直到 〈${e(blkSrc(I(cn)))}〉：${ok?"成立":"不成立"}，`,`Repeat until 〈${e(blkSrc(I(cn)))}〉: ${ok?"true":"false"}, so `):tx(`重複當 〈${e(blkSrc(I(cn)))}〉：${ok?"成立":"不成立"}，`,`Repeat while 〈${e(blkSrc(I(cn)))}〉: ${ok?"true":"false"}, so `))+
            (go?tx(`進入迴圈（第 <b>${++k}</b> 次）。`,`enter the loop (time <b>${++k}</b>).`):tx("<b>離開迴圈</b>。","<b>leave the loop</b>.")));
          if(!go)return;if(loopBody(I("DO")))return}}
      case"controls_for":{const n=vname(b),from=Number(ev(I("FROM"))),to=Number(ev(I("TO"))),by=Math.abs(Number(ev(I("BY"))))||1,up=from<=to;
        for(let x=from;up?x<=to:x>=to;x+=up?by:-by){setVar(n,x);snap(b,tx(`計數迴圈：<b>${e(n)}</b> = ${x}（從 ${from} 到 ${to}）。`,`Count with <b>${e(n)}</b> = ${x} (from ${from} to ${to}).`));if(loopBody(I("DO")))return}
        snap(b,tx("計數迴圈做完了，<b>離開迴圈</b>。","The counting loop is done, so <b>leave the loop</b>."));return}
      case"controls_forEach":{const n=vname(b),a=(ev(I("LIST"))||[]).slice();
        for(let i=0;i<a.length;i++){setVar(n,cp(a[i]));snap(b,tx(`取出清單的第 ${i+1} 項：<b>${e(n)}</b> = ${show(a[i])}。`,`Take item ${i+1} of the list: <b>${e(n)}</b> = ${show(a[i])}.`));if(loopBody(I("DO")))return}
        snap(b,tx("清單的每一項都拿過了，<b>離開迴圈</b>。","Every item has been used, so <b>leave the loop</b>."));return}
      case"scratch_controls_flow_statements":case"controls_flow_statements":{const brk=F(b,"FLOW")==="BREAK";
        snap(b,brk?tx("中斷循環：最近的那一層迴圈立刻結束。","Break: the nearest loop ends right away."):tx("繼續下一個循環：這一輪剩下的積木不做了，直接進入下一輪。","Continue: skip the rest of this round and start the next one."));throw brk?BRK:CNT}
      // Scratch 的清單
      case"scratch_list_add":{const n=vname(b,"LIST"),a=list(n),v=ev(I("ITEM"));a.push(v);S.changed.add("l:"+n+":"+(a.length-1));
        snap(b,tx(`添加 ${show(v)} 到清單 <b>${e(n)}</b> 的最後面，現在有 ${a.length} 項。`,`Add ${show(v)} to the end of the list <b>${e(n)}</b>. Now it has ${a.length} items.`));return}
      case"scratch_list_empty":{const n=vname(b,"LIST");LS.set(n,[]);S.changed.add("l:"+n);snap(b,tx(`刪除清單 <b>${e(n)}</b> 的所有項目，現在是空的。`,`Delete all items of the list <b>${e(n)}</b>. Now it is empty.`));return}
      case"scratch_list_insert":{const n=vname(b,"LIST"),a=list(n),v=ev(I("ITEM")),k=toNum(ev(I("INDEX")));a.splice(k-1,0,v);S.changed.add("l:"+n+":"+Math.max(0,k-1));
        snap(b,tx(`插入 ${show(v)} 到清單 <b>${e(n)}</b> 的第 ${k} 項，原本的項目往後移，現在有 ${a.length} 項。`,`Insert ${show(v)} at item ${k} of the list <b>${e(n)}</b>. The items after it move back. Now it has ${a.length} items.`));return}
      case"scratch_list_set":{const n=vname(b,"LIST"),a=list(n),k=toNum(ev(I("INDEX"))),v=ev(I("ITEM")),old=a[k-1];a[k-1]=v;S.changed.add("l:"+n+":"+(k-1));
        if(k<1||k>a.length)note(tx(`⚠ 清單 ${e(n)} 原本沒有第 ${k} 項。`,`⚠ The list ${e(n)} did not have item ${k}.`));
        snap(b,tx(`替換清單 <b>${e(n)}</b> 的第 ${k} 項為 ${show(v)}（原本是 ${show(old)}）。`,`Replace item ${k} of the list <b>${e(n)}</b> with ${show(v)} (it was ${show(old)}).`));return}
      case"scratch_list_remove":{const n=vname(b,"LIST"),a=list(n),k=toNum(ev(I("INDEX")));
        if(k<1||k>a.length){note(tx(`⚠ 清單 ${e(n)} 只有 ${a.length} 項，沒有第 ${k} 項，什麼都沒刪。`,`⚠ The list ${e(n)} has only ${a.length} items. There is no item ${k}, so nothing is deleted.`));snap(b,tx("刪除清單的項目：沒有這一項。","Delete an item: there is no such item."));return}
        const v=a.splice(k-1,1)[0];S.changed.add("l:"+n);snap(b,tx(`刪除清單 <b>${e(n)}</b> 的第 ${k} 項（${show(v)}），後面的項目往前補，現在有 ${a.length} 項。`,`Delete item ${k} (${show(v)}) of the list <b>${e(n)}</b>. The items after it move forward. Now it has ${a.length} items.`));return}
      // Blockly 的清單（放在變數裡）
      case"lists_setIndex":{const a=ev(I("LIST"));if(!Array.isArray(a))throw{rt:tx("「清單」積木接的不是清單。","The list block is not given a list."),b};
        const w=F(b,"WHERE")||"FROM_START",m=F(b,"MODE")||"SET",v=ev(I("TO"));
        const k=w==="FIRST"?1:w==="LAST"?(m==="INSERT"?a.length+1:a.length):w==="RANDOM"?1+Math.floor(rnd()*a.length):w==="FROM_END"?a.length-toNum(ev(I("AT")))+1:toNum(ev(I("AT")));
        if(m==="INSERT")a.splice(k-1,0,v);else a[k-1]=v;
        {const lk=listKey(I("LIST"));if(lk)S.changed.add(lk+":"+(k-1))}
        snap(b,tx(`${m==="INSERT"?"插入":"設定"}清單的第 ${k} 項為 ${show(v)}。`,`${m==="INSERT"?"Insert":"Set"} item ${k} of the list to ${show(v)}.`));return}
      case"lists_getIndex":{listIndex(b,false);snap(b,tx("移除清單的一項。","Remove an item from the list."));return}
      case"procedures_callnoreturn":call(b,false);return;
      case"scratch_function_call":scall(b);return;
      case"procedures_ifreturn":{const ok=truthy(ev(I("CONDITION")));
        snap(b,tx(`如果 〈${e(blkSrc(I("CONDITION")))}〉 就回傳：${ok?"成立，回傳":"不成立，繼續往下"}。`,`If 〈${e(blkSrc(I("CONDITION")))}〉 return: ${ok?"true, so return":"false, so keep going"}.`));
        if(ok)throw{ret:true,v:I("VALUE")?ev(I("VALUE")):undefined};return}
    }
    // 放在外面的算值積木：算一次，結果不用
    ev(b);snap(b,tx(`算出 ${e(blkSrc(b))}（結果沒有用到）。`,`Compute ${e(blkSrc(b))} (the result is not used).`));
  }
  const isLit=b=>b&&(b.type==="math_number"||b.type==="text"||b.type==="scratch_text");
  // ---------- 函式（Blockly 的 procedures） ----------
  function call(b,wantValue){
    const nm=b.extraState&&b.extraState.name,D=procs.get(nm);
    if(!D)throw{rt:tx(`找不到函式「${e(nm)}」的定義。`,`Cannot find the definition of "${e(nm)}".`),b};
    if(frames.length>=60)throw{rt:tx("函式一層呼叫一層，已經超過 60 層了！如果是遞迴，檢查有沒有停下來的條件。","Functions call each other more than 60 levels deep! If it is recursion, check the stopping condition."),b};
    const ps=(D.extraState&&D.extraState.params||[]).map(p=>p.name),args=ps.map((p,i)=>ev(inputOf(b,"ARG"+i)));
    const m=new Map();ps.forEach((p,i)=>{m.set(p,cp(args[i]));S.changed.add("p"+frames.length+":"+p)});
    frames.push({label:nm,vars:m});
    snap(b,tx(`呼叫函式 <b>${e(nm)}</b>：跳到它的定義去執行`+(ps.length?`，${ps.map((p,i)=>`${e(p)} = ${show(args[i])}`).join("、")}`:"")+"。",`Call <b>${e(nm)}</b>: jump to its definition`+(ps.length?`, with ${ps.map((p,i)=>`${e(p)} = ${show(args[i])}`).join(", ")}`:"")+"."));
    let ret;
    try{runStack(inputOf(D,"STACK"));if(D.type==="procedures_defreturn")ret=inputOf(D,"RETURN")?ev(inputOf(D,"RETURN")):undefined}
    catch(x){if(x&&x.ret)ret=x.v;else{frames.pop();throw x}}
    frames.pop();
    snap(b,tx(`函式 <b>${e(nm)}</b> 做完了，回到呼叫它的地方`+(wantValue?`，帶回 ${show(ret)}`:"")+"。",`<b>${e(nm)}</b> is done. Go back to where it was called`+(wantValue?`, with ${show(ret)}`:"")+"."));
    return ret;
  }
  // ---------- Scratch 的自訂積木（沒有回傳值） ----------
  function fnParam(b){const x=typeof b.extraState==="string"?/<mutation\b[^>]*>/.exec(b.extraState):null;return(x&&attr(x[0],"name"))??String(F(b,"PARAM_NAME")??"")}
  function scall(b){
    const nm=fnInfo(b).name,D=sfns.get(nm);
    if(!D)throw{rt:tx(`找不到「定義 ${e(nm)}」積木。`,`Cannot find the block "define ${e(nm)}".`),b};
    if(frames.length>=60)throw{rt:tx("自訂積木一層呼叫一層，已經超過 60 層了！如果是遞迴，檢查有沒有停下來的條件。","Custom blocks call each other more than 60 levels deep! If it is recursion, check the stopping condition."),b};
    const ps=fnInfo(D).params.filter(p=>p.type!=="Label");
    const args=ps.map(p=>{const x=inputOf(b,p.name);return x?ev(x):p.type==="Boolean"?false:""});
    const m=new Map();ps.forEach((p,i)=>{m.set(p.name,cp(args[i]));S.changed.add("p"+frames.length+":"+p.name)});
    const with_=ps.length?tx(`，${ps.map((p,i)=>`${e(p.name)} = ${show(args[i])}`).join("、")}`,`, with ${ps.map((p,i)=>`${e(p.name)} = ${show(args[i])}`).join(", ")}`):"";
    snap(b,tx(`呼叫自訂積木 <b>${e(nm)}</b>`+with_+"。",`Call the custom block <b>${e(nm)}</b>`+with_+"."));
    frames.push({label:nm,vars:m,scratch:true});
    snap(D,tx(`跳到「定義 <b>${e(nm)}</b>」，從它下面的積木開始執行。`,`Jump to "define <b>${e(nm)}</b>" and run the blocks under it.`));
    try{runStack(inputOf(D,"STACK"))}catch(x){frames.pop();throw x}
    frames.pop();
    snap(b,tx(`自訂積木 <b>${e(nm)}</b> 做完了，回到呼叫它的地方，接著往下。`,`The custom block <b>${e(nm)}</b> is done. Go back to where it was called and go on.`));
  }
  // ---------- 開始 ----------
  try{
    if(scratch){
      const loose=tops.filter(b=>b!==starts[0]&&!isDef(b)).length;
      if(loose)note(tx(`ℹ 有 ${loose} 串積木沒有接在「當 🏁 被點擊」下面，它們不會執行。`,`ℹ ${loose} block stack(s) are not under "when 🏁 clicked", so they will not run.`));
      snap(starts[0],tx("綠旗被點擊：從「當 🏁 被點擊」下面的積木開始，<b>由上而下</b>一塊一塊執行。","The green flag is clicked: start from the blocks under \"when 🏁 clicked\" and run them one by one, <b>from top to bottom</b>."));
      runStack(starts[0].next&&starts[0].next.block);
    }else{
      snap(null,tx("開始執行：工作區最上層的積木，<b>由上而下</b>一塊一塊執行。","Start: run the top-level blocks in the workspace one by one, <b>from top to bottom</b>."));
      for(const st of starts)runStack(st);
    }
    snap(null,tx("積木都執行完了，程式結束。","All the blocks have run. The program ends."));trace[trace.length-1].done=true;
  }catch(x){
    if(x===STOP)trace[trace.length-1].done=true;
    else if(x===BRK||x===CNT){snap(null,`<div class="err">💥 ${tx("「中斷循環」或「繼續下一個循環」要放在迴圈裡面。","\"Break\" and \"continue\" must be inside a loop.")}</div>`,{error:true,done:true})}
    else if(x===LIM){trace.push({line:0,note:`<div class="err">${tx(`已經執行超過 ${BLK_LIMIT} 步，先停下來了。很可能是<b>無窮迴圈</b>：檢查迴圈的條件有沒有機會改變。`,`It ran more than ${BLK_LIMIT} steps, so it stopped. It is probably an <b>infinite loop</b>: check if the loop condition can ever change.`)}</div>`,out:S.out,pos:S.pos,vars:[],changed:[],read:[],error:true,done:true,blk:trace.length?trace[trace.length-1].blk:{vars:[],lists:[],frames:[]}})}
    else if(x&&x.rt){S.notes=[];if(trace.length>=BLK_LIMIT)trace.length=BLK_LIMIT-1;snap(x.b,`<div class="err">💥 ${x.rt}</div>`,{error:true,done:true})}
    else throw x;
  }
  return{trace};
}
