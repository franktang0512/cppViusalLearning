/* ================= 自動檢查（給 tests.html 用） =================
   網址有 ?selftest=1 才會執行：把這個課程（course）、這個語言（lang）的每一課都跑一遍，
   每一筆測資記下結果，再用 postMessage 交給 tests.html 去跟「預期結果」（tests-expected.js）比對。
   一筆測資的結果：
     AC / WA：有預期輸出，判題的結果（跟畫面上的判題一樣，用 ui.js 的 judge）
     ok：沒有預期輸出，程式正常跑完
     CE：編譯錯誤；其他錯誤記錯誤的名字（IndexError、TypeError……），看不出名字就是 RE
   一課有好幾筆測資就用空白隔開；積木課 Scratch、Blockly 兩種模式各跑一次，用「|」隔開。
   英文模式另外列出還有中文的課（只是提醒，不算錯）。 */
(function(){
  const Q=new URLSearchParams(location.search);
  if(!Q.has("selftest"))return;
  const CJK=/[一-鿿]/;
  const errName=s=>{const t=(s.note||"").replace(/<[^>]+>/g,"");const m=t.match(/\b([A-Z][A-Za-z]*Error)\b/);return m?m[1]:"RE"};
  // 跑一筆：回傳結果，順便看說明裡有沒有中文
  function one(src,c,flags){
    let r;
    try{r=runCode(src,c.input||"")}catch(e){return"CRASH"}
    if(r.error)return"CE";
    const s=r.trace[r.trace.length-1];
    if(LANG==="en"&&r.trace.some(x=>CJK.test((x.note||"").replace(/<[^>]+>/g,""))))flags.noteZh=true;
    if(!s)return"RE";
    if(s.error)return errName(s);
    return c.output!=null?judge(r,c.output):"ok";
  }
  // 積木課：先讓 Blockly 讀一次再存回來（跟畫面上一樣，每塊積木都有編號）
  let ws=null;
  function blkNorm(code){
    if(!ws){blkDefine();ws=new Blockly.Workspace()}
    ws.clear();Blockly.serialization.workspaces.load(typeof code==="string"?JSON.parse(code):code,ws);
    return JSON.stringify(blkSave(ws));
  }
  function lesson(L){
    const cases=L.tests&&L.tests.length?L.tests:[{input:L.input||"",output:null}];
    const flags={};let sig;
    if(COURSE==="blk"){
      sig=["code","blocklyCode"].map(k=>{
        if(!L[k])return"-";
        let src;try{src=blkNorm(L[k])}catch(e){return"LOADERR"}
        return cases.map(c=>one(src,c,flags)).join(" ");
      }).join(" | ");
    }else sig=cases.map(c=>one(L.code,c,flags)).join(" ");
    // 英文模式：課程內容還有中文的欄位
    let zh=[];
    if(LANG==="en"){
      zh=["title","isNew","uses","goal","task","predict","ask"].filter(f=>typeof L[f]==="string"&&CJK.test(L[f]));
      if(typeof L.code==="string"&&CJK.test(L.code)&&COURSE!=="blk")zh.push("code");
      if((L.tests||[]).some(t=>CJK.test((t.note||"")+(t.output||""))))zh.push("tests");
      if(flags.noteZh)zh.push("notes");
    }
    return{sig,zh};
  }
  function send(msg){try{parent.postMessage(Object.assign({selftest:true,course:COURSE,lang:LANG},msg),"*")}catch(e){}}
  addEventListener("load",()=>{
    if(COURSE==="blk"&&typeof Blockly==="undefined"){send({done:true,fatal:"Blockly 沒有載入（需要網路）"});return}
    const results={},zh={},list=ALL.slice();let i=0;
    // 分段跑，每跑幾課就讓瀏覽器喘口氣，順便回報進度
    (function step(){
      const end=Math.min(list.length,i+8);
      for(;i<end;i++){const L=list[i];try{const o=lesson(L);results[L.id]=o.sig;if(o.zh.length)zh[L.id]=o.zh}catch(e){results[L.id]="CRASH"}}
      if(i<list.length){send({progress:i,total:list.length});setTimeout(step,0)}
      else send({done:true,results,zh,errs:window.__selftestErrs||[],total:list.length});
    })();
  });
})();
