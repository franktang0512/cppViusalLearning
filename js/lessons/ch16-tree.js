/* ---------- 第 16 章 樹：用指標和用陣列存樹、在樹裡移動、heap（其他主題還在大綱裡） ---------- */
CHAPTERS.push({part:"進階程式設計",id:16,title:"樹",soon:["一般的樹", "前中後序走訪", "層序走訪", "高度和節點數", "BST 的規則與搜尋", "BST 插入", "中序走訪 BST", "priority_queue"],lessons:[
 {id:"16-1",title:"樹是什麼",isNew:"根、父親、孩子、葉子、深度、高度",uses:"struct、new、指標（第 11 章）",
  goal:"樹是一種一層一層往下分支的結構。這支程式用第 11 章的 struct 和 new 做出一棵樹，每個節點有兩個指標：left 指向左孩子、right 指向右孩子，沒有孩子就是 nullptr。這種每個節點最多兩個孩子的樹叫做「二元樹」。看右邊的樹狀圖：\n根（root）：最上面的節點，這裡是 1。\n父親、孩子：1 是 2 和 3 的父親；2 和 3 是 1 的孩子。\n葉子：沒有孩子的節點，這裡是 4、5、6。\n深度：從根走到它要走幾步，根的深度是 0，4 的深度是 2。\n高度：最深的葉子的深度，這棵樹的高度是 2。",
  code:FN(["struct Node {","    int val;      // 節點存的值","    Node *left;   // 左孩子的位址，沒有就是 nullptr","    Node *right;  // 右孩子的位址，沒有就是 nullptr","};"],"Node *root = new Node{1, nullptr, nullptr};  // 根","","root->left = new Node{2, nullptr, nullptr};","root->right = new Node{3, nullptr, nullptr};","root->left->left = new Node{4, nullptr, nullptr};","root->left->right = new Node{5, nullptr, nullptr};","root->right->right = new Node{6, nullptr, nullptr};","cout << \"根是 \" << root->val << endl;"),input:null,
  predict:"這棵樹有哪些葉子？樹的高度是多少？",
  ask:"想在 3 的左邊多接一個 7，要加哪一行？加了以後葉子有哪些？"},
 {id:"16-2",title:"用陣列存二元樹",isNew:"位置 i 的孩子在 2i + 1 和 2i + 2，父親在 (i - 1) / 2",
  goal:"上一課用指標把節點接起來。如果樹的每一層都從左到右排滿（叫做「完全二元樹」），也可以不用指標，直接用一個陣列存：a[0] 是根（第 1 層）；a[1]、a[2] 是第 2 層；a[3] ～ a[6] 是第 3 層……\n這樣排的話，位置 i 的兩個孩子剛好在 2i + 1 和 2i + 2，反過來，位置 i 的父親在 (i - 1) / 2（整數除法），不用存指標，用算的就好。\n「最大堆積」（heap）是一種特別的完全二元樹：每一個位置都不比它的孩子小，所以 a[0] 一定是最大的。這支程式把每個父親和它的兩個孩子印出來，檢查是不是都符合規則。",
  code:M("int a[7] = {9, 7, 8, 3, 5, 6, 1};  // 已經是一個最大堆積","int i;      // 父親的位置","int left;   // 左孩子：2i + 1","int right;  // 右孩子：2i + 2","","for (i = 0; i < 3; i++) {","    left = 2 * i + 1;","    right = 2 * i + 2;","    cout << a[i] << \" 的孩子是 \" << a[left] << \" 和 \" << a[right] << endl;","}"),input:null,markers:{"a": ["i", "left", "right"]},
  predict:"a[1] 的兩個孩子在第幾格？a[5] 的父親在第幾格？",
  ask:"為什麼迴圈只要跑到 i < 3？a[3] 的孩子會在第幾格？"},
 {id:"16-3",title:"沿著指標往下走",isNew:"cur = cur->left：一直往左走，走到 nullptr 為止",uses:"16-1 的樹、while",
  goal:"要在樹裡移動，就用一個指標 cur 記住「現在在哪個節點」。cur = cur->left 就是往左孩子走一步；cur = cur->right 就是往右孩子走一步。\n走到 nullptr 就代表下面沒有節點了，所以迴圈的條件是 cur != nullptr。看右邊樹狀圖上 cur 的標記怎麼往下移。",
  code:FN(["struct Node {","    int val;      // 節點存的值","    Node *left;   // 左孩子的位址，沒有就是 nullptr","    Node *right;  // 右孩子的位址，沒有就是 nullptr","};"],"Node *cur;  // 現在走到哪個節點","Node *root = new Node{1, nullptr, nullptr};  // 根","","root->left = new Node{2, nullptr, nullptr};","root->right = new Node{3, nullptr, nullptr};","root->left->left = new Node{4, nullptr, nullptr};","root->left->right = new Node{5, nullptr, nullptr};","root->right->right = new Node{6, nullptr, nullptr};","","cur = root;","while (cur != nullptr) {  // 一直往左走","    cout << cur->val << \" \";","    cur = cur->left;","}","cout << endl;"),input:null,
  predict:"會印出哪些數字？迴圈結束的時候 cur 是什麼？",
  ask:"改成一直往右走，會印出什麼？如果想走到 5，要怎麼走？"},
 {id:"16-4",title:"建立最大堆積",isNew:"從最後一個父親開始，讓每個位置往下沉",uses:"16-2 的 2i + 1、2i + 2、函式",
  goal:"一般的陣列怎麼變成最大堆積？用 siftDown（往下沉）：如果 a[i] 比它的孩子小，就跟比較大的那個孩子交換，換下去以後再繼續比，直到比兩個孩子都大，或是沒有孩子了。\n從最後一個有孩子的位置（n / 2 - 1）開始，一路往前做到 a[0]，整個陣列就變成最大堆積，最大的數字會跑到 a[0]。",
  code:FN(["void siftDown(int a[], int n, int i) {  // 讓 a[i] 往下沉到對的位置","    int left, right;  // 左孩子 2i + 1、右孩子 2i + 2","    int big;          // i 和兩個孩子裡，最大的在哪","    int t;            // 交換用","","    while (2 * i + 1 < n) {","        left = 2 * i + 1;","        right = 2 * i + 2;","        big = i;","        if (a[left] > a[big]) {","            big = left;","        }","        if (right < n && a[right] > a[big]) {","            big = right;","        }","        if (big == i) {","            break;  // 比兩個孩子都大，不用再沉了","        }","        t = a[i];","        a[i] = a[big];","        a[big] = t;","        i = big;","    }","}"],"int a[7] = {4, 10, 3, 5, 1, 8, 2};  // 還不是堆積","int n = 7;                         // 有幾個","int start;                         // 從哪一個父親開始往下沉","int i;                             // 印出來用","","for (start = n / 2 - 1; start >= 0; start--) {","    siftDown(a, n, start);","}","for (i = 0; i < n; i++) {","    cout << a[i] << \" \";","}","cout << endl;"),input:null,markers:{"a": ["start", "i", "big"]},
  predict:"建完以後 a[0] 是哪個數字？",
  ask:"用 16-2 的方法檢查：建好的陣列，每個父親都比孩子大嗎？"}
]});
