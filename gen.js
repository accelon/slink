import { fromObj,nodefs,contextByFormat, processDocuments, writeChanged } from './nodebundle.cjs'
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
const outdir='out/';
ctx.onDocStart=(ctx,fn)=>{
    ctx.lawid=ctx.idmap[fn];
    ctx.ruleid='';//條號
}
ctx.onDocEnd=(ctx,fn)=>{
   console.log(fn,ctx.currentoutput?.length)
   writeChanged(outdir+ fn.replace('.docx','.off'),output.join('\n'),false);
   output.length=0;
}
const output=[];
const unknownsegnames={};
const parseLawRule=(ctx,ruleid,t)=>{
    ctx.ruleid=ctx.lawid+ruleid.replace(/\^a/,'');
    const m=t.match(/（([^\^\{}]+)）/);
    let caption='';
    if (m) caption=m[1];
    return '^article'+ctx.ruleid+(caption?'('+caption+')':'');
}
const parseRevision=(line)=>{
    const m=line.match(/--(\d{2,3})年(\d{1,2})月(\d{1,2})日修正前條文--/);
    let out='';
    if (!m){
        console.log('wrong line',line)
    } else {
        const year=(parseInt(m[1])+1911).toString()
        const month=parseInt(m[2]).toString();
        const day=parseInt(m[3]).toString();
        const m2=line.match(/\{ln:"([^"]+)",id:"([^"]+)"\}\[修正理由\]/);
        let reason='';
        if (m2) {
            reason=',ln:"'+m2[1]+'",id:"'+m2[2]+'"';
            out='^rev{date:'+year+month.padStart(2,'0')+day.padStart(2,'0')+reason+'}'
        } else {
            //console.log('no reason',line)
        }
        
    }
    return out;
}
ctx.onPara=(ctx,para)=>{
    para=tidy(para)
    let out='';
    // console.log(para)

    if (~para.indexOf('[回索引]')||~para.indexOf('[回首頁]')||~para.indexOf('本檔法規資料來源為官方資訊網')) {
        //console.log('index')
        return;
    }    
    const m=para.match(/bm\{id:"([^\}第]+)"\}第([^條]+)條之?([\d]*)/);
    if (m) { //法條開始
        out=parseLawRule(ctx , m[1], para.slice(m.index+m[0].length));
        output.push(out)
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

                output.push((ctx.segid?'^seg#'+ctx.segid+' ':'^t('+ segname+')')+line.slice(segname.length+2));
            } else {
                if (~line.indexOf('修正前條文')){ 
                    output.push(parseRevision(line));
                } else {
                    output.push(line)
                }
            }
        }
    }
    return out;
}
await processDocuments(ctx);
//writeChanged('unknownsegnames.txt',fromObj(unknownsegnames,true).join('\n'),true)
//fs.wconsole.log( )
//console.log(fromObj(unknownsegnames,true))