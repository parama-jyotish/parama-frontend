# CLAUDE_parama.md — parama-frontend 固有設計書

PARAMA フロントエンド（Next.js / Vercel）のリポジトリ固有ルール。
全体行動原則・PARAMA共通原則は `CLAUDE.md` 参照。このファイルは parama-frontend だけに該当する事項のみを扱う。

---

## プロジェクト概要

Next.js / Vercel ベースのフロントエンド。**モバイルファースト（375px 基準）。デスクトップレイアウトは作らない。**

## Next.js について（最重要・必読）

**This is NOT the Next.js you know.**

このプロジェクトは Next.js の比較的新しいバージョンを使用しており、API・規約・ファイル構造が学習データの Next.js と異なる場合がある。breaking changes が複数入っている。

コードを書く前に：

- `node_modules/next/dist/docs/` 内の該当ガイドを必ず読むこと。
- deprecation 警告には従うこと（無視しない）。
- 「以前の Next.js ではこう書いた」を持ち込まない。現バージョンのドキュメントが唯一の正解。

これを怠ると、動くように見えて将来壊れるコード、または現バージョンで非推奨の API を使ったコードが入る。

## 設計仕様への参照

コード変更・UI 変更を行う前に、以下を確認すること：

- `DESIGN.md` — デザイン定数（フォント、カラー、トークン、レイアウトルール）の根拠
- `PARAMA_frontend_実装指示.md` — フロントエンド実装仕様

両ファイルは設計の constitution。CLAUDE.md Part 3 の「計算系固定設定」と同様に、提案で書き換えず、依頼者の判断を仰ぐ。
