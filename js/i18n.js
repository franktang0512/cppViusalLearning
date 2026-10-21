/* ================= 中英切換 =================
   T(中文, 英文)：依照目前的語言挑一個；英文沒寫（null）就用中文。
   課程的英文放在 js/lessons/en/ 底下，用課程編號對應：LESSON_EN["1-2"] = {title, goal, code, ...}。
   切換語言時，applyLang() 把每一課的欄位換成那個語言的版本（中文原文存在 L._zh），
   所以畫面的程式照樣讀 L.title、L.goal、L.code，不用改。還沒翻譯的課，英文版會顯示中文。 */
let LANG=(()=>{try{return JSON.parse(localStorage.getItem("ckviz-lang"))==="en"?"en":"zh"}catch(e){return"zh"}})();
const T=(zh,en)=>LANG==="en"&&en!=null?en:zh;
const LESSON_EN={},CH_EN={};
// Python 課的英文另外放（課程編號跟 C++ 一樣，會撞在一起）：js/py/en/。例題（example）的題目、表格、測資直接用 C++ 例題的英文
const PY_LESSON_EN={},PY_CH_EN={};
const PART_EN={"基礎程式設計":"Basic Programming","進階程式設計":"Advanced Programming","最佳化專論":"Optimization Topics","Case Study":"Case Study"};
const LFIELDS=["title","isNew","uses","goal","task","predict","ask","tips","table","code","input"];
function applyLang(){
  for(const ch of CHAPTERS){
    if(!ch._zh)ch._zh={title:ch.title,part:ch.part,soon:ch.soon};
    const e=LANG==="en"&&!ch.blk?(ch.py?PY_CH_EN:CH_EN)[ch.id]:null;   // 積木課（ch.blk）的英文直接寫在課程裡（T）
    ch.title=e&&e.title||ch._zh.title;
    ch.part=LANG==="en"?PART_EN[ch._zh.part]||ch._zh.part:ch._zh.part;
    ch.soon=e&&e.soon||ch._zh.soon;
    for(const L of ch.lessons||[]){
      if(!L._zh){L._zh={};LFIELDS.forEach(f=>L._zh[f]=L[f]);L._zh.tests=L.tests&&L.tests.map(t=>({...t}))}
      let E=LANG==="en"&&!ch.py&&!ch.blk?LESSON_EN[L.id]:null;
      if(LANG==="en"&&ch.py&&PY_LESSON_EN[L.id]){const c=L.example&&LESSON_EN[L.id]||{};E={goal:c.goal,table:c.table,tests:c.tests,...PY_LESSON_EN[L.id]}}
      LFIELDS.forEach(f=>{L[f]=E&&E[f]!==undefined?E[f]:L._zh[f]});
      if(L._zh.tests)L.tests=L._zh.tests.map((t,i)=>({...t,...(E&&E.tests&&E.tests[i]||{})}));
    }
  }
  document.documentElement.lang=LANG==="en"?"en":"zh-Hant";
  // 網頁上固定的文字：在 HTML 裡寫 data-en（英文內容）、data-en-title（英文提示）
  document.querySelectorAll("[data-en]").forEach(el=>{if(el.dataset.zh===undefined)el.dataset.zh=el.textContent;el.textContent=T(el.dataset.zh,el.dataset.en)});
  document.querySelectorAll("[data-en-title]").forEach(el=>{if(el.dataset.zhTitle===undefined)el.dataset.zhTitle=el.title;el.title=T(el.dataset.zhTitle,el.dataset.enTitle)});
  document.querySelectorAll("[data-en-label]").forEach(el=>{if(el.dataset.zhLabel===undefined)el.dataset.zhLabel=el.getAttribute("aria-label");el.setAttribute("aria-label",T(el.dataset.zhLabel,el.dataset.enLabel))});
  document.title=typeof COURSE!=="undefined"&&COURSE==="blk"?T("看得見的 Scratch / Blockly","Step Into Scratch / Blockly"):typeof COURSE!=="undefined"&&COURSE==="py"?T("看得見的 Python：一步一步看程式怎麼跑","Step Into Python: watch a program run step by step"):T("看得見的 C++：一步一步看程式怎麼跑","Step Into C++: watch a program run step by step");
}
