import { writeChanged } from '../nodebundle.cjs'
import { tidy } from './tidy.js'
import { Segnames } from './segnames.js';
const output=[];
const unknownsegnames={};
const outdir='md/';
export const ctx={
rels:{},
ext:'md',
fn:'',
openhandlers:{
    'w:hyperlink':attrs=>{
        const anchor=attrs['w:anchor'];
        const id=attrs['r:id']||'';
        //convert hyperlink id to slink internal id(allnames)
        const linktarget=(id&&!isNaN(parseInt(ctx.rels[id])))?'@'+ctx.rels[id]:id;
        ctx.link=linktarget + (anchor?'#^'+anchor:'');
        return '[['+ctx.link+'|';
    },
    'w:pStyle':attrs=>{
        const heading=parseInt(attrs['w:val'])||0;
        return '#'.repeat(heading)+' ';
    },
    'w:bookmarkStart':attrs=>'<a name="'+attrs['w:name']+'">',
    'w:p':attrs=>'\n'
},
closehandlers:{
    'w:hyperlink':()=>']]'
}
}
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
            out='rev date:'+year+month.padStart(2,'0')+day.padStart(2,'0')+reason
        } else {
            //console.log('no reason',line)
        }
        
    }
    return out;
}
//開始一個文件
ctx.onDocStart=(ctx,fn)=>{
    ctx.lawid=ctx.idmap[fn];
    ctx.ruleid='';//條號
}
const epilog=(content)=>{//將HTML aname 轉為 obsidian block id
    return content.replace(/<a name="(.+?)">(.+?)\n/g, "$2 ^$1\n");//convert anchor name to block id
}

//結束一個文件
ctx.onDocEnd=(ctx,fn)=>{
   console.log(fn,ctx.currentoutput?.length)
   let content=epilog(output.join('\n'));
   writeChanged(outdir+ fn.replace('.docx','.md'),content,false);
   output.length=0;
}

//處理每一個段落
ctx.onPara=(ctx,para)=>{
    para=tidy(para)
    let out='';
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

                output.push((ctx.segid?'〔'+ctx.segid+'〕':'〔'+ segname+'〕')+line.slice(segname.length+2));
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