/* ---------- English: chapters 8-9 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{8:{title:"Functions"},9:{title:"Recursion"}});
Object.assign(LESSON_EN,{
"8-1": {
"title": "Your First Function",
"isNew": "define a function, call it, come back when it is done",
"goal": "A function is a piece of code packed up with a name. Once it is written, writing hello(); in main jumps over to run it, and when it is done, jumps back to where it was. The program still starts in main, and a function only runs when it is called.",
"predict": "hello is written above main. Does the program run hello first? How many times is Hello! printed?",
"ask": "To print Hello! three times, what do you change? Without a function, how many lines would you need?"
},
"8-2": {
"title": "Declaring a Function: Declare Before You Call",
"isNew": "function prototypes (declarations) and function definitions",
"goal": "C++ reads a program from top to bottom. Before you call a function, C++ must already know about it: its name, its parameters, and its return type. There are two ways: write the whole function above main; or first write a one-line \"function prototype\" above (a declaration ending with a semicolon), and write the real body (the definition) after main.",
"predict": "Does the program run main first, or square, which is written at the top?",
"ask": "Delete the function prototype on line 4 and run it again. What error do you get?",
"code": "#include <iostream>\nusing namespace std;\n\nint square(int n);  // function prototype (declaration): say first that this function exists\n\nint main() {\n    int x = 5;  // the number to square\n\n    cout << square(x) << endl;\n    return 0;\n}\n\nint square(int n) {  // function definition: the real body is written later\n    return n * n;\n}"
},
"8-3": {
"title": "Parameters and Return Values",
"isNew": "parameters pass values in; return brings the result back",
"goal": "A function can have parameters: values passed in when it is called. When the function is done, return brings the result back to the place that called it. int add(int a, int b) means: it needs two ints as parameters, and it brings back one int.",
"predict": "When add(x, y) is called, what are a and b?",
"ask": "After add ends, are a, b and sum still in memory?",
"code": "#include <iostream>\nusing namespace std;\n\nint add(int a, int b) {\n    int sum;  // the result of a + b\n\n    sum = a + b;\n    return sum;\n}\n\nint main() {\n    int x = 3, y = 4;  // the two numbers to add\n    int ans;           // stores the result that add brings back\n\n    ans = add(x, y);\n    cout << ans << endl;\n    cout << add(10, 20) << endl;\n    return 0;\n}"
},
"8-4": {
"title": "Return Values: return Ends the Function",
"isNew": "return types, bool functions, return ends the function right away",
"goal": "The type written before a function's name is its return type: an int function brings back an integer, a bool function brings back true or false (you can put it straight into an if), and a function with nothing to bring back uses void. When return runs, the function ends right away, and the code after it does not run.",
"predict": "Which return does myMax(7, 12) reach?",
"ask": "Change myMax(x, y) to myMax(y, x). Which return runs this time? Does the line return b; after it still run?",
"code": "#include <iostream>\nusing namespace std;\n\nbool isEven(int n) {\n    if (n % 2 == 0) {\n        return true;\n    }\n    return false;\n}\n\nint myMax(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    return b;\n}\n\nint main() {\n    int x = 7, y = 12;  // the two numbers to compare\n\n    if (isEven(y)) {\n        cout << y << \" is even\" << endl;\n    }\n    cout << \"The bigger one is \" << myMax(x, y) << endl;\n    return 0;\n}"
},
"8-5": {
"title": "Default Parameter Values",
"isNew": "int exp = 2: if this parameter is not given, use the default",
"goal": "A parameter can have a default value. int power(int base, int exp = 2) means: if exp is not given when you call it, use 2.\nRule: parameters with default values must come \"after\" the others (on the right). They cannot come first.\nWhy: the values you pass in are matched to the parameters from the left, one by one. In power(5), the 5 goes to base first, and only exp, which was not given, uses its default. If you wrote int power(int base = 2, int exp), calling power(5) would give the 5 to base first, and exp would have no value. So C++ does not allow it.\n✓ OK: int f(int a, int b = 1, int c = 2)\n✗ Not OK: int f(int a = 1, int b)",
"predict": "What do power(5) and power(2, 10) compute?",
"ask": "Can you write int power(int base = 2, int exp)? Press \"Edit\" and try it.",
"code": "#include <iostream>\nusing namespace std;\n\nint power(int base, int exp = 2) {\n    int result = 1;  // the product, starts at 1\n    int i;           // how many times we have multiplied\n\n    for (i = 0; i < exp; i++) {\n        result = result * base;\n    }\n    return result;\n}\n\nint main() {\n    cout << power(5) << endl;      // exp not given, so the default 2 is used\n    cout << power(2, 10) << endl;  // exp is given, so 10 is used\n    return 0;\n}"
},
"8-6": {
"title": "The Call Stack",
"isNew": "a function calls a function, and memory stacks up level by level",
"goal": "A function can call other functions too. Each call adds one more level of memory, like stacking plates. This is called the \"call stack\": main is at the bottom, and the function running now is at the top. When a function ends, its level is freed.",
"predict": "While it runs, what is the largest number of levels in memory at the same time?",
"ask": "How many times is square called? Is n the same each time?",
"code": "#include <iostream>\nusing namespace std;\n\nint square(int n) {\n    return n * n;\n}\n\nint sumSquare(int a, int b) {\n    int s;  // a squared plus b squared\n\n    s = square(a) + square(b);\n    return s;\n}\n\nint main() {\n    int ans;  // the result\n\n    ans = sumSquare(3, 4);\n    cout << ans << endl;\n    return 0;\n}"
},
"8-7": {
"title": "Global and Local Variables",
"isNew": "every function can use a global variable; a local variable lives only in its own function",
"goal": "A variable written outside all functions is a \"global variable\": every function can see it and change it, and it is freed only when the whole program ends.\nA variable written inside a function (parameters included) is a \"local variable\": only that function can use it, and it is freed when the function ends. Local variables in different functions are different cells, even if they have the same name.\nGlobal variables are handy, but since every function can change them, in a big program it is hard to know who changed them. So if you can pass something with parameters and return values, do not use a global variable.",
"predict": "Are main's x and add's x the same cell? What is total at the end?",
"ask": "Add the line cout << temp << endl; to main. What happens? Why?",
"code": "#include <iostream>\nusing namespace std;\n\nint total = 0;  // global variable: written outside all functions, every function can use it\n\nvoid add(int x) {\n    int temp;  // local variable: only add can use it\n\n    temp = x * 2;\n    total = total + temp;\n}\n\nint main() {\n    int x = 5;  // main's local variable, a different cell from add's parameter x\n\n    add(x);\n    add(3);\n    cout << total << endl;\n    return 0;\n}"
},
"8-8": {
"title": "Passing an Array to a Function",
"isNew": "an array is not copied; the function changes the original array",
"goal": "When you pass an array to a function, it is NOT copied. The function gets the very same piece of memory. So the function can read the array, and it can also change it directly. The size of the array must be passed in as another parameter. Why does it work this way? Chapter 10, \"Pointers\", explains it: what is passed in is really the array's address.",
"predict": "After doubleAll ends, what is in nums? What does the second total print?",
"ask": "If an array were \"copied\" like a normal variable, what would the second total print?",
"code": "#include <iostream>\nusing namespace std;\n\nint total(int a[], int n) {\n    int i;      // which cell\n    int s = 0;  // the total, starts at 0\n\n    for (i = 0; i < n; i++) {\n        s = s + a[i];\n    }\n    return s;\n}\n\nvoid doubleAll(int a[], int n) {\n    int i;  // which cell\n\n    for (i = 0; i < n; i++) {\n        a[i] = a[i] * 2;\n    }\n}\n\nint main() {\n    int nums[4] = {1, 2, 3, 4};  // a group of numbers\n\n    cout << total(nums, 4) << endl;\n    doubleAll(nums, 4);\n    cout << total(nums, 4) << endl;\n    return 0;\n}"
},
"9-1": {
"title": "What Is Recursion?",
"isNew": "a function calls itself; the base case",
"goal": "Recursion means \"a function calls itself\". A recursive function must have two parts:\n1. The base case: when to stop (here, when n is 0).\n2. Make the problem smaller and call itself again (here, countDown(n - 1)).\nEach call adds one more level of countDown in memory, and every level has its own n.",
"predict": "What is printed? What is the largest number of countDown levels in memory at the same time?",
"ask": "Is n the same on every level? Are they the same cell?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid countDown(int n) {\n    if (n == 0) {\n        cout << \"Liftoff!\" << endl;\n        return;\n    }\n    cout << n << endl;\n    countDown(n - 1);\n}\n\nint main() {\n    countDown(3);\n    return 0;\n}"
},
"9-2": {
"title": "The Call Stack Grows, Then Shrinks",
"isNew": "recursion first calls all the way down, then brings the answers back level by level",
"goal": "Factorial: 4! = 4 × 3 × 2 × 1. Think of it another way: fact(4) = 4 × fact(3), and fact(3) = 3 × fact(2)... all the way to fact(1) = 1.\nWhen it runs, the call stack first grows tall (fact(4) → fact(3) → fact(2) → fact(1)). Only at the base case does it start to return, and then it shrinks level by level: each level gets the answer from the level below, multiplies it by its own n, and hands it up.",
"predict": "What is the largest number of fact levels in memory at the same time? Which level gets its answer first?",
"ask": "Who must finish before fact(4) can get its own answer?",
"code": "#include <iostream>\nusing namespace std;\n\nint fact(int n) {\n    if (n <= 1) {\n        return 1;  // base case\n    }\n    return n * fact(n - 1);  // make the problem smaller\n}\n\nint main() {\n    int ans;  // the result of fact(4)\n\n    ans = fact(4);\n    cout << ans << endl;\n    return 0;\n}"
},
"9-3": {
"title": "Doing Work on the Way Back",
"isNew": "code before the recursive call runs on the way down; code after it runs on the way back",
"goal": "The line with the recursive call is like a dividing line: code written before it runs \"on the way down\"; code written after it waits until the level below has completely finished, and runs \"on the way back\". So the order on the way back is the reverse of the order on the way down.",
"predict": "Are the \"back\" lines printed in the order 1, 2, 3 or 3, 2, 1?",
"ask": "If you keep only the \"back\" line, what does show(3) print? What could this be used for?",
"code": "#include <iostream>\nusing namespace std;\n\nvoid show(int n) {\n    if (n == 0) {\n        return;\n    }\n    cout << \"down \" << n << endl;\n    show(n - 1);\n    cout << \"back \" << n << endl;\n}\n\nint main() {\n    show(3);\n    return 0;\n}"
},
"9-4": {
"title": "Forgetting the Base Case",
"isNew": "with no base case, the call stack keeps growing until it crashes",
"goal": "This program leaves out the base case on purpose. fact keeps calling itself: fact(3) → fact(2) → fact(1) → fact(0) → fact(-1)... and never stops. Every level takes up memory, so real C++ runs out of call stack and crashes. This is called a stack overflow. This website stops it for you at 60 levels.",
"predict": "Will this program print 6?",
"ask": "Put the base case back (see 9-2). If the condition were if (n == 1), what would happen when you call fact(0)?",
"code": "#include <iostream>\nusing namespace std;\n\nint fact(int n) {\n    return n * fact(n - 1);  // the base case is missing!\n}\n\nint main() {\n    cout << fact(3) << endl;\n    return 0;\n}"
},
"9-5": {
"title": "Recursion Trees and Repeated Work",
"isNew": "Fibonacci: the same value is computed many times",
"goal": "The Fibonacci sequence: fib(0) = 0, fib(1) = 1, and after that each term is the sum of the two before it: fib(n) = fib(n - 1) + fib(n - 2).\nWriting it with recursion is direct, but each level splits into two calls and spreads out like a tree, so the same fib(2) and fib(1) are computed again and again. The global variable calls counts how many times fib is called in total.",
"predict": "How many times is fib called to compute fib(5)? How many times is fib(2) computed?",
"ask": "Change fib(5) to fib(10). What does calls become? Why does the number of calls grow so fast?",
"code": "#include <iostream>\nusing namespace std;\n\nint calls = 0;  // how many times fib is called in total\n\nint fib(int n) {\n    calls = calls + 1;\n    if (n <= 1) {\n        return n;\n    }\n    return fib(n - 1) + fib(n - 2);\n}\n\nint main() {\n    cout << fib(5) << endl;\n    cout << \"fib was called \" << calls << \" times\" << endl;\n    return 0;\n}"
}
});
