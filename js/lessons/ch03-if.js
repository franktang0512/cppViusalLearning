/* ---------- 第 3 章 ---------- */
CHAPTERS.push({part:"基礎程式設計",id:3,title:"條件判斷",lessons:[
 {id:"3-1",title:"if / else 的分岔",isNew:"if、else、比較運算",
  goal:"if 先判斷條件，成立就走一條路，不成立就走另一條。兩條路只會走其中一條。",
  code:M("int score;","cin >> score;","if (score >= 60) {",'    cout << "及格" << endl;',"} else {",'    cout << "不及格" << endl;',"}",'cout << "結束" << endl;'),input:"75",
  ask:"把輸入改成 59 和 60 各試一次。"},
 {id:"3-2",title:"= 和 == 不一樣",isNew:"指定 vs 比較",
  goal:"= 是把值放進去，== 才是比較。在 if 裡寫錯，程式不會報錯，但結果完全不對，而且變數還被改掉了。",
  code:M("int a = 5;","if (a = 0) {",'    cout << "a 是 0" << endl;',"} else {",'    cout << "a 不是 0" << endl;',"}","cout << a << endl;"),input:null,
  predict:"a 是 5，會印出哪一句？最後的 a 是多少？",
  ask:"改成 a == 0 再執行一次，比較記憶體的變化。"},
 {id:"3-3",title:"連續 if 和 else if",isNew:"互斥的判斷",
  goal:"好幾個獨立的 if 每個都會檢查；else if 只要前面有一個成立，後面就全部跳過。",
  code:M("int s;","cin >> s;",'if (s >= 90) cout << "A" << endl;','if (s >= 80) cout << "B" << endl;','if (s >= 70) cout << "C" << endl;','cout << "----" << endl;','if (s >= 90) cout << "A" << endl;','else if (s >= 80) cout << "B" << endl;','else if (s >= 70) cout << "C" << endl;'),input:"95",
  ask:"如果把 else if 的順序反過來（先判斷 s >= 70），輸入 95 會印出什麼？"},
 {id:"3-4",title:"&& 的短路",isNew:"&&、||、短路求值",
  goal:"&& 左邊已經是 false，右邊就不會執行。寫條件時，先放「保護」的檢查，可以避免當掉。",
  code:M("int x = 0;","if (x != 0 && 10 / x > 1) {",'    cout << "大" << endl;',"} else {",'    cout << "x 是 0 或不夠大" << endl;',"}","if (10 / x > 1 && x != 0) {",'    cout << "大" << endl;',"}"),input:null,
  ask:"兩個 if 的條件意思一樣，為什麼一個安全、一個會當掉？"}
]});
