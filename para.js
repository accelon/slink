export const dumprun=(r)=>{
    let arr=r;
    if (!Array.isArray(arr)) arr=[arr];
    let out='';
    for (let i=0;i<arr.length;i++) {
        const item=arr[i]||{};
        const t=item['w:t'];
        if (t){
            if (t[0]&&t[0]['#text']) {
                out+=t[0]['#text'];
            }
            else {
                if (item[':@']&&item[':@']['@_xml:space']=='preserve') {
                    out+='　';
                }
            }
        } else if (item['w:rPr']) {
            //console.log(item)
        }        
    }
    return out;
}

export const dumppara=(para,openhandlers,closehandlers)=>{
    let out='';
    if (!para)return;
    for (let i=0;i<para.length;i++) {
        const obj=para[i];
        
        for (let key in obj){
            const attrs=obj[':@']||{};
            const open=openhandlers[key];
            const close=closehandlers[key];

            if (key=='w:r') {
                //console.log('w:r',obj[key])
                for (let j=0;j<obj[key].length;j++){
                    out+=dumprun(obj[key][j]);
                }
            } else if (key=='w:hyperlink') {
                let arr=obj[key];
                //憲法 第22條（基本人權保障）相關解釋 nested hyperlink
                if (obj[key][0][key]) {
                    //console.log('NESTED')
                    arr=obj[key][0][key]
                    //out+='NESTED'
                }
                if (!Array.isArray(arr))arr=[arr];
                out+=open(attrs)
                for (let j=0;j<arr.length;j++){
                   // console.log(arr[j]['w:r'])
                    out+=dumprun(arr[j]['w:r'],true);
                }
                out+=close(attrs)
            } else if (key=='w:pPr') {
                for (let i=0;i<obj[key].length;i++) {
                    if (obj[key][i]['w:pStyle'] && obj[key][i][':@']['@_w:val']) {
                        out+=openhandlers['w:pStyle'](obj[key][i][':@'])
                    }
                }
            } else if (key=='w:bookmarkStart') {
                out+=open(attrs)
            }
        }
    }
    return out;
}