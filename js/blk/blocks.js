/* ================= Scratch / Blockly 的積木（照 individual_demo 專案的積木樣式） =================
   積木的定義、主題、工具箱都來自 franktang0512/individual_demo：
     Scratch 模式：src/lib/blockly-workspace/scratch.ts 的 scratch_* 積木（zelos 外觀）
     Blockly 模式：src/lib/blockly-workspace/blockly.ts，用 Blockly 內建的積木（geras 外觀）
   兩種模式用的積木不一樣，所以各有各的工作區（各自存在瀏覽器裡）。
   跟原專案不一樣的地方：
     1. 綠旗圖示：原本的 img/flag.svg 是 Font Awesome Pro（商業授權），這裡換成自己畫的 BLK_FLAG。
     2. Scratch 模式的「函式」：積木照原專案（scratch_function_*）；「建立一個積木」對話框原本是 React 寫的，這裡改用一般的 HTML（blkFunctionDialog）。
        「數字或文字」參數不設型別，才放得進「重複 ( ) 次」、「+」這些只收數字的格子（原專案設成 NumberString，接不上去）。
     3. 「詢問並等待」的預設文字原本寫在 NUM 欄位，改成 TEXT。
   只在 ?course=blk 而且 Blockly 載入成功時才會用到。 */
const BLK_FLAG="data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="1.5" y="0.8" width="2.8" height="18.4" rx="1.4" fill="#008000"/><path d="M4.3 2.6C6.6 1.3 9 1.3 11.2 2.5S15.9 3.8 18.2 2.6V12.4C15.9 13.6 13.4 13.6 11.2 12.4S6.6 11.1 4.3 12.4Z" fill="#008000" stroke="#008000" stroke-width="1.2" stroke-linejoin="round"/></svg>');   // 自己畫的：跟原專案一樣是一整塊綠色、旗面有波浪
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
  // ---------- Scratch 模式的自訂積木（原專案 scratch.ts 的 functionMixin、scratch_function_*） ----------
  const functionMixin={
    parameters_:[],
    addParameter:function(name,type){
      const stackInput=this.getInput("STACK"),stackTarget=stackInput&&stackInput.connection&&stackInput.connection.targetBlock();
      if(stackInput)this.removeInput("STACK");
      if(!this.parameters_)this.parameters_=[];
      this.parameters_.push({name,type});
      if(type==="Label")this.appendDummyInput(name).appendField(name);
      else{
        const input=this.appendValueInput(name).setCheck(type==="NumberString"?["Number","String"]:"Boolean");
        const paramBlock=this.workspace.newBlock("scratch_function_param");
        paramBlock.setShadow(true);   // 原專案的作法：避免讀檔、複製時參數積木變成兩塊
        paramBlock.setMovable(false);
        paramBlock.setFieldValue(name,"PARAM_NAME");
        if(paramBlock.initSvg){paramBlock.initSvg();paramBlock.render()}
        input.connection.connect(paramBlock.outputConnection);
      }
      if(stackInput){
        this.appendStatementInput("STACK").setCheck(null);
        if(stackTarget&&!stackTarget.disposed&&stackTarget.previousConnection)this.getInput("STACK").connection.connect(stackTarget.previousConnection);
      }
    },
    mutationToDom:function(){
      const c=Blockly.utils.xml.createElement("mutation");
      c.setAttribute("name",(this.getField("NAME")&&this.getField("NAME").getValue())||"");
      this.parameters_.forEach(p=>{const a=Blockly.utils.xml.createElement("arg");a.setAttribute("name",p.name);a.setAttribute("type",p.type);c.appendChild(a)});
      return c;
    },
    domToMutation:function(xml){
      if(!this.parameters_)this.parameters_=[];
      const f=this.getField("NAME");if(f)f.setValue(xml.getAttribute("name")||"");
      this.inputList.slice().forEach(i=>{if(!["HEADER","STACK"].includes(i.name))this.removeInput(i.name)});
      for(const ch of Array.from(xml.childNodes))if(ch.nodeName.toLowerCase()==="arg"){
        const n=ch.getAttribute("name"),t=ch.getAttribute("type");if(n&&t)this.addParameter(n,t);
      }
    },
  };
  Blockly.Blocks["scratch_function_create"]={
    init:function(){
      this.appendDummyInput().appendField("定義").appendField(new Blockly.FieldLabel("新積木"),"NAME");
      this.setStyle("procedure_blocks");this.setInputsInline(true);this.parameters_=[];
    },...functionMixin};
  Blockly.Blocks["scratch_function_definition"]={
    init:function(){
      this.appendDummyInput("HEADER").appendField("定義").appendField(new Blockly.FieldLabel(" "),"NAME");
      this.appendStatementInput("STACK").setCheck(null);
      this.setStyle("procedure_blocks");this.setInputsInline(true);this.parameters_=[];
    },...functionMixin};
  Blockly.Blocks["scratch_function_call"]={
    init:function(){
      this.appendDummyInput("HEADER").appendField(new Blockly.FieldLabel(" "),"NAME");
      this.setPreviousStatement(true,null);this.setNextStatement(true,null);
      this.setStyle("procedure_blocks");this.setInputsInline(true);this.parameters_=[];
    },...functionMixin,
    addParameter:function(name,type){
      if(!this.parameters_)this.parameters_=[];
      this.parameters_.push({name,type});
      this.appendDummyInput("DUMMY_TEXT").appendField(name+":");
      if(type!=="Label")this.appendValueInput(name).setCheck(type==="NumberString"?["Number","String"]:"Boolean");
    }};
  Blockly.Blocks["scratch_function_param"]={
    init:function(){
      this.appendDummyInput().appendField(new Blockly.FieldLabel(""),"PARAM_NAME");
      this.setOutput(true,null);this.setStyle("procedure_parameter_blocks");
    },
    mutationToDom:function(){
      const c=Blockly.utils.xml.createElement("mutation");
      c.setAttribute("name",this.getFieldValue("PARAM_NAME"));
      c.setAttribute("paramtype",(this.outputConnection&&this.outputConnection.getCheck&&(this.outputConnection.getCheck()||[])[0])||"");
      return c;
    },
    domToMutation:function(xml){
      const n=xml.getAttribute("name"),t=xml.getAttribute("paramtype");
      if(n)this.setFieldValue(n,"PARAM_NAME");
      // 跟原專案不一樣：「數字或文字」參數不設型別，才放得進「重複 ( ) 次」、「+」這些只收數字的格子
      if(t&&t!=="NumberString")this.setOutput(true,t);
    }};
  return true;
}
/* ---------- Scratch 模式的「函式」分類（原專案的 functionFlyoutCallback） ---------- */
function blkFunctionFlyout(ws){
  const xml=[],btn=document.createElement("button");btn.setAttribute("text","建立函式");btn.setAttribute("callbackKey","CREATE_SCRATCH_FUNCTION");xml.push(btn);
  const defs=ws.getBlocksByType("scratch_function_definition",false);
  defs.forEach((d,i)=>{
    const call=document.createElement("block");call.setAttribute("type","scratch_function_call");
    const m=d.mutationToDom();if(m)call.appendChild(m);
    const f=document.createElement("field");f.setAttribute("name","NAME");f.textContent=d.getFieldValue("NAME");call.appendChild(f);
    xml.push(call);
    (d.parameters_||[]).forEach(p=>{
      if(p.type==="Label")return;
      const pb=document.createElement("block");pb.setAttribute("type","scratch_function_param");
      const pm=document.createElement("mutation");pm.setAttribute("name",p.name);pm.setAttribute("paramtype",p.type==="Boolean"?"Boolean":"NumberString");pb.appendChild(pm);
      const pf=document.createElement("field");pf.setAttribute("name","PARAM_NAME");pf.textContent=p.name;pb.appendChild(pf);
      xml.push(pb);
    });
    if(i<defs.length-1){const sep=document.createElement("sep");sep.setAttribute("gap","80");xml.push(sep)}
  });
  return xml;
}
/* ---------- 「建立一個積木」對話框（原專案的 ScratchFunctionCreationDialog.tsx，改用一般的 HTML） ---------- */
function blkFunctionDialog(ws){
  const old=document.getElementById("blkFnDlg");if(old)old.remove();
  const box=document.createElement("div");box.id="blkFnDlg";box.className="blk-fn-dlg";
  box.innerHTML=`<div class="blk-fn-card" role="dialog" aria-modal="true" aria-labelledby="blkFnTitle">
    <div class="blk-fn-head" id="blkFnTitle">建立一個積木</div>
    <div class="blk-fn-body">
      <label class="blk-fn-label" for="blkFnName">積木名稱</label>
      <input id="blkFnName" class="blk-fn-name" value="新積木" placeholder="輸入積木名稱">
      <div class="blk-fn-label">參數列表</div><ul class="blk-fn-params" id="blkFnParams"></ul>
      <div class="blk-fn-ws" id="blkFnWs"></div>
      <div class="blk-fn-adds">
        <button type="button" data-add="NumberString"><b>添加輸入方塊</b><span>數字或文字</span></button>
        <button type="button" data-add="Boolean"><b>添加輸入方塊</b><span>布林值</span></button>
        <button type="button" data-add="Label"><b>添加說明文字</b></button>
      </div>
    </div>
    <div class="blk-fn-foot"><button type="button" class="small-btn" id="blkFnCancel">取消</button><button type="button" class="small-btn run" id="blkFnOk">確定</button></div>
  </div>`;
  document.body.appendChild(box);
  let params=[];
  // 預覽：上面放一塊「定義 新積木」，參數改了就重做一塊
  const pws=Blockly.inject("blkFnWs",{renderer:"zelos",theme:blkTheme("scratch"),trashcan:false,sounds:false,
    grid:{spacing:20,length:3,colour:"#e3e6ee",snap:true},zoom:{controls:true,wheel:true,startScale:1,maxScale:3,minScale:0.3,scaleSpeed:1.2},move:{scrollbars:true,drag:true,wheel:true}});
  const nameEl=box.querySelector("#blkFnName");
  function preview(){
    pws.clear();
    const b=pws.newBlock("scratch_function_create");b.setFieldValue(nameEl.value,"NAME");
    params.forEach(p=>b.addParameter(p.name,p.type));
    b.initSvg();b.render();pws.scrollCenter();
    box.querySelector("#blkFnParams").innerHTML=params.map((p,i)=>`<li><button type="button" class="blk-fn-chip ${p.type}" data-del="${i}" title="刪除"><span></span> ✕</button></li>`).join("");
    box.querySelectorAll("[data-del]").forEach((el,i)=>{el.querySelector("span").textContent=params[i].name;el.onclick=()=>{params.splice(i,1);preview()}});
  }
  nameEl.oninput=()=>{const b=pws.getBlocksByType("scratch_function_create")[0];if(b)b.setFieldValue(nameEl.value,"NAME")};
  box.querySelectorAll("[data-add]").forEach(el=>el.onclick=()=>{
    const type=el.dataset.add;
    Blockly.dialog.prompt(type==="Label"?"輸入說明文字:":"輸入參數名稱:","",n=>{
      if(n===null||n===undefined)return;n=n.trim();
      if(n===""){alert("參數名稱不能為空白");return}
      if(params.some(p=>p.name===n)){alert("參數名稱重複");return}
      params.push({name:n,type});preview();
    });
  });
  const close=()=>{pws.dispose();box.remove()};
  box.querySelector("#blkFnCancel").onclick=close;
  box.querySelector("#blkFnOk").onclick=()=>{
    const name=nameEl.value.trim();if(!name){alert("請輸入積木名稱");return}
    close();
    const d=ws.newBlock("scratch_function_definition");d.setFieldValue(name,"NAME");
    params.forEach(p=>d.addParameter(p.name,p.type));
    d.initSvg();d.render();
    const m=ws.getMetrics(),xy=ws.getOriginOffsetInPixels();
    d.moveBy(xy.x+(m&&m.viewWidth||0)/3,xy.y+(m&&m.viewHeight||0)/4);
    ws.refreshToolboxSelection();
  };
  setTimeout(()=>{Blockly.svgResize(pws);preview();nameEl.focus();nameEl.select()},0);
}
// 存工作區：自訂積木裡的參數積木不存（讀回來時會自己長出來，原專案 CodeEditor.tsx 的作法）
function blkSave(ws){
  const j=Blockly.serialization.workspaces.save(ws);
  ((j.blocks&&j.blocks.blocks)||[]).forEach(b=>{
    if(b.type==="scratch_function_definition"&&b.inputs)for(const[k,v]of Object.entries(b.inputs))if(v&&((v.block||v.shadow)||{}).type==="scratch_function_param")delete b.inputs[k];
  });
  return j;
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
      custom: "SCRATCH_FUNCTION",
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
  // 函式：「建立函式」打開對話框，下面列出已經定義的積木和它們的參數（Scratch 的自訂積木沒有回傳值）
  ws.registerToolboxCategoryCallback("SCRATCH_FUNCTION",blkFunctionFlyout);
  ws.registerButtonCallback("CREATE_SCRATCH_FUNCTION",()=>blkFunctionDialog(ws));
  ws.registerButtonCallback("CREATE_SCRATCH_LIST",()=>{const old=Blockly.Msg.NEW_VARIABLE_TITLE;Blockly.Msg.NEW_VARIABLE_TITLE="新清單名稱：";
    Blockly.Variables.createVariableButtonHandler(ws,()=>{Blockly.Msg.NEW_VARIABLE_TITLE=old},"list")});
}
