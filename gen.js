import { existsSync, readFileSync,writeFileSync } from 'fs';
import Path from 'path';
import JSZip from 'jszip'
import { XMLParser} from "fast-xml-parser";
import { dumppara } from './para.js';
const lstname=process.argv[2]||"gen.lst";
const lst=existsSync(lstname) ?readFileSync(lstname,"utf8").split(/\r?\n/):[];
let cwd='';


const openhandlers={
    'w:hyperlink':attrs=>'^l<#'+(attrs['@_r:id']||'') +(attrs['@_w:anchor']||'')+'>[',
    'w:pStyle':attrs=>attrs['@_w:val']?'^h'+attrs['@_w:val']:'',
    'w:bookmarkStart':attrs=>'^bm<#'+attrs['@_w:name']+'>'
}
const closehandlers={
    'w:hyperlink':()=>']'
}
const processxml=data=>{
    const parser=new XMLParser({ignoreAttributes : false,preserveOrder:true});
    const jobj=parser.parse(data)
    const p=jobj[1]['w:document'][0]['w:body'];
    for (let i=0;i<p.length;i++) {
        const para=dumppara(p[i]['w:p'],openhandlers,closehandlers);
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
}
for (let i=0;i<lst.length;i++) {
    if (lst[i].startsWith('cd ')) {
        cwd=lst[i].slice(3);
    } else {
        await processfile( lst[i]);
    }
}