# バズ型テンプレ集 — プロジェクト指示書（Claude用）

このフォルダ単体で完結する **「実在バズIG投稿の型をHTMLテンプレ化 → ブラウザで中身差し替え → PDF出力」** する型テンプレ集。
別チャットでもこのCLAUDE.mdを読めば続きを作れる。

## 何ができるか（1ソース → 2出力）
- **核**＝`build_templates.mjs`：全テンプレ（純関数 `render(data,theme)=>HTML文字列`）を定義
- **出力①ブラウザアプリ**：`dist/buzz_templates.html`（自己完結・型選択＋中身入力＋デッキ＋PDF保存）。**誰でもブラウザで使える/ホスト可**
- **出力②satoriバッチ**：`node build_templates.mjs --deck deck.json out.pdf` で**データ→完成カルーセルPDF**（ブラウザ不要・Claudeが量産可）
- **出力③QA画像**：`dist/QA/*.png`（各型をsatoriで描画＝渡す前に目視検証できる）

## コマンド
```bash
npm install                                   # 初回のみ（依存取得）
node build_templates.mjs                      # ①アプリ ②QA画像 を生成（dist/へ）
node build_templates.mjs --deck deck.json out.pdf [--png]   # ②カルーセルPDF（--pngでスライドPNGも）
node pinterest_collect.mjs "検索語" 出力dir 枚数            # 参考画像をPinterestから収集
node images_to_pdf.mjs <画像dir> <out.pdf>                  # PNG群→PDF
```
出力先は既定 `./dist/`（環境変数 `OUT_DIR` で変更可）。

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

## 「誰でも利用」＝ホスティング
`dist/buzz_templates.html`は完全自己完結（フォントはGoogle Fonts CDN・JS/アイコン内蔵）。**そのままGitHub Pages / Vercel / ファイル配布で共有可**。
