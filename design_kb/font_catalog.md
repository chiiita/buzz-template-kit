# フォントカタログ（使えるフォント一覧）

> この環境は **npmのみ可**（pip/curl/ブラウザ不可）。フォントは `@expo-google-fonts/*`（完全TTF同梱）で入手。
> 導入: `cd _common/pipeline && npm install @expo-google-fonts/<pkg>`。fontsourceはwoff且つサブセット分割でresvg不向き＝使わない。

## 導入済み（render系が参照）
| family名 | カテゴリ | 雰囲気 | npm pkg | ウェイト |
|---|---|---|---|---|
| Shippori Mincho | 明朝 | 情緒・言葉の重み・上品 | shippori-mincho | 400/500/600/700/800 |
| Zen Maru Gothic | 丸ゴシック | やわらか・親しみ・女性/子ども | zen-maru-gothic | 300/400/500/700/900 |
| Zen Kaku Gothic New | 角ゴシック | モダン・クリーン・可読 | zen-kaku-gothic-new | 300/400/500/700/900 |
| Yuji Syuku | 筆/楷書 | 和・力強い・人生訓 | yuji-syuku | 400 |
| Yomogi | 手書き | カジュアル・温かみ | yomogi | 400 |

## ジャンル別の定石（[[genre_design_map]] と対応）
- 名言/心理/健康 → **明朝**（情緒）
- お金/仕事/英語/言い換え → **角ゴシック**（信頼・可読）
- 女性/子育て/かわいい → **丸ゴシック**（やわらか）
- 人生訓/和風 → **筆**
- 料理/カジュアル → **手書き**

## 追加候補（必要時 npm install）
- Klee One（楷書系手書き）/ Yuji Boku（筆）/ Kaisei Decol（やわ明朝）/ Murecho（モダン角ゴ）/ DotGothic16（ドット・レトロ）

## 注意
- resvgは **font family名で解決**。SVG内の font-family は上表の family名と一致させる。
- 太さは format で出せるが **family変更はフォント追加が必要**（Canva MCPと違いコードなら自由）。
