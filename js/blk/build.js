/* ================= 積木課的範例積木：用簡短的寫法產生 Scratch 和 Blockly 兩種積木 =================
   課程裡寫 ...blkProg([敘述…], [函式…])，就會得到 code（Scratch 模式）和 blocklyCode（Blockly 模式）。
   兩種模式的積木不一樣，這裡負責對應：
     ask("a","第一個數？")  Scratch：詢問並等待 ＋ 把 a 設為詢問的答案；Blockly：將 a 設為「要求輸入數字」
     count("i",1,5,[…])     Scratch 沒有計數迴圈：把 i 設為 1、重複直到 i > 5、最後 i 加 1；Blockly：計數迴圈
     clear("nums")          Scratch：刪除清單的所有項目；Blockly：將 nums 設為空的清單
   只有其中一種模式要的積木，用 sc(…) 或 bl(…) 包起來。
   數字直接寫（3），文字用字串（"abc"），變數用 v("a")，清單用清單的名字（"nums"）。 */
const BLKP=(()=>{
  // ---------- 算值 ----------
  const v=n=>({t:"var",n});
  const ar=op=>(a,b)=>({t:"ar",op,a,b}),cmp=op=>(a,b)=>({t:"cmp",op,a,b});
  const X={
    v,add:ar("ADD"),sub:ar("MINUS"),mul:ar("MULTIPLY"),div:ar("DIVIDE"),
    mod:(a,b)=>({t:"mod",a,b}),round:x=>({t:"round",op:"ROUND",x}),floor:x=>({t:"round",op:"ROUNDDOWN",x}),
    eq:cmp("EQ"),ne:cmp("NEQ"),lt:cmp("LT"),gt:cmp("GT"),le:cmp("LTE"),ge:cmp("GTE"),
    and:(a,b)=>({t:"logic",op:"AND",a,b}),or:(a,b)=>({t:"logic",op:"OR",a,b}),not:x=>({t:"not",x}),
    join:(...xs)=>({t:"join",xs}),letter:(s,i)=>({t:"letter",s,i}),len:s=>({t:"len",s}),
    item:(l,i)=>({t:"item",l,i}),llen:l=>({t:"llen",l}),has:(l,x)=>({t:"has",l,x}),
    call:(name,...args)=>({t:"call",name,args}),answer:()=>({t:"answer"}),
    // ---------- 敘述 ----------
    ask:(n,prompt="",type="NUMBER")=>({t:"ask",n,prompt,type}),askOnly:(prompt="")=>({t:"askOnly",prompt}),
    say:x=>({t:"say",x}),set:(n,x)=>({t:"set",n,x}),change:(n,x)=>({t:"change",n,x}),
    iff:(c,then,els)=>({t:"if",arms:[[c,then]],els}),ifs:(arms,els)=>({t:"if",arms,els}),
    repeat:(n,body)=>({t:"repeat",n,body}),whilst:(c,body)=>({t:"loop",mode:"WHILE",c,body}),until:(c,body)=>({t:"loop",mode:"UNTIL",c,body}),
    count:(n,from,to,body)=>({t:"count",n,from,to,body}),brk:()=>({t:"flow",f:"BREAK"}),cont:()=>({t:"flow",f:"CONTINUE"}),
    clear:l=>({t:"clear",l}),push:(l,x)=>({t:"push",l,x}),setItem:(l,i,x)=>({t:"setItem",l,i,x}),insert:(l,i,x)=>({t:"insert",l,i,x}),remove:(l,i)=>({t:"remove",l,i}),
    run:(name,...args)=>({t:"run",name,args}),
    sc:(...body)=>({t:"only",m:"sc",body}),bl:(...body)=>({t:"only",m:"bl",body}),
    // 函式：fn("名字",["參數"],[敘述…],回傳的值（可以不寫）)
    fn:(name,params,body,ret)=>({name,params,body,ret}),
  };
  // ---------- 產生積木 ----------
  function build(main,defs,m){
    const sc=m==="sc",vars=new Map(),lists=new Set();
    const vid=n=>"v:"+n;
    const useVar=n=>{if(!vars.has(n))vars.set(n,"")};
    const useList=n=>{lists.add(n);if(!vars.has(n))vars.set(n,"list")};
    const F=n=>({id:vid(n)});
    const lit=x=>typeof x==="number"||typeof x==="string";
    const num=x=>({type:"math_number",fields:{NUM:x}}),txt=x=>({type:sc?"scratch_text":"text",fields:{TEXT:String(x)}});
    // 放進一個空格：num＝數字格、text＝文字格（有預設的影子積木），none＝沒有影子
    function slot(x,kind){
      if(lit(x)){if(kind==="num")return{shadow:num(x)};if(kind==="text")return{shadow:txt(x)};return{block:typeof x==="number"?num(x):txt(x)}}
      const b={block:E(x)};
      if(kind==="num")b.shadow=num(0);else if(kind==="text")b.shadow=txt("");
      return b;
    }
    const listVar=l=>(useList(l),sc?null:{block:{type:"variables_get",fields:{VAR:F(l)}}});
    function E(x){
      if(typeof x==="boolean")return{type:"logic_boolean",fields:{BOOL:x?"TRUE":"FALSE"}};
      if(lit(x))return typeof x==="number"?num(x):txt(x);
      switch(x.t){
        case"var":useVar(x.n);return{type:sc?"scratch_variables_get":"variables_get",fields:{VAR:F(x.n)}};
        case"answer":return{type:"event_answer"};
        case"ar":return{type:sc?"scratch_math_arithmetic":"math_arithmetic",fields:{OP:x.op},inputs:{A:slot(x.a,"num"),B:slot(x.b,"num")}};
        case"mod":return{type:"math_modulo",inputs:{DIVIDEND:slot(x.a,"num"),DIVISOR:slot(x.b,"num")}};
        case"round":return{type:"math_round",fields:{OP:x.op},inputs:{NUM:slot(x.x,"num")}};
        case"cmp":return{type:sc?"scratch_logic_compare":"logic_compare",fields:{OP:x.op},inputs:{A:slot(x.a,sc?"text":"none"),B:slot(x.b,sc?"text":"none")}};
        case"logic":return{type:"logic_operation",fields:{OP:x.op},inputs:{A:slot(x.a,"none"),B:slot(x.b,"none")}};
        case"not":return{type:"logic_negate",inputs:{BOOL:slot(x.x,"none")}};
        case"join":{
          if(!sc){const inputs={};x.xs.forEach((y,i)=>inputs["ADD"+i]=slot(y,"text"));return{type:"text_join",extraState:{itemCount:x.xs.length},inputs}}
          const j=xs=>xs.length===1?E(xs[0]):{type:"scratch_string_join",inputs:{TEXT0:slot(xs[0],"text"),TEXT1:xs.length===2?slot(xs[1],"text"):{block:j(xs.slice(1)),shadow:txt("")}}};
          return j(x.xs)}
        case"letter":return sc?{type:"scratch_string_char_at",inputs:{STRING:slot(x.s,"text"),INDEX:slot(x.i,"num")}}
          :{type:"text_charAt",fields:{WHERE:"FROM_START"},inputs:{VALUE:slot(x.s,"text"),AT:slot(x.i,"num")}};
        case"len":return{type:sc?"scratch_length":"text_length",inputs:{VALUE:slot(x.s,"text")}};
        case"item":return sc?(useList(x.l),{type:"scratch_list_get_item",fields:{LIST:F(x.l)},inputs:{INDEX:slot(x.i,"num")}})
          :{type:"lists_getIndex",fields:{MODE:"GET",WHERE:"FROM_START"},inputs:{VALUE:listVar(x.l),AT:slot(x.i,"num")}};
        case"llen":return sc?(useList(x.l),{type:"scratch_list_length",fields:{LIST:F(x.l)}}):{type:"lists_length",inputs:{VALUE:listVar(x.l)}};
        case"has":return sc?(useList(x.l),{type:"scratch_list_contain",fields:{LIST:F(x.l)},inputs:{ITEM:slot(x.x,"text")}})
          :E({t:"cmp",op:"GT",a:{t:"raw",b:{type:"lists_indexOf",fields:{END:"FIRST"},inputs:{VALUE:listVar(x.l),FIND:slot(x.x,"none")}}},b:0});
        case"raw":return x.b;
        case"call":return{type:"procedures_callreturn",extraState:{name:x.name,params:defs.find(d=>d.name===x.name).params},inputs:args(x.args)};
      }
      throw new Error("blkProg: 不認得的算值 "+JSON.stringify(x));
    }
    function args(a){const inputs={};a.forEach((y,i)=>inputs["ARG"+i]=slot(y,"none"));return inputs}
    // 一個敘述 → 一塊或幾塊積木（陣列）
    function S(s){
      switch(s.t){
        case"only":return s.m===m?s.body.flatMap(S):[];
        case"ask":useVar(s.n);return sc?[{type:"event_askandwait",inputs:{TEXT:slot(s.prompt,"text")}},{type:"scratch_variables_set",fields:{VAR:F(s.n)},inputs:{VALUE:{block:{type:"event_answer"},shadow:txt("")}}}]
          :[{type:"variables_set",fields:{VAR:F(s.n)},inputs:{VALUE:{block:{type:"text_prompt_ext",fields:{TYPE:s.type},inputs:{TEXT:slot(s.prompt,"text")}}}}}];
        case"askOnly":return[{type:"event_askandwait",inputs:{TEXT:slot(s.prompt,"text")}}];
        case"say":return[{type:sc?"event_say":"text_print",inputs:{TEXT:slot(s.x,"text")}}];
        case"set":useVar(s.n);return[{type:sc?"scratch_variables_set":"variables_set",fields:{VAR:F(s.n)},inputs:{VALUE:slot(s.x,sc?"text":"none")}}];
        case"change":useVar(s.n);return[{type:sc?"scratch_variables_change":"math_change",fields:{VAR:F(s.n)},inputs:{DELTA:slot(s.x,"num")}}];
        case"if":{
          if(sc){const one=k=>{const[c,body]=s.arms[k],last=k===s.arms.length-1,els=last?s.els:[{t:"if",arms:s.arms.slice(k+1),els:s.els}];
              const b={type:els?"scratch_ifElse":"scratch_if",inputs:{IF0:{block:E(c)}}};const d=chain(body);if(d)b.inputs.DO0={block:d};
              if(els){const e=chain(els);if(e)b.inputs.ELSE={block:e}}return b};
            return[one(0)]}
          const b={type:"controls_if",inputs:{}},ex={};if(s.arms.length>1)ex.elseIfCount=s.arms.length-1;if(s.els)ex.hasElse=true;if(Object.keys(ex).length)b.extraState=ex;
          s.arms.forEach(([c,body],i)=>{b.inputs["IF"+i]={block:E(c)};const d=chain(body);if(d)b.inputs["DO"+i]={block:d}});
          if(s.els){const e=chain(s.els);if(e)b.inputs.ELSE={block:e}}return[b]}
        case"repeat":return[withBody({type:sc?"scratch_repeat_ext":"controls_repeat_ext",inputs:{TIMES:slot(s.n,"num")}},s.body,"DO")];
        case"loop":return[withBody({type:sc?"scratch_while":"controls_whileUntil",fields:{MODE:s.mode},inputs:{BOOL:{block:E(s.c)}}},s.body,"DO")];
        case"count":useVar(s.n);
          if(sc)return[...S({t:"set",n:s.n,x:s.from}),...S({t:"loop",mode:"UNTIL",c:{t:"cmp",op:"GT",a:v(s.n),b:s.to},body:[...s.body,{t:"change",n:s.n,x:1}]})];
          return[withBody({type:"controls_for",fields:{VAR:F(s.n)},inputs:{FROM:slot(s.from,"num"),TO:slot(s.to,"num"),BY:slot(1,"num")}},s.body,"DO")];
        case"flow":return[{type:sc?"scratch_controls_flow_statements":"controls_flow_statements",fields:{FLOW:s.f}}];
        case"clear":useList(s.l);return sc?[{type:"scratch_list_empty",fields:{LIST:F(s.l)}}]:[{type:"variables_set",fields:{VAR:F(s.l)},inputs:{VALUE:{block:{type:"lists_create_empty"}}}}];
        case"push":return sc?(useList(s.l),[{type:"scratch_list_add",fields:{LIST:F(s.l)},inputs:{ITEM:slot(s.x,"text")}}])
          :[{type:"lists_setIndex",fields:{MODE:"INSERT",WHERE:"LAST"},inputs:{LIST:listVar(s.l),TO:slot(s.x,"none")}}];
        case"setItem":return sc?(useList(s.l),[{type:"scratch_list_set",fields:{LIST:F(s.l)},inputs:{INDEX:slot(s.i,"num"),ITEM:slot(s.x,"text")}}])
          :[{type:"lists_setIndex",fields:{MODE:"SET",WHERE:"FROM_START"},inputs:{LIST:listVar(s.l),AT:slot(s.i,"num"),TO:slot(s.x,"none")}}];
        case"insert":return sc?(useList(s.l),[{type:"scratch_list_insert",fields:{LIST:F(s.l)},inputs:{ITEM:slot(s.x,"text"),INDEX:slot(s.i,"num")}}])
          :[{type:"lists_setIndex",fields:{MODE:"INSERT",WHERE:"FROM_START"},inputs:{LIST:listVar(s.l),AT:slot(s.i,"num"),TO:slot(s.x,"none")}}];
        case"remove":return sc?(useList(s.l),[{type:"scratch_list_remove",fields:{LIST:F(s.l)},inputs:{INDEX:slot(s.i,"num")}}])
          :[{type:"lists_getIndex",extraState:{isStatement:true},fields:{MODE:"REMOVE",WHERE:"FROM_START"},inputs:{VALUE:listVar(s.l),AT:slot(s.i,"num")}}];
        case"run":return[{type:"procedures_callnoreturn",extraState:{name:s.name,params:defs.find(d=>d.name===s.name).params},inputs:args(s.args)}];
      }
      throw new Error("blkProg: 不認得的敘述 "+JSON.stringify(s));
    }
    function withBody(b,body,name){const d=chain(body);if(d)b.inputs[name]={block:d};return b}
    // 一串敘述接起來（每塊的 next 接下一塊）
    function chain(list){
      const bs=(list||[]).flatMap(S);
      for(let i=0;i<bs.length-1;i++)bs[i].next={block:bs[i+1]};
      return bs[0]||null;
    }
    const tops=[];
    const body=chain(main);
    if(sc)tops.push(Object.assign({type:"event_whenflagclicked",x:40,y:40},body?{next:{block:body}}:{}));
    else if(body)tops.push(Object.assign(body,{x:40,y:40}));
    // 函式放在右邊
    const params=new Set();
    defs.forEach((d,i)=>{
      d.params.forEach(p=>{params.add(p);if(!vars.has(p))vars.set(p,"")});
      const b={type:d.ret===undefined?"procedures_defnoreturn":"procedures_defreturn",x:sc?520:560,y:40+i*260,fields:{NAME:d.name},
        extraState:{params:d.params.map(p=>({name:p,id:vid(p)}))},inputs:{}};
      const st=chain(d.body);if(st)b.inputs.STACK={block:st};
      if(d.ret!==undefined)b.inputs.RETURN=slot(d.ret,"none");
      tops.push(b);
    });
    return{blocks:{languageVersion:0,blocks:tops},variables:[...vars].map(([n,t])=>t?{name:n,id:vid(n),type:t}:{name:n,id:vid(n)})};
  }
  X.blkProg=(main,defs=[])=>{const d=defs.map(f=>({...f,params:f.params||[]}));return{code:build(main,d,"sc"),blocklyCode:build(main,d,"bl")}};
  return X;
})();
