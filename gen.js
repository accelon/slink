import { existsSync, readFileSync,writeFileSync } from 'fs';
import Path from 'path';
import JSZip from 'jszip'
import { XMLParser, XMLBuilder, XMLValidator} from "fast-xml-parser";

const lstname=process.argv[2]||"gen.lst";
const lst=existsSync(lstname) ?readFileSync(lstname,"utf8").split(/\r?\n/):[];

let cwd='';

const dumprun=(r,hyperlink)=>{
    let arr=r;
    if (!Array.isArray(arr)) arr=[arr];
    let out='';
    for (let i=0;i<arr.length;i++) {
        const item=arr[i];
        const t=item['w:t'];
        if (t&& t[0] &&t[0]['#text']){
            out+=t[0]['#text'];
        } else {
            //console.log(item)
        }        
    }
    return out;
}
const dumphyperlink=(h,anchor,rid)=>{
    console.log('hyper',h,anchor,rid)
}
const dumppara=para=>{
    let out='';
    if (!para)return;
    for (let i=0;i<para.length;i++) {
        const obj=para[i];
        for (let key in obj){
            const attrs=obj[':@']||{};
            if (key=='w:r') {
                //console.log('w:r',obj[key])
                for (let j=0;j<obj[key].length;j++){
                    out+=dumprun(obj[key][j]);
                }
            } else if (key=='w:hyperlink') {
                //console.log('hyperlink',obj[key])
                let arr=obj[key][0];
                if (!Array.isArray(arr) )arr=[arr];
                
                out+='<A '+(attrs['@_r:id']||'') +(attrs['@_w:anchor']||'')+'>'
                for (let j=0;j<arr.length;j++){
                   // console.log(arr[j]['w:r'])
                    out+=dumprun(arr[j]['w:r'],true);
                }
                out+='</A>'
                
            } else if (key=='w:pPr') {
                //console.log('w:pPr',obj[key])
            }
        }
    }
    
    return out;
}
const processxml=data=>{
    const parser=new XMLParser({ignoreAttributes : false,preserveOrder:true});
    const jobj=parser.parse(data)
    
    //writeFileSync('a.json',JSON.stringify(jobj,'',' '),'utf8')
    const p=jobj[1]['w:document'][0]['w:body'];
    for (let i=0;i<p.length;i++) {
        const para=dumppara(p[i]['w:p']);
        if (para) {
            console.log(para)
        }
    }
}
const processfile=async fn=>{
    const out=[];
    const ifn=cwd+Path.sep+fn
    const ofn='out'+Path.sep+fn.replace('.docx','.xml');
    const buffer = readFileSync(ifn);

    JSZip.loadAsync(buffer).then(async (zip)=>{
        processxml(await zip.file('word/document.xml').async('string'));
    });

    //console.log('written',ofn,out.length)
    //writeFileSync(ofn,out.join('\n'),'utf8');
}


for (let i=0;i<lst.length;i++) {
    if (lst[i].startsWith('cd ')) {
        cwd=lst[i].slice(3);
    } else {
        await processfile( lst[i]);
    }
}

