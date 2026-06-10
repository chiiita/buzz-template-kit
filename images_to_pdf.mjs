// スライドPNG群を1つのPDFに（1画像=1ページ）＝レビュー用。ブラウザ不要。
// 使い方: node images_to_pdf.mjs <画像dir or 画像列> <out.pdf>
//   dir を渡すと中の *.png を名前順で全ページ化（._ファイルは除外）
import fs from 'fs'; import path from 'path';
import { PDFDocument } from 'pdf-lib';
const args = process.argv.slice(2);
if (args.length < 2){ console.error('usage: node images_to_pdf.mjs <dir|png...> <out.pdf>'); process.exit(1); }
const out = args[args.length-1];
const inputs = args.slice(0,-1);
let files = [];
for (const inp of inputs){
  if (fs.existsSync(inp) && fs.statSync(inp).isDirectory()){
    files.push(...fs.readdirSync(inp).filter(f=>/\.(png|jpg|jpeg)$/i.test(f)&&!f.startsWith('._')).sort().map(f=>path.join(inp,f)));
  } else files.push(inp);
}
if (!files.length){ console.error('画像が見つかりません'); process.exit(1); }
const pdf = await PDFDocument.create();
for (const f of files){
  const bytes = fs.readFileSync(f);
  const img = /\.png$/i.test(f) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out, await pdf.save());
console.log(`PDF: ${files.length}ページ -> ${out}`);
