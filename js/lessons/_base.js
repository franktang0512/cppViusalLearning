/* ================= 課程目錄 ================= */
/* 每一章是 js/lessons/ 底下的一個檔案，用 CHAPTERS.push(...) 把自己加進來。
   章節順序 = index.html 裡 <script> 的順序。新增一章：複製一個章節檔、改內容、在 index.html 加一行 <script>。 */
const M=(...body)=>["#include <iostream>","using namespace std;","","int main() {",...body.map(l=>"    "+l),"    return 0;","}"].join("\n");

const CHAPTERS=[];
