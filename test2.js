import { readFile } from 'fs/promises';
import { ParseBuffer } from 'docx2js';

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

做不了最好。