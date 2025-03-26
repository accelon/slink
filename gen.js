import { fromObj,nodefs,contextByFormat, processDocuments, writeChanged } from 'ptk/nodebundle.cjs'
await nodefs;
import JSZip from 'jszip'
import { Allnames } from './allnames.js';
import { Segnames } from './segnames.js';
import { tidy } from './src/tidy.js'
const lstname=process.argv[2]||"gen.lst"; //use cd to specified cwd
const lst=fs.existsSync(lstname) ?fs.readFileSync(lstname,"utf8").split(/\r?\n/):[];
if (lst[0].charCodeAt(0) === 0xFEFF) {
    lst[0] = lst[0].slice(1);
}
const format=process.argv[3]||'offtext'; // markdown, acc3 
const ctx=contextByFormat(format);
if (!ctx) {
    console.log('unknown format',format);
}
ctx.lst=lst;
ctx.readZipBuffer=JSZip.loadAsync;
ctx.idmap=Allnames;

ctx.onDocStart=(ctx,fn)=>{
    ctx.lawid=ctx.idmap[fn];
    ctx.ruleid='';//條號
}
ctx.onDocEnd=(ctx,fn)=>{
    console.log(fn,ctx.currentoutput?.length)
}
const unknownsegnames={};
const parseLawRule=(ctx,ruleid,t)=>{
    ctx.ruleid=ctx.lawid+'.'+ruleid.replace(/\^a/,'');
    //立法理由，可以取消。
    //刪除理由，
    const m=t.match(/（([^\^\{}]+)）/);
    //if (m) console.log(m[1])
    return t;
}
ctx.onPara=(ctx,para)=>{
    para=tidy(para)
    let out='';
    // console.log(para)
    const m=para.match(/bm\{id:"([^\}第]+)"\}第([^條]+)條之?([\d]*)/);
    if (m) { //法條開始
        out=parseLawRule(ctx , m[1], para.slice(m.index+m[0].length));
    } else {
        let lines=para.replace(/【/g,'\n【').split('\n').filter(it=>!!it);
        for (let i=0;i<lines.length;i++) {
            let line=lines[i];
            if (line.startsWith('【')){
                const at=line.indexOf('】',1);
                const segname=line.substr(1,at-1);
                if (Segnames[segname]) {
                    ctx.segid=Segnames[segname];
                } 
                if (!unknownsegnames[segname]) unknownsegnames[segname]=0;
                unknownsegnames[segname]++;
                
            } else if (~line.indexOf('修正前條文')){ 
                //parseRevision(line);
                
            }        
        }
    }
    return out;
}
await processDocuments(ctx);
writeChanged('unknownsegnames.txt',fromObj(unknownsegnames,true).join('\n'),true)
//fs.wconsole.log( )
console.log(fromObj(unknownsegnames,true))