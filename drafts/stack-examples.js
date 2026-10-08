/* ---------- Stack 的解題型內容（之後做例題用）----------
   這個檔案沒有被 index.html 載入。要用的時候，把需要的課搬回 js/lessons/ch12-stack.js，
   或改成例題的格式（加上 tests）。H12 定義在 ch12-stack.js。 */
const STACK_DRAFTS=[
 {id:"12-4",title:"應用：括號有沒有配對",isNew:"遇到左括號 push、遇到右括號就和最上面的比",
  goal:"檢查括號有沒有配對好，就是 stack 的經典用法：遇到左括號就 push；遇到右括號，最上面的左括號必須是同一種，配對成功就 pop。全部看完以後，stack 要剛好是空的。",
  code:H12("#include <string>","string s;        // 輸入的括號字串","char st[20];     // 放還沒配對的左括號","int top = -1;    // 最上面那一個在第幾格，-1 代表空的","int i;           // 第幾個字元","bool ok = true;  // 到目前為止都配對成功","","cin >> s;","for (i = 0; i < s.length(); i++) {","    if (s[i] == '(' || s[i] == '[') {","        top = top + 1;","        st[top] = s[i];","    } else if (top == -1) {","        ok = false;","    } else if ((s[i] == ')' && st[top] == '(') || (s[i] == ']' && st[top] == '[')) {","        top = top - 1;","    } else {","        ok = false;","    }","}","if (ok && top == -1) {","    cout << \"配對成功\" << endl;","} else {","    cout << \"配對失敗\" << endl;","}"),input:"([()])",markers:{"st": ["top"], "s": ["i"]},
  predict:"輸入 ([()])，看到第一個 ) 的時候，stack 最上面是什麼？",
  ask:"把輸入改成 ([)] 和 (() 試試看，分別是在哪一步發現配對失敗的？"},
 {id:"12-7",title:"出棧順序做得到嗎？",isNew:"1 ～ n 依序進 stack，能不能照指定的順序出來",
  goal:"數字 1、2、3……依序進 stack，中間隨時可以 pop。問：能不能剛好照「想要的順序」把數字拿出來？\n做法：照想要的順序一個一個處理。想要的數字還沒進來，就一直 push 到它進來；進來以後，它必須剛好在最上面才能 pop，不在最上面就代表做不到。",
  code:H12("#include <stack>","stack<int> st;    // 模擬的 stack","int n;            // 有幾個數字（1 ～ n 依序進來）","int want[10];     // 想要的出棧順序","int i;            // 第幾個","int next = 1;     // 下一個要進 stack 的數字","bool ok = true;   // 到目前為止都做得到","","cin >> n;","for (i = 0; i < n; i++) {","    cin >> want[i];","}","for (i = 0; i < n && ok; i++) {","    while (next <= want[i]) {","        st.push(next);","        next = next + 1;","    }","    if (!st.empty() && st.top() == want[i]) {","        st.pop();","    } else {","        ok = false;","    }","}","if (ok) {","    cout << \"做得到\" << endl;","} else {","    cout << \"做不到\" << endl;","}"),input:"3\n3 1 2",markers:{"want": ["i"]},
  predict:"1、2、3 依序進來，想要的出棧順序是 3 1 2，做得到嗎？卡在哪一步？",
  ask:"把輸入改成 3 和 2 3 1，再試 1 2 3。哪些做得到？"},
 {id:"12-9",title:"後序運算式求值",isNew:"看到數字就 push；看到運算子就 pop 兩個、算完再 push 回去",
  goal:"後序運算式把運算子寫在兩個數字的後面：3 4 + 就是 3 + 4，3 4 + 2 * 就是 (3 + 4) × 2。好處是不需要括號，用一個 stack 就能算：\n1. 看到數字：push。\n2. 看到運算子：pop 出兩個數字（先拿出來的是右邊那個），算完把結果 push 回去。\n3. 全部看完，stack 裡剩下的那一個就是答案。\n（這裡每個數字只有一位數，用 char 一個一個讀。）",
  code:H12("#include <stack>","stack<int> st;  // 放還沒用到的數字","char c;         // 讀進來的一個字元","int x, y;       // 拿出來的兩個數字：x 在左邊、y 在右邊","","while (cin >> c) {","    if (c >= '0' && c <= '9') {","        st.push(c - '0');","    } else {","        y = st.top();","        st.pop();","        x = st.top();","        st.pop();","        if (c == '+') {","            st.push(x + y);","        } else if (c == '-') {","            st.push(x - y);","        } else if (c == '*') {","            st.push(x * y);","        } else {","            st.push(x / y);","        }","    }","}","cout << st.top() << endl;"),input:"3 4 + 2 *",
  predict:"看到 * 的時候，stack 裡由上到下是哪些數字？",
  ask:"把輸入改成 8 2 - 3 *，答案是多少？為什麼先拿出來的要當 y（右邊）？試試 8 2 - 改成先拿的當 x 會怎樣。"},
 {id:"12-10",title:"括號配對進階版",isNew:"三種括號一起檢查，還要指出第幾個字元出錯",
  goal:"12-4 只檢查小括號和中括號。這一課三種括號 ( )、[ ]、{ } 一起檢查，而且出錯時要說出是第幾個字元（從 0 開始數）。\n出錯有三種情況：右括號來的時候 stack 是空的；右括號跟最上面的左括號不是同一種；全部看完了 stack 卻還有沒配對的左括號。",
  code:H12("#include <stack>\n#include <string>","string s;        // 輸入的括號字串","stack<char> st;  // 放還沒配對的左括號","int i;           // 第幾個字元","int bad = -1;    // 第一個出錯的位置，-1 代表還沒出錯","","cin >> s;","for (i = 0; i < s.length() && bad == -1; i++) {","    if (s[i] == '(' || s[i] == '[' || s[i] == '{') {","        st.push(s[i]);","    } else if (st.empty()) {","        bad = i;","    } else if ((s[i] == ')' && st.top() == '(') || (s[i] == ']' && st.top() == '[') || (s[i] == '}' && st.top() == '{')) {","        st.pop();","    } else {","        bad = i;","    }","}","if (bad == -1 && !st.empty()) {","    bad = s.length();  // 看完了還有左括號沒配對","}","if (bad == -1) {","    cout << \"配對成功\" << endl;","} else {","    cout << \"第 \" << bad << \" 個字元出錯\" << endl;","}"),input:"{[()]}(]",markers:{"s": ["i"]},
  predict:"輸入 {[()]}(]，會在第幾個字元發現錯誤？那時候 stack 最上面是什麼？",
  ask:"試試 ({[ 和 ]()。它們分別是哪一種出錯情況？"}
];
