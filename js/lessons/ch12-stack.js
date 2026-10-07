/* ---------- 第 12 章 Stack：先用陣列自己做，再看 C++ 內建的 stack ---------- */
const H12=(head,...body)=>M(...body).replace("#include <iostream>","#include <iostream>\n"+head);
CHAPTERS.push({part:"進階程式設計",id:12,title:"Stack",lessons:[
 {id:"12-1",title:"用陣列做一個 stack",isNew:"stack 像一疊盤子：push 放上去、pop 拿最上面",
  goal:"stack（堆疊）像一疊盤子：只能從最上面放（push），也只能從最上面拿（pop）。用陣列來做，再加一個 top 記住「最上面那一個在第幾格」。top 是 -1 代表空的。",
  code:M("int st[5];     // 放資料的陣列，最多 5 個","int top = -1;  // 最上面那一個在第幾格，-1 代表空的","","top = top + 1;  // push 10","st[top] = 10;","top = top + 1;  // push 20","st[top] = 20;","top = top + 1;  // push 30","st[top] = 30;","while (top >= 0) {","    cout << st[top] << endl;  // 看最上面那一個","    top = top - 1;            // pop：top 往下移一格","}"),input:null,markers:{"st": ["top"]},
  predict:"放進去的順序是 10、20、30，印出來的順序是什麼？",
  ask:"pop 之後，st[2] 裡面的 30 還在記憶體裡嗎？為什麼不用把它清掉？"},
 {id:"12-2",title:"後進先出",isNew:"LIFO：最後放進去的最先拿出來",
  goal:"stack 的規則叫做「後進先出」（LIFO）：最後 push 進去的，最先被 pop 出來。這個程式讀一串數字：大於 0 就 push，讀到 0 就 pop 並印出來。",
  code:M("int st[10];    // 放資料的陣列","int top = -1;  // 最上面那一個在第幾格，-1 代表空的","int x;         // 讀進來的數字：大於 0 就 push，0 就 pop","","while (cin >> x) {","    if (x > 0) {","        top = top + 1;","        st[top] = x;","    } else {","        cout << st[top] << \" \";","        top = top - 1;","    }","}","cout << endl;"),input:"1 2 0 3 0 0",markers:{"st": ["top"]},
  predict:"輸入 1 2 0 3 0 0，會印出哪三個數字？",
  ask:"把輸入改成 1 0 0，第二個 0 要 pop 的時候會發生什麼事？"},
 {id:"12-3",title:"空的不能 pop、滿的不能 push",isNew:"pop 前檢查 top == -1、push 前檢查滿了沒",
  goal:"stack 空的時候（top 是 -1）不能 pop，不然會讀到 st[-1]；陣列滿了也不能再 push。所以 push 和 pop 之前都要先檢查。",
  code:M("int st[3];     // 放資料的陣列，只有 3 格","int top = -1;  // 最上面那一個在第幾格，-1 代表空的","int x;         // 讀進來的數字：大於 0 就 push，0 就 pop","","while (cin >> x) {","    if (x > 0) {","        if (top == 2) {","            cout << \"滿了 \";","        } else {","            top = top + 1;","            st[top] = x;","        }","    } else if (top == -1) {","        cout << \"空的 \";","    } else {","        cout << st[top] << \" \";","        top = top - 1;","    }","}","cout << endl;"),input:"5 0 0 1 2 3 4",markers:{"st": ["top"]},
  predict:"輸入 5 0 0 1 2 3 4，會印出什麼？",
  ask:"「滿了」的條件為什麼是 top == 2，不是 top == 3？"},
 {id:"12-4",title:"應用：括號有沒有配對",isNew:"遇到左括號 push、遇到右括號就和最上面的比",
  goal:"檢查括號有沒有配對好，就是 stack 的經典用法：遇到左括號就 push；遇到右括號，最上面的左括號必須是同一種，配對成功就 pop。全部看完以後，stack 要剛好是空的。",
  code:H12("#include <string>","string s;        // 輸入的括號字串","char st[20];     // 放還沒配對的左括號","int top = -1;    // 最上面那一個在第幾格，-1 代表空的","int i;           // 第幾個字元","bool ok = true;  // 到目前為止都配對成功","","cin >> s;","for (i = 0; i < s.length(); i++) {","    if (s[i] == '(' || s[i] == '[') {","        top = top + 1;","        st[top] = s[i];","    } else if (top == -1) {","        ok = false;","    } else if ((s[i] == ')' && st[top] == '(') || (s[i] == ']' && st[top] == '[')) {","        top = top - 1;","    } else {","        ok = false;","    }","}","if (ok && top == -1) {","    cout << \"配對成功\" << endl;","} else {","    cout << \"配對失敗\" << endl;","}"),input:"([()])",markers:{"st": ["top"], "s": ["i"]},
  predict:"輸入 ([()])，看到第一個 ) 的時候，stack 最上面是什麼？",
  ask:"把輸入改成 ([)] 和 (() 試試看，分別是在哪一步發現配對失敗的？"},
 {id:"12-5",title:"C++ 內建的 stack",isNew:"#include <stack>：push、pop、top、empty、size",
  goal:"C++ 已經幫你做好 stack 了：#include <stack> 之後，用 stack<int> 宣告，就不用自己管陣列和 top。st.push(x) 放上去、st.top() 看最上面、st.pop() 拿掉最上面、st.empty() 問是不是空的、st.size() 問有幾個。",
  code:H12("#include <stack>","stack<int> st;  // C++ 內建的 stack，不用自己管 top","int x;          // 讀進來的數字","","while (cin >> x) {","    st.push(x);","}","cout << \"共 \" << st.size() << \" 個\" << endl;","while (!st.empty()) {","    cout << st.top() << \" \";","    st.pop();","}","cout << endl;"),input:"1 2 3",
  predict:"輸入 1 2 3，第二行會印出什麼順序？",
  ask:"把 while (!st.empty()) 拿掉，直接連續 pop 四次，會發生什麼事？跟 12-2 用陣列做的比較看看。"}
]});
