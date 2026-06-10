# デザイン知識ベース（design_kb）

新アカ作成時に **「このジャンルなら、こういうデザイン/フォント/構成」を根拠つきで提案する**ための資産。
今後アカを増やすたびに、ここを引いて提案 → 描画する。

## 収録ファイル
| ファイル | 役割 |
|---|---|
| [universal_design_standard.md](universal_design_standard.md) | **汎用ベース**。ジャンル非依存の共通法則（全アカ継承）。可変はB層のみ |
| [genre_design_map.md](genre_design_map.md) | **核**。ジャンル→[構成/スタイル/フォント/参考]の対応表（可変レイヤー） |
| [thumbnail_hooks.md](thumbnail_hooks.md) | サムネ用フックコピー8型＋媒体別 |
| [style_presets.json](style_presets.json) | 検証済みスタイル7種（色・フォント）＝描画エンジンが読む本体 |
| [layout_patterns.md](layout_patterns.md) | 構成の型（cover/quote/tip/pair/cta・10枚構成） |
| [font_catalog.md](font_catalog.md) | 使えるフォント一覧＋npm導入＋ジャンル定石 |
| [reference_accounts.md](reference_accounts.md) | ジャンル別ベンチマークアカ |
| ../docs/design_rules.md | 汎用デザイン細則（配色75:20:5/余白3:7/1枚目コピー等） |

## 新アカで「デザイン提案」する手順
1. **ジャンル＋ターゲット**を確認（写真依存ジャンルなら警告）
2. genre_design_map で **候補スタイル/構成を2〜3案**に絞る
3. ターゲットの「保存したい瞬間」で **最終1案を推奨**（根拠を述べる）
4. reference_accounts を提示して**目線合わせ**
5. style_presets から色/フォントを当て、layout_patterns で構成を決定
6. アカの `design_system.md` に確定値を記録 → render系で描画 → 目視確認

## 検証ステータス（2026-06-04）
- スタイル7種＝実描画で品質確認済（calm/night/pastel/mono/brush/fresh/calm_green）
- レイアウト＝cover/quote/tip/pair/cta を実描画で確認
- 多テーマ汎用性＝お金/英語/仕事/健康の4テーマで品質維持を確認
- ✅ **エンジン汎用化済**：render_carousel.mjs が style_presets.json を読む。`--style <preset>` で切替・スライド型 cover/quote/tip/pair/cta 全対応＝**1エンジンで全ジャンル/全スタイル**
- 未整備：list・比較表・ranking など追加レイアウト（必要時に追加）
