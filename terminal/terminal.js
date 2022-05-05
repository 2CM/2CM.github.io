var terminalBox = document.querySelector("#terminal")

var lines = [

]

function displayLines() {
    terminalBox.innerHTML = "";
    for(l in lines) {
        terminalBox.innerHTML += `<div class="line">${lines[l]}</div>`
    }
}

function writeLine(lineList) {
    lines = lines.concat(lineList)

    displayLines();
}

function editLine(lineNum, line) {
    lines[lineNum] = line;
    displayLines();
}

function removeLine(lineNum) {
    lines.splice(lineNum,1);

    displayLines();
}

var bootMsg = `
+=-------------------------=+
|  # #  #""  #    #    ###  |
|  ###  #==  #    #    # #  |
|  # #  #__  ###  ###  ###  |
+=-------------------------=+
`

writeLine(bootMsg.split("\n"))