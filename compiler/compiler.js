"use strict";
//#region lexical_analysis
function keys(obj) {
    return Object.keys(obj);
}
function values(obj) {
    return Object.values(obj);
}
var TOKEN_TYPE;
(function (TOKEN_TYPE) {
    TOKEN_TYPE[TOKEN_TYPE["IDENTIFIER"] = 0] = "IDENTIFIER";
    TOKEN_TYPE[TOKEN_TYPE["OPERATOR"] = 1] = "OPERATOR";
    TOKEN_TYPE[TOKEN_TYPE["LITERAL"] = 2] = "LITERAL";
    TOKEN_TYPE[TOKEN_TYPE["SEPERATOR"] = 3] = "SEPERATOR";
    TOKEN_TYPE[TOKEN_TYPE["KEYWORD"] = 4] = "KEYWORD";
})(TOKEN_TYPE || (TOKEN_TYPE = {}));
//SEPERATORS ARE DIFFERENT
function tokenize(code) {
    let startTime = performance.now();
    let cursor = 0;
    let tokens = [];
    let operatorDetection = "(\\+|-|\\*|\\/|%|&&|\\^|!|>>|<<|<|>|>=|<=|\\|\\||\\||=|==|\\.|\\\$|#|~|:|@)";
    loop1: while (true) {
        let current = code.slice(cursor);
        let match;
        if (current == "")
            break loop1;
        // console.log(current)
        //white space detection
        match = current.match(`^(\t| |\n)+`);
        if (match) {
            cursor += match[0].length;
            continue loop1;
        }
        match = current.match(`^(\\/\\/)[^\\n]+`);
        if (match) {
            // console.log(match)
            cursor += match[0].length;
            continue loop1;
        }
        //seperator detection
        match = current.match(`^((;|,|\\(|\\)|\\[|\\]|{|})|((\\/\\/)[^\\n]+))`);
        if (match) {
            tokens.push(TOKEN_TYPE.SEPERATOR, match[0]);
            cursor += match[0].length;
            continue loop1;
        }
        //literal detection
        match = current.match(`^(("([^"]+)?")|(-?)([0-9]+)(\\.[0-9]+)?)`); //MAKE IT INTERPRET STUFF LIKE .24
        if (match) {
            tokens.push(TOKEN_TYPE.LITERAL, match[0]);
            cursor += match[0].length;
            continue loop1;
        }
        //keyword detection
        match = current.match(`^(class|static) `);
        if (match) {
            tokens.push(TOKEN_TYPE.KEYWORD, match[0].slice(0, -1));
            cursor += match[0].length;
            continue loop1;
        }
        match = current.match(`^(if|for)( +)?\\(`);
        if (match) {
            tokens.push(TOKEN_TYPE.KEYWORD, match[1]); //surely this doesnt blow up in my face
            cursor += match[0].length - 1;
            continue loop1;
        }
        match = current.match(`^(else|continue|break|return)`); //erm
        if (match) {
            tokens.push(TOKEN_TYPE.KEYWORD, match[0].slice(0));
            cursor += match[0].length;
            continue loop1;
        }
        //identifier detection
        match = current.match(`^([a-z]|[A-Z]|[0-9]|(\\[\\]))+(${operatorDetection}| |,|\\(|;|\\))`);
        if (match) {
            tokens.push(TOKEN_TYPE.IDENTIFIER, match[0].slice(0, -1));
            cursor += match[0].length - 1;
            continue loop1;
        }
        //operator detection
        match = current.match(`^${operatorDetection}`);
        if (match) {
            tokens.push(TOKEN_TYPE.OPERATOR, match[0].slice(0));
            cursor += match[0].length;
            continue loop1;
        }
        console.log(current);
        throw new Error("you did something really freaky and i cannot recognize anything ");
    }
    // performanceTests.tokens = performance.now() - startTime;
    return tokens;
}
//#endregion lexical_analysis
//#region syntax_tree
var OPERATOR;
(function (OPERATOR) {
    OPERATOR[OPERATOR["Invoke"] = 0] = "Invoke";
    OPERATOR[OPERATOR["Access"] = 1] = "Access";
    OPERATOR[OPERATOR["AccessMethod"] = 2] = "AccessMethod";
    OPERATOR[OPERATOR["Index"] = 3] = "Index";
    OPERATOR[OPERATOR["Create"] = 4] = "Create";
    OPERATOR[OPERATOR["CreateArray"] = 5] = "CreateArray";
    OPERATOR[OPERATOR["Modulus"] = 6] = "Modulus";
    OPERATOR[OPERATOR["Multiply"] = 7] = "Multiply";
    OPERATOR[OPERATOR["Divide"] = 8] = "Divide";
    OPERATOR[OPERATOR["Add"] = 9] = "Add";
    OPERATOR[OPERATOR["Subtract"] = 10] = "Subtract";
    OPERATOR[OPERATOR["GreaterThan"] = 11] = "GreaterThan";
    OPERATOR[OPERATOR["GreaterThanEqualTo"] = 12] = "GreaterThanEqualTo";
    OPERATOR[OPERATOR["NotEqualTo"] = 13] = "NotEqualTo";
    OPERATOR[OPERATOR["EqualTo"] = 14] = "EqualTo";
    OPERATOR[OPERATOR["LessThan"] = 15] = "LessThan";
    OPERATOR[OPERATOR["LessThanEqualTo"] = 16] = "LessThanEqualTo";
    OPERATOR[OPERATOR["And"] = 17] = "And";
    OPERATOR[OPERATOR["Or"] = 18] = "Or";
    OPERATOR[OPERATOR["Xor"] = 19] = "Xor";
    OPERATOR[OPERATOR["Assign"] = 20] = "Assign";
})(OPERATOR || (OPERATOR = {}));
const OperatorOrderOfOperations = {
    [OPERATOR.Invoke]: 10,
    [OPERATOR.Access]: 10,
    [OPERATOR.AccessMethod]: 10,
    [OPERATOR.Index]: 10,
    [OPERATOR.Create]: 10,
    [OPERATOR.CreateArray]: 10,
    [OPERATOR.Modulus]: 9,
    [OPERATOR.Multiply]: 9,
    [OPERATOR.Divide]: 9,
    [OPERATOR.Add]: 8,
    [OPERATOR.Subtract]: 8,
    [OPERATOR.GreaterThan]: 7,
    [OPERATOR.GreaterThanEqualTo]: 7,
    [OPERATOR.NotEqualTo]: 7,
    [OPERATOR.EqualTo]: 7,
    [OPERATOR.LessThan]: 7,
    [OPERATOR.LessThanEqualTo]: 7,
    [OPERATOR.And]: 6,
    [OPERATOR.Or]: 5,
    [OPERATOR.Xor]: 5,
    [OPERATOR.Assign]: 4,
};
const OperatorSymbols = {
    ".": OPERATOR.Access,
    ":": OPERATOR.AccessMethod,
    "$": OPERATOR.Invoke,
    "#": OPERATOR.Index,
    "~": OPERATOR.Create,
    "@": OPERATOR.CreateArray,
    "%": OPERATOR.Modulus,
    "+": OPERATOR.Add,
    "-": OPERATOR.Subtract,
    "*": OPERATOR.Multiply,
    "/": OPERATOR.Divide,
    ">": OPERATOR.GreaterThan,
    ">=": OPERATOR.GreaterThanEqualTo,
    "!=": OPERATOR.NotEqualTo,
    "==": OPERATOR.EqualTo,
    "<": OPERATOR.LessThan,
    "<=": OPERATOR.LessThanEqualTo,
    "&&": OPERATOR.And,
    "||": OPERATOR.Or,
    "^^": OPERATOR.Xor,
    "=": OPERATOR.Assign,
};
class Block /* implements Iterable<Expression | LocalDeclaration | IfStatement>*/ {
    constructor(...gruh) {
        // [Symbol.iterator]() {
        //     let counter = 0;
        //     return {
        //         next: () => {
        //             return {
        //                 done: counter >= this.data.length,
        //                 value: this.data[++counter]
        //             }
        //         }
        //     }
        // }
        this.data = [];
        this.data = gruh;
    }
    add(value) {
        this.data.push(value);
    }
}
class Literal {
    constructor(value) {
        this.value = value;
    }
    getType(method, class_, code) {
        return code.typeToClass(typeof (this.value) == "number" ? "Int32" :
            typeof (this.value) == "string" ? "String" :
                "HEpl");
    }
}
class Identifier {
    constructor(value) {
        this.value = value;
    }
    getType(method, class_, code) {
        if (this.value == "this")
            return new ILType(class_);
        if (this.value == "void")
            return null;
        let inClasses = code.classes.find(c => c.name == this.value);
        if (inClasses != undefined)
            return new ILType(inClasses);
        if (method) {
            let inLocals = method.locals.find(c => c.identifier == this.value);
            if (inLocals != undefined)
                return inLocals.type;
        }
        throw new Error("couldnt find it iojf" + this.value);
    }
    static orTypeSpecifier(value) {
        let class_ = (value.match("^([A-Z]|[a-z]|[0-9])+") ?? [""])[0];
        let arrayLevels = 0;
        if (class_ == value)
            return new Identifier(value);
        if (value.slice(class_.length).startsWith("[]")) {
            arrayLevels = (value.length - class_.length) / 2;
        }
        return new TypeSpecifier(new Identifier(class_), arrayLevels);
    }
}
class TypeSpecifier {
    constructor(class_, arrayLevels) {
        this.class = class_;
        this.arrayLevels = arrayLevels;
    }
    getType(method, class_, code) {
        let classType = this.class.getType(method, class_, code);
        if (!classType)
            return null;
        return new ILType(classType.class, this.arrayLevels);
    }
    toString() {
        return this.class.value + "[]".repeat(this.arrayLevels);
    }
}
var PREDEFINED_TYPE;
(function (PREDEFINED_TYPE) {
    PREDEFINED_TYPE[PREDEFINED_TYPE["Int"] = 0] = "Int";
    PREDEFINED_TYPE[PREDEFINED_TYPE["String"] = 1] = "String";
    PREDEFINED_TYPE[PREDEFINED_TYPE["Float"] = 2] = "Float";
    PREDEFINED_TYPE[PREDEFINED_TYPE["Bool"] = 3] = "Bool";
})(PREDEFINED_TYPE || (PREDEFINED_TYPE = {}));
class LocalDeclaration {
    constructor(type, identifier, initializer) {
        this.type = type;
        this.identifier = identifier;
        this.initializer = initializer;
    }
}
class Expression {
    constructor(left, right, operation) {
        this.left = left;
        this.right = right;
        this.operation = operation;
    }
    getType(method, class_, code) {
        if (this.operation == OPERATOR.AccessMethod) {
            let leftType = this.left.getType(method, class_, code);
            // console.log(leftType.methods)
            let method_ = leftType.class.methods.find(m => m.name == this.right.value);
            if (!method_)
                return null;
            return method_;
        }
        else if (this.operation == OPERATOR.Invoke) {
            return this.left.getType(method, class_, code).returnType;
        }
        else if (this.operation == OPERATOR.Access) {
            let leftType = this.left.getType(method, class_, code);
            if (leftType == null)
                throw new Error("fuck");
            let field = leftType.class.fields.find(f => f.identifier == this.right.value);
            if (!field)
                return null;
            return field.type;
        }
        else if (this.operation == OPERATOR.Index) {
            return this.left.getType(method, class_, code);
        }
        return new ILType(int32);
    }
}
class IfStatement {
    constructor(condition, statement, elseStatement) {
        this.condition = condition;
        this.statement = statement;
        this.elseStatement = elseStatement;
    }
}
class ForStatement {
    constructor(declaration, condition, increment, statement) {
        this.declaration = declaration;
        this.condition = condition;
        this.increment = increment;
        this.statement = statement;
    }
}
class ReturnStatement {
    constructor(statement) {
        this.statement = statement;
    }
}
class BreakKeyword {
    constructor() {
        this._ = 0;
    }
}
class ContinueKeyword {
    constructor() {
        this._ = 0;
    }
}
class Parameter {
    constructor(type, identifier) {
        this.type = type;
        this.identifier = identifier;
    }
}
class ParameterList {
    constructor(parameters = []) {
        this.parameters = parameters;
    }
}
class ArgumentList {
    constructor(...arguments_) {
        this.arguments = arguments_;
    }
    getType() {
        return null;
    }
}
class ClassDeclaration {
    constructor(identifier, methods = [], fields = []) {
        this.identifer = identifier;
        this.methods = methods;
        this.fields = fields;
    }
}
class FieldDeclaration {
    constructor(type, identifier, static_ = false, initializer) {
        this.type = type;
        this.identifier = identifier;
        this.static = static_;
        this.initializer = initializer;
    }
}
class MethodDeclaration {
    constructor(returnType, identifier, parameters, static_ = false, body) {
        this.returnType = returnType;
        this.identifier = identifier;
        this.parameters = parameters;
        this.static = static_;
        this.body = body;
    }
}
class CompilationUnit {
    constructor(...classes) {
        this.classes = classes;
    }
}
var consoleLog = console.log;
function stringifyILClass(c) {
    let seen = [];
    return JSON.stringify(c, (key, val) => {
        if (key == "code") {
            return val.map((v) => `${OPCODE[v.opcode]} ${v.operand}`);
        }
        // if(key == "opcode") return OPCODE[val];
        if (val != null && typeof val == "object") {
            if (val.constructor.name == "ILClass" && seen.length > 1)
                return "(ILClass) " + val.name;
            if (seen.indexOf(val) >= 0) {
                return val.constructor.name;
            }
            seen.push(val);
        }
        return val;
    }, 2);
}
console.log = (...stuffs) => {
    if (stuffs[0].constructor.name == "ILClass") {
        console.log(stringifyILClass(stuffs[0]));
        return;
    }
    if (stuffs[0].constructor.name == "ILCode") {
        let total = "";
        for (let i = 0; i < stuffs[0].classes.length; i++) {
            total += stringifyILClass(stuffs[0].classes[i]) + ",\n";
        }
        console.log(total.slice(0, -2));
        return;
    }
    if (stuffs[0] != null && !["Block", "ClassDeclaration", "CompilationUnit"].includes(stuffs[0].constructor.name)) {
        consoleLog(...stuffs);
        return;
    }
    let stack = [{ key: "", value: stuffs[0], depth: 0 }];
    let str = "\n";
    for (let j = 0; j < 20000; j++) {
        if (j > 19999)
            console.log("stopping");
        let top = stack.pop();
        if (top == null)
            break;
        str += "  ".repeat(top.depth);
        if (typeof top.value == "string") {
            str += `${top.key}: "${top.value}"\n`;
            continue;
        }
        else if (typeof top.value == "number") {
            if (top.key == "operation") {
                str += `${top.key}: ${OPERATOR[top.value]}\n`;
            }
            else {
                str += `${top.key}: ${top.value}\n`;
            }
            continue;
        }
        else if (!top.value) {
            str += `${top.key}: null\n`;
            continue;
        }
        else {
            if (j != 0) {
                str += `${top.key}: ${top.value.constructor.name}\n`;
            }
            top.depth++;
        }
        let keys = Object.keys(top.value).reverse();
        for (let i in keys) {
            let key = keys[i];
            let value = top.value[key];
            stack.push({ key, value, depth: top.depth });
        }
    }
    console.log(str);
};
// const jsonStringify = JSON.stringify;
// //@ts-ignore
// JSON.stringify = (value, replacer, space) => {
//     if(replacer == null) {
//         let seen: any[] = [];
//         return jsonStringify(value, (key, val) => {
//             if (val != null && typeof val == "object") {
//                 if (seen.indexOf(val) >= 0) {
//                     return;
//                 }
//                 seen.push(val);
//             }
//             return val;     
//         }, space) 
//     }
//     //@ts-ignore
//     return jsonStringify(value,replacer,space)
// }
// type a = typeof JSON.stringify
function findClosingParentheses(code, type, offset = 0) {
    let stack = 0;
    for (let i = offset; i < code.length; i += 2) {
        if (code[i] == TOKEN_TYPE.SEPERATOR && code[i + 1] == type[0]) {
            stack++;
            continue;
        }
        if (code[i] == TOKEN_TYPE.SEPERATOR && code[i + 1] == type[1]) {
            stack--;
            if (stack == 0)
                return i;
            continue;
        }
    }
    return -1;
}
function parseSide(code, offset) {
    // console.log(code.slice(offset))
    if (code[offset + 0] == TOKEN_TYPE.SEPERATOR &&
        code[offset + 1] == "(" &&
        code[offset + 2] == TOKEN_TYPE.SEPERATOR &&
        code[offset + 3] == ")") {
        return { side: new ArgumentList(), offset: offset + 2 };
    }
    else if (code[offset] == TOKEN_TYPE.SEPERATOR &&
        code[offset + 1] == "(") {
        //find the ending one using a stack but not actually a stack and just a counter that cant go below 0
        //then recursively call this function
        //also assign offset to right after the ending seperator that was found
        let endingParenthesesIndex = findClosingParentheses(code, "()", offset);
        if (endingParenthesesIndex == -1) {
            throw new Error("ending parenthesis index is -1");
        }
        let section = code.slice(offset + 2, endingParenthesesIndex);
        return { side: lexicalDataToExpression(section), offset: endingParenthesesIndex };
    }
    else { //if not then its just a literal or an identifier
        if (code[offset] == TOKEN_TYPE.LITERAL) {
            return { side: new Literal(Number.isNaN(+code[offset + 1]) ? code[offset + 1].slice(1, -1) : +code[offset + 1]), offset: offset }; //should these return offset instead of 0?
        }
        else if (code[offset] == TOKEN_TYPE.IDENTIFIER) {
            return { side: Identifier.orTypeSpecifier(code[offset + 1]), offset: offset };
        }
    }
    return { side: new Literal(-100), offset: 0 }; //should never happen
}
function lexicalDataToExpression(code) {
    let entries = [{ operands: [], operators: [] }];
    let offset = 0;
    //console.log("c");
    //printAnalysis(code);
    while (true) {
        let parsed = parseSide(code, offset);
        // console.log(parsed)
        entries.at(-1).operands.push(parsed.side);
        offset = parsed.offset;
        offset += 2;
        if (!(code[offset] == TOKEN_TYPE.OPERATOR || (code[offset] == TOKEN_TYPE.SEPERATOR && code[offset + 1] == ",")))
            break;
        if (code[offset + 1] == ",") {
            entries.push({ operands: [], operators: [] });
        }
        else {
            entries.at(-1).operators.push(OperatorSymbols[code[1 + offset]]);
        }
        offset += 2;
    }
    //console.log(entries);
    // console.log(operands, operators)
    for (let j = 0; j < entries.length; j++) {
        loop2: while (true) {
            if (entries[j].operators.length == 0)
                break loop2;
            let bestLevel = 0;
            let bestIndex = -1;
            for (let i = 0; i < entries[j].operators.length; i++) {
                if (OperatorOrderOfOperations[entries[j].operators[i]] > bestLevel) {
                    bestLevel = OperatorOrderOfOperations[entries[j].operators[i]];
                    bestIndex = i;
                }
            }
            let left = entries[j].operands[bestIndex];
            let right = entries[j].operands[bestIndex + 1];
            let operator = entries[j].operators[bestIndex];
            if ((operator == OPERATOR.Invoke || operator == OPERATOR.Create) && right.constructor.name != "ArgumentList") {
                right = new ArgumentList(right);
            }
            let expression = new Expression(left, right, operator);
            entries[j].operands.splice(bestIndex, 2, expression);
            entries[j].operators.splice(bestIndex, 1);
        }
    }
    if (entries.length == 1) {
        return entries[0].operands[0];
    }
    else {
        return new ArgumentList(...entries.map(e => e.operands[0]));
    }
    // return operands[0] as Expression;
}
function lexicalDataToELI(tokens) {
    //printAnalysis(tokens);
    if (tokens.length == 2) {
        if (tokens[0] == TOKEN_TYPE.IDENTIFIER) {
            return new Identifier(tokens[1]);
        }
        else {
            return new Literal(+tokens[1]);
        }
    }
    else {
        return lexicalDataToExpression(tokens);
    }
}
function lexicalDataToBlock(tokens) {
    //printAnalysis(tokens);
    // let startTime = performance.now();
    //split properly
    //recursively call when {}
    let linesTokens = [];
    let linesTree = new Block();
    let lineStart = 0;
    for (let i = 0; i < tokens.length; i += 2) {
        //add special exception for for statements
        if (tokens[i] == TOKEN_TYPE.KEYWORD && tokens[i + 1] == "for") {
            let parenthesesEnding = findClosingParentheses(tokens, "()", i);
            let bracketsEnding = findClosingParentheses(tokens, "{}", parenthesesEnding);
            // console.log(bracketsEnding)
            linesTokens.push(tokens.slice(lineStart, bracketsEnding + 2));
            // console.log("fsef", tokens.slice(lineStart, bracketsEnding + 2));
            i = bracketsEnding;
            lineStart = i + 2;
            continue;
        }
        if (tokens[i] == TOKEN_TYPE.SEPERATOR) {
            if (tokens[i + 1] == ";") {
                linesTokens.push(tokens.slice(lineStart, i));
                lineStart = i + 2;
                continue;
            }
            if (tokens[i + 1] == "{") {
                let ending = findClosingParentheses(tokens, "{}", i);
                if (tokens[ending + 2] == TOKEN_TYPE.KEYWORD && tokens[ending + 3] == "else") {
                    ending = findClosingParentheses(tokens, "{}", ending + 4);
                }
                // throw new Error(tokens.slice(lineStart, ending + 2));
                linesTokens.push(tokens.slice(lineStart, ending + 2));
                // console.log("e", tokens.slice(lineStart, ending + 2))
                i = ending;
                lineStart = i + 2;
                continue;
            }
        }
        if (i == tokens.length - 2) {
            linesTokens.push(tokens.slice(lineStart, i + 2).concat());
        }
    }
    // console.log(`first part in ${performance.now() - startTime}ms`);
    // console.log("asfd");
    // console.log(linesTokens);
    // return new Block();
    // let startTime2 = performance.now();
    for (let i = 0; i < linesTokens.length; i++) {
        let line = linesTokens[i];
        if (line[0] == TOKEN_TYPE.KEYWORD && line[1] == "if") {
            let conditionEnding = findClosingParentheses(line, "()");
            let conditon = lexicalDataToExpression(line.slice(4, conditionEnding));
            let ifStatementStart = conditionEnding + 2;
            let ifStatementEnd = findClosingParentheses(line, "{}", ifStatementStart) + 2;
            let ifStatement = lexicalDataToBlock(line.slice(ifStatementStart + 2, ifStatementEnd - 2));
            let elseStatement = null;
            if (line[ifStatementEnd] == TOKEN_TYPE.KEYWORD && line[ifStatementEnd + 1] == "else") {
                // console.log("else")
                elseStatement = lexicalDataToBlock(line.slice(ifStatementEnd + 4, -2));
            }
            linesTree.add(new IfStatement(conditon, ifStatement, elseStatement));
            continue;
        }
        //ok uh DONT USE ; NOTATION FOR IF STATEMENTS!!
        //actually do
        if (line[0] == TOKEN_TYPE.KEYWORD && line[1] == "for") {
            // console.log(line)
            let thingEnding = findClosingParentheses(line, "()");
            let [declaration, condition, increment] = lexicalDataToBlock(line.slice(4, thingEnding)).data;
            // console.log("fe", declaration, condition, increment);
            //error detection
            let statementStart = thingEnding + 2;
            let statementEnd = findClosingParentheses(line, "{}", statementStart) + 2;
            // console.log("this", line.slice(statementStart + 2, statementEnd - 2))
            linesTree.add(new ForStatement(declaration, condition, increment, lexicalDataToBlock(line.slice(statementStart + 2, statementEnd - 2))));
            // i += 2;
            continue;
        }
        if (line[0] == TOKEN_TYPE.IDENTIFIER && line[2] == TOKEN_TYPE.IDENTIFIER) {
            let type;
            let identifier;
            let initializer;
            type = line[1];
            identifier = line[3];
            //generalize
            // if(line.length == 8) {
            //     if(line[6] == TOKEN_TYPE.IDENTIFIER) {
            //         initializer = new Identifier(line[7] as string)
            //     } else {
            //         initializer = new Literal(+line[7])
            //     }
            // } else {
            //     initializer = lexicalDataToExpression(line.slice(6)) as Expression;
            // }
            initializer = lexicalDataToELI(line.slice(6));
            linesTree.add(new LocalDeclaration(Identifier.orTypeSpecifier(type), identifier, initializer));
            //add errors
            continue;
        }
        if (line[0] == TOKEN_TYPE.KEYWORD && line[1] == "continue") {
            linesTree.add(new ContinueKeyword());
        }
        if (line[0] == TOKEN_TYPE.KEYWORD && line[1] == "break") {
            linesTree.add(new BreakKeyword());
        }
        if (line[0] == TOKEN_TYPE.KEYWORD && line[1] == "return") {
            linesTree.add(new ReturnStatement(line.length == 2 ?
                undefined :
                parseSide(line, 2).side));
        }
        linesTree.add(lexicalDataToExpression(line));
    }
    // console.log(`second part in ${performance.now() - startTime2}ms`);
    // console.log(`in ${performance.now() - startTime}ms`);
    // performanceTests.tree = performance.now() - startTime;
    return linesTree;
}
function lexicalDataToClass(tokens, start) {
    // printAnalysis(tokens);
    let class_ = new ClassDeclaration(tokens[start + 3]);
    // let openingBracketsIndex = 4;
    // let endingBracketsIndex = findClosingParentheses(tokens, "{}", 4);
    let offset = 6 + start;
    while (true) {
        let static_ = false;
        let type = "";
        let name = "";
        let initializer;
        let lineOffset = 0;
        //printAnalysis(tokens.slice(offset));
        if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
            tokens[offset + lineOffset + 1] == "}") {
            break;
        }
        if (tokens[offset + lineOffset] == TOKEN_TYPE.KEYWORD &&
            tokens[offset + lineOffset + 1] == "static") {
            static_ = true;
            lineOffset += 2;
        }
        if (tokens[offset + lineOffset] == TOKEN_TYPE.IDENTIFIER) {
            type = tokens[offset + lineOffset + 1];
            lineOffset += 2;
        }
        if (tokens[offset + lineOffset] == TOKEN_TYPE.IDENTIFIER) {
            name = tokens[offset + lineOffset + 1];
            lineOffset += 2;
        }
        if (tokens[offset + lineOffset] == TOKEN_TYPE.OPERATOR &&
            tokens[offset + lineOffset + 1] == "=") {
            let start = lineOffset;
            while (true) {
                lineOffset += 2;
                if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
                    tokens[offset + lineOffset + 1] == ";") {
                    break;
                }
            }
            initializer = lexicalDataToELI(tokens.slice(offset + start + 2, offset + lineOffset));
            // console.log(tokens.slice(offset + start, offset + lineOffset))
            //BUh
        }
        if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
            tokens[offset + lineOffset + 1] == ";") {
            class_.fields.push(new FieldDeclaration(Identifier.orTypeSpecifier(type), name, static_, initializer)); //modifiers
            lineOffset += 2;
            offset += lineOffset;
            continue;
        }
        if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
            tokens[offset + lineOffset + 1] == "(") {
            lineOffset += 2;
        }
        else {
            //printAnalysis(tokens.slice(offset + lineOffset));
            throw new Error("hreo");
        }
        let parameters = new ParameterList();
        loop2: while (true) {
            let parameter = new Parameter(new Identifier(""), "");
            if (tokens[offset + lineOffset] == TOKEN_TYPE.IDENTIFIER) {
                parameter.type = Identifier.orTypeSpecifier(tokens[offset + lineOffset + 1]);
                lineOffset += 2;
            }
            if (tokens[offset + lineOffset] == TOKEN_TYPE.IDENTIFIER) {
                parameter.identifier = tokens[offset + lineOffset + 1];
                lineOffset += 2;
                parameters.parameters.push(parameter);
            }
            if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
                tokens[offset + lineOffset + 1] == ",") {
                lineOffset += 2;
            }
            if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
                tokens[offset + lineOffset + 1] == ")") {
                lineOffset += 2;
            }
            else {
                continue;
            }
            if (tokens[offset + lineOffset] == TOKEN_TYPE.SEPERATOR &&
                tokens[offset + lineOffset + 1] == "{") {
                let ending = findClosingParentheses(tokens, "{}", offset + lineOffset);
                lineOffset += 2;
                class_.methods.push(new MethodDeclaration(Identifier.orTypeSpecifier(type), name, parameters, static_, lexicalDataToBlock(tokens.slice(offset + lineOffset, ending))));
                offset = ending + 2;
                break loop2;
            }
            else {
                throw new Error("qhar");
            }
        }
    }
    return class_;
}
function lexicalDataToCompilationUnit(tokens) {
    let unit = new CompilationUnit();
    let offset = 0;
    while (true) {
        if (offset >= tokens.length)
            break;
        if (tokens[offset] == TOKEN_TYPE.KEYWORD && tokens[offset + 1] == "class") {
            let end = findClosingParentheses(tokens, "{}", offset);
            unit.classes.push(lexicalDataToClass(tokens, offset));
            //printAnalysis(tokens.slice(offset, end));
            offset = end;
        }
        else {
            offset += 2;
        }
    }
    return unit;
}
function expressionToIL(expression, method, class_, code) {
    let instrs = [];
    function processElement(element) {
        if (element.constructor.name == "Expression") {
            instrs.push(...expressionToIL(element, method, class_, code));
        }
        else if (element.constructor.name == "Identifier") {
            if (element.value == "this") {
                instrs.push({ opcode: OPCODE.ldarg, operand: 0 });
            }
            else {
                let identifierIndex = method.locals.findIndex(local => local.identifier == element.value);
                let argumentIndex = method.arguments.findIndex(arg => arg.identifier == element.value);
                let classesIndex = code.classes.findIndex(c => c.name == element.value);
                if (identifierIndex != -1) {
                    instrs.push({ opcode: OPCODE.ldloc, operand: identifierIndex });
                }
                else if (argumentIndex != -1) {
                    instrs.push({ opcode: OPCODE.ldarg, operand: argumentIndex + (method.static ? 0 : 1) });
                }
                else if (classesIndex != -1) {
                    return true;
                }
                else {
                    throw new Error("couldnt find identifier " + element.value);
                }
            }
        }
        else {
            if (typeof element.value == "string") {
                instrs.push({ opcode: OPCODE.ldstr, operand: element.value });
            }
            else {
                instrs.push({ opcode: OPCODE.ldc_i4, operand: element.value });
            }
        }
        return null;
    }
    if (expression.operation == OPERATOR.Create) {
        for (let i in expression.right.arguments) {
            let argument = expression.right.arguments[i];
            processElement(argument);
        }
        instrs.push({ opcode: OPCODE.newobj, operand: expression.left.value + ".ctor" });
    }
    else if (expression.operation == OPERATOR.CreateArray) {
        processElement(expression.right);
        instrs.push({
            opcode: OPCODE.newarr,
            operand: expression.left.constructor.name == "TypeSpecifier" ?
                expression.left.toString() :
                expression.left.value
        });
    }
    else if (expression.operation == OPERATOR.Access) {
        let static_ = processElement(expression.left);
        let fieldName = expression.right.value;
        if (static_) {
            instrs.push({ opcode: OPCODE.ldsfld, operand: `${expression.left.value}.${fieldName}` });
        }
        else {
            let className = expression.left.getType(method, class_, code).class.name;
            instrs.push({ opcode: OPCODE.ldfld, operand: `${className}.${fieldName}` });
        }
    }
    else if (expression.operation == OPERATOR.Index) {
        processElement(expression.left);
        processElement(expression.right);
        let className = expression.left.getType(method, class_, code).class.name || "";
        instrs.push({ opcode: OPCODE.ldelem, operand: className });
    }
    else if (expression.operation == OPERATOR.Invoke) {
        if (!expression.left.getType(method, class_, code).static) {
            processElement(expression.left.left);
        }
        for (let i in expression.right.arguments) {
            let argument = expression.right.arguments[i];
            processElement(argument);
        }
        if (expression.left.constructor.name == "Expression") {
            let className = expression.left.left.getType(method, class_, code).class.name;
            let methodName = expression.left.right.value;
            instrs.push({ opcode: OPCODE.call, operand: `${className}.${methodName}` });
        }
    }
    else if (expression.operation == OPERATOR.Assign) {
        if (expression.left.constructor.name == "Identifier") {
            let localIndex = method.locals.findIndex(a => a.identifier == expression.left.value);
            processElement(expression.right);
            instrs.push({ opcode: OPCODE.stloc, operand: localIndex });
        }
        else if (expression.left.constructor.name == "Expression") {
            processElement(expression.left);
            let last = instrs.pop();
            processElement(expression.right);
            instrs.push({
                opcode: last?.opcode == OPCODE.ldfld ? OPCODE.stfld :
                    last?.opcode == OPCODE.ldsfld ? OPCODE.stsfld :
                        OPCODE.stelem,
                operand: last?.operand
            });
        }
    }
    else {
        for (let i = 0; i < 2; i++) {
            let flip = false;
            if ([OPERATOR.Divide, OPERATOR.Subtract, OPERATOR.Modulus].includes(expression.operation)) {
                flip = true;
            }
            let side = ["left", "right"][flip ? i : 1 - i];
            processElement(expression[side]);
            // if(expression[side].constructor.name == "Expression") {
            //     instrs.push(...expressionToIL(expression[side] as Expression, method, code));
            // } else if(expression[side].constructor.name == "Identifier") {
            //     let identifierIndex = method.locals.findIndex(local => local.identifier == (expression[side] as Identifier).value)
            //     if(identifierIndex == -1) {
            //         throw new Error("couldnt find local " + (expression[side] as Identifier).value);
            //     }
            //     instrs.push({opcode: OPCODE.ldloc, operand: identifierIndex});
            // } else {
            //     instrs.push({opcode: OPCODE.ldc_i4, operand: (expression[side] as Literal).value}); //switch between i4 and ldc_i4
            // }
        }
    }
    switch (expression.operation) {
        case OPERATOR.Modulus:
            instrs.push({ opcode: OPCODE.rem, operand: null });
            break;
        case OPERATOR.Multiply:
            instrs.push({ opcode: OPCODE.mul, operand: null });
            break;
        case OPERATOR.Divide:
            instrs.push({ opcode: OPCODE.div, operand: null });
            break;
        case OPERATOR.Add:
            instrs.push({ opcode: OPCODE.add, operand: null });
            break;
        case OPERATOR.Subtract:
            instrs.push({ opcode: OPCODE.sub, operand: null });
            break;
        case OPERATOR.GreaterThan:
            instrs.push({ opcode: OPCODE.cgt, operand: null });
            break;
        case OPERATOR.GreaterThanEqualTo:
            instrs.push({ opcode: OPCODE.cge, operand: null });
            break;
        case OPERATOR.NotEqualTo:
            instrs.push({ opcode: OPCODE.cne, operand: null });
            break;
        case OPERATOR.EqualTo:
            instrs.push({ opcode: OPCODE.ceq, operand: null });
            break;
        case OPERATOR.LessThan:
            instrs.push({ opcode: OPCODE.clt, operand: null });
            break;
        case OPERATOR.LessThanEqualTo:
            instrs.push({ opcode: OPCODE.cle, operand: null });
            break;
        case OPERATOR.And:
            instrs.push({ opcode: OPCODE.and, operand: null });
            break;
        case OPERATOR.Or:
            instrs.push({ opcode: OPCODE.or, operand: null });
            break;
        case OPERATOR.Xor:
            instrs.push({ opcode: OPCODE.xor, operand: null });
            break;
        case OPERATOR.Assign: break;
        case OPERATOR.Create: break;
        case OPERATOR.Access: break;
        case OPERATOR.Invoke: break;
        case OPERATOR.Index: break;
    }
    return instrs;
}
function processELI(thing, method, class_, code) {
    if (thing.constructor.name == "Literal") {
        method.emit(OPCODE.ldc_i4, thing.value);
    }
    else if (thing.constructor.name == "Identifier") {
        let localIndex = method.locals.findIndex(a => a.identifier == thing.value);
        method.emit(OPCODE.ldloc, localIndex);
    }
    else {
        method.code.push(...expressionToIL(thing, method, class_, code));
    }
}
function processLocalDeclaration(line, method, class_, code) {
    if (method.locals.findIndex(a => a.identifier == line.identifier) == -1) {
        let type = line.type.getType(method, class_, code);
        if (!type)
            throw new Error("oishefffff");
        method.locals.push({ type, identifier: line.identifier });
        processELI(line.initializer, method, class_, code);
        method.emit(OPCODE.stloc, method.locals.length - 1);
    }
}
function processThing(condition, method, class_, code) {
    if (condition.constructor.name == "Literal") {
        method.emit(OPCODE.ldc_i4, condition.value);
    }
    else if (condition.constructor.name == "Identifier") {
        let localIndex = method.locals.findIndex(a => a.identifier == condition.value);
        method.emit(OPCODE.ldloc, localIndex);
    }
    else {
        method.code.push(...expressionToIL(condition, method, class_, code));
    }
}
function blockToIL(block, method, class_, code) {
    let startTime = performance.now();
    for (let i = 0; i < block.data.length; i++) {
        let line = block.data[i];
        if (line.constructor.name == "Expression") {
            method.code.push(...expressionToIL(line, method, class_, code));
            continue;
        }
        if (line.constructor.name == "LocalDeclaration") {
            line = line;
            processLocalDeclaration(line, method, class_, code);
        }
        if (line.constructor.name == "IfStatement") {
            line = line;
            processThing(line.condition, method, class_, code);
            method.emit(OPCODE.brfalse, 0);
            let conditionBranchLocation = method.code.length - 1;
            blockToIL(line.statement, method, class_, code);
            method.code[conditionBranchLocation].operand = method.code.length + (line.elseStatement ? 1 : 0);
            if (line.elseStatement != null) {
                method.emit(OPCODE.br, 0);
                let elseBranchLocation = method.code.length - 1;
                blockToIL(line.elseStatement, method, class_, code);
                method.code[elseBranchLocation].operand = method.code.length;
            }
        }
        if (line.constructor.name == "ForStatement") {
            line = line;
            processLocalDeclaration(line.declaration, method, class_, code);
            method.emit(OPCODE.nop, null);
            let startLocation = method.code.length - 1;
            blockToIL(line.statement, method, class_, code);
            let statementEnd = method.code.length - 1;
            // code.emit(OPCODE.nop, null);
            method.code.push(...expressionToIL(line.increment, method, class_, code));
            processThing(line.condition, method, class_, code);
            method.emit(OPCODE.brtrue, startLocation);
            for (let i = startLocation; i < method.code.length; i++) {
                if (method.code[i].opcode == OPCODE.br && method.code[i].operand == -1) { //continue
                    method.code[i].operand = statementEnd + 1;
                }
                if (method.code[i].opcode == OPCODE.br && method.code[i].operand == -2) { //break
                    method.code[i].operand = method.code.length + 1;
                }
            }
        }
        if (line.constructor.name == "ContinueKeyword") {
            method.emit(OPCODE.br, -1);
        }
        if (line.constructor.name == "BreakKeyword") {
            method.emit(OPCODE.br, -2);
        }
        if (line.constructor.name == "ReturnStatement") {
            line = line;
            if (line.statement)
                processThing(line.statement, method, class_, code);
            method.emit(OPCODE.ret, null);
        }
    }
    // performanceTests.il = performance.now() - startTime;
    //return method;
}
function compilationUnitToIL(compilationUnit) {
    var code = new ILCode([int32, int8, string, console_]);
    var offset = code.classes.length;
    for (let i = 0; i < compilationUnit.classes.length; i++) {
        let class_ = compilationUnit.classes[i];
        let ilClass = new ILClass(class_.identifer);
        code.classes.push(ilClass);
        // for(let j = 0; j < class_.fields.length; j++) {
        //     let field = class_.fields[j]
        // }
    }
    //remember builtins
    for (let i = 0; i < compilationUnit.classes.length; i++) {
        let class_ = compilationUnit.classes[i];
        for (let j = 0; j < class_.methods.length; j++) {
            let method = class_.methods[j];
            // let returnType = code.typeToClass(method.returnType);
            let returnType = method.returnType.getType(null, code.classes[i + offset], code);
            code.classes[i + offset].methods.push(new ILMethod(method.identifier, returnType, method.static, method.parameters.parameters.map(p => {
                // let type = code.typeToClass(p.type);
                let type = p.type.getType(null, code.classes[i + offset], code);
                if (!type)
                    throw new Error("ijd");
                return { identifier: p.identifier, type };
            })));
        }
        for (let j = 0; j < class_.fields.length; j++) {
            let field = class_.fields[j];
            // let type = code.typeToClass(field.type);
            let type = field.type.getType(null, code.classes[i + offset], code);
            // Identifier.orTypeSpecifier(field.type).getType(null, code.classes[i + offset], code);
            if (!type)
                throw new Error("isoje");
            code.classes[i + offset].fields.push(new ILField(type, field.identifier, field.static));
            if (field.initializer != null) {
                let relevantName = field.static ? "cctor" : "ctor";
                let relevantMethod = code.classes[i + offset].methods.find(m => m.name == relevantName);
                if (!relevantMethod) {
                    relevantMethod = new ILMethod(relevantName, null, field.static, [], []);
                    code.classes[i + offset].methods.push(relevantMethod);
                }
                processELI(new Expression(new Expression(new Identifier(field.static ? code.classes[i + offset].name : "this"), new Identifier(field.identifier), OPERATOR.Access), field.initializer, OPERATOR.Assign), relevantMethod, code.classes[i + offset], code);
            }
        }
    }
    for (let i = 0; i < compilationUnit.classes.length; i++) {
        let class_ = compilationUnit.classes[i];
        for (let j = 0; j < class_.methods.length; j++) {
            let method = class_.methods[j];
            blockToIL(method.body, code.classes[i + offset].methods[j], code.classes[i + offset], code);
            // console.log(code.classes[i + offset])
        }
    }
    // console.log(code);
    return code;
}
/*
line types:
- expression
    - the rest
- declaraton (freaky)
    - starts with a type keyword
- control thing
    - starts with the control word
    - if, for, return
- function calling
    - starts with an identifier
*/
function printAnalysis(a) {
    let outStr = "\n";
    for (let i = 0; i < a.length; i += 2) {
        outStr += TOKEN_TYPE[a[i]] + ", " + a[i + 1] + "\n";
    }
    console.log(outStr);
}
// console.clear();
// console.log(new Block(lexicaldatatoexpression(res)));
//#endregion syntax_tree
//#region interpreting
/*
.locals [
    [0] int32 hi
]

ldc.i4 5
ldc.i4 2
mul
stloc 1
*/
var OPCODE;
(function (OPCODE) {
    OPCODE[OPCODE["add"] = 0] = "add";
    OPCODE[OPCODE["add_un"] = 1] = "add_un";
    OPCODE[OPCODE["and"] = 2] = "and";
    OPCODE[OPCODE["beq"] = 3] = "beq";
    OPCODE[OPCODE["bge"] = 4] = "bge";
    OPCODE[OPCODE["bge_un"] = 5] = "bge_un";
    OPCODE[OPCODE["bgt"] = 6] = "bgt";
    OPCODE[OPCODE["bgt_un"] = 7] = "bgt_un";
    OPCODE[OPCODE["ble"] = 8] = "ble";
    OPCODE[OPCODE["ble_un"] = 9] = "ble_un";
    OPCODE[OPCODE["blt"] = 10] = "blt";
    OPCODE[OPCODE["blt_un"] = 11] = "blt_un";
    OPCODE[OPCODE["bne"] = 12] = "bne";
    OPCODE[OPCODE["bne_un"] = 13] = "bne_un";
    OPCODE[OPCODE["br"] = 14] = "br";
    OPCODE[OPCODE["brfalse"] = 15] = "brfalse";
    OPCODE[OPCODE["brtrue"] = 16] = "brtrue";
    OPCODE[OPCODE["call"] = 17] = "call";
    OPCODE[OPCODE["ceq"] = 18] = "ceq";
    OPCODE[OPCODE["cne"] = 19] = "cne";
    OPCODE[OPCODE["cgt"] = 20] = "cgt";
    OPCODE[OPCODE["cge"] = 21] = "cge";
    OPCODE[OPCODE["cgt_un"] = 22] = "cgt_un";
    OPCODE[OPCODE["clt"] = 23] = "clt";
    OPCODE[OPCODE["cle"] = 24] = "cle";
    OPCODE[OPCODE["clt_un"] = 25] = "clt_un";
    //conversions
    OPCODE[OPCODE["div"] = 26] = "div";
    OPCODE[OPCODE["div_un"] = 27] = "div_un";
    OPCODE[OPCODE["dup"] = 28] = "dup";
    OPCODE[OPCODE["jmp"] = 29] = "jmp";
    OPCODE[OPCODE["ldarg"] = 30] = "ldarg";
    OPCODE[OPCODE["ldc_i4"] = 31] = "ldc_i4";
    OPCODE[OPCODE["ldc_r4"] = 32] = "ldc_r4";
    OPCODE[OPCODE["ldelem"] = 33] = "ldelem";
    OPCODE[OPCODE["ldfld"] = 34] = "ldfld";
    OPCODE[OPCODE["ldsfld"] = 35] = "ldsfld";
    OPCODE[OPCODE["ldloc"] = 36] = "ldloc";
    OPCODE[OPCODE["ldstr"] = 37] = "ldstr";
    OPCODE[OPCODE["mul"] = 38] = "mul";
    OPCODE[OPCODE["mul_un"] = 39] = "mul_un";
    OPCODE[OPCODE["neg"] = 40] = "neg";
    OPCODE[OPCODE["newarr"] = 41] = "newarr";
    OPCODE[OPCODE["newobj"] = 42] = "newobj";
    OPCODE[OPCODE["nop"] = 43] = "nop";
    OPCODE[OPCODE["not"] = 44] = "not";
    OPCODE[OPCODE["or"] = 45] = "or";
    OPCODE[OPCODE["pop"] = 46] = "pop";
    OPCODE[OPCODE["rem"] = 47] = "rem";
    OPCODE[OPCODE["rem_un"] = 48] = "rem_un";
    OPCODE[OPCODE["ret"] = 49] = "ret";
    OPCODE[OPCODE["shl"] = 50] = "shl";
    OPCODE[OPCODE["shr"] = 51] = "shr";
    OPCODE[OPCODE["stelem"] = 52] = "stelem";
    OPCODE[OPCODE["stfld"] = 53] = "stfld";
    OPCODE[OPCODE["stsfld"] = 54] = "stsfld";
    OPCODE[OPCODE["stloc"] = 55] = "stloc";
    OPCODE[OPCODE["sub"] = 56] = "sub";
    OPCODE[OPCODE["sub_un"] = 57] = "sub_un";
    OPCODE[OPCODE["xor"] = 58] = "xor";
})(OPCODE || (OPCODE = {}));
//add a CreateInstructoin thing that returns a type based on the argument that uses the {} | {} thing asjdfioasef
class ILField {
    constructor(type, identifier, static_ = false) {
        this.type = type;
        this.identifier = identifier;
        this.static = static_;
    }
}
class ILMethod {
    get effectiveArguments() { return this.arguments.length + (this.static || this.name == "ctor" ? 0 : 1); }
    constructor(name, returnType = null, static_ = false, args = [], locals = []) {
        this.locals = [];
        this.code = [];
        this.function = null;
        this.name = name;
        this.returnType = returnType;
        this.arguments = args;
        this.static = static_;
        this.locals = locals;
    }
    emit(opcode, operand) {
        this.code.push({ opcode: opcode, operand: operand });
    }
}
class ILClass {
    constructor(name, inheritances = null, fields = [], methods = []) {
        this.name = name;
        this.inheritances = inheritances;
        this.fields = fields;
        this.methods = methods;
    }
    byteSize(static_ = false) {
        if (this.name == "Int8")
            return static_ ? 0 : 1;
        if (this.name == "Int32")
            return static_ ? 0 : 4;
        if (this.name == "String")
            return static_ ? 0 : 4;
        let sum = 0;
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].static != static_)
                continue;
            sum += this.fields[i].type.byteSize();
        }
        return sum;
    }
    getFieldOffset(field) {
        let offset = 0;
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].identifier == field.identifier)
                return offset;
            if (this.fields[i].static != field.static)
                continue;
            offset += this.fields[i].type.byteSize();
        }
        throw new Error("ok");
    }
}
class ILCode {
    constructor(classes = []) {
        this.classes = classes;
    }
    typeToClass(type) {
        let index = this.classes.findIndex(a => a.name == type.replaceAll("[]", ""));
        return new ILType(this.classes[index]);
    }
}
class ILType {
    constructor(class_, arrayLevels = 0) {
        this.class = class_;
        this.arrayLevels = arrayLevels;
    }
    byteSize() {
        return this.arrayLevels > 0 ? 4 : this.class.byteSize();
    }
    toString() {
        return this.class.name + "[]".repeat(this.arrayLevels);
    }
}
class Memory {
    constructor(size) {
        // allocation: Uint32Array;
        this.freed = {}; //start -> end;
        this.freedReverse = {}; //end -> start;
        this.allocated = {};
        this.dataTypeToReadFunction = {
            "Int8": "readi8",
            "UInt8": "readu8",
            "Int32": "readi32", // this is the default
            "String": "readString"
        };
        this.dataTypeToWriteFunction = {
            "Int8": "writei8",
            "UInt8": "writeu8",
            "Int32": "writei32", // this is the default
            "String": "writeString"
        };
        this.dataTypeToMemorySize = {
            "Int8": 1,
            "UInt8": 1,
        };
        this.bytes = new Int8Array(size);
        this.freed[0] = size - 1;
        this.freedReverse[size - 1] = 0;
        // this.allocation = new Uint32Array(size/32);
    }
    readi8(index) {
        return this.bytes.at(index);
    }
    readu8(index) {
        return ((this.bytes.at(index) || 0) < 0 ? 256 : 0) + (this.bytes.at(index) || 0);
    }
    readi32(index) {
        return ((Memory.i8tou8(this.bytes.at(index + 0) || 0) << 24) +
            (Memory.i8tou8(this.bytes.at(index + 1) || 0) << 16) +
            (Memory.i8tou8(this.bytes.at(index + 2) || 0) << 8) +
            (Memory.i8tou8(this.bytes.at(index + 3) || 0) << 0));
    }
    writei8(index, value) {
        this.bytes.set([value], index);
    }
    writeu8(index, value) {
        this.bytes.set([value], index);
    }
    writei32(index, value) {
        let str = ("0".repeat(32) + value.toString(2)).slice(-32);
        let arr = [
            str.slice(0, 8),
            str.slice(8, 16),
            str.slice(16, 24),
            str.slice(24, 32),
        ].map(a => parseInt(a, 2));
        this.bytes.set(arr, index);
    }
    writeString(index, value) {
        this.bytes.set(new TextEncoder().encode(value + "\0"), index);
    }
    readString(index) {
        for (let i = 0; true; i++) {
            if (this.bytes.at(index + i) == 0) {
                return new TextDecoder().decode(this.bytes.slice(index, index + i).map(a => (a < 0 ? 256 : 0) + a));
            }
        }
    }
    readWithType(index, type, offset = 0) {
        if (type.class.name == "String" && type.arrayLevels == 0) {
            return this.readString(this.readi32(index + offset * type.byteSize()));
        }
        let fn = this[(!type.arrayLevels ? this.dataTypeToReadFunction[type.class.name] : null) || "readi32"];
        return fn.call(this, index + offset * type.byteSize());
    }
    writeWithType(index, value, type, offset = 0) {
        if (type.class.name == "String" && type.arrayLevels == 0) {
            let chunk = this.allocate(value.length + 1);
            this.writeString(chunk, value);
            return this.writei32(index + offset * type.byteSize(), chunk);
        }
        let fn = this[(!type.arrayLevels ? this.dataTypeToWriteFunction[type.class.name] : null) || "writei32"];
        return fn.call(this, index + offset * type.byteSize(), value);
    }
    static i8tou8(num) {
        return (num < 0 ? 256 + num : num);
    }
    print(index, size, type = 0) {
        function format(num) {
            return ("0" + Memory.i8tou8(num).toString(16).toUpperCase()).slice(-2);
        }
        let totalStr = "   + " + ".".repeat(16).split("").map((a, i) => format(i)).join(" ");
        for (let y = 0; y < Math.ceil((size + (index % 16)) / 16); y++) {
            let row = index - (index % 16) + y * 16;
            let str = format(row) + " | ";
            for (let x = 0; x < 16; x++) {
                let cell = "";
                switch (type) {
                    case 0:
                        cell = format(this.bytes.at(row + x) || 0);
                        break;
                    case 1:
                        for (let i = 0; i < keys(this.freed).length; i++) {
                            if (row + x >= keys(this.freed)[i] && row + x <= values(this.freed)[i]) {
                                cell = "FF";
                            }
                        }
                        for (let i = 0; i < keys(this.allocated).length; i++) {
                            if (row + x >= keys(this.allocated)[i] && row + x <= values(this.allocated)[i]) {
                                cell = cell == "FF" ? "XX" : "AA";
                            }
                        }
                }
                str += ((x + y * 16) < (index % 16) ||
                    (x + y * 16) > (index + size) ||
                    (index + x + y * 16) >= this.bytes.length) ?
                    ".. " :
                    cell + " ";
            }
            totalStr += "\n" + str;
        }
        console.log("\n" + totalStr);
    }
    allocate(size) {
        for (let i = 0; i < keys(this.freed).length; i++) {
            let key = +keys(this.freed)[i];
            let value = this.freed[key];
            if (value - key >= size) {
                this.freed[key + size] = value;
                this.freedReverse[value] = key + size;
                this.allocated[key] = size + key - 1;
                delete this.freed[key];
                return key;
            }
            // if(this.freed[i + 1] - this.freed[i] >= size) {
            //     this.allocated.push(this.freed[i], size);
            //     this.freed[i] = size;
            //     return this.allocated.at(-2) || 0;
            // }
        }
        throw new Error("out of memory");
    }
    free(address) {
        if (this.allocated[address] != null) {
            this.freed[address] = this.allocated[address];
            this.freedReverse[this.allocated[address]] = address;
            //get everything after
            if (this.freed[this.allocated[address] + 1] != null) {
                let end = this.allocated[address];
                // console.log(end)
                // delete this.freed[address];
                this.freed[address] = this.freed[end + 1];
                this.freedReverse[this.freed[end + 1]] = address;
                delete this.freed[end + 1];
                delete this.freedReverse[end];
            }
            // console.log(address)
            //get everything before
            if (this.freedReverse[address - 1] != null && address != 0) {
                this.freed[this.freedReverse[address - 1]] = this.freed[address];
                // this.freedReverse[this.freed[address]] = address;
                this.freedReverse[this.freed[address]] = this.freedReverse[address - 1];
                delete this.freed[address];
                delete this.freedReverse[address - 1];
                // this.freed[this.freedReverse[address - 1]] = this.allocated[address]
                // delete this.freedReverse[address - 1]
                // this.freedReverse[this.allocated[address]] = this.freedReverse[address - 1];
            }
            delete this.allocated[address];
        }
        else {
            throw new Error("qhar");
        }
    }
}
var mem = new Memory(256);
// console.log("a",mem.allocated)
// console.log("f",mem.freed)
// console.log("fr",mem.freedReverse)
// mem.print(0,256,1);
// let a = parseInt("11110011", 2);
// console.log(a.toString(2));
// console.log(("0".repeat(8) + ((a >> 1) ^ a).toString(2)).slice(-8));
class ILInterpreter {
    get method() {
        let val = this.callStack.at(-1)?.method;
        if (val == undefined)
            throw new Error("no method");
        return val;
    }
    get arguments() {
        let val = this.callStack.at(-1)?.arguments;
        if (val == undefined)
            throw new Error("no arguments");
        return val;
    }
    get instrPointer() {
        let val = this.callStack.at(-1)?.instrPointer;
        if (val == undefined)
            throw new Error("no instrPointer (get)");
        return val;
    }
    set instrPointer(value) {
        if (!this.callStack.at(-1))
            throw new Error("no instrPointer (set)");
        this.callStack.at(-1).instrPointer = value;
    }
    get locals() {
        if (!this.callStack.at(-1))
            throw new Error("no locals");
        return this.callStack.at(-1).locals;
    }
    constructor(code) {
        // locals: (ILLocal & {value: any})[] = [];
        this.stack = [];
        this.callStack = [];
        /*
        CALL:
    
    
        */
        // instrPointer = 0;
        // callStack: string[] = ["Main.Main"];
        // returnIndexStack: number[] = [];
        // methodStacks: any[] = [];
        // currentMethod: ILMethod;
        // stack: any[] = []; //would call this currentStack but i dont want to rename everything
        this.memory = new Memory(0);
        this.code = code;
        // console.log(this.callStack)
        // this.currentMethod = this.accessThing(this.callStack.at(-1) || "") as ILMethod;
        this.staticLocations = {};
        //console.log(this.currentMethod)
    }
    setup(memorySize) {
        this.memory = new Memory(memorySize);
        for (let i = 0; i < this.code.classes.length; i++) {
            let class_ = this.code.classes[i];
            let staticsSize = class_.byteSize(true);
            if (staticsSize == 0)
                continue;
            this.staticLocations[class_.name] = this.memory.allocate(staticsSize);
        }
        for (let i = 0; i < this.code.classes.length; i++) {
            let methodIndex = this.code.classes[i].methods.findIndex(m => m.name == "cctor");
            if (methodIndex == -1)
                continue;
            let method = this.code.classes[i].methods[methodIndex];
            this.callStack.push({
                instrPointer: 0,
                method,
                arguments: [],
                locals: method.locals.map(a => { return { value: null, ...a }; })
            });
            while (this.callStack.length > 0) {
                this.step();
            }
        }
        let method = this.accessThing("Main.Main");
        this.callStack.push({
            instrPointer: 0,
            method,
            arguments: [],
            locals: method.locals.map(a => { return { value: null, ...a }; })
        });
        // this.locals = this.code.locals.map(a => { return { type: PREDEFINED_TYPE.Int, value: 0, identifier: a.identifier } });
    }
    accessType(str) {
        let class_ = (str.match("^([A-Z]|[a-z]|[0-9])+") ?? [""])[0];
        let arrayLevels = 0;
        if (str.slice(class_.length).startsWith("[]")) {
            arrayLevels = (str.length - class_.length) / 2;
        }
        return new ILType(this.accessThing(class_), arrayLevels);
    }
    accessThing(str) {
        let current = this.code;
        let strStack = str.split(".");
        while (true) {
            // console.log(current, strStack)
            if (strStack.length == 0) {
                //console.log("returning")
                return current;
            }
            try {
                if (current.constructor.name == "ILCode") {
                    current = current;
                    let index = current.classes.findIndex(a => a.name == strStack[0]);
                    strStack.shift();
                    current = current.classes[index];
                }
                else if (current.constructor.name == "ILClass") {
                    current = current;
                    let index = current.methods.findIndex(a => a.name == strStack[0]);
                    if (index == -1) {
                        index = current.fields.findIndex(a => a.identifier == strStack[0]);
                        current = current.fields[index];
                    }
                    else {
                        current = current.methods[index];
                    }
                    strStack.shift();
                }
                // } else if(current.constructor.name == "ILMethod") {
                //     current = current as ILMethod;
                //     return current;
                // }
            }
            catch {
                throw new Error("i think you tried to access something that doesnt exist");
            }
        }
    }
    step() {
        let instr = this.method.code[this.instrPointer];
        if (!instr) {
            this.callStack.pop(); //ret
            if (this.callStack.length > 0)
                this.instrPointer++;
            return;
        }
        switch (instr.opcode) {
            case OPCODE.add:
                this.stack[this.stack.length - 2] += this.stack.pop();
                break;
            case OPCODE.sub:
                this.stack[this.stack.length - 2] -= this.stack.pop();
                break;
            case OPCODE.rem:
                this.stack[this.stack.length - 2] %= this.stack.pop();
                break;
            case OPCODE.mul:
                this.stack[this.stack.length - 2] *= this.stack.pop();
                break;
            case OPCODE.div:
                this.stack[this.stack.length - 2] /= this.stack.pop();
                break;
            case OPCODE.ldc_i4:
                this.stack.push(instr.operand);
                break;
            case OPCODE.stloc:
                this.locals[instr.operand || 0].value = this.stack.pop() || 0;
                break;
            case OPCODE.cgt:
                this.stack.push((this.stack.pop() || 0) > (this.stack.pop() || 0) ? 1 : 0);
                break;
            case OPCODE.cge:
                this.stack.push((this.stack.pop() || 0) >= (this.stack.pop() || 0) ? 1 : 0);
                break;
            case OPCODE.clt:
                this.stack.push((this.stack.pop() || 0) < (this.stack.pop() || 0) ? 1 : 0);
                break;
            case OPCODE.cgt:
                this.stack.push((this.stack.pop() || 0) <= (this.stack.pop() || 0) ? 1 : 0);
                break;
            case OPCODE.ceq:
                this.stack.push((this.stack.pop() || 0) == (this.stack.pop() || 0) ? 1 : 0);
                break;
            case OPCODE.cne:
                this.stack.push((this.stack.pop() || 0) != (this.stack.pop() || 0) ? 1 : 0);
                break;
            case OPCODE.brfalse:
                this.instrPointer = this.stack.pop() == true ? this.instrPointer : (instr.operand - 1) || 0;
                break;
            case OPCODE.brtrue:
                this.instrPointer = this.stack.pop() == false ? this.instrPointer : (instr.operand - 1) || 0;
                break;
            case OPCODE.br:
                this.instrPointer = instr.operand - 1;
                break;
            case OPCODE.ldloc:
                this.stack.push(this.locals[instr.operand || 0].value || 0);
                break;
            case OPCODE.pop:
                this.stack.pop();
                break;
            case OPCODE.call: {
                let method = this.accessThing(instr.operand);
                let args = this.stack.splice(-method.effectiveArguments, method.effectiveArguments);
                if (method.function) {
                    let res = method.function(...args);
                    if (res) {
                        this.stack.push(res);
                    }
                }
                else {
                    this.callStack.push({
                        instrPointer: -1,
                        method,
                        arguments: args,
                        locals: method.locals.map(a => { return { value: null, ...a }; })
                    });
                }
                break;
            }
            case OPCODE.ret:
                this.callStack.pop();
                break;
            case OPCODE.ldarg:
                this.stack.push(this.arguments[instr.operand]);
                break;
            case OPCODE.newobj: {
                let method = this.accessThing(instr.operand);
                let args = this.stack.splice(-method.effectiveArguments, method.effectiveArguments);
                let size = this.accessThing(instr.operand.slice(0, -5)).byteSize();
                let allocatedChunk = this.memory.allocate(size);
                args.unshift(allocatedChunk);
                this.stack.push(allocatedChunk);
                this.callStack.push({
                    instrPointer: -1,
                    method,
                    arguments: args,
                    locals: method.locals.map(a => { return { value: null, ...a }; })
                });
                break;
            }
            case OPCODE.ldfld: {
                let address = this.stack.pop();
                let ilclass = this.accessThing(instr.operand.split(".").slice(0, -1).join("."));
                let ilfield = this.accessThing(instr.operand);
                this.stack.push(this.memory.readWithType(address + ilclass.getFieldOffset(ilfield), ilfield.type));
                break;
            }
            case OPCODE.stfld: {
                let value = this.stack.pop();
                let address = this.stack.pop();
                let ilclass = this.accessThing(instr.operand.split(".").slice(0, -1).join("."));
                let ilfield = this.accessThing(instr.operand);
                this.memory.writeWithType(address + ilclass.getFieldOffset(ilfield), value, ilfield.type);
                break;
            }
            case OPCODE.ldsfld: {
                let ilclass = this.accessThing(instr.operand.split(".").slice(0, -1).join("."));
                let ilfield = this.accessThing(instr.operand);
                //class instead and fiferent foffset
                this.stack.push(this.memory.readWithType(this.staticLocations[ilclass.name] + ilclass.getFieldOffset(ilfield), ilfield.type));
                break;
            }
            case OPCODE.stsfld: {
                let value = this.stack.pop();
                let ilclass = this.accessThing(instr.operand.split(".").slice(0, -1).join("."));
                let ilfield = this.accessThing(instr.operand);
                this.memory.writeWithType(this.staticLocations[ilclass.name] + ilclass.getFieldOffset(ilfield), value, ilfield.type);
                break;
            }
            case OPCODE.ldstr:
                this.stack.push(instr.operand);
                break;
            case OPCODE.newarr: {
                let length = this.stack.pop();
                let iltype = this.accessType(instr.operand);
                let memoryChunk = this.memory.allocate(1 + length * iltype.byteSize());
                this.memory.writei8(memoryChunk, length); //encode data about the primative
                // for(let i = 0; i < length; i++) {
                //     this.memory.writeWithType(memoryChunk + 1, i, ilclass, i);
                // }
                this.stack.push(memoryChunk);
                break;
            }
            case OPCODE.ldelem: {
                let index = this.stack.pop();
                let address = this.stack.pop();
                let iltype = this.accessType(instr.operand);
                this.stack.push(this.memory.readWithType(address + 1, iltype, index));
                break;
            }
            case OPCODE.stelem: {
                let value = this.stack.pop();
                let index = this.stack.pop();
                let address = this.stack.pop();
                let iltype = this.accessType(instr.operand);
                this.memory.writeWithType(address + 1, value, iltype, index);
                break;
            }
            case OPCODE.nop:
                break;
            case OPCODE.ldc_r4:
                console.log("HI HI", this.arguments);
                break;
        }
        this.instrPointer++;
    }
    run() {
        let startTime = performance.now();
        while (this.callStack.length > 0) {
            // if(this.callStack.length == 0) break;
            this.step();
        }
        //performanceTests.execute = performance.now() - startTime;
    }
    print() {
        if (this.callStack.length == 0) {
            console.log("[callstack is empty]");
            return;
        }
        ;
        console.log({
            instrPointer: this.instrPointer,
            locals: this.locals.map((local, index) => { return { [this.method.locals[index].identifier]: { identifier: local.identifier, type: local.type.toString(), value: local.value } }; }),
            stack: this.stack
        });
    }
}
var int32 = new ILClass("Int32");
var int8 = new ILClass("Int8");
var string = new ILClass("String");
{
    var toString_ = new ILMethod("ToString", new ILType(string), false, []);
    toString_.function = (self) => self.toString();
    int32.methods.push(toString_);
    int8.methods.push(toString_);
}
/* STRING */ {
    var combine = new ILMethod("Combine", new ILType(string), true, [
        { identifier: "str1", type: new ILType(string) },
        { identifier: "str2", type: new ILType(string) },
    ]);
    combine.function = (str1, str2) => str1 + str2;
    string.methods.push(combine);
}
var console_ = new ILClass("Console");
{
    var writeLine = new ILMethod("WriteLine", null, true, [
        { identifier: "str", type: new ILType(string) }
    ]);
    writeLine.function = console.log;
    console_.methods.push(writeLine);
}
var class1 = new ILClass("Main");
var main = new ILMethod("Main", null, true, [], [
    { identifier: "arr", type: new ILType(int8, 2) }
]);
//
main.emit(OPCODE.ldc_i4, 4);
main.emit(OPCODE.newarr, "Int8[]");
main.emit(OPCODE.stloc, 0);
//arr[0][0] = new int[7];
main.emit(OPCODE.ldloc, 0);
main.emit(OPCODE.ldc_i4, 0);
main.emit(OPCODE.ldc_i4, 7);
main.emit(OPCODE.newarr, "Int8"); //element type
main.emit(OPCODE.stelem, "Int8[]"); //element type
//arr[0][1] = 6;
main.emit(OPCODE.ldloc, 0); //arr
main.emit(OPCODE.ldc_i4, 0); //[0]
main.emit(OPCODE.ldelem, "Int8[]"); //element type
main.emit(OPCODE.ldc_i4, 1); //[1]
main.emit(OPCODE.ldc_i4, 6); //6
main.emit(OPCODE.stelem, "Int8"); //element type
// main.emit(OPCODE.ldc_i4, 2);
// main.emit(OPCODE.newarr, "Int8");
class1.methods.push(main);
// var code = `
// class Buh {
//     String[] buhs;
//     static Int32 a = 10 + 2;
//     static String b = Buh.a:ToString$();
//     static Int8[] c;
//     static void cctor() {
//         Buh.c = 1;
//     }
//     void ctor(String one, String two) {
//         this.buhs = String@2;
//         this.buhs#0 = one;
//         this.buhs#1 = two;
//     }
// }
// class Main {
//     static Int32 b;
//     static void Main() {
//         Buh myBuh = Buh~("yeah", "no??");
//         Console:WriteLine$(myBuh.buhs#0);
//         Console:WriteLine$(myBuh.buhs#1);
//         Console:WriteLine$(Buh.a);
//         Console:WriteLine$(Buh.b);
//         Console:WriteLine$(Buh.c);
//     }
// }
// `
//code print formatting <-----
// var tokenized = tokenize(code);
// var tree = lexicalDataToCompilationUnit(tokenized);
//     console.log(tree)
// var compiled = compilationUnitToIL(tree);
//     console.log(compiled)
// var compiledInterpreter = new ILInterpreter(compiled);
//     compiledInterpreter.setup(256);
//     compiledInterpreter.run();
//     compiledInterpreter.print();
//     compiledInterpreter.memory.print(0, 64);
