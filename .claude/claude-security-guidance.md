# PARAMA Frontend セキュリティルール（Next.js + React）

このファイルは Claude Code の security-guidance プラグインがレビュー時に読み込む、
PARAMA フロントエンド固有の脅威モデルとレビュー観点です。
配置場所: リポジトリ直下の `.claude/claude-security-guidance.md`

---

## 1. XSS / DOM インジェクション

- `dangerouslySetInnerHTML` の使用は原則禁止。やむを得ず使う場合は、
  サニタイズ（DOMPurify 等）を経たコンテンツに限定する。未サニタイズは指摘対象。
- `element.innerHTML =` / `document.write` による DOM への直接書き込みを避ける。
- LLM が生成したリーディング本文を画面表示する際、
  Markdown→HTML 変換を挟むなら、許可タグの制限とサニタイズを確認する。

## 2. シークレット・環境変数

- Claude / OpenAI の APIキーやバックエンドの秘密値を、
  クライアントバンドルに含めない。`NEXT_PUBLIC_` 接頭辞のついた環境変数に
  シークレットを入れていないか確認する（ビルドに焼き込まれて漏洩する）。
- APIキーが必要な処理は必ずサーバー側（Route Handler / Server Action）で行う。

## 3. API 連携 / SSE（EventSource）

- バックエンド（FastAPI）への通信は、想定したオリジン・エンドポイントのみに限定する。
- EventSource で受け取ったデータを、サニタイズせず DOM に流し込まない。
- 認証トークンを localStorage に保存する実装は XSS 時の漏洩リスクとして指摘する。
  可能なら HttpOnly Cookie を検討。

## 4. 入力・リダイレクト・ナビゲーション

- ユーザー入力由来の値を `href` / `window.location` / `router.push` に
  そのまま渡すオープンリダイレクトを指摘する。
- フォーム入力（出生情報など）はクライアント検証だけに頼らず、
  サーバー側でも必ず検証される前提でレビューする。

## 5. 個人情報（PII）の扱い

- 出生情報（生年月日・出生時刻・出生地）やメールアドレスを、
  console.log やエラー画面、クライアント側ログに出力しない。
- 機微情報を URL クエリパラメータに載せない（履歴・リファラ経由で漏れる）。

## 6. 危険な構文

- `eval()` / `new Function()` による動的コード実行を使わない。
- `child_process.exec` など、サーバー側でユーザー入力を
  未サニタイズのままシェルに渡す箇所はコマンドインジェクションとして指摘する。
