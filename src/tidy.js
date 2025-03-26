export const tidy=str=>{
    return str
    .replace(/--\^a{[a-zA-Z\d]+}\[比對程式\]/g,'')
    .replace(/　+\^a{ln:"章節索引">\[回索引\]〉〉/g,'')
    .replace(/。+\^a{ln:"top"}\[回首頁\]〉〉/,'')

}