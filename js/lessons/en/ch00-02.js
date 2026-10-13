/* ---------- English: chapters 0-2 (Basic Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{0:{title:"How a Program Runs"},1:{title:"Input and Output"},2:{title:"Variables and Types"}});
Object.assign(LESSON_EN,{
"0-1": {
"title": "Your First Program",
"isNew": "main, cout, running line by line from top to bottom",
"goal": "A program starts at the first line of main and runs one line at a time, from top to bottom. Words inside quotes are printed exactly as they are. Things without quotes are calculated first.",
"predict": "What will each of the three cout lines print? Look carefully at the difference between line 2 and line 3.",
"ask": "What happens to the output if you remove every endl? Press \"Edit\" and try it."
},
"0-2": {
"title": "How the OJ Judges",
"isNew": "standard input and output; compare every character",
"goal": "An OJ (Online Judge) is not a person. It compares your output with the correct answer, character by character. If the problem does not ask you to print something, do not print even one extra character.",
"task": "Problem: input two integers a and b, and output a + b.",
"ask": "Press \"Edit\" and change the program until you get AC (Accepted).",
"tips": {
"\"Enter": "On your own computer, this line is friendly. But the OJ treats it as part of your answer."
},
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cout << \"Enter two numbers: \";\n    cin >> a >> b;\n    cout << \"The answer is \" << a + b << endl;\n    return 0;\n}"
},
"P0": {
"title": "Practice Output",
"isNew": "cout prints text on the screen",
"goal": "Try to print Hello!",
"ask": "Change Hello! to your name and run it again."
},
"P1": {
"title": "Arithmetic",
"isNew": "multiply and divide first, then add and subtract",
"goal": "Try to print the result of 45/9+7*3.",
"predict": "Which part does the computer calculate first?",
"ask": "What will it print if you write cout << \"45/9+7*3\" << endl; ?",
"tests": [
{
"note": "45/9 = 5, 7*3 = 21, 5 + 21 = 26"
}
]
},
"1-1": {
"title": "Spaces and New Lines in Output",
"isNew": "cout does not add spaces or new lines for you",
"goal": "cout prints only what you tell it to print. You must write every space between numbers and every new line at the end yourself.",
"task": "Problem: print 3 and 4 (with one space between them). On the next line, print the result of 3 + 4.",
"ask": "Change the program until you get AC. Both endl and \"\\n\" start a new line. Try both."
},
"1-2": {
"title": "Variables: Space to Store Data",
"isNew": "int a = 3; makes a space called a and puts 3 in it",
"goal": "A program often needs to remember data and use it later. A variable is a space in memory with a name. It is used to store data.\nint a = 3; means: make a space called a, and put 3 in it. int means this space stores an integer (a whole number). After that, writing a means taking out the data inside. When you put in new data, the old data is replaced.\nThe Memory panel on the right shows these spaces. Chapter 2 explains variables in more detail.",
"predict": "Does the second line print the words a + 10, or the calculated number? After a = 50;, is the old 3 still there?",
"ask": "Change cout << a << endl; to cout << \"a\" << endl;. What is different?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 3;  // make a space called a and put 3 in it\n    \n    cout << a << endl;\n    cout << a + 10 << endl;\n    a = 50;\n    cout << a << endl;\n    return 0;\n}"
},
"1-3": {
"title": "cin and the Input Buffer",
"isNew": "the input buffer; spaces and new lines only separate data",
"goal": "cin >> x reads one piece of data from the keyboard and puts it in the variable x. The variable \"catches\" the input.\nWhat you type waits in the input buffer first. Each cin >> skips spaces and new lines, then takes the next piece of data.",
"predict": "There are many spaces between 12 and 30 in the input. Does that change the result?",
"ask": "Change the input to 12, a new line, then 30 (on two lines). Is the result the same?"
},
"1-4": {
"title": "Reading a char with cin",
"isNew": "a char takes only one character",
"goal": "A char is a space for one character, like 'A', 'b', or '7'.\nWhen cin reads an int, it keeps reading until the next character is not a digit. When it reads a char, it takes only one character. The same input can give very different results with different types.",
"predict": "With the input A12 b, what will c, n, and d get?",
"ask": "What if the input is A 1 2 b (with a space between every character)?"
},
"1-5": {
"title": "When Reading Fails",
"isNew": "after cin fails, every cin stops working",
"goal": "If cin tries to read an integer but finds a letter, it fails. After that, no cin reads anything.\nA variable that never gets any data holds leftover numbers from memory. This is called a garbage value (lesson 2-3 explains more).",
"predict": "With the input 7 abc 5, what will a, b, and c be?",
"ask": "Why is c not 5? How can you change the declaration so it never prints a garbage value?"
},
"1-6": {
"title": "Decimal Places: fixed and setprecision",
"isNew": "cout << fixed << setprecision(2): always print 2 digits after the decimal point",
"uses": "1-1",
"goal": "OJ problems often say \"print to 2 decimal places.\" Usually cout prints only 6 significant digits and drops the 0s at the end. If that is different from what the problem wants, you get WA.\nTo always print a fixed number of decimal places, write cout << fixed << setprecision(2). fixed means \"a fixed number of digits after the decimal point,\" and setprecision(2) means 2 digits. It rounds, and it adds 0s if needed. You need #include <iomanip>.\nNote: you only write this once. It stays on, and every decimal printed later uses this format.",
"predict": "What do the first and second lines print? b is 7. Will the third line print 7?",
"ask": "Remove fixed from the second line and keep only setprecision(2). What does it print? (Hint: without fixed, 2 means significant digits.)",
"code": "#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    double a = 10.0 / 3;  // 3.3333... it goes on forever\n    double b = 7;         // a decimal that is a whole number\n    \n    cout << a << endl;\n    cout << fixed << setprecision(2) << a << endl;\n    cout << b << endl;\n    cout << setprecision(4) << a << endl;\n    return 0;\n}"
},
"P2": {
"title": "Input and Variables",
"isNew": "cin puts the input into a variable",
"goal": "Try saying hello to different people!",
"predict": "What is in the variable name at the start? What about after reading the input?",
"ask": "If the input is changed to your name, do you need to change the program?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    string name;  // the name from the input\n    \n    cin >> name;\n    cout << \"Hello \" << name << endl;\n    return 0;\n}"
},
"2-1": {
"title": "Variables and Assignment",
"isNew": "a variable is a box; = puts a value in it",
"goal": "Lesson 1-2 said a variable is a box in memory with a name. This lesson looks closely at =. It is not the \"equals\" in math. It means \"first compute the right side, then put the result in the left side.\" So a = a * 2 is not a wrong equation. It means \"take the value of a now, multiply it by 2, and put it back in a.\"",
"predict": "What are a and b at the end?",
"ask": "Line 7 says b = a + 3, and line 8 changes a. Why does b not change too?"
},
"2-2": {
"title": "Swapping Two Variables",
"isNew": "assignment copies a value; a temporary variable",
"goal": "Assignment copies a value, and the old value is replaced. So to swap two variables, you need one more box to hold a value for a moment.",
"ask": "What happens if you do not use t and just write a = b; b = a;? Press \"Edit\" and check."
},
"2-3": {
"title": "Forgetting the Starting Value",
"isNew": "garbage value",
"goal": "If you declare a variable without a value, the box holds a garbage value left from before. The program still uses it in calculations, and it may not show any error.",
"ask": "How should you change line 5 so that the output is 5?"
},
"2-4": {
"title": "Integer Division and %",
"isNew": "integer division, remainder, type casting",
"goal": "When you divide an integer by an integer, the result is still an integer. The decimal part is simply dropped. If you want decimals, at least one side must be a double.",
"predict": "c and d are both double. Why are the results different?",
"ask": "What is double d = a / 2.0;? What about -7 / 2 and -7 % 2?"
},
"2-5": {
"title": "Overflow",
"isNew": "the range of int; long long",
"goal": "An int has only 4 bytes. The biggest value it can store is 2147483647. If it goes over, it \"wraps around\" and becomes negative. When the answer may be very big, use long long.",
"ask": "An OJ problem says n ≤ 100000, and you need n × n. Which type should you use?"
},
"2-6": {
"title": "A char Is Really a Number",
"isNew": "ASCII; doing math with characters",
"goal": "A char actually stores a number (its ASCII code). So you can add to or subtract from characters. '7' - '0' turns the digit character '7' into the real number 7.",
"ask": "How can you change a lowercase 'g' into an uppercase letter?"
},
"2-7": {
"title": "Variable Scope",
"isNew": "braces decide how long a variable lives",
"goal": "A variable declared inside braces { } is freed when the program leaves the braces.",
"ask": "What happens if you change the last line to cout << y;?"
},
"2-8": {
"title": "Floating-Point Error: Don't Use == with Decimals",
"isNew": "0.1 + 0.2 is not 0.3; check if the difference is small enough",
"uses": "2-1, setprecision in 1-6",
"goal": "A computer stores decimals in binary. Numbers like 0.1 and 0.2 cannot be stored exactly, only as a very close value. So 0.1 + 0.2 is really 0.30000000000000004.\nUsually you cannot see this when you print (cout prints only 6 digits), but == says they are not equal. To compare two decimals, check if the difference is small enough: fabs(a - b) < 1e-9 (fabs gives the absolute value, and 1e-9 is 0.000000001). You need #include <cmath>.\nBe careful when you turn a decimal into an integer, too: 0.29 × 100 is really 28.999..., and an int simply drops the decimal part, so it becomes 28.",
"predict": "Will a == b print 1 or 0? Is c 29?",
"ask": "How can you make c become 29? (Hint: add a very small number first, or use round.)",
"code": "#include <iostream>\n#include <iomanip>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    double a = 0.1 + 0.2;  // exactly 0.3 in math\n    double b = 0.3;        // the real 0.3\n    int c;                 // 0.29 × 100 turned into an integer\n    \n    cout << a << endl;\n    cout << setprecision(17) << a << endl;\n    cout << (a == b) << endl;\n    cout << (fabs(a - b) < 1e-9) << endl;\n    c = 0.29 * 100;\n    cout << c << endl;\n    return 0;\n}"
},
"2-9": {
"title": "When the Answer Is Too Big, Use long long",
"isNew": "int only goes up to about 2.1 billion; 1LL * a * b becomes long long first",
"uses": "overflow in 2-5",
"goal": "The biggest int is about 2.1 billion (2 × 10⁹). A long long goes up to about 9 × 10¹⁸. If the answer may be over 2.1 billion (for example, when you add many numbers or multiply two big numbers), use long long.\nA common trap: long long c = a * b;. Even though c is a long long, a and b are both int, so the right side computes a * b as an int first. It already overflows there, and putting it in c cannot fix it.\nWrite 1LL * a * b instead. 1LL is 1 as a long long, so the multiplication becomes long long first. Then multiplying by b does not overflow.",
"predict": "100,000 × 100,000 is 10,000,000,000. What will c and d print?",
"ask": "If you declare a and b as long long, will c still overflow? If a problem says \"n ≤ 10⁵; output the sum of all the numbers; each number ≤ 10⁹,\" what type should the sum be?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 100000, b = 100000;  // 100,000 each\n    long long c = a * b;         // int × int: computed as int first, already overflows\n    long long d = 1LL * a * b;   // becomes long long first, then multiplies\n    \n    cout << c << endl;\n    cout << d << endl;\n    return 0;\n}"
},
"P3": {
"title": "Clothing Store",
"isNew": "one input, one output, arithmetic",
"goal": "A clothing store sells clothes at 1.5 times the cost. Help the store: read the cost, then compute and print the price.",
"ask": "Why is price a double, not an int? Try the input 99.",
"tests": [
{
"note": "The cost is 100. The price is 1.5 times the cost: 150."
}
],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int cost;      // the cost (input)\n    double price;  // price = cost × 1.5, may have decimals\n    \n    cin >> cost;\n    price = cost * 1.5;\n    cout << price << endl;\n    return 0;\n}"
},
"P4": {
"title": "Clothing Store 2",
"isNew": "one input, two outputs",
"goal": "A clothing store sells clothes at 1.5 times the cost. This week is the store's anniversary sale, so everything is 10% off. Print the normal price first, then compute and print the sale price.",
"predict": "After price = price * 0.9 runs, what happens to the 150 that was in price?",
"ask": "Besides price = price * 0.9, how else can you write it?",
"tests": [
{
"note": "The cost is 100. The price is 1.5 times the cost, then 10% off: 135."
}
],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int cost;      // the cost (input)\n    double price;  // the price; it changes after the discount\n    \n    cin >> cost;\n    price = cost * 1.5;\n    cout << price << endl;\n    price = price * 0.9;\n    cout << price << endl;\n    return 0;\n}"
},
"P5": {
"title": "Budget Tracker",
"isNew": "three inputs, one output",
"goal": "Ming has 300 dollars for food each day. Write a budget program: input the cost of his three meals, then compute how much money is left.",
"ask": "What does it print if the three meals cost more than 300 dollars?",
"tests": [
{
"note": "Ming has 300 dollars. After paying for three meals, he has 95 dollars left."
}
],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int money = 300;  // money for food today, starts at 300\n    int a, b, c;      // cost of the three meals (input)\n    \n    cin >> a >> b >> c;\n    money = money - a - b - c;\n    cout << money << endl;\n    return 0;\n}"
},
"P6": {
"title": "Addition",
"isNew": "two inputs; use double for decimals",
"goal": "Input two numbers. The program adds them and prints the answer.",
"ask": "If you change double to int, will all three tests still get AC?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    double a, b;  // two numbers (input), may have decimals\n    \n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}"
},
"P7": {
"title": "BMI",
"isNew": "two inputs; round down",
"goal": "Input height (cm) and weight (kg), then compute and print the BMI. BMI = weight / (height × height), and the height must be changed to meters first. Round the result down (drop the decimal part).",
"predict": "Will the BMI be a whole number?",
"ask": "(int) simply drops the decimal part. How would you change it if the problem asks you to round to the nearest whole number?",
"tests": [
{
"note": "180/100 = 1.8. 90/1.8/1.8 = 27"
},
{
"note": "177/100 = 1.77. 64/1.77/1.77 = 20"
}
],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    double h, w;  // h: height (input in cm, then changed to m); w: weight (input)\n    double bmi;   // the BMI result\n    \n    cin >> h >> w;\n    h = h / 100;\n    bmi = w / (h * h);\n    cout << (int)bmi << endl;\n    return 0;\n}"
}
});
