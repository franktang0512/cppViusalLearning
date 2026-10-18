/* ---------- English: chapters 10-11 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{10:{title:"Pointers"},11:{title:"struct and Linked Lists"}});
const NODE_EN="struct Node {\n    int data;    // the data stored in this node\n    Node *next;  // the address of the next node\n};";
const STU_EN="struct Student {\n    string name;  // name\n    int score;    // score\n};";
Object.assign(LESSON_EN,{
"10-1": {
"title": "Memory Addresses",
"isNew": "& gets a variable's address",
"goal": "Memory is like a row of cells with house numbers. The number of each cell is called its \"address\". Putting & in front of a variable means \"where this variable lives\". Look at the memory on the right: the number to the left of each variable is its address.",
"predict": "How far apart are the addresses of a and b? And b and c? Why are they different?",
"ask": "Are the printed addresses the same as the numbers to the left of each variable in the memory on the right?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5;        // an int, takes 4 bytes\n    double b = 3.14;  // a double, takes 8 bytes\n    int c = 7;        // another int\n    \n    cout << \"address of a: \" << &a << endl;\n    cout << \"address of b: \" << &b << endl;\n    cout << \"address of c: \" << &c << endl;\n    return 0;\n}"
},
"10-2": {
"title": "Pointers: Variables That Store Addresses",
"isNew": "int *p, p = &a, *p is a",
"goal": "A pointer is also a variable, but it does not hold a normal number. It holds an \"address\". int *p declares a pointer, and p = &a makes p store the address of a. We say \"p points to a\". Putting * in front of a pointer means \"go to the address it stores\", so *p is a: reading *p reads a, and changing *p changes a.",
"predict": "After *p = 10; runs, what is a?",
"ask": "Delete the line p = &a; and run it again. What happens?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5;  // a normal int\n    int *p;     // a pointer: stores the address of an int\n    \n    p = &a;\n    cout << p << endl;\n    cout << *p << endl;\n    *p = 10;\n    cout << a << endl;\n    return 0;\n}"
},
"10-3": {
"title": "Pass by Value: A Function Cannot Change the Variable Outside",
"isNew": "pass by value makes a copy",
"goal": "A normal parameter is \"pass by value\": when you call the function, the value is copied and given to it. The x in the function is a new cell, so changing x does not change a in main.",
"predict": "After the function adds 1 to x, what is a in main?",
"ask": "If you want a to really become 6, what can you do? (next lesson)",
"code": "#include <iostream>\nusing namespace std;\n\nvoid addOne(int x) {\n    x = x + 1;\n    cout << \"in the function, x = \" << x << endl;\n}\n\nint main() {\n    int a = 5;  // a variable in main\n\n    addOne(a);\n    cout << \"in main, a = \" << a << endl;\n    return 0;\n}"
},
"10-4": {
"title": "Pass by Address: Passing an Address to a Function",
"isNew": "the parameter is a pointer: addOne(&a), int *x",
"goal": "To let a function change a variable outside it, pass the variable's \"address\" in. This is called \"pass by address\". Call it as addOne(&a), and the function's parameter is a pointer (int *x). Inside the function, *x goes to a's address, so changing *x changes a in main.",
"predict": "Compared with the last lesson, will a become 6 this time?",
"ask": "What happens if you forget the & when you call it, and write addOne(a)?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid addOne(int *x) {\n    *x = *x + 1;\n}\n\nint main() {\n    int a = 5;  // a variable in main\n\n    addOne(&a);\n    cout << a << endl;\n    return 0;\n}"
},
"10-5": {
"title": "References: Another Name for a Variable",
"isNew": "int &r = a: another name for the same cell",
"goal": "A reference gives a variable \"another name\". After int &r = a;, r and a are two names for the same cell. Changing r changes a, and no new cell is made in memory.\nCompared with a pointer:\nPointer int *p: p is another cell that holds an address; it can change to point to a different variable; you need *p to get the value.\nReference int &r: r is only another name and takes no new cell; it must be tied to a variable when declared and cannot be tied to another one later; you just write r.",
"predict": "After r = 10; runs, what is a?",
"ask": "Does r = b; make r another name for b, or does it put b's value into a? Look at the memory to find out.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5;    // a normal int\n    int b = 100;  // another int\n    int &r = a;   // r is another name (a reference) for a; it must be tied when declared\n    \n    r = 10;\n    cout << a << endl;\n    r = b;\n    cout << a << \" \" << b << endl;\n    return 0;\n}"
},
"10-6": {
"title": "Pass by Reference: An Easier Way to Pass by Address",
"isNew": "int &x: works like pass by address, but is easier to write",
"goal": "Pass by reference (a parameter written as int &x) works like pass by address: both can change the variable outside. But it is easier to write: no & when you call it, and no * inside the function. x is just another name for a. This lesson writes swap twice, once with pass by address and once with pass by reference, so you can compare them.",
"predict": "After swapping twice, are a and b back to their old values?",
"ask": "What does the memory look like while swapPtr runs, and while swapRef runs? Which one has extra pointer cells?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid swapPtr(int *x, int *y) {\n    int t;  // temporary\n\n    t = *x;\n    *x = *y;\n    *y = t;\n}\n\nvoid swapRef(int &x, int &y) {\n    int t;  // temporary\n\n    t = x;\n    x = y;\n    y = t;\n}\n\nint main() {\n    int a = 3, b = 7;  // the two numbers to swap\n\n    swapPtr(&a, &b);\n    cout << a << \" \" << b << endl;\n    swapRef(a, b);\n    cout << a << \" \" << b << endl;\n    return 0;\n}"
},
"10-7": {
"title": "Never Return the Address of a Local Variable",
"isNew": "returning a value is fine; returning a local variable's address makes a dangling pointer",
"goal": "A function's local variables are freed when the function ends (lesson 8-7).\nReturning the \"value\" of a local variable is fine: return x; copies the value and brings it back, so it does not matter that x is freed.\nBut you must not return the \"address\" of a local variable: the address brought back by return &x; points to a cell that is already freed. This is called a dangling pointer. A real C++ compiler usually only gives a warning. When it runs, it may print a strange number, may happen to look fine, or may crash. This bug is very hard to find.",
"predict": "Both functions set x = 42. Does main get 42 from both?",
"ask": "At the step where makeNumber ends, look at the memory: is x still there? Where does p point?",
"code": "#include <iostream>\nusing namespace std;\n\nint getNumber() {\n    int x = 42;  // local variable\n\n    return x;    // ✓ return the \"value\": a copy is brought back\n}\n\nint *makeNumber() {\n    int x = 42;  // local variable: freed when makeNumber ends\n\n    return &x;   // ✗ returns the \"address\" of a local variable\n}\n\nint main() {\n    int a;   // stores the value brought back by getNumber\n    int *p;  // stores the address brought back by makeNumber\n\n    a = getNumber();\n    cout << a << endl;\n    p = makeNumber();\n    cout << *p << endl;\n    return 0;\n}"
},
"10-8": {
"title": "Pointers and Arrays",
"isNew": "an array's name is the address of cell 0; p[2] is *(p + 2)",
"goal": "An array's name is \"the address of cell 0\", so p = a makes p point to a[0]. Adding 1 to a pointer moves it forward by one cell (an int cell is 4 bytes, so the address goes up by 4).\np[2] and *(p + 2) are the same thing: count 2 cells forward from p, then take that cell's value. In the same way, a[2] is *(a + 2).\nThis is also why an array is not copied when passed to a function (lesson 8-8): what is passed in is really an address.",
"predict": "When p points to a[1], do p[2] and *(p + 2) print the same thing? What about *(a + 2)?",
"ask": "If you write *(p + 2) as *p + 2 (without the parentheses), what is printed? Why is it different?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[4] = {10, 20, 30, 40};  // an array\n    int *p;                       // a pointer to one cell of the array\n    \n    p = a;\n    cout << *p << endl;\n    p = p + 1;\n    cout << *p << endl;\n    cout << p[2] << endl;        // with [ ]: count 2 cells forward from p\n    cout << *(p + 2) << endl;    // without [ ]: count 2 cells forward, then take the value with *\n    cout << *(a + 2) << endl;    // an array name works this way too: it is a[2]\n    return 0;\n}"
},
"10-9": {
"title": "Going Through an Array with a Pointer",
"isNew": "go through with *(p + i); p++ moves forward one cell at a time",
"uses": "pointers and arrays (lesson 10-8), for",
"goal": "You do not have to use a[i] to go through an array. You can use a pointer. There are two common ways:\nWay 1: p stays at a[0], and *(p + i) means \"count i cells forward from p, then take the value\". It is the same cell as a[i] and p[i].\nWay 2: let p move by itself. p++ moves p forward one cell, and *p is the cell it points to now. Stop when p reaches a + 5 (just after the last cell).\nLook at the marks under the array on the right: in way 1, i moves; in way 2, p moves.",
"predict": "After way 1 finishes, does p still point to a[0]? What about after way 2?",
"ask": "Why is the condition in way 2 p < a + 5 and not p <= a + 5? Try changing it to <=.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[5] = {3, 1, 4, 1, 5};  // an array\n    int *p;                      // a pointer to the array\n    int i;                       // how many cells forward from p\n    int sum = 0;                 // the total, starts at 0\n    \n    p = a;  // way 1: p does not move; count forward with *(p + i)\n    for (i = 0; i < 5; i++) {\n        cout << *(p + i) << \" \";\n        sum = sum + *(p + i);\n    }\n    cout << endl << sum << endl;\n    \n    for (p = a; p < a + 5; p++) {  // way 2: p moves forward one cell at a time\n        cout << *p << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"10-10": {
"title": "A Pointer Through a 2D Array",
"isNew": "a 2D array is one long line, so an int pointer can go through every row",
"uses": "flattening 2D arrays (lesson 7-7), pointers and arrays",
"goal": "Lesson 7-7 showed that a 2D array is one long line in memory, one row after another. So an int pointer starting at a[0][0] can use p[k] for cell k and go all the way to the last cell.\nWhen p points to a[1][3] (the last cell of row 1), p[1] is not an error: it reaches a[2][0], the start of the next row. Look at the arrow on the right and the long line below.",
"predict": "After p = &a[1][3];, which cell of the table does p[1] = 60; change?",
"ask": "Change p = &a[0][0]; to p = a[0];. Is the result the same? What is a[0]?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[3][4] = {};  // 3 rows, 4 columns, all 0\n    int *p;            // a pointer to an int\n    \n    p = &a[0][0];\n    for (int k = 0; k < 12; k++) {\n        p[k] = k;\n    }\n    p = &a[1][3];\n    *p = 50;\n    p[1] = 60;\n    cout << a[2][0] << endl;\n    return 0;\n}"
},
"10-11": {
"title": "Pointers to Pointers",
"isNew": "int **pp = &p: pp stores the address of \"the pointer p\"",
"uses": "pointers (lesson 10-2)",
"goal": "The pointer p is a variable too, and it lives at some address in memory, so &p gets its address. A variable that stores \"the address of a pointer\" is called a pointer to a pointer, written int **pp.\nEach * takes one step: *pp goes to the address stored in pp, which gives p; **pp takes one more step, to the address stored in p, which gives a.\nLook at the arrows on the right: pp → p → a, two arrows joined together.",
"predict": "Does *pp = &b; change pp, p or a? After it runs, what does p point to?",
"ask": "Change the line int **pp = &p; to int **pp = &a;. What happens? Why is it not allowed?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5;      // a normal int\n    int *p = &a;    // p points to a\n    int **pp = &p;  // pp points to p (a pointer to a pointer)\n    \n    cout << **pp << endl;\n    **pp = 9;\n    cout << a << endl;\n    \n    int b = 7;      // another int\n    *pp = &b;\n    cout << *p << endl;\n    return 0;\n}"
},
"10-12": {
"title": "A Function That Changes a Pointer Outside",
"isNew": "to let a function change the pointer itself, pass the pointer's address (int **)",
"uses": "pass by address (lesson 10-4), pointers to pointers",
"goal": "Lesson 10-4 showed: to let a function change an int outside, pass the int's address (int *).\nIn the same way, to let a function change a \"pointer\" outside (make it point somewhere else), pass the pointer's address, which is an int **.\nBoth functions below want p to point to b: moveWrong only gets a copy of p, so it cannot change the p outside; moveRight gets p's address, so *pp = t really changes p. Later, when you insert a node at the front of a linked list, you will use this way of writing.",
"predict": "After the two calls, is 1 or 2 printed each time?",
"ask": "While moveRight runs, look at the memory: where does pp's arrow point? Which cell does *pp = t change?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid moveWrong(int *q, int *t) {\n    q = t;     // only changes the copy q\n}\n\nvoid moveRight(int **pp, int *t) {\n    *pp = t;   // go to the address stored in pp, which is the p outside\n}\n\nint main() {\n    int a = 1, b = 2;  // two ints\n    int *p = &a;       // p points to a at the start\n\n    moveWrong(p, &b);\n    cout << *p << endl;\n    moveRight(&p, &b);\n    cout << *p << endl;\n    return 0;\n}"
},
"11-1": {
"title": "struct: Fields Tied Together",
"isNew": "struct defines a new type; variable.field",
"goal": "A student has a name and a score. Keeping them in two separate variables gets messy easily. A struct ties them together into a new type: struct Student { ... }; defines Student, and name and score inside it are called \"fields\". Use \"variable.field\" to reach them, for example a.score.\nNote: you must put a semicolon after the } of a struct definition.",
"predict": "Right after a is declared, what are a.name and a.score?",
"ask": "Delete the semicolon at the end of the struct definition. What error do you get?",
"code": "#include <iostream>\nusing namespace std;\n\n"+STU_EN+"\n\nint main() {\n    Student a;  // one student: name and score tied together\n\n    a.name = \"Amy\";\n    a.score = 90;\n    cout << a.name << \" \" << a.score << endl;\n    return 0;\n}"
},
"11-2": {
"title": "Starting Values and Copying the Whole Thing",
"isNew": "{ } gives values in field order; b = a copies everything",
"goal": "When you declare a struct, you can use { } to give values in \"field order\". A struct can be copied as a whole with =: every field is copied. After copying, a and b are still two different pieces of memory, so changing b does not change a.\nBut a struct cannot be compared directly with == or <. C++ does not know which field you want to compare, so you must say it yourself, for example a.score < b.score.",
"predict": "After b.score = 60;, what is a.score?",
"ask": "Add the line if (a < b) cout << \"a is smaller\";. What happens? What should you compare instead?",
"code": "#include <iostream>\nusing namespace std;\n\n"+STU_EN+"\n\nint main() {\n    Student a = {\"Amy\", 90};  // in field order: name, score\n    Student b;                 // another student\n\n    b = a;\n    b.score = 60;\n    cout << a.name << \" \" << a.score << endl;\n    cout << b.name << \" \" << b.score << endl;\n    return 0;\n}"
},
"11-3": {
"title": "Arrays of structs",
"isNew": "a[i].score: the score of student i",
"uses": "cin, for, if, arrays",
"goal": "A struct can be made into an array too: a[i] is student i, and a[i].score is that student's score. The name and score always stay tied together, so when you find the cell with the highest score, you find the name with it.",
"task": "Problem: Input the names and scores of n students, and print the name of the student with the highest score.",
"ask": "How would you write it with two arrays, string name[5] and int score[5]? Which way is less likely to go wrong?",
"code": "#include <iostream>\nusing namespace std;\n\n"+STU_EN+"\n\nint main() {\n    Student a[5];  // at most 5 students\n    int n;         // number of students\n    int best = 0;  // which student has the highest score so far\n\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> a[i].name >> a[i].score;\n    }\n    for (int i = 1; i < n; i++) {\n        if (a[i].score > a[best].score) {\n            best = i;\n        }\n    }\n    cout << a[best].name << endl;\n    return 0;\n}"
},
"11-4": {
"title": "Pointers to structs",
"isNew": "Student *p; p->score is (*p).score",
"uses": "pointers, pass by address",
"goal": "A pointer can point to a struct too. p stores the address of a, so *p is a, and (*p).score is a.score. This is used so often that C++ gives it a short form: p->score (an arrow).\nIf you pass a struct's address to a function, the function can change the struct outside, just like pass by address in chapter 10. The arrows in the memory on the right show \"which thing the pointer points to\".",
"predict": "What a.score is printed at the end?",
"ask": "Remove the parentheses from (*p).score and write *p.score. What happens?",
"code": "#include <iostream>\nusing namespace std;\n\n"+STU_EN+"\n\nvoid addBonus(Student *s) {\n    s->score = s->score + 10;\n}\n\nint main() {\n    Student a = {\"Amy\", 70};  // one student\n    Student *p;                // a pointer to a Student\n\n    p = &a;\n    (*p).score = 80;\n    p->score = 85;\n    addBonus(&a);\n    cout << a.score << endl;\n    return 0;\n}"
},
"11-5": {
"title": "Nodes and new",
"isNew": "Node *next; new borrows memory; delete gives it back",
"uses": "struct, pointers",
"goal": "Each cell of a linked list is called a \"node\": data holds the data, and next holds \"the address of the next node\". The type of next is Node*, so a struct can hold a pointer to its own kind of struct.\nnew Node borrows a piece of memory the size of a Node on the heap and gives back its address. This memory has no name, and you can only find it with a pointer, so you use p->data to reach it. When you are done, give it back with delete.\nAn array's size must be chosen at the start; with new, you borrow nodes one at a time, when you need them.",
"predict": "Right after new Node borrows it, what are data and next?",
"ask": "Delete p = nullptr; and add the line cout << p->data; at the end. What happens?",
"code": "#include <iostream>\nusing namespace std;\n\n"+NODE_EN+"\n\nint main() {\n    Node *p;  // a pointer to a node\n\n    p = new Node;\n    p->data = 5;\n    p->next = nullptr;  // nothing comes after it\n    cout << p->data << endl;\n    delete p;\n    p = nullptr;\n    return 0;\n}"
},
"11-6": {
"title": "Linking Nodes Together",
"isNew": "next points to the next node; nullptr means the end",
"uses": "struct, pointers, new",
"goal": "new Node{10, nullptr} borrows a node and, at the same time, puts in data = 10 and next = nullptr, in field order.\nhead->next = new Node{20, nullptr}; puts the second node's address into the first node's next, so the two nodes are linked; head->next->next is the second node's next. The last node's next is nullptr, which means \"this is the end\".\nNodes linked like this form a linked list. If you remember the first node's address (head), you can follow the arrows to find all of them. Look at the arrows in the heap on the right.",
"predict": "What is head->next->next->data?",
"ask": "What is head->next->next->next? What happens if you add one more ->data?",
"code": "#include <iostream>\nusing namespace std;\n\n"+NODE_EN+"\n\nint main() {\n    Node *head = new Node{10, nullptr};  // the first node of the list\n    head->next = new Node{20, nullptr};\n    head->next->next = new Node{30, nullptr};\n\n    cout << head->data << endl;\n    cout << head->next->data << endl;\n    cout << head->next->next->data << endl;\n    return 0;\n}"
},
"11-7": {
"title": "Going Through a Linked List",
"isNew": "p = p->next: move to the next node",
"uses": "while, pointers",
"goal": "When you do not know how long the list is, start a pointer p at head. p = p->next means \"follow the arrow to the next node\", and reaching nullptr means you have gone through all of it. This is the most important loop for linked lists.",
"predict": "How many rounds does the loop run? After the last round, what is p?",
"ask": "What happens if you delete p = p->next;? What if you change the condition to p->next != nullptr?",
"code": "#include <iostream>\nusing namespace std;\n\n"+NODE_EN+"\n\nint main() {\n    Node *head = new Node{10, nullptr};  // the first node of the list\n    head->next = new Node{20, nullptr};\n    head->next->next = new Node{30, nullptr};\n    Node *p;      // the pointer used to go through the list\n    int sum = 0;  // the total\n\n    p = head;\n    while (p != nullptr) {\n        cout << p->data << \" \";\n        sum = sum + p->data;\n        p = p->next;\n    }\n    cout << endl << sum << endl;\n    return 0;\n}"
},
"11-8": {
"title": "Insert at the Front",
"isNew": "nd->next = head; head = nd;",
"uses": "cin, for, new, pointers",
"goal": "Adding a node at the front of a list takes just two steps: first make the new node's next point to the old first node (head), then change head to the new node.\nThe order matters: if you change head first, nobody remembers the old list any more.",
"task": "Problem: Input n and then n integers. Insert each one at the front of the list as you read it, and at the end print the whole list from the start.",
"predict": "Is the printed order the same as the input order?",
"ask": "Swap the two lines nd->next = head; and head = nd;. What is printed? Why?",
"code": "#include <iostream>\nusing namespace std;\n\n"+NODE_EN+"\n\nint main() {\n    Node *head = nullptr;  // the list starts empty\n    Node *nd;              // the newly borrowed node\n    Node *p;               // the pointer used to go through the list\n    int n, x;              // how many numbers, the number read\n\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        nd = new Node;\n        nd->data = x;\n        nd->next = head;\n        head = nd;\n    }\n    for (p = head; p != nullptr; p = p->next) {\n        cout << p->data << \" \";\n    }\n    cout << endl;\n    return 0;\n}",
"tests": [
{"note": "Each one goes in at the front, so the order is reversed"},
{}
]
},
"11-9": {
"title": "Delete the First Node",
"isNew": "remember it first, then move head, then delete",
"uses": "new, delete, pointers",
"goal": "To delete the first node: first remember it with old, then move head forward to the next node, and finally delete old to give the memory back.\nIf you delete head directly, you can never reach head->next again.",
"predict": "After delete old, what does the pointer old still store? Can you still use it?",
"ask": "Change the three lines to delete head; head = head->next;. What happens?",
"code": "#include <iostream>\nusing namespace std;\n\n"+NODE_EN+"\n\nint main() {\n    Node *head = new Node{10, nullptr};  // the first node of the list\n    head->next = new Node{20, nullptr};\n    head->next->next = new Node{30, nullptr};\n    Node *old;  // remembers the node to delete for a moment\n\n    old = head;\n    head = head->next;\n    delete old;\n    for (Node *p = head; p != nullptr; p = p->next) {\n        cout << p->data << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"11-10": {
"title": "C++'s Built-in list",
"isNew": "#include <list>: push_front, push_back, pop_front, with no pointers to change yourself",
"uses": "linked lists (lessons 11-6 to 11-9), for (int x : l)",
"goal": "Before, you made a linked list yourself with struct and new, and inserting at the front or deleting the first node meant changing pointers yourself. C++ has already done this for you: after #include <list>, use list<int>. push_front inserts at the front and pop_front deletes the first node, and it takes care of all the pointers.\nA list cannot use l[i] to jump to an item (because it has to walk from the start, one by one). To see everything, use for (int x : l).",
"predict": "What numbers are in l at the end, in order?",
"ask": "Change the for loop to cout << l[1] << endl;. What happens? Why can a list not be used this way?",
"code": "#include <iostream>\n#include <list>\nusing namespace std;\n\nint main() {\n    list<int> l;  // C++'s built-in linked list\n    \n    l.push_back(2);   // add at the back\n    l.push_back(3);\n    l.push_front(1);  // insert at the front (you did this yourself in 11-8)\n    l.pop_front();    // delete the first one (you did this yourself in 11-9)\n    l.push_front(0);\n    for (int x : l) {\n        cout << x << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
}
});
