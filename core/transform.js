
const {Operation}  = require('./operations');


function transformFunc(op1, op2){
    if (op1.actionType === "insert" && ((op2.actionType === "insert") || (op2.actionType === "delete"))) {
        if (op1.pos <= op2.pos) {
            // op1 shifted everything right by 1
            op2.pos = op2.pos + 1
        }
        return op2
    }
    else if(op1.actionType === "delete" && op2.actionType === "insert"){
        if(op1.pos < op2.pos){
            op2.pos = op2.pos-1
        }
        return op2
    }
    else if(op1.actionType === "delete" && op2.actionType === "delete"){
        if(op1.pos <= op2.pos){
            op2.noOp = true
        }
        return op2

    }
}

module.exports = transformFunc;