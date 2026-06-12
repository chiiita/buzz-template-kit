#!/usr/bin/env bash
# バズ型テンプレ集 デプロイスクリプト
# どのターミナル・どの作業ディレクトリからでも実行可。
#   使い方:  bash "/Volumes/CIRAGO/クラウドコード/バズ型テンプレ集/deploy.sh"
#   または:  ./deploy.sh "コミットメッセージ(任意)"
# やること: ①プロジェクトへ移動 ②ビルド ③git add/commit(author=chiiita固定) ④push → Vercel自動デプロイ
set -euo pipefail

# ---- ① プロジェクトの場所を確定（呼び出し位置に依存しない）----
# スクリプト自身の置き場所を基準にする。失敗時は絶対パスにフォールバック。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" >/dev/null 2>&1 && pwd)"
PROJECT_DIR="${SCRIPT_DIR:-/Volumes/CIRAGO/クラウドコード/バズ型テンプレ集}"
cd "$PROJECT_DIR" || { echo "❌ プロジェクトフォルダが見つかりません: $PROJECT_DIR"; exit 1; }
echo "📂 $PROJECT_DIR"

# ---- author/committer を chiiita に強制（このマシンのgit設定に依存しない）----
export GIT_AUTHOR_NAME="chiiita"
export GIT_AUTHOR_EMAIL="61923324+chiiita@users.noreply.github.com"
export GIT_COMMITTER_NAME="chiiita"
export GIT_COMMITTER_EMAIL="61923324+chiiita@users.noreply.github.com"

# ---- ② ビルド（依存が無ければ先にinstall）----
if [ ! -d node_modules ]; then
  echo "📦 npm install ..."
  npm install
fi
echo "🔨 ビルド中 (node build_templates.mjs) ..."
node build_templates.mjs >/dev/null
echo "✅ ビルド完了"

# ---- ③ コミット（変更が無ければスキップ）----
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  変更なし → コミットをスキップ"
else
  MSG="${1:-update templates $(date '+%Y-%m-%d %H:%M')}"
  git commit -m "$MSG" >/dev/null
  echo "📝 コミット: $MSG"
fi

# ---- ④ push（main → Vercel自動デプロイ）----
echo "🚀 push 中 ..."
git push origin main
echo ""
echo "🎉 デプロイ送信完了！ 1〜2分で反映 → https://buzz-template-kit.vercel.app"
