/* ---------- English: chapter 14 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{14:{title:"Complexity, Divide and Conquer, and Sorting"}});
Object.assign(LESSON_EN,{
"14-1": {
"title": "Time Complexity: Counting the Steps",
"isNew": "O(n), O(n²): how much more work there is when the data grows",
"goal": "Whether a program is fast does not depend on seconds (every computer is different), but on \"how many steps it takes when there are n items\".\nOne loop that runs n times is O(n): when n becomes 10 times bigger, the number of steps also becomes 10 times bigger. Two loops that each run n times make n × n steps in total, which is O(n²): when n becomes 10 times bigger, the steps become 100 times more.\nA computer can only do about 100 million (10⁸) steps per second. If a problem's n is 100,000, O(n²) needs 10 billion steps, which is surely too slow. That is TLE (Time Limit Exceeded) on an OJ.",
"predict": "When n = 10, what are one and two?",
"ask": "Change n to 20. How many times bigger do one and two each become? If n were 100,000, what would two be?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 10;    // how many items of data\n    int i, j;      // for the loops\n    int one = 0;   // how many steps one loop takes\n    int two = 0;   // how many steps two loops take\n    \n    for (i = 0; i < n; i++) {\n        one = one + 1;\n    }\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            two = two + 1;\n        }\n    }\n    cout << \"One loop: \" << one << \" times\" << endl;\n    cout << \"Two loops: \" << two << \" times\" << endl;\n    return 0;\n}"
},
"14-2": {
"title": "Divide and Conquer: Finding the Maximum",
"isNew": "split in two → solve each half → combine the two answers",
"uses": "recursion (chapter 9), 8-8 passing an array to a function",
"goal": "When a big problem is hard to solve, you can \"split\" it into two smaller problems of the same kind, solve each one, and then \"combine\" the two answers. This is called \"divide and conquer\".\nTo find the largest number in a[lo] to a[hi]:\n1. Split: cut it at the middle, mid, into a left half and a right half.\n2. Solve each: find the maximum of the left half and of the right half in the same way (recursion). When only one number is left, it is the largest by itself, so there is nothing more to split.\n3. Combine: compare the largest of the left half with the largest of the right half. The bigger one is the answer.\nThe split diagram on the right: each row is one level, and each column is the same cell a[i], so the same array is just cut into smaller pieces, not copied. When a piece is done, the maximum it found is shown next to it.",
"predict": "How many levels will the split diagram have? How many pieces are on the bottom level?",
"ask": "How many times is findMax called in total? You can also find the maximum with one loop from start to end. How many comparisons does each way need? (Divide and conquer is not always faster. This lesson is about learning \"how to split\".)",
"code": "#include <iostream>\nusing namespace std;\n\nint findMax(int a[], int lo, int hi) {  // the largest number in a[lo] to a[hi]\n    int mid;          // the middle position\n    int left, right;  // the largest number of the left half and of the right half\n\n    if (lo == hi) {\n        return a[lo];  // only one left: it is the largest\n    }\n    mid = (lo + hi) / 2;\n    left = findMax(a, lo, mid);\n    right = findMax(a, mid + 1, hi);\n    if (left > right) {\n        return left;\n    }\n    return right;\n}\n\nint main() {\n    int a[8] = {3, 8, 2, 5, 9, 1, 7, 4};  // the numbers to search\n    int ans;                              // the largest number\n\n    ans = findMax(a, 0, 7);\n    cout << ans << endl;\n    return 0;\n}"
},
"14-3": {
"title": "Divide and Conquer: Adding Up",
"isNew": "the same split; only change \"what to return when one is left\" and \"how to combine\"",
"uses": "14-2",
"goal": "This uses exactly the same split as 14-2, but this time adds up everything in a[lo] to a[hi]. Only two places in the whole program change:\n1. When only one number is left: the sum is that number.\n2. How to combine: the sum of the left half + the sum of the right half.\nWhen you write divide and conquer, you always think about three things: when do you stop splitting (the base case)? How do you split? How do you combine the two answers? The split is often the same; what changes is the \"combine\".",
"predict": "6 numbers cannot be cut into equal halves all the way down. What will the split diagram look like?",
"ask": "Change it to \"count how many even numbers there are\": what should it return when only one number is left? How do you combine the two halves?",
"code": "#include <iostream>\nusing namespace std;\n\nint sum(int a[], int lo, int hi) {  // add up a[lo] to a[hi]\n    int mid;          // the middle position\n    int left, right;  // the sum of the left half and of the right half\n\n    if (lo == hi) {\n        return a[lo];  // only one left: the sum is that number\n    }\n    mid = (lo + hi) / 2;\n    left = sum(a, lo, mid);\n    right = sum(a, mid + 1, hi);\n    return left + right;  // combine: add the two halves\n}\n\nint main() {\n    int a[6] = {4, 7, 1, 3, 8, 2};  // the numbers to add\n    int ans;                        // the total\n\n    ans = sum(a, 0, 5);\n    cout << ans << endl;\n    return 0;\n}"
},
"14-4": {
"title": "Fast Power: Cut in Half Every Time",
"isNew": "xⁿ = (x^(n/2))²; if n is odd, multiply by one more x; only about log n steps",
"uses": "time complexity in 14-1, 14-2",
"goal": "Divide and conquer does not only split arrays. To compute 2 to the power of 30, multiplying one by one takes 30 multiplications. But 2³⁰ = 2¹⁵ × 2¹⁵: you only need to compute 2¹⁵ first, then multiply it by itself once!\n2¹⁵ can be split again into 2⁷ × 2⁷ × 2 (15 is odd, so multiply by one more 2)... Each time n is cut in half, so n = 30 needs only 6 calls.\nLook at it with time complexity, as in 14-1: multiplying one by one is O(n), and fast power is O(log n). When n is 1 billion, one way needs 1 billion multiplications, and the other needs only about 30.\nLook at the call stack in memory: each level's n is half of the level above.",
"predict": "What is n on each level, in order? How many times is power called in total?",
"ask": "Change n to 1000000 (one million). About what will calls be? If you remove half = power(x, n / 2); and write return power(x, n / 2) * power(x, n / 2); instead, what does calls become? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nint calls = 0;  // how many times power is called in total\n\nlong long power(long long x, int n) {  // compute x to the power of n\n    long long half;  // x to the power of n/2\n\n    calls++;\n    if (n == 0) {\n        return 1;\n    }\n    half = power(x, n / 2);\n    if (n % 2 == 0) {\n        return half * half;\n    }\n    return half * half * x;  // n is odd: multiply by one more x\n}\n\nint main() {\n    long long ans;  // 2 to the power of 30\n\n    ans = power(2, 30);\n    cout << ans << endl;\n    cout << \"called \" << calls << \" times\" << endl;\n    return 0;\n}"
},
"14-5": {
"title": "Bubble Sort",
"isNew": "compare two neighbors, and swap the bigger one backward",
"uses": "arrays, nested for, swapping",
"goal": "Bubble sort: from start to end, compare each pair of neighboring cells, and swap them if the left one is bigger. After one round like this, the largest number has been swapped all the way to the end, like a bubble rising up.\nRound 1 puts the largest number in the last cell, round 2 puts the second largest in the second-to-last cell... so each round compares one cell fewer (n - 1 - i).",
"predict": "When round 1 ends, which number is in the last cell?",
"ask": "Why is the range of each round j < n - 1 - i? If you change it to j < n - 1, is the result wrong? Is it slower?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[6] = {5, 2, 4, 6, 1, 3};  // the numbers to sort\n    int n = 6;                      // how many\n    int i, j;                       // i: which round; j: comparing a[j] and a[j + 1]\n    int t;                          // for swapping\n    \n    for (i = 0; i < n - 1; i++) {\n        for (j = 0; j < n - 1 - i; j++) {\n            if (a[j] > a[j + 1]) {\n                t = a[j];\n                a[j] = a[j + 1];\n                a[j + 1] = t;\n            }\n        }\n    }\n    for (i = 0; i < n; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-6": {
"title": "Selection Sort",
"isNew": "each round, find the smallest and put it at the front",
"uses": "arrays, nested for",
"goal": "Selection sort: in round i, find the smallest number from a[i] to the end (remember its position m), then swap it with a[i]. This way the front gets sorted one cell at a time.\nCompared with bubble sort: selection sort swaps only once per round.",
"predict": "In round 1, which number is found, and where is it put?",
"ask": "Compared with 14-5, which one swaps fewer times? Look at how many times t changes in the trace table.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[6] = {5, 2, 4, 6, 1, 3};  // the numbers to sort\n    int n = 6;                      // how many\n    int i, j;                       // i: the position to fill this round; j: looks further back\n    int m;                          // which cell the smallest found so far is in\n    int t;                          // for swapping\n    \n    for (i = 0; i < n - 1; i++) {\n        m = i;\n        for (j = i + 1; j < n; j++) {\n            if (a[j] < a[m]) {\n                m = j;\n            }\n        }\n        t = a[i];\n        a[i] = a[m];\n        a[m] = t;\n    }\n    for (i = 0; i < n; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-7": {
"title": "Insertion Sort",
"isNew": "pick one up and insert it forward into the right place",
"uses": "arrays, for, while",
"goal": "Insertion sort is like sorting playing cards: the cards on the left are already in order. Each time, pick up the next card (key), look from right to left, and move every card bigger than it one cell to the right. When nothing more can move, put key into the empty spot.\nIf the numbers are already nearly sorted, insertion sort hardly needs to move anything, so it is very fast.",
"predict": "In the round that picks up 1, how many numbers must move to the right?",
"ask": "Change the starting numbers to {1, 2, 3, 4, 6, 5} (nearly sorted). Are there more steps or fewer?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[6] = {5, 2, 4, 6, 1, 3};  // the numbers to sort\n    int n = 6;                      // how many\n    int i, j;                       // i: this round picks up a[i]; j: compares to the left\n    int key;                        // the number picked up, to be inserted\n    \n    for (i = 1; i < n; i++) {\n        key = a[i];\n        j = i - 1;\n        while (j >= 0 && a[j] > key) {\n            a[j + 1] = a[j];  // move the ones bigger than key to the right\n            j = j - 1;\n        }\n        a[j + 1] = key;\n    }\n    for (i = 0; i < n; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-8": {
"title": "Merge Sort",
"isNew": "cut in half, sort each half, then merge the two halves",
"uses": "recursion (chapter 9), passing an array to a function",
"goal": "Merge sort uses \"divide and conquer\":\n1. Cut: cut a[l] to a[r] in half at the middle.\n2. Sort each: sort each half with merge sort again (recursion). When only one is left, there is nothing to sort.\n3. Merge: both halves are already sorted, so compare them from the start, put the smaller one into tmp first, and copy everything back into a at the end.\nLook at the call stack in memory: each level of mergeSort handles one piece, and l, mid and r are marked under the array.\nThe split diagram on the right is like 14-2: split all the way down to single numbers, and on the way back, merge the pieces two at a time. In the shaded pieces, the numbers are already sorted. The split is exactly the same as finding the maximum; only the \"combine\" changes, from comparing two numbers to joining two sorted halves into one piece.",
"predict": "Which two numbers are merged first?",
"ask": "At most how many levels of mergeSort are on the call stack? What if there were 12 numbers?",
"code": "#include <iostream>\nusing namespace std;\n\nint tmp[6];  // the array used for a moment while merging\n\nvoid mergeSort(int a[], int l, int r) {  // sort a[l] to a[r]\n    int mid;      // the middle position\n    int i, j, k;  // i walks the left half, j walks the right half, k puts into tmp\n\n    if (l >= r) {\n        return;  // only one left: already sorted\n    }\n    mid = (l + r) / 2;\n    mergeSort(a, l, mid);\n    mergeSort(a, mid + 1, r);\n    i = l;\n    j = mid + 1;\n    k = l;\n    while (i <= mid && j <= r) {\n        if (a[i] <= a[j]) {\n            tmp[k] = a[i];\n            i = i + 1;\n        } else {\n            tmp[k] = a[j];\n            j = j + 1;\n        }\n        k = k + 1;\n    }\n    while (i <= mid) {\n        tmp[k] = a[i];\n        i = i + 1;\n        k = k + 1;\n    }\n    while (j <= r) {\n        tmp[k] = a[j];\n        j = j + 1;\n        k = k + 1;\n    }\n    for (k = l; k <= r; k++) {\n        a[k] = tmp[k];\n    }\n}\n\nint main() {\n    int a[6] = {5, 2, 4, 6, 1, 3};  // the numbers to sort\n    int i;                          // for printing\n\n    mergeSort(a, 0, 5);\n    for (i = 0; i < 6; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-9": {
"title": "Quick Sort",
"isNew": "choose a pivot: smaller ones go left, bigger ones go right",
"uses": "recursion (chapter 9), passing an array to a function",
"goal": "Quick sort is also divide and conquer:\n1. Choose a pivot: here, the last number of the piece, a[r].\n2. Split into sides: j walks from left to right. Each number smaller than the pivot is swapped into the \"small area\" on the left (i is the last cell of the small area). After the walk, put the pivot right after the small area, and it is standing in its final sorted place.\n3. Do the same again for the left side and the right side (recursion).\nThe split diagram on the right: quick sort \"divides\" first (into a left piece and a right piece around the pivot), and then splits further down. After each piece is divided, its pivot is already in its final place, so nothing needs to be merged on the way back. Note that the two pieces are not always the same length.",
"predict": "After the first split, which cell does the pivot 3 stand in?",
"ask": "Change the starting numbers to the already sorted {1, 2, 3, 4, 5, 6}. Are there more steps or fewer? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid quickSort(int a[], int l, int r) {  // sort a[l] to a[r]\n    int pivot;  // the pivot: the last number of this piece\n    int i;      // where the last cell of the area smaller than pivot is\n    int j;      // the position being checked\n    int t;      // for swapping\n\n    if (l >= r) {\n        return;\n    }\n    pivot = a[r];\n    i = l - 1;\n    for (j = l; j < r; j++) {\n        if (a[j] < pivot) {\n            i = i + 1;\n            t = a[i];\n            a[i] = a[j];\n            a[j] = t;\n        }\n    }\n    t = a[i + 1];\n    a[i + 1] = a[r];\n    a[r] = t;\n    quickSort(a, l, i);\n    quickSort(a, i + 2, r);\n}\n\nint main() {\n    int a[6] = {5, 2, 4, 6, 1, 3};  // the numbers to sort\n    int i;                          // for printing\n\n    quickSort(a, 0, 5);\n    for (i = 0; i < 6; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-10": {
"title": "Heap Sort",
"isNew": "swap the largest to the end, then arrange the rest into a heap again",
"uses": "heaps are explained in detail in chapter 16, \"Trees\"",
"goal": "Heap sort uses a structure called a \"max heap\": the array is arranged so that \"the largest is always in a[0]\". A heap is really a kind of \"tree\". How it works (why the children of position i are at 2i + 1 and 2i + 2, and why siftDown is written this way) is covered in detail in chapter 16, \"Trees\". Here, first see how it is used to sort:\n1. First arrange the whole array into a max heap (the first loop). The largest number moves to a[0].\n2. Swap a[0] (the largest) with the last cell, and the largest is sorted. The last cell no longer counts, and siftDown arranges the rest again, so it becomes a max heap again.\nRepeat this, and the numbers end up sorted from small to large. Look at the marks under the array: the cells to the right of last are the sorted part; i and big are the positions siftDown is comparing.",
"predict": "After the first swap, which number is in the last cell?",
"ask": "Why is the second argument of siftDown(a, last, 0) last, not n?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid siftDown(int a[], int n, int i) {  // let a[i] sink down to the right place\n    int left, right;  // left child 2i + 1, right child 2i + 2\n    int big;          // which of i and its two children is the largest\n    int t;            // for swapping\n\n    while (2 * i + 1 < n) {\n        left = 2 * i + 1;\n        right = 2 * i + 2;\n        big = i;\n        if (a[left] > a[big]) {\n            big = left;\n        }\n        if (right < n && a[right] > a[big]) {\n            big = right;\n        }\n        if (big == i) {\n            break;  // bigger than both children: no need to sink further\n        }\n        t = a[i];\n        a[i] = a[big];\n        a[big] = t;\n        i = big;\n    }\n}\n\nint main() {\n    int a[7] = {4, 10, 3, 5, 1, 8, 2};  // the numbers to sort\n    int n = 7;                         // how many\n    int start;                         // building the heap: which parent to sink first\n    int last;                          // the last cell of the heap now\n    int t;                             // for swapping\n    int i;                             // for printing\n\n    for (start = n / 2 - 1; start >= 0; start--) {  // 1. first build the max heap\n        siftDown(a, n, start);\n    }\n    for (last = n - 1; last > 0; last--) {  // 2. swap the largest to the end, then sink\n        t = a[0];\n        a[0] = a[last];\n        a[last] = t;\n        siftDown(a, last, 0);\n    }\n    for (i = 0; i < n; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-11": {
"title": "C++'s Built-in sort",
"isNew": "#include <algorithm>: sort(a, a + n); greater<int>() for large to small",
"uses": "arrays, vector",
"goal": "All the methods above were written by hand. C++ has sorting built in: after #include <algorithm>, sort(a, a + n) sorts the first n items of array a from small to large; for a vector, write sort(v.begin(), v.end()).\nTo sort from large to small, add a third argument, greater<int>(). The method sort uses is fast (about n log n), much faster than bubble, selection and insertion sort, so in contests you usually just use it.",
"predict": "sort(a, a + 6) sorts it in one step. What does v print after it is sorted from large to small?",
"ask": "Change sort(a, a + 6) to sort(a, a + 3). Which cells get sorted?",
"code": "#include <iostream>\n#include <algorithm>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int a[6] = {5, 2, 4, 6, 1, 3};      // an array\n    vector<int> v = {30, 10, 20};      // a vector\n    int i;                             // for printing\n    \n    sort(a, a + 6);\n    for (i = 0; i < 6; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    sort(v.begin(), v.end(), greater<int>());  // from large to small\n    for (int x : v) {\n        cout << x << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-12": {
"title": "sort with a Compare Function: You Decide the Order",
"isNew": "sort(a, a + n, cmp): if cmp(x, y) returns true, x comes before y",
"uses": "sort in 14-11, functions (chapter 8)",
"goal": "Normally sort orders from small to large. To sort by your own rule, write a compare function cmp(x, y): return true if x should come before y, and false otherwise. Then pass the function's name as the third argument of sort (no parentheses).\nThis program sorts by the \"ones digit\", from small to large. When it runs, you will see sort keep calling cmp to ask \"which one should come first\".\nNote: when the two are equal, cmp must return false. So write <, not <=, or sort may go wrong.",
"predict": "What is the order after sorting? How many times is cmp called in total?",
"ask": "To sort from large to small instead, how do you write cmp? Compared with sort(a, a + 5, greater<int>()), which is easier?",
"code": "#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nbool cmp(int x, int y) {\n    return x % 10 < y % 10;  // the one with the smaller ones digit comes first\n}\n\nint main() {\n    int a[5] = {23, 41, 15, 32, 7};  // the numbers to sort\n    int i;                           // for printing\n\n    sort(a, a + 5, cmp);\n    for (i = 0; i < 5; i++) {\n        cout << a[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"14-13": {
"title": "Sort by Score, Then by Seat Number",
"isNew": "cmp compares the first rule, and only if equal, the second",
"uses": "14-12, the struct array in 11-3",
"goal": "A very common OJ sort: higher scores come first; if the scores are equal, the smaller seat number comes first.\nIn cmp, compare the scores first: if they are different, the scores decide (higher first, so return a.score > b.score). Only if they are equal, compare the seat numbers (smaller first, so return a.id < b.id).\nTo sort an array of structs, you must write a compare function, because C++ does not know which field to sort by.",
"predict": "After sorting, who are first and second? Of the two 80s, which comes first?",
"ask": "If you remove return a.id < b.id; (compare scores only), does C++ still promise that number 2 comes before number 5? If you want \"lower scores first, and if equal, larger seat numbers first\", how do you change cmp?",
"code": "#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nstruct Student {\n    int id;     // seat number\n    int score;  // score\n};\n\nbool cmp(Student a, Student b) {\n    if (a.score != b.score) {\n        return a.score > b.score;  // higher score first\n    }\n    return a.id < b.id;  // same score: smaller seat number first\n}\n\nint main() {\n    Student s[5] = {{1, 80}, {2, 95}, {3, 80}, {4, 70}, {5, 95}};  // 5 students\n    int i;  // for printing\n\n    sort(s, s + 5, cmp);\n    for (i = 0; i < 5; i++) {\n        cout << s[i].id << \" \" << s[i].score << endl;\n    }\n    return 0;\n}"
},
"14-14": {
"title": "Comparing Sorting Methods",
"isNew": "how big the gap is between O(n²) and O(n log n)",
"uses": "time complexity in 14-1",
"goal": "The time complexity of the sorting methods in this chapter is roughly:\nBubble, selection and insertion sort: O(n²) (two loops).\nMerge sort and heap sort: O(n log n) (how heap sort works is in chapter 16, \"Trees\"). Quick sort: usually O(n log n), but in the worst case (for example, when the largest or smallest is chosen as the pivot every time) it becomes O(n²). C++'s sort: O(n log n).\nlog n means \"how many times you divide n by 2 until it becomes 1\". When n is 1 million, log n is only about 20. This program works out how big the gap between n² and n log n is.",
"predict": "When n = 1 million, about how many times bigger is n² than n log n?",
"ask": "If an OJ can do about 100 million steps per second, about how many seconds does an O(n²) sort take when n = 1 million? What about O(n log n)?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;   // how many items of data\n    long long t;   // to work out log n: keep dividing by 2\n    int lg;        // about what log n is\n    \n    n = 10;\n    while (n <= 1000000) {\n        lg = 0;\n        t = n;\n        while (t > 1) {\n            t = t / 2;\n            lg = lg + 1;\n        }\n        cout << \"n = \" << n << \": n² = \" << n * n << \", n log n = \" << n * lg << endl;\n        n = n * 10;\n    }\n    return 0;\n}"
}
});
