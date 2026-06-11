// バズ型HTMLテンプレ集ビルダー：1ソースから ①QA画像(satori) ②実HTMLアプリ
// セーフゾーン準拠(上150/左右100/下160・縦中央)＋アカウントテーマ層(色/フォントをトークン化)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import satori from 'satori'; import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import { PDFDocument } from 'pdf-lib';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 公開用：アプリ本体はルート index.html（Vercelゼロ設定で静的配信）。QA画像は dist/QA
const APP = path.join(__dirname, 'index.html');
const QA  = path.join(__dirname, 'dist', 'QA');
fs.mkdirSync(path.dirname(QA), { recursive: true });

const KAKU="'Zen Kaku Gothic New'", DELA="'Dela Gothic One'", MIN="'Shippori Mincho'", MARU="'Zen Maru Gothic'", HAND="'Yomogi'";

// 質感ヘルパー（Node/ブラウザ両対応）
function shade(hex,p){const m=String(hex).replace('#','');const n=m.length===3?m.split('').map(c=>c+c).join(''):m;const r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16);const f=x=>Math.max(0,Math.min(255,Math.round(x+255*p)));return '#'+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function b64(s){return typeof Buffer!=='undefined'?Buffer.from(s).toString('base64'):btoa(s);}
function icon(name,color,px,sw){const inner=ICONS[name];if(!inner)return '';const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="'+(sw||1.6)+'" stroke-linecap="round" stroke-linejoin="round">'+inner+'</svg>';return '<img src="data:image/svg+xml;base64,'+b64(svg)+'" style="width:'+px+'px;height:'+px+'px;display:flex;"/>';}
// 紙グレイン(ブラウザCSS用)＋手描きマーカー(画像背景用)
const NOISE_B64=b64('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>');
function markerBg(color){return b64('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 40" preserveAspectRatio="none"><path d="M8 22 Q 80 10 150 19 T 292 15" stroke="'+color+'" stroke-width="34" fill="none" stroke-linecap="round" opacity="0.9"/></svg>');}
// おきる風マスコット（白い玉・閉じ目で笑顔）デフォルト＝ユーザーが本物PNGをアップで差し替え可
const BLOB_URI='data:image/svg+xml;base64,'+b64('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220"><path d="M100 10C45 10 24 92 26 142 28 196 62 210 100 210 138 210 172 196 174 142 176 92 155 10 100 10Z" fill="#fff" stroke="#2b2b2b" stroke-width="6"/><path d="M58 118q14 16 28 0" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/><path d="M114 118q14 16 28 0" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/><path d="M84 152q16 14 32 0" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/></svg>');
// 赤い手書き風の矢印（証拠スクショを指す）
const ARROW_URI='data:image/svg+xml;base64,'+b64('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100"><path d="M120 18C70 6 24 24 22 74" fill="none" stroke="#E0352B" stroke-width="12" stroke-linecap="round"/><path d="M22 74l30-10M22 74l8-30" fill="none" stroke="#E0352B" stroke-width="12" stroke-linecap="round"/></svg>');
// 改行(\n)を入れた位置だけで折る＝勝手な改行は足さない。入れなければ普通に流れる
function nl(s){return String(s).split('\n').filter(x=>x.length).map(x=>'<div style="display:flex;">'+x+'</div>').join('');}
// 袋文字(フチ文字)＝多方向textShadowで縁取り＋ドロップシャドウ。美容PR系の金フチ見出し用
function outline(stroke,drop){const o=5;return [o+'px 0 '+stroke,'-'+o+'px 0 '+stroke,'0 '+o+'px '+stroke,'0 -'+o+'px '+stroke,o+'px '+o+'px '+stroke,'-'+o+'px '+o+'px '+stroke,o+'px -'+o+'px '+stroke,'-'+o+'px -'+o+'px '+stroke,'7px 9px 0 '+(drop||'rgba(0,0,0,0.15)')].join(',');}
// 顔の図解（resvgはSVG内textを描画しないので顔は図形のみ・%はHTML側でゾーン色対応リストにする）
function faceSVG(cf,cc,cj,v){const H='#7C6A56';
const capD='<path d="M78,295 Q66,88 230,88 Q394,88 382,295 Q380,180 230,180 Q80,180 78,295 Z" fill="'+H+'"/>';
const capR='<path d="M88,300 Q76,100 230,96 Q384,100 372,300 Q368,205 230,200 Q92,205 88,300 Z" fill="'+H+'"/>';
const capBob='<path d="M72,300 Q60,98 230,90 Q400,98 388,300 Q392,392 366,396 Q384,300 348,212 Q298,165 230,160 Q162,165 112,212 Q76,300 94,396 Q70,392 72,300 Z" fill="'+H+'"/>';
const longH='<path d="M62,250 Q56,98 230,90 Q404,98 398,250 L394,505 Q372,505 354,502 Q386,320 352,212 Q300,165 230,160 Q160,165 108,212 Q74,320 106,502 Q88,505 66,505 Z" fill="'+H+'"/>';
const pony='<path d="M346,150 Q438,168 432,332 Q428,424 388,432 Q412,340 388,254 Q366,198 330,176 Z" fill="'+H+'"/>';
const glass='<rect x="158" y="298" width="60" height="46" rx="14" fill="none" stroke="#3a3a3a" stroke-width="6"/><rect x="242" y="298" width="60" height="46" rx="14" fill="none" stroke="#3a3a3a" stroke-width="6"/><line x1="218" y1="320" x2="242" y2="320" stroke="#3a3a3a" stroke-width="6"/>';
let back='',cap=capD,glasses='';
if(v==='女性')back=longH;
else if(v==='シンプル')cap=capR;
else if(v==='女性ショート')cap=capBob;
else if(v==='ポニーテール')back=pony;
else if(v==='眼鏡'){back=longH;glasses=glass;}
const s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 560">'
+back
+'<ellipse cx="230" cy="300" rx="150" ry="195" fill="#F3D9C2"/>'
+cap
+'<ellipse cx="230" cy="232" rx="92" ry="44" fill="'+cf+'" opacity="0.5"/>'
+'<ellipse cx="132" cy="336" rx="48" ry="60" fill="'+cc+'" opacity="0.45"/>'
+'<ellipse cx="328" cy="336" rx="48" ry="60" fill="'+cc+'" opacity="0.45"/>'
+'<ellipse cx="230" cy="448" rx="72" ry="44" fill="'+cj+'" opacity="0.5"/>'
+'<path d="M162,292 Q188,283 214,292" stroke="#5a4a3a" stroke-width="6" fill="none" stroke-linecap="round"/>'
+'<path d="M246,292 Q272,283 298,292" stroke="#5a4a3a" stroke-width="6" fill="none" stroke-linecap="round"/>'
+'<ellipse cx="188" cy="320" rx="13" ry="17" fill="#4a3a2e"/>'
+'<ellipse cx="272" cy="320" rx="13" ry="17" fill="#4a3a2e"/>'
+'<path d="M230,332 L221,376 Q230,384 239,376" stroke="#d8b294" stroke-width="5" fill="none" stroke-linecap="round"/>'
+'<path d="M198,416 Q230,436 262,416" stroke="#c5887a" stroke-width="7" fill="none" stroke-linecap="round"/>'
+glasses
+'</svg>';return 'data:image/svg+xml;base64,'+b64(s);}

// lucideアイコン読込（curated）→ ICONS。ブラウザにはJSON埋め込み
const ICON_NAMES=['check','x','piggy-bank','coins','wallet','banknote','hand-coins','japanese-yen','trending-up','trending-down','sparkles','heart','star','shield','smartphone','zap','tv','house','gift','landmark','sprout','leaf','dumbbell','plane','utensils','coffee','cat','dog','baby','book-open','graduation-cap','briefcase','palette','camera','music','lightbulb','alarm-clock','target','bookmark','flame','droplet','arrow-up','share-2','bell','message-circle','send','map-pin','clock','calendar'];
function lucideInner(name){try{const s=fs.readFileSync(path.join(__dirname,'node_modules/lucide-static/icons',name+'.svg'),'utf8');return s.replace(/<!--[\s\S]*?-->/,'').replace(/<svg[^>]*>/,'').replace(/<\/svg>/,'').trim();}catch{return null;}}
const ICONS={}; for(const n of ICON_NAMES){const i=lucideInner(n); if(i)ICONS[n]=i;}

// ===== アカウントテーマ（ターゲット/ニッチ別の最適色・フォント）=====
const THEMES = {
  money:   { name:'お金・節約（庶民情報）', bg:'#FBF8F1', panel:'#FFFFFF', panelSoft:'#F6E2D8', ink:'#211C18', sub:'#8C857B', line:'#E7DECB', accent:'#E0352B', accentDeep:'#B5281F', onAccent:'#FBF8F1', darkBg:'#161310', darkInk:'#FFFFFF', darkAccent:'#FF6A5A', darkSub:'#B9B2A8', head:KAKU, body:KAKU, display:DELA },
  beauty:  { name:'美容・女性', bg:'#FBF1F0', panel:'#FFFFFF', panelSoft:'#F6E2E6', ink:'#5A4F54', sub:'#B59AA0', line:'#ECD4D6', accent:'#D08698', accentDeep:'#AC647A', onAccent:'#FFFFFF', darkBg:'#3A2A2E', darkInk:'#FBF1F0', darkAccent:'#E8A8B6', darkSub:'#C9B2B7', head:MARU, body:MARU, display:MARU },
  quote:   { name:'名言・メンタル', bg:'#F2ECE3', panel:'#FFFFFF', panelSoft:'#EAE0D0', ink:'#3E3A35', sub:'#A89A88', line:'#CEC2B0', accent:'#A98A6F', accentDeep:'#876B53', onAccent:'#FBF8F1', darkBg:'#2A2620', darkInk:'#F1E9D9', darkAccent:'#C8A45C', darkSub:'#B5AB98', head:MIN, body:MARU, display:MIN },
  business:{ name:'ビジネス・仕事術', bg:'#F4F6FA', panel:'#FFFFFF', panelSoft:'#E3EAF6', ink:'#1B2A4A', sub:'#8893A8', line:'#C7D3E8', accent:'#2D6CDF', accentDeep:'#1E4FAE', onAccent:'#FFFFFF', darkBg:'#0E1B33', darkInk:'#FFFFFF', darkAccent:'#6FA0FF', darkSub:'#9FB3D8', head:KAKU, body:KAKU, display:DELA },
  wellness:{ name:'健康・ウェルネス', bg:'#EFF2EA', panel:'#FFFFFF', panelSoft:'#DCE6D0', ink:'#39413A', sub:'#8A9682', line:'#CBD6C2', accent:'#6FA060', accentDeep:'#4E7A42', onAccent:'#FFFFFF', darkBg:'#232A22', darkInk:'#EFF2EA', darkAccent:'#9CCB86', darkSub:'#AAB5A0', head:MIN, body:MARU, display:KAKU },
  kids:    { name:'子育て・ママ', bg:'#FFF7EE', panel:'#FFFFFF', panelSoft:'#FCE7D5', ink:'#5B4A3C', sub:'#B5A08E', line:'#F0DEC9', accent:'#F2925E', accentDeep:'#D26E3C', onAccent:'#FFFFFF', darkBg:'#3B2E25', darkInk:'#FFF7EE', darkAccent:'#FBB07E', darkSub:'#C9B7A8', head:MARU, body:MARU, display:MARU },
  english: { name:'英語学習', bg:'#EAF3F2', panel:'#FFFFFF', panelSoft:'#D3E8E4', ink:'#1E3A38', sub:'#7C9794', line:'#C2DBD6', accent:'#1FA39A', accentDeep:'#147F77', onAccent:'#FFFFFF', darkBg:'#10302C', darkInk:'#EAF3F2', darkAccent:'#4FD0C4', darkSub:'#9FB8B4', head:KAKU, body:KAKU, display:DELA },
  gourmet: { name:'グルメ・食', bg:'#FBF5EC', panel:'#FFFFFF', panelSoft:'#F3E2CE', ink:'#3A2A20', sub:'#A28B76', line:'#E4D2BC', accent:'#C0492C', accentDeep:'#9A3621', onAccent:'#FBF5EC', darkBg:'#241813', darkInk:'#FBF5EC', darkAccent:'#E88A5E', darkSub:'#C2A893', head:MIN, body:MARU, display:MIN },
  mono:    { name:'モノトーン・モード', bg:'#F4F2EE', panel:'#FFFFFF', panelSoft:'#E6E2DA', ink:'#1A1A1A', sub:'#8A857C', line:'#D8D3C9', accent:'#A8884E', accentDeep:'#86692F', onAccent:'#FFFFFF', darkBg:'#1A1A1A', darkInk:'#F4F2EE', darkAccent:'#C9A24B', darkSub:'#9A958C', head:MIN, body:KAKU, display:DELA },
  fitness: { name:'フィットネス・筋トレ', bg:'#16191D', panel:'#23272D', panelSoft:'#2C3138', ink:'#FFFFFF', sub:'#9AA2AC', line:'#363B42', accent:'#CDF53C', accentDeep:'#A9CC1F', onAccent:'#16191D', darkBg:'#0C0E10', darkInk:'#FFFFFF', darkAccent:'#CDF53C', darkSub:'#888F98', head:KAKU, body:KAKU, display:DELA },
  travel:  { name:'旅行・お出かけ', bg:'#EEF6FB', panel:'#FFFFFF', panelSoft:'#D7EAF5', ink:'#1C3D52', sub:'#7B9AAC', line:'#C2DCEC', accent:'#2E9BD6', accentDeep:'#1E7BB0', onAccent:'#FFFFFF', darkBg:'#10293B', darkInk:'#EEF6FB', darkAccent:'#62C2F0', darkSub:'#9FBCCD', head:KAKU, body:KAKU, display:DELA },
  love:    { name:'恋愛・婚活', bg:'#FBF0F0', panel:'#FFFFFF', panelSoft:'#F3DADF', ink:'#5A3A40', sub:'#B98F97', line:'#EAD0D5', accent:'#C25B72', accentDeep:'#9E3F56', onAccent:'#FFFFFF', darkBg:'#3A222A', darkInk:'#FBF0F0', darkAccent:'#E59AAC', darkSub:'#C9A3AB', head:MIN, body:MARU, display:MIN },
  pet:     { name:'ペット', bg:'#F5F2E8', panel:'#FFFFFF', panelSoft:'#E9E2CE', ink:'#4F4536', sub:'#A99E86', line:'#DED4BD', accent:'#C58A5A', accentDeep:'#A06A3D', onAccent:'#FFFFFF', darkBg:'#332B20', darkInk:'#F5F2E8', darkAccent:'#E0A877', darkSub:'#BDB29A', head:MARU, body:MARU, display:MARU },
  career:  { name:'転職・キャリア', bg:'#F1F4F3', panel:'#FFFFFF', panelSoft:'#DCE6E3', ink:'#243B38', sub:'#7E9893', line:'#C6D8D3', accent:'#E07B39', accentDeep:'#B85F23', onAccent:'#FFFFFF', darkBg:'#152826', darkInk:'#F1F4F3', darkAccent:'#F2A268', darkSub:'#9DB3AE', head:KAKU, body:KAKU, display:DELA },
  invest:  { name:'投資・資産運用', bg:'#F3F2EE', panel:'#FFFFFF', panelSoft:'#E6E2D6', ink:'#23262E', sub:'#8A8B86', line:'#D6D2C6', accent:'#B8923E', accentDeep:'#94722B', onAccent:'#FFFFFF', darkBg:'#15171C', darkInk:'#F3F2EE', darkAccent:'#D8B25A', darkSub:'#9A9B96', head:MIN, body:KAKU, display:DELA },
  spiritual:{ name:'占い・スピリチュアル', bg:'#F2EEF6', panel:'#FFFFFF', panelSoft:'#E2D8EE', ink:'#3A2F4A', sub:'#9788A8', line:'#D6C9E4', accent:'#7E5AA8', accentDeep:'#5E3F86', onAccent:'#FFFFFF', darkBg:'#241B33', darkInk:'#F2EEF6', darkAccent:'#B79AD8', darkSub:'#A899B8', head:MIN, body:MARU, display:MIN },
  tech:    { name:'ガジェット・IT', bg:'#EEF1F4', panel:'#FFFFFF', panelSoft:'#DBE2EA', ink:'#1A2330', sub:'#7C8896', line:'#C5D0DB', accent:'#0E7CCB', accentDeep:'#0A5E9B', onAccent:'#FFFFFF', darkBg:'#0D1117', darkInk:'#EEF1F4', darkAccent:'#3BA7F0', darkSub:'#8995A3', head:KAKU, body:KAKU, display:DELA },
  nightfood:{ name:'グルメ夜・お酒', bg:'#1C1612', panel:'#2A211C', panelSoft:'#33281F', ink:'#F2E8DC', sub:'#A8988A', line:'#3D3128', accent:'#D98A3D', accentDeep:'#B36C28', onAccent:'#1C1612', darkBg:'#120D0A', darkInk:'#F2E8DC', darkAccent:'#E8A85E', darkSub:'#A8988A', head:MIN, body:MARU, display:MIN },
  cat:     { name:'猫・ねこ', bg:'#F2F0EE', panel:'#FFFFFF', panelSoft:'#E4E0DC', ink:'#3E3A38', sub:'#9C958F', line:'#DAD4CE', accent:'#B98A86', accentDeep:'#97655F', onAccent:'#FFFFFF', darkBg:'#2A2624', darkInk:'#F2F0EE', darkAccent:'#D6A9A4', darkSub:'#ADA39C', head:MARU, body:MARU, display:MARU },
  kidsedu: { name:'知育・キッズ英語', bg:'#FFF9E8', panel:'#FFFFFF', panelSoft:'#FDE9B8', ink:'#2E4A6B', sub:'#8FA3BC', line:'#F5DC98', accent:'#FF7A45', accentDeep:'#E0561F', onAccent:'#FFFFFF', darkBg:'#21385A', darkInk:'#FFF9E8', darkAccent:'#FFA374', darkSub:'#9FB3CC', head:MARU, body:MARU, display:MARU },
  korean:  { name:'韓国・オルチャン', bg:'#EFEBE5', panel:'#FFFFFF', panelSoft:'#E2DCD2', ink:'#3A3531', sub:'#9E968B', line:'#D8D0C4', accent:'#A8957F', accentDeep:'#86735E', onAccent:'#FFFFFF', darkBg:'#2A2622', darkInk:'#EFEBE5', darkAccent:'#C7B49C', darkSub:'#A89E92', head:MIN, body:KAKU, display:MIN },
  handmade:{ name:'ハンドメイド・クラフト', bg:'#F4EFE4', panel:'#FFFFFF', panelSoft:'#E6DCC6', ink:'#4A4334', sub:'#A39A82', line:'#DCD0B8', accent:'#B5703F', accentDeep:'#8E5529', onAccent:'#FFFFFF', darkBg:'#2E2A20', darkInk:'#F4EFE4', darkAccent:'#C99A5E', darkSub:'#B5AC95', head:HAND, body:MARU, display:HAND },
  outdoor: { name:'アウトドア・キャンプ', bg:'#EEF0E6', panel:'#FFFFFF', panelSoft:'#DDE2CC', ink:'#2C3A28', sub:'#7E8A72', line:'#C8D2B8', accent:'#5E7A3E', accentDeep:'#46602C', onAccent:'#FFFFFF', darkBg:'#1E2A1A', darkInk:'#EEF0E6', darkAccent:'#8FB069', darkSub:'#A0AC92', head:KAKU, body:KAKU, display:DELA },
  study:   { name:'勉強・受験', bg:'#FBF7EE', panel:'#FFFFFF', panelSoft:'#F3E6CC', ink:'#3A3322', sub:'#A99E82', line:'#E6DABF', accent:'#E0A12E', accentDeep:'#B87E1C', onAccent:'#FFFFFF', darkBg:'#2A2418', darkInk:'#FBF7EE', darkAccent:'#F2C45E', darkSub:'#B8AE92', head:KAKU, body:KAKU, display:DELA },
  music:   { name:'音楽・エンタメ', bg:'#1A1622', panel:'#272034', panelSoft:'#2F2740', ink:'#F2EEF6', sub:'#A99CB8', line:'#3A3150', accent:'#FF4D8D', accentDeep:'#D62E6E', onAccent:'#FFFFFF', darkBg:'#0F0C17', darkInk:'#F2EEF6', darkAccent:'#FF7AAB', darkSub:'#A99CB8', head:KAKU, body:KAKU, display:DELA },
  beautypr:{ name:'美容PR(ゴールド袋文字)', bg:'#F4EAD2', panel:'#FFFFFF', panelSoft:'#EDE0BE', ink:'#4E4228', sub:'#A1916B', line:'#DECFA6', accent:'#C7A23E', accentDeep:'#9C7A22', onAccent:'#FFFFFF', darkBg:'#3A3218', darkInk:'#F4EAD2', darkAccent:'#E0BE5A', darkSub:'#B6A678', head:KAKU, body:KAKU, display:DELA },
  pastel:  { name:'診断・やわらかパステル', bg:'#FBF6F8', panel:'#FFFFFF', panelSoft:'#F3E6EE', ink:'#5A4A52', sub:'#A99AA2', line:'#ECDDE6', accent:'#E089A6', accentDeep:'#C56A88', onAccent:'#FFFFFF', darkBg:'#4A3A42', darkInk:'#FBF6F8', darkAccent:'#F0A6BE', darkSub:'#B6A2AC', head:MARU, body:MARU, display:DELA },
  recipe:  { name:'レシピ・あたたか暖色', bg:'#FBF3E8', panel:'#FFFFFF', panelSoft:'#F3E2C8', ink:'#5A4630', sub:'#A8916E', line:'#E6D6BC', accent:'#E8893E', accentDeep:'#C2692A', onAccent:'#FFFFFF', darkBg:'#3E2E1C', darkInk:'#FBF3E8', darkAccent:'#F0A862', darkSub:'#B69A78', head:MARU, body:KAKU, display:DELA },
};

// 共通フレーム（セーフ余白＋縦中央＋奥行きグラデ）
// フォーマット定義（サイズ＋カテゴリ）。templateは fmt で所属を宣言（未指定=ig）
const FORMATS = {
  ig:      { name:'Instagram カルーセル', w:1080, h:1350, multi:true,  cats:['表紙','中身','締め'] },
  youtube: { name:'YouTube サムネイル',   w:1280, h:720,  multi:false, cats:['サムネ'] },
  note:    { name:'note 見出し画像',       w:1920, h:1006, multi:false, cats:['サムネ'] },
};
// 可変サイズのセーフゾーン枠。pad未指定はフォーマット汎用、wrap()はIG既定(1080×1350)
function wrapAt(w, h, o, inner){
  const g=`radial-gradient(circle at 50% 32%, ${shade(o.bg,0.035)}, ${o.bg} 58%, ${shade(o.bg,-0.045)})`;
  const pad=o.pad||'64px 80px';
  return `<div style="width:${w}px;height:${h}px;box-sizing:border-box;position:relative;display:flex;flex-direction:column;justify-content:center;align-items:${o.align||'stretch'};padding:${pad};background:${g};color:${o.color};font-family:${o.font};">${inner}</div>`;
}
function wrap(o, inner){ return wrapAt(1080,1350,Object.assign({pad:'150px 100px 160px'},o),inner); }

const TEMPLATES = [
  // ===== 表紙 =====
  { id:'cover_target', name:'A2 ターゲット名指し（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'誰へ（バッジ）',def:'節約してるのに、貯まらない人へ'},{key:'line1',label:'前置き',def:'がんばってるのに、'},{key:'big',label:'特大ワード',def:'貯まらない。'},{key:'revealA',label:'反転前',def:'犯人は、'},{key:'revealHot',label:'反転（アクセント）',def:'固定費'},{key:'revealB',label:'反転後',def:'。'},{key:'proof',label:'証拠',def:'見直すだけで、年18万円の差。'},{key:'foot',label:'下部誘導',def:'知らないと損する、見直し7つ →'},{key:'icon',label:'意匠アイコン(任意)',type:'icon',def:'piggy-bank'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      ${d.icon?`<div style="position:absolute;bottom:104px;right:64px;display:flex;opacity:0.5;">${icon(d.icon,t.line,290,1.3)}</div>`:''}
      <div style="display:flex;align-self:flex-start;background:${t.ink};color:${t.bg};font-size:34px;font-weight:700;padding:18px 30px;border-radius:16px;margin-bottom:50px;">${d.badge}</div>
      <div style="display:flex;font-size:56px;font-weight:700;">${d.line1}</div>
      <div style="display:flex;font-size:150px;font-family:${t.display};line-height:1.05;background-image:linear-gradient(180deg, transparent 60%, #FCE15A 60%, #FCE15A 88%, transparent 88%);">${d.big}</div>
      <div style="display:flex;margin-top:30px;font-size:70px;font-weight:900;font-family:${t.head};">${d.revealA}<span style="color:${t.accent};">${d.revealHot}</span>${d.revealB}</div>
      <div style="display:flex;flex-direction:column;margin-top:38px;font-size:44px;font-weight:700;">${nl(d.proof)}</div>
      <div style="display:flex;flex-direction:column;margin-top:60px;font-size:34px;font-weight:700;color:${t.sub};">${nl(d.foot)}</div>`) },

  { id:'cover_number', name:'A5 金額・数字インパクト（表紙）', cat:'表紙',
    fields:[{key:'kicker',label:'キッカー',def:'見直さないだけで'},{key:'pre',label:'数字前',def:'年'},{key:'number',label:'数字',def:'18'},{key:'unit',label:'単位',def:'万円'},{key:'claim',label:'断定',def:'損してる。'},{key:'foot',label:'下部誘導',def:'保存して、週末に見直す →'}],
    render:(d,t)=>wrap({bg:t.darkBg,color:t.darkInk,font:t.body,align:'center'},`
      <div style="display:flex;font-size:42px;font-weight:700;color:${t.darkAccent};">${d.kicker}</div>
      <div style="display:flex;align-items:baseline;margin-top:10px;"><div style="display:flex;font-size:90px;font-weight:700;">${d.pre}</div><div style="display:flex;font-size:300px;font-weight:800;font-family:${t.display};color:${t.darkAccent};line-height:1;">${d.number}</div><div style="display:flex;font-size:96px;font-weight:700;">${d.unit}</div></div>
      <div style="display:flex;font-size:58px;font-weight:700;margin-top:6px;">${d.claim}</div>
      <div style="display:flex;font-size:34px;color:${t.darkSub};margin-top:54px;">${d.foot}</div>`) },

  { id:'cover_quote', name:'A7 上品・余白名言（表紙）', cat:'表紙',
    fields:[{key:'label',label:'ラベル',def:'気にしない練習'},{key:'line1',label:'一言1行目',def:'人といるだけで、'},{key:'line2',label:'一言2行目',def:'なんだか疲れる。'},{key:'support',label:'裏付け',def:'気にしすぎを手放す、8の言葉'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.head,align:'center'},`
      <div style="display:flex;font-family:${t.body};font-size:30px;letter-spacing:6px;color:${t.accent};">${d.label}</div>
      <div style="display:flex;width:80px;height:2px;background:${t.accent};margin-top:22px;margin-bottom:40px;"></div>
      <div style="display:flex;font-size:84px;font-weight:700;line-height:1.5;">${d.line1}</div>
      <div style="display:flex;font-size:84px;font-weight:700;line-height:1.5;">${d.line2}</div>
      <div style="display:flex;font-family:${t.body};font-size:34px;color:${t.accent};margin-top:48px;">${d.support}</div>`) },

  { id:'cover_question', name:'A1 図示・問いかけ（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'誰へ',def:'貯金できない人へ'},{key:'q1',label:'問い1',def:'なんで、お金が'},{key:'q2',label:'問い2',def:'残らないんだろう？'},{key:'hint',label:'引き',def:'理由は、たった3つ。'},{key:'foot',label:'下部',def:'保存して読んでね →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;background:${t.ink};color:${t.bg};font-size:32px;font-weight:700;padding:14px 28px;border-radius:14px;margin-bottom:40px;">${d.badge}</div>
      <div style="display:flex;font-size:150px;font-family:${t.display};color:${t.accent};line-height:1;">?</div>
      <div style="display:flex;font-size:72px;font-weight:900;font-family:${t.head};margin-top:24px;">${d.q1}</div>
      <div style="display:flex;font-size:72px;font-weight:900;font-family:${t.head};">${d.q2}</div>
      <div style="display:flex;font-size:38px;font-weight:700;color:${t.accent};margin-top:34px;">${d.hint}</div>
      <div style="display:flex;font-size:32px;color:${t.sub};margin-top:50px;">${d.foot}</div>`) },

  { id:'cover_nsen', name:'A3 N選・番号（表紙）', cat:'表紙',
    fields:[{key:'save',label:'バッジ',def:'保存版'},{key:'topic',label:'テーマ',def:'もう迷わない節約'},{key:'count',label:'数',def:'7'},{key:'unit',label:'単位',def:'選'},{key:'foot',label:'下部',def:'1枚ずつ見ていってね →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;background:${t.ink};color:${t.bg};font-size:30px;font-weight:900;padding:12px 26px;border-radius:10px;">${d.save}</div>
      <div style="display:flex;font-size:64px;font-weight:900;font-family:${t.head};margin-top:34px;">${d.topic}</div>
      <div style="display:flex;align-items:center;justify-content:center;width:400px;height:400px;border-radius:50%;background:${t.accent};margin-top:34px;"><div style="display:flex;align-items:baseline;color:${t.onAccent};"><div style="display:flex;font-family:${t.display};font-size:250px;line-height:1;">${d.count}</div><div style="display:flex;font-size:84px;font-weight:900;">${d.unit}</div></div></div>
      <div style="display:flex;font-size:34px;color:${t.sub};margin-top:40px;">${d.foot}</div>`) },

  { id:'cover_warning', name:'A4 損失回避・警告（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'警告バッジ',def:'知らないと損'},{key:'line1',label:'1行目',def:'貯まらない人が'},{key:'hotword',label:'強調行',def:'必ずやってる'},{key:'line2',label:'3行目',def:'3つの習慣。'},{key:'foot',label:'下部',def:'あなたは大丈夫？ →'}],
    render:(d,t)=>wrap({bg:t.darkBg,color:t.darkInk,font:t.body,align:'stretch'},`
      <div style="display:flex;align-self:flex-start;background:${t.accent};color:${t.onAccent};font-size:34px;font-weight:900;padding:14px 28px;border-radius:10px;margin-bottom:50px;">${d.badge}</div>
      <div style="display:flex;font-size:82px;font-weight:900;font-family:${t.head};line-height:1.3;">${d.line1}</div>
      <div style="display:flex;font-size:82px;font-weight:900;font-family:${t.head};line-height:1.3;color:${t.darkAccent};">${d.hotword}</div>
      <div style="display:flex;font-size:82px;font-weight:900;font-family:${t.head};line-height:1.3;">${d.line2}</div>
      <div style="display:flex;margin-top:56px;font-size:36px;color:${t.darkSub};">${d.foot}</div>`) },

  { id:'cover_paradox', name:'A6 パラドックス（表紙）', cat:'表紙',
    fields:[{key:'subjectA',label:'主語（〜ほど）',def:'節約を“がんばる”人ほど、'},{key:'result',label:'意外な結果',def:'貯まらない。'},{key:'reason',label:'理由予告',def:'その理由、5つあります。'},{key:'foot',label:'下部',def:'保存して確かめて →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;font-size:64px;font-weight:700;">${d.subjectA}</div>
      <div style="display:flex;font-size:120px;font-family:${t.display};color:${t.accent};line-height:1.05;margin-top:14px;">${d.result}</div>
      <div style="display:flex;font-size:44px;font-weight:700;margin-top:40px;">${d.reason}</div>
      <div style="display:flex;margin-top:60px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_grad', name:'A8 グラデ＋特大＋N選（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'バッジ',def:'保存版'},{key:'head',label:'特大見出し（改行で折る）',def:'知らないだけで\n損してるお金'},{key:'num',label:'数字',def:'18'},{key:'unit',label:'単位',def:'選'},{key:'foot',label:'下部',def:'全部チェックして →'}],
    render:(d,t)=>`<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;padding:150px 100px 160px;background:linear-gradient(135deg, ${t.accent}, ${t.accentDeep});color:#ffffff;font-family:${t.body};">
      <div style="display:flex;align-self:flex-start;background:rgba(255,255,255,0.22);color:#ffffff;font-size:32px;font-weight:700;padding:14px 28px;border-radius:10px;margin-bottom:40px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;font-size:98px;font-weight:900;font-family:${t.head};line-height:1.2;color:#ffffff;">${nl(d.head)}</div>
      <div style="display:flex;align-items:baseline;margin-top:30px;"><div style="display:flex;font-family:${t.display};font-size:170px;color:#ffffff;line-height:1;">${d.num}</div><div style="display:flex;font-size:70px;font-weight:900;margin-left:12px;color:#ffffff;">${d.unit}</div></div>
      <div style="display:flex;margin-top:36px;font-size:34px;color:rgba(255,255,255,0.85);">${d.foot}</div>
    </div>` },

  { id:'cover_clean', name:'A9 白地2色＋編バッジ（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'バッジ',def:'無料テンプレ付'},{key:'line1',label:'見出し1（アクセント色）',def:'お金が貯まる'},{key:'line2',label:'見出し2',def:'仕組みの作り方'},{key:'sub',label:'サブ（改行で折る）',def:'がんばらずに、自動で。'},{key:'foot',label:'下部',def:'保存して見返す →'}],
    render:(d,t)=>wrap({bg:'#FFFFFF',color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-self:flex-start;background:${t.ink};color:#ffffff;font-size:32px;font-weight:900;padding:12px 26px;border-radius:8px;margin-bottom:44px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;font-size:104px;font-weight:900;font-family:${t.head};line-height:1.18;"><div style="display:flex;color:${t.accent};">${d.line1}</div><div style="display:flex;color:${t.ink};">${d.line2}</div></div>
      <div style="display:flex;flex-direction:column;margin-top:40px;font-size:40px;font-weight:700;color:${t.sub};">${nl(d.sub)}</div>
      <div style="display:flex;margin-top:50px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_photo_corner', name:'A15 全面写真＋見出し（表紙）', cat:'表紙',
    fields:[{key:'photo',label:'写真をアップ',type:'file',def:''},{key:'badge',label:'バッジ',def:'まとめ'},{key:'head',label:'見出し（改行で折る）',def:'貯まる人の\n習慣、全部。'},{key:'foot',label:'下部',def:'保存版 →'}],
    render:(d,t)=>{const bg=d.photo?`background-image:url(${d.photo});background-size:cover;background-position:center;`:`background-color:${t.panelSoft};`;
      return `<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;padding:120px 90px;font-family:${t.body};${bg}">
        <div style="display:flex;flex-direction:column;align-self:flex-start;background:rgba(0,0,0,0.55);border-radius:22px;padding:40px;">
          <div style="display:flex;align-self:flex-start;background:${t.accent};color:${t.onAccent};font-size:28px;font-weight:700;padding:10px 22px;border-radius:8px;margin-bottom:26px;">${d.badge}</div>
          <div style="display:flex;flex-direction:column;font-size:86px;font-weight:900;font-family:${t.head};color:#ffffff;line-height:1.25;">${nl(d.head)}</div>
        </div>
        <div style="display:flex;align-self:flex-start;background:rgba(0,0,0,0.55);border-radius:14px;padding:16px 26px;font-size:32px;color:#ffffff;">${d.foot}</div>
      </div>`;} },

  { id:'cover_ba', name:'A17 Before→After予告（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'バッジ',def:'1ヶ月で'},{key:'title',label:'見出し（改行で折る）',def:'貯金ゼロから\nこう変わった。'},{key:'before',label:'Before',def:'給料日前はいつも残高ピンチ'},{key:'after',label:'After',def:'毎月3万、自動で貯まる'},{key:'foot',label:'下部',def:'やり方は中で →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-self:flex-start;background:${t.accent};color:${t.onAccent};font-size:30px;font-weight:700;padding:12px 24px;border-radius:8px;margin-bottom:36px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;font-size:62px;font-weight:900;font-family:${t.head};margin-bottom:46px;">${nl(d.title)}</div>
      <div style="display:flex;align-items:stretch;justify-content:space-between;">
        <div style="display:flex;flex-direction:column;width:390px;background:${t.panel};border:3px solid ${t.line};border-radius:20px;padding:30px;"><div style="display:flex;font-size:30px;font-weight:900;color:${t.sub};margin-bottom:16px;">Before</div><div style="display:flex;font-size:38px;font-weight:700;">${d.before}</div></div>
        <div style="display:flex;align-items:center;font-size:50px;font-weight:900;color:${t.accent};">→</div>
        <div style="display:flex;flex-direction:column;width:390px;background:${t.accent};border-radius:20px;padding:30px;color:${t.onAccent};"><div style="display:flex;font-size:30px;font-weight:900;margin-bottom:16px;">After</div><div style="display:flex;font-size:38px;font-weight:700;">${d.after}</div></div>
      </div>
      <div style="display:flex;margin-top:46px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_toc', name:'A18 目次・わかること（表紙）', cat:'表紙',
    fields:[{key:'title',label:'見出し（改行で折る）',def:'お金が貯まる人の\n5つの習慣'},{key:'lead',label:'リード',def:'この投稿でわかること'},{key:'items',label:'項目',type:'rows',cols:['項目'],def:'先取り貯金のやり方\n固定費の見直す順番\nムダ遣いの止め方'},{key:'foot',label:'下部',def:'保存して順にチェック →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:66px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:20px;margin-bottom:16px;border-radius:4px;"></div>
      <div style="display:flex;font-size:34px;font-weight:700;color:${t.accent};margin-bottom:38px;">${d.lead}</div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map(it=>`<div style="display:flex;align-items:center;margin-bottom:26px;"><div style="display:flex;flex-shrink:0;margin-right:20px;">${icon('check',t.accent,40,3)}</div><div style="display:flex;font-size:42px;font-weight:700;">${it}</div></div>`).join('')}</div>
      <div style="display:flex;margin-top:28px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_choice', name:'A20 二択フック（表紙）', cat:'表紙',
    fields:[{key:'q',label:'問い（改行で折る）',def:'貯まる人は\nどっち?'},{key:'a',label:'選択肢A（改行可）',def:'安いものを\n選ぶ'},{key:'b',label:'選択肢B（改行可）',def:'長く使える\nものを選ぶ'},{key:'answer',label:'答え予告',def:'正解は、意外なほうでした。'},{key:'foot',label:'下部',def:'答えは中で →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:60px;font-weight:900;font-family:${t.head};margin-bottom:46px;">${nl(d.q)}</div>
      <div style="display:flex;align-items:stretch;justify-content:space-between;">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:390px;height:320px;background:${t.panel};border:3px solid ${t.line};border-radius:24px;"><div style="display:flex;font-size:40px;font-weight:900;color:${t.sub};margin-bottom:16px;">A</div><div style="display:flex;flex-direction:column;align-items:center;font-size:42px;font-weight:700;">${nl(d.a)}</div></div>
        <div style="display:flex;align-items:center;font-size:44px;font-weight:900;color:${t.accent};">or</div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:390px;height:320px;background:${t.accent};border-radius:24px;color:${t.onAccent};"><div style="display:flex;font-size:40px;font-weight:900;margin-bottom:16px;">B</div><div style="display:flex;flex-direction:column;align-items:center;font-size:42px;font-weight:700;">${nl(d.b)}</div></div>
      </div>
      <div style="display:flex;align-self:center;margin-top:44px;font-size:40px;font-weight:700;">${d.answer}</div>
      <div style="display:flex;align-self:center;margin-top:12px;font-size:32px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_vertical', name:'A10 縦書き（表紙）', cat:'表紙',
    fields:[{key:'label',label:'小ラベル',def:'プロ直伝'},{key:'text',label:'縦書き本文（改行＝列・右から左）',def:'画像の上の\n文字を読みやすく\nする技術'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>{const cols=String(d.text).split('\n').filter(Boolean).map(col=>`<div style="display:flex;flex-direction:column;align-items:center;font-size:80px;font-weight:900;font-family:${t.head};line-height:1.12;">${[...col].map(c=>`<div style="display:flex;">${c}</div>`).join('')}</div>`).reverse().join('<div style="display:flex;width:26px;"></div>');
      return `<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:140px 100px;background:${t.darkBg};color:${t.darkInk};font-family:${t.body};">
        <div style="display:flex;align-items:center;margin-bottom:40px;"><div style="display:flex;width:40px;height:2px;background:${t.darkAccent};margin-right:16px;"></div><div style="display:flex;font-size:30px;letter-spacing:4px;color:${t.darkAccent};">${d.label}</div></div>
        <div style="display:flex;flex-direction:row;align-items:flex-start;">${cols}</div>
        <div style="display:flex;margin-top:44px;font-size:34px;color:${t.darkSub};">${d.handle}</div>
      </div>`;} },

  { id:'cover_badges', name:'A11 バッジ散らし（表紙）', cat:'表紙',
    fields:[{key:'b1',label:'バッジ左上',def:'保存版'},{key:'b2',label:'バッジ右上',def:'期間限定'},{key:'big',label:'特大ワード（改行で折る）',def:'お金の\n裏ワザ'},{key:'b3',label:'バッジ左下',def:'無料'},{key:'b4',label:'バッジ右下',def:'永久保存'},{key:'foot',label:'下部',def:'全部まとめました →'}],
    render:(d,t)=>{const bd=(x,bg,c)=>`<div style="display:flex;background:${bg};color:${c};font-size:30px;font-weight:900;padding:12px 24px;border-radius:10px;">${x}</div>`;
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
        <div style="display:flex;justify-content:space-between;width:100%;margin-bottom:50px;">${bd(d.b1,t.accent,t.onAccent)}${bd(d.b2,t.ink,t.bg)}</div>
        <div style="display:flex;flex-direction:column;align-items:center;font-size:130px;font-family:${t.display};line-height:1.05;color:${t.ink};">${nl(d.big)}</div>
        <div style="display:flex;justify-content:space-between;width:100%;margin-top:50px;">${bd(d.b3,t.ink,t.bg)}${bd(d.b4,t.accent,t.onAccent)}</div>
        <div style="display:flex;margin-top:46px;font-size:34px;color:${t.sub};">${d.foot}</div>`);} },

  { id:'cover_3d', name:'A12 3D立体文字（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'バッジ',def:'保存版'},{key:'big',label:'特大ワード（改行で折る）',def:'立体で\n目立たせる'},{key:'sub',label:'サブ（改行で折る）',def:'インパクト最大の見出し術。'},{key:'foot',label:'下部',def:'作り方は中で →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;background:${t.ink};color:${t.bg};font-size:32px;font-weight:900;padding:12px 26px;border-radius:8px;margin-bottom:46px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:130px;font-weight:900;font-family:${t.display};line-height:1.1;color:${t.ink};text-shadow:9px 9px 0 ${t.accent};">${nl(d.big)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:50px;font-size:40px;font-weight:700;color:${t.sub};">${nl(d.sub)}</div>
      <div style="display:flex;margin-top:40px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_hand', name:'A13 手書き＋下線（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'バッジ',def:'無料'},{key:'big',label:'見出し（改行で折る）',def:'エモい\nフォント'},{key:'num',label:'数字',def:'5選'},{key:'foot',label:'下部',def:'保存して使ってね →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-self:flex-start;background:${t.accent};color:${t.onAccent};font-size:32px;font-weight:900;padding:12px 24px;border-radius:999px;margin-bottom:40px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;font-family:'Yomogi';font-size:112px;font-weight:700;line-height:1.25;color:${t.ink};">${nl(d.big)}</div>
      <div style="display:flex;width:340px;height:14px;background:${t.accent};opacity:0.55;border-radius:7px;margin-top:8px;"></div>
      <div style="display:flex;align-items:baseline;margin-top:30px;"><div style="display:flex;font-family:'Yomogi';font-size:120px;font-weight:700;color:${t.accent};">${d.num}</div></div>
      <div style="display:flex;margin-top:34px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_q_photo', name:'A14 問いかけ＋写真（表紙）', cat:'表紙',
    fields:[{key:'photo',label:'写真をアップ',type:'file',def:''},{key:'badge',label:'バッジ',def:'質問'},{key:'q',label:'問い（改行で折る）',def:'視認性が悪い時、\nどうしてる?'},{key:'foot',label:'下部',def:'解決法は中で →'}],
    render:(d,t)=>{const bg=d.photo?`background-image:url(${d.photo});background-size:cover;background-position:center;`:`background-color:${t.panelSoft};`;
      return `<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;font-family:${t.body};">
        <div style="display:flex;flex-direction:column;flex-grow:1;background:${t.bg};padding:130px 90px 60px;">
          <div style="display:flex;align-self:flex-start;background:${t.accent};color:${t.onAccent};font-size:30px;font-weight:900;padding:12px 24px;border-radius:10px;margin-bottom:36px;">${d.badge}</div>
          <div style="display:flex;flex-direction:column;font-size:78px;font-weight:900;font-family:${t.head};line-height:1.3;color:${t.ink};">${nl(d.q)}</div>
          <div style="display:flex;margin-top:30px;font-size:34px;color:${t.sub};">${d.foot}</div>
        </div>
        <div style="display:flex;width:1080px;height:520px;${bg}"></div>
      </div>`;} },

  { id:'cover_sticky', name:'A16 付箋メモ風（表紙）', cat:'表紙',
    fields:[{key:'title',label:'見出し（改行で折る）',def:'貯金できる人の\nやることリスト'},{key:'notes',label:'付箋',type:'rows',cols:['付箋'],def:'給料日に先取り貯金\n固定費を年1で見直す\nサブスクを棚卸し'},{key:'foot',label:'下部',def:'全部できたら最強 →'}],
    render:(d,t)=>{const rot=['-2deg','1.5deg','-1deg','2deg'];
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;flex-direction:column;font-size:60px;font-weight:900;font-family:${t.head};margin-bottom:44px;">${nl(d.title)}</div>
        <div style="display:flex;flex-direction:column;">${d.notes.split('\n').filter(Boolean).map((n,i)=>`<div style="display:flex;align-items:center;align-self:flex-start;background:#FFF1A8;border-radius:8px;padding:26px 34px;margin-bottom:26px;box-shadow:0 6px 18px rgba(0,0,0,0.12);transform:rotate(${rot[i%4]});"><div style="display:flex;flex-shrink:0;width:22px;height:22px;border-radius:50%;background:${t.accent};margin-right:22px;"></div><div style="display:flex;font-size:42px;font-weight:700;color:#5a4e25;">${n}</div></div>`).join('')}</div>
        <div style="display:flex;margin-top:24px;font-size:34px;color:${t.sub};">${d.foot}</div>`);} },

  { id:'cover_chat', name:'A19 吹き出し会話（表紙）', cat:'表紙',
    fields:[{key:'b1',label:'吹き出し左（改行で折る）',def:'え、また\n貯金ゼロ…?'},{key:'b2',label:'吹き出し右（改行で折る）',def:'大丈夫、\n仕組みで貯まるよ'},{key:'big',label:'まとめ（改行で折る）',def:'がんばらない\n貯金術。'},{key:'foot',label:'下部',def:'やり方は中で →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;align-self:flex-start;max-width:680px;background:${t.panel};border:3px solid ${t.line};border-radius:30px;border-bottom-left-radius:6px;padding:30px 36px;font-size:46px;font-weight:700;margin-bottom:26px;">${nl(d.b1)}</div>
      <div style="display:flex;flex-direction:column;align-self:flex-end;max-width:680px;background:${t.accent};color:${t.onAccent};border-radius:30px;border-bottom-right-radius:6px;padding:30px 36px;font-size:46px;font-weight:700;margin-bottom:50px;">${nl(d.b2)}</div>
      <div style="display:flex;flex-direction:column;font-size:78px;font-weight:900;font-family:${t.head};line-height:1.25;">${nl(d.big)}</div>
      <div style="display:flex;margin-top:30px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  { id:'cover_outline', name:'A21 袋文字（美容PR）（表紙）', cat:'表紙',
    fields:[{key:'badge',label:'バッジ',def:'大人ニキビ対策'},{key:'big',label:'袋文字見出し（改行で折る）',def:'予防には\nふきとり！'},{key:'sub',label:'サブ（改行で折る）',def:'毎日のひと手間で、肌が変わる。'},{key:'foot',label:'下部',def:'やり方はこのあと →'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;background:${t.accent};color:${t.onAccent};font-size:32px;font-weight:900;padding:14px 30px;border-radius:999px;margin-bottom:46px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:120px;font-weight:900;font-family:${t.head};line-height:1.4;color:#FFFDF5;text-shadow:${outline(t.accentDeep,'rgba(120,90,20,0.25)')};">${nl(d.big)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:54px;font-size:42px;font-weight:900;color:${t.accentDeep};">${nl(d.sub)}</div>
      <div style="display:flex;margin-top:40px;font-size:34px;color:${t.sub};">${d.foot}</div>`) },

  // ===== 中身 =====
  { id:'content_hero', name:'B2 結果ヒーロー（中身）', cat:'中身',
    fields:[{key:'no',label:'番号',def:'1'},{key:'category',label:'カテゴリ',def:'通信費'},{key:'icon',label:'アイコン(任意)',type:'icon',def:'smartphone'},{key:'headline',label:'アクション見出し',def:'格安SIMに、乗り換える。'},{key:'amount',label:'結果(特大)',def:'−5,000'},{key:'unit',label:'単位',def:'円／月'},{key:'points',label:'やり方',type:'rows',cols:['やり方'],def:'大手3社→楽天・povo・mineo等へ\n番号そのまま(MNP)・20GBでも月3,000円前後\n手続きはスマホで15分・店舗に行かない'},{key:'use',label:'浮いたお金の使い道',def:'月1の外食ひとつ分'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;"><div style="display:flex;align-items:center;justify-content:center;width:92px;height:92px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-size:46px;font-weight:900;">${d.no}</div><div style="display:flex;margin-left:24px;font-size:42px;font-weight:700;letter-spacing:2px;">${d.category}</div></div>${d.icon?`<div style="display:flex;align-items:center;justify-content:center;width:104px;height:104px;border-radius:50%;background:${t.panelSoft};">${icon(d.icon,t.accentDeep,56,1.8)}</div>`:''}</div>
      <div style="display:flex;flex-direction:column;margin-top:40px;font-size:60px;font-weight:900;font-family:${t.head};">${nl(d.headline)}</div>
      <div style="display:flex;margin-top:34px;font-size:30px;font-weight:700;color:${t.accent};letter-spacing:2px;">▼ 浮くお金</div>
      <div style="display:flex;align-items:baseline;margin-top:6px;"><div style="display:flex;font-family:${t.display};font-size:94px;color:${t.accent};line-height:1;">${d.amount}</div><div style="display:flex;font-size:40px;font-weight:700;margin-left:8px;">${d.unit}</div></div>
      <div style="display:flex;width:100%;height:2px;background:${t.line};margin-top:30px;margin-bottom:30px;"></div>
      <div style="display:flex;flex-direction:column;">${d.points.split('\n').filter(Boolean).map(p=>`<div style="display:flex;align-items:center;margin-bottom:22px;"><div style="display:flex;width:26px;height:26px;border-radius:50%;background:${t.accent};margin-right:20px;"></div><div style="display:flex;font-size:34px;">${p}</div></div>`).join('')}</div>
      <div style="display:flex;align-self:flex-start;background:${t.panelSoft};color:${t.accentDeep};font-size:32px;font-weight:700;padding:16px 26px;border-radius:16px;margin-top:24px;">浮いた分は → ${d.use}</div>`) },

  { id:'content_grid', name:'B3 グリッド一覧（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'見直す固定費リスト'},{key:'cells',label:'マス目',type:'rows',cols:['アイコン名(任意)','ラベル'],def:'smartphone｜通信費\nzap｜電気・ガス\ntv｜サブスク\nshield｜保険\nlandmark｜手数料\nhouse｜家賃\ngift｜ふるさと納税\ncoins｜車の維持費'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:58px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:46px;border-radius:4px;"></div>
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;">${d.cells.split('\n').filter(Boolean).map((c,i)=>{const pp=c.split('｜');const ic=pp.length>1&&ICONS[pp[0]]?pp[0]:null;const label=pp.length>1?pp.slice(1).join('｜'):pp[0];const badge=ic?`<div style="display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:${t.panelSoft};margin-right:22px;">${icon(ic,t.accentDeep,32,1.9)}</div>`:`<div style="display:flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-size:30px;font-weight:900;margin-right:22px;">${i+1}</div>`;return `<div style="display:flex;align-items:center;width:430px;height:112px;background:${t.panel};border-radius:18px;margin-bottom:22px;padding-left:24px;">${badge}<div style="display:flex;font-size:37px;font-weight:700;">${label}</div></div>`;}).join('')}</div>`) },

  { id:'content_listitem', name:'B1 リスト1項目（中身）', cat:'中身',
    fields:[{key:'no',label:'番号',def:'1'},{key:'headline',label:'見出し',def:'先取り貯金にする'},{key:'sub',label:'補足',def:'“残ったら貯金”は一生貯まらない。給料日に自動で別口座へ。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:center;justify-content:center;width:130px;height:130px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:66px;">${d.no}</div>
      <div style="display:flex;font-size:76px;font-weight:900;font-family:${t.head};margin-top:44px;">${d.headline}</div>
      <div style="display:flex;font-size:40px;color:${t.sub};margin-top:30px;line-height:1.5;">${d.sub}</div>`) },

  { id:'content_compare', name:'B5 比較2分割（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'貯まる人・貯まらない人'},{key:'badLabel',label:'×ラベル',def:'貯まらない'},{key:'bad',label:'×の例',type:'rows',cols:['×の例'],def:'なんとなく払う\n気づいたら残高ゼロ\nセールでまとめ買い'},{key:'goodLabel',label:'◯ラベル',def:'貯まる'},{key:'good',label:'◯の例',type:'rows',cols:['◯の例'],def:'固定費を年1見直し\n先取りで自動貯金\n必要な物だけ買う'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};margin-bottom:44px;">${nl(d.title)}</div>
      <div style="display:flex;justify-content:space-between;">
        <div style="display:flex;flex-direction:column;width:425px;background:#F1E4E2;border-radius:22px;padding:34px;"><div style="display:flex;align-items:center;font-size:40px;font-weight:900;color:#C0392B;margin-bottom:26px;">${icon('x','#C0392B',40,3.6)}<span style="margin-left:10px;">${d.badLabel}</span></div>${d.bad.split('\n').filter(Boolean).map(x=>`<div style="display:flex;font-size:34px;color:#5b4b4b;margin-bottom:22px;">${x}</div>`).join('')}</div>
        <div style="display:flex;flex-direction:column;width:425px;background:#E2EFE6;border-radius:22px;padding:34px;"><div style="display:flex;align-items:center;font-size:40px;font-weight:900;color:#2E7D4F;margin-bottom:26px;">${icon('check','#2E7D4F',40,3.6)}<span style="margin-left:10px;">${d.goodLabel}</span></div>${d.good.split('\n').filter(Boolean).map(x=>`<div style="display:flex;font-size:34px;color:#3e5246;margin-bottom:22px;">${x}</div>`).join('')}</div>
      </div>`) },

  { id:'content_quote', name:'B7 引用・一言（中身）', cat:'中身',
    fields:[{key:'idx',label:'番号',def:'1'},{key:'total',label:'総数',def:'8'},{key:'line1',label:'一言1',def:'全員に好かれようと'},{key:'line2',label:'一言2',def:'しなくていい。'},{key:'support',label:'裏付け',def:'嫌われる勇気が、自分をラクにする'},{key:'handle',label:'アカウント',def:'@気にしない練習'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.head,align:'center'},`
      <div style="display:flex;font-family:${t.body};font-size:40px;letter-spacing:4px;color:${t.line};">${d.idx} / ${d.total}</div>
      <div style="display:flex;font-size:64px;font-weight:700;line-height:1.6;margin-top:40px;">${d.line1}</div>
      <div style="display:flex;font-size:64px;font-weight:700;line-height:1.6;">${d.line2}</div>
      <div style="display:flex;width:80px;height:2px;background:${t.accent};margin-top:40px;margin-bottom:30px;"></div>
      <div style="display:flex;font-family:${t.body};font-size:33px;color:${t.accent};">${d.support}</div>
      <div style="display:flex;font-family:${t.body};font-size:26px;color:${t.line};margin-top:46px;">${d.handle}</div>`) },

  { id:'content_ranking', name:'B ランキング（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'貯まる人がやめた支出 TOP5'},{key:'items',label:'ランキング項目',type:'rows',cols:['項目','補足(任意)'],def:'コンビニ通い｜月1.2万円\nサブスク放置｜月3千円\nなんとなく外食｜月2万円\nリボ払い｜利息がムダ\n保険の入りすぎ｜月5千円'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:54px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:40px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map((it,i)=>{const p=it.split('｜');const label=p[0];const val=p[1]||'';const meds=['#D9A93B','#AEB3BA','#C2814B'];const rc=i<3?meds[i]:t.accent;return `<div style="display:flex;align-items:center;background:${t.panel};border-radius:18px;padding:20px 26px;margin-bottom:18px;"><div style="display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:${rc};color:#ffffff;font-family:${t.display};font-size:34px;margin-right:24px;">${i+1}</div><div style="display:flex;flex-grow:1;font-size:40px;font-weight:700;">${label}</div>${val?`<div style="display:flex;font-size:32px;font-weight:700;color:${t.accent};margin-left:16px;">${val}</div>`:''}</div>`}).join('')}</div>`) },

  { id:'content_photo', name:'B6 写真アップ型（中身/表紙）', cat:'中身',
    fields:[{key:'photo',label:'写真をアップ',type:'file',def:''},{key:'label',label:'ラベル(任意)',def:'やってみた'},{key:'title',label:'見出し',def:'1ヶ月、コンビニを\nやめてみた結果。'},{key:'sub',label:'サブ(任意)',def:'浮いたお金、まさかの○円。'}],
    render:(d,t)=>{const titleLines=String(d.title).split('\n').map(l=>`<div style="display:flex;">${l}</div>`).join('');
      const bg=d.photo?`background-image:url(${d.photo});background-size:cover;background-position:center;`:`background-color:${t.panelSoft};`;
      return `<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;font-family:${t.body};${bg}">
        <div style="display:flex;flex-direction:column;width:1080px;box-sizing:border-box;padding:300px 90px 150px 90px;background-image:linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.82));">
          ${d.label?`<div style="display:flex;align-self:flex-start;background:${t.accent};color:${t.onAccent};font-size:30px;font-weight:700;padding:10px 22px;border-radius:10px;margin-bottom:24px;">${d.label}</div>`:''}
          <div style="display:flex;flex-direction:column;font-size:84px;font-weight:900;font-family:${t.head};color:#ffffff;line-height:1.25;">${titleLines}</div>
          ${d.sub?`<div style="display:flex;font-size:36px;color:#eeeeee;margin-top:20px;">${d.sub}</div>`:''}
        </div>
      </div>`;} },

  { id:'intro_empathy', name:'導入・共感（2枚目）', cat:'中身',
    fields:[{key:'label',label:'ラベル',def:'はじめに'},{key:'line1',label:'共感1',def:'わたしも、人の機嫌や視線を'},{key:'line2',label:'共感2',def:'ずっと気にしすぎる側でした。'},{key:'bridge',label:'予告',def:'知ってラクになった言葉を、8つ。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.head,align:'center'},`
      <div style="display:flex;font-family:${t.body};font-size:30px;letter-spacing:6px;color:${t.accent};">${d.label}</div>
      <div style="display:flex;width:60px;height:2px;background:${t.accent};margin-top:20px;margin-bottom:40px;"></div>
      <div style="display:flex;font-size:56px;font-weight:700;line-height:1.6;">${d.line1}</div>
      <div style="display:flex;font-size:56px;font-weight:700;line-height:1.6;">${d.line2}</div>
      <div style="display:flex;width:60px;height:2px;background:${t.accent};margin-top:44px;margin-bottom:30px;"></div>
      <div style="display:flex;font-family:${t.body};font-size:36px;color:${t.accent};">${d.bridge}</div>`) },

  { id:'content_steps', name:'手順・ステップ（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'格安SIM乗り換え 3ステップ'},{key:'steps',label:'手順',type:'rows',cols:['手順'],def:'今の契約をスクショで確認\nMNP予約番号を発行（15分）\n新SIMを申込→届いたら差し替え'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:46px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.steps.split('\n').filter(Boolean).map((s,i)=>`<div style="display:flex;align-items:center;margin-bottom:32px;"><div style="display:flex;align-items:center;justify-content:center;width:78px;height:78px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:40px;margin-right:28px;">${i+1}</div><div style="display:flex;flex-grow:1;font-size:40px;font-weight:700;">${s}</div></div>`).join('')}</div>`) },

  { id:'content_checklist', name:'チェックリスト（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'貯まる人の習慣チェック'},{key:'items',label:'項目',type:'rows',cols:['項目'],def:'給料日に先取り貯金してる\n固定費を年1で見直してる\nサブスクを把握してる\nふるさと納税を使ってる\n家計簿アプリで自動記録'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:46px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map(it=>`<div style="display:flex;align-items:center;margin-bottom:28px;"><div style="display:flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:12px;background:${t.accent};margin-right:24px;">${icon('check',t.onAccent,30,3.4)}</div><div style="display:flex;font-size:40px;font-weight:500;">${it}</div></div>`).join('')}</div>`) },

  { id:'content_qa', name:'Q&A（中身）', cat:'中身',
    fields:[{key:'q',label:'質問（改行で折る位置を指定）',def:'格安SIMって、\nつながりにくいの？'},{key:'a',label:'回答（改行で折る位置を指定）',def:'大手の回線を借りてるから、\nエリアは基本同じ。\nお昼の混雑時だけ、\n少し遅く感じる程度です。'}],
    render:(d,t)=>{const L=s=>String(s).split('\n').filter(x=>x.length).map(x=>`<div style="display:flex;">${x}</div>`).join('');return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:flex-start;margin-bottom:44px;"><div style="display:flex;align-items:center;justify-content:center;width:74px;height:74px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.head};font-weight:900;font-size:40px;margin-right:26px;flex-shrink:0;">Q</div><div style="display:flex;flex-direction:column;flex-grow:1;font-size:52px;font-weight:900;font-family:${t.head};line-height:1.4;">${L(d.q)}</div></div>
      <div style="display:flex;align-items:flex-start;"><div style="display:flex;align-items:center;justify-content:center;width:74px;height:74px;border-radius:50%;background:${t.panelSoft};color:${t.accentDeep};font-family:${t.head};font-weight:900;font-size:40px;margin-right:26px;flex-shrink:0;">A</div><div style="display:flex;flex-direction:column;flex-grow:1;font-size:40px;line-height:1.6;color:${t.ink};">${L(d.a)}</div></div>`);} },

  { id:'content_stat', name:'データ強調（中身）', cat:'中身',
    fields:[{key:'label',label:'前置き',def:'実は'},{key:'stat',label:'数字',def:'72'},{key:'unit',label:'単位',def:'%'},{key:'desc',label:'説明',def:'の人が「使ってないサブスク」に\n気づいていないという結果。'},{key:'source',label:'注記',def:'※イメージ・出典は要確認'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;font-size:40px;font-weight:700;color:${t.accent};">${d.label}</div>
      <div style="display:flex;align-items:baseline;margin-top:6px;margin-bottom:18px;"><div style="display:flex;font-family:${t.display};font-size:240px;color:${t.accent};line-height:1;">${d.stat}</div><div style="display:flex;font-size:96px;font-weight:900;font-family:${t.display};color:${t.accent};">${d.unit}</div></div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:44px;font-weight:700;line-height:1.5;">${String(d.desc).split('\n').map(l=>`<div style="display:flex;">${l}</div>`).join('')}</div>
      <div style="display:flex;font-size:26px;color:${t.sub};margin-top:40px;">${d.source}</div>`) },

  { id:'content_ba', name:'B4 Before/After（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'やめたら、こう変わった'},{key:'before',label:'Before（改行で折る）',def:'給料日前は、いつも金欠。\n何に使ったか分からない。'},{key:'after',label:'After（改行で折る）',def:'毎月3万、自動で貯まる。\nお金の流れが見える。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};margin-bottom:44px;">${nl(d.title)}</div>
      <div style="display:flex;flex-direction:column;background:${t.panel};border:3px solid ${t.line};border-radius:22px;padding:36px;"><div style="display:flex;font-size:32px;font-weight:900;color:${t.sub};margin-bottom:18px;">Before</div><div style="display:flex;flex-direction:column;font-size:42px;font-weight:700;line-height:1.4;color:${t.sub};">${nl(d.before)}</div></div>
      <div style="display:flex;align-self:center;font-size:54px;color:${t.accent};margin-top:22px;margin-bottom:22px;">↓</div>
      <div style="display:flex;flex-direction:column;background:${t.accent};border-radius:22px;padding:36px;color:${t.onAccent};"><div style="display:flex;font-size:32px;font-weight:900;margin-bottom:18px;">After</div><div style="display:flex;flex-direction:column;font-size:42px;font-weight:700;line-height:1.4;">${nl(d.after)}</div></div>`) },

  { id:'content_vs', name:'B6 VS比較カード（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'一括 vs 分割、どっち得?'},{key:'leftLabel',label:'左ラベル',def:'分割払い'},{key:'leftBig',label:'左の数字',def:'+1.5万'},{key:'leftPoints',label:'左の点',type:'rows',cols:['ポイント'],def:'月の負担は軽い\n総額は高くなる'},{key:'rightLabel',label:'右ラベル',def:'一括払い'},{key:'rightBig',label:'右の数字',def:'手数料0円'},{key:'rightPoints',label:'右の点',type:'rows',cols:['ポイント'],def:'総額が一番安い\n管理もシンプル'},{key:'callout',label:'下のまとめ（改行で折る）',def:'差額1.5万円＝月1の外食15回分。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:52px;font-weight:900;font-family:${t.head};margin-bottom:40px;">${nl(d.title)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;flex-direction:column;width:390px;background:${t.panel};border:3px solid ${t.line};border-radius:22px;padding:30px;"><div style="display:flex;font-size:34px;font-weight:900;color:${t.sub};margin-bottom:14px;">${d.leftLabel}</div><div style="display:flex;font-size:54px;font-weight:900;font-family:${t.head};color:${t.ink};margin-bottom:20px;">${d.leftBig}</div><div style="display:flex;flex-direction:column;">${d.leftPoints.split('\n').filter(Boolean).map(p=>`<div style="display:flex;font-size:32px;color:${t.sub};margin-bottom:10px;">${p}</div>`).join('')}</div></div>
        <div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:84px;height:84px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:34px;">VS</div>
        <div style="display:flex;flex-direction:column;width:390px;background:${t.accent};border-radius:22px;padding:30px;color:${t.onAccent};"><div style="display:flex;font-size:34px;font-weight:900;margin-bottom:14px;">${d.rightLabel}</div><div style="display:flex;font-size:54px;font-weight:900;font-family:${t.head};margin-bottom:20px;">${d.rightBig}</div><div style="display:flex;flex-direction:column;">${d.rightPoints.split('\n').filter(Boolean).map(p=>`<div style="display:flex;font-size:32px;margin-bottom:10px;">${p}</div>`).join('')}</div></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:40px;background:${t.panelSoft};color:${t.accentDeep};font-size:38px;font-weight:700;padding:28px;border-radius:18px;">${nl(d.callout)}</div>`) },

  { id:'content_editorial', name:'B14 エディトリアル番号（中身）', cat:'中身',
    fields:[{key:'no',label:'番号',def:'01'},{key:'category',label:'英字ラベル',def:'FIRST STEP'},{key:'headline',label:'見出し（改行で折る）',def:'まず、\n先取りで貯める。'},{key:'body',label:'本文（改行で折る）',def:'給料が入ったら、使う前に\n貯金分を別口座へ。\n「残ったら貯金」は、一生残らない。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:baseline;margin-bottom:10px;"><div style="display:flex;font-family:${t.display};font-size:150px;color:${t.accent};line-height:0.9;opacity:0.9;">${d.no}</div><div style="display:flex;margin-left:28px;font-size:34px;font-weight:700;letter-spacing:4px;color:${t.sub};">${d.category}</div></div>
      <div style="display:flex;flex-direction:column;font-size:68px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.headline)}</div>
      <div style="display:flex;width:90px;height:4px;background:${t.line};margin-top:34px;margin-bottom:34px;"></div>
      <div style="display:flex;flex-direction:column;font-size:38px;line-height:1.7;color:${t.ink};">${nl(d.body)}</div>`) },

  { id:'content_quote_dark', name:'B15 黒地特大引用（中身）', cat:'中身',
    fields:[{key:'quote',label:'引用（改行で折る）',def:'本当の節約とは、\n我慢ではなく、\n仕組みである。'},{key:'source',label:'出典・補足',def:'お金が貯まる人の共通点'}],
    render:(d,t)=>`<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:150px 110px;background:${t.darkBg};color:${t.darkInk};font-family:${t.body};">
      <div style="display:flex;font-family:'Shippori Mincho';font-size:130px;color:${t.darkAccent};line-height:0.8;margin-bottom:24px;">“</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-family:'Shippori Mincho';font-size:62px;font-weight:700;line-height:1.6;">${nl(d.quote)}</div>
      <div style="display:flex;width:70px;height:2px;background:${t.darkAccent};margin-top:50px;margin-bottom:24px;"></div>
      <div style="display:flex;font-size:30px;color:${t.darkSub};">${d.source}</div>
    </div>` },

  { id:'content_photo_band', name:'B16 写真＋帯テキスト（中身）', cat:'中身',
    fields:[{key:'photo',label:'写真をアップ',type:'file',def:''},{key:'no',label:'番号',def:'1'},{key:'category',label:'ラベル',def:'まずこれ'},{key:'headline',label:'見出し（改行で折る）',def:'給料日に、\n自動で移す。'},{key:'body',label:'本文（改行で折る）',def:'銀行の自動振替を設定するだけ。\n手取りの10%から始めれば十分。'}],
    render:(d,t)=>{const bg=d.photo?`background-image:url(${d.photo});background-size:cover;background-position:center;`:`background-color:${t.panelSoft};`;
      return `<div style="width:1080px;height:1350px;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;font-family:${t.body};">
        <div style="display:flex;width:1080px;height:600px;${bg}"></div>
        <div style="display:flex;flex-direction:column;flex-grow:1;background:${t.bg};padding:56px 90px;">
          <div style="display:flex;align-items:center;margin-bottom:24px;"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-size:34px;font-weight:900;margin-right:20px;">${d.no}</div><div style="display:flex;font-size:34px;font-weight:700;letter-spacing:2px;color:${t.accent};">${d.category}</div></div>
          <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};line-height:1.3;color:${t.ink};">${nl(d.headline)}</div>
          <div style="display:flex;flex-direction:column;margin-top:22px;font-size:36px;line-height:1.6;color:${t.ink};">${nl(d.body)}</div>
        </div>
      </div>`;} },

  { id:'content_diagram', name:'B17 ミニ図解＋キャプション（中身）', cat:'中身',
    fields:[{key:'lead',label:'前置き',def:'習慣化までの道のり'},{key:'big',label:'特大の数字',def:'66日'},{key:'filled',label:'埋める数（/40）',def:'14'},{key:'caption',label:'キャプション（改行で折る）',def:'14日続けば、もう半分。\n毎日ちょっとずつでいい。'}],
    render:(d,t)=>{const total=40,fill=Math.max(0,Math.min(total,parseInt(d.filled)||0));const dots=Array.from({length:total}).map((_,i)=>`<div style="display:flex;width:50px;height:50px;border-radius:50%;background:${i<fill?t.accent:t.line};margin:9px;"></div>`).join('');
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
        <div style="display:flex;font-size:40px;font-weight:700;color:${t.sub};margin-bottom:8px;">${d.lead}</div>
        <div style="display:flex;font-family:${t.display};font-size:130px;color:${t.accent};line-height:1;margin-bottom:44px;">${d.big}</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;width:760px;margin-bottom:44px;">${dots}</div>
        <div style="display:flex;flex-direction:column;align-items:center;font-size:42px;font-weight:700;line-height:1.5;">${nl(d.caption)}</div>`);} },

  { id:'content_lessons', name:'B20 番号レッスン（中身）', cat:'中身',
    fields:[{key:'title',label:'見出し（改行で折る）',def:'お金が貯まる\n3つの原則'},{key:'lessons',label:'レッスン',type:'rows',cols:['見出し','説明'],def:'先取り｜使う前に、貯金分を分ける\n固定費優先｜一度直せば、毎月効く\n自動化｜意志に頼らない仕組みにする'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:58px;font-weight:900;font-family:${t.head};margin-bottom:46px;">${nl(d.title)}</div>
      <div style="display:flex;flex-direction:column;">${d.lessons.split('\n').filter(Boolean).map((l,i)=>{const p=l.split('｜');const h=p[0];const desc=p[1]||'';return `<div style="display:flex;align-items:flex-start;margin-bottom:36px;"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:70px;height:70px;border-radius:16px;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:36px;margin-right:26px;">${i+1}</div><div style="display:flex;flex-direction:column;flex-grow:1;"><div style="display:flex;font-size:46px;font-weight:900;color:${t.ink};">${h}</div>${desc?`<div style="display:flex;margin-top:8px;font-size:36px;color:${t.sub};">${desc}</div>`:''}</div></div>`;}).join('')}</div>`) },

  { id:'content_gold_panels', name:'B21 白帯×金文字ポイント（美容PR）（中身）', cat:'中身',
    fields:[{key:'title',label:'袋文字見出し（改行で折る）',def:'ふきとりが\nいい理由'},{key:'points',label:'ポイント',type:'rows',cols:['見出し','説明'],def:'汚れもしっかりオフ｜洗顔で落ちきらない汚れも、ふきとりでオフ\nうるおいキープ｜さっぱりなのに、しっとり仕上がり\nあとのケアも｜肌を整えて、次のケアがなじみやすく'}],
    render:(d,t)=>wrap({bg:t.panelSoft,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;align-items:center;font-size:64px;font-weight:900;font-family:${t.head};line-height:1.35;color:#FFFDF5;text-shadow:${outline(t.accentDeep,'rgba(120,90,20,0.22)')};margin-bottom:50px;">${nl(d.title)}</div>
      <div style="display:flex;flex-direction:column;">${d.lessons?'':''}${d.points.split('\n').filter(Boolean).map(p=>{const x=p.split('｜');const h=x[0];const desc=x[1]||'';return `<div style="display:flex;flex-direction:column;margin-bottom:30px;"><div style="display:flex;align-self:stretch;justify-content:center;background:#FFFFFF;border-radius:14px;padding:18px 26px;box-shadow:0 4px 14px rgba(150,120,40,0.15);"><div style="display:flex;font-size:40px;font-weight:900;color:${t.accentDeep};">${h}</div></div>${desc?`<div style="display:flex;font-size:32px;line-height:1.5;color:${t.ink};padding:16px 22px 0;">${desc}</div>`:''}</div>`;}).join('')}</div>`) },

  { id:'content_face', name:'顔ゾーン%図解（イラスト選択）（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'大人ニキビ、\nどこにできやすい?'},{key:'face',label:'顔タイプ',type:'select',options:['女性','男性','女性ショート','ポニーテール','眼鏡','シンプル'],def:'女性'},{key:'z1label',label:'ゾーン1',def:'額（Tゾーン）'},{key:'z1pct',label:'%1',def:'29%'},{key:'z2label',label:'ゾーン2',def:'頬'},{key:'z2pct',label:'%2',def:'35%'},{key:'z3label',label:'ゾーン3',def:'あご・フェイスライン'},{key:'z3pct',label:'%3',def:'55%'},{key:'caption',label:'キャプション（改行で折る）',def:'20代以降は、あご周りが\n増えやすいみたい。'}],
    render:(d,t)=>{const col=['#7FB1D6','#E59CB0','#92C29A'];const rows=[[d.z1label,d.z1pct,0],[d.z2label,d.z2pct,1],[d.z3label,d.z3pct,2]];
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;flex-direction:column;font-size:54px;font-weight:900;font-family:${t.head};margin-bottom:24px;">${nl(d.title)}</div>
        <div style="display:flex;justify-content:center;margin-bottom:30px;"><img src="${faceSVG(col[0],col[1],col[2],d.face)}" style="width:330px;height:402px;"/></div>
        <div style="display:flex;flex-direction:column;">${rows.map(([lab,pct,i])=>`<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${t.line};padding-bottom:18px;margin-bottom:18px;"><div style="display:flex;align-items:center;"><div style="display:flex;flex-shrink:0;width:34px;height:34px;border-radius:50%;background:${col[i]};margin-right:22px;"></div><div style="display:flex;font-size:40px;font-weight:700;">${lab}</div></div><div style="display:flex;flex-shrink:0;font-family:${t.display};font-size:58px;color:${t.accent};line-height:1;">${pct}</div></div>`).join('')}</div>
        <div style="display:flex;flex-direction:column;margin-top:26px;font-size:36px;line-height:1.5;color:${t.ink};">${nl(d.caption)}</div>`);} },

  { id:'content_face_photo', name:'顔ゾーン%図解（写真差し替え）（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'大人ニキビ、\nどこにできやすい?'},{key:'photo',label:'顔写真/イラストをアップ',type:'file',def:''},{key:'z1label',label:'ゾーン1',def:'額（Tゾーン）'},{key:'z1pct',label:'%1',def:'29%'},{key:'z2label',label:'ゾーン2',def:'頬'},{key:'z2pct',label:'%2',def:'35%'},{key:'z3label',label:'ゾーン3',def:'あご・フェイスライン'},{key:'z3pct',label:'%3',def:'55%'},{key:'caption',label:'キャプション（改行で折る）',def:'20代以降は、あご周りが\n増えやすいみたい。'}],
    render:(d,t)=>{const col=['#7FB1D6','#E59CB0','#92C29A'];const rows=[[d.z1label,d.z1pct,0],[d.z2label,d.z2pct,1],[d.z3label,d.z3pct,2]];
      const face=d.photo?`<img src="${d.photo}" style="width:360px;height:360px;border-radius:50%;object-fit:cover;"/>`:`<div style="display:flex;align-items:center;justify-content:center;width:360px;height:360px;border-radius:50%;background:${t.panelSoft};color:${t.sub};font-size:38px;border:4px dashed ${t.line};">＋ 顔写真</div>`;
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;flex-direction:column;font-size:54px;font-weight:900;font-family:${t.head};margin-bottom:24px;">${nl(d.title)}</div>
        <div style="display:flex;justify-content:center;margin-bottom:30px;">${face}</div>
        <div style="display:flex;flex-direction:column;">${rows.map(([lab,pct,i])=>`<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${t.line};padding-bottom:18px;margin-bottom:18px;"><div style="display:flex;align-items:center;"><div style="display:flex;flex-shrink:0;width:34px;height:34px;border-radius:50%;background:${col[i]};margin-right:22px;"></div><div style="display:flex;font-size:40px;font-weight:700;">${lab}</div></div><div style="display:flex;flex-shrink:0;font-family:${t.display};font-size:58px;color:${t.accent};line-height:1;">${pct}</div></div>`).join('')}</div>
        <div style="display:flex;flex-direction:column;margin-top:26px;font-size:36px;line-height:1.5;color:${t.ink};">${nl(d.caption)}</div>`);} },

  { id:'content_diag_grid', name:'診断・タイプ別グリッド（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'あなたはどのタイプ?\nお金の使い方診断'},{key:'types',label:'タイプ',type:'rows',cols:['顔タイプ','名前','ひとこと'],def:'女性｜貯金が生きがい｜コツコツ堅実派\n男性｜稼いで使う｜メリハリ消費派\n女性ショート｜推しに全力｜趣味優先派\nポニーテール｜しっかり管理｜計画的節約派'},{key:'foot',label:'下部',def:'詳しくはこのあと →'}],
    render:(d,t)=>{const bgs=['#FCE8E6','#E6F0FA','#FBF1DC','#E8F3E9'];const rows=d.types.split('\n').filter(Boolean).slice(0,4);
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;flex-direction:column;font-size:52px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.title)}</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;margin-top:30px;">${rows.map((r,i)=>{const p=r.split('｜');const v=p[0],nm=p[1]||'',note=p[2]||'';return `<div style="display:flex;flex-direction:column;align-items:center;width:418px;background:${bgs[i%4]};border-radius:22px;padding:26px 20px;margin-bottom:22px;"><img src="${faceSVG('none','#F2B8C0','none',v)}" style="width:148px;height:180px;"/><div style="display:flex;text-align:center;font-size:36px;font-weight:900;font-family:${t.head};margin-top:8px;">${nm}</div><div style="display:flex;text-align:center;font-size:28px;color:${t.sub};margin-top:6px;">${note}</div></div>`;}).join('')}</div>
        <div style="display:flex;margin-top:8px;font-size:34px;color:${t.sub};">${d.foot}</div>`);} },

  { id:'content_diag_detail', name:'診断・タイプ詳細（中身）', cat:'中身',
    fields:[{key:'face',label:'顔タイプ',type:'select',options:['女性','男性','女性ショート','ポニーテール','眼鏡','シンプル'],def:'女性'},{key:'lead',label:'リード',def:'あなたはこのタイプ'},{key:'typeName',label:'タイプ名（改行で折る）',def:'コツコツ堅実タイプ'},{key:'traits',label:'特徴',type:'rows',cols:['特徴'],def:'先取り貯金が得意\n衝動買いは少なめ\nセールに惑わされない\n計画を立てるのが好き'},{key:'advice',label:'ひとこと（改行で折る）',def:'その堅実さが最大の武器。\nたまには自分にご褒美も。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;font-size:34px;font-weight:700;color:${t.accent};margin-bottom:8px;">${d.lead}</div>
      <div style="display:flex;flex-direction:column;font-size:62px;font-weight:900;font-family:${t.head};line-height:1.25;margin-bottom:34px;">${nl(d.typeName)}</div>
      <div style="display:flex;align-items:center;">
        <div style="display:flex;flex-shrink:0;"><img src="${faceSVG('none','#F2B8C0','none',d.face)}" style="width:300px;height:365px;"/></div>
        <div style="display:flex;flex-direction:column;flex-grow:1;margin-left:24px;">${d.traits.split('\n').filter(Boolean).map(x=>`<div style="display:flex;align-items:center;margin-bottom:24px;"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:${t.accent};margin-right:18px;">${icon('check',t.onAccent,26,3.4)}</div><div style="display:flex;flex-grow:1;font-size:36px;font-weight:700;">${x}</div></div>`).join('')}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-self:stretch;margin-top:30px;background:${t.panelSoft};color:${t.accentDeep};font-size:36px;font-weight:700;line-height:1.5;padding:26px 30px;border-radius:18px;">${nl(d.advice)}</div>`) },

  { id:'content_roadmap', name:'ロードマップ・縦タイムライン（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'お金が貯まるまでの\n3ステップ'},{key:'steps',label:'ステップ',type:'rows',cols:['見出し','説明'],def:'支出を把握する｜まず1ヶ月、何に使ったか書き出す\n固定費を見直す｜通信・保険・サブスクを一度だけ整理\n先取り貯金を自動化｜給料日に、自動で別口座へ'}],
    render:(d,t)=>{const steps=d.steps.split('\n').filter(Boolean);
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
        <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:44px;border-radius:4px;"></div>
        <div style="display:flex;flex-direction:column;">${steps.map((s,i,a)=>{const p=s.split('｜');const h=p[0];const desc=p[1]||'';return `<div style="display:flex;align-items:stretch;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:80px;margin-right:28px;"><div style="display:flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:40px;flex-shrink:0;">${i+1}</div>${i<a.length-1?`<div style="display:flex;flex-grow:1;width:6px;background:${t.line};margin-top:6px;border-radius:3px;"></div>`:''}</div><div style="display:flex;flex-direction:column;flex-grow:1;padding-bottom:44px;"><div style="display:flex;font-size:46px;font-weight:900;font-family:${t.head};">${h}</div><div style="display:flex;margin-top:10px;font-size:34px;line-height:1.5;color:${t.sub};">${desc}</div></div></div>`}).join('')}</div>`);} },

  { id:'content_ingredients', name:'材料リスト（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'材料（2人分）'},{key:'items',label:'材料',type:'rows',cols:['材料','分量'],def:'鶏むね肉｜200g\n塩こうじ｜大さじ1\n片栗粉｜適量\nサラダ油｜大さじ2\n黒こしょう｜少々'},{key:'note',label:'ひとこと（改行で折る）',def:'家にあるものでOK。'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;font-size:56px;font-weight:900;font-family:${t.head};">${d.title}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:44px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map(it=>{const p=it.split('｜');const nm=p[0];const amt=p[1]||'';return `<div style="display:flex;align-items:flex-end;margin-bottom:28px;"><div style="display:flex;flex-shrink:0;font-size:42px;font-weight:700;">${nm}</div><div style="display:flex;flex-grow:1;height:0;border-bottom:4px dashed ${t.line};margin:0 16px 12px;"></div><div style="display:flex;flex-shrink:0;font-size:42px;font-weight:900;color:${t.accentDeep};">${amt}</div></div>`;}).join('')}</div>
      <div style="display:flex;flex-direction:column;align-self:flex-start;margin-top:20px;background:${t.panelSoft};color:${t.accentDeep};font-size:34px;font-weight:700;padding:20px 28px;border-radius:16px;">${nl(d.note)}</div>`) },

  { id:'content_photo_steps', name:'番号付き写真ステップ（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'作り方'},{key:'photo1',label:'写真1',type:'file',def:''},{key:'cap1',label:'説明1',def:'下味をつけて10分置く'},{key:'photo2',label:'写真2',type:'file',def:''},{key:'cap2',label:'説明2',def:'片栗粉を全体にまぶす'},{key:'photo3',label:'写真3',type:'file',def:''},{key:'cap3',label:'説明3',def:'こんがり焼いたら完成'}],
    render:(d,t)=>{const cells=[[d.photo1,d.cap1],[d.photo2,d.cap2],[d.photo3,d.cap3]];
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;font-size:56px;font-weight:900;font-family:${t.head};">${d.title}</div>
        <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:46px;border-radius:4px;"></div>
        <div style="display:flex;justify-content:space-between;">${cells.map(([ph,cap],i)=>`<div style="display:flex;flex-direction:column;align-items:center;width:280px;"><div style="display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:32px;margin-bottom:14px;">${i+1}</div>${ph?`<img src="${ph}" style="width:280px;height:280px;border-radius:18px;object-fit:cover;"/>`:`<div style="display:flex;align-items:center;justify-content:center;width:280px;height:280px;border-radius:18px;background:${t.panelSoft};color:${t.sub};font-size:30px;border:3px dashed ${t.line};">写真${i+1}</div>`}<div style="display:flex;text-align:center;margin-top:16px;font-size:30px;line-height:1.4;color:${t.ink};">${cap}</div></div>`).join('')}</div>`);} },

  { id:'content_biglist', name:'大数字リスト（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'貯まる人の3習慣'},{key:'items',label:'項目',type:'rows',cols:['見出し','説明'],def:'先取り貯金｜使う前に、貯金分を分ける\n固定費見直し｜一度直せば、毎月ずっと効く\n自動化｜意志に頼らない仕組みにする'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:40px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map((it,i)=>{const p=it.split('｜');const h=p[0];const desc=p[1]||'';return `<div style="display:flex;align-items:flex-start;margin-bottom:34px;"><div style="display:flex;flex-shrink:0;width:128px;font-family:${t.display};font-size:120px;color:${t.accent};line-height:0.85;">${i+1}</div><div style="display:flex;flex-direction:column;flex-grow:1;margin-left:12px;padding-top:12px;"><div style="display:flex;font-size:48px;font-weight:900;font-family:${t.head};">${h}</div><div style="display:flex;margin-top:8px;font-size:34px;line-height:1.5;color:${t.sub};">${desc}</div></div></div>`;}).join('')}</div>`) },

  { id:'content_timetable', name:'時間軸タイムテーブル（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'わたしの朝ルーティン'},{key:'items',label:'予定',type:'rows',cols:['時刻','予定','補足'],def:'6:30｜起きて白湯を飲む｜まず体を起こす\n6:45｜10分だけ散歩｜朝日を浴びる\n7:00｜朝食＋身支度｜スマホは見ない\n7:40｜余裕をもって出発｜駅まで歩く'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:54px;font-weight:900;font-family:${t.head};margin-bottom:40px;">${nl(d.title)}</div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map(it=>{const p=it.split('｜');const time=p[0];const act=p[1]||'';const sub=p[2]||'';return `<div style="display:flex;align-items:stretch;margin-bottom:18px;"><div style="display:flex;flex-shrink:0;width:130px;font-size:36px;font-weight:900;color:${t.accentDeep};padding-top:24px;">${time}</div><div style="display:flex;flex-direction:column;flex-grow:1;background:${t.panel};border-left:8px solid ${t.accent};border-top-right-radius:16px;border-bottom-right-radius:16px;padding:22px 28px;"><div style="display:flex;font-size:40px;font-weight:900;font-family:${t.head};">${act}</div>${sub?`<div style="display:flex;margin-top:6px;font-size:30px;color:${t.sub};">${sub}</div>`:''}</div></div>`;}).join('')}</div>`) },

  { id:'content_calendar', name:'月間カレンダー（中身）', cat:'中身',
    fields:[{key:'month',label:'月',def:'6'},{key:'title',label:'見出し',def:'今月の予定'},{key:'sub',label:'サブ',def:'〜イベントのお知らせ〜'},{key:'startCol',label:'1日の曜日(0日〜6土)',def:'0'},{key:'days',label:'日数',def:'30'},{key:'marks',label:'印つき日(カンマ区切り)',def:'7,14,21,28'},{key:'legend',label:'凡例',def:'●の日はライブ配信！詳細はキャプション'}],
    render:(d,t)=>{const start=Math.max(0,Math.min(6,parseInt(d.startCol)||0));const days=parseInt(d.days)||30;const marked=new Set((d.marks||'').split(',').map(x=>x.trim()).filter(Boolean));const wd=['日','月','火','水','木','金','土'];const cells=[];for(let i=0;i<start;i++)cells.push('');for(let n=1;n<=days;n++)cells.push(String(n));while(cells.length%7)cells.push('');
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;align-items:baseline;"><div style="display:flex;font-family:${t.display};font-size:84px;color:${t.accent};line-height:1;">${d.month}</div><div style="display:flex;margin-left:16px;font-size:42px;font-weight:900;font-family:${t.head};">${d.title}</div></div>
        <div style="display:flex;font-size:30px;color:${t.sub};margin-top:6px;margin-bottom:20px;">${d.sub}</div>
        <div style="display:flex;">${wd.map((w,i)=>`<div style="display:flex;align-items:center;justify-content:center;width:125px;height:50px;font-size:28px;font-weight:700;color:${i===0?'#C0392B':i===6?'#2C6FB0':t.sub};">${w}</div>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;">${cells.map(n=>`<div style="display:flex;align-items:center;justify-content:center;width:125px;height:104px;">${n?`<div style="display:flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:50%;${marked.has(n)?'background:'+t.accent+';':''}"><div style="display:flex;font-size:34px;font-weight:700;color:${marked.has(n)?t.onAccent:t.ink};">${n}</div></div>`:''}</div>`).join('')}</div>
        <div style="display:flex;margin-top:22px;font-size:30px;color:${t.sub};">${d.legend}</div>`);} },

  { id:'content_spectable', name:'スペック比較表（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル',def:'プラン比較'},{key:'cols',label:'列見出し（｜区切り 2〜3）',def:'無料｜有料'},{key:'rows',label:'行',type:'rows',cols:['項目','値1','値2'],def:'料金｜0円｜月980円\n保存数｜10件まで｜無制限\n広告｜あり｜なし\nサポート｜なし｜優先対応'}],
    render:(d,t)=>{const cols=d.cols.split('｜').filter(Boolean);const rows=d.rows.split('\n').filter(Boolean).map(r=>r.split('｜'));const n=cols.length;const cw=Math.floor(560/n);
      return wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
        <div style="display:flex;font-size:54px;font-weight:900;font-family:${t.head};margin-bottom:40px;">${d.title}</div>
        <div style="display:flex;align-items:stretch;background:${t.accent};border-top-left-radius:16px;border-top-right-radius:16px;"><div style="display:flex;width:320px;"></div>${cols.map(c=>`<div style="display:flex;align-items:center;justify-content:center;width:${cw}px;padding:22px 6px;color:${t.onAccent};font-size:36px;font-weight:900;">${c}</div>`).join('')}</div>
        ${rows.map((r,ri)=>`<div style="display:flex;align-items:stretch;background:${ri%2?t.panelSoft:t.panel};"><div style="display:flex;align-items:center;width:320px;padding:24px 26px;font-size:36px;font-weight:700;">${r[0]||''}</div>${cols.map((c,ci)=>`<div style="display:flex;align-items:center;justify-content:center;width:${cw}px;padding:24px 6px;font-size:34px;font-weight:700;color:${ci===n-1?t.accentDeep:t.ink};text-align:center;">${r[ci+1]||'-'}</div>`).join('')}</div>`).join('')}</div>`);} },

  { id:'content_spots', name:'スポットリスト（番号ピン）（中身）', cat:'中身',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'近所のおすすめカフェ'},{key:'spots',label:'スポット',type:'rows',cols:['名前','ひとこと'],def:'みなと珈琲｜静かで作業がはかどる\nベーカリー麦｜朝7時の焼きたてが神\n喫茶ベル｜昭和レトロな純喫茶\n本と珈琲 栞｜長居できる隠れ家'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:54px;font-weight:900;font-family:${t.head};">${nl(d.title)}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:42px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.spots.split('\n').filter(Boolean).map((s,i)=>{const p=s.split('｜');return `<div style="display:flex;align-items:flex-start;margin-bottom:32px;"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:${t.panelSoft};margin-right:22px;">${icon('map-pin',t.accentDeep,38,2)}</div><div style="display:flex;flex-direction:column;flex-grow:1;"><div style="display:flex;font-size:44px;font-weight:900;font-family:${t.head};">${p[0]}</div><div style="display:flex;margin-top:6px;font-size:34px;color:${t.sub};">${p[1]||''}</div></div></div>`;}).join('')}</div>`) },

  // ===== 締め =====
  { id:'cta_save', name:'C1 保存版CTA（締め）', cat:'締め',
    fields:[{key:'recapA',label:'問題再提示前',def:'固定費、ほっとくと'},{key:'recapHot',label:'数字(アクセント)',def:'年18万円'},{key:'recapB',label:'後',def:'の差。'},{key:'head1',label:'価値見出し1',def:'がんばる節約より、'},{key:'head2',label:'価値見出し2',def:'ラクで確実。'},{key:'vals',label:'得られること',type:'rows',cols:['得られること'],def:'今日からできる見直しを、毎日ひとつ\n食費を我慢せず、ムダだけ潰す\n保存して、見返すたびに効く'},{key:'handle',label:'アカウント',def:'@ゆる貯金'},{key:'icon',label:'アイコン(任意)',type:'icon',def:'sparkles'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:center;align-self:flex-start;"><div style="display:flex;background:${t.ink};color:${t.bg};font-size:34px;font-weight:900;padding:14px 28px;border-radius:12px;">保存版</div>${d.icon?`<div style="display:flex;margin-left:18px;">${icon(d.icon,t.accent,54,1.9)}</div>`:''}</div>
      <div style="display:flex;margin-top:38px;font-size:40px;font-weight:700;">${d.recapA}<span style="color:${t.accent};">${d.recapHot}</span>${d.recapB}</div>
      <div style="display:flex;margin-top:18px;font-size:64px;font-weight:900;font-family:${t.head};">${d.head1}</div>
      <div style="display:flex;font-size:64px;font-weight:900;font-family:${t.head};">${d.head2}</div>
      <div style="display:flex;flex-direction:column;margin-top:40px;">${d.vals.split('\n').filter(Boolean).map(v=>`<div style="display:flex;align-items:center;margin-bottom:22px;"><div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${t.accent};margin-right:20px;">${icon('check',t.onAccent,20,3.4)}</div><div style="display:flex;font-size:36px;">${v}</div></div>`).join('')}</div>
      <div style="display:flex;flex-direction:column;margin-top:22px;background:${t.accent};border-radius:24px;padding:32px 38px;color:${t.onAccent};"><div style="display:flex;font-size:40px;font-weight:900;">① まず “保存” → 来月の見直しに</div><div style="display:flex;font-size:36px;font-weight:700;margin-top:14px;">② ${d.handle} をフォロー</div></div>`) },

  { id:'cta_next', name:'C2 次の行き先誘導（締め）', cat:'締め',
    fields:[{key:'head',label:'見出し',def:'次は、ここから。'},{key:'dest1',label:'行き先1',def:'プロフのハイライト「節約まとめ」'},{key:'dest2',label:'行き先2',def:'人気投稿「固定費の全リスト」'},{key:'dest3',label:'行き先3',def:'LINEで家計診断（無料）'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.darkBg,color:t.darkInk,font:t.body,align:'stretch'},`
      <div style="display:flex;font-size:62px;font-weight:900;font-family:${t.head};">${d.head}</div>
      <div style="display:flex;flex-direction:column;margin-top:46px;">${[d.dest1,d.dest2,d.dest3].filter(Boolean).map(x=>`<div style="display:flex;align-items:center;background:rgba(255,255,255,0.08);border-radius:18px;padding:26px 30px;margin-bottom:20px;"><div style="display:flex;color:${t.darkAccent};font-size:38px;font-weight:900;margin-right:20px;">→</div><div style="display:flex;font-size:38px;font-weight:700;">${x}</div></div>`).join('')}</div>
      <div style="display:flex;margin-top:44px;font-size:46px;font-weight:900;color:${t.darkAccent};">${d.handle}</div>`) },

  { id:'cta_recap_save', name:'C3 要約＋保存枠（締め）', cat:'締め',
    fields:[{key:'title',label:'まとめ見出し',def:'今日のまとめ'},{key:'points',label:'要点',type:'rows',cols:['要点'],def:'先取りで、自動で貯金\n固定費は、年1で見直し\nムダなサブスクは、即解約'},{key:'save',label:'保存メッセージ（改行で折る）',def:'迷ったら、\n保存して見返す。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:center;margin-bottom:34px;"><div style="display:flex;flex-shrink:0;">${icon('bookmark',t.accent,52,2)}</div><div style="display:flex;margin-left:18px;font-size:56px;font-weight:900;font-family:${t.head};">${d.title}</div></div>
      <div style="display:flex;flex-direction:column;border:3px solid ${t.line};border-radius:24px;padding:40px;">${d.points.split('\n').filter(Boolean).map((p,i,a)=>`<div style="display:flex;align-items:center;${i<a.length-1?'margin-bottom:24px;':''}"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:${t.accent};margin-right:22px;">${icon('check',t.onAccent,26,3.4)}</div><div style="display:flex;font-size:40px;font-weight:700;">${p}</div></div>`).join('')}</div>
      <div style="display:flex;flex-direction:column;align-self:flex-start;margin-top:36px;background:${t.panelSoft};color:${t.accentDeep};font-size:38px;font-weight:700;padding:22px 30px;border-radius:16px;">${nl(d.save)}</div>
      <div style="display:flex;margin-top:28px;font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_share', name:'C4 シェア誘導（締め）', cat:'締め',
    fields:[{key:'head',label:'見出し（改行で折る）',def:'誰かに教えたく\nなったら。'},{key:'sub',label:'サブ（改行で折る）',def:'シェアで、もう一人の\n「貯まらない」を救えるかも。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:50%;background:${t.accent};margin-bottom:46px;">${icon('share-2',t.onAccent,76,2)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:66px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.head)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:30px;font-size:38px;color:${t.sub};line-height:1.5;">${nl(d.sub)}</div>
      <div style="display:flex;margin-top:46px;font-size:44px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_q_save', name:'C5 問い返し＋保存（締め）', cat:'締め',
    fields:[{key:'q',label:'問い返し（改行で折る）',def:'刺さるの、\nあった?'},{key:'save',label:'保存促し（改行で折る）',def:'忘れないように、\n保存しておこ。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.head,align:'center'},`
      <div style="display:flex;flex-direction:column;align-items:center;font-size:90px;font-weight:900;line-height:1.25;">${nl(d.q)}</div>
      <div style="display:flex;align-items:center;margin-top:50px;border:3px solid ${t.accent};border-radius:40px;padding:24px 40px;"><div style="display:flex;flex-shrink:0;">${icon('bookmark',t.accent,44,2)}</div><div style="display:flex;flex-direction:column;margin-left:18px;font-family:${t.body};font-size:38px;font-weight:700;color:${t.accentDeep};">${nl(d.save)}</div></div>
      <div style="display:flex;margin-top:46px;font-family:${t.body};font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_circle', name:'C6 円形CTAバッジ（締め）', cat:'締め',
    fields:[{key:'pre',label:'前振り',def:'もっと知りたい人は'},{key:'circle',label:'丸の中（改行）',def:'プロフから\n無料で\n受け取る'},{key:'sub',label:'下サブ（改行で折る）',def:'お金の基本テンプレ、配布中。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;font-size:42px;font-weight:700;color:${t.sub};margin-bottom:34px;">${d.pre}</div>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:560px;height:560px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.head};font-size:72px;font-weight:900;line-height:1.3;">${nl(d.circle)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:40px;font-size:38px;font-weight:700;">${nl(d.sub)}</div>
      <div style="display:flex;margin-top:22px;font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_recap_follow', name:'C7 3行まとめ＋フォロー（締め）', cat:'締め',
    fields:[{key:'head',label:'見出し',def:'今日の3行まとめ'},{key:'lines',label:'3行',type:'rows',cols:['行'],def:'我慢の節約より、仕組みで自動。\n固定費は一度直せば、毎月効く。\n浮いたら、先取り貯金に回すだけ。'},{key:'follow',label:'フォロー誘導',def:'お金の話、毎日ひとつ。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;font-size:54px;font-weight:900;font-family:${t.head};">${d.head}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:40px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.lines.split('\n').filter(Boolean).map((l,i)=>`<div style="display:flex;align-items:center;margin-bottom:26px;"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:${t.accent};color:${t.onAccent};font-family:${t.display};font-size:30px;margin-right:24px;">${i+1}</div><div style="display:flex;flex-grow:1;font-size:40px;font-weight:700;">${l}</div></div>`).join('')}</div>
      <div style="display:flex;align-items:center;margin-top:30px;"><div style="display:flex;flex-shrink:0;">${icon('bell',t.accent,44,2)}</div><div style="display:flex;margin-left:16px;font-size:38px;font-weight:700;">${d.follow}</div><div style="display:flex;margin-left:14px;font-size:38px;font-weight:900;color:${t.accent};">${d.handle}</div></div>`) },

  { id:'cta_checklist', name:'C8 チェックリスト締め（締め）', cat:'締め',
    fields:[{key:'title',label:'見出し',def:'今日からやる3つ'},{key:'items',label:'項目',type:'rows',cols:['項目'],def:'銀行の自動振替を設定する\nサブスクを一覧にして見直す\nふるさと納税の上限を調べる'},{key:'foot',label:'締め（改行で折る）',def:'できたらチェック。\n保存して、見返す。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;font-size:56px;font-weight:900;font-family:${t.head};">${d.title}</div>
      <div style="display:flex;width:120px;height:8px;background:${t.accent};margin-top:18px;margin-bottom:42px;border-radius:4px;"></div>
      <div style="display:flex;flex-direction:column;">${d.items.split('\n').filter(Boolean).map(it=>`<div style="display:flex;align-items:center;margin-bottom:28px;"><div style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:54px;height:54px;border-radius:12px;background:${t.accent};margin-right:24px;">${icon('check',t.onAccent,30,3.4)}</div><div style="display:flex;font-size:40px;font-weight:500;">${it}</div></div>`).join('')}</div>
      <div style="display:flex;flex-direction:column;align-self:flex-start;margin-top:24px;background:${t.panelSoft};color:${t.accentDeep};font-size:36px;font-weight:700;padding:20px 28px;border-radius:16px;">${nl(d.foot)}</div>`) },

  { id:'cta_profile', name:'C9 プロフ誘導↑（締め）', cat:'締め',
    fields:[{key:'benefit',label:'価値（改行で折る）',def:'毎日ひとつ、\nお金が貯まるコツ。'},{key:'action',label:'行動',def:'フォローはこちら'},{key:'handle',label:'アカウント',def:'@ゆる貯金'},{key:'sub',label:'下誘導',def:'プロフィールから'}],
    render:(d,t)=>wrap({bg:t.darkBg,color:t.darkInk,font:t.body,align:'center'},`
      <div style="display:flex;align-items:center;justify-content:center;width:130px;height:130px;border-radius:50%;background:${t.darkAccent};margin-bottom:40px;">${icon('arrow-up',t.darkBg,72,2.4)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:64px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.benefit)}</div>
      <div style="display:flex;margin-top:36px;font-size:40px;font-weight:700;color:${t.darkSub};">${d.action}</div>
      <div style="display:flex;margin-top:14px;font-size:56px;font-weight:900;color:${t.darkAccent};">${d.handle}</div>
      <div style="display:flex;margin-top:28px;font-size:32px;color:${t.darkSub};">${d.sub}</div>`) },

  { id:'cta_dm', name:'C10 DM誘導（締め）', cat:'締め',
    fields:[{key:'pre',label:'前振り',def:'受け取りたい人は'},{key:'keyword',label:'合言葉',def:'テンプレ'},{key:'desc',label:'説明（改行で折る）',def:'お金の基本チェックシートを、\nDMで無料プレゼント。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;align-items:center;justify-content:center;width:140px;height:140px;border-radius:50%;background:${t.accent};margin-bottom:40px;">${icon('send',t.onAccent,70,2)}</div>
      <div style="display:flex;font-size:38px;font-weight:700;color:${t.sub};margin-bottom:18px;">${d.pre}</div>
      <div style="display:flex;align-items:center;font-size:60px;font-weight:900;font-family:${t.head};"><div style="display:flex;background:${t.panelSoft};color:${t.accentDeep};padding:8px 24px;border-radius:14px;margin-right:14px;">${d.keyword}</div><div style="display:flex;">とDM</div></div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:30px;font-size:36px;line-height:1.5;color:${t.ink};">${nl(d.desc)}</div>
      <div style="display:flex;margin-top:40px;font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_comment', name:'C11 コメント誘導（締め）', cat:'締め',
    fields:[{key:'q',label:'問い（改行で折る）',def:'あなたが最初に\n見直すなら、どれ?'},{key:'guide',label:'誘導',def:'コメントで教えて'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;align-items:center;justify-content:center;width:130px;height:130px;border-radius:50%;background:${t.panelSoft};margin-bottom:40px;">${icon('message-circle',t.accent,68,2)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:62px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.q)}</div>
      <div style="display:flex;align-items:center;margin-top:34px;background:${t.accent};color:${t.onAccent};font-size:40px;font-weight:700;padding:18px 36px;border-radius:999px;">${d.guide}</div>
      <div style="display:flex;margin-top:40px;font-size:40px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_next_preview', name:'C12 次回予告（締め）', cat:'締め',
    fields:[{key:'label',label:'ラベル',def:'NEXT'},{key:'title',label:'次回タイトル（改行で折る）',def:'貯金を“続ける”\n仕組みの作り方'},{key:'note',label:'ひとこと',def:'見逃さないように、フォローしてね。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.darkBg,color:t.darkInk,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:center;margin-bottom:30px;"><div style="display:flex;background:${t.darkAccent};color:${t.darkBg};font-size:30px;font-weight:900;letter-spacing:3px;padding:10px 22px;border-radius:8px;">${d.label}</div><div style="display:flex;margin-left:18px;font-size:34px;color:${t.darkSub};">次回予告</div></div>
      <div style="display:flex;flex-direction:column;font-size:70px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.title)}</div>
      <div style="display:flex;margin-top:40px;font-size:36px;color:${t.darkSub};">${nl(d.note)}</div>
      <div style="display:flex;margin-top:30px;font-size:46px;font-weight:900;color:${t.darkAccent};">${d.handle}</div>`) },

  { id:'cta_gift', name:'C13 無料プレゼント（締め）', cat:'締め',
    fields:[{key:'badge',label:'バッジ',def:'無料プレゼント'},{key:'item',label:'プレゼント内容（改行で折る）',def:'貯まる家計の\nテンプレート'},{key:'how',label:'受け取り方',def:'プロフのリンクから受け取れます'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:30px;background:${t.accent};margin-bottom:36px;">${icon('gift',t.onAccent,80,2)}</div>
      <div style="display:flex;background:${t.panelSoft};color:${t.accentDeep};font-size:32px;font-weight:900;padding:10px 24px;border-radius:999px;margin-bottom:28px;">${d.badge}</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:66px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.item)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:30px;font-size:36px;color:${t.sub};">${nl(d.how)}</div>
      <div style="display:flex;margin-top:24px;font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_intro', name:'C14 感謝＋自己紹介（締め）', cat:'締め',
    fields:[{key:'thanks',label:'感謝',def:'最後まで読んでくれて\nありがとう。'},{key:'about',label:'自己紹介（改行で折る）',def:'がんばらずにお金が貯まる\n仕組みを、毎日ひとつ発信中。'},{key:'follow',label:'フォロー文',def:'よかったらフォローしてね'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:58px;font-weight:900;font-family:${t.head};line-height:1.35;margin-bottom:40px;">${nl(d.thanks)}</div>
      <div style="display:flex;flex-direction:column;background:${t.panel};border-radius:22px;padding:38px;"><div style="display:flex;flex-direction:column;font-size:40px;font-weight:700;line-height:1.5;color:${t.ink};">${nl(d.about)}</div></div>
      <div style="display:flex;margin-top:40px;font-size:38px;color:${t.sub};">${d.follow}</div>
      <div style="display:flex;margin-top:12px;font-size:50px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_quote', name:'C15 引用締め（明朝・締め）', cat:'締め',
    fields:[{key:'quote',label:'一言（改行で折る）',def:'お金は、追うより\n仕組みで、ついてくる。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;flex-direction:column;align-items:center;font-family:'Shippori Mincho';font-size:64px;font-weight:700;line-height:1.6;">${nl(d.quote)}</div>
      <div style="display:flex;width:64px;height:2px;background:${t.accent};margin-top:50px;margin-bottom:26px;"></div>
      <div style="display:flex;font-size:38px;font-weight:700;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_question', name:'C16 質問返し1問（締め）', cat:'締め',
    fields:[{key:'q',label:'質問（改行で折る）',def:'あなたが今いちばん\n見直したい固定費は?'},{key:'sub',label:'サブ',def:'考えてみるだけで、変わり始める。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.head,align:'center'},`
      <div style="display:flex;font-size:120px;color:${t.accent};line-height:0.8;margin-bottom:20px;">?</div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:64px;font-weight:900;line-height:1.35;">${nl(d.q)}</div>
      <div style="display:flex;margin-top:34px;font-family:${t.body};font-size:36px;color:${t.sub};">${d.sub}</div>
      <div style="display:flex;margin-top:36px;font-family:${t.body};font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_savebig', name:'C17 保存版バッジ大（締め）', cat:'締め',
    fields:[{key:'big',label:'特大ワード',def:'保存版'},{key:'note',label:'一言（改行で折る）',def:'見返すたびに、\nお金が貯まる。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.darkBg,color:t.darkInk,font:t.body,align:'center'},`
      <div style="display:flex;align-items:center;margin-bottom:40px;"><div style="display:flex;flex-shrink:0;margin-right:24px;">${icon('bookmark',t.darkAccent,80,2)}</div><div style="display:flex;font-family:${t.display};font-size:150px;color:${t.darkAccent};line-height:1;">${d.big}</div></div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:50px;font-weight:700;line-height:1.4;">${nl(d.note)}</div>
      <div style="display:flex;margin-top:44px;font-size:44px;font-weight:900;color:${t.darkAccent};">${d.handle}</div>`) },

  { id:'cta_ba_recap', name:'C18 Before→After総括（締め）', cat:'締め',
    fields:[{key:'title',label:'見出し（改行で折る）',def:'あなたも、こう変われる。'},{key:'before',label:'Before',def:'毎月カツカツ'},{key:'after',label:'After',def:'自動で貯まる'},{key:'note',label:'ひとこと',def:'まずは1つ、今日から。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;flex-direction:column;font-size:56px;font-weight:900;font-family:${t.head};margin-bottom:44px;">${nl(d.title)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:380px;height:200px;background:${t.panel};border:3px solid ${t.line};border-radius:20px;"><div style="display:flex;font-size:28px;font-weight:900;color:${t.sub};margin-bottom:10px;">Before</div><div style="display:flex;font-size:44px;font-weight:700;color:${t.sub};">${d.before}</div></div>
        <div style="display:flex;font-size:50px;font-weight:900;color:${t.accent};">→</div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:380px;height:200px;background:${t.accent};border-radius:20px;color:${t.onAccent};"><div style="display:flex;font-size:28px;font-weight:900;margin-bottom:10px;">After</div><div style="display:flex;font-size:44px;font-weight:700;">${d.after}</div></div>
      </div>
      <div style="display:flex;align-self:center;margin-top:40px;font-size:40px;font-weight:700;">${d.note}</div>
      <div style="display:flex;align-self:center;margin-top:14px;font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_total', name:'C19 数字総括CTA（締め）', cat:'締め',
    fields:[{key:'pre',label:'前振り',def:'全部見直すと'},{key:'total',label:'合計数字',def:'−18万'},{key:'unit',label:'単位',def:'円／年'},{key:'note',label:'ひとこと（改行で折る）',def:'保存して、今日から\n1つずつ実行しよう。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'center'},`
      <div style="display:flex;font-size:44px;font-weight:700;color:${t.sub};margin-bottom:6px;">${d.pre}</div>
      <div style="display:flex;align-items:baseline;margin-bottom:30px;"><div style="display:flex;font-family:${t.display};font-size:200px;color:${t.accent};line-height:1;">${d.total}</div><div style="display:flex;font-size:60px;font-weight:900;margin-left:10px;color:${t.accent};">${d.unit}</div></div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:42px;font-weight:700;line-height:1.5;">${nl(d.note)}</div>
      <div style="display:flex;margin-top:36px;font-size:42px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  { id:'cta_highlight', name:'C20 ハイライト保存誘導（締め）', cat:'締め',
    fields:[{key:'head',label:'見出し（改行で折る）',def:'保存して、\nいつでも見返せるように。'},{key:'sub',label:'サブ',def:'プロフのハイライトにまとめてます。'},{key:'handle',label:'アカウント',def:'@ゆる貯金'}],
    render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
      <div style="display:flex;align-items:center;margin-bottom:40px;"><div style="display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:24px;background:${t.accent};">${icon('bookmark',t.onAccent,52,2)}</div><div style="display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:24px;background:${t.panelSoft};margin-left:18px;">${icon('star',t.accentDeep,52,2)}</div></div>
      <div style="display:flex;flex-direction:column;font-size:62px;font-weight:900;font-family:${t.head};line-height:1.3;">${nl(d.head)}</div>
      <div style="display:flex;flex-direction:column;margin-top:30px;font-size:38px;color:${t.sub};">${nl(d.sub)}</div>
      <div style="display:flex;margin-top:40px;font-size:46px;font-weight:900;color:${t.accent};">${d.handle}</div>`) },

  // ===== YouTube サムネ（1280×720）おきる系：参考1枚＝1型。装飾は絶対配置(satori通過OK) =====
  // 参考① スレッズ始め方：ロゴ左上＋赤マーカー語＋特大黄色＋証拠＋矢印
  { id:'yt_thumb1', name:'Y1 始め方（特大黄色＋証拠）', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真をアップ',type:'file',def:''},
      {key:'kicker',label:'上の手書き帯',def:'Threadsで月収600万 二児のママが教える'},
      {key:'lead',label:'リード行（【】で赤マーカー）',def:'【最短】でゼロイチ達成したい！'},
      {key:'big',label:'特大ワード（黄色袋文字・改行可）',def:'スレッズ始め方'},
      {key:'logo',label:'ロゴ画像 左上(任意)',type:'file',def:''},
      {key:'proof',label:'証拠スクショ 左下(任意)',type:'file',def:''},
      {key:'arrow',label:'赤い矢印',type:'select',options:['出す','消す'],def:'出す'},
      {key:'mascot',label:'マスコット画像 右下(任意)',type:'file',def:''}],
    render:(d,t)=>{const mas=d.mascot||BLOB_URI;const photo=d.photo?('background:url('+d.photo+') center/cover no-repeat;'):('background:'+t.panelSoft+';');
      const mk=function(s){return String(s).split('\n').filter(function(x){return x.length;}).map(function(line){return '<div style="display:flex;">'+line.replace(/【([^】]*)】/g,'<span style="background:#E0352B;color:#fff;font-weight:900;padding:0 14px;border-radius:8px;text-shadow:none;">$1</span>')+'</div>';}).join('');};
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:60px 80px;font-family:'+t.head+';color:#1a1a1a;'+photo+'">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.05);"></div>':'')
        +'<div style="position:absolute;top:24px;left:0;width:100%;display:flex;justify-content:center;"><div style="display:flex;font-family:Yomogi;font-size:42px;font-weight:700;color:#1a1a1a;">＼ '+d.kicker+' ／</div></div>'
        +(d.logo?'<img src="'+d.logo+'" style="position:absolute;left:56px;top:118px;width:130px;"/>':'')
        +(d.proof?'<img src="'+d.proof+'" style="position:absolute;left:56px;bottom:46px;width:330px;"/>':'')
        +(d.proof&&d.arrow!=='消す'?'<img src="'+ARROW_URI+'" style="position:absolute;left:402px;bottom:84px;width:120px;"/>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:flex-start;font-size:72px;font-weight:900;line-height:1.2;text-shadow:'+outline('#ffffff','rgba(0,0,0,0.1)')+';margin-left:150px;">'+mk(d.lead)+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:flex-start;font-family:'+t.head+';font-weight:900;font-size:150px;line-height:1.0;color:#FFE24A;text-shadow:'+outline('#1f1f1f')+';margin-top:10px;">'+nl(d.big)+'</div>'
        +'<img src="'+mas+'" style="position:absolute;right:20px;bottom:6px;width:215px;"/>'
      +'</div>';} },
  // 参考② note主婦：noteロゴ＋クリームパネルに黒3行＋赤囲み数字（黄色なし）
  { id:'yt_thumb2', name:'Y2 パネル黒文字＋赤囲み', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真をアップ',type:'file',def:''},
      {key:'kicker',label:'上の手書き帯',def:'リアルな収益額公開してます'},
      {key:'body',label:'本文（【】で赤囲み・改行で3行）',def:'主婦がnote始めたら\n1ヶ月で【〇〇〇万円】\n稼いで人生変わった話'},
      {key:'logo',label:'ロゴ画像 左上(任意)',type:'file',def:''},
      {key:'mascot',label:'マスコット画像 右下(任意)',type:'file',def:''}],
    render:(d,t)=>{const mas=d.mascot||BLOB_URI;const photo=d.photo?('background:url('+d.photo+') center/cover no-repeat;'):('background:'+t.panelSoft+';');
      const mk=function(s){return String(s).split('\n').filter(function(x){return x.length;}).map(function(line){return '<div style="display:flex;">'+line.replace(/【([^】]*)】/g,'<span style="color:#E0352B;border:4px solid #E0352B;border-radius:10px;padding:0 10px;font-weight:900;">$1</span>')+'</div>';}).join('');};
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:70px 90px;font-family:'+t.head+';color:#1a1a1a;'+photo+'">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(255,255,255,.1);"></div>':'')
        +'<div style="position:absolute;top:34px;left:0;width:100%;display:flex;justify-content:center;"><div style="display:flex;font-family:Yomogi;font-size:40px;font-weight:700;color:#1a1a1a;">＼ '+d.kicker+' ／</div></div>'
        +(d.logo?'<img src="'+d.logo+'" style="position:absolute;left:54px;top:46px;width:160px;"/>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:center;background:rgba(247,243,233,.86);border-radius:24px;padding:40px 64px;font-size:80px;font-weight:900;line-height:1.4;">'+mk(d.body)+'</div>'
        +'<img src="'+mas+'" style="position:absolute;right:22px;bottom:8px;width:205px;"/>'
      +'</div>';} },
  // 参考③ 完全解説：完全版バッジ＋右上スクショ＋クリームパネル(白袋文字＋黄色袋文字)＋ロゴ左下
  { id:'yt_thumb3', name:'Y3 完全版バッジ＋白黄2段', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真をアップ',type:'file',def:''},
      {key:'badge',label:'左上バッジ',def:'完全版'},
      {key:'kicker',label:'パネル内 手書き帯',def:'初心者でもできる'},
      {key:'line1',label:'1段目（白袋文字・改行可）',def:'スレッズ副業'},
      {key:'line2',label:'2段目（黄色袋文字・改行可）',def:'完全解説'},
      {key:'logo',label:'ロゴ画像 左下(任意)',type:'file',def:''},
      {key:'proof',label:'証拠スクショ 右上(任意)',type:'file',def:''},
      {key:'mascot',label:'マスコット画像 右下(任意)',type:'file',def:''}],
    render:(d,t)=>{const mas=d.mascot||BLOB_URI;const photo=d.photo?('background:url('+d.photo+') center/cover no-repeat;'):('background:'+t.panelSoft+';');
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px 90px;font-family:'+t.head+';'+photo+'">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.06);"></div>':'')
        +(d.badge?'<div style="position:absolute;top:30px;left:36px;display:flex;background:#E0352B;color:#fff;font-size:40px;font-weight:900;padding:12px 24px;border-radius:12px;">'+d.badge+'</div>':'')
        +(d.proof?'<img src="'+d.proof+'" style="position:absolute;right:40px;top:34px;width:320px;"/>':'')
        +(d.logo?'<img src="'+d.logo+'" style="position:absolute;left:54px;bottom:40px;width:120px;"/>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:center;background:rgba(244,239,228,.72);border-radius:24px;padding:30px 60px;">'
          +'<div style="display:flex;font-family:Yomogi;font-size:38px;font-weight:700;color:#1a1a1a;margin-bottom:10px;">＼ '+d.kicker+' ／</div>'
          +'<div style="display:flex;flex-direction:column;align-items:center;font-family:'+t.head+';font-size:108px;font-weight:900;line-height:1.1;color:#ffffff;text-shadow:'+outline('#1f1f1f')+';">'+nl(d.line1)+'</div>'
          +'<div style="display:flex;flex-direction:column;align-items:center;font-family:'+t.head+';font-weight:900;font-size:120px;line-height:1.05;color:#FFE24A;text-shadow:'+outline('#1f1f1f')+';margin-top:6px;">'+nl(d.line2)+'</div>'
        +'</div>'
        +'<img src="'+mas+'" style="position:absolute;right:20px;bottom:6px;width:205px;"/>'
      +'</div>';} },
  // 参考④ バズりました：ロゴ左上＋クリームパネル(白袋文字＋大黄色)＋下に3カードスクショ＋矢印
  { id:'yt_thumb4', name:'Y4 パネル白＋大黄色＋カード', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真をアップ',type:'file',def:''},
      {key:'kicker',label:'上の手書き帯',def:'Threadsのみで月8桁達成！'},
      {key:'line1',label:'1段目（白袋文字・改行可）',def:'Threadsこれを意識したら'},
      {key:'line2',label:'2段目（大・黄色袋文字・改行可）',def:'バズりました'},
      {key:'logo',label:'ロゴ画像 左上(任意)',type:'file',def:''},
      {key:'proof',label:'証拠カード 下(任意)',type:'file',def:''},
      {key:'arrow',label:'赤い矢印',type:'select',options:['出す','消す'],def:'出す'},
      {key:'mascot',label:'マスコット画像 右下(任意)',type:'file',def:''}],
    render:(d,t)=>{const mas=d.mascot||BLOB_URI;const photo=d.photo?('background:url('+d.photo+') center/cover no-repeat;'):('background:'+t.panelSoft+';');
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:54px 80px;font-family:'+t.head+';'+photo+'">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.06);"></div>':'')
        +'<div style="position:absolute;top:24px;left:0;width:100%;display:flex;justify-content:center;"><div style="display:flex;font-family:Yomogi;font-size:40px;font-weight:700;color:#1a1a1a;">＼ '+d.kicker+' ／</div></div>'
        +(d.logo?'<img src="'+d.logo+'" style="position:absolute;left:50px;top:40px;width:118px;"/>':'')
        +(d.proof?'<img src="'+d.proof+'" style="position:absolute;left:60px;bottom:34px;width:520px;"/>':'')
        +(d.proof&&d.arrow!=='消す'?'<img src="'+ARROW_URI+'" style="position:absolute;left:600px;bottom:60px;width:110px;transform:scaleX(-1);"/>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:center;background:rgba(244,239,228,.7);border-radius:24px;padding:26px 56px;margin-bottom:30px;">'
          +'<div style="display:flex;flex-direction:column;align-items:center;font-size:78px;font-weight:900;line-height:1.15;color:#ffffff;text-shadow:'+outline('#1f1f1f')+';">'+nl(d.line1)+'</div>'
          +'<div style="display:flex;flex-direction:column;align-items:center;font-family:'+t.head+';font-weight:900;font-size:150px;line-height:1.0;color:#FFE24A;text-shadow:'+outline('#1f1f1f')+';margin-top:6px;">'+nl(d.line2)+'</div>'
        +'</div>'
        +'<img src="'+mas+'" style="position:absolute;right:18px;bottom:6px;width:200px;"/>'
      +'</div>';} },

  // ===== YouTube Pinterest参考由来（出典は design_kb/youtube_templates_roadmap.md） =====
  // Y5 ← #3 ビジネス解説（赤黒・人物右・吹き出し・下帯） pin/26599454046060050
  { id:'yt_biz_explain', name:'Y5 ビジネス解説（人物右）', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真(任意・無は暗赤)',type:'file',def:''},
      {key:'tag',label:'左上 角リボン',def:'競合に差をつける'},
      {key:'bubble',label:'右上 吹き出し(任意)',def:'具体的な事例を多数紹介！'},
      {key:'title',label:'白見出し（改行可）',def:'次世代マーケティング'},
      {key:'big',label:'特大ワード（アクセント縁・改行可）',def:'究極ガイド'},
      {key:'foot',label:'下帯テキスト',def:'最先端の手法を徹底解説！'},
      {key:'person',label:'人物 切り抜き 右(任意)',type:'file',def:''}],
    render:(d,t)=>{const bgc=d.photo?('url('+d.photo+') center/cover no-repeat'):('radial-gradient(circle at 72% 48%, '+shade(t.accentDeep,-0.15)+', #131318 64%)');
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:90px 80px 120px;font-family:'+t.head+';color:#fff;background:'+bgc+';">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;right:0;bottom:0;width:500px;height:auto;"/>':'')
        +'<div style="position:absolute;top:0;left:0;display:flex;background:'+t.accent+';color:#fff;font-size:34px;font-weight:900;padding:14px 30px;border-bottom-right-radius:18px;">'+d.tag+'</div>'
        +(d.bubble?'<div style="position:absolute;top:30px;right:40px;display:flex;background:#fff;color:#1a1a1a;font-size:28px;font-weight:700;padding:12px 22px;border-radius:14px;">'+d.bubble+'</div>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:78px;font-weight:900;line-height:1.15;text-shadow:2px 3px 6px rgba(0,0,0,.5);">'+nl(d.title)+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:150px;font-weight:900;line-height:1.05;color:#fff;text-shadow:'+outline(t.accentDeep)+';margin-top:6px;">'+nl(d.big)+'</div>'
        +'<div style="position:absolute;left:0;bottom:0;width:100%;display:flex;justify-content:center;align-items:center;background:'+t.accent+';color:#fff;font-size:44px;font-weight:900;padding:14px 0;">'+d.foot+'</div>'
      +'</div>';} },

  // Y6 ← #5 AI/ノウハウ解説＋数字（紫・人物右・200選） pin/23995810511269145
  { id:'yt_ai_explain', name:'Y6 AI解説＋数字（人物右）', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真(任意・無は紫)',type:'file',def:''},
      {key:'tag',label:'左上タグ',def:'生成AI活用術'},
      {key:'bubble',label:'右上 吹き出し(任意)',def:'超実践的プロンプト集'},
      {key:'title',label:'白見出し（改行可）',def:'プロンプトの書き方'},
      {key:'big',label:'特大ワード（白袋文字・改行可）',def:'徹底解説'},
      {key:'foot',label:'下帯テキスト',def:'ビジネスで今すぐ使えるテンプレート'},
      {key:'num',label:'下帯の数字',def:'200'},
      {key:'unit',label:'数字の単位',def:'選'},
      {key:'person',label:'人物 切り抜き 右(任意)',type:'file',def:''}],
    render:(d,t)=>{const bgc=d.photo?('url('+d.photo+') center/cover no-repeat'):'linear-gradient(125deg, #6a2da8, #381860)';
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:120px 80px 130px;font-family:'+t.head+';color:#fff;background:'+bgc+';">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;right:0;bottom:0;width:480px;height:auto;"/>':'')
        +'<div style="position:absolute;top:0;left:0;display:flex;background:rgba(0,0,0,.42);color:#fff;font-size:34px;font-weight:900;padding:14px 30px;border-bottom-right-radius:16px;">'+d.tag+'</div>'
        +(d.bubble?'<div style="position:absolute;top:28px;right:40px;display:flex;background:#fff;color:#3a1a66;font-size:28px;font-weight:900;padding:12px 22px;border-radius:14px;">'+d.bubble+'</div>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:80px;font-weight:900;line-height:1.15;">'+nl(d.title)+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:168px;font-weight:900;line-height:1.0;color:#fff;text-shadow:'+outline('#1f1240')+';margin-top:4px;">'+nl(d.big)+'</div>'
        +'<div style="position:absolute;left:0;bottom:0;width:100%;display:flex;align-items:center;background:rgba(0,0,0,.4);padding:0 36px;height:96px;"><div style="display:flex;flex:1;font-size:42px;font-weight:900;color:#fff;">'+d.foot+'</div>'+(d.num?'<div style="display:flex;align-items:baseline;justify-content:center;background:#FFE24A;color:#1f1240;border-radius:999px;padding:6px 24px;margin-left:18px;text-shadow:none;"><div style="display:flex;font-size:62px;font-weight:900;">'+d.num+'</div><div style="display:flex;font-size:40px;font-weight:900;">'+d.unit+'</div></div>':'')+'</div>'
      +'</div>';} },

  // Y7 ← #4 専門家ボックス煽り（紺金・単語囲み・3ベネ・縦書き肩書） pin/195202965095460416
  { id:'yt_expert_box', name:'Y7 専門家ボックス煽り', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真(任意・無は紺)',type:'file',def:''},
      {key:'line1',label:'1行目（【】で金枠・改行可）',def:'【若】【い】【人】ほど'},
      {key:'big',label:'特大ワード（改行可）',def:'家を買え'},
      {key:'benefits',label:'下の3ベネ（｜区切り）',def:'無料で住める｜お金が貰える｜余裕ができる'},
      {key:'role',label:'縦書き肩書 右(任意)',def:'不動産アナリスト 二乃宮風太郎'},
      {key:'person',label:'人物 切り抜き 右(任意)',type:'file',def:''}],
    render:(d,t)=>{const G='#E8C24A';const bgc=d.photo?('url('+d.photo+') center/cover no-repeat'):'radial-gradient(circle at 58% 40%, #26406f, #0d1626 72%)';
      const boxed=function(s){return String(s).split('\n').filter(function(x){return x.length;}).map(function(line){return '<div style="display:flex;align-items:center;">'+line.replace(/【([^】]*)】/g,'<span style="display:flex;border:5px solid '+G+';color:'+G+';border-radius:10px;padding:0 10px;margin:0 6px;">$1</span>')+'</div>';}).join('');};
      const bens=String(d.benefits).split('｜').filter(function(x){return x.length;}).map(function(b){return '<div style="display:flex;align-items:center;background:'+G+';color:#0d1626;border-radius:8px;padding:6px 18px;margin-right:16px;font-size:30px;font-weight:900;">'+b+'</div>';}).join('');
      const role=d.role?('<div style="position:absolute;right:494px;top:70px;display:flex;flex-direction:column;align-items:center;font-size:26px;font-weight:700;color:#fff;letter-spacing:2px;">'+[].concat.apply([],String(d.role).split('')).map(function(c){return '<div style="display:flex;">'+(c===' '?'・':c)+'</div>';}).join('')+'</div>'):'';
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:80px 80px 120px;font-family:'+t.head+';color:#fff;background:'+bgc+';">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;right:0;bottom:0;width:470px;height:auto;"/>':'')
        +role
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:90px;font-weight:900;line-height:1.25;text-shadow:2px 2px 6px rgba(0,0,0,.5);">'+boxed(d.line1)+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:160px;font-weight:900;line-height:1.0;color:#fff;text-shadow:'+outline('#0d1626')+';margin-top:8px;">'+nl(d.big)+'</div>'
        +'<div style="position:absolute;left:80px;bottom:34px;display:flex;">'+bens+'</div>'
      +'</div>';} },

  // Y8 ← #6 顔ドアップ左右対比（金・対比語・決定的な違い） pin/950752171311850763
  { id:'yt_contrast', name:'Y8 顔ドアップ左右対比', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'顔写真 中央(任意・無は金黒)',type:'file',def:''},
      {key:'ls',label:'左 小ラベル',def:'部下に嫌われる'},
      {key:'lb',label:'左 特大語（改行可）',def:'無能'},
      {key:'rs',label:'右 小ラベル',def:'部下に好かれる'},
      {key:'rb',label:'右 特大語（改行可）',def:'優秀'},
      {key:'foot',label:'下部',def:'決定的な違い'}],
    render:(d,t)=>{const G='#F2C94C';const bgc=d.photo?('url('+d.photo+') center/cover no-repeat'):'linear-gradient(90deg,#caa12e,#171717 32%,#171717 68%,#caa12e)';
      const side=function(small,big,al){return '<div style="position:relative;display:flex;flex-direction:column;align-items:'+al+';"><div style="display:flex;font-size:40px;font-weight:700;color:#fff;text-shadow:'+outline('#1a1a1a')+';margin-bottom:8px;">'+small+'</div><div style="display:flex;flex-direction:column;align-items:'+al+';font-family:'+t.head+';font-weight:900;font-size:236px;line-height:.95;color:'+G+';text-shadow:'+outline('#1a1a1a')+';">'+nl(big)+'</div></div>';};
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding:34px 54px;font-family:'+t.head+';background:'+bgc+';">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.34);"></div>':'')
        +side(d.ls,d.lb,'flex-start')
        +side(d.rs,d.rb,'flex-end')
        +'<div style="position:absolute;left:0;bottom:28px;width:100%;display:flex;justify-content:center;"><div style="display:flex;font-size:62px;font-weight:900;color:rgba(255,255,255,.88);text-shadow:'+outline('#1a1a1a')+';">'+d.foot+'</div></div>'
      +'</div>';} },

  // Y9 ← #10 にぎやかセミナー告知（青・No.1・参加無料・日付帯） pin/400187116911262276
  { id:'yt_seminar', name:'Y9 セミナー告知（にぎやか）', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'topbadge',label:'左上バッジ（改行可）',def:'2030年\n最新'},
      {key:'kicker',label:'上 小見出し',def:'WEBデザイナー向け'},
      {key:'title',label:'特大タイトル（改行可）',def:'AI活用術\n完全攻略'},
      {key:'ribbon',label:'右上 リボン',def:'満足度No.1'},
      {key:'free',label:'丸バッジ（改行可）',def:'参加\n無料'},
      {key:'date',label:'下帯 日付',def:'8/30(金)'},
      {key:'time',label:'下帯 時間',def:'10:00〜12:00'},
      {key:'lecturer',label:'下帯 講師(任意)',def:'講師：西村 優太'},
      {key:'person',label:'人物 切り抜き 右(任意)',type:'file',def:''}],
    render:(d,t)=>{const NV='#16335c',BL='#2f7fe0';
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:120px 80px 130px;font-family:'+t.head+';color:'+NV+';background:linear-gradient(135deg,#eef5fc,#d7e8f8);">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;right:0;bottom:96px;width:430px;height:auto;"/>':'')
        +'<div style="position:absolute;top:0;left:0;display:flex;flex-direction:column;align-items:center;background:'+NV+';color:#fff;font-size:36px;font-weight:900;line-height:1.1;padding:14px 24px;border-bottom-right-radius:16px;">'+nl(d.topbadge)+'</div>'
        +(d.ribbon?'<div style="position:absolute;top:26px;right:36px;display:flex;align-items:center;justify-content:center;background:'+NV+';color:#FFD23C;font-size:36px;font-weight:900;padding:14px 26px;border-radius:14px;border:4px solid #FFD23C;">'+d.ribbon+'</div>':'')
        +'<div style="position:relative;display:flex;font-size:42px;font-weight:900;color:'+BL+';margin-bottom:6px;">'+d.kicker+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:150px;font-weight:900;line-height:1.04;color:'+NV+';text-shadow:'+outline('#ffffff','rgba(0,0,0,.12)')+';">'+nl(d.title)+'</div>'
        +(d.free?'<div style="position:absolute;right:430px;top:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:170px;height:170px;border-radius:50%;background:'+BL+';color:#fff;font-size:46px;font-weight:900;line-height:1.05;border:5px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);">'+nl(d.free)+'</div>':'')
        +'<div style="position:absolute;left:0;bottom:0;width:100%;display:flex;align-items:center;background:'+NV+';color:#fff;padding:0 40px;height:96px;"><div style="display:flex;align-items:center;background:#E0352B;border-radius:8px;padding:4px 16px;font-size:32px;font-weight:900;margin-right:18px;">LIVE</div><div style="display:flex;font-size:48px;font-weight:900;margin-right:20px;">'+d.date+'</div><div style="display:flex;font-size:42px;font-weight:900;flex:1;">'+d.time+'</div>'+(d.lecturer?'<div style="display:flex;font-size:32px;font-weight:700;">'+d.lecturer+'</div>':'')+'</div>'
      +'</div>';} },

  // Y10 ← #9 清潔ウェビナー告知（水色・青下線・日付・名前帯） pin/107101297384974867
  { id:'yt_webinar', name:'Y10 ウェビナー告知（清潔）', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'logo',label:'ロゴ画像 左上(任意)',type:'file',def:''},
      {key:'kicker',label:'小見出し(任意)',def:'PRODUCT WEBINAR'},
      {key:'title',label:'見出し（【】青下線・改行可）',def:'成長するプロダクトに\n【共通する条件】とは?'},
      {key:'date',label:'日付',def:'2050.3.24 wed.'},
      {key:'time',label:'時間',def:'19:30-21:00'},
      {key:'online',label:'配信ラベル',def:'ONLINE'},
      {key:'name',label:'登壇者 帯(任意)',def:'登壇：田中 太郎'},
      {key:'person',label:'人物 切り抜き 右(任意)',type:'file',def:''}],
    render:(d,t)=>{const NV='#16335c',BL='#2f7fe0';const hot=function(s){return String(s).split('\n').filter(function(x){return x.length;}).map(function(line){return '<div style="display:flex;">'+line.replace(/【([^】]*)】/g,'<span style="background-image:linear-gradient(transparent 58%, #a9d6ff 58%);">$1</span>')+'</div>';}).join('');};
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:80px;font-family:'+t.head+';color:'+NV+';background:linear-gradient(135deg,#ffffff,#e8f1fb);">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;right:0;bottom:0;width:420px;height:auto;"/>':'')
        +(d.logo?'<img src="'+d.logo+'" style="position:absolute;left:80px;top:52px;width:150px;"/>':'')
        +'<div style="position:relative;display:flex;font-size:32px;font-weight:900;letter-spacing:3px;color:'+BL+';margin-bottom:14px;">'+d.kicker+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;font-size:92px;font-weight:900;line-height:1.24;">'+hot(d.title)+'</div>'
        +'<div style="position:absolute;left:80px;bottom:52px;display:flex;align-items:center;"><div style="display:flex;background:'+NV+';color:#fff;font-size:30px;font-weight:900;padding:8px 18px;border-radius:8px;margin-right:16px;">'+d.online+'</div><div style="display:flex;font-size:44px;font-weight:900;margin-right:18px;">'+d.date+'</div><div style="display:flex;font-size:38px;font-weight:700;">'+d.time+'</div></div>'
        +(d.name?'<div style="position:absolute;right:0;bottom:0;display:flex;background:'+NV+';color:#fff;font-size:28px;font-weight:700;padding:8px 20px;">'+d.name+'</div>':'')
      +'</div>';} },
  // Y11 ← #2 縦長人物セミナー告知（参加無料円・青囲み見出し） pin/298785756552172881
  { id:'yt_seminar_v', name:'Y11 セミナー告知（人物左）', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'person',label:'人物 切り抜き 左(任意)',type:'file',def:''},
      {key:'kicker',label:'上 黒帯キッカー',def:'起業する前に知っておきたい！'},
      {key:'free',label:'丸バッジ（改行可）',def:'参加\n無料'},
      {key:'title',label:'見出し（【】青囲み・改行可）',def:'ビジネス\n【基礎】セミナー'},
      {key:'date',label:'日付',def:'2050.3.24 wed.'},
      {key:'online',label:'右下ラベル',def:'オンライン開催'},
      {key:'lecturer',label:'講師 左下(任意)',def:'セミナー講師 小澤 杏奈'}],
    render:(d,t)=>{const NV='#16335c',BL='#2f7fe0';const box=function(s){return String(s).split('\n').filter(function(x){return x.length;}).map(function(line){return '<div style="display:flex;align-items:center;">'+line.replace(/【([^】]*)】/g,'<span style="display:flex;background:'+BL+';color:#fff;border-radius:12px;padding:0 14px;margin:0 4px;">$1</span>')+'</div>';}).join('');};
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;padding:130px 80px 120px;font-family:'+t.head+';color:'+NV+';background:linear-gradient(135deg,#eaf3fc,#cfe4f7);">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;left:20px;bottom:0;width:440px;height:auto;"/>':'')
        +'<div style="position:absolute;top:28px;left:50%;transform:translateX(-50%);display:flex;background:#1a1a1a;color:#fff;font-size:34px;font-weight:900;padding:10px 26px;border-radius:10px;">'+d.kicker+'</div>'
        +(d.free?'<div style="position:absolute;top:108px;right:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:160px;height:160px;border-radius:50%;background:'+BL+';color:#fff;font-size:44px;font-weight:900;line-height:1.05;border:5px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.2);">'+nl(d.free)+'</div>':'')
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:flex-end;font-size:100px;font-weight:900;line-height:1.22;">'+box(d.title)+'</div>'
        +(d.lecturer?'<div style="position:absolute;left:80px;bottom:34px;display:flex;font-size:28px;font-weight:700;">'+d.lecturer+'</div>':'')
        +'<div style="position:absolute;right:80px;bottom:34px;display:flex;align-items:center;"><div style="display:flex;font-size:42px;font-weight:900;margin-right:16px;">'+d.date+'</div><div style="display:flex;background:'+NV+';color:#fff;font-size:30px;font-weight:900;padding:8px 18px;border-radius:8px;">'+d.online+'</div></div>'
      +'</div>';} },

  // Y12 ← #11 SNS講座 実績3箱（人物右・色箱見出し・実績3つ） pin/937945059871774271
  { id:'yt_sns_proof', name:'Y12 SNS講座＋実績3箱', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真(任意)',type:'file',def:''},
      {key:'top',label:'上 帯テキスト',def:'未経験から月収7桁'},
      {key:'title1',label:'見出し（【】色箱・交互ピンク青）',def:'【SNS】×【公式LINE】'},
      {key:'title2',label:'見出し2',def:'スモールビジネス講座'},
      {key:'b1',label:'実績1',def:'図解90枚'},
      {key:'b2',label:'実績2',def:'動画25本'},
      {key:'b3',label:'実績3',def:'フォロワー3.4万'},
      {key:'person',label:'人物 切り抜き 右(任意)',type:'file',def:''}],
    render:(d,t)=>{const bgc=d.photo?('url('+d.photo+') center/cover no-repeat'):'linear-gradient(135deg,#fdeef4,#e7eefb)';let i=0;
      const mk=String(d.title1).replace(/【([^】]*)】/g,function(m,p){const c=(i++%2)?'#2f7fe0':'#E0518A';return '<span style="display:flex;background:'+c+';color:#fff;border-radius:14px;padding:0 16px;margin:0 6px;">'+p+'</span>';});
      const bx=function(s){return '<div style="display:flex;align-items:center;background:#fff;border:3px solid #16335c;border-radius:12px;padding:8px 18px;margin-right:14px;font-size:32px;font-weight:900;color:#16335c;">'+s+'</div>';};
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:80px 80px 120px;font-family:'+t.head+';color:#16335c;background:'+bgc+';">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;right:0;bottom:0;width:420px;height:auto;"/>':'')
        +'<div style="position:relative;display:flex;align-self:flex-start;background:#16335c;color:#fff;font-size:36px;font-weight:900;padding:8px 22px;border-radius:10px;margin-bottom:20px;">'+d.top+'</div>'
        +'<div style="position:relative;display:flex;align-items:center;font-size:120px;font-weight:900;line-height:1.05;">'+mk+'</div>'
        +'<div style="position:relative;display:flex;font-size:78px;font-weight:900;line-height:1.1;margin-top:4px;">'+d.title2+'</div>'
        +'<div style="position:absolute;left:80px;bottom:40px;display:flex;">'+bx(d.b1)+bx(d.b2)+bx(d.b3)+'</div>'
      +'</div>';} },
  // Y13 ← #7 2人対談告知（左右人物・中央ポップ帯・日時） pin/23995810511269147
  { id:'yt_talk2', name:'Y13 2人対談告知', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'leftImg',label:'左 人物(任意)',type:'file',def:''},
      {key:'rightImg',label:'右 人物(任意)',type:'file',def:''},
      {key:'label',label:'上 ラベル',def:'online'},
      {key:'title',label:'特大タイトル（改行可）',def:'CREATORS\nTALK'},
      {key:'theme',label:'テーマ',def:'"伝わるデザイン"って何だろう?'},
      {key:'sub',label:'サブ',def:'クリエイター2人の本音対談'},
      {key:'date',label:'日時',def:'6.21 19:30 START!'},
      {key:'leftName',label:'左 名前',def:'RYUHEI ASADA'},
      {key:'rightName',label:'右 名前',def:'KAZUMI TERAI'}],
    render:(d,t)=>{const BL='#3b5bff',YL='#FFE24A';const li=d.leftImg?('background:url('+d.leftImg+') center/cover;'):'background:#3a3a3a;';const ri=d.rightImg?('background:url('+d.rightImg+') center/cover;'):'background:#3a3a3a;';
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:row;font-family:'+t.head+';">'
        +'<div style="display:flex;flex-direction:column;justify-content:flex-end;width:360px;height:720px;'+li+'"><div style="display:flex;background:rgba(0,0,0,.55);color:#fff;font-size:26px;font-weight:900;padding:8px 14px;">'+d.leftName+'</div></div>'
        +'<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;width:560px;height:720px;background:'+BL+';color:#fff;padding:36px 30px;text-align:center;">'
          +'<div style="display:flex;font-size:40px;font-weight:700;font-style:italic;color:'+YL+';margin-bottom:10px;">'+d.label+'</div>'
          +'<div style="display:flex;flex-direction:column;align-items:center;font-size:100px;font-weight:900;line-height:1.0;color:'+YL+';">'+nl(d.title)+'</div>'
          +'<div style="display:flex;margin-top:26px;background:rgba(0,0,0,.18);border-radius:8px;padding:8px 16px;font-size:30px;font-weight:900;">'+d.theme+'</div>'
          +'<div style="display:flex;margin-top:10px;font-size:26px;">'+d.sub+'</div>'
          +'<div style="display:flex;margin-top:18px;font-size:44px;font-weight:900;color:'+YL+';">'+d.date+'</div>'
        +'</div>'
        +'<div style="display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;width:360px;height:720px;'+ri+'"><div style="display:flex;background:rgba(0,0,0,.55);color:#fff;font-size:26px;font-weight:900;padding:8px 14px;">'+d.rightName+'</div></div>'
      +'</div>';} },

  // Y14 ← #8 採用・英字コーポレート（人物左・英語大見出し・オレンジ枠和文・縦書き引用） pin/26599454045658310
  { id:'yt_recruit', name:'Y14 採用・英字コーポレート', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'person',label:'人物 左(任意)',type:'file',def:''},
      {key:'script',label:'英字 ラベル(斜体)',def:'Engineer first'},
      {key:'eng',label:'英字 大見出し（改行可）',def:'WORK AS\nYOURSELF'},
      {key:'line1',label:'和文1（白・橙枠）',def:'ここで働いていることに'},
      {key:'line2',label:'和文2（橙ベタ）',def:'満足できる会社へ'},
      {key:'quote',label:'左 縦書き引用(任意)',def:'「自分らしさを忘れない」そんな環境を整えています'}],
    render:(d,t)=>{const OR='#ED8A3A';
      const vq=d.quote?('<div style="position:absolute;left:20px;top:54px;display:flex;flex-direction:column;align-items:center;font-size:25px;font-weight:700;color:#555;letter-spacing:2px;">'+[].concat.apply([],String(d.quote).split('')).map(function(c){return '<div style="display:flex;">'+(c===' '?'・':c)+'</div>';}).join('')+'</div>'):'';
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;padding:60px 70px;font-family:'+t.head+';color:#2a2a2a;background:linear-gradient(212deg, '+OR+' 20%, #ffffff 20%);">'
        +(d.person?'<img src="'+d.person+'" style="position:absolute;left:120px;bottom:0;width:430px;height:auto;"/>':'')
        +vq
        +'<div style="position:relative;display:flex;font-size:36px;font-style:italic;font-weight:700;color:'+OR+';margin-bottom:6px;">'+d.script+'</div>'
        +'<div style="position:relative;display:flex;flex-direction:column;align-items:flex-end;font-size:104px;font-weight:900;line-height:1.0;letter-spacing:2px;color:#2a2a2a;">'+nl(d.eng)+'</div>'
        +'<div style="position:relative;display:flex;background:#fff;border-left:10px solid '+OR+';padding:10px 24px;font-size:50px;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,.12);margin-top:30px;">'+d.line1+'</div>'
        +'<div style="position:relative;display:flex;background:'+OR+';color:#fff;padding:10px 28px;font-size:50px;font-weight:900;margin-top:10px;">'+d.line2+'</div>'
      +'</div>';} },

  // Y15 ← #1 Vlog料理・暮らし（写真＋大タイトル＋縦書きサブ＋丸ロゴ） pin/1044975919772833807
  { id:'yt_vlog_food', name:'Y15 Vlog料理・暮らし', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真をアップ',type:'file',def:''},
      {key:'title',label:'大タイトル（改行可）',def:'日々の\n食卓'},
      {key:'vol',label:'VOL表記',def:'VOL.1'},
      {key:'vsub',label:'左 縦書きサブ',def:'香菜子さんの和食でおうち居酒屋編'},
      {key:'logo1',label:'丸ロゴ 上段',def:'LINIERE'},
      {key:'logo2',label:'丸ロゴ 下段',def:'Vlog'}],
    render:(d,t)=>{const photo=d.photo?('background:url('+d.photo+') center/cover no-repeat;'):('background:#cfc6ba;');
      const vchars=String(d.vsub).split('').map(function(c){return '<div style="display:flex;">'+(c===' '?'':c)+'</div>';}).join('');
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;font-family:'+t.head+';'+photo+'">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(255,255,255,.08);"></div>':'')
        +'<div style="position:absolute;top:50px;right:70px;display:flex;flex-direction:column;align-items:flex-end;">'
          +'<div style="display:flex;flex-direction:column;align-items:flex-end;font-size:128px;font-weight:700;line-height:1.05;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.45);">'+nl(d.title)+'</div>'
          +'<div style="display:flex;margin-top:12px;font-size:40px;font-weight:700;color:#fff;letter-spacing:4px;text-shadow:0 2px 8px rgba(0,0,0,.4);">'+d.vol+'</div>'
        +'</div>'
        +'<div style="position:absolute;left:46px;top:50px;display:flex;align-items:stretch;"><div style="display:flex;width:0;border-left:2px dashed rgba(255,255,255,.75);"></div><div style="display:flex;flex-direction:column;align-items:center;font-size:34px;font-weight:700;color:#fff;letter-spacing:3px;text-shadow:0 2px 8px rgba(0,0,0,.5);margin:0 12px;">'+vchars+'</div><div style="display:flex;width:0;border-left:2px dashed rgba(255,255,255,.75);"></div></div>'
        +'<div style="position:absolute;right:60px;bottom:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:148px;height:148px;border-radius:50%;background:rgba(255,255,255,.92);color:#5a4e42;"><div style="display:flex;font-size:24px;font-weight:900;letter-spacing:2px;">'+d.logo1+'</div><div style="display:flex;font-size:30px;font-style:italic;font-weight:700;">'+d.logo2+'</div></div>'
      +'</div>';} },
  // Y16 ← #3 トラベルVlog（白セリフ大＋手書きスクリプト＋タグ） pin/616852480241075142
  { id:'yt_vlog_travel', name:'Y16 トラベルVlog', cat:'サムネ', fmt:'youtube',
    fields:[
      {key:'photo',label:'背景写真をアップ',type:'file',def:''},
      {key:'title',label:'英字大タイトル',def:'A DAY IN MY LIFE'},
      {key:'sub',label:'サブ（英字）',def:'2days trip to new taipei city'},
      {key:'script',label:'手書きスクリプト（黄）',def:'Feel the Summer'},
      {key:'tag',label:'右下タグ',def:'Short stay in BnB'}],
    render:(d,t)=>{const photo=d.photo?('background:url('+d.photo+') center/cover no-repeat;'):('background:#9fb0a8;');
      return '<div style="width:1280px;height:720px;box-sizing:border-box;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:46px 60px;font-family:'+t.head+';'+photo+'">'
        +(d.photo?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.12);"></div>':'')
        +'<div style="position:relative;display:flex;font-size:96px;font-weight:700;letter-spacing:6px;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.5);">'+d.title+'</div>'
        +'<div style="position:relative;display:flex;margin-top:8px;background:rgba(0,0,0,.45);color:#fff;font-size:34px;font-style:italic;font-weight:700;padding:6px 20px;border-radius:6px;">'+d.sub+'</div>'
        +'<div style="position:absolute;left:60px;bottom:60px;display:flex;font-family:Yomogi;font-size:64px;font-weight:700;color:#FFE24A;text-shadow:0 2px 10px rgba(0,0,0,.5);">'+d.script+'</div>'
        +(d.tag?'<div style="position:absolute;right:60px;bottom:64px;display:flex;align-items:center;font-size:34px;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6);"><div style="display:flex;width:16px;height:16px;border-radius:50%;background:#FFE24A;margin-right:10px;"></div>'+d.tag+'</div>':'')
      +'</div>';} },

  // ===== note 見出し画像（1280×670）※参考画像が来たら本実装。現状は仮 =====
  { id:'note_basic', name:'N1 ベーシック', cat:'サムネ', fmt:'note',
    fields:[{key:'title',label:'タイトル（改行で折る）',def:'note運用で\n月10万円までの全記録'},{key:'sub',label:'サブ',def:'ゼロから3ヶ月でやったこと'},{key:'author',label:'著者',def:'@kuro'}],
    render:(d,t)=>wrapAt(1920,1006,{bg:t.bg,color:t.ink,font:t.head,align:'stretch',pad:'110px 150px'},`
      <div style="display:flex;flex-direction:column;font-size:132px;font-weight:900;line-height:1.3;">${nl(d.title)}</div>
      <div style="display:flex;width:180px;height:12px;background:${t.accent};margin:36px 0;border-radius:6px;"></div>
      <div style="display:flex;font-size:58px;color:${t.sub};">${d.sub}</div>
      <div style="display:flex;margin-top:28px;font-size:50px;font-weight:700;color:${t.accent};">${d.author}</div>`) },
  { id:'note_quote', name:'N2 余白・上品', cat:'サムネ', fmt:'note',
    fields:[{key:'label',label:'ラベル',def:'ESSAY'},{key:'title',label:'タイトル（改行で折る）',def:'続けられる人の\nたった1つの習慣'},{key:'author',label:'著者',def:'@kuro'}],
    render:(d,t)=>wrapAt(1920,1006,{bg:t.bg,color:t.ink,font:t.head,align:'center',pad:'110px 150px'},`
      <div style="display:flex;font-family:${t.body};font-size:44px;letter-spacing:9px;color:${t.accent};">${d.label}</div>
      <div style="display:flex;width:100px;height:3px;background:${t.accent};margin:30px 0 44px;"></div>
      <div style="display:flex;flex-direction:column;align-items:center;font-size:116px;font-weight:700;line-height:1.45;">${nl(d.title)}</div>
      <div style="display:flex;font-family:${t.body};font-size:46px;color:${t.sub};margin-top:48px;">${d.author}</div>`) },
];

// ---- ① QA画像（satori）----
const find=(pkg,w)=>{const dir=path.join(__dirname,'node_modules/@expo-google-fonts',pkg,w);const f=fs.readdirSync(dir).find(x=>x.endsWith('.ttf')&&!x.startsWith('._'));return fs.readFileSync(path.join(dir,f));};
const fonts=[
  {name:'Zen Kaku Gothic New',data:find('zen-kaku-gothic-new','500Medium'),weight:500,style:'normal'},
  {name:'Zen Kaku Gothic New',data:find('zen-kaku-gothic-new','700Bold'),weight:700,style:'normal'},
  {name:'Zen Kaku Gothic New',data:find('zen-kaku-gothic-new','900Black'),weight:900,style:'normal'},
  {name:'Dela Gothic One',data:find('dela-gothic-one','400Regular'),weight:400,style:'normal'},
  {name:'Shippori Mincho',data:find('shippori-mincho','700Bold'),weight:700,style:'normal'},
  {name:'Zen Maru Gothic',data:find('zen-maru-gothic','500Medium'),weight:500,style:'normal'},
  {name:'Zen Maru Gothic',data:find('zen-maru-gothic','700Bold'),weight:700,style:'normal'},
  {name:'Zen Maru Gothic',data:find('zen-maru-gothic','900Black'),weight:900,style:'normal'},
  {name:'Yomogi',data:find('yomogi','400Regular'),weight:400,style:'normal'},
];

// ---- デッキモード：node build_templates.mjs --deck <deck.json> <out.pdf> → カルーセルPDF一括出力 ----
const _di=process.argv.indexOf('--deck');
if(_di>=0){
  const specPath=process.argv[_di+1], outPath=process.argv[_di+2]||'deck.pdf';
  const spec=JSON.parse(fs.readFileSync(specPath,'utf8'));
  const pdf=await PDFDocument.create(); let n=0;
  for(const s of spec){
    const t=TEMPLATES.find(x=>x.id===s.tplId); if(!t){console.error('unknown tpl:',s.tplId);continue;}
    const d=Object.assign(Object.fromEntries(t.fields.map(f=>[f.key,f.def])), s.data||{});
    const F=FORMATS[t.fmt||'ig'];
    const svg=await satori(html(t.render(d,THEMES[s.theme||'money'])),{width:F.w,height:F.h,fonts});
    const png=new Resvg(svg,{fitTo:{mode:'original'}}).render().asPng();
    const img=await pdf.embedPng(png); const pg=pdf.addPage([F.w,F.h]); pg.drawImage(img,{x:0,y:0,width:F.w,height:F.h}); n++;
    if(process.argv.includes('--png')){fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(path.join(path.dirname(outPath),'slide_'+String(n).padStart(2,'0')+'.png'),png);}
  }
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  fs.writeFileSync(outPath, await pdf.save());
  console.log('DECK PDF:',n,'ページ ->',outPath);
  process.exit(0);
}

fs.mkdirSync(QA,{recursive:true});
// 全型を money テーマで
for(const t of TEMPLATES){
  const d=Object.fromEntries(t.fields.map(f=>[f.key,f.def]));
  const F=FORMATS[t.fmt||'ig'];
  try{ const svg=await satori(html(t.render(d,THEMES.money)),{width:F.w,height:F.h,fonts});
    fs.writeFileSync(path.join(QA,`${t.id}.png`),new Resvg(svg,{fitTo:{mode:'original'}}).render().asPng()); console.log('QA',t.id);
  }catch(e){ console.error('ERR',t.id,e.message.slice(0,140)); }
}
// テーマ違いデモ（cover_target を全テーマ）
const demo=TEMPLATES[0]; const dd=Object.fromEntries(demo.fields.map(f=>[f.key,f.def]));
for(const [k,th] of Object.entries(THEMES)){
  try{ const svg=await satori(html(demo.render(dd,th)),{width:1080,height:1350,fonts});
    fs.writeFileSync(path.join(QA,`theme_${k}.png`),new Resvg(svg,{fitTo:{mode:'original'}}).render().asPng()); console.log('THEME',k);
  }catch(e){ console.error('THEME ERR',k,e.message.slice(0,120)); }
}

// ---- ② 実HTMLアプリ ----
const tplJs = TEMPLATES.map(t=>`{id:${JSON.stringify(t.id)},name:${JSON.stringify(t.name)},cat:${JSON.stringify(t.cat)},fmt:${JSON.stringify(t.fmt||'ig')},fields:${JSON.stringify(t.fields)},render:${t.render.toString()}}`).join(',\n');
const page=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>バズ型テンプレ</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Shippori+Mincho:wght@600;700;800&family=Yomogi&family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Zen+Maru+Gothic:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 :root{--bg:#0d0d11;--surface:#15151b;--elev:#1d1d25;--hover:#2c2c37;--line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.14);--txt:#ECECF1;--muted:#9696a6;--faint:#6c6c7a;--ac:#F0463A;--acd:#cd3529;--acsoft:rgba(240,70,58,.16);--ok:#1fb867;--blue:#4f86ff;--r:10px;--rl:14px;--sh:0 12px 40px rgba(0,0,0,.5)}
 *{box-sizing:border-box} body{margin:0;font-family:'Zen Kaku Gothic New',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:var(--bg);color:var(--txt);display:flex;height:100vh;overflow:hidden;font-size:13px}
 ::selection{background:rgba(240,70,58,.32)}
 ::-webkit-scrollbar{width:10px;height:10px} ::-webkit-scrollbar-thumb{background:#2c2c36;border-radius:8px;border:2px solid transparent;background-clip:padding-box} ::-webkit-scrollbar-thumb:hover{background:#3a3a46;background-clip:padding-box} ::-webkit-scrollbar-track{background:transparent}
 #side{width:300px;background:var(--surface);border-right:1px solid var(--line);padding:20px 16px;overflow:auto;flex-shrink:0}
 #side h3{font-size:11px;color:var(--faint);letter-spacing:.1em;text-transform:uppercase;margin:22px 0 9px;font-weight:700} #side h3:first-child{margin-top:0}
 .tpl{display:block;width:100%;text-align:left;background:transparent;color:var(--txt);border:1px solid var(--line);border-radius:var(--r);padding:11px 13px;margin-bottom:7px;cursor:pointer;font-size:13px;transition:.12s}
 .tpl:hover{background:var(--elev);border-color:var(--line2)} .tpl.active{background:var(--acsoft);border-color:transparent;color:#ff8a80;font-weight:700;box-shadow:inset 3px 0 0 var(--ac)}
 #mid{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
 #preview{flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;padding:18px;position:relative}
 #stage{transform-origin:center} #card{box-shadow:var(--sh);position:relative}
 #card::after,.pslide::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml;base64,${NOISE_B64}");background-size:160px 160px;opacity:.05;mix-blend-mode:multiply}
 #deckbar{background:var(--surface);border-top:1px solid var(--line);padding:12px;display:flex;align-items:flex-start;gap:9px;overflow-x:auto;height:134px;flex-shrink:0}
 .thumb{position:relative;flex-shrink:0;width:80px;height:100px;border:2px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;background:#000;transition:.12s} .thumb:hover{border-color:var(--line2)} .thumb.active{border-color:var(--ac);box-shadow:0 0 0 3px var(--acsoft)}
 .thumb .tw{width:1080px;height:1350px;transform:scale(.0735);transform-origin:top left} .thumb .no{position:absolute;top:3px;left:4px;z-index:2;font-size:10px;color:#fff;background:rgba(0,0,0,.6);padding:1px 5px;border-radius:4px;font-weight:700}
 #dtools{display:flex;flex-direction:column;gap:5px;flex-shrink:0;margin-left:8px} #dtools button{background:var(--elev);color:var(--muted);border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;white-space:nowrap;transition:.12s} #dtools button:hover{background:var(--hover);color:var(--txt)}
 #form{width:344px;background:var(--surface);border-left:1px solid var(--line);padding:16px;overflow:auto;flex-shrink:0}
 #form label{display:block;font-size:11px;color:var(--muted);margin:12px 0 5px}
 #form textarea,#theme,#fmtsel,.optsel,#galsearch{width:100%;background:var(--elev);color:var(--txt);border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;transition:.12s} #form textarea{resize:vertical} #form textarea:focus,#theme:focus,#fmtsel:focus,.optsel:focus,#galsearch:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px var(--acsoft)}
 #theme,#fmtsel{margin-bottom:6px} #fmtsel{font-weight:700;border-color:var(--line2)}
 #savebar{display:flex;gap:7px;margin-bottom:8px} #savebar button{flex:1;white-space:nowrap;background:linear-gradient(180deg,var(--ac),var(--acd));color:#fff;border:0;border-radius:10px;padding:12px 6px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(240,70,58,.25);transition:.12s} #savebar button:hover{filter:brightness(1.08)}
 #bar{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px} #bar button{flex:1;background:linear-gradient(180deg,var(--ac),var(--acd));color:#fff;border:0;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;transition:.12s;box-shadow:0 2px 10px rgba(240,70,58,.25)} #bar button:hover{filter:brightness(1.08)} #bar button.sec{background:var(--elev);color:var(--muted);flex:0 0 auto;padding:11px 13px;box-shadow:none;border:1px solid var(--line)} #bar button.sec:hover{background:var(--hover);color:var(--txt)}
 #topbar{display:flex;justify-content:center;padding:12px;background:var(--surface);border-bottom:1px solid var(--line);flex-shrink:0}
 #movebtn{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:380px;background:var(--elev);color:var(--txt);border:1px solid var(--line2);border-radius:12px;padding:10px 28px;cursor:pointer;font-weight:700;transition:.14s}
 #movebtn:hover{background:var(--hover)}
 #movebtn.on{background:linear-gradient(180deg,#22b56f,#179a59);border-color:#34d06b;color:#fff;box-shadow:0 0 0 4px rgba(31,184,103,.22)}
 #movebtn #movestate{font-size:15px;letter-spacing:.5px} #movebtn #movesub{font-size:11px;opacity:.85;font-weight:400}
 #icongallery{display:none;position:fixed;inset:0;background:rgba(8,8,11,.66);backdrop-filter:blur(7px);z-index:50;align-items:center;justify-content:center} #icongallery.on{display:flex}
 #icobox,#galbox,#presbox{background:var(--elev);border:1px solid var(--line2);box-shadow:var(--sh)}
 #icobox{border-radius:var(--rl);padding:24px;width:780px;max-height:80vh;overflow:auto} #icogrid{display:flex;flex-wrap:wrap;gap:10px}
 #tplgallery,#presetbox{display:none;position:fixed;inset:0;background:rgba(8,8,11,.66);backdrop-filter:blur(7px);z-index:60;align-items:flex-start;justify-content:center;padding:36px 0} #tplgallery.on,#presetbox.on{display:flex}
 #galbox{border-radius:var(--rl);padding:22px;width:92vw;max-width:1020px;max-height:88vh;overflow:auto}
 #galsearch{margin-bottom:14px;font-size:14px}
 #galgrid{display:flex;flex-wrap:wrap;gap:12px}
 .tcard{width:150px;cursor:pointer} .tcard .tprev{width:150px;height:188px;border-radius:8px;overflow:hidden;background:#000;border:2px solid var(--line);transition:.12s} .tcard:hover .tprev{border-color:var(--ac);box-shadow:0 0 0 3px var(--acsoft)} .tcard .tw{width:1080px;height:1350px;transform:scale(.139);transform-origin:top left} .tcard .tname{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.3}
 #gbtn{width:100%;background:linear-gradient(180deg,var(--ac),var(--acd));color:#fff;border:0;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px;box-shadow:0 2px 10px rgba(240,70,58,.25);transition:.12s} #gbtn:hover{filter:brightness(1.08)}
 #presbox{border-radius:var(--rl);padding:22px;width:90vw;max-width:560px;max-height:84vh;overflow:auto} #preslist .pitem{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:15px;margin-bottom:10px;cursor:pointer;transition:.12s} #preslist .pitem:hover{background:var(--hover);border-color:var(--line2)} #preslist .pitem b{color:#fff;font-size:15px} #preslist .pitem span{color:var(--muted);font-size:12px}
 #pickbox{display:none;position:fixed;inset:0;background:rgba(8,8,11,.66);backdrop-filter:blur(7px);z-index:60;align-items:flex-start;justify-content:center;padding:36px 0} #pickbox.on{display:flex}
 #pkbox{background:var(--elev);border:1px solid var(--line2);box-shadow:var(--sh);border-radius:var(--rl);padding:22px;width:92vw;max-width:760px;max-height:86vh;overflow:auto}
 #pktools{display:flex;gap:8px;margin:4px 0 14px} #pklist{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}
 .pkitem{position:relative;width:84px;cursor:pointer} .pkitem .pkprev{width:84px;height:105px;border-radius:8px;overflow:hidden;background:#000;border:2px solid var(--line);transition:.12s} .pkitem.sel .pkprev{border-color:var(--ac);box-shadow:0 0 0 3px var(--acsoft)} .pkitem .tw{width:1080px;height:1350px;transform:scale(.0777);transform-origin:top left} .pkitem .pkno{position:absolute;top:3px;left:4px;z-index:2;font-size:10px;color:#fff;background:rgba(0,0,0,.6);padding:1px 5px;border-radius:4px;font-weight:700} .pkitem .pkck{position:absolute;top:3px;right:4px;z-index:2;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px} .pkitem.sel .pkck{background:var(--ac)}
 #pkgo{width:100%;background:linear-gradient(180deg,var(--ac),var(--acd));color:#fff;border:0;border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(240,70,58,.25)} #pkgo:hover{filter:brightness(1.08)}
 .ico{display:flex;flex-direction:column;align-items:center;width:118px;padding:12px 6px;background:var(--surface);border-radius:10px;cursor:pointer;border:1px solid var(--line);transition:.12s} .ico:hover{border-color:var(--ac);background:var(--hover)} .ico .nm{font-size:11px;color:var(--muted);margin-top:6px;word-break:break-all;text-align:center}
 .pslide{position:relative} #printarea{position:absolute;left:-99999px;top:0}
 #slideopt{margin-bottom:6px}
 .optsec{background:var(--elev);border:1px solid var(--line);border-radius:12px;padding:12px 13px;margin-bottom:9px}
 .opth{font-size:11px;color:var(--faint);font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:9px}
 .optlab{font-size:11px;color:var(--muted);margin:10px 0 4px}
 .seg{display:flex;gap:3px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:3px}
 .seg button{flex:1;background:transparent;color:var(--muted);border:0;border-radius:7px;padding:7px 4px;font-size:12px;cursor:pointer;transition:.1s} .seg button:hover{color:var(--txt)}
 .seg button.on{background:var(--ac);color:#fff;font-weight:700}
 input[type=color]{border:1px solid var(--line);background:var(--elev);cursor:pointer;border-radius:8px;padding:2px}
 .optrow{display:flex;align-items:center;gap:8px;margin-top:8px} .optrow input[type=color]{width:46px;height:34px;flex-shrink:0}
 .swrow{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px} .sw{width:26px;height:26px;border-radius:7px;border:1px solid var(--line2);cursor:pointer;padding:0;transition:.1s} .sw:hover{transform:scale(1.12)} .addsw{background:var(--elev)!important;color:var(--muted);font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;border-style:dashed!important}
 .optfile{width:100%;color:var(--muted);font-size:11px;margin-top:7px} .optrange{width:100%;margin-top:4px;accent-color:var(--ac)}
 .optsel{padding:8px 10px}
 .optrow2{display:flex;align-items:center;gap:8px;margin-top:7px} .optrow2 input[type=color]{width:40px;height:30px} .optlab2{font-size:12px;color:var(--muted);flex:1}
 .rs{background:var(--elev);color:var(--muted);border:1px solid var(--line);border-radius:8px;padding:6px 11px;font-size:10px;cursor:pointer;transition:.12s} .rs:hover{background:var(--hover);color:var(--txt)}
 .elrow{display:flex;gap:6px;flex-wrap:wrap} .elrow button{flex:1;min-width:46px;background:var(--elev);color:var(--muted);border:1px solid var(--line);border-radius:8px;padding:8px 4px;font-size:12px;cursor:pointer;transition:.12s} .elrow button:hover{background:var(--hover);color:var(--txt)} .elrow button.on{background:var(--ac);color:#fff;border-color:var(--ac)}
 .posgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;width:100px;margin-top:5px} .posgrid button{aspect-ratio:1;background:var(--elev);border:1px solid var(--line);border-radius:6px;cursor:pointer;padding:0;transition:.1s} .posgrid button:hover{background:var(--hover)} .posgrid button.on{background:var(--ac);border-color:var(--ac)}
 #bar button:disabled{opacity:.5;cursor:default}
 .movemode .draggable{cursor:move} .movemode .draggable:hover{outline:2px dashed rgba(240,70,58,.6);outline-offset:2px} .movemode .selblock{outline:2px solid var(--ac)!important;outline-offset:2px}
 .freeel:hover{outline:2px dashed rgba(79,134,255,.7);outline-offset:2px} .selfree{outline:2px solid var(--blue)!important;outline-offset:2px}
 #ovwarn{display:none;position:absolute;top:16px;left:50%;transform:translateX(-50%);background:var(--acd);color:#fff;font-size:12px;padding:7px 16px;border-radius:9px;z-index:5;box-shadow:0 6px 18px rgba(0,0,0,.45)}
 #delbtn{display:none;position:fixed;z-index:40;width:30px;height:30px;border-radius:50%;background:var(--ac);color:#fff;border:2px solid #fff;align-items:center;justify-content:center;cursor:pointer;font-size:15px;line-height:1;box-shadow:0 3px 12px rgba(0,0,0,.5);padding:0} #delbtn:hover{filter:brightness(1.1)}
 #szbtn{display:none;position:fixed;z-index:40;width:30px;height:30px;border-radius:50%;background:var(--blue);color:#fff;border:2px solid #fff;align-items:center;justify-content:center;cursor:nwse-resize;font-size:14px;line-height:1;box-shadow:0 3px 12px rgba(0,0,0,.5);padding:0;touch-action:none} #szbtn:hover{filter:brightness(1.1)}
 @media print{ body *{visibility:hidden} #printarea,#printarea *{visibility:visible} #printarea{position:absolute;left:0;top:0} .pslide{page-break-after:always;break-after:page} @page{size:1080px 1350px;margin:0} }
</style></head><body>
<div id="side"><h3>フォーマット</h3><select id="fmtsel" onchange="setFmt(this.value)"></select><h3>アカウントテーマ</h3><select id="theme"></select><h3>型を選ぶ</h3><button id="gbtn" onclick="toggleGallery()">▦ 型ギャラリーで探す</button><div id="list"></div></div>
<div id="mid"><div id="topbar"><button id="movebtn" onclick="toggleMove()"><span id="movestate">🔒 編集モード：オフ</span><span id="movesub">押すと文字・画像を動かせます</span></button></div><div id="preview"><div id="stage"><div id="card"></div></div><div id="ovwarn">⚠ 文字がはみ出している可能性</div></div><div id="deckbar"></div></div>
<div id="form"><div id="savebar"><button onclick="exportPng(false)" title="開いている画像を保存">1枚保存</button><button onclick="exportPng(true)" title="全画像をZIPで保存">全部保存</button><button onclick="openPick()" title="選んだ画像をZIPで保存">選んで保存</button></div><div id="bar"><button class="sec" id="undobtn" onclick="undo()" title="元に戻す (Ctrl+Z)" disabled>戻す</button><button class="sec" id="redobtn" onclick="redo()" title="やり直し (Ctrl+Y)" disabled>やり直し</button><button class="sec" onclick="doPrint()" title="まとめてPDFで保存">PDF</button><button class="sec" onclick="togglePresets()">構成</button><button class="sec" onclick="toggleIcons()">アイコン</button><button class="sec" onclick="resetSlide()">リセット</button><button class="sec" onclick="newDeck()">新規</button><button class="sec" onclick="exportDeck()">書出</button><button class="sec" onclick="document.getElementById('imp').click()">読込</button><input id="imp" type="file" accept="application/json" style="display:none" onchange="importDeck(event)"></div><div id="slideopt"></div><div id="fields"></div>
 <p style="font-size:11px;color:#777;margin-top:18px;line-height:1.6">下のデッキ帯で複数スライドを1セットに（＋追加/複製/削除/◀▶並べ替え/全テーマ適用）。<br>「デッキをPDF保存」で全スライドが複数ページPDFに：送信先「PDFに保存」/サイズ1080×1350/余白なし/背景のグラフィックON。<br>テーマ・型の変更は選択中スライドに適用。グリッド型は アイコン名:ラベル。<br><b>文字は改行（Enter）を入れた位置で折れます</b>＝中途半端な折返し防止（入れなければ普通に流れる）。</p></div>
<div id="printarea"></div>
<button id="delbtn" onclick="deleteSelected()" title="削除 (Delete)">✕</button>
<button id="szbtn" onmousedown="startResize(event)" title="ドラッグでサイズ変更">⤡</button>
<div id="icongallery" onclick="if(event.target.id==='icongallery')toggleIcons()"><div id="icobox"><h3 style="margin-top:0">アイコン一覧（名前を入力欄へ）</h3><div id="icogrid"></div></div></div>
<div id="tplgallery" onclick="if(event.target.id==='tplgallery')toggleGallery()"><div id="galbox"><input id="galsearch" placeholder="型を検索（例: 診断 / カレンダー / 比較 / 締め）" oninput="filterTpl(this.value)"><div id="galgrid"></div></div></div>
<div id="presetbox" onclick="if(event.target.id==='presetbox')togglePresets()"><div id="presbox"><h3 style="margin-top:0">構成プリセット（読み込んで中身を差し替え）</h3><div id="preslist"></div></div></div>
<div id="pickbox" onclick="if(event.target.id==='pickbox')togglePick()"><div id="pkbox"><h3 style="margin-top:0">保存する画像を選ぶ</h3><div id="pktools"><button class="rs" onclick="pickAll(true)">全部選ぶ</button><button class="rs" onclick="pickAll(false)">全部はずす</button></div><div id="pklist"></div><button id="pkgo" onclick="exportPicked()">選択した画像を保存</button></div></div>
<script>
const KAKU=${JSON.stringify(KAKU)}, DELA=${JSON.stringify(DELA)}, MIN=${JSON.stringify(MIN)}, MARU=${JSON.stringify(MARU)}, HAND=${JSON.stringify(HAND)};
const THEMES=${JSON.stringify(THEMES)};
const FORMATS=${JSON.stringify(FORMATS)};
const BLOB_URI=${JSON.stringify(BLOB_URI)};
const ARROW_URI=${JSON.stringify(ARROW_URI)};
const ICONS=${JSON.stringify(ICONS)};
const shade=${shade.toString()};
const b64=${b64.toString()};
const icon=${icon.toString()};
const markerBg=${markerBg.toString()};
const nl=${nl.toString()};
const outline=${outline.toString()};
const faceSVG=${faceSVG.toString()};
const wrapAt=${wrapAt.toString()};
const wrap=${wrap.toString()};
const TEMPLATES=[${tplJs}];
const NUMMAP={};(function(){const cnt={},L={'表紙':'A','中身':'B','締め':'C'};TEMPLATES.forEach(t=>{const f=t.fmt||'ig';const key=f+'/'+t.cat;cnt[key]=(cnt[key]||0)+1;const letter=f==='youtube'?'Y':f==='note'?'N':(L[t.cat]||'');const cl=t.name.replace(/^[A-Z]\\d+\\s+/,'').replace(/^[A-Z]\\s+/,'').replace(/（[^）]*）\\s*$/,'');NUMMAP[t.id]=letter+cnt[key]+' '+cl;});})();
const getTpl=id=>TEMPLATES.find(t=>t.id===id);
const defaults=t=>Object.fromEntries(t.fields.map(f=>[f.key,f.def]));
const INITIAL_DECK=[['cover_target','money'],['content_grid','money'],['content_hero','money'],['content_steps','money'],['content_ranking','money'],['content_qa','money'],['cta_save','money']].map(([id,th])=>({tplId:id,theme:th,data:defaults(getTpl(id))}));
let fmt='ig',CW=1080,CH=1350,deck,cur=0,lastField=null,iconTargetKey=null;
try{const f=localStorage.getItem('buzzfmt');if(f&&FORMATS[f])fmt=f;}catch(e){}
CW=FORMATS[fmt].w;CH=FORMATS[fmt].h;
function tplsOf(f){return TEMPLATES.filter(function(t){return (t.fmt||'ig')===f;});}
function freshDeck(f){if(f==='ig')return JSON.parse(JSON.stringify(INITIAL_DECK));const list=tplsOf(f);const id=(list[0]||TEMPLATES[0]).id;const th=f==='youtube'?'business':'mono';return [{tplId:id,theme:th,data:defaults(getTpl(id))}];}
try{const sv=localStorage.getItem('buzzdeck_'+fmt);deck=sv?JSON.parse(sv):null;}catch(e){deck=null;}
if(!deck||!deck.length)deck=freshDeck(fmt);
const FONTS={'標準':'','角ゴシック':KAKU,'丸ゴシック':MARU,'明朝':MIN,'インパクト':DELA,'手書き':HAND};
function eff(s){const b=THEMES[s.theme];const t=Object.assign({},b);const o=s.over||{};
 if(o.head&&FONTS[o.head]){t.head=FONTS[o.head];t.display=FONTS[o.head];}
 if(o.body&&FONTS[o.body]){t.body=FONTS[o.body];}
 if(o.ink){t.ink=o.ink;}
 if(o.sub){t.sub=o.sub;}
 if(o.accent){t.accent=o.accent;t.accentDeep=shade(o.accent,-0.18);}
 return t;}
const slide=()=>deck[cur];
const slideHtml=s=>getTpl(s.tplId).render(s.data,eff(s));
let undoStack=[],redoStack=[],histTimer=null,lastHist=null;
function scheduleHist(){clearTimeout(histTimer);histTimer=setTimeout(function(){const j=JSON.stringify(deck);if(j!==lastHist){if(lastHist!=null){undoStack.push(lastHist);if(undoStack.length>60)undoStack.shift();}redoStack=[];lastHist=j;updateHistBtns();}},450);}
function updateHistBtns(){const u=document.getElementById('undobtn'),r=document.getElementById('redobtn');if(u)u.disabled=!undoStack.length;if(r)r.disabled=!redoStack.length;}
function undo(){clearTimeout(histTimer);const j=JSON.stringify(deck);if(j!==lastHist&&lastHist!=null){redoStack.push(j);deck=JSON.parse(lastHist);lastHist=JSON.stringify(deck);}else if(undoStack.length){redoStack.push(j);const p=undoStack.pop();deck=JSON.parse(p);lastHist=p;}else return;cur=Math.min(cur,deck.length-1);selBlock=-1;refreshAll();updateHistBtns();}
function redo(){if(!redoStack.length)return;clearTimeout(histTimer);undoStack.push(JSON.stringify(deck));const n=redoStack.pop();deck=JSON.parse(n);lastHist=n;cur=Math.min(cur,deck.length-1);selBlock=-1;refreshAll();updateHistBtns();}
function save(){try{localStorage.setItem('buzzdeck_'+fmt,JSON.stringify(deck))}catch(e){}scheduleHist();}
function updatePrintSize(){let st=document.getElementById('dynprint');if(!st){st=document.createElement('style');st.id='dynprint';document.head.appendChild(st);}st.textContent='@media print{@page{size:'+CW+'px '+CH+'px;margin:0}}';}
function setFmt(f){if(!FORMATS[f]||f===fmt)return;try{localStorage.setItem('buzzdeck_'+fmt,JSON.stringify(deck))}catch(e){}fmt=f;CW=FORMATS[f].w;CH=FORMATS[f].h;try{localStorage.setItem('buzzfmt',f)}catch(e){}let sv=null;try{sv=JSON.parse(localStorage.getItem('buzzdeck_'+f)||'null')}catch(e){}deck=(sv&&sv.length)?sv:freshDeck(f);cur=0;selBlock=-1;selFree=-1;moveMode=false;hideDelBtn();const mb=document.getElementById('movebtn');if(mb){mb.classList.remove('on');document.getElementById('movestate').textContent='🔒 編集モード：オフ';document.getElementById('movesub').textContent='押すと文字・画像を動かせます';}undoStack=[];redoStack=[];lastHist=JSON.stringify(deck);updateHistBtns();updatePrintSize();buildList();syncTheme();buildSlideOpt();buildForm();renderCard();renderDeck();fitScale();}
function applyBg(root,s){if(!root)return;const bg=s.bg;if(!bg||!bg.mode||bg.mode==='theme')return;
 if(bg.mode==='fill'&&bg.fill){root.style.background=bg.fill;}
 else if(bg.mode==='grad'){const c1=bg.fill||'#ffffff',c2=bg.fill2||'#cccccc',ang=(bg.angle==null?135:bg.angle);root.style.background='linear-gradient('+ang+'deg,'+c1+','+c2+')';}
 else if(bg.mode==='image'&&bg.image){const op=(bg.opacity==null?35:bg.opacity)/100;let ov='';
   if(bg.overlay==='white')ov='linear-gradient(rgba(255,255,255,'+op+'),rgba(255,255,255,'+op+')),';
   else if(bg.overlay==='black')ov='linear-gradient(rgba(0,0,0,'+op+'),rgba(0,0,0,'+op+')),';
   const fit=bg.fit||'cover',pos=bg.pos||'center';
   root.style.background=ov+'url('+bg.image+') '+pos+'/'+fit+' no-repeat'+(fit==='contain'?(', '+eff(s).bg):'');}}
function applyEl(root,s,live){if(!root)return;const ch=root.children,ps=s.pos||{},es=s.el||{},t=eff(s);for(let i=0;i<ch.length;i++){const el=ch[i],p=ps[i],e=es[i]||{};
 const tf=[];if(p)tf.push('translate('+p[0]+'px,'+p[1]+'px)');if(e.sc)tf.push('scale('+e.sc+')');el.style.transform=tf.join(' ');el.style.transformOrigin=e.sc?'top left':'';
 if(e.bold)el.style.setProperty('font-weight','900','important');
 if(e.al){el.style.alignSelf=e.al;el.style.textAlign=(e.al==='center'?'center':e.al==='flex-end'?'right':'left');}
 if(e.box){el.style.background=t.panel;el.style.border='3px solid '+t.accent;el.style.borderRadius='18px';el.style.padding='22px 28px';el.style.boxShadow='0 8px 24px rgba(0,0,0,.16)';}
 if(e.hide){if(live){el.style.opacity='.18';el.style.outline='1px dashed #999';}else{el.style.display='none';}}}}
function paint(el,s,live){el.innerHTML=slideHtml(s);const r=el.firstElementChild;applyBg(r,s);applyEl(r,s,live);applyOverlay(r,s,live);return r;}
let moveMode=false,selBlock=-1,selFree=-1,iconForFree=false,curScale=1,brand=[];
try{brand=JSON.parse(localStorage.getItem('buzzbrand')||'[]')}catch(e){brand=[];}
function addBrand(h){if(!h)return;h=String(h).toLowerCase();if(brand.indexOf(h)<0){brand.unshift(h);if(brand.length>12)brand.pop();try{localStorage.setItem('buzzbrand',JSON.stringify(brand))}catch(e){}buildSlideOpt();}}
function clearBrand(){if(!confirm('保存したブランドカラーを全消去しますか？'))return;brand=[];try{localStorage.setItem('buzzbrand','[]')}catch(e){}buildSlideOpt();}
function applyColor(tg,v){if(tg==='bgfill')setBgFill(v);else if(tg==='gradfill')setGrad('fill',v);else if(tg==='gradfill2')setGrad('fill2',v);else setOver(tg,v);}
function brandRow(tg,saveHex){let s='<span class="swrow">';brand.forEach(function(c){s+='<button class="sw" title="'+c+'" style="background:'+c+'" onclick="applyColor(\\''+tg+'\\',\\''+c+'\\')"></button>';});s+='<button class="sw addsw" title="この色を保存" onclick="addBrand(\\''+saveHex+'\\')">+</button></span>';return s;}
function brandRow2(prop,saveHex){let s='<span class="swrow">';brand.forEach(function(c){s+='<button class="sw" title="'+c+'" style="background:'+c+'" onclick="setFree(\\''+prop+'\\',\\''+c+'\\')"></button>';});s+='<button class="sw addsw" title="この色を保存" onclick="addBrand(\\''+saveHex+'\\')">+</button></span>';return s;}
function applyBgAll(){const s=slide();if(!confirm('この背景を全スライドに適用しますか？'))return;const b=s.bg?JSON.parse(JSON.stringify(s.bg)):null;deck.forEach(function(x){if(x!==s)x.bg=b?JSON.parse(JSON.stringify(b)):undefined;});renderCard();renderDeck();save();}
function applyStyleAll(){const s=slide();if(!confirm('このフォント・文字色を全スライドに適用しますか？'))return;const o=s.over?JSON.parse(JSON.stringify(s.over)):null;deck.forEach(function(x){if(x!==s)x.over=o?JSON.parse(JSON.stringify(o)):undefined;});renderCard();renderDeck();save();}
async function exportPng(all){let h2c;try{const m=await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');h2c=m.default||m;}catch(e){alert('画像化ライブラリを読み込めませんでした。ネット接続のある環境でお試しください。');return;}
 const idxs=Array.isArray(all)?all:(all?deck.map(function(_,i){return i;}):[cur]);if(!idxs.length){alert('保存する画像が選ばれていません。');return;}
 try{if(document.fonts&&document.fonts.ready)await document.fonts.ready;}catch(e){}
 let zip=null;if(idxs.length>1){try{const z=await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');const JSZip=z.default||z;zip=new JSZip();}catch(e){zip=null;}}
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-99999px;top:0;width:'+CW+'px;height:'+CH+'px;background:#fff';document.body.appendChild(host);
 for(let n=0;n<idxs.length;n++){const i=idxs[n];host.innerHTML='';paint(host,deck[i],false);const name=(fmt==='ig'?'slide_':fmt+'_')+String(i+1).padStart(2,'0')+'.png';
  try{const canvas=await h2c(host,{width:CW,height:CH,scale:2,backgroundColor:null,useCORS:true,logging:false});const url=canvas.toDataURL('image/png');
   if(zip){zip.file(name,url.split(',')[1],{base64:true});}else{const a=document.createElement('a');a.href=url;a.download=name;a.click();}
  }catch(e){alert('スライド'+(i+1)+'の画像化に失敗: '+e.message);}
  await new Promise(function(r){setTimeout(r,zip?40:300);});}
 host.remove();
 if(zip){try{const blob=await zip.generateAsync({type:'blob'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='slides_'+idxs.length+'.zip';a.click();setTimeout(function(){URL.revokeObjectURL(u);},3000);}catch(e){alert('ZIP作成に失敗: '+e.message);}}}
function fitScale(){const sc=Math.min((window.innerWidth-300-344-70)/CW,(window.innerHeight-210)/CH);curScale=Math.max(0.05,sc);document.getElementById('stage').style.transform='scale('+curScale+')';positionDelBtn();}
let logo=null;try{logo=JSON.parse(localStorage.getItem('buzzlogo')||'null')}catch(e){logo=null;}
function freeHtml(fe,t,idx,live){let inner='',st='position:absolute;left:'+fe.x+'px;top:'+fe.y+'px;';
 if(fe.type==='text'){const ff=(FONTS[fe.font]||t.body);st+='width:'+(fe.w||400)+'px;font-family:'+ff+';font-size:'+(fe.size||60)+'px;font-weight:'+(fe.weight||700)+';color:'+(fe.color||t.ink)+';line-height:1.3;display:flex;flex-direction:column;';inner=nl(fe.text||' ')||(fe.text||'');}
 else if(fe.type==='image'){st+='width:'+(fe.w||400)+'px;height:'+(fe.h||400)+'px;background:url('+fe.src+') center/cover no-repeat;border-radius:'+(fe.radius||0)+'px;display:flex;';}
 else if(fe.type==='shape'){const c=fe.color||t.accent;if(fe.shape==='circle')st+='width:'+(fe.w||220)+'px;height:'+(fe.w||220)+'px;border-radius:50%;background:'+c+';display:flex;';else if(fe.shape==='line')st+='width:'+(fe.w||320)+'px;height:'+(fe.h||10)+'px;border-radius:6px;background:'+c+';display:flex;';else st+='width:'+(fe.w||300)+'px;height:'+(fe.h||200)+'px;border-radius:'+(fe.radius||0)+'px;background:'+c+';display:flex;';}
 else if(fe.type==='icon'){st+='display:flex;';inner=icon(fe.name||'star',fe.color||t.accent,fe.size||120,1.8);}
 return '<div class="freeel'+(live&&idx===selFree?' selfree':'')+'" data-fi="'+idx+'" style="'+st+'">'+inner+'</div>';}
function logoHtml(t){const pos=logo.pos||'right bottom',m=58,sz=logo.size||40;let st='position:absolute;display:flex;align-items:center;opacity:'+((logo.opacity==null?90:logo.opacity)/100)+';';
 st+=(pos.indexOf('top')>=0?'top:'+m+'px;':'bottom:'+m+'px;');st+=(pos.indexOf('left')>=0?'left:'+m+'px;':pos.indexOf('center')>=0?'left:50%;transform:translateX(-50%);':'right:'+m+'px;');
 let inner='';if(logo.image)inner+='<div style="display:flex;width:'+sz+'px;height:'+sz+'px;background:url('+logo.image+') center/contain no-repeat;margin-right:'+(logo.text?'14px':'0')+';"></div>';
 if(logo.text)inner+='<div style="display:flex;font-family:'+t.body+';font-size:'+Math.round(sz*0.72)+'px;font-weight:700;color:'+(logo.color||t.ink)+';">'+logo.text+'</div>';
 return '<div class="logoel" style="'+st+'">'+inner+'</div>';}
function applyOverlay(root,s,live){if(!root)return;const t=eff(s);
 if(s.free&&s.free.length){root.style.position='relative';s.free.forEach(function(fe,i){root.insertAdjacentHTML('beforeend',freeHtml(fe,t,i,live));});if(live)enableFreeDrag(root,s);}
 if(logo&&(logo.text||logo.image)){root.style.position='relative';root.insertAdjacentHTML('beforeend',logoHtml(t));}}
function enableFreeDrag(root,s){root.querySelectorAll('.freeel').forEach(function(el){const idx=+el.dataset.fi;el.style.cursor='move';el.onmousedown=function(ev){ev.preventDefault();ev.stopPropagation();selFree=idx;selBlock=-1;document.querySelectorAll('#card .selfree').forEach(function(x){x.classList.remove('selfree');});el.classList.add('selfree');buildSlideOpt();positionDelBtn();const fe=s.free[idx],sx=ev.clientX,sy=ev.clientY,ox=fe.x,oy=fe.y;function mv(e){hideDelBtn();fe.x=Math.round(ox+(e.clientX-sx)/curScale);fe.y=Math.round(oy+(e.clientY-sy)/curScale);el.style.left=fe.x+'px';el.style.top=fe.y+'px';const sn=computeSnap(cardCoords(el));if(sn.dx!=null){fe.x=Math.round(fe.x+sn.dx);el.style.left=fe.x+'px';}if(sn.dy!=null){fe.y=Math.round(fe.y+sn.dy);el.style.top=fe.y+'px';}showGuide(sn.gx,sn.gy);}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);clearGuide();save();renderDeck();positionDelBtn();}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);};});}
function checkOverflow(){const root=document.querySelector('#card>div');const b=document.getElementById('ovwarn');if(!root||!b)return;b.style.display=(root.scrollHeight>root.clientHeight+2||root.scrollWidth>root.clientWidth+2)?'block':'none';}
function cardCoords(el){const cr=document.getElementById('card').getBoundingClientRect(),r=el.getBoundingClientRect();return {l:(r.left-cr.left)/curScale,t:(r.top-cr.top)/curScale,w:r.width/curScale,h:r.height/curScale};}
function computeSnap(c){const thr=12,cxC=CW/2,cyC=CH/2,mL=80,mR=CW-80,mT=80,mB=CH-80;let dx=null,gx=null,dy=null,gy=null;const cx=c.l+c.w/2;
 if(Math.abs(cx-cxC)<thr){dx=cxC-cx;gx=cxC;}else if(Math.abs(c.l-mL)<thr){dx=mL-c.l;gx=mL;}else if(Math.abs((c.l+c.w)-mR)<thr){dx=mR-(c.l+c.w);gx=mR;}
 const cy=c.t+c.h/2;if(Math.abs(cy-cyC)<thr){dy=cyC-cy;gy=cyC;}else if(Math.abs(c.t-mT)<thr){dy=mT-c.t;gy=mT;}else if(Math.abs((c.t+c.h)-mB)<thr){dy=mB-(c.t+c.h);gy=mB;}
 return {dx:dx,dy:dy,gx:gx,gy:gy};}
function showGuide(gx,gy){const card=document.getElementById('card');let v=document.getElementById('gv'),z=document.getElementById('gh');
 if(gx==null){if(v)v.remove();}else{if(!v){v=document.createElement('div');v.id='gv';v.style.cssText='position:absolute;top:0;bottom:0;width:2px;background:#2D6CDF;z-index:9;pointer-events:none';card.appendChild(v);}v.style.left=gx+'px';}
 if(gy==null){if(z)z.remove();}else{if(!z){z=document.createElement('div');z.id='gh';z.style.cssText='position:absolute;left:0;right:0;height:2px;background:#2D6CDF;z-index:9;pointer-events:none';card.appendChild(z);}z.style.top=gy+'px';}}
function clearGuide(){const v=document.getElementById('gv'),z=document.getElementById('gh');if(v)v.remove();if(z)z.remove();}
let resizing=false;
function deleteSelected(){if(selFree>=0){delFree();}else if(selBlock>=0){const e=elObj();e.hide=true;selBlock=-1;renderCard();renderDeck();buildSlideOpt();save();}hideDelBtn();}
function hideDelBtn(){const b=document.getElementById('delbtn'),z=document.getElementById('szbtn');if(b)b.style.display='none';if(z)z.style.display='none';}
function selDomEl(){if(!moveMode)return null;const sel=(selFree>=0)?'#card .selfree':(selBlock>=0)?'#card .selblock':null;return sel?document.querySelector(sel):null;}
function positionDelBtn(){if(resizing)return;const b=document.getElementById('delbtn'),z=document.getElementById('szbtn');if(!b)return;const el=selDomEl();if(!el){b.style.display='none';if(z)z.style.display='none';return;}const r=el.getBoundingClientRect();b.style.display='flex';b.style.left=(r.right-12)+'px';b.style.top=(r.top-12)+'px';if(z){z.style.display='flex';z.style.left=(r.right-12)+'px';z.style.top=(r.bottom-12)+'px';}}
function startResize(ev){ev.preventDefault();ev.stopPropagation();const el=selDomEl();if(!el)return;const r=el.getBoundingClientRect(),ox=r.left,oy=r.top;const start=Math.max(24,Math.hypot(ev.clientX-ox,ev.clientY-oy));const s=slide();let base;
 if(selFree>=0){const fe=s.free[selFree];base={size:fe.size,w:fe.w,h:fe.h,type:fe.type};}else{const e=(s.el&&s.el[selBlock])||{};base={sc:e.sc||1};}
 resizing=true;hideDelBtn();
 function mv(e){let f=Math.hypot(e.clientX-ox,e.clientY-oy)/start;f=Math.max(0.3,Math.min(4,f));
  if(selFree>=0){const fe=s.free[selFree];if(fe.type==='text'||fe.type==='icon'){fe.size=Math.round(base.size*f);}else{fe.w=Math.round(base.w*f);if(base.h)fe.h=Math.round(base.h*f);}}
  else{if(!s.el)s.el={};if(!s.el[selBlock])s.el[selBlock]={};s.el[selBlock].sc=Math.round(base.sc*f*100)/100;}
  renderCard();}
 function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);resizing=false;renderCard();renderDeck();buildSlideOpt();save();}
 document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);}
function resetSlide(){if(!confirm('このスライドの編集を最初からやり直します。\\n（文字・背景・フォント色・配置/サイズ・追加した要素をすべて初期状態に戻します。型とテーマはそのまま）\\n\\nよろしいですか？'))return;const s=slide();const t=getTpl(s.tplId);s.data=defaults(t);delete s.bg;delete s.over;s.pos={};s.el={};s.free=[];selBlock=-1;selFree=-1;hideDelBtn();refreshAll();save();}
function renderCard(){const c=document.getElementById('card');const root=paint(c,slide(),moveMode);if(moveMode)enableDrag(root);checkOverflow();positionDelBtn();}
function enableDrag(root){if(!root)return;root.classList.add('movemode');const ch=root.children;for(let i=0;i<ch.length;i++){(function(el,idx){if(el.classList.contains('freeel')||el.classList.contains('logoel'))return;el.classList.add('draggable');if(idx===selBlock)el.classList.add('selblock');el.onmousedown=function(ev){ev.preventDefault();ev.stopPropagation();selBlock=idx;document.querySelectorAll('#card .selblock').forEach(x=>x.classList.remove('selblock'));el.classList.add('selblock');buildSlideOpt();positionDelBtn();const s=slide();const base=(s.pos&&s.pos[idx])?s.pos[idx]:[0,0];const sx=ev.clientX,sy=ev.clientY;let tmp=base.slice();const sc0=(s.el&&s.el[idx]&&s.el[idx].sc)||1;function tf(){return 'translate('+tmp[0]+'px,'+tmp[1]+'px)'+(sc0!==1?' scale('+sc0+')':'');}function mv(e){hideDelBtn();const dx=(e.clientX-sx)/curScale,dy=(e.clientY-sy)/curScale;tmp=[Math.round(base[0]+dx),Math.round(base[1]+dy)];el.style.transform=tf();const sn=computeSnap(cardCoords(el));if(sn.dx!=null)tmp[0]=Math.round(tmp[0]+sn.dx);if(sn.dy!=null)tmp[1]=Math.round(tmp[1]+sn.dy);if(sn.dx!=null||sn.dy!=null)el.style.transform=tf();showGuide(sn.gx,sn.gy);}function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);clearGuide();if(!s.pos)s.pos={};s.pos[idx]=tmp;save();renderDeck();positionDelBtn();}document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);};})(ch[i],i);}}
function toggleMove(){moveMode=!moveMode;selBlock=-1;selFree=-1;document.getElementById('movebtn').classList.toggle('on',moveMode);document.getElementById('movestate').textContent=moveMode?'✋ 編集モード：オン':'🔒 編集モード：オフ';document.getElementById('movesub').textContent=moveMode?'文字や表をクリックで選択 → ドラッグ移動／✕・Deleteで削除':'押すと文字・画像を動かせます';buildSlideOpt();renderCard();}
function resetPos(){slide().pos={};slide().el={};selBlock=-1;renderCard();renderDeck();buildSlideOpt();save();}
function nudge(e){if(!moveMode||selBlock<0)return;const k=e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(k)<0)return;if(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))return;e.preventDefault();const s=slide();if(!s.pos)s.pos={};const o=(s.pos[selBlock]||[0,0]).slice();const step=e.shiftKey?20:4;if(k==='ArrowUp')o[1]-=step;if(k==='ArrowDown')o[1]+=step;if(k==='ArrowLeft')o[0]-=step;if(k==='ArrowRight')o[0]+=step;s.pos[selBlock]=o;renderCard();renderDeck();save();}
function goSlide(i){cur=i;selBlock=-1;selFree=-1;syncTheme();highlightTpl();buildSlideOpt();buildForm();renderCard();renderDeck();}
function setBgMode(m){const s=slide();if(!s.bg)s.bg={};s.bg.mode=m;if(m==='fill'&&!s.bg.fill)s.bg.fill=eff(s).bg;if(m==='grad'){if(!s.bg.fill)s.bg.fill=eff(s).accent;if(!s.bg.fill2)s.bg.fill2=eff(s).accentDeep;if(s.bg.angle==null)s.bg.angle=135;}if(m==='image'&&s.bg.overlay==null){s.bg.overlay='black';s.bg.opacity=35;}renderCard();renderDeck();buildSlideOpt();save();}
function setBgFill(v){const s=slide();if(!s.bg)s.bg={};s.bg.mode='fill';s.bg.fill=v;renderCard();renderDeck();save();}
function setBgImage(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(){const s=slide();if(!s.bg)s.bg={};s.bg.mode='image';s.bg.image=r.result;if(s.bg.overlay==null){s.bg.overlay='black';s.bg.opacity=35;}renderCard();renderDeck();buildSlideOpt();save();};r.readAsDataURL(f);}
function setOverlay(v){const s=slide();if(!s.bg)s.bg={};s.bg.overlay=v;renderCard();renderDeck();save();}
function setOpacity(v){const s=slide();if(!s.bg)s.bg={};s.bg.opacity=+v;renderCard();renderDeck();}
function setGrad(k,v){const s=slide();if(!s.bg)s.bg={};s.bg.mode='grad';if(k==='angle')s.bg.angle=+v;else s.bg[k]=v;if(!s.bg.fill)s.bg.fill=eff(s).accent;if(!s.bg.fill2)s.bg.fill2=eff(s).accentDeep;renderCard();renderDeck();save();}
function setFit(v){const s=slide();if(!s.bg)s.bg={};s.bg.fit=v;renderCard();renderDeck();buildSlideOpt();save();}
function setImgPos(v){const s=slide();if(!s.bg)s.bg={};s.bg.pos=v;renderCard();renderDeck();buildSlideOpt();save();}
function setOver(key,v){const s=slide();if(!s.over)s.over={};if(v===''||v==='標準')delete s.over[key];else s.over[key]=v;renderCard();renderDeck();buildSlideOpt();save();}
function freeArr(){const s=slide();if(!s.free)s.free=[];return s.free;}
function addFree(type){const a=freeArr(),t=eff(slide());const o={type:type,x:430,y:600};
 if(type==='text'){o.text='テキスト';o.size=60;o.color=t.ink;o.font='標準';o.weight=700;o.w=420;}
 else if(type==='shape'){o.shape='rect';o.w=320;o.h=200;o.color=t.accent;o.radius=16;}
 else if(type==='icon'){o.name='star';o.size=130;o.color=t.accent;}
 a.push(o);selFree=a.length-1;selBlock=-1;if(!moveMode){moveMode=true;document.getElementById('movebtn').classList.add('on');}renderCard();renderDeck();buildSlideOpt();save();}
function addFreeImage(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(){const a=freeArr();a.push({type:'image',src:r.result,x:320,y:480,w:440,h:440,radius:0});selFree=a.length-1;selBlock=-1;if(!moveMode){moveMode=true;document.getElementById('movebtn').classList.add('on');}renderCard();renderDeck();buildSlideOpt();save();};r.readAsDataURL(f);}
function setFree(p,v){if(selFree<0)return;const a=freeArr();if(!a[selFree])return;a[selFree][p]=v;renderCard();renderDeck();save();}
function setFreeUI(p,v){setFree(p,v);buildSlideOpt();}
function toggleFreeBold(){if(selFree<0)return;const a=freeArr();a[selFree].weight=(a[selFree].weight==900?400:900);renderCard();renderDeck();buildSlideOpt();save();}
function freeBump(p,d,mn,mx){if(selFree<0)return;const a=freeArr(),o=a[selFree];o[p]=Math.max(mn,Math.min(mx,(o[p]||0)+d));renderCard();renderDeck();buildSlideOpt();save();}
function delFree(){if(selFree<0)return;freeArr().splice(selFree,1);selFree=-1;renderCard();renderDeck();buildSlideOpt();save();}
function setLogo(k,v){if(!logo)logo={};logo[k]=v;try{localStorage.setItem('buzzlogo',JSON.stringify(logo))}catch(e){}renderCard();renderDeck();}
function setLogoImage(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(){if(!logo)logo={};logo.image=r.result;try{localStorage.setItem('buzzlogo',JSON.stringify(logo))}catch(e){}renderCard();renderDeck();buildSlideOpt();};r.readAsDataURL(f);}
function clearLogo(){logo=null;try{localStorage.removeItem('buzzlogo')}catch(e){}renderCard();renderDeck();buildSlideOpt();}
function elObj(){const s=slide();if(!s.el)s.el={};if(!s.el[selBlock])s.el[selBlock]={};return s.el[selBlock];}
function elBump(d){if(selBlock<0)return;const e=elObj();e.sc=Math.round(Math.max(0.4,Math.min(3,(e.sc||1)+d))*100)/100;renderCard();renderDeck();buildSlideOpt();save();}
function elToggle(p){if(selBlock<0)return;const e=elObj();e[p]=!e[p];renderCard();renderDeck();buildSlideOpt();save();}
function elAlign(v){if(selBlock<0)return;const e=elObj();e.al=(e.al===v?'':v);renderCard();renderDeck();buildSlideOpt();save();}
function elReset(){const s=slide();if(selBlock<0)return;if(s.el)delete s.el[selBlock];if(s.pos)delete s.pos[selBlock];renderCard();renderDeck();buildSlideOpt();save();}
function buildSlideOpt(){const s=slide();const bg=s.bg||{};const o=s.over||{};const et=eff(s);
 const fontOpts=function(sel){return Object.keys(FONTS).map(function(k){return '<option value="'+k+'"'+(sel===k?' selected':'')+'>'+k+'</option>';}).join('');};
 const sw=['bg','panelSoft','accent','accentDeep','ink','sub'].map(function(k){return '<button class="sw" title="'+et[k]+'" style="background:'+et[k]+'" onclick="setBgFill(\\''+et[k]+'\\')"></button>';}).join('');
 let h='<div class="optsec"><div class="opth">背景</div><div class="seg">'
   +'<button class="'+(!bg.mode||bg.mode==='theme'?'on':'')+'" onclick="setBgMode(\\'theme\\')">標準</button>'
   +'<button class="'+(bg.mode==='fill'?'on':'')+'" onclick="setBgMode(\\'fill\\')">塗り</button>'
   +'<button class="'+(bg.mode==='grad'?'on':'')+'" onclick="setBgMode(\\'grad\\')">グラデ</button>'
   +'<button class="'+(bg.mode==='image'?'on':'')+'" onclick="setBgMode(\\'image\\')">画像</button></div>';
 if(bg.mode==='fill'){h+='<div class="optrow"><input type="color" value="'+(bg.fill||et.bg)+'" oninput="setBgFill(this.value)"><span class="swrow">'+sw+'</span></div>'+brandRow('bgfill',bg.fill||et.bg);}
 if(bg.mode==='grad'){h+='<div class="optrow2"><span class="optlab2">色1</span><input type="color" value="'+(bg.fill||et.accent)+'" oninput="setGrad(\\'fill\\',this.value)"><span class="optlab2">色2</span><input type="color" value="'+(bg.fill2||et.accentDeep)+'" oninput="setGrad(\\'fill2\\',this.value)"></div>'+brandRow('gradfill',bg.fill||et.accent)
   +'<div class="optlab">角度 '+(bg.angle==null?135:bg.angle)+'°</div><input type="range" class="optrange" min="0" max="360" value="'+(bg.angle==null?135:bg.angle)+'" oninput="setGrad(\\'angle\\',this.value);this.previousElementSibling.textContent=\\'角度 \\'+this.value+\\'°\\'">';}
 if(bg.mode==='image'){h+='<input type="file" accept="image/*" class="optfile" onchange="setBgImage(event)">'+(bg.image?'<div class="optlab" style="color:#7a7">画像セット済（再アップで差し替え）</div>':'<div class="optlab" style="color:#977">画像をアップしてください</div>')
   +'<div class="optlab">表示方法</div><div class="seg"><button class="'+(!bg.fit||bg.fit==='cover'?'on':'')+'" onclick="setFit(\\'cover\\')">全体に敷く</button><button class="'+(bg.fit==='contain'?'on':'')+'" onclick="setFit(\\'contain\\')">全部見せる</button></div>'
   +'<div class="optlab">位置</div><div class="posgrid">'+['left top','center top','right top','left center','center','right center','left bottom','center bottom','right bottom'].map(function(pp){return '<button class="'+((bg.pos||'center')===pp?'on':'')+'" onclick="setImgPos(\\''+pp+'\\')"></button>';}).join('')+'</div>'
   +'<div class="optlab">上に重ねるレイヤー</div><div class="seg"><button class="'+(!bg.overlay||bg.overlay==='none'?'on':'')+'" onclick="setOverlay(\\'none\\')">なし</button><button class="'+(bg.overlay==='white'?'on':'')+'" onclick="setOverlay(\\'white\\')">白</button><button class="'+(bg.overlay==='black'?'on':'')+'" onclick="setOverlay(\\'black\\')">黒</button></div>'
   +'<div class="optlab">レイヤーの濃さ '+(bg.opacity==null?35:bg.opacity)+'%</div><input type="range" class="optrange" min="0" max="90" value="'+(bg.opacity==null?35:bg.opacity)+'" oninput="setOpacity(this.value);this.previousElementSibling.textContent=\\'レイヤーの濃さ \\'+this.value+\\'%\\'">';}
 if(bg.mode&&bg.mode!=='theme')h+='<button class="rs" style="margin-top:9px" onclick="applyBgAll()">この背景を全スライドへ</button>';
 h+='</div>';
 h+='<div class="optsec"><div class="opth">フォント</div><div class="optlab" style="margin-top:0">見出し</div><select class="optsel" onchange="setOver(\\'head\\',this.value)">'+fontOpts(o.head||'標準')+'</select><div class="optlab">本文</div><select class="optsel" onchange="setOver(\\'body\\',this.value)">'+fontOpts(o.body||'標準')+'</select></div>';
 h+='<div class="optsec"><div class="opth">文字カラー</div>';
 [['ink','文字色'],['accent','アクセント'],['sub','サブ文字']].forEach(function(kv){const k=kv[0],lab=kv[1];h+='<div class="optrow2"><span class="optlab2">'+lab+'</span><input type="color" value="'+(o[k]||et[k])+'" oninput="setOver(\\''+k+'\\',this.value)">'+(o[k]?'<button class="rs" onclick="setOver(\\''+k+'\\',\\'\\')">標準</button>':'')+'</div>'+brandRow(k,o[k]||et[k]);});
 h+='<button class="rs" style="margin-top:9px" onclick="applyStyleAll()">フォント・色を全スライドへ</button>';
 if(brand.length)h+='<div class="optlab">保存色（＋で追加）<button class="rs" style="margin-left:6px" onclick="clearBrand()">全消去</button></div>';
 h+='</div>';
 h+='<div class="optsec"><div class="opth">配置・要素編集</div>';
 if(!moveMode){h+='<div class="optlab" style="margin-top:0">上の「✋移動」をONにすると、文字・表をドラッグ移動＆選択して個別編集できます。</div>';}
 else if(selBlock<0){h+='<div class="optlab" style="margin-top:0">プレビュー上の文字・表を<b>クリックで選択</b>→ここに編集メニューが出ます。ドラッグで移動／矢印キーで微調整。</div>';}
 else{const e=(s.el&&s.el[selBlock])||{};
   h+='<div class="optlab" style="margin-top:0">選択中の要素 #'+(selBlock+1)+'</div>';
   h+='<div class="optlab">文字サイズ '+Math.round((e.sc||1)*100)+'%</div><div class="elrow"><button onclick="elBump(-0.1)">－</button><button onclick="elBump(0.1)">＋</button><button class="'+(e.bold?'on':'')+'" onclick="elToggle(\\'bold\\')">太字</button></div>';
   h+='<div class="optlab">整列</div><div class="elrow"><button class="'+(e.al==='flex-start'?'on':'')+'" onclick="elAlign(\\'flex-start\\')">左</button><button class="'+(e.al==='center'?'on':'')+'" onclick="elAlign(\\'center\\')">中央</button><button class="'+(e.al==='flex-end'?'on':'')+'" onclick="elAlign(\\'flex-end\\')">右</button></div>';
   h+='<div class="elrow" style="margin-top:8px"><button class="'+(e.box?'on':'')+'" onclick="elToggle(\\'box\\')">枠・影</button><button class="'+(e.hide?'on':'')+'" onclick="elToggle(\\'hide\\')">'+(e.hide?'再表示':'非表示')+'</button><button onclick="elReset()">要素リセット</button></div>';}
 if(s.pos&&Object.keys(s.pos).length||s.el&&Object.keys(s.el).length){h+='<button class="rs" style="margin-top:10px" onclick="resetPos()">スライド全体の配置をリセット</button>';}
 h+='</div>';
 h+='<div class="optsec"><div class="opth">追加レイヤー（自由配置）</div><div class="elrow"><button onclick="addFree(\\'text\\')">＋文字</button><button onclick="document.getElementById(\\'fimgin\\').click()">＋画像</button><button onclick="addFree(\\'shape\\')">＋図形</button><button onclick="addFree(\\'icon\\')">＋アイコン</button></div><input id="fimgin" type="file" accept="image/*" style="display:none" onchange="addFreeImage(event)">';
 const fe=(s.free&&selFree>=0)?s.free[selFree]:null;
 if(fe){h+='<div class="optlab">選択中の'+({text:'文字',image:'画像',shape:'図形',icon:'アイコン'}[fe.type]||'要素')+'（ドラッグで移動）</div>';
   if(fe.type==='text'){h+='<textarea class="optsel" style="resize:vertical" oninput="setFree(\\'text\\',this.value)">'+(fe.text||'').replace(/</g,'&lt;')+'</textarea>'
     +'<div class="optlab">文字サイズ '+(fe.size||60)+'</div><div class="elrow"><button onclick="freeBump(\\'size\\',-6,12,400)">－</button><button onclick="freeBump(\\'size\\',6,12,400)">＋</button><button onclick="toggleFreeBold()">太字</button></div>'
     +'<div class="optlab">フォント</div><select class="optsel" onchange="setFree(\\'font\\',this.value)">'+Object.keys(FONTS).map(function(k){return '<option'+((fe.font||'標準')===k?' selected':'')+'>'+k+'</option>';}).join('')+'</select>'
     +'<div class="optrow2"><span class="optlab2">文字色</span><input type="color" value="'+(fe.color||et.ink)+'" oninput="setFree(\\'color\\',this.value)"></div>'+brandRow2('color',fe.color||et.ink);}
   else if(fe.type==='image'){h+='<div class="optlab">大きさ '+(fe.w||440)+'</div><div class="elrow"><button onclick="freeBump(\\'w\\',-30,80,1080);freeBump(\\'h\\',-30,80,1350)">－</button><button onclick="freeBump(\\'w\\',30,80,1080);freeBump(\\'h\\',30,80,1350)">＋</button></div><div class="optlab">角丸 '+(fe.radius||0)+'</div><div class="elrow"><button onclick="freeBump(\\'radius\\',-10,0,400)">－</button><button onclick="freeBump(\\'radius\\',10,0,400)">＋</button></div>';}
   else if(fe.type==='shape'){h+='<div class="optlab">形</div><div class="seg"><button class="'+(fe.shape==='rect'?'on':'')+'" onclick="setFreeUI(\\'shape\\',\\'rect\\')">四角</button><button class="'+(fe.shape==='circle'?'on':'')+'" onclick="setFreeUI(\\'shape\\',\\'circle\\')">丸</button><button class="'+(fe.shape==='line'?'on':'')+'" onclick="setFreeUI(\\'shape\\',\\'line\\')">線</button></div><div class="optlab">大きさ</div><div class="elrow"><button onclick="freeBump(\\'w\\',-30,20,1080)">幅－</button><button onclick="freeBump(\\'w\\',30,20,1080)">幅＋</button><button onclick="freeBump(\\'h\\',-20,6,1350)">高－</button><button onclick="freeBump(\\'h\\',20,6,1350)">高＋</button></div><div class="optrow2"><span class="optlab2">色</span><input type="color" value="'+(fe.color||et.accent)+'" oninput="setFree(\\'color\\',this.value)"></div>'+brandRow2('color',fe.color||et.accent);}
   else if(fe.type==='icon'){h+='<div class="elrow"><button onclick="iconForFree=true;toggleIcons()">アイコンを選ぶ（現在: '+(fe.name||'star')+'）</button></div><div class="optlab">大きさ '+(fe.size||130)+'</div><div class="elrow"><button onclick="freeBump(\\'size\\',-14,24,600)">－</button><button onclick="freeBump(\\'size\\',14,24,600)">＋</button></div><div class="optrow2"><span class="optlab2">色</span><input type="color" value="'+(fe.color||et.accent)+'" oninput="setFree(\\'color\\',this.value)"></div>'+brandRow2('color',fe.color||et.accent);}
   h+='<button class="rs" style="margin-top:9px" onclick="delFree()">この要素を削除</button>';}
 else{h+='<div class="optlab">＋で文字/画像/図形/アイコンを追加→プレビュー上をドラッグで移動。クリックで選択。絵文字は＋文字に直接入力。</div>';}
 h+='</div>';
 const lg=logo||{};h+='<div class="optsec"><div class="opth">ロゴ・透かし（全スライド共通）</div><div class="optrow2"><span class="optlab2">テキスト</span><input class="optsel" style="flex:2" value="'+(lg.text||'').replace(/"/g,'&quot;')+'" oninput="setLogo(\\'text\\',this.value)"></div><div class="elrow"><button onclick="document.getElementById(\\'logoin\\').click()">画像ロゴ'+(lg.image?'（変更）':'')+'</button>'+(lg.image||lg.text?'<button onclick="clearLogo()">消す</button>':'')+'</div><input id="logoin" type="file" accept="image/*" style="display:none" onchange="setLogoImage(event)">';
 if(lg.text||lg.image){h+='<div class="optlab">位置</div><select class="optsel" onchange="setLogo(\\'pos\\',this.value)">'+['right bottom','left bottom','center bottom','right top','left top','center top'].map(function(p){return '<option value="'+p+'"'+((lg.pos||'right bottom')===p?' selected':'')+'>'+({'right bottom':'右下','left bottom':'左下','center bottom':'中央下','right top':'右上','left top':'左上','center top':'中央上'}[p])+'</option>';}).join('')+'</select><div class="optrow2"><span class="optlab2">文字色</span><input type="color" value="'+(lg.color||et.ink)+'" oninput="setLogo(\\'color\\',this.value)"></div><div class="optlab">大きさ '+(lg.size||40)+'</div><input type="range" class="optrange" min="24" max="90" value="'+(lg.size||40)+'" oninput="setLogo(\\'size\\',+this.value)"><div class="optlab">濃さ '+(lg.opacity==null?90:lg.opacity)+'%</div><input type="range" class="optrange" min="15" max="100" value="'+(lg.opacity==null?90:lg.opacity)+'" oninput="setLogo(\\'opacity\\',+this.value)">';}
 h+='</div>';
 h+='<div class="optsec"><div class="opth">画像で書き出し（PNG）</div><div class="elrow"><button onclick="exportPng(false)">このスライド</button><button onclick="exportPng(true)">全スライド</button></div><div class="optlab">PDFと別に1枚ずつPNG保存（1080×1350）。オンライン環境で動作。</div></div>';
 document.getElementById('slideopt').innerHTML=h;}
function highlightTpl(){document.querySelectorAll('.tpl').forEach(b=>b.classList.toggle('active',b.dataset.id===slide().tplId));}
function syncTheme(){document.getElementById('theme').value=slide().theme;}
function renderDeck(){const d=document.getElementById('deckbar');d.innerHTML='';const TH=100,TWd=Math.round(TH*CW/CH),sc=TH/CH;
 deck.forEach((s,i)=>{const th=document.createElement('div');th.className='thumb'+(i===cur?' active':'');th.style.width=TWd+'px';th.style.height=TH+'px';th.onclick=()=>goSlide(i);th.innerHTML='<div class="no">'+(i+1)+'</div><div class="tw" style="width:'+CW+'px;height:'+CH+'px;transform:scale('+sc+')"></div>';paint(th.querySelector('.tw'),s);d.appendChild(th)});
 const tb=document.createElement('div');tb.id='dtools';
 [['＋追加','add'],['複製','dup'],['削除','del'],['◀','left'],['▶','right'],['全テーマ適用','alltheme']].forEach(([lbl,act])=>{const b=document.createElement('button');b.textContent=lbl;b.onclick=()=>deckAct(act);tb.appendChild(b)});
 d.appendChild(tb);save();}
function refreshAll(){syncTheme();highlightTpl();buildSlideOpt();buildForm();renderCard();renderDeck();}
function newDeck(){if(!confirm('今のデッキを破棄して新規作成しますか？'))return;deck=JSON.parse(JSON.stringify(INITIAL_DECK));cur=0;refreshAll();}
function exportDeck(){const b=new Blob([JSON.stringify(deck)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='buzz_deck.json';a.click();}
function importDeck(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(){try{const d=JSON.parse(r.result);if(Array.isArray(d)&&d.length){deck=d;cur=0;refreshAll();}else alert('形式が違います')}catch(x){alert('読み込めませんでした')}};r.readAsText(f);e.target.value='';}
function deckAct(a){const s=slide();
 if(a==='add'){deck.splice(cur+1,0,{tplId:s.tplId,theme:s.theme,data:defaults(getTpl(s.tplId))});cur++;}
 else if(a==='dup'){const c=JSON.parse(JSON.stringify(s));deck.splice(cur+1,0,c);cur++;}
 else if(a==='del'){if(deck.length>1){deck.splice(cur,1);if(cur>=deck.length)cur=deck.length-1;}}
 else if(a==='left'){if(cur>0){const t=deck[cur-1];deck[cur-1]=deck[cur];deck[cur]=t;cur--;}}
 else if(a==='right'){if(cur<deck.length-1){const t=deck[cur+1];deck[cur+1]=deck[cur];deck[cur]=t;cur++;}}
 else if(a==='alltheme'){const th=s.theme;deck.forEach(x=>x.theme=th);}
 syncTheme();highlightTpl();buildSlideOpt();buildForm();renderCard();renderDeck();}
function buildForm(){const t=getTpl(slide().tplId);const f=document.getElementById('fields');f.innerHTML='';t.fields.forEach(fl=>{const lab=document.createElement('label');lab.textContent=fl.label;f.appendChild(lab);if(fl.type==='file'){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.style.cssText='width:100%;color:#eee;font-size:12px';inp.onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{slide().data[fl.key]=r.result;renderCard();renderDeck()};r.readAsDataURL(file)};f.appendChild(inp);}else if(fl.type==='select'){const sel=document.createElement('select');sel.style.cssText='width:100%;background:#1d1d25;color:#eee;border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:8px;font-size:13px';(fl.options||[]).forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;sel.appendChild(op)});sel.value=slide().data[fl.key];sel.onchange=()=>{slide().data[fl.key]=sel.value;renderCard();renderDeck()};f.appendChild(sel);}else if(fl.type==='icon'){const cv=slide().data[fl.key]||'';const w=document.createElement('div');w.style.cssText='display:flex;align-items:center;gap:8px';const pv=document.createElement('div');pv.style.cssText='width:42px;height:42px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#1d1d25;border-radius:6px';pv.innerHTML=cv&&ICONS[cv]?icon(cv,'#dddddd',26,1.8):'<span style="color:#777;font-size:10px">なし</span>';const bt=document.createElement('button');bt.textContent=cv?('変更（'+cv+'）'):'アイコンを選ぶ';bt.style.cssText='flex:1;background:#1d1d25;color:#ccc;border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:9px;font-size:12px;cursor:pointer';bt.onclick=()=>{iconTargetKey=fl.key;toggleIcons();};w.appendChild(pv);w.appendChild(bt);if(cv){const cl=document.createElement('button');cl.textContent='✕';cl.style.cssText='background:#3a2326;color:#f0b0b0;border:0;border-radius:6px;padding:0 11px;cursor:pointer;font-size:13px';cl.onclick=()=>{slide().data[fl.key]='';renderCard();renderDeck();buildForm();};w.appendChild(cl);}f.appendChild(w);}else if(fl.type==='rows'){const cols=fl.cols||['値'];const box=document.createElement('div');let arr=(slide().data[fl.key]||'').split('\\n').filter(x=>x.length).map(l=>l.split('｜'));const commit=()=>{slide().data[fl.key]=arr.map(r=>r.join('｜')).join('\\n');renderCard();renderDeck();};function draw(){box.innerHTML='';arr.forEach((r,ri)=>{const row=document.createElement('div');row.style.cssText='display:flex;gap:4px;margin-bottom:6px';cols.forEach((c,ci)=>{const inp=document.createElement('input');inp.type='text';inp.placeholder=c;inp.value=r[ci]||'';inp.style.cssText='flex:1;min-width:0;background:#1d1d25;color:#eee;border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:7px;font-size:12px';inp.oninput=()=>{while(arr[ri].length<=ci)arr[ri].push('');arr[ri][ci]=inp.value;commit();};row.appendChild(inp);});const del=document.createElement('button');del.textContent='✕';del.style.cssText='background:#3a2326;color:#f0b0b0;border:0;border-radius:6px;padding:0 11px;cursor:pointer;font-size:13px;flex-shrink:0';del.onclick=()=>{arr.splice(ri,1);commit();draw();};row.appendChild(del);box.appendChild(row);});const add=document.createElement('button');add.textContent='＋ 行を追加';add.style.cssText='width:100%;background:#1d1d25;color:#9b9;border:1px dashed rgba(255,255,255,.16);border-radius:6px;padding:8px;font-size:12px;cursor:pointer;margin-top:2px';add.onclick=()=>{arr.push(cols.map(()=>''));commit();draw();};box.appendChild(add);}draw();f.appendChild(box);}else{const ta=document.createElement('textarea');ta.value=slide().data[fl.key];ta.rows=(slide().data[fl.key]||'').includes('\\n')?4:1;ta.oninput=()=>{slide().data[fl.key]=ta.value;renderCard();renderDeck()};f.appendChild(ta);}});}
function selectTpl(t){slide().tplId=t.id;slide().data=defaults(t);slide().pos={};slide().el={};selBlock=-1;highlightTpl();buildSlideOpt();buildForm();renderCard();renderDeck();}
function buildThemes(){const s=document.getElementById('theme');Object.entries(THEMES).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v.name;s.appendChild(o)});s.value=slide().theme;s.onchange=()=>{slide().theme=s.value;renderCard();renderDeck()};}
function buildList(){const cats={};tplsOf(fmt).forEach(t=>{(cats[t.cat]=cats[t.cat]||[]).push(t)});const list=document.getElementById('list');list.innerHTML='';Object.entries(cats).forEach(([c,ts])=>{const h=document.createElement('h3');h.textContent=c;list.appendChild(h);ts.forEach(t=>{const b=document.createElement('button');b.className='tpl';b.dataset.id=t.id;b.textContent=NUMMAP[t.id];b.onclick=()=>selectTpl(t);list.appendChild(b)})})}
function buildIconGallery(){document.getElementById('icogrid').innerHTML=Object.keys(ICONS).map(n=>'<div class="ico" onclick="insertIcon(\\''+n+'\\')">'+icon(n,'#dddddd',38,1.6)+'<div class="nm">'+n+'</div></div>').join('')}
function toggleIcons(){const el=document.getElementById('icongallery');if(!el.classList.toggle('on'))iconTargetKey=null;}
function insertIcon(name){if(iconForFree){iconForFree=false;setFree('name',name);toggleIcons();return;}if(iconTargetKey){slide().data[iconTargetKey]=name;iconTargetKey=null;renderCard();renderDeck();buildForm();toggleIcons();return;}if(!lastField){alert('先に入力欄をクリック（カーソルを置く）してから、アイコンを選んでください');return;}const el=lastField;const a=el.selectionStart,b=el.selectionEnd;if(typeof a==='number'){el.value=el.value.slice(0,a)+name+el.value.slice(b);el.selectionStart=el.selectionEnd=a+name.length;}else{el.value+=name;}el.dispatchEvent(new Event('input',{bubbles:true}));toggleIcons();el.focus();}
document.addEventListener('focusin',e=>{if((e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT')&&e.target.closest('#fields'))lastField=e.target;});
function doPrint(){const pa=document.getElementById('printarea');pa.innerHTML=deck.map(()=>'<div class="pslide"></div>').join('');const ps=pa.querySelectorAll('.pslide');deck.forEach((s,i)=>paint(ps[i],s));setTimeout(function(){window.print()},80);}
function buildTplGallery(){const th=slide().theme;const PW=150,PH=Math.round(PW*CH/CW),sc=PW/CW;document.getElementById('galgrid').innerHTML=tplsOf(fmt).map(t=>{const h=getTpl(t.id).render(defaults(t),THEMES[th]);return '<div class="tcard" data-n="'+((NUMMAP[t.id]||'')+' '+t.name).toLowerCase()+'" onclick="pickTpl(\\''+t.id+'\\')"><div class="tprev" style="width:'+PW+'px;height:'+PH+'px"><div class="tw" style="width:'+CW+'px;height:'+CH+'px;transform:scale('+sc+')">'+h+'</div></div><div class="tname">'+NUMMAP[t.id]+'</div></div>';}).join('');}
function filterTpl(q){q=(q||'').toLowerCase();document.querySelectorAll('#galgrid .tcard').forEach(c=>{c.style.display=c.dataset.n.indexOf(q)>=0?'':'none';});}
function pickTpl(id){const t=getTpl(id);slide().tplId=id;slide().data=defaults(t);slide().pos={};slide().el={};selBlock=-1;highlightTpl();buildSlideOpt();buildForm();renderCard();renderDeck();toggleGallery();}
function toggleGallery(){const el=document.getElementById('tplgallery');if(el.classList.toggle('on')){document.getElementById('galsearch').value='';buildTplGallery();}}
let pickSet=null;
function openPick(){pickSet=new Set([cur]);buildPickList();document.getElementById('pickbox').classList.add('on');}
function togglePick(){document.getElementById('pickbox').classList.remove('on');}
function buildPickList(){const wrap=document.getElementById('pklist');wrap.innerHTML='';const PW=84,PH=Math.round(PW*CH/CW),sc=PW/CW;deck.forEach(function(s,i){const it=document.createElement('div');it.className='pkitem'+(pickSet.has(i)?' sel':'');it.style.width=PW+'px';it.onclick=function(){if(pickSet.has(i))pickSet.delete(i);else pickSet.add(i);it.classList.toggle('sel');it.querySelector('.pkck').textContent=pickSet.has(i)?'✓':'';};it.innerHTML='<div class="pkno">'+(i+1)+'</div><div class="pkck">'+(pickSet.has(i)?'✓':'')+'</div><div class="pkprev" style="width:'+PW+'px;height:'+PH+'px"><div class="tw" style="width:'+CW+'px;height:'+CH+'px;transform:scale('+sc+')"></div></div>';paint(it.querySelector('.tw'),s,false);wrap.appendChild(it);});}
function pickAll(on){pickSet=on?new Set(deck.map(function(_,i){return i;})):new Set();buildPickList();}
function exportPicked(){const idxs=[...pickSet].sort(function(a,b){return a-b;});if(!idxs.length){alert('1枚以上選んでください。');return;}togglePick();exportPng(idxs);}
const PRESETS=[{name:'診断カルーセル',desc:'表紙→導入→診断グリッド→タイプ詳細×4→共通アドバイス→ロードマップ→保存',theme:'pastel',ids:['cover_target','intro_empathy','content_diag_grid','content_diag_detail','content_diag_detail','content_diag_detail','content_diag_detail','content_biglist','content_roadmap','cta_save']},{name:'ノウハウ◯選',desc:'表紙→導入→項目×5→まとめ→保存→フォロー',theme:'money',ids:['cover_nsen','intro_empathy','content_listitem','content_listitem','content_listitem','content_listitem','content_listitem','content_biglist','cta_save','cta_profile']},{name:'比較レビュー',desc:'表紙→導入→VS→スペック表→結果→比較→BA→引用→まとめ→保存',theme:'money',ids:['cover_target','intro_empathy','content_vs','content_spectable','content_hero','content_compare','content_ba','content_quote_dark','content_biglist','cta_save']},{name:'レシピ',desc:'写真表紙→導入→材料→手順写真×3→ポイント→引用→保存→要約保存',theme:'recipe',ids:['cover_photo_corner','intro_empathy','content_ingredients','content_photo_steps','content_photo_steps','content_photo_steps','content_biglist','content_quote_dark','cta_save','cta_recap_save']},{name:'美容PR(ゴールド)',desc:'袋文字表紙→導入→白帯→比較→顔図解→顔写真→BA→まとめ→引用→保存',theme:'beautypr',ids:['cover_outline','intro_empathy','content_gold_panels','content_compare','content_face','content_face_photo','content_ba','content_biglist','cta_quote','cta_save']}];
function buildPresets(){document.getElementById('preslist').innerHTML=PRESETS.map((p,i)=>'<div class="pitem" onclick="loadPreset('+i+')"><b>'+p.name+'</b>（'+p.ids.length+'枚）<br><span>'+p.desc+'</span></div>').join('');}
function loadPreset(i){const p=PRESETS[i];if(!confirm('「'+p.name+'」を読み込みます（今のデッキは置き換え）。よろしいですか?'))return;if(fmt!=='ig'){setFmt('ig');document.getElementById('fmtsel').value='ig';}deck=p.ids.map(id=>({tplId:id,theme:p.theme,data:defaults(getTpl(id))}));cur=0;refreshAll();togglePresets();}
function togglePresets(){const el=document.getElementById('presetbox');if(el.classList.toggle('on'))buildPresets();}
function buildFmtSel(){const s=document.getElementById('fmtsel');s.innerHTML='';Object.keys(FORMATS).forEach(function(k){const v=FORMATS[k];const o=document.createElement('option');o.value=k;o.textContent=v.name+'（'+v.w+'×'+v.h+'）';if(k===fmt)o.selected=true;s.appendChild(o);});}
buildFmtSel();updatePrintSize();buildThemes();buildList();buildIconGallery();highlightTpl();buildSlideOpt();buildForm();renderCard();renderDeck();fitScale();window.onresize=fitScale;document.addEventListener('keydown',nudge);
lastHist=JSON.stringify(deck);
document.addEventListener('keydown',function(e){const z=(e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z');const y=(e.ctrlKey||e.metaKey)&&(e.key==='y'||e.key==='Y');if(z&&e.shiftKey){e.preventDefault();redo();}else if(z){e.preventDefault();undo();}else if(y){e.preventDefault();redo();}});
document.addEventListener('keydown',function(e){if(!moveMode)return;if(e.key!=='Delete'&&e.key!=='Backspace')return;if(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))return;if(selFree<0&&selBlock<0)return;e.preventDefault();deleteSelected();});
</script></body></html>`;
fs.writeFileSync(APP,page);
console.log('APP ->',APP);
