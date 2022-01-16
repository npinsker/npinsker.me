import { CURRENT_VERSION } from './constants.js'


export let serializeWorkspace = (shaderCode, images, otherVariables) => {
    return `VERSION: ${CURRENT_VERSION}

==== SHADER ====

${shaderCode}

==== IMAGES ====

${images.filter(k => k != null).map(k => k.src).join('\n')}

==== VARIABLES ====

${otherVariables.filter(k => k[0] !== "sampler2D").map(k => "" + k[0] + " " + k[1] + ": " + JSON.stringify(k[2])).join('\n')}
`
};

export let loadWorkspace = (text) => {
    var lines = text.split('\n');

    let shaderCode = "";
    let images = [];
    let variables = [];
    let mode = "";

    for (let line of lines) {
        if (line.startsWith("====")) {
            mode = line.split(' ')[1];
            continue;
        }

        if (mode === "SHADER") {
            if (shaderCode.length > 0) {
                shaderCode += "\n";
            }
            shaderCode += line;
        }

        if (line.trim().length === 0) {
            continue;
        }

        if (mode === "IMAGES") {
            let image = new Image();
            image.src = line;
            images.push(image);
        }

        if (mode === "VARIABLES") {
            var varType = line.split(' ')[0];
            var varName = line.split(' ')[1].replace(":", "");
            var value = JSON.parse(line.substring(line.indexOf(': ') + 2));
            variables.push([varType, varName, value]);
        }
    }

    return [ shaderCode, images, variables ];
}