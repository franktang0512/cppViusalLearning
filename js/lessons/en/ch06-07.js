/* ---------- English: chapters 6-7 (Advanced Programming) ----------
   Simple English (about CEFR B1) for Taiwanese high school students. Keys are lesson ids. */
Object.assign(CH_EN,{6:{title:"Strings"},7:{title:"Two-Dimensional Arrays"}});
Object.assign(LESSON_EN,{
"6-1": {
"title": "char Arrays: Many chars in a Row",
"isNew": "a char array, one character per cell",
"goal": "A char can hold only one character. To store a word, use a char array: each cell holds one character, and the cells sit next to each other in memory.",
"predict": "How many bytes does word take in memory?",
"ask": "Change word[0] to 'J'. What is printed? Press \"Edit\" and try it.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    char word[5] = {'H', 'e', 'l', 'l', 'o'};  // 5 characters, one per cell\n    int i;                                      // loop counter: which cell\n    \n    for (i = 0; i < 5; i++) {\n        cout << word[i];\n    }\n    cout << endl;\n    return 0;\n}"
},
"6-2": {
"title": "'\\0': Where a String Ends",
"isNew": "the '\\0' at the end of a string; starting values in double quotes",
"goal": "A char array does not know how many characters it holds. So C++ has a rule: put a '\\0' (the character whose value is 0) at the end of a string to mark the end. When you give a value in double quotes, '\\0' is added automatically. When cout prints a char array, it keeps printing until it reaches '\\0'.",
"predict": "What does the last cout print? Is the '!' in s[2] still there?",
"ask": "\"Hi\" has only 2 characters. Why is char s[2] = \"Hi\"; an error? Try changing it.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    char s[8] = \"Hi\";  // 8 cells: 'H', 'i', and all the rest are '\\0'\n    \n    cout << s << endl;\n    s[2] = '!';\n    cout << s << endl;\n    s[1] = '\\0';\n    cout << s << endl;\n    return 0;\n}"
},
"6-3": {
"title": "Reading into a char Array with cin",
"isNew": "cin >> adds '\\0' automatically; count to '\\0' to get the length",
"goal": "cin >> puts one word into a char array and adds '\\0' at the end automatically. To find how many characters there are, count from cell 0 until you reach '\\0'. Keep one cell for '\\0', so 10 cells can hold at most 9 characters.",
"predict": "After reading Sinyi, what is name[5]?",
"ask": "Change the input to Programming (11 characters). What happens?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    char name[10];  // at most 9 characters, plus the '\\0' at the end\n    int len = 0;    // how many characters the name has, starts at 0\n    \n    cin >> name;\n    while (name[len] != '\\0') {\n        len = len + 1;\n    }\n    cout << name << \" has \" << len << \" characters\" << endl;\n    return 0;\n}"
},
"6-4": {
"title": "Character Math: Lowercase to Uppercase",
"isNew": "characters can be added and subtracted: c - 'a' + 'A'",
"goal": "A char is really a number (its ASCII code). Lowercase 'a' to 'z' are in a row, and so are uppercase 'A' to 'Z'. So c - 'a' is \"which letter of the alphabet\", and adding 'A' gives the matching uppercase letter.",
"predict": "Which character is 'e' - 'a' + 'A'?",
"ask": "To change uppercase to lowercase instead, how do you change lines 10 and 11?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    char word[20];  // the word read in\n    int i;          // loop counter: which cell\n    \n    cin >> word;\n    for (i = 0; word[i] != '\\0'; i++) {\n        if (word[i] >= 'a' && word[i] <= 'z') {\n            word[i] = word[i] - 'a' + 'A';\n        }\n    }\n    cout << word << endl;\n    return 0;\n}"
},
"6-5": {
"title": "<string>: Strings That Change Length by Themselves",
"isNew": "#include <string>, joining with +, s.length()",
"goal": "With a char array, you must choose the number of cells first and take care of '\\0' yourself. After #include <string>, you can use string: you do not choose a size first, and its length changes by itself. Use + to join strings, and s.length() to ask how many characters it has.",
"predict": "After s = s + \"!!\"; runs, what is the length of s?",
"ask": "Can you join char arrays with +? Compare with 6-2. Which one is easier?",
"code": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s = \"Hi\";  // no need to choose the number of cells first\n    string t;         // with no value, it is an empty string\n    \n    cout << s << \" length \" << s.length() << endl;\n    s = s + \"!!\";\n    cout << s << \" length \" << s.length() << endl;\n    t = s + \" CK\";\n    cout << t << endl;\n    return 0;\n}"
},
"6-6": {
"title": "A string Can Use s[i] Too",
"isNew": "s[i] gets character i; use it with s.length() to go through a string",
"goal": "Like an array, a string can use s[i] to get character i (starting from 0). With s.length(), you can use a loop to check it one character at a time.",
"predict": "How many vowels does education have? How many rounds does the loop run?",
"ask": "How would you change every vowel to '*' and then print s?",
"code": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;      // the word read in\n    int i;         // loop counter: which character\n    int count = 0; // how many vowels, starts at 0\n    \n    cin >> s;\n    for (i = 0; i < s.length(); i++) {\n        if (s[i] == 'a' || s[i] == 'e' || s[i] == 'i' || s[i] == 'o' || s[i] == 'u') {\n            count = count + 1;\n        }\n    }\n    cout << count << endl;\n    return 0;\n}"
},
"6-7": {
"title": "cin >> and getline",
"isNew": "getline reads a whole line; the newline left by cin >>",
"goal": "cin >> stops at a space or a newline, and it does NOT take away the newline after it. getline reads a whole line (spaces included), up to the newline. So if getline comes right after cin >>, getline first runs into the newline left from the line before, and reads an empty string.",
"predict": "Will name get Lin Sinyi?",
"ask": "Add the line cin.ignore(); before getline and run it again. What did this line throw away?",
"code": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    int age;      // age (first line)\n    string name;  // full name, with a space in it (second line)\n    \n    cin >> age;\n    getline(cin, name);\n    cout << \"age = \" << age << endl;\n    cout << \"name = [\" << name << \"]\" << endl;\n    return 0;\n}"
},
"6-8": {
"title": "Useful String Functions: substr, find",
"isNew": "s.find(\"x\") finds a position; s.substr(start, length) cuts out a piece; not found is string::npos",
"uses": "6-5, 6-6",
"goal": "String problems often need to \"find where something is\" and \"cut out a piece\":\ns.find(t): the position where t first appears. If it is not found, it returns string::npos, so to check whether it was found, write s.find(t) == string::npos.\ns.substr(start, length): take that many characters from the start position. If you leave out the length, it takes everything to the end.\nThis program uses the position of the comma to cut \"apple,banana\" into two pieces.",
"predict": "At which position is the comma? How many characters does s.substr(0, p) take?",
"ask": "If s has two commas (\"a,b,c\"), which one does s.find(\",\") find? How could you find the second comma? (Hint: the second argument of find is where to start looking.)\nAlso, you could write the not-found check as s.find(\"cherry\") == -1. The result is the same, but the compiler may give a warning, so people usually write string::npos.",
"code": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s = \"apple,banana\";  // two words separated by a comma\n    int p;                       // the position of the comma\n    \n    p = s.find(\",\");\n    cout << p << endl;\n    cout << s.substr(0, p) << endl;\n    cout << s.substr(p + 1) << endl;\n    if (s.find(\"cherry\") == string::npos) {\n        cout << \"no cherry\" << endl;\n    }\n    return 0;\n}"
},
"6-9": {
"title": "Strings and Numbers: to_string, stoi",
"isNew": "stoi(s): string to number; to_string(n): number to string",
"uses": "6-5, 6-8",
"goal": "\"2026\" is a string, so you cannot just add 1 to it; 2026 is a number, so you cannot use s[i] to get one digit. When you need to, you can turn one into the other:\nstoi(s): turns a string into an int (stoll turns it into a long long). to_string(n): turns a number into a string.\nOnce it is a string, you can use length() to count the digits and s[i] to get one digit. For some problems, this is simpler than using % 10 and / 10.",
"predict": "What does n + 1 print? What is t? How many digits does it have?",
"ask": "Do the + in s + \" year\" and the + in n + 1 mean the same thing? What happens if you write s + 1? Change s to \"20x6\". What does stoi give?",
"code": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s = \"2026\";  // a string\n    int n;              // after turning it into a number\n    string t;           // the number turned back into a string\n    \n    n = stoi(s);\n    cout << n + 1 << endl;\n    t = to_string(n * 3);\n    cout << t << \" has \" << t.length() << \" digits\" << endl;\n    cout << s + \" year\" << endl;\n    return 0;\n}"
},
"7-1": {
"title": "Tables: Rows and Columns",
"isNew": "int a[2][3], a[row][column]",
"goal": "Some data is naturally a table: a seating chart, a report card, a map. int a[2][3] declares a table with 2 rows × 3 columns. a[i][j] is the cell in row i, column j, and both rows and columns start counting from 0.\nRule of thumb: row first, then column. First say which row (the horizontal line), then which column (which item in that row).",
"predict": "What are a[0][2] and a[1][0]? Find them in the table on the right first.",
"ask": "Does a[2][0] exist? Press \"Edit\" and change the last line to cout << a[2][0] << endl; to try it.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[2][3] = {{1, 2, 3},   // row 0\n                   {4, 5, 6}};  // row 1\n    \n    cout << a[0][2] << endl;\n    cout << a[1][0] << endl;\n    a[1][1] = 50;\n    cout << a[1][1] << endl;\n    return 0;\n}"
},
"7-2": {
"title": "Two Loops to Go Through a Table",
"isNew": "the outer i picks the row; the inner j goes across the row",
"uses": "nested loops",
"goal": "The outer loop's i decides the row, and the inner loop's j goes through each column of that row. Only after the inner loop finishes a whole round does the outer i go up by 1, moving to the next row.\nWatch how i (beside the table) and j (above it) move on the right.",
"predict": "How many times does the line a[i][j] = ... run in total? Is the table filled row by row, or column by column?",
"ask": "Swap the outer and inner loops of the first pair (the outer runs j, the inner runs i). How does the filling order change? Is the final table the same?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[3][4];  // 3 rows, 4 columns\n    \n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 4; j++) {\n            a[i][j] = (i + 1) * (j + 1);\n        }\n    }\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 4; j++) {\n            cout << a[i][j] << \" \";\n        }\n        cout << endl;\n    }\n    return 0;\n}"
},
"7-3": {
"title": "Read a Table, Add Up Each Row",
"isNew": "putting it together: read an r × c table; reset the sum for each row",
"uses": "cin, nested loops, adding up",
"goal": "Reading a table also uses two loops: read it row by row, cell by cell. To get the sum of each row, sum must go back to 0 \"when a new row starts\", so sum = 0; goes inside the outer loop, before the inner loop.",
"task": "Problem: The first line has r and c, followed by r rows with c integers each. Print the sum of each row, one per line.",
"ask": "To print the sum of each column instead, how do you change the two loops?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[5][5];  // at most 5 rows, 5 columns\n    int r, c;     // the real number of rows and columns\n    int sum;      // the sum of one row\n    \n    cin >> r >> c;\n    for (int i = 0; i < r; i++) {\n        for (int j = 0; j < c; j++) {\n            cin >> a[i][j];\n        }\n    }\n    for (int i = 0; i < r; i++) {\n        sum = 0;\n        for (int j = 0; j < c; j++) {\n            sum = sum + a[i][j];\n        }\n        cout << sum << endl;\n    }\n    return 0;\n}"
},
"7-4": {
"title": "Transpose: Rows Become Columns",
"isNew": "b[j][i] = a[i][j]",
"uses": "nested loops",
"goal": "To transpose a table is to flip it over its diagonal: row i becomes column i, so b[j][i] = a[i][j].\nNote that the size of b is flipped too: a is 2 × 3, so b is 3 × 2.",
"predict": "The 3 in a is at row 0, column 2. Which cell of b does it move to after the transpose?",
"ask": "What happens if you declare b as int b[2][3]?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[2][3] = {{1, 2, 3},\n                   {4, 5, 6}};  // 2 rows, 3 columns\n    int b[3][2];                 // after the transpose: 3 rows, 2 columns\n    \n    for (int i = 0; i < 2; i++) {\n        for (int j = 0; j < 3; j++) {\n            b[j][i] = a[i][j];\n        }\n    }\n    for (int j = 0; j < 3; j++) {\n        for (int i = 0; i < 2; i++) {\n            cout << b[j][i] << \" \";\n        }\n        cout << endl;\n    }\n    return 0;\n}"
},
"7-5": {
"title": "Up, Down, Left, Right: dx and dy",
"isNew": "direction arrays: for direction k, the row adds dx[k] and the column adds dy[k]",
"uses": "1D arrays, for, if",
"goal": "Map and maze problems often need to look at the four neighbors: up, down, left and right. Instead of writing four ifs, put the change for each direction into two arrays: for direction k, the row adds dx[k] and the column adds dy[k]. One loop checks all four directions.\nLook at the table on the right: x and y are the current position, and nx and ny are the neighbor being checked.",
"predict": "Standing at g[1][1], what are the four cells up, down, left and right? What is cnt at the end?",
"ask": "Change x, y to 0, 0 (the top-left corner). What happens?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int g[3][4] = {{0, 1, 0, 0},\n                   {1, 1, 1, 0},\n                   {0, 0, 1, 0}};  // 1 is a path, 0 is a wall\n    int dx[4] = {-1, 1, 0, 0};  // up, down, left, right: how much the row changes\n    int dy[4] = {0, 0, -1, 1};  // up, down, left, right: how much the column changes\n    int x = 1, y = 1;           // standing at row 1, column 1\n    int cnt = 0;                // how many cells around are paths\n    \n    for (int k = 0; k < 4; k++) {\n        int nx = x + dx[k];\n        int ny = y + dy[k];\n        if (g[nx][ny] == 1) {\n            cnt++;\n        }\n    }\n    cout << cnt << endl;\n    return 0;\n}"
},
"7-6": {
"title": "The Order of Edge Checks",
"isNew": "check the range first, then read the cell (&& short-circuit)",
"uses": "&& short-circuit, dx/dy",
"goal": "When you stand at the edge of the map, some neighbors are not even on the map, for example row -1. So first check whether nx and ny are in range, and only then look at g[nx][ny].\nThe order must be \"check the range first, then read the cell\": as soon as the left side of && is false, the right side is not run (short-circuit, lesson 3-4), so the out-of-range cell is never read.",
"predict": "When k = 0 (up), what is nx? Which checks inside the if actually run?",
"ask": "What happens if you move g[nx][ny] == 1 to the very front (before the range checks)?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int g[3][4] = {{0, 1, 0, 0},\n                   {1, 1, 1, 0},\n                   {0, 0, 1, 0}};  // 1 is a path, 0 is a wall\n    int dx[4] = {-1, 1, 0, 0};  // up, down, left, right: how much the row changes\n    int dy[4] = {0, 0, -1, 1};  // up, down, left, right: how much the column changes\n    int x = 0, y = 0;           // standing at the top-left corner\n    int cnt = 0;                // how many cells around are paths\n    \n    for (int k = 0; k < 4; k++) {\n        int nx = x + dx[k];\n        int ny = y + dy[k];\n        if (nx >= 0 && nx < 3 && ny >= 0 && ny < 4 && g[nx][ny] == 1) {\n            cnt++;\n        }\n    }\n    cout << cnt << endl;\n    return 0;\n}"
},
"7-7": {
"title": "Flattened: What a Table Looks Like in Memory",
"isNew": "rows are laid out one after another in one long line; a[i][j] is cell i × (cells per row) + j",
"goal": "The table is only how we picture it. Memory is really one long line, and a 2D array is laid out \"one row after another\": first the 4 cells of row 0, then right after them row 1. So a[i][j] is cell i × 4 + j (4 is the number of cells in each row).\nThis is also why the second size (cells per row) is required when you declare a 2D array: without it, you cannot work out where a[i][j] is. Compare the table on the right with the long line under it.",
"predict": "In the table, a[0][3] is at the far right and a[1][0] is at the far left. How far apart are their addresses in memory?",
"ask": "Which cell is a[2][1]? Work it out with i × 4 + j, then check it against the long line below."
},
"7-8": {
"title": "Where Does a[0][4] Land?",
"isNew": "a column index that is too big runs into the next row",
"goal": "a[0][4] does not exist in the table: row 0 has only a[0][0] to a[0][3]. But real C++ does not check. It just computes i × 4 + j: 0 × 4 + 4 = 4, which is cell 4 of the flattened line, exactly a[1][0].\nSo when a 2D array goes out of range, the program often does not crash. Instead, it secretly reads or changes a cell in the next row, and this kind of bug is very hard to find.",
"predict": "If C++ does not check, what value does a[0][4] read?",
"ask": "Change it to a[1][-1]. Which cell does it land on? Work it out with i × 4 + j first.",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a[3][4] = {};  // nothing inside { }: all 0\n    \n    a[1][0] = 5;\n    cout << a[0][4] << endl;\n    return 0;\n}"
},
"7-9": {
"title": "Storing a Table in a 1D Array: b[i * 4 + j]",
"isNew": "work out the position yourself: i × 4 + j, and back again with k / 4 and k % 4",
"uses": "1D arrays, nested for, integer division and %",
"goal": "The last lesson showed that a 2D array is really one long line in memory. So we can also store a table in a \"1D array\" ourselves, as long as we work out each cell's position:\n1. Row i, column j → cell i × 4 + j (4 is the number of cells in each row).\n2. The other way round, cell k → row k / 4, column k % 4 (integer division and remainder).\nHere b[k] holds i × 10 + j, so the tens digit is the row and the ones digit is the column. You can see at a glance where each cell was in the table.",
"predict": "What goes into b[7]? Which row and column was it in?",
"ask": "If the table had 3 rows and 5 columns, which 4s in the program should become 5? How many cells should b have?",
"code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int b[12];  // a 1D array storing a 3-row, 4-column table: 12 cells\n    int i, j;   // i: which row; j: which column\n    int k;      // which cell after flattening\n    \n    for (i = 0; i < 3; i++) {\n        for (j = 0; j < 4; j++) {\n            k = i * 4 + j;      // row i, column j → cell k after flattening\n            b[k] = i * 10 + j;  // the same as b[i * 4 + j] = i * 10 + j;\n        }\n    }\n    k = 6;\n    cout << \"Cell \" << k << \" is row \" << k / 4 << \", column \" << k % 4 << \": \" << b[k] << endl;\n    return 0;\n}"
},
"7-10": {
"title": "2D vectors",
"isNew": "vector<vector<int>> a(3, vector<int>(4, 0)): 3 rows of four 0s",
"uses": "vector (lesson 5-7), nested for",
"goal": "A 2D vector is a vector where \"every item is a vector\". vector<vector<int>> a(3, vector<int>(4, 0)); means: a has 3 items (3 rows), and each row is vector<int>(4, 0), which is four 0s.\na.size() is the number of rows, a[i].size() is how many items row i has, and a[i][j] is still item j of row i.",
"predict": "What are a.size() and a[0].size()?",
"ask": "Compare it with int a[3][4] in lesson 7-1: do the two kinds of a[i][j] work the same way? What is different?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<vector<int>> a(3, vector<int>(4, 0));  // 3 rows of four 0s\n    int i, j;  // i: which row; j: which column\n    \n    for (i = 0; i < a.size(); i++) {\n        for (j = 0; j < a[i].size(); j++) {\n            a[i][j] = i * 10 + j;\n        }\n    }\n    cout << a.size() << \" rows, \" << a[0].size() << \" in each row, a[2][3] = \" << a[2][3] << endl;\n    return 0;\n}"
},
"7-11": {
"title": "Rows Can Have Different Lengths",
"isNew": "each row of a 2D vector is its own vector and can push_back on its own",
"goal": "Every row of a 2D array must have the same length. Each row of a 2D vector is a separate vector that can push_back on its own, so the rows can have different lengths.\nThis program builds a triangle: row 0 has 1 item, row 1 has 2, row 2 has 3. So when you go through it, the inner loop must use a[i].size(), not a fixed number.",
"predict": "What are the lengths of the three rows? What will the memory on the right look like?",
"ask": "Change the inner loop to j < 4. What shape do you get?",
"code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<vector<int>> a(3);  // 3 rows, each row starts empty\n    int i, j;  // i: which row; j: how many to put in\n    \n    for (i = 0; i < a.size(); i++) {\n        for (j = 0; j <= i; j++) {\n            a[i].push_back(j + 1);\n        }\n    }\n    cout << a[0].size() << \" \" << a[1].size() << \" \" << a[2].size() << endl;\n    return 0;\n}"
}
});
