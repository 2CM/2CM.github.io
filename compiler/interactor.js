const output = document.getElementById("output");
const code = document.getElementById("code");
const memoryCap = 1024;

code.value = `class Buh {
    String[] buhs;
    
    void ctor(String one, String two) {
        this.buhs = String@2;
        this.buhs#0 = one;
        this.buhs#1 = two;
    }
}

class Main {
    static Int32 b;

    static void Main() {
        Buh myBuh = Buh~("yeah", "no??");

        Console:WriteLine$(myBuh.buhs#0);
        Console:WriteLine$(myBuh.buhs#1);
    }
}`

var therealconsolelog = consoleLog;

consoleLog = function() {
    for(let i = 0; i < arguments.length; i++) {
        let arg = arguments[i];

        let value = "";

        switch(typeof arg) {
            case "number":
            case "bigint":
            case "boolean":
            case "function":
            case "object":
                value = arg.toString();

                break;
            case "string":
            case "symbol":
                value = `"${arg}"`

                break;
            case "undefined":
                value = "undefined"
        }

        output.value += value + "\n"
    }
}

var currentTokenized = null;
var currentTree = null;
var currentIL = null;
var currentInterpreter = null;

document.getElementById("run").addEventListener("click", () => {
    try {
        currentTokenized = tokenize(code.value);
        currentTree = lexicalDataToCompilationUnit(currentTokenized);
        currentIL = compilationUnitToIL(currentTree);
        currentInterpreter = new ILInterpreter(currentIL);
        currentInterpreter.setup(memoryCap);
        currentInterpreter.run();
    } catch(e) {
        console.log(e)
    }
})

document.getElementById("tree").addEventListener("click", () => {
    if(currentTree == null) {
        console.log("run the program first")

        return;
    }

    console.log(currentTree);
})

document.getElementById("il").addEventListener("click", () => {
    if(currentIL == null) {
        console.log("run the program first")

        return;
    }

    console.log(currentIL);
})

document.getElementById("clear").addEventListener("click", () => {
    output.value = ""
})