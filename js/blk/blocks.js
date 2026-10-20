/* ================= Scratch / Blockly 的積木（照 individual_demo 專案的積木樣式） =================
   積木的定義、主題、工具箱都來自 franktang0512/individual_demo：
     Scratch 模式：src/lib/blockly-workspace/scratch.ts 的 scratch_* 積木（zelos 外觀）
     Blockly 模式：src/lib/blockly-workspace/blockly.ts，用 Blockly 內建的積木（geras 外觀）
   兩種模式用的積木不一樣，所以各有各的工作區（各自存在瀏覽器裡）。
   跟原專案不一樣的地方：
     1. 綠旗圖示：原本的 img/flag.svg 是 Font Awesome Pro（商業授權），這裡換成自己畫的 BLK_FLAG。
     2. Scratch 模式的「函式」：原本的自訂積木對話框是 React 寫的，先用 Blockly 內建的自訂積木（PROCEDURE）。
     3. 「詢問並等待」的預設文字原本寫在 NUM 欄位，改成 TEXT。
   只在 ?course=blk 而且 Blockly 載入成功時才會用到。 */
const BLK_FLAG="data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="3" y="2" width="2.2" height="17" rx="1.1" fill="#455a64"/><path d="M5.2 3.2h10.3l-2.6 3.6 2.6 3.6H5.2z" fill="#4cbf56" stroke="#389438" stroke-width="1" stroke-linejoin="round"/></svg>');
let BLK_DEFINED=false;
function blkDefine(){
  if(typeof Blockly==="undefined")return false;
  if(BLK_DEFINED)return true;BLK_DEFINED=true;
  // 原專案 init.ts：中文訊息、變數積木的用詞、拿掉「說明」的右鍵選單
  Blockly.Msg["VARIABLES_SET"]="將 %1 設為 %2";
  Blockly.Msg["MATH_CHANGE_TITLE"]="將 %1 的值加 %2";
  try{if(Blockly.ContextMenuRegistry&&Blockly.ContextMenuRegistry.registry.getItem("blockHelp"))Blockly.ContextMenuRegistry.registry.unregister("blockHelp")}catch(e){}
  // ---------- Scratch 模式的積木（原專案 scratch.ts） ----------
  Blockly.Blocks["event_whenflagclicked"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("當")
          .appendField(new Blockly.FieldImage(BLK_FLAG, 20, 20, "🏁"))
          .appendField("被點擊");
        this.setNextStatement(true, null);
        this.setColour("#FFBF00");
        this.setTooltip("當旗子被點擊時觸發");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_text"] = {
      init: function () {
        this.appendDummyInput()
          .appendField(new Blockly.FieldTextInput(""), "TEXT"); // 🔹 預設值 HAHA
        this.setOutput(true, ["Number", "String"]); // 🔹 允許數字 & 文字
        this.setColour("#FFFFFF"); // 🔹 設定為白色，符合 Scratch 風格
      },
    };
  Blockly.Blocks["event_askandwait"] = {
      init: function () {
        this.appendValueInput("TEXT")
          .setCheck(null)
          .appendField("詢問");
        this.appendDummyInput()
          .appendField("並等待");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#5CB1D6");
        this.setTooltip("");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["event_answer"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("詢問的答案");
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour("#5CB1D6");
        this.setTooltip("");
        this.setHelpUrl("");

      },
    };
  Blockly.Blocks["event_say"] = {
      init: function () {
        this.appendValueInput("TEXT")
          .setCheck(null)
          .appendField("說出");
        this.appendDummyInput();
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#9966FF");
        this.setTooltip("");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_if"] = {
      init: function () {
        this.appendValueInput("IF0").setCheck("Boolean").appendField("如果");
        this.appendDummyInput().appendField("那麼");
        this.appendStatementInput("DO0").setCheck(null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("control_blocks");
        this.setTooltip("如果條件成立，則執行內部的程式區塊");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_ifElse"] = {
      init: function () {
        this.appendValueInput("IF0").setCheck("Boolean").appendField("如果");
        this.appendDummyInput().appendField("那麼");
        this.appendStatementInput("DO0").setCheck(null);
        this.appendDummyInput().appendField("否則");
        this.appendStatementInput("ELSE").setCheck(null);
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("control_blocks");
        this.setTooltip(
          "如果條件成立，則執行第一個程式區塊，否則執行第二個程式區塊"
        );
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_repeat_ext"] = {
      init: function () {
        this.appendValueInput("TIMES").setCheck("Number").appendField("重複");
        this.appendDummyInput().appendField("次");
        this.appendStatementInput("DO").setCheck(null);
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("control_blocks");
        this.setTooltip("重複執行指定次數的程式區塊");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_while"] = {
      init: function () {
        this.appendValueInput("BOOL")
          .setCheck("Boolean")
          .appendField("重複")
          .appendField(
            new Blockly.FieldDropdown([
              ["當", "WHILE"],
              ["直到", "UNTIL"],
            ]),
            "MODE"
          );
        this.appendStatementInput("DO").setCheck(null);
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("control_blocks");
        this.setTooltip("當條件成立時重複執行程式區塊");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_whileUntil"] = {
      init: function () {
        this.appendValueInput("BOOL")
          .setCheck("Boolean")
          .appendField("重複")
          .appendField(
            new Blockly.FieldDropdown([
              ["直到", "UNTIL"],
              ["當", "WHILE"],
            ]),
            "MODE"
          );
        this.appendStatementInput("DO").setCheck(null);
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("control_blocks");
        this.setTooltip("直到條件成立時停止重複執行程式區塊");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_controls_flow_statements"] = {
      init: function () {
        this.appendDummyInput().appendField(
          new Blockly.FieldDropdown([
            ["中斷循環", "BREAK"],
            ["繼續下一個循環", "CONTINUE"],
          ]),
          "FLOW",
        );
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
        this.setStyle("control_blocks");
        this.setTooltip("控制重複的執行流程");
      },
    };
  Blockly.Blocks["scratch_logic_compare"] = {
      init: function () {
        this.appendValueInput("A").setCheck(null);
        this.appendValueInput("B")
          .setCheck(null)
          .appendField(
            new Blockly.FieldDropdown([
              ["=", "EQ"],
              ["≠", "NEQ"],
              ["<", "LT"],
              [">", "GT"],
              ["≤", "LTE"],
              ["≥", "GTE"],
            ]),
            "OP",
          );

        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setStyle("calculation_blocks");
      },
    };
  Blockly.Blocks["scratch_math_arithmetic"] = {
      init: function () {
        this.appendValueInput("A")
          .setCheck("Number");
        this.appendValueInput("B")
          .setCheck("Number")
          .appendField(new Blockly.FieldDropdown([["+", "ADD"], ["-", "MINUS"], ["*", "MULTIPLY"], ["/", "DIVIDE"]]), "OP");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour("#36BF36");
        this.setTooltip("");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_string_join"] = {
      init: function () {

        this.appendValueInput("TEXT0")
          .setCheck(null)
          .appendField("字串組合");
        this.appendValueInput("TEXT1")
          .setCheck(null);
        this.setInputsInline(true);
        this.setOutput(true, "String");
        this.setColour("#36BF36");
        this.setTooltip("");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_string_char_at"] = {
      init: function () {
        this.appendValueInput("STRING").setCheck(null).appendField("字串");
        this.appendValueInput("INDEX").setCheck("Number").appendField("的第");
        this.appendDummyInput().appendField("字");
        this.setInputsInline(true);
        this.setOutput(true, "String");
        this.setStyle("calculation_blocks");
        this.setTooltip("取得字串中指定位置的字元");
      },
    };
  Blockly.Blocks["scratch_string_contains"] = {
      init: function () {
        this.appendValueInput("STRING1").setCheck("String").appendField("字串");
        this.appendValueInput("STRING2").setCheck("String").appendField("包含");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setStyle("calculation_blocks");
        this.setTooltip("檢查第一個字串是否包含第二個字串");
      },
    };
  Blockly.Blocks["scratch_length"] = {
      init: function () {
        this.appendValueInput("VALUE")
          .setCheck(["String", "Array"])
          .appendField("取得");
        this.appendDummyInput().appendField("的長度");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setStyle("calculation_blocks");
        this.setTooltip("計算字串或清單的長度");
        this.setHelpUrl("");
      },
    };
  Blockly.Blocks["scratch_variables_set"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("變數")
          .appendField(new Blockly.FieldVariable("", undefined, [""]), "VAR")
          .appendField("設為");

        const shadowBlock = document.createElement("shadow");
        shadowBlock.setAttribute("type", "scratch_text");
        const field = document.createElement("field");
        field.setAttribute("name", "TEXT");
        field.textContent = "0";
        shadowBlock.appendChild(field);

        this.appendValueInput("VALUE")
          .setCheck(null)
          .connection.setShadowDom(shadowBlock);

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("variable_blocks");
      },
    };
  Blockly.Blocks["scratch_variables_change"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("變數")
          .appendField(new Blockly.FieldVariable("", undefined, [""]), "VAR")
          .appendField("改變");

        const valueInput = this.appendValueInput("DELTA").setCheck(null);

        const shadowBlock = document.createElement("shadow");
        shadowBlock.setAttribute("type", "math_number");
        const field = document.createElement("field");
        field.setAttribute("name", "NUM");
        field.textContent = "1";
        shadowBlock.appendChild(field);

        valueInput.connection.setShadowDom(shadowBlock);

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("variable_blocks");
      },
    };
  Blockly.Blocks["scratch_variables_get"] = {
      init: function () {
        this.appendDummyInput()
          .appendField(
            new Blockly.FieldVariable("變數名稱", undefined, [""]),
            "VAR")
        this.setStyle("variable_blocks");
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setColour("#FF9900");
        this.setTooltip("");
        this.setHelpUrl("");

      },
    };
  Blockly.Blocks["scratch_list_get"] = {
      init: function () {
        this.appendDummyInput().appendField(
          new Blockly.FieldVariable("", undefined, ["list"], "list"),
          "LIST"
        );
        this.setOutput(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("取得清單");
      },
    };
  Blockly.Blocks["scratch_list_add"] = {
      init: function () {
        let itemInput = this.appendValueInput("ITEM")
          .setCheck(null)
          .appendField("添加");

        let shadowBlock = document.createElement("shadow");
        shadowBlock.setAttribute("type", "scratch_text");
        let field = document.createElement("field");
        field.setAttribute("name", "TEXT");
        field.textContent = "thing"; // 🔹 預設值為 ""
        shadowBlock.appendChild(field);

        itemInput.connection.setShadowDom(shadowBlock);

        this.appendDummyInput()
          .appendField("到")
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          );

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("加入項目到清單末尾");
      },
    };
  Blockly.Blocks["scratch_list_get_item"] = {
      init: function () {
        this.appendDummyInput()
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          );


        let valueInput = this.appendValueInput("INDEX").setCheck("Number").appendField("的第");


        let shadowBlock = document.createElement("shadow");
        shadowBlock.setAttribute("type", "math_number"); // 🔹 設定為數字輸入框
        let field = document.createElement("field");
        field.setAttribute("name", "NUM");
        field.textContent = "1"; // 🔹 預設值
        shadowBlock.appendChild(field);

        valueInput.connection.setShadowDom(shadowBlock);
        this.appendDummyInput().appendField("項");
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("取得清單中指定位置的項目");
      },
    };
  Blockly.Blocks["scratch_list_empty"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("刪除")
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          )
          .appendField("的所有項目");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("清空清單中的所有項目");
      },
    };
  Blockly.Blocks["scratch_list_length"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("清單")
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          )
          .appendField("的長度");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setStyle("list_blocks");
        this.setTooltip("取得清單的長度");
      },
    };
  Blockly.Blocks["scratch_list_insert"] = {
      init: function () {
        let itemInput = this.appendValueInput("ITEM").setCheck(null).appendField("插入");

        let itemShadow = document.createElement("shadow");
        itemShadow.setAttribute("type", "scratch_text"); // 讓 ITEM 變成文字輸入框
        let itemField = document.createElement("field");
        itemField.setAttribute("name", "TEXT");
        itemField.textContent = "thing"; // 預設值
        itemShadow.appendChild(itemField);
        itemInput.connection.setShadowDom(itemShadow); // ✅ 讓 `ITEM` 變成 Scratch 樣式

        this.appendDummyInput()
          .appendField("到")
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          );

        let indexInput = this.appendValueInput("INDEX").setCheck("Number").appendField("的第");

        let indexShadow = document.createElement("shadow");
        indexShadow.setAttribute("type", "math_number");
        let indexField = document.createElement("field");
        indexField.setAttribute("name", "NUM");
        indexField.textContent = "1"; // 預設值
        indexShadow.appendChild(indexField);
        indexInput.connection.setShadowDom(indexShadow); // ✅ 讓 `INDEX` 變成 Scratch 樣式

        this.appendDummyInput().appendField("項");

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("在指定位置插入項目");
      },
    };
  Blockly.Blocks["scratch_list_set"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("替換")
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          );

        let indexInput = this.appendValueInput("INDEX").setCheck("Number").appendField("的第");

        let indexShadow = document.createElement("shadow");
        indexShadow.setAttribute("type", "math_number");
        let indexField = document.createElement("field");
        indexField.setAttribute("name", "NUM");
        indexField.textContent = "1"; // 預設值
        indexShadow.appendChild(indexField);
        indexInput.connection.setShadowDom(indexShadow); // ✅ 讓 `INDEX` 變成 Scratch 樣式

        let itemInput = this.appendValueInput("ITEM").setCheck(null).appendField("項為");

        let itemShadow = document.createElement("shadow");
        itemShadow.setAttribute("type", "scratch_text");
        let itemField = document.createElement("field");
        itemField.setAttribute("name", "TEXT");
        itemField.textContent = "新值"; // 預設值
        itemShadow.appendChild(itemField);
        itemInput.connection.setShadowDom(itemShadow); // ✅ 讓 `ITEM` 變成 Scratch 樣式

        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("修改指定位置的項目");
      },
    };
  Blockly.Blocks["scratch_list_remove"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("刪除")
          .appendField(
            new Blockly.FieldVariable("", undefined, ["list"], "list"),
            "LIST"
          );

        let indexInput = this.appendValueInput("INDEX")
          .setCheck("Number")
          .appendField("的第");

        let shadowBlock = document.createElement("shadow");
        shadowBlock.setAttribute("type", "math_number");
        let field = document.createElement("field");
        field.setAttribute("name", "NUM");
        field.textContent = "1"; // 🔹 預設為 1，而不是 0
        shadowBlock.appendChild(field);

        indexInput.connection.setShadowDom(shadowBlock); // ✅ 設定 shadow block

        this.appendDummyInput().appendField("項");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle("list_blocks");
        this.setTooltip("刪除指定位置的項目");
      },
    };
  Blockly.Blocks["scratch_list_contain"] = {
      init: function () {
        this.appendDummyInput()
          .appendField("清單") // ✅ 顯示標題
          .appendField(
            new Blockly.FieldVariable("myList", undefined, ["list"], "list"), // ✅ 只能選擇「清單」變數
            "LIST"
          )
          .appendField("包含");

        let itemInput = this.appendValueInput("ITEM").setCheck(null); // ✅ 可輸入任何類型的數據

        let itemShadow = document.createElement("shadow");
        itemShadow.setAttribute("type", "scratch_text");
        let itemField = document.createElement("field");
        itemField.setAttribute("name", "TEXT");
        itemField.textContent = "thing"; // 預設值
        itemShadow.appendChild(itemField);
        itemInput.connection.setShadowDom(itemShadow); // ✅ 讓 `ITEM` 變成 Scratch 樣式

        this.appendDummyInput().appendField("?"); // ✅ 加上問號

        this.setInputsInline(true); // ✅ 保持 Scratch 樣式
        this.setOutput(true, "Boolean"); // ✅ 返回布林值
        this.setStyle("list_blocks"); // ✅ 設定 Scratch 列表風格
        this.setTooltip("檢查清單是否包含指定的元素");
      },
    };
  Blockly.Blocks["scratch_list_indexof"] = {
      init: function () {


        let itemInput = this.appendValueInput("ITEM").setCheck(null).appendField("");

        let itemShadow = document.createElement("shadow");
        itemShadow.setAttribute("type", "scratch_text");
        let itemField = document.createElement("field");
        itemField.setAttribute("name", "TEXT");
        itemField.textContent = "thing"; // 預設值
        itemShadow.appendChild(itemField);
        itemInput.connection.setShadowDom(itemShadow); // ✅ 讓 `ITEM` 變成 Scratch 樣式



        this.appendDummyInput()
          .appendField("在") // "在 [列表] 裡的項目編號"
          .appendField(
            new Blockly.FieldVariable("myList", undefined, ["list"], "list"), // 限制變數類型為「列表」
            "LIST"
          )
          .appendField("裡的項目編號");

        this.setInputsInline(true); // ✅ 保持 Scratch 樣式
        this.setOutput(true, "Number"); // ✅ 返回數字類型
        this.setStyle("list_blocks"); // ✅ 設定 Scratch 列表風格
        this.setTooltip("取得指定值在列表中的位置");
      },
    };
  return true;
}

/* ---------- 主題（原專案 scratch.ts 的 scratchTheme、blockly.ts 的 blocklyTheme） ---------- */
function blkTheme(look){
  const comp={workspaceBackgroundColour:"#f9fafb",toolboxBackgroundColour:"#e5e7eb",toolboxForegroundColour:"#111827",flyoutBackgroundColour:"#f3f4f6",flyoutForegroundColour:"#111827",
    flyoutOpacity:0.9,scrollbarColour:"#d1d5db",insertionMarkerColour:"#6b7280",insertionMarkerOpacity:0.3,scrollbarOpacity:0.4};
  if(look!=="scratch")return Blockly.Theme.defineTheme("blockly",{name:"blockly",base:Blockly.Themes.Classic,categoryStyles:{exclusive_category:{colour:"#ef4444"}},componentStyles:comp,fontStyle:{weight:"normal"},startHats:false});
  return Blockly.Theme.defineTheme("scratch",{name:"scratch",base:Blockly.Themes.Classic,
    blockStyles:{
      event_category:{colourPrimary:"#5CB1D6",colourSecondary:"#4AA8C4",colourTertiary:"#4098B0"},
      control_blocks:{colourPrimary:"#FFAB19",colourSecondary:"#EC9C13",colourTertiary:"#CC9900"},
      loop_blocks:{colourPrimary:"#FFAB19",colourSecondary:"#EC9C13",colourTertiary:"#CC9900"},
      calculation_blocks:{colourPrimary:"#59C059",colourSecondary:"#46B946",colourTertiary:"#389438"},
      math_blocks:{colourPrimary:"#59C059",colourSecondary:"#46B946",colourTertiary:"#389438"},
      logic_blocks:{colourPrimary:"#59C059",colourSecondary:"#46B946",colourTertiary:"#389438"},
      variable_blocks:{colourPrimary:"#FF8C1A",colourSecondary:"#FF8000",colourTertiary:"#DB6E00"},
      list_blocks:{colourPrimary:"#FD6723",colourSecondary:"#ea580c",colourTertiary:"#c2410c"},
      procedure_blocks:{colourPrimary:"#FF6680",colourSecondary:"#FF4D6A",colourTertiary:"#FF3355"},
      procedure_parameter_blocks:{colourPrimary:"#FF3355",colourSecondary:"#FF3355",colourTertiary:"#FF3355"}},
    categoryStyles:{event_category:{colour:"#5CB1D6"},exclusive_category:{colour:"#ef4444"},control_category:{colour:"#FFAB19"},calculation_category:{colour:"#59C059"},
      list_category:{colour:"#FD6723"},variable_category:{colour:"#FF8C1A"},procedure_category:{colour:"#FF6680"}},
    componentStyles:comp,fontStyle:{weight:"bold"},startHats:true});
}

/* ---------- 工具箱（原專案的 scratchToolboxConfig、blocklyToolboxConfig） ---------- */
function blkToolbox(look){return look==="scratch"?BLK_TB_SCRATCH:BLK_TB_BLOCKLY}
const BLK_TB_SCRATCH={
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "事件",
      categorystyle: "event_category",
      contents: [
        { kind: "block", type: "event_whenflagclicked" },
        {
          kind: "block",
          type: "event_askandwait",
          inputs: {
            TEXT: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "你的名字是?",
                },
              },
            },
          },
        },
        { kind: "block", type: "event_answer" },
        {
          kind: "block",
          type: "event_say",
          inputs: {
            TEXT: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "",
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "控制",
      categorystyle: "control_category",
      contents: [
        {
          kind: "block",
          type: "scratch_if",
        },
        {
          kind: "block",
          type: "scratch_ifElse",
        },
        {
          kind: "block",
          type: "scratch_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "10",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "scratch_while",
        },
        {
          kind: "block",
          type: "scratch_whileUntil",
        },
        {
          kind: "block",
          type: "scratch_controls_flow_statements",
        },
      ],
    },
    {
      kind: "category",
      name: "運算",
      categorystyle: "calculation_category",
      contents: [
        {
          kind: "block",
          type: "logic_boolean",
        },
        {
          kind: "block",
          type: "scratch_logic_compare",
          inputs: {
            A: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "0",
                },
              },
            },
            B: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "0",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "logic_operation",
        },
        {
          kind: "block",
          type: "logic_negate",
        },
        {
          kind: "block",
          type: "scratch_math_arithmetic",
          inputs: {
            A: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "",
                },
              },
            },
            B: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_single",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "9",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_round",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "3.1",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_modulo",
          inputs: {
            DIVIDEND: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "64",
                },
              },
            },
            DIVISOR: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "10",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_random_int",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "100",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "scratch_string_join",
          inputs: {
            TEXT0: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
            TEXT1: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "def",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "scratch_string_char_at",
          inputs: {
            STRING: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
            INDEX: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "scratch_string_contains",
          inputs: {
            STRING1: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "hello",
                },
              },
            },
            STRING2: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "el",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "scratch_length",
          inputs: {
            VALUE: {
              shadow: {
                type: "scratch_text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "變數",
      custom: "SCRATCH_VARIABLE",
      categorystyle: "variable_category",
    },
    {
      kind: "category",
      name: "清單",
      custom: "SCRATCH_LIST",
      categorystyle: "list_category",
      contents: [
        {
          kind: "block",
          type: "lists_create_empty",
        },
        {
          kind: "block",
          type: "lists_create_with",
        },
        {
          kind: "block",
          type: "lists_repeat",
        },
        {
          kind: "block",
          type: "lists_length",
        },
        {
          kind: "block",
          type: "lists_isEmpty",
        },
        {
          kind: "block",
          type: "lists_indexOf",
        },
        {
          kind: "block",
          type: "lists_getIndex",
        },
        {
          kind: "block",
          type: "lists_setIndex",
        },
        {
          kind: "block",
          type: "lists_getSublist",
        },
        {
          kind: "block",
          type: "lists_sort",
        },
        {
          kind: "block",
          type: "lists_split",
        },
        {
          kind: "block",
          type: "lists_reverse",
        },
      ],
    },
    {
      kind: "category",
      name: "函式",
      custom: "SCRATCH_PROCEDURE",
      categorystyle: "procedure_category",
    },
  ],
};
const BLK_TB_BLOCKLY={
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "邏輯",
      categorystyle: "logic_category",
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
        {
          kind: "block",
          type: "logic_compare",
        },
        {
          kind: "block",
          type: "logic_operation",
        },
        {
          kind: "block",
          type: "logic_negate",
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
        {
          kind: "block",
          type: "logic_null",
        },
        {
          kind: "block",
          type: "logic_ternary",
        },
      ],
    },
    {
      kind: "category",
      name: "迴圈",
      categorystyle: "loop_category",
      contents: [
        {
          kind: "block",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "10",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_whileUntil",
        },
        {
          kind: "block",
          type: "controls_for",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "10",
                },
              },
            },
            BY: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_forEach",
        },
        {
          kind: "block",
          type: "controls_flow_statements",
        },
      ],
    },
    {
      kind: "category",
      name: "數學",
      categorystyle: "math_category",
      contents: [
        {
          kind: "block",
          type: "math_number",
        },
        {
          kind: "block",
          type: "math_arithmetic",
          inputs: {
            A: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "",
                },
              },
            },
            B: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_single",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "9",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_trig",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "45",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_constant",
        },
        {
          kind: "block",
          type: "math_number_property",
          inputs: {
            NUMBER_TO_CHECK: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "0",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_round",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "3.1",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_on_list",
        },
        {
          kind: "block",
          type: "math_modulo",
          inputs: {
            DIVIDEND: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "64",
                },
              },
            },
            DIVISOR: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "10",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_constrain",
          inputs: {
            VALUE: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "50",
                },
              },
            },
            LOW: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
            HIGH: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "100",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_random_int",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "100",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_random_float",
        },
      ],
    },
    {
      kind: "category",
      name: "文字",
      categorystyle: "text_category",
      contents: [
        {
          kind: "block",
          type: "text",
        },
        {
          kind: "block",
          type: "text_join",
          inputs: {
            ADD0: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "",
                },
              },
            },
            ADD1: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_append",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_length",
          inputs: {
            VALUE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_isEmpty",
          inputs: {
            VALUE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_indexOf",
          inputs: {
            VALUE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "hello world",
                },
              },
            },
            FIND: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "world",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_charAt",
          inputs: {
            VALUE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
            AT: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_getSubstring",
          inputs: {
            STRING: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
            AT1: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "1",
                },
              },
            },
            AT2: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: "2",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_changeCase",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_trim",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: " abc ",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_print",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_prompt_ext",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "請輸入文字",
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "清單",
      categorystyle: "list_category",
      contents: [
        {
          kind: "block",
          type: "lists_create_empty",
        },
        {
          kind: "block",
          type: "lists_create_with",
        },
        {
          kind: "block",
          type: "lists_repeat",
        },
        {
          kind: "block",
          type: "lists_length",
        },
        {
          kind: "block",
          type: "lists_isEmpty",
        },
        {
          kind: "block",
          type: "lists_indexOf",
        },
        {
          kind: "block",
          type: "lists_getIndex",
        },
        {
          kind: "block",
          type: "lists_setIndex",
        },
        {
          kind: "block",
          type: "lists_getSublist",
        },
        {
          kind: "block",
          type: "lists_sort",
        },
        {
          kind: "block",
          type: "lists_split",
        },
        {
          kind: "block",
          type: "lists_reverse",
        },
      ],
    },
    {
      kind: "category",
      name: "變數",
      custom: "VARIABLE",
      categorystyle: "variable_category",
    },
    {
      kind: "category",
      name: "函式",
      custom: "PROCEDURE",
      categorystyle: "procedure_category",
    },
  ],
};

/* ---------- Scratch 模式的「變數」、「清單」分類（原專案的 variableFlyoutCallback、listFlyoutCallback） ---------- */
const BLK_NAME_OK=/^[\u4e00-\u9fa5a-zA-Z0-9]+$/;  // 變數、清單的名字只能有中英文和數字（不能有底線）
function blkVarField(v,name,type){const f=document.createElement("field");f.setAttribute("name",name);f.setAttribute("id",v.getId());f.setAttribute("variabletype",type);f.textContent=v.name;return f}
function blkVariableFlyout(ws){
  const xml=[],btn=document.createElement("button");btn.setAttribute("text","建立變數");btn.setAttribute("callbackKey","CREATE_SCRATCH_VARIABLE");xml.push(btn);
  const vars=ws.getVariablesOfType("");
  vars.forEach((v,i)=>{
    if(!BLK_NAME_OK.test(v.name)){ws.deleteVariableById(v.getId());alert("請只使用中英文宣告變數名稱！");return}
    const g=document.createElement("block");g.setAttribute("type","scratch_variables_get");g.appendChild(blkVarField(v,"VAR",""));xml.push(g);
    // 只為「最後一個變數」放「設為」和「改變」積木
    if(i===vars.length-1)["scratch_variables_set","scratch_variables_change"].forEach(t=>{const b=document.createElement("block");b.setAttribute("type",t);b.appendChild(blkVarField(v,"VAR",""));xml.push(b)});
  });
  return xml;
}
function blkListFlyout(ws){
  const xml=[],btn=document.createElement("button");btn.setAttribute("text","建立新清單");btn.setAttribute("callbackKey","CREATE_SCRATCH_LIST");xml.push(btn);
  const lists=ws.getVariablesOfType("list");if(!lists.length)return xml;
  const last=lists[lists.length-1];
  if(!BLK_NAME_OK.test(last.name)){ws.deleteVariableById(last.getId());alert("請只使用中英文宣告清單名稱！");return xml}
  lists.forEach(l=>{const g=document.createElement("block");g.setAttribute("type","scratch_list_get");g.appendChild(blkVarField(l,"LIST","list"));xml.push(g)});
  ["scratch_list_add","scratch_list_get_item","scratch_list_empty","scratch_list_length","scratch_list_insert","scratch_list_set","scratch_list_remove","scratch_list_contain","scratch_list_indexof"]
    .forEach(t=>{const b=document.createElement("block");b.setAttribute("type",t);b.appendChild(blkVarField(last,"LIST","list"));xml.push(b)});
  return xml;
}
// Scratch 模式：註冊「變數」、「清單」分類和「建立」按鈕（原專案 CodeEditor.tsx 的 handleWorkspaceInject）
function blkRegister(ws,look){
  if(look!=="scratch")return;
  ws.registerToolboxCategoryCallback("SCRATCH_VARIABLE",blkVariableFlyout);
  ws.registerButtonCallback("CREATE_SCRATCH_VARIABLE",()=>Blockly.Variables.createVariableButtonHandler(ws,undefined,""));
  ws.registerToolboxCategoryCallback("SCRATCH_LIST",blkListFlyout);
  // Scratch 的自訂積木沒有回傳值：只放「定義（沒有回傳值）」和已經定義好的積木
  ws.registerToolboxCategoryCallback("SCRATCH_PROCEDURE",w=>{
    const out=[{kind:"block",type:"procedures_defnoreturn"}];
    try{for(const[name,params]of Blockly.Procedures.allProcedures(w)[0])out.push({kind:"block",type:"procedures_callnoreturn",extraState:{name,params}})}catch(e){}
    return out;
  });
  ws.registerButtonCallback("CREATE_SCRATCH_LIST",()=>{const old=Blockly.Msg.NEW_VARIABLE_TITLE;Blockly.Msg.NEW_VARIABLE_TITLE="新清單名稱：";
    Blockly.Variables.createVariableButtonHandler(ws,()=>{Blockly.Msg.NEW_VARIABLE_TITLE=old},"list")});
}
