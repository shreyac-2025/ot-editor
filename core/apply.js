// insert function
class Apply{

    apply(doc, op){
        if(op.noOp === true){
            return doc
        }
        else if(op.actionType == "insert"){
            return this.insertText(doc, op)
        }
        else if(op.actionType == "delete"){
            return this.deleteText(doc, op)
        }
    }

    insertText(doc, op){
        if (doc.doc_text.length > op.pos){
        doc.doc_text = doc.doc_text.slice(0, op.pos) + op.char + doc.doc_text.slice(op.pos)
        }
        else{
            doc.doc_text = doc.doc_text + op.char
        }
        return doc
    }

    // delete function
    deleteText(doc, op){
        if(doc.doc_text.length == op.pos){
            doc.doc_text = doc.doc_text.slice(0, doc.doc_text.length-1)
        }
        else if (doc.doc_text.length > op.pos){
            doc.doc_text = doc.doc_text.slice(0, op.pos) + doc.doc_text.slice(op.pos+1)
        }
        return doc
    }
}

module.exports = Apply 
