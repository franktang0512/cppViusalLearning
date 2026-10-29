/* ---------- English: chapter 19 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{19:{title:"Greedy Algorithms"}});
// 19-4 和 19-5 的測資說明一樣
const ACT_TESTS_EN=[
{"note": "Pick 1-2, 3-4, 5-7 and 8-9: 4 in total"},
{"note": "1-10 is too long, so it is not picked, and the other three can all be attended"},
{"note": "4-7 is the shortest, but it clashes with both of the others"}
];
Object.assign(LESSON_EN,{
"19-1": {
"title": "Greedy: Take the Best Thing Right Now at Each Step",
"isNew": "giving change: use the biggest coin you can; some test cases get WA",
"uses": "while, arrays",
"goal": "The idea of a greedy algorithm is simple: at each step, make the choice that \"looks best right now\", and never go back.\nGive change with the fewest coins. The greedy way: use the biggest coin first, and keep using it while you can; when it is too big, move to the next coin, and so on. Compared with the brute force in chapter 18, greedy does not try every possibility, so it is very fast.\nIn the test cases below, the expected output is always \"the real fewest number of coins\". Taiwan's coins (50, 10, 5, 1) all get AC with greedy; but with other coins, some cases get WA, and that is where greedy gets it wrong.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of coin types n and the amount of change money, then the n coin values (from large to small, always including 1). Print the fewest number of coins needed.",
"predict": "Of the 4 test cases, which get WA? How many coins does greedy give for each?",
"ask": "For the cases that get WA, what is the real best way to give change? What must the coin values be like for greedy to always be right?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int coin[10];   // the value of each coin (from large to small, at most 10 kinds)\n    int n, money;   // how many coin types, how much change to give\n    int total = 0;  // how many coins are used in total\n    int i;          // which coin\n    \n    cin >> n >> money;\n    for (i = 0; i < n; i++) {\n        cin >> coin[i];\n    }\n    for (i = 0; i < n; i++) {\n        while (money >= coin[i]) {\n            money -= coin[i];\n            total++;\n        }\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "50 + 10 × 3 + 5 + 1 × 2, 7 coins: with Taiwan's coins, greedy is right"},
{"note": "50 + 10 + 5 + 1, 4 coins"},
{"note": "Greedy takes 4 first, and the 2 left needs two 1s: 3 coins; but 3 + 3 needs only 2"},
{"note": "Greedy takes 25 first, and the 5 left needs five 1s: 6 coins; but 10 × 3 needs only 3"}
]
},
"19-2": {
"title": "Why Is It Wrong? Compare with Brute Force",
"isNew": "taking the biggest at the first step makes the later steps worse",
"uses": "19-1, the nested-loop brute force in 18-2",
"goal": "Test case 3 in 19-1: coins of 4, 3 and 1, and change of 6. Greedy takes 4 first, and the 2 left needs two 1s: 3 coins in total. But two 3s need only 2 coins!\nTaking the biggest coin, 4, at the first step looked best, but it made the later steps worse. This is when greedy fails.\nThis program first uses greedy, then uses the brute force from chapter 18 to try every number of 4s and 3s, and finds the real fewest number of coins. Before you write a greedy algorithm, think about whether there is a counterexample like this; if you cannot find one, it is best to also be able to say \"why this choice can never lose\".",
"predict": "How many coins does greedy use? What is the fewest that brute force finds?",
"ask": "Change money to 30 and the coins to 25, 10, 1 (test case 4 in 19-1). How must the brute-force loops change? When the coin values are not fixed, how do you find the fewest? (Dynamic programming in chapter 20 will solve this.)",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int coin[3] = {4, 3, 1};  // the coin values, from large to small\n    int money = 6;            // the change to give\n    int left;                 // greedy: how much is still left to give\n    int greedy = 0;           // how many coins greedy used\n    int i;                    // which coin\n    int a, b, c;              // brute force: how many 4s, 3s and 1s\n    int best = 100;           // the fewest coins brute force found\n    \n    left = money;\n    for (i = 0; i < 3; i++) {\n        while (left >= coin[i]) {\n            left -= coin[i];\n            greedy++;\n        }\n    }\n    for (a = 0; a * 4 <= money; a++) {\n        for (b = 0; a * 4 + b * 3 <= money; b++) {\n            c = money - a * 4 - b * 3;\n            if (a + b + c < best) {\n                best = a + b + c;\n            }\n        }\n    }\n    cout << \"Greedy: \" << greedy << \" coins\" << endl;\n    cout << \"Fewest: \" << best << \" coins\" << endl;\n    return 0;\n}"
},
"19-3": {
"title": "Sort First, Then Be Greedy: Waiting in Line for Water",
"isNew": "the fastest goes first, so the total waiting time is the smallest",
"uses": "sort in 14-11, 19-1",
"goal": "n people wait in line to get water, and each person takes a different amount of time. Everyone must wait for the people in front to finish. How should they line up so that the total waiting time is the smallest?\nThe greedy idea: let the people who take less time go first. The time taken by a person near the front has to be waited for by everyone behind; if the short ones go first, the numbers that many people wait for are small.\nSo first sort from small to large with sort, then calculate in that order. Many greedy problems look like this: sort first, then decide one by one. Greedy is right for this problem, and every test case gets AC.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of people n, then how many minutes each person takes to get water. Print the smallest possible total waiting time.",
"predict": "For test case 1, what is the order after sorting? What is the total waiting time?",
"ask": "Remove the sort line. Does test case 1 still get AC? What about sorting from large to small (sort(t, t + n, greater<int>()))?",
"code": "#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int t[10];      // how many minutes each person takes (at most 10 people)\n    int n;          // how many people\n    int now = 0;    // how many minutes have passed when it is this person's turn\n    int total = 0;  // the waiting times of everyone added up\n    int i;          // which person\n    \n    cin >> n;\n    for (i = 0; i < n; i++) {\n        cin >> t[i];\n    }\n    sort(t, t + n);\n    for (i = 0; i < n; i++) {\n        total += now;  // this person waited now minutes\n        now += t[i];   // the time when this person finishes\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "In the order 1 2 4 5 8: waiting 0 + 1 + 3 + 7 + 12 = 23"},
{"note": "Everyone is equally fast: 0 + 3 + 6 = 9"},
{"note": "Only one person, so no waiting"}
]
},
"19-4": {
"title": "Interval Scheduling: Pick the Most Activities That Don't Overlap",
"isNew": "sort by \"end time\"; pick it if its start time ≥ the end of the last one",
"uses": "19-3, bubble sort in 14-5",
"goal": "There are several activities, each with a start time and an end time, and you can only attend one at a time. How many can you attend at most?\nThe greedy idea: the earlier an activity ends, the better, because it leaves the most time for later. So sort by \"end time\" from small to large, then look from the start: if this activity's start time ≥ the end time of the last activity picked, pick it.\ns and e are two arrays, and when sorting they must be swapped together, or the start and end times will not match. This greedy is right, and every test case gets AC.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of activities n, then the start and end time of each activity. Print which activities are picked, and on the last line print the most you can attend.",
"predict": "For test case 2, is the activity 1-10 picked? Why?",
"ask": "What happens if sorting swaps only e and not s? Why is the condition s[i] >= last, not s[i] > last?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int s[10], e[10];  // start and end time of each activity (at most 10)\n    int n;             // how many activities\n    int i, j, tmp;     // for sorting\n    int last = -1;     // when the last picked activity ends\n    int cnt = 0;       // how many picked\n    \n    cin >> n;\n    for (i = 0; i < n; i++) {\n        cin >> s[i] >> e[i];\n    }\n    for (i = 0; i < n; i++) {\n        for (j = 0; j + 1 < n - i; j++) {\n            if (e[j] > e[j + 1]) {\n                tmp = e[j];\n                e[j] = e[j + 1];\n                e[j + 1] = tmp;\n                tmp = s[j];\n                s[j] = s[j + 1];\n                s[j + 1] = tmp;\n            }\n        }\n    }\n    for (i = 0; i < n; i++) {\n        if (s[i] >= last) {\n            cout << s[i] << \" - \" << e[i] << endl;\n            last = e[i];\n            cnt++;\n        }\n    }\n    cout << cnt << endl;\n    return 0;\n}",
"tests": ACT_TESTS_EN
},
"19-5": {
"title": "A Different Greedy Rule Is Wrong",
"isNew": "sort by start time: one very long activity blocks the others",
"uses": "19-4",
"goal": "For the same interval scheduling problem, \"pick the one that starts earliest first\" also sounds reasonable. This program is almost the same as 19-4; only the sorting rule changes from e to s, and the test cases are the same as in 19-4.\nRun it: some test cases get WA. In test case 2, the first activity starts at 1 and does not end until 10. If you pick it, none of the other three can be picked.\nFor the same problem, if the greedy \"rule\" is wrong, the answer is wrong. So the hardest part of greedy is not writing the program, but thinking clearly: by what rule should each step choose?\nDijkstra (21-6), Kruskal (21-11) and Prim (21-12) in chapter 21 are also greedy: at each step they pick the nearest point or the shortest edge, and it can be proved that this choice never loses.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: the same as 19-4.",
"predict": "Of the 3 test cases, which get WA? How is the output different from the expected one?",
"ask": "For test case 3, if the rule were \"the shortest goes first\", which one is picked first? How many more can be picked? Think of a test case where \"sort by start time\" also gets AC.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int s[10], e[10];  // start and end time of each activity (at most 10)\n    int n;             // how many activities\n    int i, j, tmp;     // for sorting\n    int last = -1;     // when the last picked activity ends\n    int cnt = 0;       // how many picked\n    \n    cin >> n;\n    for (i = 0; i < n; i++) {\n        cin >> s[i] >> e[i];\n    }\n    for (i = 0; i < n; i++) {\n        for (j = 0; j + 1 < n - i; j++) {\n            if (s[j] > s[j + 1]) {\n                tmp = e[j];\n                e[j] = e[j + 1];\n                e[j + 1] = tmp;\n                tmp = s[j];\n                s[j] = s[j + 1];\n                s[j + 1] = tmp;\n            }\n        }\n    }\n    for (i = 0; i < n; i++) {\n        if (s[i] >= last) {\n            cout << s[i] << \" - \" << e[i] << endl;\n            last = e[i];\n            cnt++;\n        }\n    }\n    cout << cnt << endl;\n    return 0;\n}",
"tests": ACT_TESTS_EN
},
"19-6": {
"title": "The Fractional Knapsack: Things You Can Cut",
"isNew": "take by \"money per kilogram\" from high to low; cut part of the last one if it does not fit",
"uses": "swapping together in 19-4, (double) casting",
"goal": "A bag can hold at most cap kilograms. Each item has a weight and a value, and it can be cut so you take only part of it (like gold dust or rice). How do you fill the bag to get the highest value?\nThe greedy rule is \"how much one kilogram is worth\", which is value ÷ weight. Sort by this from high to low, and take whole items starting from the most valuable; for the item that does not fit, cut off just the part that fills the bag.\nBecause items can be cut, the bag is always filled with the most valuable things, so this greedy is right, and every test case gets AC. The next lesson takes away \"can be cut\" and shows what happens.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of items n and the weight the bag can hold, cap, then the weight and value of each item. Items can be cut. Print the highest total value you can carry.",
"predict": "For test case 1, how much is one kilogram of each of the three items worth? Which item is cut?",
"ask": "If you took the heaviest first, or the one with the highest value first, would test case 1 still get AC?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int w[10], v[10];  // weight and value of each item (at most 10)\n    int n, cap;         // how many items, how many kilograms the bag can still hold\n    int i, j, tmp;      // for sorting\n    double total = 0;       // the total value put in\n    \n    cin >> n >> cap;\n    for (i = 0; i < n; i++) {\n        cin >> w[i] >> v[i];\n    }\n    for (i = 0; i < n; i++) {\n        for (j = 0; j + 1 < n - i; j++) {\n            if ((double)v[j] / w[j] < (double)v[j + 1] / w[j + 1]) {\n                tmp = w[j];\n                w[j] = w[j + 1];\n                w[j + 1] = tmp;\n                tmp = v[j];\n                v[j] = v[j + 1];\n                v[j + 1] = tmp;\n            }\n        }\n    }\n    for (i = 0; i < n && cap > 0; i++) {\n        if (w[i] <= cap) {\n            total += v[i];\n            cap -= w[i];\n        } else {\n            total += (double)v[i] * cap / w[i];\n            cap = 0;\n        }\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "6, 5 and 4 dollars per kilogram: take the first two whole, cut 20 kg of the third, 60 + 100 + 80 = 240"},
{"note": "First take the 5 kg item worth 2 dollars per kilogram, then cut 5 kg of the other"},
{"note": "The whole item does not fit, so cut half"}
]
},
"19-7": {
"title": "When You Can't Cut: Greedy Is Wrong Again",
"isNew": "0/1 knapsack: each item is taken whole or not at all; the same greedy gets WA",
"uses": "19-6",
"goal": "If items cannot be cut (a laptop, a vase), each one is either taken whole or not taken. This is called the \"0/1 knapsack\".\nThis program still takes items by \"money per kilogram\" from high to low, but skips an item that does not fit and looks at the next one. The expected output of each test case is the real best way to fill the bag.\nRun it: some test cases get WA. Test case 1: it takes the 10 kg and 20 kg items in order, and the 20 kg left cannot hold the 30 kg item, so it gets only 160; but taking the 20 kg and 30 kg items fills exactly 50 kg and gives 220!\nWhen items cannot be cut, part of the bag may be left empty and wasted, so greedy is not always right. The 0/1 knapsack needs the dynamic programming in chapter 20.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: the same as 19-6, but items cannot be cut; each one is taken whole or not at all. Print the highest total value you can carry.",
"predict": "Of the 3 test cases, which get WA? What does greedy give for each?",
"ask": "What is the real best way to fill the bag in test case 3? Why should the item that is \"worth the most per kilogram\" not be taken?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int w[10], v[10];  // weight and value of each item (at most 10)\n    int n, cap;         // how many items, how many kilograms the bag can still hold\n    int i, j, tmp;      // for sorting\n    int    total = 0;       // the total value put in\n    \n    cin >> n >> cap;\n    for (i = 0; i < n; i++) {\n        cin >> w[i] >> v[i];\n    }\n    for (i = 0; i < n; i++) {\n        for (j = 0; j + 1 < n - i; j++) {\n            if ((double)v[j] / w[j] < (double)v[j + 1] / w[j + 1]) {\n                tmp = w[j];\n                w[j] = w[j + 1];\n                w[j + 1] = tmp;\n                tmp = v[j];\n                v[j] = v[j + 1];\n                v[j + 1] = tmp;\n            }\n        }\n    }\n    for (i = 0; i < n; i++) {\n        if (w[i] <= cap) {\n            total += v[i];\n            cap -= w[i];\n        }\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "Greedy takes 10 kg and 20 kg and gets only 160; 20 kg and 30 kg fill the bag exactly and give 220"},
{"note": "Greedy takes 5 kg and 4 kg, which happens to be the best"},
{"note": "Greedy takes 6 kg (9 dollars) first, and nothing fits in the 4 kg left; two 5 kg items give 10 dollars"}
]
},
"19-8": {
"title": "Huffman Coding: Merge the Two Smallest Each Time",
"isNew": "a priority_queue with the smallest first: take the two smallest, join them, and put the result back; this is how Huffman coding works",
"uses": "priority_queue in 16-18, 19-3",
"goal": "There are n piles of fruit. Each time you can merge two piles into one, and the effort is the two piles' weights added together. What is the least effort to merge everything into one pile?\nA pile merged early is counted again in every later merge, so the small ones should be merged first. The greedy way: each time, take out the two smallest piles, join them, and put the new pile back, until only one pile is left.\nTo keep taking \"the smallest\", a priority_queue with the smallest first is just right. This is how \"Huffman coding\" works: replace each pile's weight with how many times each character appears, and each time merge the two with the fewest times; the merging builds a binary tree. Characters that appear more often are closer to the root, so their codes are shorter and the file is compressed more. This greedy is right, and every test case gets AC.\nPick a test case and press \"Run this test\". Try every one.",
"task": "Problem: Input the number of piles n, then the weight of each pile. Print each merge, and on the last line print the least effort needed.",
"predict": "For test case 1, which two piles are merged first? How much effort is spent in total?",
"ask": "If you merged the two biggest piles each time, how much effort would test case 1 take? Why should the small ones be merged first?",
"code": "#include <iostream>\n#include <queue>\n#include <vector>\nusing namespace std;\n\nint main() {\n    priority_queue<int, vector<int>, greater<int>> pq;  // the smallest comes out first\n    int n, x;      // how many piles, the weight of each pile\n    int a, b;      // the two piles taken out\n    int cost = 0;  // how much effort in total\n    int i;         // for the loop\n    \n    cin >> n;\n    for (i = 0; i < n; i++) {\n        cin >> x;\n        pq.push(x);\n    }\n    while (pq.size() > 1) {\n        a = pq.top();\n        pq.pop();\n        b = pq.top();\n        pq.pop();\n        cost += a + b;\n        cout << a << \" + \" << b << \" = \" << a + b << endl;\n        pq.push(a + b);\n    }\n    cout << cost << endl;\n    return 0;\n}",
"tests": [
{},
{},
{"note": "Only one merge is needed"}
]
}
});
