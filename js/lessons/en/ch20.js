/* ---------- English: chapter 20 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{20:{title:"Dynamic Programming"}});
Object.assign(LESSON_EN,{
"20-1": {
"title": "Fibonacci: Recursion Keeps Repeating Work",
"isNew": "fib(n) = fib(n - 1) + fib(n - 2); the same fib is calculated many times",
"uses": "the recursion tree and repeated work in 9-5",
"goal": "The Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13 ... Each number is the sum of the two before it. Recursion is the most direct way to write it: fib(n) = fib(n - 1) + fib(n - 2).\nBut fib(7) needs fib(6) and fib(5); fib(6) calculates fib(5) once more ... The same answer is calculated many times. calls records how many times fib is called in total.\nEach time n grows by 1, the number of calls becomes about 1.6 times bigger, and n = 40 needs hundreds of millions of calls, so it will surely TLE. Dynamic programming is made to solve this kind of \"repeated work\".",
"predict": "What is fib(7)? How many times is fib called in total?",
"ask": "How many times is fib(2) calculated in total? Change fib(7) to fib(8). What does calls become? About how many times bigger?",
"code": "#include <iostream>\nusing namespace std;\n\nint calls = 0;  // how many times fib is called in total\n\nint fib(int n) {\n    calls++;\n    if (n <= 1) {\n        return n;\n    }\n    return fib(n - 1) + fib(n - 2);\n}\n\nint main() {\n    int ans;  // the answer of fib(7)\n\n    ans = fib(7);\n    cout << ans << endl;\n    cout << \"Called \" << calls << \" times\" << endl;\n    return 0;\n}"
},
"20-2": {
"title": "Memoization: Write Down What You Have Calculated",
"isNew": "memo[n] stores the answer of fib(n); if it is already calculated, use it and do not call further",
"uses": "20-1",
"goal": "Since the same fib(n) is calculated many times, write it down the first time: memo[n] stores the answer of fib(n). It starts as -1 everywhere, meaning \"not calculated yet\".\nWhen fib(n) starts, look at memo[n] first: if it is not -1, it has been calculated, so just use it, with no more calls; only if it is -1 do you really calculate it, then store it in memo[n].\nThis is called \"memoization\". Each fib(n) is really calculated only once, and calls drops far below 41. This is the heart of dynamic programming: each small problem is solved only once.",
"predict": "What is calls this time? In what order is memo filled?",
"ask": "Remove the three lines of if (memo[n] != -1). What does calls go back to? memo has 10 cells. Up to which fib can it calculate?",
"code": "#include <iostream>\nusing namespace std;\n\nint memo[10];   // memo[n]: the answer of fib(n), -1 means not calculated yet\nint calls = 0;  // how many times fib is called in total\n\nint fib(int n) {\n    calls++;\n    if (n <= 1) {\n        return n;\n    }\n    if (memo[n] != -1) {\n        return memo[n];  // already calculated, just use it\n    }\n    memo[n] = fib(n - 1) + fib(n - 2);\n    return memo[n];\n}\n\nint main() {\n    int ans;  // the answer of fib(7)\n    int i;    // for the loop\n\n    for (i = 0; i < 10; i++) {\n        memo[i] = -1;\n    }\n    ans = fib(7);\n    cout << ans << endl;\n    cout << \"Called \" << calls << \" times\" << endl;\n    return 0;\n}"
},
"20-3": {
"title": "Filling a Table: From Small to Big",
"isNew": "dp[i] = dp[i - 1] + dp[i - 2]; fill the small ones first, then look up the table for the big ones",
"uses": "20-2, for",
"goal": "Memoization breaks the big problem down into smaller ones. You can also go the other way: start from the smallest and fill the table upward, cell by cell. Fill dp[0] and dp[1] first; dp[2] is calculated from dp[1] and dp[0], dp[3] from dp[2] and dp[1] ...\nWhen you write dynamic programming, think clearly about four things:\n1. State: what dp[i] means (the i-th Fibonacci number).\n2. Transition: how dp[i] is calculated from smaller cells (dp[i - 1] + dp[i - 2]).\n3. Starting values: the smallest cells are given directly (dp[0] = 0, dp[1] = 1).\n4. Answer: which cell it is in (dp[n]).\nFilling the table needs no recursion, just one loop, and the time complexity is O(n).",
"predict": "What does the dp array look like at the end?",
"ask": "Is dp[50] bigger than an int can hold? (Hint: 2-9) Each step only uses the two cells before it. Can you do it without the whole array?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int dp[10];  // dp[i]: the i-th Fibonacci number\n    int n = 7;   // which one to calculate\n    int i;       // which cell is being filled\n    \n    dp[0] = 0;\n    dp[1] = 1;\n    for (i = 2; i <= n; i++) {\n        dp[i] = dp[i - 1] + dp[i - 2];\n    }\n    cout << dp[n] << endl;\n    return 0;\n}"
},
"20-4": {
"title": "Climbing Stairs: The Same Kind of Table",
"isNew": "to reach step i = 1 step from step i - 1, or 2 steps from step i - 2",
"uses": "20-3",
"goal": "You climb n stairs, and each time you can go up 1 step or 2 steps. How many ways are there?\nThink about the last move: to stand on step i, the last move is either 1 step up from step i - 1, or 2 steps up from step i - 2. So dp[i] = dp[i - 1] + dp[i - 2], the same as the Fibonacci sequence!\nStarting values: dp[0] = 1 (standing on the ground and not moving is also one way), dp[1] = 1. Many DP problems tell a different story, but the table is filled in the same way.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of stairs n (1 ≤ n ≤ 40). Each time you can go up 1 or 2 steps. Print how many ways there are.",
"predict": "What are the ways to climb 3 stairs? List them yourself. Is it the same as dp[3]?",
"ask": "If you can go up 1, 2 or 3 steps at a time, how must the transition change? How is dp[2] calculated?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int dp[41];  // dp[i]: how many ways to reach step i (n is at most 40)\n    int n;       // how many stairs\n    int i;       // which cell is being filled\n    \n    cin >> n;\n    dp[0] = 1;\n    dp[1] = 1;\n    for (i = 2; i <= n; i++) {\n        dp[i] = dp[i - 1] + dp[i - 2];\n    }\n    cout << dp[n] << endl;\n    return 0;\n}",
"tests": [
{"note": "Only one step is possible"},
{},
{},
{"note": "The same as the Fibonacci sequence"}
]
},
"20-5": {
"title": "Making Change: The Fewest Coins",
"isNew": "dp[i][j]: the fewest coins to make j dollars using only the first i kinds of coins",
"uses": "19-1, 2D arrays (chapter 7)",
"goal": "The greedy change-making in 19-1 gets WA on some test cases. Dynamic programming always finds the fewest.\nState: dp[i][j] = the fewest coins to make j dollars using only the first i kinds of coins. If it cannot be made, it is INF (a very big number).\nTransition: you may not use coin i, which gives dp[i - 1][j]; or use one of it, which gives dp[i][j - coin[i]] + 1 (after using one, all of the first i kinds can still be used for the j - coin[i] dollars left). Take the smaller one.\nStarting values: 0 kinds of coins can only make 0 dollars, so dp[0][0] = 0 and every other dp[0][j] = INF. Answer: dp[n][money].\nThe table on the right is filled row by row, and each cell only looks at the cell above and cells to its left. These test cases are the same as in 19-1, and this time they all get AC.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of coin types n (at most 4) and the amount money (at most 30), then the n coin values (always including 1). Print the fewest number of coins needed.",
"predict": "For test case 1 (making 6 with 4, 3 and 1), what is dp[2][6]? What does it mean?",
"ask": "Why does \"use one\" look at dp[i][j - coin[i]] (the same row), not dp[i - 1][j - coin[i]] (the row above)? If you changed it to the row above, what would it mean?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int INF = 1000000;  // a very big number: means it cannot be made\n    int coin[5];        // coin[1] to coin[n]: the value of each coin (at most 4 kinds)\n    int dp[5][31];      // dp[i][j]: fewest coins to make j using the first i kinds (j at most 30)\n    int n, money;       // how many coin types, how much to make\n    int i, j;           // filling row i, column j\n    \n    cin >> n >> money;\n    for (i = 1; i <= n; i++) {\n        cin >> coin[i];\n    }\n    dp[0][0] = 0;\n    for (j = 1; j <= money; j++) {\n        dp[0][j] = INF;\n    }\n    for (i = 1; i <= n; i++) {\n        for (j = 0; j <= money; j++) {\n            dp[i][j] = dp[i - 1][j];  // do not use coin i\n            if (j >= coin[i] && dp[i][j - coin[i]] + 1 < dp[i][j]) {\n                dp[i][j] = dp[i][j - coin[i]] + 1;  // use one coin i\n            }\n        }\n    }\n    cout << dp[n][money] << endl;\n    return 0;\n}",
"tests": [
{"note": "Greedy in 19-1 gave 3 coins; DP finds 3 + 3, only 2"},
{"note": "Greedy in 19-1 gave 6 coins; DP finds 10 × 3"},
{}
]
},
"20-6": {
"title": "The 0/1 Knapsack",
"isNew": "dp[i][j]: looking only at the first i items with a bag of size j, the highest value",
"uses": "19-7, 20-5",
"goal": "19-7 used greedy for the 0/1 knapsack, and some test cases got WA. The 0/1 knapsack is the most classic dynamic programming problem.\nState: dp[i][j] = the highest value you can carry when you only consider the first i items and the bag holds j.\nTransition: if you do not take item i, it is dp[i - 1][j]; if you take it (it must fit, j ≥ w[i]), it is dp[i - 1][j - w[i]] + v[i]: first make w[i] of space, then fill the remaining space as well as possible with the first i - 1 items. Take the bigger one.\nEach item can be taken only once, so \"take\" looks at the row above (i - 1). This is different from the coins in 20-5 (which can be used again and again).\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of items n and the bag size cap (both at most 10), then the weight and value of each item. Each item is taken whole or not at all. Print the highest total value you can carry.",
"predict": "For test case 1, what is dp[2][5]? What does it mean?",
"ask": "Change the \"take\" line to look at the same row, dp[i][j - w[i]]. What does test case 1 become? How many times can each item be taken then?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int w[11], v[11];     // w[i], v[i]: weight and value of item i (at most 10 items)\n    int dp[11][11] = {};  // dp[i][j]: first i items, size j, the highest value (size at most 10)\n    int n, cap;           // how many items, the bag size\n    int i, j;              // filling row i, column j\n    \n    cin >> n >> cap;\n    for (i = 1; i <= n; i++) {\n        cin >> w[i] >> v[i];\n    }\n    for (i = 1; i <= n; i++) {\n        for (j = 0; j <= cap; j++) {\n            dp[i][j] = dp[i - 1][j];  // do not take item i\n            if (j >= w[i] && dp[i - 1][j - w[i]] + v[i] > dp[i][j]) {\n                dp[i][j] = dp[i - 1][j - w[i]] + v[i];  // take item i\n            }\n        }\n    }\n    cout << dp[n][cap] << endl;\n    return 0;\n}",
"tests": [
{"note": "Greedy by value per kilogram takes the 1 kg and 2 kg items, only 16; taking 2 kg and 3 kg gives 22"},
{"note": "Take the 5 kg and 4 kg items"},
{"note": "Test case 3 of 19-7: greedy gets only 9; two 5 kg items give 10"}
]
},
"20-7": {
"title": "Working Back from the Table: What Was Taken?",
"isNew": "if dp[i][j] is different from the cell above, item i was taken",
"uses": "20-6",
"goal": "The dp table only tells us \"the highest value\", not which items were taken. You can walk back from the answer cell dp[n][cap]:\nIf dp[i][j] is the same as dp[i - 1][j], the same value can be reached without item i, so move up one row; if it is different, item i must have been taken, so print it, subtract w[i] from j, and move up one row.\nThis is like \"walking back to the start with parent\" in 17-14: first calculate the answer, then follow the table to find out how it was reached.",
"predict": "Which items are taken? What is the remaining size j at the end?",
"ask": "Why does working back go from the last row upward, and not from the first row downward?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int w[4] = {0, 1, 2, 3};    // w[1] to w[3]: weights (w[0] is not used)\n    int v[4] = {0, 6, 10, 12};  // v[1] to v[3]: values\n    int n = 3, cap = 5;         // how many items, the bag size\n    int dp[4][6] = {};          // dp[i][j]: first i items, size j, the highest value\n    int i, j;                    // row and column of the table\n    \n    for (i = 1; i <= n; i++) {\n        for (j = 0; j <= cap; j++) {\n            dp[i][j] = dp[i - 1][j];\n            if (j >= w[i] && dp[i - 1][j - w[i]] + v[i] > dp[i][j]) {\n                dp[i][j] = dp[i - 1][j - w[i]] + v[i];\n            }\n        }\n    }\n    j = cap;\n    for (i = n; i >= 1; i--) {\n        if (dp[i][j] != dp[i - 1][j]) {\n            cout << \"Take item \" << i << \".\" << endl;\n            j -= w[i];\n        }\n    }\n    cout << \"Total value: \" << dp[n][cap] << endl;\n    return 0;\n}"
},
"20-8": {
"title": "Longest Common Subsequence (LCS)",
"isNew": "a[i - 1] == b[j - 1]: top-left + 1; different: the bigger of above and left",
"uses": "20-6, strings (chapter 6)",
"goal": "Take two strings and pick some characters from each (keeping their order, not necessarily next to each other) so that the picked parts are the same. How long can it be? For example, for ABCBDAB and BDCABA, BCBA is a common subsequence of length 4.\nState: dp[i][j] = the length of the longest common subsequence of the first i characters of a and the first j characters of b.\nTransition: look at character i of a, a[i - 1], and character j of b, b[j - 1]. If they are the same, pair them: dp[i - 1][j - 1] + 1 (top-left + 1). If they are different, drop one of them: max(dp[i - 1][j], dp[i][j - 1]) (the bigger of above and left).\nStarting values: if either side is empty, the length is 0, so row 0 and column 0 are all 0.",
"predict": "How long is the longest common subsequence? What is in the bottom-right cell of the table?",
"ask": "Why does \"the same\" look at the top-left, not above or left? Try working back from the bottom-right corner like 20-7 to find which characters they are.",
"code": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string a = \"ABCBDAB\";  // the first string (7 characters)\n    string b = \"BDCABA\";   // the second string (6 characters)\n    int dp[8][7] = {};     // dp[i][j]: LCS of the first i characters of a and first j of b\n    int i, j;               // filling row i, column j\n    \n    for (i = 1; i <= 7; i++) {\n        for (j = 1; j <= 6; j++) {\n            if (a[i - 1] == b[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n            } else {\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);\n            }\n        }\n    }\n    cout << dp[7][6] << endl;\n    return 0;\n}"
}
});
