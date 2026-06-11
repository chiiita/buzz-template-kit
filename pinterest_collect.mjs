// Pinterest 参考画像コレクター（当サンドボックス用）
// 使い方: node pinterest_collect.mjs "<検索語>" <出力ディレクトリ> [枚数]
import fs from 'fs'; import path from 'path';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
const PROXY=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
if(PROXY) setGlobalDispatcher(new ProxyAgent(PROXY));

const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function warmup(){
  const r=await fetch('https://www.pinterest.com/',{headers:{'User-Agent':UA,'Accept':'text/html'}});
  const sc=r.headers.get('set-cookie')||'';
  const m=/csrftoken=([^;]+)/.exec(sc);
  await r.text();
  return {csrf:m?m[1]:'', cookie:sc.split(',').map(s=>s.split(';')[0]).join('; ')};
}

async function search(q,csrf,cookie,pageSize=25){
  const data=encodeURIComponent(JSON.stringify({options:{query:q,scope:'pins',page_size:pageSize},context:{}}));
  const src=encodeURIComponent('/search/pins/?q='+encodeURIComponent(q));
  const url=`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=${src}&data=${data}`;
  const r=await fetch(url,{headers:{
    'User-Agent':UA,'Accept':'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With':'XMLHttpRequest','X-APP-VERSION':'a9d8f1e',
    'X-Pinterest-PWS-Handler':'www/search/[scope].js',
    'X-CSRFToken':csrf,'Cookie':(cookie?cookie+'; ':'')+'csrftoken='+csrf,
    'Referer':'https://www.pinterest.com/search/pins/?q='+encodeURIComponent(q)
  }});
  if(!r.ok){console.error('search HTTP',r.status); return [];}
  const j=await r.json();
  const results=j?.resource_response?.data?.results||[];
  return results.map(p=>{
    const im=p.images?.['736x']||p.images?.orig; if(!im) return null;
    return {url:im.url,w:im.width,h:im.height,id:p.id};
  }).filter(Boolean);
}

async function dl(url,dest){
  const r=await fetch(url,{headers:{'User-Agent':UA,'Referer':'https://www.pinterest.com/'}});
  if(!r.ok) throw new Error('dl HTTP '+r.status);
  const buf=Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest,buf); return buf.length;
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const [,,query,outDir,countArg,ratioMode]=process.argv;
const count=parseInt(countArg||'12',10);
// ratioMode: 'yt'=横長16:9寄り / 'note'=横長やや緩め / 既定=縦長〜正方(IG)
const RR=ratioMode==='yt'?[1.45,2.1]:ratioMode==='note'?[1.5,2.2]:[0.6,1.25];
if(!query||!outDir){console.error('usage: node pinterest_collect.mjs "<q>" <dir> [n] [ig|yt|note]');process.exit(1);}
fs.mkdirSync(outDir,{recursive:true});

const {csrf,cookie}=await warmup();
console.log('csrf:',csrf?csrf.slice(0,8)+'...':'(なし)');
await sleep(1500);
let pins=await search(query,csrf,cookie,Math.max(25,count*2));
console.log('検索ヒット:',pins.length,'件');
// 縦長〜正方(カルーセル単スライド)に寄せる: 0.6<=w/h<=1.2
pins=pins.filter(p=>p.w&&p.h&&(p.w/p.h)>=RR[0]&&(p.w/p.h)<=RR[1]);
let n=0; const manifest=[];
for(const p of pins.slice(0,count)){
  const file=`p_${String(n+1).padStart(2,'0')}.jpg`;
  try{ const sz=await dl(p.url,path.join(outDir,file)); n++; manifest.push({file:file,pinId:p.id,pinUrl:'https://www.pinterest.com/pin/'+p.id+'/',imgUrl:p.url,w:p.w,h:p.h}); console.log(`  DL ${n}: ${sz}B ${p.w}x${p.h} pin/${p.id}`); }
  catch(e){ console.log('  skip:',e.message); }
  await sleep(1200);
}
fs.writeFileSync(path.join(outDir,'sources.json'),JSON.stringify(manifest,null,2));
console.log('保存:',n,'枚 + sources.json ->',outDir);
