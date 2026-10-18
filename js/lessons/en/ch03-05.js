/* ---------- English: chapters 3-5 (Basic Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{3:{title:"Conditions"},4:{title:"Loops"},5:{title:"One-Dimensional Arrays"}});
Object.assign(LESSON_EN,{
"3-1": {
"title": "Two Paths: if / else",
"isNew": "if, else, comparison",
"goal": "if checks a condition first. If it is true, the program takes one path; if not, it takes the other. Only one of the two paths runs.",
"ask": "Change the input to 59, then to 60, and try both.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int score;\n    cin >> score;\n    if (score >= 60) {\n        cout << \"Pass\" << endl;\n    } else {\n        cout << \"Fail\" << endl;\n    }\n    cout << \"End\" << endl;\n    return 0;\n}"
},
"3-2": {
"title": "= Is Not ==",
"isNew": "assign vs. compare",
"goal": "= puts a value in; == is the one that compares. If you use the wrong one in an if, there is no error, but the result is completely wrong, and the variable gets changed too.",
"predict": "a is 5. Which sentence will be printed? What is a at the end?",
"ask": "Change it to a == 0 and run it again. Compare how the memory changes.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5;\n    if (a = 0) {\n        cout << \"a is 0\" << endl;\n    } else {\n        cout << \"a is not 0\" << endl;\n    }\n    cout << a << endl;\n    return 0;\n}"
},
"3-3": {
"title": "Many ifs vs. else if",
"isNew": "only one choice is taken",
"goal": "Several separate ifs are all checked, one by one. With else if, as soon as one condition before it is true, all the rest are skipped.",
"ask": "If you reverse the order of the else ifs (check s >= 70 first), what is printed for the input 95?"
},
"3-4": {
"title": "Short-Circuit &&",
"isNew": "&&, ||, short-circuit evaluation",
"goal": "If the left side of && is already false, the right side is not run. When you write a condition, put the \"safety\" check first. This can stop the program from crashing.",
"ask": "The two if conditions mean the same thing. Why is one safe and the other one crashes?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 0;\n    if (x != 0 && 10 / x > 1) {\n        cout << \"big\" << endl;\n    } else {\n        cout << \"x is 0 or not big enough\" << endl;\n    }\n    if (10 / x > 1 && x != 0) {\n        cout << \"big\" << endl;\n    }\n    return 0;\n}"
},
"P8": {
"title": "Online Shop",
"isNew": "one condition: if",
"goal": "This month, an online shop gives free shipping (saving the 60-dollar shipping fee) when you spend 499 dollars or more. Given how much a customer spends, compute the total cost (including shipping).",
"ask": "If the input is exactly 499 dollars, does the customer pay shipping? Does the program get it right?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int money;  // amount spent (input)\n    int total;  // total cost (including shipping)\n    \n    cin >> money;\n    total = money;\n    if (money < 499) {\n        total = total + 60;\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "The customer spends 120 dollars, which is under 499, so the 60-dollar shipping fee is added: 180 dollars in total."},
{"note": "The customer spends 500 dollars, which is 499 or more, so shipping is free: 500 dollars in total."}
]
},
"P9": {
"title": "Group Train Tickets",
"isNew": "two choices: if / else",
"goal": "On the train, a group of 10 or more people can buy group tickets for 7 dollars each. Otherwise, a normal ticket is 13 dollars each. Given the number of people, compute the total fare.",
"ask": "If you change n >= 10 to n > 10, which number of people gets the wrong answer?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;    // number of people (input)\n    int fee;  // total fare\n    \n    cin >> n;\n    if (n >= 10) {\n        fee = n * 7;\n    } else {\n        fee = n * 13;\n    }\n    cout << fee << endl;\n    return 0;\n}",
"tests": [
{"note": "5 people is fewer than 10, so they pay the normal price: 5*13 = 65 dollars."},
{"note": "11 people is at least 10, so they get group tickets: 11*7 = 77 dollars."}
]
},
"P10": {
"title": "Bike Rental",
"isNew": "two choices: if / else",
"goal": "A bike rental shop has two prices: up to 4 hours (including 4 hours), it costs 10 dollars per hour; more than 4 hours, it costs 15 dollars per hour. Given the rental time, compute the total cost.",
"ask": "Change the input to exactly 4. What is fee? Which price does 4 hours use?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int h;    // hours rented (input)\n    int fee;  // total cost\n    \n    cin >> h;\n    if (h <= 4) {\n        fee = h * 10;\n    } else {\n        fee = h * 15;\n    }\n    cout << fee << endl;\n    return 0;\n}",
"tests": [
{"note": "3 hours is within 4 hours, so it costs 10 dollars per hour: 3*10 = 30 dollars."},
{"note": "5 hours is more than 4 hours, so it costs 15 dollars per hour: 5*15 = 75 dollars."}
]
},
"P11": {
"title": "Virtual Pet",
"isNew": "many choices: else if",
"goal": "In a game, a pet answers in different ways depending on its mood. Given the current mood, print the pet's answer.",
"ask": "When the mood is 95, how many conditions does the program check? What about when the mood is 30?",
"table": [["Mood","Answer"],["80~100","Super happy"],["60~79","Happy"],["40~59","OK"],["0~39","......"]],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int mood;  // mood (input)\n    \n    cin >> mood;\n    if (mood >= 80) {\n        cout << \"Super happy\" << endl;\n    } else if (mood >= 60) {\n        cout << \"Happy\" << endl;\n    } else if (mood >= 40) {\n        cout << \"OK\" << endl;\n    } else {\n        cout << \"......\" << endl;\n    }\n    return 0;\n}",
"tests": [
{"note": "95 is between 80 and 100: Super happy.", "output": "Super happy"},
{"note": "75 is between 60 and 79: Happy.", "output": "Happy"},
{"note": "30 is between 0 and 39: the pet ignores you."}
]
},
"P12": {
"title": "Rage Meter",
"isNew": "two inputs, many choices",
"goal": "In an adventure game, attacking builds up rage, and rage makes damage bigger. With 30~49 rage, attack power is × 1.2; with 50~79, it is × 1.5; with 80 or more, it is doubled. Given the starting attack power and the current rage, print the damage.",
"ask": "When rage is under 30, what is rate? Why do we set it to 1 at the start?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int atk, rage;    // atk: starting attack power (input); rage: rage (input)\n    double rate = 1;  // attack multiplier, starts at 1\n    \n    cin >> atk >> rage;\n    if (rage >= 80) {\n        rate = 2;\n    } else if (rage >= 50) {\n        rate = 1.5;\n    } else if (rage >= 30) {\n        rate = 1.2;\n    }\n    cout << atk * rate << endl;\n    return 0;\n}",
"tests": [
{"note": "Rage 30 makes attack × 1.2. Damage = 80*1.2 = 96"},
{"note": "Rage 100 makes attack × 2. Damage = 100*2 = 200"}
]
},
"P13": {
"title": "Rank Rewards",
"isNew": "one input, two outputs, many choices",
"goal": "In a game, players get a rank based on their points, and gold coins based on their points and rank. Given a player's points, print the rank and the number of coins.",
"ask": "If the check for score >= 5000 came before score >= 10000, what would 12000 points get?",
"table": [["Rank","Points","Coin multiplier"],["Gold","10000","× 1.8"],["Silver","5000","× 1.4"],["Bronze","0","× 1"]],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int score;    // player's points (input)\n    double coin;  // coins earned\n    \n    cin >> score;\n    if (score >= 10000) {\n        coin = score * 1.8;\n        cout << \"Gold \" << coin << endl;\n    } else if (score >= 5000) {\n        coin = score * 1.4;\n        cout << \"Silver \" << coin << endl;\n    } else {\n        coin = score;\n        cout << \"Bronze \" << coin << endl;\n    }\n    return 0;\n}",
"tests": [
{"note": "1500 points is Bronze, and the player gets 1500*1 = 1500 coins.", "output": "Bronze 1500"},
{"note": "6000 points is Silver, and the player gets 6000*1.4 = 8400 coins.", "output": "Silver 8400"},
{"note": "12000 points is Gold, and the player gets 12000*1.8 = 21600 coins.", "output": "Gold 21600"}
]
},
"4-1": {
"title": "The while Loop",
"isNew": "while, when the condition is checked",
"goal": "while checks the condition before every round. When the condition is false, the loop ends, and the variable stays at the value that made the condition false.",
"predict": "Is i printed as 3 or 4 on the last line?",
"ask": "Open the \"Trace table\" and watch how i changes at each step.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int i = 1;\n    while (i <= 3) {\n        cout << i << endl;\n        i++;\n    }\n    cout << \"Loop ended, i = \" << i << endl;\n    return 0;\n}"
},
"4-2": {
"title": "The Order of a for Loop",
"isNew": "start → check → body → update",
"goal": "The three parts inside for ( ) are not each done once from left to right. The start part runs only once, and then \"check → body → update\" repeats again and again.",
"ask": "Does i++ run before or after the printing?",
"tips": {"for (": "Look at the small marked part of the code to see which part of the for loop is running now."}
},
"4-3": {
"title": "Read n Numbers and Add Them",
"isNew": "putting it together: cin + loop + adding up",
"uses": "cin, for, +=",
"goal": "Read n first, then use a loop to read n times. Add each number to sum as you read it. sum must start at 0.",
"ask": "What happens if you change int sum = 0; to int sum;?"
},
"4-4": {
"title": "Many Test Cases",
"isNew": "read until EOF; reset for each case",
"uses": "while (cin >> n), for, adding up",
"goal": "An OJ often gives many test cases at once. Use while (cin >> n) to keep reading until there is no more data. Before each case starts, reset the variables that need to go back to 0.",
"task": "Problem: In each test case, the first number is n, followed by n integers. Print their sum. Keep reading until the end of the file.",
"ask": "The first case is right, but the second is wrong. Which line is in the wrong place? Fix it to get AC."
},
"4-5": {
"title": "Off-by-One Errors",
"isNew": "< vs. <=, how many times a loop runs",
"goal": "Where a loop starts, where it ends, and whether you use < or <=: a tiny difference means one round more or one round less.",
"task": "Problem: Print 1 to 5, one number per line.",
"ask": "There are two ways to fix it and get AC. How many can you find?"
},
"4-6": {
"title": "Nested Loops",
"isNew": "a loop inside a loop",
"uses": "cin, for",
"goal": "Each time the outer loop runs one round, the inner loop runs a whole circle from the start. How many times the inner loop runs can depend on the outer loop's variable.",
"ask": "To print an upside-down triangle (n stars on the first line), what do you need to change?"
},
"4-7": {
"title": "break and continue",
"isNew": "leave the loop; skip this round",
"goal": "continue skips the rest of this round; break ends the whole loop right away.",
"predict": "Which numbers will be printed?",
"ask": "If you swap the order of the two ifs, does the result change?"
},
"P14": {
"title": "Repeat It",
"isNew": "counting loop: for",
"goal": "Use a loop to print Hello Sinyi! five times.",
"predict": "What values does i go through? What is i when the loop ends?",
"ask": "To print it 100 times, what do you change?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int i;  // the loop counter: which time this is\n    \n    for (i = 1; i <= 5; i++) {\n        cout << \"Hello Sinyi!\" << endl;\n    }\n    return 0;\n}"
},
"P16": {
"title": "Sleep Tracker",
"isNew": "read in a loop, add up, round",
"goal": "Make a sleep tracker. Given how many hours you slept on each day of a week, compute the average hours of sleep per day (rounded to the nearest whole number).",
"ask": "Why write sum / 7.0 instead of sum / 7? Try changing it. Does the result change?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int i, h;     // i: loop counter, which day; h: hours of sleep that day (input)\n    int sum = 0;  // total hours of sleep, starts at 0\n    double avg;   // average hours of sleep\n    \n    for (i = 1; i <= 7; i++) {\n        cin >> h;\n        sum = sum + h;\n    }\n    avg = sum / 7.0;\n    cout << round(avg) << endl;\n    return 0;\n}",
"tests": [
{"note": "This week's sleep was 8, 6, 10, 6, 7, 7, 8 hours: 52 hours in total, about 7.43 hours on average."},
{"note": "This week's sleep was 6, 6, 6, 6, 6, 6, 6 hours: 42 hours in total, 6 hours on average."}
]
},
"P17": {
"title": "Average Score",
"isNew": "read in a loop, add up, average",
"goal": "Make a grade book: input the scores of five subjects and compute the average.",
"ask": "For the second test case, what would sum / 5 print? Would it get AC?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int i, score;  // i: loop counter, which subject; score: this subject's score (input)\n    int sum = 0;   // total score, starts at 0\n    \n    for (i = 1; i <= 5; i++) {\n        cin >> score;\n        sum = sum + score;\n    }\n    cout << sum / 5.0 << endl;\n    return 0;\n}",
"tests": [
{"note": "The five scores are 90, 95, 92, 98, 90. The total is 465, so the average is 465/5 = 93."},
{"note": "The five scores are 60, 70, 67, 75, 82. The total is 354, so the average is 354/5 = 70.8."}
]
},
"r060": {
"title": "Postage",
"isNew": "read n items in a loop, sort them with if, add up",
"goal": "When you mail packages, the post office first counts how many packages there are, then computes the total postage from each package's weight. Write a program to compute the postage.\nInput: The first line is an integer n, the number of packages. The second line has the weights of the n packages.\nOutput: The total postage for all packages.",
"predict": "In the second test case, which if does the 20 kg package go into?",
"ask": "When a weight is exactly 5, 10 or 15 kg, is the answer right? Try it with \"My tests\".",
"table": [["Weight","Postage"],["up to 5 kg","70"],["over 5 kg, up to 10 kg","90"],["over 10 kg, up to 15 kg","110"],["over 15 kg, up to 20 kg","135"]],
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, i;      // n: number of packages (input); i: loop counter, which package\n    double w;      // this package's weight (input), may have decimals\n    int total = 0; // total postage, starts at 0\n    \n    cin >> n;\n    for (i = 1; i <= n; i++) {\n        cin >> w;\n        if (w <= 5) {\n            total = total + 70;\n        } else if (w <= 10) {\n            total = total + 90;\n        } else if (w <= 15) {\n            total = total + 110;\n        } else {\n            total = total + 135;\n        }\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "2, 3 and 5 kg are all up to 5 kg: 70 + 70 + 70 = 210"},
{"note": "6 kg is 90, 11 kg is 110, 16 kg is 135, 20 kg is 135: 470 in total"}
]
},
"r063": {
"title": "Basketball Machine",
"isNew": "while loop: keep reading until the goal is reached",
"goal": "A basketball machine gives 2 or 3 points for each shot that goes in. You clear the game when you get 30 points, and the machine records how many balls you threw. Finish the program: given the points of each shot, print how many balls were thrown.\nInput: the points of each shot (2 or 3).\nOutput: how many balls were thrown.",
"predict": "In the first test case, how many rounds does the loop run? What is score after the last round?",
"ask": "What happens if you never reach 30 points? Try 2 2 2 in \"My tests\". Why does the condition include cin >> p?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int p;          // points for this shot (input)\n    int score = 0;  // total points so far, starts at 0\n    int count = 0;  // balls thrown, starts at 0\n    \n    while (score < 30 && cin >> p) {\n        score = score + p;\n        count = count + 1;\n    }\n    cout << count << endl;\n    return 0;\n}",
"tests": [
{"note": "2 points per ball: 15 balls make exactly 30 points"},
{"note": "3 points per ball: 10 balls make exactly 30 points"},
{"note": "The first 10 balls miss (0 points), the next 10 get 3 points each: 20 balls in total"}
]
},
"r064": {
"title": "Total Damage",
"isNew": "stop at -1: read one first, then read the next one at the end of the loop",
"goal": "In a battle game, damage keeps adding up. Write a program that adds up and prints the total damage. An input of -1 means the battle is over.\nInput: several damage values, ending with -1.\nOutput: the total damage.",
"predict": "When -1 is read, is -1 added to total?",
"ask": "What happens if you move cin >> d; to the first line inside the loop? What if you forget to type -1 at the end of the input? Try it with \"My tests\".",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int d;          // this time's damage (input)\n    int total = 0;  // total damage, starts at 0\n    \n    cin >> d;\n    while (d != -1) {\n        total = total + d;\n        cin >> d;\n    }\n    cout << total << endl;\n    return 0;\n}",
"tests": [
{"note": "10 + 15 + 20 = 45. Reading -1 ends it, and -1 is not added."},
{}
]
},
"5-1": {
"title": "An Array Is a Row of Cells",
"isNew": "arrays; the index starts at 0",
"goal": "An array is a row of cells next to each other. You use an index to reach a cell, and the first cell is [0]. The index can be any expression that gives an integer.",
"ask": "Look at the addresses: how far apart are the cells? Why?"
},
"5-2": {
"title": "Read into an Array, Print Backwards",
"isNew": "putting it together: cin + for + array",
"uses": "cin, for, array index",
"goal": "Use the loop variable i as the index, and you can read data into the array one cell at a time. After that, you can take the data out in any order you like.",
"ask": "Why does the second loop start at n - 1 and not n?"
},
"5-3": {
"title": "Array Out of Range",
"isNew": "legal indexes are 0 to n-1",
"uses": "for, arrays",
"goal": "For an array of 3 cells, the only legal indexes are 0, 1 and 2. A tiny mistake in the loop condition goes out of range, and real C++ will not warn you.",
"ask": "Which symbol do you change to fix it?"
},
"5-4": {
"title": "The Maximum Trap",
"isNew": "the starting value of the maximum",
"uses": "cin, for, arrays, if",
"goal": "When you look for the maximum, you cannot just set mx to 0 at the start. If all the data is negative, the answer will be wrong.",
"task": "Problem: Read n integers and print the maximum.",
"ask": "What should mx start at to be safe? Fix it to get AC."
},
"5-5": {
"title": "Counting Arrays",
"isNew": "use the value as the index: cnt[x]++",
"uses": "cin, for, arrays",
"goal": "The number you read can itself be the index. cnt[x]++ means \"the number x appeared one more time\".",
"ask": "What happens if the input has a 6?"
},
"5-6": {
"title": "Global vs. Local Arrays",
"isNew": "global arrays start at 0",
"goal": "A global array, declared outside main, is set to all 0 automatically. A local array inside main holds garbage values. Big arrays are usually declared outside, too.",
"ask": "On an OJ, what is the difference between putting int a[1000000] inside main and outside main?"
},
"5-7": {
"title": "vector: an Array That Grows",
"isNew": "push_back adds one at the end; size() tells how many",
"uses": "arrays, for",
"goal": "An array's size is fixed when you declare it and cannot change later. After #include <vector>, you can use a vector: it can start empty, and each push_back adds one item at the end, so it grows by one cell.\nYou use it much like an array: v[i] gets item i (starting from 0), and v.size() tells how many items there are now. Look at the memory on the right: each push_back adds one more cell.",
"predict": "After three push_backs, what is v.size()? Which number is v[0]?",
"ask": "Add the line cout << v[3] << endl; at the end. What happens? Does a vector grow by itself just because you use v[3]?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v;  // starts empty; no need to choose a size first\n    int i;          // which item\n    \n    v.push_back(10);\n    v.push_back(20);\n    v.push_back(30);\n    cout << v.size() << endl;\n    for (i = 0; i < v.size(); i++) {\n        cout << v[i] << \" \";\n    }\n    cout << endl;\n    return 0;\n}"
},
"5-8": {
"title": "Ways to Declare a vector",
"isNew": "empty, with a size, with a size and a value, with { }",
"goal": "There are a few common ways to declare a vector:\nvector<int> a;: empty, 0 items.\nvector<int> b(3);: starts with 3 items, all 0.\nvector<int> c(3, 7);: 3 items, each one is 7.\nvector<int> d = {1, 2, 3};: puts in 1, 2, 3 directly.\nWhichever way you use, you can still push_back more items later.",
"predict": "After c.push_back(8);, how many items does each of the four vectors have?",
"ask": "An array int x[3]; with no values holds garbage values. What about vector<int> b(3);? Look at the memory.",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a;             // empty\n    vector<int> b(3);          // 3 items, all 0\n    vector<int> c(3, 7);       // 3 items, all 7\n    vector<int> d = {1, 2, 3};  // puts in 1, 2, 3 directly\n    \n    c.push_back(8);\n    cout << a.size() << \" \" << b.size() << \" \" << c.size() << \" \" << d.size() << endl;\n    cout << b[0] << \" \" << c[3] << \" \" << d[2] << endl;\n    return 0;\n}"
},
"5-9": {
"title": "Read n Numbers into a vector",
"isNew": "cin reads one, push_back adds one",
"uses": "cin, for",
"goal": "Many problems give n first, then n numbers. With an array, you have to guess a big enough size first. With a vector, you do not need to guess: read a number, push_back it. After reading everything, v.size() is exactly n.",
"predict": "With the input 4 and 3 1 4 1, what does v look like at the end? What is v.back()?",
"ask": "Change n to 10 and type a few more numbers. Does the program need any change? What about with an array?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v;  // stores the numbers read in\n    int n;          // how many numbers\n    int i;          // which one\n    int x;          // the number read this time\n    \n    cin >> n;\n    for (i = 0; i < n; i++) {\n        cin >> x;\n        v.push_back(x);\n    }\n    cout << \"Total \" << v.size() << \", the last one is \" << v.back() << endl;\n    return 0;\n}"
},
"5-10": {
"title": "for (int x : v): Take Them Out One by One",
"isNew": "range-based for: take out each item in order, without managing an index",
"uses": "vector, for",
"goal": "When you just want to \"look at each item in order\", you can use a range-based for: for (int x : v) means \"start from the first item of v, and each time copy one item into x\". You do not need to write i or v.size(). Arrays and strings work this way too.\nNote: x is a copy, so changing x does not change the values inside v.",
"predict": "Does the line x = 0; change the numbers inside v to 0? What is printed at the end?",
"ask": "If you want to know the position of each item (for example, to print \"item 2 is 4\"), is a range-based for convenient? When do you still need i?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v = {3, 1, 4, 1, 5};  // a group of numbers\n    int sum = 0;                     // the total, starts at 0\n    \n    for (int x : v) {\n        sum = sum + x;\n        x = 0;  // this changes the copy, x\n    }\n    cout << sum << \" \" << v[0] << endl;\n    return 0;\n}"
},
"r008": {
"title": "Step Counter Lookup",
"isNew": "read into an array, look up by index: day n is in cell n-1",
"goal": "You have a smart wristband that records how many steps you walk each day of the week. Now you want to look up the steps for one day.\nInput the steps for seven days (Monday to Sunday), then an integer n (1 to 7) for the day you want. The program should print the steps for that day. Use an array.\nInput: The first line has seven integers separated by spaces: the steps from Monday to Sunday. The second line has an integer n (1~7) for the day you want: 1 is Monday, 2 is Tuesday, ..., 7 is Sunday.\nOutput: the steps on that day (an integer).",
"predict": "To look up Thursday (n = 4), which cell of steps does the program read?",
"ask": "If the last line were steps[n], what would happen when you look up Sunday (n = 7)? Try it with \"My tests\".",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int steps[7];   // steps from Monday to Sunday (input); steps[0] is Monday\n    int i, n;       // i: loop counter, which cell; n: which day to look up (input)\n    \n    for (i = 0; i < 7; i++) {\n        cin >> steps[i];\n    }\n    cin >> n;\n    cout << steps[n - 1] << endl;\n    return 0;\n}",
"tests": [
{"note": "Thursday is day 4, stored in steps[3]: 9100"}
]
}
});
