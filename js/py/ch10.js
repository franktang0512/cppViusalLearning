/* ---------- Python 第 10 章 名字與物件（短章，取代 C++ 的指標） ----------
   C++ 這一章教指標：變數存的是位址，用箭頭指到別的格子。
   Python 的每一個名字本來就是箭頭，所以這裡把前面看過的現象整理起來：
   哪些物件可以改、is 和 == 的差別、淺複製和深複製。 */
setPyLessons(10,[
 {id:"10-1",title:"可變的和不可變的物件",isNew:"list、dict、set 可以改內容；int、str、tuple 不能改，只能做新的",uses:"5-10 的 b = a、6-2 字串不能改、8-8",
  goal:"C++ 的指標存的是「位址」，可以指向別的格子。Python 的每一個名字本來就像指標：名字是箭頭，指著一個物件。\n那為什麼 5-10 用 b 改了 list，a 也跟著變；可是 y += 1 不會改到 x？差別在物件能不能改：\n・list、dict、set 是「可變的」：b.append(3) 是改那個物件本身，所有指著它的名字都看得到。\n・int、str、tuple 是「不可變的」：y += 1 沒辦法改 5，只能做出一個新的 6，再把 y 改貼過去，x 還是指著 5。\n看右邊的箭頭怎麼移動。",
  code:PY("a = [1, 2]","b = a","b.append(3)","print(a, b)","x = 5","y = x","y += 1","print(x, y)","s = \"hi\"","t = s","t += \"!\"","print(s, t)"),input:null,
  predict:"三個 print 各會印出什麼？哪幾行讓箭頭改指新的物件？",
  ask:"把 b.append(3) 改成 b = b + [3]，a 還會跟著變嗎？（提示：+ 會做出新的 list）"},
 {id:"10-2",title:"is 和 == 不一樣",isNew:"== 比值一不一樣；is 比是不是同一個物件；x is None",uses:"10-1",
  goal:"a 和 b 裡面的值一模一樣，可是它們是兩個不同的 list；c = a 則是同一個 list 多一個名字。\n・a == b 問的是「值一樣嗎？」→ True\n・a is b 問的是「是同一個物件嗎？」（箭頭指著同一個東西）→ False\n平常比較都用 ==。is 最常用在 x is None：檢查一個名字是不是還指著 None。數字和字串不要用 is 比，結果說不準。",
  code:PY("a = [1, 2, 3]","b = [1, 2, 3]","c = a","print(a == b, a is b)","print(a == c, a is c)","result = None","if result is None:","    print(\"還沒有結果\")"),input:null,
  predict:"第一行和第二行 print 各印出什麼？",
  ask:"c.append(4) 之後，a == b 還是 True 嗎？a is c 呢？"},
 {id:"10-3",title:"淺複製與深複製",isNew:"g.copy() 只複製外層；copy.deepcopy(g) 連裡面每一列都複製",uses:"5-10 的 .copy()、7-7 的二維 list",
  goal:"5-10 學過 a.copy() 會做出另一個 list。可是二維 list 的每一格都是「指向一列的箭頭」，g.copy() 只把外層這一排箭頭複製一份，裡面的每一列還是同一個。這叫「淺複製」：改 h[0][0]，g 也跟著變！\n要連裡面的每一列都複製，用 copy 模組的 copy.deepcopy(g)，叫做「深複製」。也可以自己寫 [row.copy() for row in g]。\n看右邊：h 的箭頭指著 g 的那兩列，k 有自己的兩列。",
  code:PY("import copy","g = [[1, 2], [3, 4]]","h = g.copy()          # 淺複製","h[0][0] = 99","print(g)","k = copy.deepcopy(g)  # 深複製","k[1][1] = 0","print(g)","print(k)"),input:null,
  predict:"h[0][0] = 99 之後，g 會變嗎？k[1][1] = 0 之後呢？",
  ask:"把 h = g.copy() 改成 h = [row.copy() for row in g]，h[0][0] = 99 還會改到 g 嗎？"}
]);
