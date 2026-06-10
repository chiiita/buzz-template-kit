# バズ型テンプレ集

実在のバズInstagram投稿の「型」をHTMLで再現し、**中身を差し替えてPDFで保存**できる型テンプレ集。
**73型 × 28テーマ**（表紙21／中身32／締め20）。

## いちばん簡単な使い方（アプリを開くだけ）
`dist/buzz_templates.html` をブラウザ（Chrome推奨）で開く。
```bash
open -a "Google Chrome" dist/buzz_templates.html
```

### カルーセルを作る流れ
1. **構成ボタン** → 「診断」「ノウハウ◯選」等のプリセット（10枚）を読み込む（ゼロから組んでもOK）
2. **左でテーマを選ぶ**（色・フォント）＋ **▦型ギャラリー**で型を選ぶ（検索可）
3. **右で中身を入力**（文章／項目ボックス／アイコン選択／写真アップ）→ 中央プレビューに即反映
4. **下のデッキ帯**で ＋追加／複製／◀▶並べ替え（自動保存）
5. **「デッキをPDF保存」** → 印刷画面で「PDFに保存」/1080×1350/余白なし/背景グラフィックON
6. PDFを画像に書き出して投稿

## 他者に配る・公開する
`dist/buzz_templates.html` は1ファイル完結（フォント・JS・アイコン内蔵）。
- ファイルを渡すだけで誰でもブラウザで使える
- GitHub Pages / Vercel 等に置けばURLで共有可

## 開発（型を増やす・再ビルド）
```bash
npm install                  # 初回のみ
node build_templates.mjs     # dist/ を再生成
```
型の追加方法・技術メモは **CLAUDE.md** 参照（Claudeに「CLAUDE.md読んで型を追加して」と頼めばOK）。

## フォルダ
| | |
|---|---|
| `build_templates.mjs` | 核（全テンプレ定義＋アプリ生成） |
| `pinterest_collect.mjs` | 参考画像リサーチ収集 |
| `design_kb/` | 型カタログ・リサーチ素材 |
| `samples/` | deck.json見本 |
| `dist/` | 出力（アプリHTML・QA画像・PDF） |
