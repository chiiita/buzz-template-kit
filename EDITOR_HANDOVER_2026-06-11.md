# バズ型テンプレ集 — エディタ大改修 引き継ぎ書（2026-06-11）

別チャットでも続きを進められるよう、2026-06-11に実装した「ブラウザ・エディタ機能一式」を詳細に記録する。
**まず `CLAUDE.md` を読む → 次に本書 → 実装は `build_templates.mjs` のみ**（`index.html` は生成物。手で触らない）。

---

## 0. 大原則（絶対に守る）

- **編集対象は `build_templates.mjs` だけ。** `index.html` は `node build_templates.mjs` の生成物。直接編集しても次のビルドで消える。
- アプリのJS／CSS／HTMLは `build_templates.mjs` 末尾の **`const page = \`...\``（バッククォートのテンプレートリテラル）の中**に文字列として入っている。
  - **`${...}` はビルド時にNodeが評価する**ので、アプリ側に渡したい `${x}` は書かない（既存の `${NOISE_B64}` 等は意図的なもの）。
  - **`\n` はビルド時に本物の改行になる**。アプリ側の文字列リテラル内で改行文字が欲しい時は **`\\n`** と書く（例：`confirm('...\\n...')`）。1度これで `confirm` がパースエラーになった。
  - アプリ側で `'...'` 内にシングルクォートを埋めたい時（onclick属性など）は **`\\'`** と書く（既存の `onclick="setBgMode(\\'theme\\')"` 方式に倣う）。
- **renderで使う定数/関数はブラウザ側にも `const X=${X.toString()}` で埋め込み必須**（CLAUDE.md参照）。今回追加したエディタ系関数は render非依存なので `<script>` 内に直書きでOK。
- **TLS遮断のため当環境から `git push` 不可** → 毎回ユーザー端末で push してもらう。Vercel自動デプロイ。commit author は `chiiita <61923324+chiiita@users.noreply.github.com>` 固定。

## 1. ビルド & 検証コマンド（毎回これで確認）

```bash
cd /Volumes/CIRAGO/クラウドコード/バズ型テンプレ集
node build_templates.mjs                 # index.html と dist/QA/*.png を再生成
# JS構文チェック（生成物のscriptをnew Functionでパース）
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const m=h.match(/<script>([\s\S]*)<\/script>/);try{new Function(m[1]);console.log('OK')}catch(e){console.log('NG',e.message)}"
```

**実ブラウザ挙動の検証（移動/選択/削除など）には linkedom を使う**（当環境はブラウザ不可）。`npm install --no-save linkedom` 済み。手順は本書末尾「検証スニペット」。

> 注意：zshが `!` を勝手にエスケープするため、検証スクリプトでは `!`（`!!`/`!==`）を避け `Boolean()`/`=== false` を使う。Bashの cwd はコマンドごとにリセットされるので、各 `node` 実行は先頭に `cd .../バズ型テンプレ集 &&` を付ける。

## 2. アーキテクチャ（無改修でテンプレを拡張する仕組み）

- スライド1枚 = `{tplId, theme, data}` に、任意で `bg / over / pos / el / free` が付く（後方互換・無ければ素のテンプレ表示）。
- 描画は `paint(el, s, live)`：
  1. `el.innerHTML = slideHtml(s)`（= `getTpl(tplId).render(data, eff(s))`）
  2. `applyBg(root, s)` … ルートdivの背景だけ上書き（塗り/グラデ/画像＋白黒オーバーレイ）
  3. `applyEl(root, s, live)` … ルート直下の子（=ブロック）ごとに transform(移動/拡大)・太字・整列・枠影・非表示
  4. `applyOverlay(root, s, live)` … 自由レイヤー(`free`)＋ロゴを後付け（`insertAdjacentHTML`）
- **これにより73型のテンプレ定義（TEMPLATES配列）は一切触らずに、全機能が乗る。**
- カード/サムネ/PDF/PNGすべて同じ `paint` を通すので見た目が一貫する。
- `eff(s)` … `THEMES[s.theme]` を複製し `over`（フォント/色）を差し替えた「実効テーマ」を返す。`render` に渡すのはこれ。

### データモデル詳細
```
slide = {
  tplId, theme, data,                       // 基本（従来通り）
  bg:   { mode:'theme'|'fill'|'grad'|'image',
          fill:'#hex', fill2:'#hex', angle:0-360,        // grad
          image:dataURL, overlay:'none'|'white'|'black', opacity:0-90,
          fit:'cover'|'contain', pos:'center'等9種 },    // image
  over: { head, body, ink, accent, sub },   // フォント名 or #hex（'標準'/''で解除）
  pos:  { [blockIdx]: [dx,dy] },             // ブロック移動オフセット
  el:   { [blockIdx]: { sc, bold, al, box, hide } },     // ブロック別スタイル
  free: [ { type:'text'|'image'|'shape'|'icon', x, y, ...型別 } ]  // 自由レイヤー
}
// デッキ横断（localStorage）:
//   buzzdeck  … デッキ全体（自動保存）
//   buzzlogo  … 全スライド共通ロゴ/透かし {text,image,pos,color,size,opacity}
//   buzzbrand … 保存ブランドカラー（hex配列・最大12）
```
- `free.text`  = `{type:'text', x,y, text, size, color, font, weight, w}`
- `free.image` = `{type:'image', x,y, src(dataURL), w, h, radius}`
- `free.shape` = `{type:'shape', x,y, shape:'rect'|'circle'|'line', w, h, color, radius}`
- `free.icon`  = `{type:'icon', x,y, name(lucide), size, color}`（絵文字は free.text に直接入力）

## 3. 実装した機能（2026-06-11・全部入り）

### A. 背景（slideopt「背景」セクション）
- 標準 / 塗り / グラデ / 画像 をセグメントで切替（`setBgMode`）。
- 塗り：カラーピッカー＋テーマ由来スウォッチ＋ブランド色。
- グラデ：色1/色2/角度（`setGrad`）。
- 画像：アップ（`setBgImage`）／表示方法 cover・contain（`setFit`）／位置9分割（`setImgPos`）／上に白黒レイヤー＋濃さ（`setOverlay`/`setOpacity`）。
- 「この背景を全スライドへ」＝`applyBgAll`。
- 描画は `applyBg` がルートdivの `style.background` を直接上書き。

### B. フォント・カラー（slideopt「フォント」「文字カラー」）
- 見出し/本文フォントを個別（`setOver('head'|'body', …)`）。`FONTS`＝標準/角ゴシック/丸ゴシック/明朝/インパクト/手書き。
- 文字色 / アクセント / サブ文字を個別（`setOver('ink'|'accent'|'sub', …)`）。各「標準に戻す」付き。
- 「フォント・色を全スライドへ」＝`applyStyleAll`。
- **ブランドカラー**：各カラー欄の「＋」で `addBrand`、スウォッチ再利用は `applyColor`/`setFree`、全消去 `clearBrand`。`brandRow`(テーマ/背景/文字色用)・`brandRow2`(自由要素用)。

### C. 編集モード（移動・選択・サイズ・削除）
- **画像の上の大トグル `#movebtn`（`toggleMove`）**でON/OFF。OFF=グレー🔒、ON=緑✋＋操作ガイド（`#movestate`/`#movesub`）。
- ブロック（=ルート直下の子）を `enableDrag` でドラッグ可能化。`.freeel`/`.logoel` はスキップしてブロックindexの整合を保つ。
- **移動**：ドラッグで `pos[idx]=[dx,dy]`。矢印キー微調整（`nudge`、Shiftで大）。**スナップ**＝`computeSnap`（中央540/675・セーフ枠100/980/150/1190 に±12px吸着）＋`showGuide`青ガイド線。
- **選択中要素のフロート操作子**（`positionDelBtn` が両方を要素角に追従配置）：
  - 右上 赤 `#delbtn` ✕ … 削除（`deleteSelected`）。Delete/Backspaceキーでも可。
  - 右下 青 `#szbtn` ⤡ … ドラッグでサイズ変更（`startResize`、`resizing`フラグ中はフロート子を隠す）。
- **削除の意味**：自由要素=配列から除去（`delFree`）／テンプレのブロック=`el[idx].hide=true`（移動モード中は半透明で再選択可）。
- **サイズ変更**：ブロック=`el[idx].sc`（scale、`transformOrigin:top left`）／free text・icon=`size`／free image・shape=`w(/h)`。
- パネル側にも要素ツールバー（選択時）：文字サイズ −/＋（`elBump`）・太字/枠/非表示（`elToggle`）・整列（`elAlign`）・要素リセット（`elReset`）。
- **スライド全体リセット**＝`resetPos`（配置のみ）。

### D. 自由レイヤー & ロゴ
- ＋文字/＋画像/＋図形/＋アイコン（`addFree`/`addFreeImage`）。選択中編集は `setFree`/`setFreeUI`/`toggleFreeBold`/`freeBump`/`delFree`。アイコン変更は `iconForFree=true`→`toggleIcons`→`insertIcon` 経由。
- ドラッグは `enableFreeDrag`（`selFree` で選択、`x/y`更新）。スナップ・フロート操作子も共通。
- ロゴ/透かし＝全スライド共通（`setLogo`/`setLogoImage`/`clearLogo`、`logoHtml`、`applyOverlay`で付与）。

### E. 履歴（Undo/Redo）
- `save()` が `scheduleHist()`（450msデバウンス）で `deck` のJSONスナップショットを `undoStack` に積む。`undo`/`redo`、Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y、ツールバー「戻す」「やり直し」（`updateHistBtns` で無効状態切替）。

### F. 画像で保存（旧PDFボタンを置換）
- ツールバー上段 `#savebar`：**1枚保存 / 全部保存 / 選んで保存**（横3等分・`white-space:nowrap`で1行固定）。
- `exportPng(which)`：`which` は false(現在)/true(全部)/配列(指定)。
  - **html2canvas（CDN動的import `html2canvas@1.4.1/+esm`）** で 1080×1350・**scale:2（2160×2700）** で描画。`document.fonts.ready` 待ち。
  - **2枚以上は JSZip（`jszip@3.10.1/+esm`）でZIP化**して1ファイルDL（`slides_◯.zip`、`slide_01.png`〜）。1枚は直接PNG。ZIP失敗時は1枚ずつDLにフォールバック。
- **「選んで保存」モーダル** `#pickbox`（`openPick`/`togglePick`/`buildPickList`/`pickAll`/`exportPicked`）：サムネをクリックでトグル選択。
- PDFは小さな「PDF」セカンダリボタンとして残置（`doPrint`／@media print）。
- **はみ出し警告**＝`checkOverflow`（root.scrollHeight>clientHeight で `#ovwarn` 表示）。

### G. デザイン刷新（モダンUI）
- `:root` のCSS変数でデザイントークン化：`--bg:#0d0d11 --surface:#15151b --elev:#1d1d25 --hover:#2c2c37 --line/--line2(薄境界) --txt --muted --faint --ac:#F0463A(主アクセント) --acd --acsoft --ok:#1fb867(緑) --blue:#4f86ff(自由要素選択) --r/--rl(角丸) --sh(影)`。
- ゴーストボタン・セグメントコントロール（ピル型）・フォーカスリング・blurモーダル・カスタムスクロールバー・選択スウォッチ等で統一。
- アクセント赤は主役ボタンと選択状態のみに限定。緑=編集モードON、青=自由要素選択。

## 4. 既知の注意点・ハマりどころ

- **PNGが真っ黒になる問題は html-to-image が原因**（Safari系のforeignObject描画が空になる）。**html2canvas に変更して解決済み**。今後もブラウザ書き出しは html2canvas を使うこと。html-to-image に戻さない。
- html2canvas は **CSSの個別 `translate`/`scale` プロパティを解釈しない** → `applyEl` と移動ドラッグは **`transform`（`translate()`/`scale()`）に統一済み**。新たに位置/拡大をいじる時も `transform` を使う（個別プロパティに戻さない）。
- 書き出し・ブランド色・ZIPは **CDN動的import**＝ネット接続必須。オフラインは不可（その旨アラート）。
- ブロックの「ドラッグ単位」は**ルート直下の子**。テンプレが条件分岐で先頭ブロックを出し分けると index がずれて `pos/el` が別ブロックに当たることがある（既知の軽微な制約）。型変更時は `pos/el` をクリア（`selectTpl`/`pickTpl`）。
- `enableDrag` は `.freeel`/`.logoel` を必ずスキップ（ブロックindex整合のため）。
- 当環境のBashフックは `SNS事業部/_共通/スクリプト共有/precheck_gate.py` を参照。**外付け CIRAGO ドライブが外れると全ファイル操作とフックが失敗する** → ユーザーに再マウント依頼（今回1度発生）。

## 5. まだやってない/今後の候補
- **#12 テキスト一括置換**（唯一の未着手。同じ語句を全スライドで置換）。
- 画質/サイズ可変（scale切替）、ZIP名をアカウント名/日付に、グラデの方向プリセット、自由要素の回転、整列の等間隔配置、ガイドのスナップ強度調整 など。
- 既存の slideopt 内 PNG セクション（このスライド/全スライド）はツールバーと重複。整理してよい。

## 6. 主要関数マップ（`build_templates.mjs` 内 `<script>`）
描画: `paint / slideHtml / eff / applyBg / applyEl / applyOverlay / renderCard / renderDeck / refreshAll / fitScale`
編集モード: `toggleMove / enableDrag / enableFreeDrag / nudge / computeSnap / showGuide / clearGuide / cardCoords`
選択操作子: `selDomEl / positionDelBtn / hideDelBtn / deleteSelected / startResize`
要素: `elObj / elBump / elToggle / elAlign / elReset / freeArr / addFree / addFreeImage / setFree / setFreeUI / toggleFreeBold / freeBump / delFree`
背景: `setBgMode / setBgFill / setGrad / setFit / setImgPos / setBgImage / setOverlay / setOpacity`
色/フォント: `setOver / applyColor / addBrand / clearBrand / brandRow / brandRow2 / applyBgAll / applyStyleAll`
ロゴ: `setLogo / setLogoImage / clearLogo / logoHtml`
履歴: `save / scheduleHist / updateHistBtns / undo / redo`
書き出し: `exportPng / doPrint / openPick / togglePick / buildPickList / pickAll / exportPicked / checkOverflow`
UI生成: `buildSlideOpt / buildForm / buildList / buildThemes / buildTplGallery / buildPresets / buildPickList`
その他: `resetSlide / resetPos / goSlide / deckAct / selectTpl / pickTpl / newDeck / exportDeck / importDeck`

## 7. 検証スニペット（linkedom・実ブラウザ相当）
`_sim.mjs` をプロジェクト直下に置いて `node _sim.mjs`（終わったら削除）。`!` を使わないこと。
```js
import {parseHTML} from 'linkedom';import fs from 'fs';
const html=fs.readFileSync('index.html','utf8');const {window,document}=parseHTML(html);
window.btoa=s=>Buffer.from(s,'binary').toString('base64');
window.localStorage={_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=v},removeItem(k){delete this._s[k]}};
window.innerWidth=1600;window.innerHeight=900;
Object.getPrototypeOf(document.createElement('div')).getBoundingClientRect=function(){return{left:0,top:0,right:1080,bottom:1350,width:1080,height:1350}};
global.window=window;global.document=document;global.localStorage=window.localStorage;global.FileReader=class{readAsDataURL(){}readAsText(){}};global.Blob=class{};global.URL={createObjectURL:()=>''};global.confirm=()=>true;global.alert=m=>console.log('ALERT',m);global.btoa=window.btoa;
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
try{(0,eval)(code+'\nglobal.__t={toggleMove,get sb(){return selBlock}};');}catch(e){console.log('INIT ERROR:',e.message);process.exit(0);}
global.__t.toggleMove();
const r=document.getElementById('card').firstElementChild,b=r.children[0];
b.onmousedown({preventDefault(){},stopPropagation(){},clientX:500,clientY:500});
console.log('move+select OK:', global.__t.sb===0);
```

## 8. 反映フロー（毎回）
```bash
cd /Volumes/CIRAGO/クラウドコード/バズ型テンプレ集
node build_templates.mjs            # 再生成（Claudeが実行）
# ↓ユーザー端末で
git add -A && git commit -m "..." && git push   # Vercel自動デプロイ
# 確認は Cmd+Shift+R（強制リロード）。キャッシュ疑いはシークレットウィンドウ。
```
