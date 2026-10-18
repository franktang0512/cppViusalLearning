/* ---------- English: chapters 12-13 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{12:{title:"Stack"},13:{title:"Queue"}});
Object.assign(LESSON_EN,{
"12-1": {
"title": "Making a Stack with an Array",
"isNew": "a stack is like a pile of plates: push puts one on top, pop takes the top one",
"goal": "A stack is like a pile of plates: you can only put things on the top (push), and only take from the top (pop). To make one with an array, add a top variable that remembers \"which cell the top item is in\". top = -1 means it is empty.",
"predict": "The items go in as 10, 20, 30. In what order are they printed?",
"ask": "After a pop, is the 30 in st[2] still in memory? Why do we not need to clear it?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int st[5];     // the array that holds the data, at most 5 items\n    int top = -1;  // which cell the top item is in; -1 means empty\n    \n    top = top + 1;  // push 10\n    st[top] = 10;\n    top = top + 1;  // push 20\n    st[top] = 20;\n    top = top + 1;  // push 30\n    st[top] = 30;\n    while (top >= 0) {\n        cout << st[top] << endl;  // look at the top item\n        top = top - 1;            // pop: move top down one cell\n    }\n    return 0;\n}"
},
"12-2": {
"title": "Last In, First Out",
"isNew": "LIFO: the last one in is the first one out",
"goal": "The rule of a stack is called \"last in, first out\" (LIFO): the last item pushed is the first one popped. This program reads a list of numbers: if a number is greater than 0, push it; if it reads 0, pop and print.",
"predict": "With the input 1 2 0 3 0 0, which three numbers are printed?",
"ask": "Change the input to 1 0 0. What happens when the second 0 tries to pop?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int st[10];    // the array that holds the data\n    int top = -1;  // which cell the top item is in; -1 means empty\n    int x;         // the number read: greater than 0 means push, 0 means pop\n    \n    while (cin >> x) {\n        if (x > 0) {\n            top = top + 1;\n            st[top] = x;\n        } else {\n            cout << st[top] << \" \";\n            top = top - 1;\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"12-3": {
"title": "No Pop When Empty, No Push When Full",
"isNew": "check top == -1 before pop; check whether it is full before push",
"goal": "When the stack is empty (top is -1), you cannot pop, or you would read st[-1]. When the array is full, you cannot push any more. So check before every push and pop.",
"predict": "With the input 5 0 0 1 2 3 4, what is printed?",
"ask": "Why is the \"full\" condition top == 2 and not top == 3?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int st[3];     // the array that holds the data, only 3 cells\n    int top = -1;  // which cell the top item is in; -1 means empty\n    int x;         // the number read: greater than 0 means push, 0 means pop\n    \n    while (cin >> x) {\n        if (x > 0) {\n            if (top == 2) {\n                cout << \"full \";\n            } else {\n                top = top + 1;\n                st[top] = x;\n            }\n        } else if (top == -1) {\n            cout << \"empty \";\n        } else {\n            cout << st[top] << \" \";\n            top = top - 1;\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"12-4": {
"title": "C++'s Built-in stack",
"isNew": "#include <stack>: push, pop, top, empty, size",
"goal": "C++ already has a stack ready for you: after #include <stack>, declare one with stack<int>, and you do not need to manage the array and top yourself. st.push(x) puts x on top, st.top() looks at the top, st.pop() removes the top, st.empty() asks whether it is empty, and st.size() asks how many items there are.",
"predict": "With the input 1 2 3, in what order does the second line print?",
"ask": "Remove while (!st.empty()) and just pop four times in a row. What happens? Compare it with the array version in 12-2.",
"code": "#include <iostream>\n#include <stack>\nusing namespace std;\n\nint main() {\n    stack<int> st;  // C++'s built-in stack; no need to manage top yourself\n    int x;          // the number read\n    \n    while (cin >> x) {\n        st.push(x);\n    }\n    cout << \"Total: \" << st.size() << \" items\" << endl;\n    while (!st.empty()) {\n        cout << st.top() << \" \";\n        st.pop();\n    }\n    cout << endl;\n    return 0;\n}"
},
"12-5": {
"title": "Tracing push / pop",
"isNew": "what is printed after a list of operations? Draw it first, then check",
"goal": "APCS concept questions often look like this: given a list of pushes and pops, what is printed at the end? The trick is to draw a vertical stack on paper, update it after each operation, and only look at the top item.\nDraw it yourself first and write down the three lines of output, then press \"Next\" to check your answer step by step.",
"predict": "What does each of the three cout lines print?",
"ask": "If you remove the second st.pop();, what does the answer become?",
"code": "#include <iostream>\n#include <stack>\nusing namespace std;\n\nint main() {\n    stack<int> st;  // an empty stack\n    \n    st.push(5);\n    st.push(8);\n    cout << st.top() << endl;\n    st.pop();\n    st.push(3);\n    st.push(7);\n    st.pop();\n    cout << st.top() << endl;\n    cout << st.size() << endl;\n    return 0;\n}"
},
"12-6": {
"title": "Recursion Is Really a Stack",
"isNew": "do recursion yourself with a stack: remember everything on the way down, then come back level by level",
"goal": "For fact(4) in chapter 9, \"The Call Stack Grows, Then Shrinks\", the computer really uses a stack to remember the n of each level that has not finished yet.\nThis program does the same thing without recursion, using a stack itself: the first loop is like \"calling down\", putting each level's n in; the second loop is like \"coming back level by level\", taking them from the top and multiplying. The fact levels stacked in chapter 9's memory view are this stack.",
"predict": "When the first loop ends, which numbers are in the stack, from top to bottom?",
"ask": "Open lesson 9-2 in chapter 9 and compare the two memory views: what looks the same?",
"code": "#include <iostream>\n#include <stack>\nusing namespace std;\n\nint main() {\n    stack<int> st;  // remembers the n of each level that has not finished yet\n    int n = 4;      // we want 4!\n    int ans = 1;    // the answer, starts at 1\n    \n    while (n > 1) {  // like recursion \"calling down\"\n        st.push(n);\n        n = n - 1;\n    }\n    while (!st.empty()) {  // like recursion \"coming back level by level\"\n        ans = ans * st.top();\n        st.pop();\n    }\n    cout << ans << endl;\n    return 0;\n}"
},
"13-1": {
"title": "Making a Queue with an Array",
"isNew": "a queue is like a line: come in at the back, leave from the front",
"goal": "A queue is like waiting in line: newcomers join at the back, and the one at the front leaves first. To make one with an array, you need two positions:\nfront: which cell the front item is in (the next one to leave).\nrear: which cell the next newcomer goes into.\nTo join, put the item at q[rear] and move rear forward one cell; to leave, take q[front] and move front forward one cell. When front equals rear, it is empty.",
"predict": "The items go in as 10, 20, 30. In what order are they printed? Is it the same as the stack in 12-1?",
"ask": "After leaving, is the 10 in q[0] still in memory? What are front and rear at the end?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int q[5];       // the array that holds the data, at most 5 items\n    int front = 0;  // which cell the front item is in\n    int rear = 0;   // which cell the next newcomer goes into\n    \n    q[rear] = 10;  // 10 joins\n    rear = rear + 1;\n    q[rear] = 20;  // 20 joins\n    rear = rear + 1;\n    q[rear] = 30;  // 30 joins\n    rear = rear + 1;\n    while (front < rear) {\n        cout << q[front] << endl;  // leave: take the front item\n        front = front + 1;\n    }\n    return 0;\n}"
},
"13-2": {
"title": "First In, First Out",
"isNew": "FIFO: the first one in is the first one out",
"goal": "The rule of a queue is called \"first in, first out\" (FIFO): the first one in is the first one out. Like 12-2, this program reads a list of numbers: if a number is greater than 0, it joins; if it reads 0, one leaves and is printed. Use the same input and compare the order a stack prints with the order a queue prints.",
"predict": "With the input 1 2 0 3 0 0, which three numbers are printed? The stack in 12-2 printed 2 3 1.",
"ask": "Change the input to 1 0 0. What happens when the second 0 tries to make one leave?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int q[10];      // the array that holds the data\n    int front = 0;  // which cell the front item is in\n    int rear = 0;   // which cell the next newcomer goes into\n    int x;          // the number read: greater than 0 means join, 0 means leave\n    \n    while (cin >> x) {\n        if (x > 0) {\n            q[rear] = x;\n            rear = rear + 1;\n        } else {\n            cout << q[front] << \" \";\n            front = front + 1;\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"13-3": {
"title": "Empty, Full, and Wasted Space",
"isNew": "when rear reaches the end it says full, but the freed cells at the front cannot be used",
"goal": "Before an item leaves, check whether the queue is empty (front equals rear); before an item joins, check whether it is full (rear equals the number of cells in the array).\nBut there is a problem: after items leave, front moves forward, and the cells freed at the front can never be used again. As soon as rear reaches the end, it says \"full\", even though there is space at the front. This is called \"false overflow\". The circular queue in the next lesson solves this problem.",
"predict": "With the input 1 2 3 0 0 4, does the last 4 fit? How many numbers are really in the queue at that moment?",
"ask": "Look at the memory at the last step: are q[0] and q[1] free? Why does it still say full?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int q[3];       // the array that holds the data, only 3 cells\n    int front = 0;  // which cell the front item is in\n    int rear = 0;   // which cell the next newcomer goes into\n    int x;          // the number read: greater than 0 means join, 0 means leave\n    \n    while (cin >> x) {\n        if (x > 0) {\n            if (rear == 3) {\n                cout << \"full \";\n            } else {\n                q[rear] = x;\n                rear = rear + 1;\n            }\n        } else if (front == rear) {\n            cout << \"empty \";\n        } else {\n            cout << q[front] << \" \";\n            front = front + 1;\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"13-4": {
"title": "Circular Queues",
"isNew": "rear = (rear + 1) % 3: after the last cell, go back to cell 0",
"goal": "Think of the array as a circle with its two ends joined: when front or rear reaches the last cell, the next step goes back to cell 0, so the freed cells at the front can be used again.\nTo do this, use % (the remainder): rear = (rear + 1) % 3, so the cell after 2 is (2 + 1) % 3 = 0.\nNow, when front equals rear, the queue might be empty or might be full, so we also use count to remember how many items there are now.",
"predict": "Like the last lesson, put in 1 2 3 and then take two away. Which cell does 4 go into this time?",
"ask": "Why does 6 not fit? Are front and rear equal at that moment? Can you tell empty from full by looking only at front and rear?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int q[3];       // the array that holds the data, only 3 cells\n    int front = 0;  // which cell the front item is in\n    int rear = 0;   // which cell the next newcomer goes into\n    int count = 0;  // how many items now, starts at 0\n    int x;          // the number read: greater than 0 means join, 0 means leave\n    \n    while (cin >> x) {\n        if (x > 0) {\n            if (count == 3) {\n                cout << \"full \";\n            } else {\n                q[rear] = x;\n                rear = (rear + 1) % 3;  // after the last cell, go back to cell 0\n                count = count + 1;\n            }\n        } else if (count == 0) {\n            cout << \"empty \";\n        } else {\n            cout << q[front] << \" \";\n            front = (front + 1) % 3;\n            count = count - 1;\n        }\n    }\n    cout << endl;\n    return 0;\n}"
},
"13-5": {
"title": "C++'s Built-in queue",
"isNew": "#include <queue>: push, pop, front, back, empty, size",
"goal": "C++ already has a queue ready for you: after #include <queue>, declare one with queue<int>, and you do not need to manage the array, front and rear yourself, or worry about false overflow.\nq.push(x) joins at the back, q.front() looks at the front, q.back() looks at the back, q.pop() removes the front, q.empty() asks whether it is empty, and q.size() asks how many items there are.\nNote: a queue has no top(), because you look at \"the front\", not \"the top\".",
"predict": "With the input 1 2 3, in what order does the second line print? Compare it with the stack in 12-4.",
"ask": "What happens if you change q.front() to q.top()?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\nint main() {\n    queue<int> q;  // C++'s built-in queue\n    int x;         // the number read\n    \n    while (cin >> x) {\n        q.push(x);\n    }\n    cout << \"Total: \" << q.size() << \", front \" << q.front() << \", back \" << q.back() << endl;\n    while (!q.empty()) {\n        cout << q.front() << \" \";\n        q.pop();\n    }\n    cout << endl;\n    return 0;\n}"
},
"13-6": {
"title": "Tracing push / pop",
"isNew": "the same operations as the stack, but a queue gives a different result",
"goal": "The operations in this lesson are exactly the same as in 12-5, but the stack is now a queue. push still puts an item in, but pop removes a different one: a stack removes the top (the last one put in), while a queue removes the front (the first one put in).\nFirst draw a queue in a row on paper, update it after each operation, and write down the three lines of output. Then press \"Next\" to check. The stack in 12-5 printed 8, 3, 2.",
"predict": "What does each of the three cout lines print? Compared with the stack's 8, 3, 2, which lines are the same and which are different?",
"ask": "If you remove the second q.pop();, what does the answer become?",
"code": "#include <iostream>\n#include <queue>\nusing namespace std;\n\nint main() {\n    queue<int> q;  // an empty queue\n    \n    q.push(5);\n    q.push(8);\n    cout << q.front() << endl;\n    q.pop();\n    q.push(3);\n    q.push(7);\n    q.pop();\n    cout << q.front() << endl;\n    cout << q.size() << endl;\n    return 0;\n}"
},
"13-7": {
"title": "deque: Both Ends Open",
"isNew": "#include <deque>: push_front, push_back, pop_front, pop_back",
"uses": "queue (13-5), stack (12-4)",
"goal": "A deque (double-ended queue, said like \"deck\") can add and remove at both ends: push_front and push_back put items in, pop_front and pop_back take them out, and front() and back() look at the two ends.\nIf you only use push_back and pop_back, it works like a stack; if you only use push_back and pop_front, it works like a queue. A deque can also use d[i] to look at item i.",
"predict": "What do the two cout lines print? Which one is d[1]?",
"ask": "If you only use push_back and pop_front, is d like a stack or a queue? Try changing it.",
"code": "#include <iostream>\n#include <deque>\nusing namespace std;\n\nint main() {\n    deque<int> d;  // both ends can add and remove\n    \n    d.push_back(2);   // put 2 at the back\n    d.push_back(3);   // put 3 at the back\n    d.push_front(1);  // put 1 at the front\n    cout << d.front() << \" \" << d.back() << endl;\n    d.pop_back();     // remove the back\n    d.push_front(0);  // put 0 at the front\n    cout << d.front() << \" \" << d.back() << \" \" << d.size() << endl;\n    cout << d[1] << endl;\n    return 0;\n}"
}
});
