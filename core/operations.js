
const GoogleDocument = require('./document');

class Operation{
    constructor({actionType, pos, char = null, clientVersion, noOp = false}){
        this.actionType = actionType,
        this.pos = pos,
        this.char = char,
        this.clientVersion = clientVersion
        this.noOp = noOp
    }  
}


module.exports = Operation

