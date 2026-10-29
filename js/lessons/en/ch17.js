/* ---------- English: chapter 17 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{17:{title:"Graphs (1): Storing and Traversing Graphs"}});
// 這一章大部分的課用同一個鄰接矩陣：寫在 main 外面（GMG）或 main 裡面（GML）
const GMG_EN="int g[5][5] = {{0, 1, 1, 0, 0},\n               {1, 0, 0, 1, 0},\n               {1, 0, 0, 1, 0},\n               {0, 1, 1, 0, 1},\n               {0, 0, 0, 1, 0}};  // adjacency matrix: g[u][v] = 1 means there is an edge between u and v";
const GML_EN="    int g[5][5] = {{0, 1, 1, 0, 0},\n                   {1, 0, 0, 1, 0},\n                   {1, 0, 0, 1, 0},\n                   {0, 1, 1, 0, 1},\n                   {0, 0, 0, 1, 0}};  // adjacency matrix: g[u][v] = 1 means there is an edge between u and v";
Object.assign(LESSON_EN,{
"17-1": {
"title": "What Is a Graph? Points and Edges",
"isNew": "points, edges, degree; storing edges in two arrays",
"uses": "arrays, for",
"goal": "A graph is made of \"points\" (also called vertices) and \"edges\". A point can be a train station, a person or a web page, and an edge means two points are related (there is a road, they are friends, there is a link).\nThe trees in chapter 16 are also graphs, but a tree has no cycles and has a root. A general graph can loop around in a circle and has no root.\nThe most direct way to store one: write the two ends of edge i in eu[i] and ev[i]. The number of edges a point is connected to is called its \"degree\".",
"predict": "Which point has the most edges? What is the sum of all the degrees?",
"ask": "How is the sum of all the degrees related to the number of edges m? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 5, m = 5;              // 5 points, 5 edges\n    int eu[5] = {0, 0, 1, 2, 3};   // one end of edge i\n    int ev[5] = {1, 2, 3, 3, 4};   // the other end of edge i\n    int deg[5] = {};               // how many edges each point has (its degree)\n\n    for (int i = 0; i < m; i++) {\n        deg[eu[i]]++;\n        deg[ev[i]]++;\n    }\n    for (int v = 0; v < n; v++) {\n        cout << v << \" has \" << deg[v] << \" edges\" << endl;\n    }\n    return 0;\n}"
},
"17-2": {
"title": "Directed Graphs: One-Way Streets",
"isNew": "a directed edge u → v; out-degree and in-degree",
"uses": "the edge arrays in 17-1",
"goal": "Some relations go only one way: one-way streets, following someone, prerequisite courses. Such an edge has a direction and is drawn as an arrow. This is called a \"directed graph\".\nIn a directed graph, you count two things separately: the number of edges going out of a point is its \"out-degree\", and the number coming in is its \"in-degree\". The edge eu[i] → ev[i] adds 1 to the out-degree of eu[i] and 1 to the in-degree of ev[i].",
"predict": "Which point only has edges going out, with none coming in? Which point is the opposite?",
"ask": "Change the edge 3 → 4 to 4 → 3 (change eu[4] and ev[4]). Which points' out-degrees and in-degrees change?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 5, m = 5;              // 5 points, 5 edges\n    int eu[5] = {0, 0, 1, 2, 3};   // edge i starts from eu[i]\n    int ev[5] = {1, 2, 3, 3, 4};   // and goes to ev[i]\n    int outdeg[5] = {};            // out-degree: edges going out\n    int indeg[5] = {};             // in-degree: edges coming in\n\n    for (int i = 0; i < m; i++) {\n        outdeg[eu[i]]++;\n        indeg[ev[i]]++;\n    }\n    for (int v = 0; v < n; v++) {\n        cout << v << \": out \" << outdeg[v] << \", in \" << indeg[v] << endl;\n    }\n    return 0;\n}"
},
"17-3": {
"title": "Adjacency Matrices",
"isNew": "g[u][v] = 1: there is an edge between u and v; store an undirected edge twice",
"uses": "2D arrays (chapter 7), cin",
"goal": "An adjacency matrix stores a graph in an n × n table: g[u][v] = 1 means there is an edge between u and v, and 0 means there is not.\nA problem usually gives n (the number of points) and m (the number of edges) first, then m lines of \"u v\". An undirected edge can be walked both ways, so both g[u][v] and g[v][u] are set to 1, and the matrix is symmetric. Watch the table on the right and the graph below change together.",
"predict": "After all the edges are read, how many 1s are in the matrix?",
"ask": "Delete g[v][u] = 1;. Is the matrix still symmetric? What kind of graph does it really store then?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int g[5][5] = {};  // all 0 at the start: no edges at all\n    int n, m;          // number of points, number of edges\n    int u, v;          // the two ends of an edge\n\n    cin >> n >> m;\n    for (int i = 0; i < m; i++) {\n        cin >> u >> v;\n        g[u][v] = 1;\n        g[v][u] = 1;\n    }\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            cout << g[i][j] << \" \";\n        }\n        cout << endl;\n    }\n    return 0;\n}"
},
"17-4": {
"title": "Finding Neighbors in a Matrix",
"isNew": "u's neighbors: which cells in row u are 1; is there an edge: look at g[u][v] directly",
"uses": "the adjacency matrix in 17-3",
"goal": "The points joined to u by an edge are called u's \"neighbors\". In an adjacency matrix, u's neighbors are the cells in row u that are 1, so you have to look through the whole of row u.\nThe other way round, to know whether there is an edge between 1 and 2, just look at the one cell g[1][2].",
"predict": "Which points are 3's neighbors? How many cells does the loop look at to find them all?",
"ask": "Change u to 4. 4 has only 1 neighbor. How many times does the loop still run?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n"+GML_EN+"\n    int u = 3;  // whose neighbors to find\n\n    for (int v = 0; v < 5; v++) {\n        if (g[u][v] == 1) {\n            cout << v << \" \";\n        }\n    }\n    cout << endl;\n    if (g[1][2] == 1) {\n        cout << \"1 and 2 are neighbors\" << endl;\n    } else {\n        cout << \"1 and 2 are not neighbors\" << endl;\n    }\n    return 0;\n}"
},
"17-5": {
"title": "Adjacency Lists",
"isNew": "g[u] is u's list of neighbors: g[u].push_back(v)",
"uses": "2D vectors (7-10), cin",
"goal": "An adjacency list stores only \"the edges that really exist\": each point has its own list of neighbors. Store it with the 2D vector from lesson 7-10: g[u] is u's list of neighbors, and each edge is push_back-ed into it.\nAn undirected edge is still stored twice: add v to u's list, and also add u to v's list. g[u].size() is u's degree.\nMany programs written by older students use vector<int> g[100]; instead. That is \"an array of 100 vectors\", not a 2D vector, but it is used in exactly the same way: g[u].push_back(v) and g[u].size() do not change. The only difference is that the array size must be fixed in advance.",
"predict": "After reading, which points are in the list g[3]?",
"ask": "What is the sum of the lengths of all the lists (g[i].size())? Is it the same as the sum of degrees in 17-1?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, m;  // number of points, number of edges\n    int u, v;  // the two ends of an edge\n\n    cin >> n >> m;\n    vector<vector<int>> g(n);  // n neighbor lists, all empty at the start\n    for (int i = 0; i < m; i++) {\n        cin >> u >> v;\n        g[u].push_back(v);\n        g[v].push_back(u);\n    }\n    for (int i = 0; i < n; i++) {\n        cout << i << \"'s neighbors: \";\n        for (int x : g[i]) {\n            cout << x << \" \";\n        }\n        cout << endl;\n    }\n    return 0;\n}"
},
"17-6": {
"title": "Matrix vs. List",
"isNew": "matrix: fast to check one edge, slow to find neighbors; list: fast to find neighbors, uses less space",
"uses": "17-3, 17-5",
"goal": "For the same graph, each way of storing it has its own strengths:\n・Adjacency matrix: to check \"is there an edge between u and v\", one cell tells you; but finding neighbors means looking at a whole row (n cells), and you must always make n × n cells.\n・Adjacency list: to find neighbors, you only look at the few in the list; but to check whether two particular points have an edge, you search the list one by one.\nWhen there are many points and few edges (for example, 100,000 points), an n × n matrix is simply too big to make, so you must use a list. This program turns the matrix into a list, then counts how many cells each one looks at to find 4's neighbors.",
"predict": "To find 4's neighbors, how many cells does the matrix look at? And the list?",
"ask": "If a graph has 100,000 points and each point has only 2 neighbors, how many cells does the matrix need? About how many numbers does the list store?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n"+GML_EN+"\n    vector<vector<int>> adj(5);  // turned from the matrix into an adjacency list\n    int a = 0, b = 0;            // finding 4's neighbors: cells the matrix looked at, cells the list looked at\n\n    for (int u = 0; u < 5; u++) {\n        for (int v = 0; v < 5; v++) {\n            if (g[u][v] == 1) {\n                adj[u].push_back(v);\n            }\n        }\n    }\n    for (int v = 0; v < 5; v++) {\n        a++;\n    }\n    for (int x : adj[4]) {\n        b++;\n    }\n    cout << \"The matrix looked at \" << a << \" cells, the list looked at \" << b << \" cells\" << endl;\n    return 0;\n}"
},
"17-7": {
"title": "DFS: All the Way to the End",
"isNew": "depth-first search: go down while there is an unvisited neighbor; come back when there is no way forward (backtracking)",
"uses": "recursion (chapter 9), finding neighbors in 17-4",
"goal": "DFS (depth-first search) is like walking a maze: as long as there is a path you have not taken, keep going forward; at a dead end, go back to the last fork and try the next path.\nIt is natural to write with recursion: dfs(u) first marks u as visited (vis[u] = true), then looks at each neighbor v of u, and if v is not visited, calls dfs(v) to go down. When dfs(v) ends and comes back, that is \"going back to the fork\".\nLook at the graph on the right: the thick orange circle is the current point, and the dashed orange circles are the points still in the recursion, waiting to come back.",
"predict": "Starting from 0, what is the visiting order? When it reaches 2, does 2 have any unvisited neighbors?",
"ask": "Change it to dfs(4); and start from 4. What does the order become?",
"code": "#include <iostream>\nusing namespace std;\n\n"+GMG_EN+"\nbool vis[5];  // vis[u]: has u been visited (global, all false at the start)\n\nvoid dfs(int u) {\n    vis[u] = true;\n    cout << u << \" \";\n    for (int v = 0; v < 5; v++) {\n        if (g[u][v] == 1 && !vis[v]) {\n            dfs(v);\n        }\n    }\n}\n\nint main() {\n    dfs(0);\n    cout << endl;\n    return 0;\n}"
},
"17-8": {
"title": "What If You Don't Remember the Visited Points?",
"isNew": "graphs have cycles: if you do not remember where you have been, you go around in circles forever",
"uses": "DFS in 17-7, the base case of recursion (9-4)",
"goal": "A tree has no cycles, so going down always ends at a leaf (chapter 16). But a graph can loop around: 0 → 1 → 0 → 1 ... If you do not remember which points have been visited, you keep going around, the recursion never stops, and it finally crashes (just like forgetting the base case in 9-4).\nThis program removes vis on purpose. Watch what happens.",
"predict": "Starting from 0, what are the first few numbers printed? Does the program stop?",
"ask": "Press \"Edit\" and put vis back (see 17-7), and the program stops. Which part of recursion is vis like here?",
"code": "#include <iostream>\nusing namespace std;\n\n"+GMG_EN+"\n\nvoid dfs(int u) {\n    cout << u << \" \";\n    for (int v = 0; v < 5; v++) {\n        if (g[u][v] == 1) {\n            dfs(v);\n        }\n    }\n}\n\nint main() {\n    dfs(0);\n    cout << endl;\n    return 0;\n}"
},
"17-9": {
"title": "DFS with an Adjacency List",
"isNew": "for (int v : g[u]): only look at neighbors that really exist",
"uses": "the adjacency list in 17-5, DFS in 17-7",
"goal": "The idea of DFS does not change; only the way the graph is stored does. With an adjacency list, for (int v : g[u]) only looks at u's real neighbors, instead of checking all of 0 to 4 like the matrix.\nNote that the visiting order follows \"the order in the lists\", which is the order the edges were read in.",
"predict": "Is the order the same as in 17-7?",
"ask": "Move the first edge of the input, \"0 1\", to the last line. Does the visiting order change? Why?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<vector<int>> g(5);  // adjacency list (global)\nbool vis[5];               // visited yet?\n\nvoid dfs(int u) {\n    vis[u] = true;\n    cout << u << \" \";\n    for (int v : g[u]) {\n        if (!vis[v]) {\n            dfs(v);\n        }\n    }\n}\n\nint main() {\n    int n, m;  // number of points, number of edges\n    int u, v;  // the two ends of an edge\n\n    cin >> n >> m;\n    for (int i = 0; i < m; i++) {\n        cin >> u >> v;\n        g[u].push_back(v);\n        g[v].push_back(u);\n    }\n    dfs(0);\n    cout << endl;\n    return 0;\n}"
},
"17-10": {
"title": "DFS with Your Own Stack",
"isNew": "without recursion: use a stack to remember \"the points to come back to later\"",
"uses": "stack (chapter 12), 12-6 recursion is really a stack",
"goal": "Lesson 12-6 said: behind recursion is a stack. So DFS can also be done without recursion, using your own stack to remember \"the points to go to later\":\n1. Take a point u from the top of the stack; if it has been visited, skip it.\n2. If not: mark it visited, print it, and put its unvisited neighbors into the stack.\nThe neighbors are put in from large to small, so the smaller numbers end up on top and come out first. Then the order is the same as the recursive version in 17-7.",
"predict": "Is the order the same as the recursive version in 17-7? How many times is 2 put into the stack?",
"ask": "Change the for loop to count from 0 to 4 (neighbors go in from small to large). What does the order become?",
"code": "#include <iostream>\n#include <stack>\nusing namespace std;\n\n"+GMG_EN+"\n\nint main() {\n    bool vis[5] = {};  // visited yet?\n    stack<int> st;      // points waiting to be visited\n\n    st.push(0);\n    while (!st.empty()) {\n        int u = st.top();\n        st.pop();\n        if (vis[u]) {\n            continue;\n        }\n        vis[u] = true;\n        cout << u << \" \";\n        for (int v = 4; v >= 0; v--) {\n            if (g[u][v] == 1 && !vis[v]) {\n                st.push(v);\n            }\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"17-11": {
"title": "BFS: Spreading Out Level by Level",
"isNew": "breadth-first search: use a queue; finish the near points before the far ones",
"uses": "queue (chapter 13), level-order traversal in 16-7",
"goal": "BFS (breadth-first search) is like dropping a stone into water: the ripples spread out circle by circle. First it visits all the points 1 step from the start, then those 2 steps away, then 3 steps away.\nIt works like the level-order traversal in 16-7, with a queue: take a point from the front of the queue, and line up its unvisited neighbors at the back.\nNote: a neighbor is marked visited \"when it is put into the queue\", so the same point is never lined up twice.",
"predict": "Starting from 0, what is the BFS order? How is it different from DFS (17-7)?",
"ask": "Change the queue to a stack (front() becomes top()). What does the order become? What is the difference between DFS and BFS?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\n"+GMG_EN+"\n\nint main() {\n    bool vis[5] = {};  // visited (already put into the queue) yet?\n    queue<int> q;       // points waiting to be handled\n\n    q.push(0);\n    vis[0] = true;\n    while (!q.empty()) {\n        int u = q.front();\n        q.pop();\n        cout << u << \" \";\n        for (int v = 0; v < 5; v++) {\n            if (g[u][v] == 1 && !vis[v]) {\n                vis[v] = true;\n                q.push(v);\n            }\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"17-12": {
"title": "BFS with an Array Queue",
"isNew": "q[rear++] = v puts it in, q[front++] takes it out",
"uses": "13-1 making a queue with an array, BFS in 17-11",
"goal": "The queue for BFS can also be made yourself with an array, as in lesson 13-1: front is the position of the next item to take out, rear is the position for the next item to put in, and front < rear means the queue still has something in it.\nEach point goes into the queue at most once (it is marked visited when it goes in), so an array of n cells is enough, and you never hit the \"false overflow\" from 13-3.",
"predict": "When BFS ends, what is in the q array, in order? How is it related to the printed order?",
"ask": "Why are 5 cells enough for q? What happens to q if you remove vis?",
"code": "#include <iostream>\nusing namespace std;\n\n"+GMG_EN+"\n\nint main() {\n    bool vis[5] = {};      // visited yet?\n    int q[5];              // a queue made with an array\n    int front = 0, rear = 0;  // position of the next item to take out, and of the next to put in\n\n    q[rear++] = 0;\n    vis[0] = true;\n    while (front < rear) {\n        int u = q[front++];\n        cout << u << \" \";\n        for (int v = 0; v < 5; v++) {\n            if (g[u][v] == 1 && !vis[v]) {\n                vis[v] = true;\n                q[rear++] = v;\n            }\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"17-13": {
"title": "Shortest Steps with BFS",
"isNew": "dist[v] = dist[u] + 1; dist = -1 means not reached yet",
"uses": "BFS in 17-11",
"goal": "Because BFS spreads out circle by circle, the first time it reaches a point, it always uses the fewest steps. So use dist[v] to record the fewest steps from the start to v: moving from u to a new point v, dist[v] = dist[u] + 1.\ndist starts as -1 everywhere, meaning \"not reached yet\", and this can replace vis. Any point still at -1 at the end cannot be reached from the start.",
"task": "Problem: Input n, m and m undirected edges (the points are numbered 0 to n-1). Print the fewest steps from point 0 to each point, or -1 if it cannot be reached.",
"predict": "Point 3 can be reached by two paths (0→1→3 and 0→2→3). What is dist[3]? Is it changed twice?",
"ask": "If you used DFS to count the steps instead, would you always get the fewest? Try to think of a counterexample.",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\nint main() {\n    int g[5][5] = {};  // adjacency matrix\n    int dist[5];       // dist[v]: the fewest steps from 0 to v; -1 means not reached yet\n    int n, m, u, v;    // number of points, number of edges, the two ends of an edge\n    queue<int> q;      // the queue for BFS\n\n    cin >> n >> m;\n    for (int i = 0; i < m; i++) {\n        cin >> u >> v;\n        g[u][v] = 1;\n        g[v][u] = 1;\n    }\n    for (int i = 0; i < n; i++) {\n        dist[i] = -1;\n    }\n    dist[0] = 0;\n    q.push(0);\n    while (!q.empty()) {\n        u = q.front();\n        q.pop();\n        for (v = 0; v < n; v++) {\n            if (g[u][v] == 1 && dist[v] == -1) {\n                dist[v] = dist[u] + 1;\n                q.push(v);\n            }\n        }\n    }\n    for (int i = 0; i < n; i++) {\n        cout << dist[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}",
"tests": [
{"note": "0 → 1 and 0 → 2 are both 1 step; 3 takes 2 steps; 4 takes 3 steps"},
{"note": "3 and 4 are not connected to 0, so they cannot be reached"}
]
},
"17-14": {
"title": "Printing the Shortest Path",
"isNew": "parent[v]: which point v was reached from; walk back from the end to the start",
"uses": "shortest steps with BFS in 17-13",
"goal": "dist only tells us the fewest steps, not how to walk. Also record parent[v] = u, meaning \"v was reached from u\".\nAfter BFS ends, start at the end point and keep following parent, and you walk backwards to the start. Store the points you pass in an array, print them in reverse, and you have a shortest path. The thick blue lines on the graph on the right are the edges left by parent.",
"predict": "Which is the shortest path from 0 to 4? 0 → 2 → 3 → 4 is just as short. Why is it not the one printed?",
"ask": "Change the end point to 2 (start with x = 2). What is printed?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\n"+GMG_EN+"\n\nint main() {\n    int dist[5], parent[5];  // the fewest steps; which point it was reached from\n    int path[5], len = 0;    // the path collected backwards; how many points collected\n    queue<int> q;            // the queue for BFS\n\n    for (int i = 0; i < 5; i++) {\n        dist[i] = -1;\n        parent[i] = -1;\n    }\n    dist[0] = 0;\n    q.push(0);\n    while (!q.empty()) {\n        int u = q.front();\n        q.pop();\n        for (int v = 0; v < 5; v++) {\n            if (g[u][v] == 1 && dist[v] == -1) {\n                dist[v] = dist[u] + 1;\n                parent[v] = u;\n                q.push(v);\n            }\n        }\n    }\n    for (int x = 4; x != -1; x = parent[x]) {\n        path[len++] = x;\n    }\n    for (int i = len - 1; i >= 0; i--) {\n        cout << path[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"17-15": {
"title": "Connected Components: How Many Groups?",
"isNew": "do one DFS from each point not yet visited; the number of DFS runs is the number of groups",
"uses": "DFS in 17-7",
"goal": "A graph may be split into several groups, with no edges between the groups. Each group is called a \"connected component\".\nA DFS from one point visits every point in its group. So check every point: one that has not been visited yet starts a new group, so add 1 to cnt, and do a DFS from it to mark the whole group. comp[u] records which group u is in, and on the graph on the right, points in the same group have the same color.",
"task": "Problem: Input n, m and m undirected edges (the points are numbered 0 to n-1). Print how many connected components the graph has.",
"predict": "For the first test case, how many times does main call dfs?",
"ask": "How would you change it to print \"how many points the biggest group has\"?",
"code": "#include <iostream>\nusing namespace std;\n\nint g[6][6];  // adjacency matrix (global, all 0 at the start)\nint comp[6];  // comp[u]: which group u is in; 0 means not visited yet\nint n;        // number of points\n\nvoid dfs(int u, int id) {\n    comp[u] = id;\n    for (int v = 0; v < n; v++) {\n        if (g[u][v] == 1 && comp[v] == 0) {\n            dfs(v, id);\n        }\n    }\n}\n\nint main() {\n    int m, u, v;  // number of edges, the two ends of an edge\n    int cnt = 0;  // how many groups found\n\n    cin >> n >> m;\n    for (int i = 0; i < m; i++) {\n        cin >> u >> v;\n        g[u][v] = 1;\n        g[v][u] = 1;\n    }\n    for (int s = 0; s < n; s++) {\n        if (comp[s] == 0) {\n            cnt++;\n            dfs(s, cnt);\n        }\n    }\n    cout << cnt << endl;\n    return 0;\n}",
"tests": [
{"note": "Three groups: {0, 1, 2}, {3, 4} and {5}"},
{"note": "They form one chain, so everything is connected"},
{"note": "No edges, so each point is a group by itself"}
]
},
"17-16": {
"title": "A Maze Is a Graph Too: Grid BFS",
"isNew": "each cell is a point and up/down/left/right are edges; r * C + c turns a cell into one number",
"uses": "dx and dy in 7-5, r * C + c in 7-9, shortest steps with BFS in 17-13",
"goal": "A maze is really a graph: every cell you can walk on is a point, and two cells next to each other (up, down, left or right) have an edge between them. So \"the fewest steps from the start to the end\" is BFS shortest steps.\nYou do not need to store the graph first: the neighbors come straight from dx and dy, as in lesson 7-5. The queue must hold \"a cell\", so use the method from lesson 7-9 to turn (r, c) into one number r * C + c, and when you take it out, split it back with / and %.",
"task": "Problem: Input R and C, then an R × C map (0 is a path, 1 is a wall). Walk from the top-left corner to the bottom-right corner, one cell up, down, left or right at a time. What is the fewest number of steps? Print -1 if you cannot get there.",
"predict": "For the first test case, how does the dist table grow, circle by circle?",
"ask": "If \"any cell on the edge counts as an exit\", how would you change the final output?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\nint main() {\n    int a[5][5];        // the map: 0 is a path, 1 is a wall\n    int dist[5][5];     // the fewest steps to each cell; -1 means not reached yet\n    int dx[4] = {-1, 1, 0, 0}, dy[4] = {0, 0, -1, 1};  // up, down, left, right\n    int R, C;           // number of rows, number of columns\n    queue<int> q;       // holds cell numbers r * C + c\n\n    cin >> R >> C;\n    for (int i = 0; i < R; i++) {\n        for (int j = 0; j < C; j++) {\n            cin >> a[i][j];\n            dist[i][j] = -1;\n        }\n    }\n    dist[0][0] = 0;\n    q.push(0);\n    while (!q.empty()) {\n        int r = q.front() / C, c = q.front() % C;\n        q.pop();\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dx[k], nc = c + dy[k];\n            if (nr >= 0 && nr < R && nc >= 0 && nc < C && a[nr][nc] == 0 && dist[nr][nc] == -1) {\n                dist[nr][nc] = dist[r][c] + 1;\n                q.push(nr * C + nc);\n            }\n        }\n    }\n    cout << dist[R - 1][C - 1] << endl;\n    return 0;\n}",
"tests": [
{"note": "right, down, down, right, right... 5 steps at least"},
{"note": "The top-left corner is closed in by walls, so there is no way out"}
]
},
"17-18": {
"title": "Spanning Trees: The Tree a Traversal Leaves Behind",
"isNew": "connects all points, exactly n − 1 edges, no cycles",
"uses": "parent in 17-14, trees in 16-1",
"goal": "When you traverse a connected graph, every point except the start is \"first entered through some edge\". Keep those edges (parent[v] — v): there are exactly n − 1 of them, they connect all the points, and there are no cycles, so they form a tree. It is called a \"spanning tree\".\nThe same graph can have many spanning trees, and the ones left by DFS and BFS are usually different. In chapter 21 you will learn how to find the spanning tree whose edge weights add up to the smallest total.",
"predict": "The original graph has 5 edges. How many does the spanning tree keep? Which edge is not kept?",
"ask": "Use the DFS in 17-7 instead, and record parent[v] = u before dfs(v). Does the tree that is kept look the same?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\n"+GMG_EN+"\n\nint main() {\n    bool vis[5] = {};  // visited yet?\n    int parent[5];      // which point v was reached from\n    int cnt = 0;        // how many edges are kept\n    queue<int> q;       // the queue for BFS\n\n    for (int i = 0; i < 5; i++) {\n        parent[i] = -1;\n    }\n    q.push(0);\n    vis[0] = true;\n    while (!q.empty()) {\n        int u = q.front();\n        q.pop();\n        for (int v = 0; v < 5; v++) {\n            if (g[u][v] == 1 && !vis[v]) {\n                vis[v] = true;\n                parent[v] = u;\n                cnt++;\n                q.push(v);\n            }\n        }\n    }\n    for (int v = 1; v < 5; v++) {\n        cout << parent[v] << \" - \" << v << endl;\n    }\n    cout << \"Total: \" << cnt << \" edges\" << endl;\n    return 0;\n}"
}
});

/* ---------- 17-17：網格 BFS 用 pair ---------- */
Object.assign(LESSON_EN,{
"17-17":{title:"Grid BFS: pairs in the Queue",isNew:"pair<int, int> holds two values at once; q.push({r, c}), q.front().first, q.front().second",uses:"grid BFS in 17-16, struct in 11-1",goal:"17-16 has to turn (r, c) into one number before it fits in the queue, and split it back with / and % when it comes out. That is easy to get wrong. Many programs use pair instead: pair<int, int> is C++'s built-in struct with only two fields. The first field is called first, and the second is called second.\nEach box of queue<pair<int, int>> q; holds one cell: q.push({r, c}); puts it in, q.front().first is the row, and q.front().second is the column. The BFS part is exactly the same as 17-16; only putting cells in and taking them out is different.\npairs can also be compared, which 21-7 uses again.",task:"Problem: the same as 17-16.",predict:"Compare it with 17-16: does the dist table grow in a different order?",ask:"If the queue must remember a third value (for example, how many keys you have when you reach this cell), a pair is not enough. What can you do?",code:"#include <iostream>\n#include <queue>\nusing namespace std;\n\nint main() {\n    int a[5][5];        // the map: 0 is a path, 1 is a wall\n    int dist[5][5];     // the fewest steps to each cell; -1 means not reached yet\n    int dx[4] = {-1, 1, 0, 0}, dy[4] = {0, 0, -1, 1};  // up, down, left, right\n    int R, C;           // number of rows, number of columns\n    queue<pair<int, int>> q;  // holds cells (r, c)\n\n    cin >> R >> C;\n    for (int i = 0; i < R; i++) {\n        for (int j = 0; j < C; j++) {\n            cin >> a[i][j];\n            dist[i][j] = -1;\n        }\n    }\n    dist[0][0] = 0;\n    q.push({0, 0});\n    while (!q.empty()) {\n        int r = q.front().first, c = q.front().second;\n        q.pop();\n        for (int k = 0; k < 4; k++) {\n            int nr = r + dx[k], nc = c + dy[k];\n            if (nr >= 0 && nr < R && nc >= 0 && nc < C && a[nr][nc] == 0 && dist[nr][nc] == -1) {\n                dist[nr][nc] = dist[r][c] + 1;\n                q.push({nr, nc});\n            }\n        }\n    }\n    cout << dist[R - 1][C - 1] << endl;\n    return 0;\n}"}
});
