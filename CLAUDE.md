# バズ型テンプレ集 — プロジェクト指示書（Claude用）

このフォルダ単体で完結する **「実在バズIG投稿の型をHTMLテンプレ化 → ブラウザで中身差し替え → PDF出力」** する型テンプレ集。
別チャットでもこのCLAUDE.mdを読めば続きを作れる。

## 🌐 公開状況（2026-06-10〜）
- **公開URL（誰でも利用可）**：https://buzz-template-kit.vercel.app
- **GitHub**：`github.com/chiiita/buzz-template-kit`（commit author＝`chiiita <61923324+chiiita@users.noreply.github.com>`固定）
- **デプロイ**：Vercel（`vercel.json`で静的配信・**ビルド不要でルート`index.html`を配信**）。**当環境はTLS遮断のためgit pushはユーザー端末で**（数学クエストと同方式）
- **更新フロー**：型追加→`node build_templates.mjs`で`index.html`再生成→ユーザーが `git add -A && git commit -m "add template" && git push`→**Vercel自動デプロイ**
- **現在の規模**：73型（表紙21／中身32／締め20）× 28テーマ

## スライド個別カスタム機能（2026-06-11 追加）
各スライドは `{tplId, theme, data}` に加え、任意で以下を持てる（後方互換・無ければテーマ標準）：
- `bg` … 背景上書き `{mode:'theme'|'fill'|'image', fill:'#hex', image:dataURL, overlay:'none'|'white'|'black', opacity:0-90, fit:'cover'}`。**テンプレ無改修で実現**＝レンダ後に `applyBg(root,s)` がルートdivの背景だけ差し替え（塗りつぶし色／画像＋白黒レイヤー）。カード・サムネ・PDFすべて同じ後処理で一貫
- `over` … フォント/カラー上書き `{head, body, ink, accent, sub}`。`eff(s)` が `render(data, eff(s))` の theme を差し替え（見出し/本文フォントを個別・文字色/アクセント/サブ色を個別）。フォント名は `FONTS`（標準/角ゴ/丸ゴ/明朝/インパクト/手書き）
- `pos` … 要素ドラッグの位置オフセット `{ブロックindex:[dx,dy]}`。**ドラッグ単位＝ルート直下の子要素**（wrapの直下ブロック＝見出し/本文/表）。`applyPos` が `style.translate` で適用＝PDFにも反映。「✋移動」ボタンでmoveModeトグル→ドラッグ＋矢印キー微調整（Shiftで大）。型変更時は `pos` クリア
- UIは `#slideopt` パネル（`buildSlideOpt()`）。これら app側関数は render非依存なのでブラウザ埋込のみ（satoriバッチ/QAには無関係）

### ミニエディタ機能（2026-06-11 第2弾で拡張）
`{tplId,theme,data,bg,over,pos}` に加え：`el`（要素別スタイル `{idx:{sc,bold,al,box,hide}}`）／`free`（自由レイヤー配列 `[{type:text|image|shape|icon,x,y,...}]`）。ロゴは**デッキ横断**で `localStorage 'buzzlogo'`、ブランドカラーは `'buzzbrand'`。
- **#1 文字サイズ/太字** `el[idx].sc/bold`・**#4 表示/非表示** `hide`（live時は半透明・出力時display:none）・**#5 整列** `al`(alignSelf)・**#8 枠影** `box`：`applyEl(root,s,live)` が `style.scale/translate/alignSelf` 等で適用
- **#2 スナップ**：ドラッグ中 `computeSnap`（中央540/675・セーフ枠100/980/150/1190に±12pxで吸着）＋`showGuide` 青ガイド線
- **#3 Undo/Redo**：`save()`→`scheduleHist`（450msデバウンス）でスナップショット。Ctrl+Z/Y・↶↷ボタン
- **#6 グラデ背景** `bg.mode='grad'`(fill/fill2/angle)・**#7 画像位置** `bg.pos/fit`（9分割位置＋cover/contain）
- **#9 ブランドカラー** `brand[]`＝各カラー欄に＋保存＆スウォッチ・**#10 一括** `applyBgAll/applyStyleAll`・**#11 PNG書出** `exportPng`（CDNの`html-to-image`を動的import・1080×1350）
- **#13 はみ出し警告** `checkOverflow`（root.scrollHeight>clientHeight）→`#ovwarn`
- **#14 ロゴ/透かし** `logo`(text/image/pos/color/size/opacity)＝`applyOverlay`で全スライドに付与・**#15/#16 自由レイヤー＋アイコン/絵文字** `s.free`＝`freeHtml`描画＋`enableFreeDrag`。`applyOverlay`はテンプレ無改修でルートに後付け、`enableDrag`は`.freeel/.logoel`をスキップしブロックindex整合を保つ
- 未実装（保留）：#12 テキスト一括置換

## 何ができるか（1ソース → 2出力）
- **核**＝`build_templates.mjs`：全テンプレ（純関数 `render(data,theme)=>HTML文字列`）を定義
- **出力①ブラウザアプリ**：ルート`index.html`（自己完結・型選択＋中身入力＋デッキ＋PDF保存）。**これが公開配信される本体**
- **出力②satoriバッチ**：`node build_templates.mjs --deck deck.json out.pdf` で**データ→完成カルーセルPDF**（ブラウザ不要・Claudeが量産可）
- **出力③QA画像**：`dist/QA/*.png`（各型をsatoriで描画＝渡す前に目視検証できる）

## コマンド
```bash
npm install                                   # 初回のみ（依存取得）
node build_templates.mjs                      # ①アプリ(ルートindex.html) ②QA画像(dist/QA) を生成
node build_templates.mjs --deck deck.json out.pdf [--png]   # ②カルーセルPDF（--pngでスライドPNGも）
node pinterest_collect.mjs "検索語" 出力dir 枚数            # 参考画像をPinterestから収集
node images_to_pdf.mjs <画像dir> <out.pdf>                  # PNG群→PDF
```
**配信本体＝ルート`index.html`**（公開される）／QA画像＝`dist/QA/`。

## ファイル構成
- `build_templates.mjs` … 核（テンプレ定義＋アプリ生成＋satoriバッチ＋QA）
- `pinterest_collect.mjs` … リサーチ収集（**プロキシ経由必須**＝下記）
- `images_to_pdf.mjs` … PNG→PDF
- `design_kb/` … 型カタログ・リサーチ素材（`buzz_kata_catalog_v2_*.md`が最新の型台帳／`references/`に収集画像）
- `samples/` … deck.json見本（`demo_shindan.json`＝診断カルーセル7枚）
- `dist/` … 出力（buzz_templates.html／QA／PDF）

## 現在の規模
**73型（表紙21／中身32／締め20）× 28テーマ**。型番号はアプリ左リストで A/B/C＋連番に自動表示。

## ★型を1つ追加する手順
1. （推奨）`pinterest_collect.mjs`で参考画像収集 → 構造を`design_kb`の台帳に追記
2. `build_templates.mjs`の`TEMPLATES`配列に1要素追加：
   ```js
   { id:'content_xxx', name:'○○（中身）', cat:'中身',  // cat='表紙'|'中身'|'締め'
     fields:[{key:'title',label:'タイトル（改行で折る）',def:'...'},
             {key:'items',label:'項目',type:'rows',cols:['見出し','説明'],def:'a｜b\nc｜d'}],
     render:(d,t)=>wrap({bg:t.bg,color:t.ink,font:t.body,align:'stretch'},`
       <div style="display:flex;flex-direction:column;...">${nl(d.title)}</div>
       ...`) },
   ```
3. `node build_templates.mjs` → `dist/QA/content_xxx.png` を**目視確認**（崩れ/はみ出し）
4. テーマ別の見え方は `--deck` で確認

### フィールド型（フォームの入力UI）
- 無指定＝テキストエリア（文章。`nl(d.x)`で「改行した位置だけ折る」）
- `type:'rows', cols:[...]` … 項目ごとの個別ボックス＋行追加/削除（区切りは全角`｜`）
- `type:'select', options:[...]` … ドロップダウン
- `type:'file'` … 画像アップ（`d.x`にdataURL→`background-image`や`<img>`）
- `type:'icon'` … アイコンピッカー（lucide名をセット）

### 共通ヘルパー（renderで使える）
- `wrap({bg,color,font,align},inner)` … セーフゾーン枠（上150/左右100/下160・縦中央）＋奥行きグラデ
- `nl(s)` … 改行で折る（`\n`位置だけ。文章スロットに）
- `icon(name,color,px,sw)` … lucideアイコン（base64 SVG img）。`ICON_NAMES`に名前追加で増やせる
- `outline(stroke,drop)` … 袋文字（金フチ等）のtext-shadow
- `markerBg(color)` / 蛍光帯は`linear-gradient`、`faceSVG(cf,cc,cj,variant)` … 顔図解
- テーマトークン `t.bg/ink/sub/line/accent/accentDeep/onAccent/panel/panelSoft/head/body/display/darkBg/darkInk/darkAccent/darkSub`

## ★satoriの制約（ハマりどころ・必読）
- **複数child divには必ず`display:flex`**（無いとエラー）
- **flexルート直下に`position:absolute`子が複数あると落ちる** → 写真は`background-image`+グラデscrimで回避
- **`border-style`は`solid`/`dashed`のみ**（`dotted`不可）
- **SVG内`<text>`は描画されない**（resvg）→ 図解の文字はHTML側で。顔図解は図形のみSVG＋%はHTMLリスト
- フォントに**✓(U+2713)/✕(U+2715)が無く豆腐化** → `icon('check')/icon('x')`で代替（◯/①②▼↓→/↑はOK）
- **効く表現**：textShadow（3D文字）/transform:rotate（付箋）/box-shadow/Yomogi手書き/Shippori明朝/縦書き=1字ずつdiv縦積み（writing-modeは不可）
- renderで使う定数/関数は**ブラウザ側にも埋込が必要**（`const X=${X.toString()}`の行に追加。忘れるとプレビュー真っ黒）

## リサーチ（Pinterest収集）
当環境のnode fetchは直接DNS不可 → **プロキシ経由必須**（`pinterest_collect.mjs`に実装済：`setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY))`）。
`node pinterest_collect.mjs "インスタ ○○ デザイン" design_kb/references/NN_xxx 8`

## ブラウザでのPDF保存（ユーザー操作）
印刷→送信先「PDFに保存」/サイズ**1080×1350**/**余白なし**/**背景のグラフィックON**。HTML→PDFのブラウザ経路はサンドボックス内では不可だが**ユーザーのブラウザなら可**。

## 「誰でも利用」＝ホスティング（公開済み）
ルート`index.html`は完全自己完結（フォントはGoogle Fonts CDN・JS/アイコン内蔵）。**Vercelで公開済み＝https://buzz-template-kit.vercel.app** 。型追加後はユーザーが`git push`すれば自動更新。

## 型追加の標準フロー（スキル `buzz-template-add` と連動）
1. **ヒアリング**：参考画像／カテゴリ（表紙中身締め）／用途／テーマを確認
2. （任意）`pinterest_collect.mjs`で参考収集→`design_kb`に構造メモ
3. 参考画像を**目視**→構造分解（レイアウト/配色/階層/装飾）
4. `build_templates.mjs`の`TEMPLATES`に1要素追加（上記パターン）
5. `node build_templates.mjs`→`dist/QA/<id>.png`で**目視確認**（崩れ/はみ出し/薬機法語）
6. ユーザーに提示→OKなら更新コマンド案内：`git add -A && git commit -m "add template" && git push`
