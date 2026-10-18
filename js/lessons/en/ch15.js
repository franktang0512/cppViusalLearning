/* ---------- English: chapter 15 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{15:{title:"Searching"}});
Object.assign(LESSON_EN,{
"15-1": {
"title": "Linear Search: Look One by One",
"isNew": "look from start to end, at most n items: O(n)",
"uses": "arrays, for, break",
"goal": "To find a number in an array, the most direct way is to look at each cell from cell 0, one by one, and stop when you find it. This is called linear search.\nIt works even if the data is not sorted. But if you are unlucky (the number is at the very end, or not there at all), you must look at all n items, so the time complexity is O(n).",
"predict": "When looking for 8, how many cells must be checked before it is found?",
"ask": "Change x to 5 (there is no 5 in the array). How many cells are checked? What is printed?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[8] = {7, 3, 9, 1, 8, 2, 6, 4};  // data that is not sorted\n    int n = 8;      // how many\n    int x = 8;      // the number to find\n    int i;          // which cell is being checked\n    int pos = -1;   // the position found; -1 means not found yet\n    \n    for (i = 0; i < n; i++) {\n        if (a[i] == x) {\n            pos = i;\n            break;\n        }\n    }\n    cout << pos << endl;\n    return 0;\n}"
},
"15-2": {
"title": "Binary Search: Cut in Half Every Time",
"isNew": "the data must be sorted first; look at the middle, then throw away the half it cannot be in: O(log n)",
"uses": "while, integer division",
"goal": "If the data is already sorted from small to large, you can be much faster: each time, look at the very middle of \"the range not yet ruled out\", a[mid].\nIf a[mid] is exactly x: found. If a[mid] is smaller than x: x can only be in the right half, so throw away the whole left half (mid included): l = mid + 1. If a[mid] is bigger than x: throw away the right half: r = mid - 1.\nHalf is thrown away each time, so 8 items need at most 4 looks, and even 1 million items need only about 20. The time complexity is O(log n).\nBinary search is also the divide and conquer you learned in 14-2: each time it splits the range in the middle, but it only keeps searching the half where the answer can be, and throws the other half away.",
"predict": "How many looks does it take to find 7? Which cell is looked at first?",
"ask": "If the number you want appears many times, does binary search always find the first one? (15-4 covers this.)",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[8] = {1, 2, 3, 4, 6, 7, 8, 9};  // already sorted from small to large\n    int n = 8;          // how many\n    int x = 7;          // the number to find\n    int l = 0, r = n - 1;  // the range not yet ruled out: a[l] to a[r]\n    int mid;            // the very middle\n    int pos = -1;       // the position found; -1 means not found\n    int times = 0;      // how many looks\n    \n    while (l <= r) {\n        times = times + 1;\n        mid = (l + r) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            l = mid + 1;  // x is in the right half\n        } else {\n            r = mid - 1;  // x is in the left half\n        }\n    }\n    cout << pos << \" \" << times << endl;\n    return 0;\n}"
},
"15-3": {
"title": "When It Is Not Found",
"isNew": "l and r get closer and closer, and when they cross (l > r), it is not there",
"uses": "binary search in 15-2",
"goal": "If the number is not in the array, binary search still throws away half each time, and the range keeps getting smaller. At the end, l moves to the right of r (l > r), so nothing is left in the range, the loop stops, and pos is still -1.\nWhen it stops, l points exactly to \"where x should be inserted\": everything to the left is smaller than x, and everything from l on is bigger. So even when it is not found, the search is not wasted: you know where it belongs.",
"predict": "When looking for 5, what are l and r when the loop ends?",
"ask": "Change x to 0 (smaller than everything) and to 10 (bigger than everything). What is l at the end each time?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[8] = {1, 2, 3, 4, 6, 7, 8, 9};  // already sorted from small to large\n    int n = 8;          // how many\n    int x = 5;          // the number to find: not in the array\n    int l = 0, r = n - 1;  // the range not yet ruled out: a[l] to a[r]\n    int mid;            // the very middle\n    int pos = -1;       // the position found; -1 means not found\n    \n    while (l <= r) {\n        mid = (l + r) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            l = mid + 1;\n        } else {\n            r = mid - 1;\n        }\n    }\n    if (pos == -1) {\n        cout << \"Cannot find \" << x << \"; it should go into cell \" << l << \".\" << endl;\n    } else {\n        cout << \"At cell \" << pos << \".\" << endl;\n    }\n    return 0;\n}"
},
"15-4": {
"title": "The Edges of Binary Search",
"isNew": "find \"the first ≥ x\": l < r, r = mid, l = mid + 1",
"uses": "binary search in 15-2",
"goal": "When there are repeated numbers, you often need \"the position of the first item ≥ x\". You must write it very carefully:\n1. The range is [l, r): l may be the answer, but r is not. r starts at n, which means \"everything is smaller than x\".\n2. If a[mid] ≥ x: mid might be the answer, so do not throw it away: r = mid. If a[mid] < x: mid is surely not the answer: l = mid + 1.\n3. The loop condition is l < r. At the end, l and r meet, and that is the answer.\nThese edges are where binary search goes wrong most often: miss one + 1 and you may get an endless loop.",
"predict": "There are three 3s in a. Which 3's position does the program find?",
"ask": "Change l = mid + 1 to l = mid. What happens? Try it and think about why.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[8] = {1, 3, 3, 3, 5, 7, 8, 9};  // sorted from small to large, with repeats\n    int n = 8;          // how many\n    int x = 3;          // find the position of the first item ≥ x\n    int l = 0, r = n;   // the answer is in [l, r); r = n means everything is smaller than x\n    int mid;            // the very middle\n    \n    while (l < r) {\n        mid = (l + r) / 2;\n        if (a[mid] >= x) {\n            r = mid;      // mid might be the answer, so keep it\n        } else {\n            l = mid + 1;  // mid is too small, so it is surely not the answer\n        }\n    }\n    cout << l << endl;\n    return 0;\n}"
},
"15-5": {
"title": "C++'s Built-in Binary Search",
"isNew": "#include <algorithm>: binary_search, lower_bound, upper_bound",
"uses": "15-4, arrays, vector",
"goal": "C++ has binary search built in (the data still has to be sorted first):\nbinary_search(a, a + n, x): whether x is there; returns true or false.\nlower_bound(a, a + n, x): the position of the first item ≥ x, the same thing you wrote yourself in 15-4.\nupper_bound(a, a + n, x): the position of the first item > x.\nThey return a \"position\" (a pointer); subtract a to get the cell number. For a vector, write v.begin() and v.end(), and subtract v.begin().\nWhen it is not found: binary_search returns false (printed as 0); lower_bound returns where x should be inserted, and if everything is smaller than x, that is the end (a + n, and minus a it is n).",
"predict": "Searching for 3, which cells do lower_bound and upper_bound return? What about 10?",
"ask": "What do you get if you subtract the lower_bound result from the upper_bound result? What does it mean?",
"code": "#include <iostream>\n#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int a[8] = {1, 3, 3, 3, 5, 7, 8, 9};  // sorted from small to large\n    vector<int> v = {2, 4, 6, 8};        // sorted from small to large\n    int pos;  // the position found\n    \n    cout << binary_search(a, a + 8, 5) << endl;  // is 5 there?\n    pos = lower_bound(a, a + 8, 3) - a;           // the first item ≥ 3\n    cout << pos << endl;\n    pos = upper_bound(a, a + 8, 3) - a;           // the first item > 3\n    cout << pos << endl;\n    pos = lower_bound(v.begin(), v.end(), 5) - v.begin();\n    cout << pos << endl;\n    cout << binary_search(a, a + 8, 6) << endl;  // 6 is not found: 0 (false)\n    pos = lower_bound(a, a + 8, 10) - a;          // everything is smaller than 10\n    cout << pos << endl;\n    return 0;\n}"
},
"15-6": {
"title": "Binary Search on the Answer",
"isNew": "when answers split into \"OK\" and \"not OK\", you can binary search the answer",
"uses": "binary search in 15-2",
"goal": "Binary search can do more than find a number in an array. It can also \"find the answer\". For example: find the largest integer x with x × x ≤ n.\nThe answer could be anything from 0 to n. Guess a mid: if mid × mid ≤ n, mid is OK, so the answer is at least mid, and you try bigger ones (l = mid + 1); if mid × mid > n, mid is too big, so the answer is smaller (r = mid - 1).\nAs long as the answers split like this (\"all the small ones are OK, all the big ones are not\"), you can cut the range in half every time instead of trying 0, 1, 2, ... one by one.",
"predict": "When n = 50, what is the answer? What is the first mid guessed?",
"ask": "If you tried one by one from 0, how many tries would n = 50 take? How many tries did the binary search on the answer take?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 50;         // find the largest x with x × x ≤ n\n    int l = 0, r = n;   // the answer is between l and r\n    int mid;            // this time's guess\n    int ans = 0;        // the OK answer found so far\n    \n    while (l <= r) {\n        mid = (l + r) / 2;\n        if (mid * mid <= n) {\n            ans = mid;    // mid is OK, so write it down\n            l = mid + 1;  // try bigger ones\n        } else {\n            r = mid - 1;  // mid is too big\n        }\n    }\n    cout << ans << endl;\n    return 0;\n}"
},
"15-7": {
"title": "Comparing Linear Search and Binary Search",
"isNew": "O(n) vs. O(log n): the bigger n is, the bigger the gap",
"uses": "time complexity in 14-1, 15-1, 15-2",
"goal": "Linear search may look at all n items, which is O(n); binary search cuts the range in half each time and looks at most about log n times, which is O(log n).\nFor small n they are about the same, but as n grows, the gap becomes huge. This program works out, for different n, the most looks each method needs.\nBut binary search has one requirement: the data must be sorted first. If you only search once, sorting first (O(n log n)) is actually slower than a direct linear search; it is worth it only when you search many times.",
"predict": "When n = 1 million, at most how many looks does binary search need?",
"ask": "If a problem asks you to search 100,000 times in 100,000 items of data, about how many steps does linear search take? Will it get TLE?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;   // how many items of data\n    long long t;   // to work out log n: keep dividing by 2\n    int lg;        // at most how many looks binary search needs\n    \n    n = 10;\n    while (n <= 1000000) {\n        lg = 0;\n        t = n;\n        while (t > 0) {\n            t = t / 2;\n            lg = lg + 1;\n        }\n        cout << \"n = \" << n << \": linear at most \" << n << \" times, binary at most \" << lg << \" times\" << endl;\n        n = n * 10;\n    }\n    return 0;\n}"
}
});
