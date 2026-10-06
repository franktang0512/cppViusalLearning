/* ---------- 第 0 章 ---------- */
CHAPTERS.push({part:"基礎程式設計",id:0,title:"程式怎麼跑起來",lessons:[
 {id:"0-1",title:"第一個程式",isNew:"main、cout、由上而下逐行執行",
  goal:"程式從 main 的第一行開始，一行一行往下執行。引號裡的字照抄印出，沒有引號的會先算出結果。",
  code:M('cout << "Hello, CK!" << endl;','cout << "1 + 2 = " << 1 + 2 << endl;','cout << "1 + 2" << endl;'),input:null,
  predict:"三行 cout 分別會印出什麼？特別注意第二行和第三行的差別。",
  ask:"如果把 endl 全部拿掉，輸出會變成什麼樣子？按「改改看」試試。"},
 {id:"0-2",title:"OJ 怎麼判題",isNew:"標準輸入輸出、逐字比對",
  goal:"OJ 不是人，它把你的輸出和正確答案「逐字比對」。題目沒要求印的東西，一個字都不能多。",
  task:"題目：輸入兩個整數 a、b，輸出 a + b。",
  code:M("int a, b;",'cout << "請輸入兩個數字：";',"cin >> a >> b;",'cout << "答案是 " << a + b << endl;'),input:"3 5",expected:"8",
  tips:{'"請輸入':"在自己電腦上這行很貼心，但 OJ 會把它當成答案的一部分。"},
  ask:"按「改改看」把程式改到 AC（Accepted）。"}
]});
