/* ---------- English: chapter 16 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{16:{title:"Trees"}});
// 這一章的課都用同一個樹節點和同一棵樹
const TNODE_EN="struct Node {\n    int val;      // the value stored in the node\n    Node *left;   // the address of the left child, nullptr if none\n    Node *right;  // the address of the right child, nullptr if none\n};";
const TROOT_EN="    Node *root = new Node{1, nullptr, nullptr};  // the root\n\n    root->left = new Node{2, nullptr, nullptr};\n    root->right = new Node{3, nullptr, nullptr};\n    root->left->left = new Node{4, nullptr, nullptr};\n    root->left->right = new Node{5, nullptr, nullptr};\n    root->right->right = new Node{6, nullptr, nullptr};\n";
const TINS_EN="Node *insert(Node *t, int x) {  // put x into the BST rooted at t, and return the root afterwards\n    if (t == nullptr) {\n        return new Node{x, nullptr, nullptr};  // found an empty spot: put it here\n    }\n    if (x < t->val) {\n        t->left = insert(t->left, x);    // smaller: put it on the left\n    } else {\n        t->right = insert(t->right, x);  // bigger: put it on the right\n    }\n    return t;\n}";
const TIN_EN="void inorder(Node *t) {  // in-order: left → itself → right\n    if (t == nullptr) {\n        return;  // empty: do nothing\n    }\n    inorder(t->left);         // 1. go left first\n    cout << t->val << \" \";  // 2. then print itself\n    inorder(t->right);        // 3. go right last\n}";
const TSIFT_EN="void siftDown(int a[], int n, int i) {  // let a[i] sink down to the right place\n    int left, right;  // left child 2i + 1, right child 2i + 2\n    int big;          // which of i and its two children is the largest\n    int t;            // for swapping\n\n    while (2 * i + 1 < n) {\n        left = 2 * i + 1;\n        right = 2 * i + 2;\n        big = i;\n        if (a[left] > a[big]) {\n            big = left;\n        }\n        if (right < n && a[right] > a[big]) {\n            big = right;\n        }\n        if (big == i) {\n            break;  // bigger than both children: no need to sink further\n        }\n        t = a[i];\n        a[i] = a[big];\n        a[big] = t;\n        i = big;\n    }\n}";
const TH_EN="#include <iostream>\nusing namespace std;\n\n";
Object.assign(LESSON_EN,{
"16-1": {
"title": "What Is a Tree?",
"isNew": "root, parent, child, leaf, depth, height",
"uses": "struct, new, pointers (chapter 11)",
"goal": "A tree is a structure that branches down, level by level. This program builds a tree with the struct and new from chapter 11. Each node has two pointers: left points to the left child and right points to the right child, and nullptr means no child. A tree where each node has at most two children is called a \"binary tree\". Look at the tree diagram on the right:\nRoot: the node at the very top, here 1.\nParent and child: 1 is the parent of 2 and 3; 2 and 3 are the children of 1.\nLeaf: a node with no children, here 4, 5 and 6.\nDepth: how many steps it takes to walk from the root to it. The root's depth is 0, and the depth of 4 is 2.\nHeight: the depth of the deepest leaf. This tree's height is 2.",
"predict": "Which nodes of this tree are leaves? What is the tree's height?",
"ask": "To add a 7 on the left of 3, which line do you add? Which nodes are leaves after that?",
"code": TH_EN+TNODE_EN+"\n\nint main() {\n"+TROOT_EN+"    cout << \"The root is \" << root->val << endl;\n    return 0;\n}"
},
"16-2": {
"title": "Storing a Binary Tree in an Array",
"isNew": "the children of position i are at 2i + 1 and 2i + 2; its parent is at (i - 1) / 2",
"goal": "The last lesson linked nodes with pointers. If every level of the tree is filled from left to right (a \"complete binary tree\"), you can skip the pointers and store it directly in an array: a[0] is the root (level 1); a[1] and a[2] are level 2; a[3] to a[6] are level 3...\nArranged like this, the two children of position i are exactly at 2i + 1 and 2i + 2, and the other way round, the parent of position i is at (i - 1) / 2 (integer division). No pointers to store, just calculate.\nA \"max heap\" is a special complete binary tree: no position is smaller than its children, so a[0] is always the largest. This program prints each parent with its two children, so you can check that they all follow the rule.",
"predict": "Which cells hold the two children of a[1]? Which cell holds the parent of a[5]?",
"ask": "Why does the loop only need to run while i < 3? Which cells would the children of a[3] be in?",
"code": TH_EN+"int main() {\n    int a[7] = {9, 7, 8, 3, 5, 6, 1};  // already a max heap\n    int i;      // the parent's position\n    int left;   // left child: 2i + 1\n    int right;  // right child: 2i + 2\n    \n    for (i = 0; i < 3; i++) {\n        left = 2 * i + 1;\n        right = 2 * i + 2;\n        cout << a[i] << \" has children \" << a[left] << \" and \" << a[right] << endl;\n    }\n    return 0;\n}"
},
"16-3": {
"title": "Walking Down Along Pointers",
"isNew": "cur = cur->left: keep going left until nullptr",
"uses": "the tree in 16-1, while",
"goal": "To move around a tree, use a pointer cur to remember \"which node you are at now\". cur = cur->left takes one step to the left child; cur = cur->right takes one step to the right child.\nReaching nullptr means there are no nodes below, so the loop condition is cur != nullptr. Watch how the cur mark moves down the tree diagram on the right.",
"predict": "Which numbers are printed? What is cur when the loop ends?",
"ask": "If you keep going right instead, what is printed? How would you walk to 5?",
"code": TH_EN+TNODE_EN+"\n\nint main() {\n    Node *cur;  // which node we are at now\n"+TROOT_EN.replace("    Node *root","    Node *root")+"\n    cur = root;\n    while (cur != nullptr) {  // keep going left\n        cout << cur->val << \" \";\n        cur = cur->left;\n    }\n    cout << endl;\n    return 0;\n}"
},
"16-4": {
"title": "Pre-order Traversal",
"isNew": "recursion: handle itself first, then go left, then go right",
"uses": "recursion (chapter 9), the tree in 16-1",
"goal": "A \"traversal\" visits every node of the tree once. With recursion it is very short: when visiting node t, if t is nullptr, go straight back; otherwise \"print itself first, then go through the whole left subtree, then the whole right subtree\". This is called pre-order traversal.\nLook at the tree diagram on the right: the bold t is the level running now, and the faint t's are the levels above that are still waiting to come back. Together they form the path from the root to the current node.",
"predict": "Write down the pre-order traversal on paper first, then press Next to check your answer.",
"ask": "When it reaches node 4, how many levels of preorder are in memory at the same time? Which node does each level's t point to?",
"code": TH_EN+TNODE_EN+"\n\nvoid preorder(Node *t) {  // pre-order: itself → left → right\n    if (t == nullptr) {\n        return;  // empty: do nothing\n    }\n    cout << t->val << \" \";  // 1. print itself first\n    preorder(t->left);        // 2. then go left\n    preorder(t->right);       // 3. go right last\n}\n\nint main() {\n"+TROOT_EN+"\n    preorder(root);\n    cout << endl;\n    return 0;\n}"
},
"16-5": {
"title": "In-order Traversal",
"isNew": "left → itself → right: finish the whole left subtree before printing itself",
"uses": "pre-order traversal in 16-4",
"goal": "In-order traversal: go through the whole left subtree first, then print itself, and go through the whole right subtree last. The program is almost the same as pre-order; the cout line just moves to the \"middle\" of the two recursive calls.\nSo the root is not printed first: it has to wait until the whole left subtree is printed. Look at the tree diagram on the right: the bold t goes left all the way to the bottom before anything is printed.",
"predict": "Write down the in-order traversal on paper first. Which node is printed first?",
"ask": "In what place is the root (1) printed? Why?",
"code": TH_EN+TNODE_EN+"\n\n"+TIN_EN+"\n\nint main() {\n"+TROOT_EN+"\n    inorder(root);\n    cout << endl;\n    return 0;\n}"
},
"16-6": {
"title": "Post-order Traversal",
"isNew": "left → right → itself: print itself only after both sides are done",
"uses": "pre-order traversal in 16-4, in-order traversal in 16-5",
"goal": "Post-order traversal: go through the whole left subtree first, then the whole right subtree, and print itself last. So the root is always printed last.\nThe only difference between the three traversals is \"whether the cout line comes before, between or after the two recursive calls\":\nPre-order: itself → left → right (1 2 4 5 3 6)\nIn-order: left → itself → right (4 2 5 1 3 6)\nPost-order: left → right → itself\nAPCS concept questions often give a tree and ask for the order of the three traversals. Write down the post-order answer on paper first, then run it to compare.",
"predict": "What is the post-order traversal of this tree?",
"ask": "Pre-order always has the root first, and post-order always has the root last. If you only know the pre-order and in-order sequences, can you draw the original tree?",
"code": TH_EN+TNODE_EN+"\n\nvoid postorder(Node *t) {  // post-order: left → right → itself\n    if (t == nullptr) {\n        return;  // empty: do nothing\n    }\n    postorder(t->left);       // 1. go left first\n    postorder(t->right);      // 2. then go right\n    cout << t->val << \" \";  // 3. print itself last\n}\n\nint main() {\n"+TROOT_EN+"\n    postorder(root);\n    cout << endl;\n    return 0;\n}"
},
"16-7": {
"title": "Level-order Traversal",
"isNew": "use a queue to go level by level: take one out, line up its children at the back",
"uses": "queue (chapter 13), the tree in 16-1",
"goal": "Level-order traversal starts at the root and visits the nodes level by level, from left to right. It uses a queue (chapter 13):\n1. Put the root into the queue first.\n2. Take the node at the front of the queue, print it, and then line up its left child and right child (if they are not nullptr) at the back of the queue.\n3. Repeat until the queue is empty.\nA first-in-first-out queue makes sure the nodes of the upper level come out first. Look at the right: the nodes marked \"in q\" are the ones still waiting in line.",
"predict": "What is the level-order traversal? When 2 is printed, which nodes are in the queue?",
"ask": "If you change the queue to a stack (push, top, pop), what does the order become? Which traversal does it look like?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\n"+TNODE_EN+"\n\nint main() {\n    queue<Node*> q;  // nodes lined up, waiting to be visited\n    Node *cur;       // the node taken out now\n"+TROOT_EN+"\n    q.push(root);\n    while (!q.empty()) {\n        cur = q.front();\n        q.pop();\n        cout << cur->val << \" \";\n        if (cur->left != nullptr) {\n            q.push(cur->left);\n        }\n        if (cur->right != nullptr) {\n            q.push(cur->right);\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"16-8": {
"title": "Height and Number of Nodes",
"isNew": "with recursion: the answer for the whole tree = combine the answers for the left and the right",
"uses": "the recursive traversal in 16-4",
"goal": "Many tree problems can be thought of like this: once the answer for the whole left subtree and the whole right subtree are known, how do you combine them into the answer for the whole tree?\nNumber of nodes: nodes on the left + nodes on the right + 1 (itself). An empty tree has 0.\nHeight: the taller of the two sides + 1. An empty tree has height -1, so a tree with only one node (a leaf) has height exactly 0.",
"predict": "What are the number of nodes and the height? What does height(node 4) return?",
"ask": "If an empty tree's height were written as 0 (not -1), how far off would the computed height be?",
"code": TH_EN+TNODE_EN+"\n\nint countNodes(Node *t) {  // how many nodes the tree rooted at t has\n    if (t == nullptr) {\n        return 0;\n    }\n    return countNodes(t->left) + countNodes(t->right) + 1;\n}\n\nint height(Node *t) {  // the height of the tree rooted at t\n    int hl, hr;  // the height of the left side and of the right side\n\n    if (t == nullptr) {\n        return -1;  // an empty tree has height -1\n    }\n    hl = height(t->left);\n    hr = height(t->right);\n    return max(hl, hr) + 1;\n}\n\nint main() {\n"+TROOT_EN+"\n    cout << \"Nodes: \" << countNodes(root) << endl;\n    cout << \"Height: \" << height(root) << endl;\n    return 0;\n}"
},
"16-9": {
"title": "General Trees",
"isNew": "a node can have many children: child[i] is the list of node i's children",
"uses": "2D vectors (lesson 7-10), recursion",
"goal": "Not every tree is a binary tree. In a company's org chart or a computer's folders, a node can have many children. A common way to store this: number the nodes 0 to n-1, and let the vector child[i] hold all the children of node i. APCS tree problems are often stored like this.\nThe idea for the height is the same as for a binary tree: the height of each child + 1, take the largest; a node with no children (a leaf) has height 0. Look at the 2D vector on the right: each row is the list of one node's children.",
"predict": "Which nodes are leaves? What is the height of the whole tree?",
"ask": "Add a child 7 under node 6 (child needs 8 rows). What does the height become?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint height(vector<vector<int>> &child, int v) {  // the height of the tree rooted at node v\n    int best = 0;  // the tallest height so far\n    int k;         // which child\n\n    for (k = 0; k < child[v].size(); k++) {\n        best = max(best, height(child, child[v][k]) + 1);\n    }\n    return best;\n}\n\nint main() {\n    vector<vector<int>> child(7);  // child[i]: the children of node i\n    int i;  // which node\n\n    child[0].push_back(1);\n    child[0].push_back(2);\n    child[0].push_back(3);  // node 0 has three children\n    child[1].push_back(4);\n    child[1].push_back(5);\n    child[3].push_back(6);\n    for (i = 0; i < 7; i++) {\n        cout << i << \" has \" << child[i].size() << \" children\" << endl;\n    }\n    cout << \"Height: \" << height(child, 0) << endl;\n    return 0;\n}"
},
"16-10": {
"title": "BST Rules and Searching",
"isNew": "everything on the left is smaller, everything on the right is bigger; a search goes one way each step",
"uses": "walking down along pointers in 16-3",
"goal": "A binary search tree (BST) has one rule: every value in a node's whole left subtree is smaller than it, and every value in its whole right subtree is bigger.\nSo to find a number x, you do not need to look at everything: if x is smaller than the current node, go left; if bigger, go right; if equal, it is found; reaching nullptr means it is not there. This is a lot like the binary search in chapter 15: each step throws one side away.",
"predict": "Which nodes does the search for 7 pass through?",
"ask": "Change x to 6 (not in the tree). Where does cur stop at the end?",
"code": TH_EN+TNODE_EN+"\n\nint main() {\n    Node *cur;          // which node we are at now\n    int x = 7;          // the number to find\n    bool found = false;  // found it yet?\n    Node *root = new Node{5, nullptr, nullptr};  // the root\n\n    root->left = new Node{3, nullptr, nullptr};\n    root->right = new Node{8, nullptr, nullptr};\n    root->left->left = new Node{1, nullptr, nullptr};\n    root->left->right = new Node{4, nullptr, nullptr};\n    root->right->left = new Node{7, nullptr, nullptr};\n    root->right->right = new Node{9, nullptr, nullptr};\n\n    cur = root;\n    while (cur != nullptr) {\n        if (x == cur->val) {\n            found = true;\n            break;\n        } else if (x < cur->val) {\n            cur = cur->left;   // smaller: look on the left\n        } else {\n            cur = cur->right;  // bigger: look on the right\n        }\n    }\n    cout << found << endl;\n    return 0;\n}"
},
"16-11": {
"title": "Inserting into a BST",
"isNew": "compare all the way down, and put it at the empty spot (nullptr)",
"uses": "BST rules in 16-10, recursion, functions that return a pointer",
"goal": "To put x into a BST, compare all the way down just like a search: smaller goes left, bigger goes right. When you reach nullptr (an empty spot), make a new node there with new.\ninsert returns \"the root of this tree after inserting\": at an empty spot it returns the new node, and otherwise it returns the old t. So t->left = insert(t->left, x) links the new node in. Watch the tree on the right grow one node at a time.",
"predict": "If 5, 3, 8, 1, 4, 7, 9 are put in in order, what does the tree look like?",
"ask": "Change the order to 1, 3, 4, 5, 7, 8, 9 (already sorted). What shape does the tree become? Is searching still fast?",
"code": TH_EN+TNODE_EN+"\n\n"+TINS_EN+"\n\nint main() {\n    Node *root = nullptr;              // the tree starts empty\n    int a[7] = {5, 3, 8, 1, 4, 7, 9};  // the numbers put in, in order\n    int i;                             // which one\n\n    for (i = 0; i < 7; i++) {\n        root = insert(root, a[i]);\n    }\n    cout << root->val << \" \" << root->left->val << \" \" << root->right->val << endl;\n    return 0;\n}"
},
"16-12": {
"title": "In-order Traversal of a BST: Small to Large",
"isNew": "an in-order traversal of a BST prints from small to large",
"uses": "in-order traversal in 16-5, BST insertion in 16-11",
"goal": "In a BST, the left side is smaller and the right side is bigger, and in-order traversal is \"left → itself → right\", so it prints from small to large. In other words, insert numbers into a BST one by one, do one in-order traversal, and they are sorted.",
"predict": "What is printed?",
"ask": "If you use pre-order traversal instead, is it still from small to large?",
"code": TH_EN+TNODE_EN+"\n\n"+TINS_EN+"\n\n"+TIN_EN+"\n\nint main() {\n    Node *root = nullptr;              // the tree starts empty\n    int a[7] = {5, 3, 8, 1, 4, 7, 9};  // the numbers put in, in order\n    int i;                             // which one\n\n    for (i = 0; i < 7; i++) {\n        root = insert(root, a[i]);\n    }\n    inorder(root);\n    cout << endl;\n    return 0;\n}"
},
"16-13": {
"title": "Building a Max Heap",
"isNew": "starting from the last parent, let each position sink down",
"uses": "2i + 1 and 2i + 2 in 16-2, functions",
"goal": "How does a normal array become a max heap? Use siftDown (sink down): if a[i] is smaller than its children, swap it with the bigger child, and keep comparing after it moves down, until it is bigger than both children or has no children.\nStart from the last position that has children (n / 2 - 1) and work forward to a[0]. Then the whole array is a max heap, and the largest number moves to a[0].",
"predict": "After it is built, which number is a[0]?",
"ask": "Check with the method in 16-2: in the built array, is every parent bigger than its children?",
"code": TH_EN+TSIFT_EN+"\n\nint main() {\n    int a[7] = {4, 10, 3, 5, 1, 8, 2};  // not a heap yet\n    int n = 7;                         // how many\n    int start;                         // which parent to start sinking from\n    int i;                             // for printing\n\n    for (start = n / 2 - 1; start >= 0; start--) {\n        siftDown(a, n, start);\n    }\n    for (i = 0; i < n; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"16-14": {
"title": "C++'s Built-in priority_queue",
"isNew": "#include <queue>: things you push are sorted automatically, and top() is always the largest",
"uses": "the max heap in 16-13",
"goal": "In the last lesson, you wrote a max heap yourself. C++ has one built in: a priority_queue has a heap inside it. push puts things in, top() looks at the largest, pop() takes the largest away, and empty() and size() work like a stack.\nTo take the smallest each time, declare it as priority_queue<int, vector<int>, greater<int>>. APCS programming problems often use it to \"pick the largest or smallest each time\".\n(This website draws it as a sorted row, with the top at the front. Inside real C++, it is stored as a heap.)",
"predict": "In what order does the first while loop print?",
"ask": "How is this related to heap sort in chapter 14?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\nint main() {\n    priority_queue<int> pq;  // the largest is on top\n    priority_queue<int, vector<int>, greater<int>> small;  // the smallest is on top\n    int x;  // the number read\n    \n    while (cin >> x) {\n        pq.push(x);\n        small.push(x);\n    }\n    while (!pq.empty()) {\n        cout << pq.top() << \" \";\n        pq.pop();\n    }\n    cout << endl;\n    cout << \"The smallest is \" << small.top() << endl;\n    return 0;\n}"
}
});
