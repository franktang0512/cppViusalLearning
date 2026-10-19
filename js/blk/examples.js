/* ================= Scratch / Blockly 課的例題：跟 C++ 課同一批題目（114 學習單） =================
   題目說明、表格、測資直接拿 C++ 課的（英文版拿 LESSON_EN 的），積木程式在這裡寫。
   C++ 和積木不一樣的地方，寫在 isNew、note 或 ask 裡（例如清單從第 1 項開始）。 */
(()=>{
const {v,add,sub,mul,div,round,floor,ge,le,lt,eq,join,item,ask,say,set,change,iff,ifs,repeat,until,clear,push,blkProg}=BLKP;
// 從 C++ 課拿題目：說明、表格、測資（英文版用英文的）
const EX=id=>{
  const l=(typeof CHAPTERS!=="undefined"?CHAPTERS:[]).flatMap(c=>c.lessons||[]).find(x=>x.id===id);if(!l)return{};
  const E=typeof LANG!=="undefined"&&LANG==="en"&&typeof LESSON_EN!=="undefined"&&LESSON_EN[id]||{};
  return{example:true,no:l.no,title:E.title||l.title,goal:E.goal||l.goal,table:E.table||l.table,
    tests:l.tests&&l.tests.map((t,i)=>({...t,...(E.tests&&E.tests[i]||{})}))};
};
const add2=(chId,list)=>{const ch=BLK_CHAPTERS.find(c=>c.id===chId);if(ch)ch.lessons.push(...list)};
add2(0,[
 {id:"P0",...EX("P0"),isNew:T("說出","Say"),...blkProg([say("Hello!")]),
  ask:T("把 Hello! 改成你的名字，再按 🏁 執行。","Change Hello! to your name, then press 🏁 Run.")},
 {id:"P1",...EX("P1"),isNew:T("先乘除、後加減","Multiply and divide first, then add and subtract"),...blkProg([say(add(div(45,9),mul(7,3)))]),
  predict:T("積木是一塊套一塊的：會先算哪一塊？","Blocks sit inside other blocks. Which block is worked out first?"),
  ask:T("把「45 / 9」換成「45 / 7」，會說出什麼？積木的 / 跟 C++ 的整數除法一樣嗎？","Change \"45 / 9\" to \"45 / 7\". What is said? Is \"/\" in blocks the same as integer division in C++?")}
]);
add2(1,[
 {id:"P2",...EX("P2"),isNew:T("詢問並等待、字串組合","Ask and wait, join"),...blkProg([ask("name","","TEXT"),say(join("Hello ",v("name")))]),
  predict:T("「Hello」後面的空白是哪裡來的？","Where does the space after \"Hello\" come from?"),
  ask:T("把輸入改成你的名字，積木要改嗎？","Change the input to your name. Do the blocks need to change?")}
]);
add2(2,[
 {id:"P3",...EX("P3"),isNew:T("單一輸入、單一輸出、四則運算","One input, one output, arithmetic"),...blkProg([ask("cost"),set("price",mul(v("cost"),1.5)),say(v("price"))]),
  ask:T("C++ 要用 double 才放得下 1.5 倍的結果，積木的變數需要先決定型別嗎？","In C++ you need double to hold 1.5 times the cost. Do block variables need a type?")},
 {id:"P4",...EX("P4"),isNew:T("單一輸入、多輸出","One input, two outputs"),...blkProg([ask("cost"),set("price",mul(v("cost"),1.5)),say(v("price")),set("price",mul(v("price"),0.9)),say(v("price"))]),
  predict:T("「把 price 設為 price × 0.9」執行完，原本的 150 會怎麼樣？","After \"set price to price × 0.9\", what happens to the old 150?"),
  ask:T("不改 price，直接說出 price × 0.9，結果一樣嗎？","If you just say price × 0.9 without changing price, is the result the same?")},
 {id:"P5",...EX("P5"),isNew:T("多輸入、單一輸出","Several inputs, one output"),...blkProg([set("money",300),ask("a"),ask("b"),ask("c"),set("money",sub(sub(sub(v("money"),v("a")),v("b")),v("c"))),say(v("money"))]),
  ask:T("如果三餐加起來超過 300 元，會說出什麼？","If the three meals cost more than 300 dollars, what is said?")},
 {id:"P6",...EX("P6"),isNew:T("多輸入；積木的數字可以有小數","Several inputs; numbers in blocks can have decimals"),...blkProg([ask("a"),ask("b"),say(add(v("a"),v("b")))]),
  ask:T("C++ 要用 double 才能讀 -1.5；積木直接就可以。試試輸入 0.1 0.2，會說出什麼？","C++ needs double to read -1.5, but blocks can do it directly. Try the input 0.1 0.2. What is said?")},
 {id:"P7",...EX("P7"),isNew:T("多輸入、無條件捨去","Several inputs, round down"),...blkProg([ask("h"),ask("w"),set("h",div(v("h"),100)),set("bmi",div(v("w"),mul(v("h"),v("h")))),say(floor(v("bmi")))]),
  predict:T("bmi 算出來會剛好是整數嗎？","Is bmi exactly a whole number?"),
  ask:T("如果題目要四捨五入到小數第 2 位，要怎麼改？（提示：2-6）","If the problem asks you to round to 2 decimal places, how do you change it? (Hint: 2-6)")}
]);
add2(3,[
 {id:"P8",...EX("P8"),isNew:T("如果……那麼","If … then"),...blkProg([ask("money"),set("total",v("money")),iff(lt(v("money"),499),[change("total",60)]),say(v("total"))]),
  ask:T("輸入剛好 499 元，要不要付運費？算出來對嗎？","If the input is exactly 499, should you pay for shipping? Is the result right?")},
 {id:"P9",...EX("P9"),isNew:T("如果……那麼……否則","If … then … else"),...blkProg([ask("n"),iff(ge(v("n"),10),[set("fee",mul(v("n"),7))],[set("fee",mul(v("n"),13))]),say(v("fee"))]),
  ask:T("把「n ≥ 10」改成「n > 10」，哪一種人數會算錯？","Change \"n ≥ 10\" to \"n > 10\". Which number of people is now wrong?")},
 {id:"P10",...EX("P10"),isNew:T("如果……那麼……否則","If … then … else"),...blkProg([ask("h"),iff(le(v("h"),4),[set("fee",mul(v("h"),10))],[set("fee",mul(v("h"),15))]),say(v("fee"))]),
  ask:T("把輸入改成剛好 4，fee 是多少？4 小時算哪一種費率？","Change the input to exactly 4. What is fee? Which rate does 4 hours use?")},
 {id:"P11",...EX("P11"),isNew:T("多個條件：否則裡面再放如果","Many choices: an if inside the else"),...blkProg([ask("mood"),ifs([[ge(v("mood"),80),[say(T("超開心","Super happy"))]],[ge(v("mood"),60),[say(T("開心","Happy"))]],[ge(v("mood"),40),[say(T("普通","OK"))]]],[say("......")])]),
  ask:T("心情 95 的時候檢查了幾個條件？心情 30 的時候呢？","When the mood is 95, how many conditions are checked? When it is 30?")},
 {id:"P12",...EX("P12"),isNew:T("多輸入、多個條件","Several inputs, many choices"),...blkProg([ask("atk"),ask("rage"),set("rate",1),ifs([[ge(v("rage"),80),[set("rate",2)]],[ge(v("rage"),50),[set("rate",1.5)]],[ge(v("rage"),30),[set("rate",1.2)]]]),say(mul(v("atk"),v("rate")))]),
  ask:T("怒氣值不到 30 的時候，rate 是多少？為什麼一開始要先設成 1？","When rage is below 30, what is rate? Why is it set to 1 at the start?")},
 {id:"P13",...EX("P13"),isNew:T("單一輸入、多個條件、字串組合","One input, many choices, join"),...blkProg([ask("score"),ifs([[ge(v("score"),10000),[say(join(T("金牌 ","Gold "),mul(v("score"),1.8)))]],[ge(v("score"),5000),[say(join(T("銀牌 ","Silver "),mul(v("score"),1.4)))]]],[say(join(T("銅牌 ","Bronze "),v("score")))])]),
  ask:T("如果把「≥ 5000」的判斷放在「≥ 10000」前面，積分 12000 會拿到什麼？","If the \"≥ 5000\" check comes before \"≥ 10000\", what does a score of 12000 get?")}
]);
add2(4,[
 {id:"P14",...EX("P14"),isNew:T("重複幾次","Repeat a number of times"),...blkProg([repeat(5,[say("Hello Sinyi!")])]),
  ask:T("要說 100 次的話，要改哪裡？","To say it 100 times, what do you change?")},
 {id:"P16",...EX("P16"),isNew:T("重複讀入、累加、四捨五入","Read in a loop, add up, round"),...blkProg([set("total",0),repeat(7,[ask("h"),change("total",v("h"))]),say(round(div(v("total"),7)))]),
  ask:T("把「四捨五入」換成「無條件捨去」，兩筆測資還會 AC 嗎？","Replace \"round\" with \"round down\". Do both tests still get AC?")},
 {id:"P17",...EX("P17"),isNew:T("重複讀入、累加、平均","Read in a loop, add up, average"),...blkProg([set("total",0),repeat(5,[ask("s"),change("total",v("s"))]),say(div(v("total"),5))]),
  ask:T("C++ 要寫 total / 5.0 才會有小數；積木的 / 呢？","In C++ you write total / 5.0 to get decimals. What about \"/\" in blocks?")},
 {id:"r060",...EX("r060"),isNew:T("重複 n 次、迴圈裡用如果分類、累加","Repeat n times, choose with if inside the loop, add up"),...blkProg([ask("n"),set("total",0),repeat(v("n"),[ask("w"),ifs([[le(v("w"),5),[change("total",70)]],[le(v("w"),10),[change("total",90)]],[le(v("w"),15),[change("total",110)]]],[change("total",135)])]),say(v("total"))]),
  predict:T("第二筆測資的 20 公斤，會走進哪一個如果？","In the second test, which if does 20 kg go into?"),
  ask:T("重量剛好是 5、10、15 公斤的時候，算對了嗎？用自己的測資試試看。","Is it right when a weight is exactly 5, 10 or 15 kg? Try it with your own input.")},
 {id:"r063",...EX("r063"),isNew:T("重複直到：還沒達到目標就繼續讀","Repeat until: keep reading until the goal is reached"),...blkProg([set("score",0),set("count",0),until(ge(v("score"),30),[ask("p"),change("score",v("p")),change("count",1)]),say(v("count"))]),
  predict:T("第一筆測資，迴圈會轉幾圈？","For the first test, how many times does the loop run?"),
  ask:T("如果投到最後都還不到 30 分，程式會怎樣？輸入 2 2 2 試試看。","What happens if the score never reaches 30? Try the input 2 2 2.")},
 {id:"r064",...EX("r064"),isNew:T("讀到 -1 就停：先讀一個，迴圈最後再讀下一個","Stop at -1: read one first, then read the next one at the end of the loop"),...blkProg([set("total",0),ask("d"),until(eq(v("d"),-1),[change("total",v("d")),ask("d")]),say(v("total"))]),
  predict:T("讀到 -1 的時候，-1 會被加進 total 嗎？","When -1 is read, is it added to total?"),
  ask:T("把迴圈裡的兩塊對調（先詢問、再加上），結果會怎樣？","Swap the two blocks inside the loop (ask first, then add). What happens?")}
]);
add2(5,[
 {id:"r008",...EX("r008"),goal:(EX("r008").goal||"").replace("請用陣列來做","請用清單來做").replace(/(Use|use) an array/,"$1 a list"),isNew:T("讀進清單；清單從第 1 項開始，星期 n 就是第 n 項","Read into a list; lists start at item 1, so day n is item n"),
  ...blkProg([clear("steps"),repeat(7,[ask("x"),push("steps",v("x"))]),ask("n"),say(item("steps",v("n")))]),
  tests:EX("r008").tests&&EX("r008").tests.map(t=>({...t,note:T("星期四是第 4 天，就是清單的第 4 項 9100","Thursday is day 4, which is item 4 of the list: 9100")})),
  predict:T("查詢星期四（n = 4），會拿清單的第幾項？","For Thursday (n = 4), which item of the list is taken?"),
  ask:T("C++ 要寫 steps[n - 1]，為什麼積木直接拿第 n 項就對了？","In C++ you write steps[n - 1]. Why is item n already right in blocks?")}
]);
})();
