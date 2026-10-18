/* ---------- English: chapter 18 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{18:{title:"Brute Force"}});
Object.assign(LESSON_EN,{
"18-1": {
"title": "Brute Force: Try Every Possibility",
"isNew": "list every possibility → check them one by one → record the answer",
"uses": "for, if",
"goal": "For some problems, there are only a limited number of possible answers. Then just try them one by one, and check each one to see if it is right. This method is called \"brute force\" (or exhaustive search).\nChickens and rabbits in a cage: there are 35 heads and 94 legs. The number of chickens can only be 0, 1, 2 ... 35. If there are c chickens, there are 35 - c rabbits. Try every c and see if the number of legs is right.\nWhen you write brute force, think clearly about three things: the range to try (c from 0 to 35), how to check (is the number of legs right?), and what to do when you find it (print it).",
"predict": "How many times does the loop try in total? On which try is the answer found?",
"ask": "After the answer is found, does the loop keep trying? How many tries does adding break save? Change legs to 95. What is printed? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int heads = 35, legs = 94;  // 35 heads, 94 legs\n    int c;                      // suppose there are c chickens\n    int r;                      // the number of rabbits\n    \n    for (c = 0; c <= heads; c++) {\n        r = heads - c;\n        if (c * 2 + r * 4 == legs) {\n            cout << \"Chickens: \" << c << \", rabbits: \" << r << \".\" << endl;\n        }\n    }\n    return 0;\n}"
},
"18-2": {
"title": "Nested Loops: Try Every Pair",
"isNew": "j starts from i + 1: each pair is looked at only once",
"uses": "18-1, two-level loops",
"goal": "From a list of numbers, find two numbers that \"add up to exactly 9\". The numbers must be tried pair by pair: the outer i picks the first number, and the inner j picks the second.\nj starts from i + 1, so (a[0], a[1]) and (a[1], a[0]) are looked at only once, and no number is paired with itself.\nn numbers make n × (n - 1) ÷ 2 pairs in total, about half of n², so the time complexity is O(n²).",
"predict": "How many pairs are checked in total? Which pairs are found?",
"ask": "Change j = i + 1 to j = 0. What is printed? Why do some answers appear twice, and why are there extra wrong answers?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[6] = {2, 7, 4, 5, 1, 6};  // the numbers to search\n    int n = 6;                      // how many numbers\n    int target = 9;                 // the sum to make\n    int i, j;                       // positions of the first and second number\n    int cnt = 0;                    // how many pairs found\n    \n    for (i = 0; i < n; i++) {\n        for (j = i + 1; j < n; j++) {\n            if (a[i] + a[j] == target) {\n                cout << a[i] << \" + \" << a[j] << endl;\n                cnt++;\n            }\n        }\n    }\n    cout << \"Total: \" << cnt << \" pairs\" << endl;\n    return 0;\n}"
},
"18-3": {
"title": "Try Less: Don't Try What You Can Calculate",
"isNew": "if you know two numbers, calculate the third; use rules to remove repeats",
"uses": "18-2",
"goal": "Find all positive integers a ≤ b ≤ c with a + b + c = 10. The most direct way is three loops, trying 1 to 10 for each of a, b and c: 10 × 10 × 10 = 1000 checks.\nBut once a and b are chosen, c must be 10 - a - b, so there is no need to try it. Also, if b starts from a and we only keep c ≥ b, each group of numbers appears only once.\ntries records how many checks were really made. Before you use brute force, think: what can be calculated directly? What is simply impossible?",
"predict": "How many groups are there? What is tries? How much less than 1000 is it?",
"ask": "Once a is bigger than n ÷ 3, can there still be an answer? How far does b need to go? Change the loop ranges and see what tries becomes.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 10;      // the sum of the three numbers\n    int a, b, c;     // the three numbers, a ≤ b ≤ c\n    int cnt = 0;     // how many groups found\n    int tries = 0;   // how many checks made\n    \n    for (a = 1; a <= n; a++) {\n        for (b = a; b <= n; b++) {\n            c = n - a - b;\n            tries++;\n            if (c >= b) {\n                cout << a << \" \" << b << \" \" << c << endl;\n                cnt++;\n            }\n        }\n    }\n    cout << cnt << \" groups, checked \" << tries << \" times\" << endl;\n    return 0;\n}"
},
"18-4": {
"title": "Brute Force with Recursion: Pick Each Number or Not",
"isNew": "dfs(i): decide on number i; when i reaches the end, that is one way of picking",
"uses": "recursion (chapter 9)",
"goal": "a has 3 numbers, and each can be \"picked\" or \"not picked\", so there are 2 × 2 × 2 = 8 ways of picking. With more numbers, it is very hard to write one loop level for each.\nUse recursion instead: dfs(i) decides on number i. First try \"not picked\" and let dfs(i + 1) decide the rest; after it comes back, try \"picked\" and call dfs(i + 1) again.\ni equal to 3 means all 3 numbers have been decided, so print this way of picking. If you draw the two choices at each level, you get a \"decision tree\", and each leaf is one way of picking.",
"predict": "How many lines are printed in total? What are the first and the last lines?",
"ask": "Swap the \"not picked\" part and the \"picked\" part. How does the printing order change? If a has 4 numbers, how many lines are printed?",
"code": "#include <iostream>\nusing namespace std;\n\nint a[3] = {1, 2, 3};  // the numbers to pick from\nbool pick[3];          // pick[i]: is number i picked?\n\nvoid dfs(int i) {\n    int k;  // for printing\n    if (i == 3) {\n        cout << \"{ \";\n        for (k = 0; k < 3; k++) {\n            if (pick[k]) {\n                cout << a[k] << \" \";\n            }\n        }\n        cout << \"}\" << endl;\n        return;\n    }\n    pick[i] = false;  // do not pick a[i]\n    dfs(i + 1);\n    pick[i] = true;   // pick a[i]\n    dfs(i + 1);\n}\n\nint main() {\n    dfs(0);\n    return 0;\n}"
},
"18-5": {
"title": "Permutations: Who Goes in Each Place?",
"isNew": "used[x] records whether x is used; undo it when you come back",
"uses": "18-4",
"goal": "How many ways can 1, 2 and 3 be put in a row? The first place has 3 choices, the second has 2 left, and the third has only 1 left: 3 × 2 × 1 = 6 ways.\ndfs(i) decides which number goes in place i: try all of 1 to n, but a number that is already used cannot be used again, so used[x] records whether x has been placed.\nAfter placing it, call dfs(i + 1). When it comes back, set used[x] back to false, because we are about to try another number, and x must be free for the later places.",
"predict": "Which 6 orders are printed? In what order?",
"ask": "Remove the line used[x] = false;. How many orders are printed? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nint n = 3;     // how many numbers to arrange\nint perm[3];   // perm[i]: which number is in place i\nbool used[4];  // used[x]: has x been placed?\n\nvoid dfs(int i) {\n    int x, k;  // the number to try in this place, for printing\n    if (i == n) {\n        for (k = 0; k < n; k++) {\n            cout << perm[k] << \" \";\n        }\n        cout << endl;\n        return;\n    }\n    for (x = 1; x <= n; x++) {\n        if (!used[x]) {\n            used[x] = true;\n            perm[i] = x;\n            dfs(i + 1);\n            used[x] = false;  // back again: x can be used in another place\n        }\n    }\n}\n\nint main() {\n    dfs(0);\n    return 0;\n}"
},
"18-6": {
"title": "Backtracking: Make a Choice, Undo It When You Come Back",
"isNew": "choose → try further → undo when you come back → try the next choice",
"uses": "18-4, 18-5",
"goal": "18-4 and 18-5 really do the same thing: make a choice, try further, undo the choice when you come back, then try the next one. This method is called \"backtracking\".\nThis program picks some numbers from {5, 4, 3, 2, 1} so that the sum is exactly 7. chosen records which numbers are picked now, and len is how many are picked.\nPick a[i]: put it into chosen, add 1 to len, and try further; when it comes back, subtract 1 from len, which takes a[i] out (undo), then try not picking a[i]. sum is passed down as a parameter, so each level has its own sum, and it does not need to change when coming back.",
"predict": "Which ways of picking are found? How many times is dfs called in total?",
"ask": "Remove len--;. What is printed? Why does sum not need to be undone, but len does?",
"code": "#include <iostream>\nusing namespace std;\n\nint a[5] = {5, 4, 3, 2, 1};  // the numbers that can be picked\nint chosen[5];               // which numbers are picked now\nint len = 0;                 // how many are picked\nint target = 7;              // the sum to make\n\nvoid dfs(int i, int sum) {\n    int k;  // for printing\n    if (i == 5) {\n        if (sum == target) {\n            for (k = 0; k < len; k++) {\n                cout << chosen[k] << \" \";\n            }\n            cout << endl;\n        }\n        return;\n    }\n    chosen[len] = a[i];  // pick a[i]\n    len++;\n    dfs(i + 1, sum + a[i]);\n    len--;               // undo: take a[i] out\n    dfs(i + 1, sum);     // do not pick a[i]\n}\n\nint main() {\n    dfs(0, 0);\n    return 0;\n}"
},
"18-7": {
"title": "Pruning: Stop Going Down Impossible Paths",
"isNew": "return when sum is already over the target; compare calls",
"uses": "18-6",
"goal": "18-6 tries all 32 ways of picking, and keeps going down even when the sum is already over 7. Since all the numbers are positive, the sum only gets bigger, and once it is over 7 it can never become 7 again.\nAdd if (sum > target) return; at the start of dfs. As soon as it finds something impossible, it turns back right away, and the whole part of the decision tree below is skipped. This is called \"pruning\".\ncalls records how many times dfs is called. Compare it with 18-6. Pruning does not change the answer; it only makes the program do less work.",
"predict": "18-6 without pruning called dfs 63 times. With pruning, what is calls?",
"ask": "If a has negative numbers, can you still prune with sum > target? Think of another pruning: when sum already equals target, do you still need to go further?",
"code": "#include <iostream>\nusing namespace std;\n\nint a[5] = {5, 4, 3, 2, 1};  // the numbers that can be picked\nint chosen[5];               // which numbers are picked now\nint len = 0;                 // how many are picked\nint target = 7;              // the sum to make\nint calls = 0;               // how many times dfs is called\n\nvoid dfs(int i, int sum) {\n    int k;  // for printing\n    calls++;\n    if (sum > target) {\n        return;  // pruning: already over, no need to try the rest\n    }\n    if (i == 5) {\n        if (sum == target) {\n            for (k = 0; k < len; k++) {\n                cout << chosen[k] << \" \";\n            }\n            cout << endl;\n        }\n        return;\n    }\n    chosen[len] = a[i];\n    len++;\n    dfs(i + 1, sum + a[i]);\n    len--;\n    dfs(i + 1, sum);\n}\n\nint main() {\n    dfs(0, 0);\n    cout << \"dfs was called \" << calls << \" times\" << endl;\n    return 0;\n}"
},
"18-8": {
"title": "Binary and Bitwise Operations",
"isNew": "x >> i & 1: bit i; what & | ^ << mean",
"uses": "int, operators",
"goal": "Computers store integers in binary: 13 is 1101 (8 + 4 + 0 + 1), and 6 is 0110. Counting from the right, these are bits 0, 1, 2 and 3.\nBitwise operations work on each bit separately:\nx & y: 1 only when both are 1. x | y: 1 when either one is 1. x ^ y: 1 when the two are different.\n1 << k: move 1 to the left by k places, which is 2 to the power k. x >> i: move right by i places, so bit i ends up on the far right; then & 1 gets whether it is 0 or 1.\nNote: & has lower priority than ==, so add brackets when you write it.",
"predict": "What are 13 & 6, 13 | 6 and 13 ^ 6? Work them out bit by bit in binary first.",
"ask": "Change x to 10. What does the first line print? What is x ^ x always equal to? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 13;  // 1101 in binary\n    int y = 6;   // 0110 in binary\n    int i;       // which bit\n    \n    for (i = 3; i >= 0; i--) {\n        cout << ((x >> i) & 1);\n    }\n    cout << endl;\n    cout << (x & y) << \" \" << (x | y) << \" \" << (x ^ y) << endl;\n    cout << (1 << 3) << endl;\n    return 0;\n}"
},
"18-9": {
"title": "Bitmask Enumeration: One Integer Is One Way of Picking",
"isNew": "mask goes from 0 to 2ⁿ - 1; if bit i is 1, pick a[i]",
"uses": "18-4, 18-8",
"goal": "18-4 used recursion to list whether each number is picked or not. There is another way: use one integer mask for one way of picking. If bit i of mask is 1, a[i] is picked.\nFor example, mask = 5 is 101 in binary, which means a[0] and a[2] are picked.\nThe ways of picking from n numbers match the integers 0 to 2ⁿ - 1 exactly, so one loop that runs mask from 0 to (1 << n) - 1 meets every way of picking exactly once, with no recursion.",
"predict": "When mask = 6, which numbers are picked? What is the sum?",
"ask": "How many masks must be tried when n = 20? And n = 40? If a computer can try about 100 million per second, at what n does brute force become too slow?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[3] = {1, 2, 3};  // the numbers to pick from\n    int n = 3;             // how many numbers\n    int mask;              // 0 to 7: each bit says whether a number is picked\n    int i;                 // which number\n    int sum;               // the sum of this way of picking\n    \n    for (mask = 0; mask < (1 << n); mask++) {\n        sum = 0;\n        cout << mask << \": { \";\n        for (i = 0; i < n; i++) {\n            if ((mask >> i) & 1) {\n                cout << a[i] << \" \";\n                sum += a[i];\n            }\n        }\n        cout << \"} sum \" << sum << endl;\n    }\n    return 0;\n}"
}
});
