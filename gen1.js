import { ParseBuffer } from 'docx2js';
import { existsSync, readFileSync,writeFileSync } from 'fs';
import Path from 'path';

const lstname=process.argv[2]||"gen.lst";
const lst=existsSync(lstname) ?readFileSync(lstname,"utf8").split(/\r?\n/):[];

let cwd='';
const tostr=(t)=>{
    const utf8decoder = new TextDecoder('utf-8');
    const b = Uint8Array.from(t.split('').map( c=>c.charCodeAt(0)));
    return utf8decoder.decode(b);
}
const processfile=async fn=>{
    const out=[];
    const ifn=cwd+Path.sep+fn
    const ofn='out'+Path.sep+fn.replace('.docx','.xml');
    const buffer = readFileSync(ifn);
    const doc = await ParseBuffer(buffer);
    for (let i=0;i<doc.contents.length;i++){
          console.log(doc.contents[i]);
          if (doc.contents[i].runs) for (let j=0;j<doc.contents[i].runs.length;j++) {
            const t=doc.contents[i].runs[j].text
            //console.log(doc.contents[i].runs[j].text);
            out.push(tostr(t)) 
          } else {
            console.log('no run')
            out.push(tostr(doc.contents[i].caption))
          }
    } 
    console.log('written',ofn,out.length)
    writeFileSync(ofn,out.join('\n'),'utf8');
}


for (let i=0;i<lst.length;i++) {
    if (lst[i].startsWith('cd ')) {
        cwd=lst[i].slice(3);
    } else {
        await processfile( lst[i]);
    }
}

/*
const main = async () => {
  const buffer = await readFile('憲法.docx');
  const doc = await ParseBuffer(buffer);
  for (let i=0;i<doc.contents.length;i++){
  	  if (doc.contents[i].runs) for (let j=0;j<doc.contents[i].runs.length;j++) {
  	  	  console.log(doc.contents[i].runs[j]);
  	  }
  }
};

main();

*/