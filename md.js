//這幾行不要改
import { nodefs, processDocuments } from './nodebundle.cjs'
import JSZip from 'jszip'
import { Allnames } from './allnames.js';
await nodefs;
import {ctx} from './src/obsidian.js'; //主要改這個檔


//要轉換的文件清單，預設為 gen.lst
const lstname=process.argv[2]||"gen.lst"; //use cd to specified cwd

const lst=fs.existsSync(lstname) ?fs.readFileSync(lstname,"utf8").split(/\r?\n/):[];
if (lst[0].charCodeAt(0) === 0xFEFF) lst[0] = lst[0].slice(1); //去掉BOM

//設值 處理內容 ， docx 用 JSZip 解壓縮。
ctx.lst=lst;
ctx.readZipBuffer=JSZip.loadAsync;
ctx.idmap=Allnames;

//處理文件
await processDocuments(ctx);