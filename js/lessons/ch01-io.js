/* ---------- 第 1 章 ---------- */
CHAPTERS.push({part:"基礎程式設計",id:1,title:"輸入與輸出",lessons:[
 {id:"1-1",title:"輸出的空白與換行",isNew:"cout 不會自動加空白或換行",
  goal:"cout 只會印出你叫它印的東西。數字之間的空白、行尾的換行，全部都要自己寫。",
  task:"題目：印出 a 和 b（中間一個空白），下一行印出 a + b。",
  code:M("int a = 3, b = 4;","cout << a << b;","cout << a + b;"),input:null,expected:"3 4\n7",
  ask:"把程式改到 AC。endl 和 \"\\n\" 都可以換行，試試看兩種寫法。"},
 {id:"1-2",title:"cin 與輸入緩衝區",isNew:"輸入緩衝區、空白與換行只是分隔",
  goal:"你打的字會先排在「輸入緩衝區」裡。cin >> 每次跳過空白和換行，拿走下一筆資料。",
  code:M("int x, y;","cin >> x >> y;","cout << x + y << endl;"),input:"12    30\n",
  predict:"輸入的 12 和 30 中間有好幾個空白，會影響結果嗎？",
  ask:"把輸入改成 12 換行 30（分兩行打），結果會一樣嗎？"},
 {id:"1-3",title:"cin 讀 char",isNew:"char 一次只拿一個字元",
  goal:"讀 int 會一路讀到不是數字為止；讀 char 只拿一個字元。同一串輸入，用不同型別讀，結果完全不同。",
  code:M("char c, d;","int n;","cin >> c >> n >> d;",'cout << c << " " << n << " " << d << endl;'),input:"A12 b",
  predict:"輸入 A12 b，c、n、d 各會拿到什麼？",
  ask:"如果輸入改成 A 1 2 b（每個字中間都有空白），結果是什麼？"},
 {id:"1-4",title:"讀取失敗",isNew:"cin 失敗之後全部失效",
  goal:"如果要讀整數卻遇到字母，cin 會失敗，而且之後所有的 cin 都不會再讀任何東西。",
  code:M("int a, b, c;","cin >> a >> b >> c;",'cout << a << " " << b << " " << c << endl;'),input:"7 abc 5",
  predict:"輸入 7 abc 5，a、b、c 會是多少？",
  ask:"c 為什麼不是 5？要怎麼改宣告，才不會印出垃圾值？"}
]});
