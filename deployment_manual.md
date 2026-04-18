# Vercel デプロイ・運用マニュアル

このドキュメントでは、Node.js + Expressで構築した「AIおぢ」チャットボットをVercelに公開し、運用するための手順を解説します。

---

## 1. 事前準備
デプロイを開始する前に、以下の準備ができているか確認してください。
- [GitHub](https://github.com/) アカウントの作成
- [Vercel](https://vercel.com/) アカウントの作成（GitHub連携でログインを推奨）
- ターミナルで `git` コマンドが使えること

---

## 2. GitHubへのアップロード (Push)

コードの変更をGitHubに送信することで、Vercelがそれを検知して自動デプロイできるようになります。

### 初回設定（済んでいる場合は不要）
```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/neetonm4b-afk/ai-oji-chat.git
git push -u origin main
```

### 次回以降の更新時
コードを修正した後は、以下の3行を実行するだけでVercelが自動的に最新版に更新されます。
```powershell
git add .
git commit -m "修正内容のメモ"
git push origin main
```

---

## 3. Vercelへのデプロイ (CLI活用)

Web画面でボタンが見つからないなどのトラブルを避けるため、確実な **Vercel CLI** を使った方法を推奨します。

### 3-1. プロジェクトの紐付け (Link)
プロジェクトフォルダ内で以下を実行します。
```powershell
npx vercel link
```
- すべて **Enterキー** で進めます。

### 3-2. 環境変数の設定
APIキーをVercelに登録します。
```powershell
npx vercel env add ANTHROPIC_API_KEY
```
- **Value**: ClaudeのAPIキー（`sk-ant-...`）を貼り付けてEnter。
- **Mark as sensitive?**: **`y`** を選択。
- **Environments**: **`a`** を押したあと、**`Development` のチェックを外して** Enter。

### 3-3. 公開実行 (Deploy)
```powershell
npx vercel --prod
```

---

## 4. トラブルシューティング

### Q. 「接続に問題がある」と表示される
- Vercelの管理画面で、`ANTHROPIC_API_KEY` が正しく登録されているか再確認してください。

### Q. 変更が反映されない
- `git push origin main` を実行したか確認してください。

---

## 5. 運用のアドバイス
- **恒久的なナレッジ設定**:
    - **ブラウザ上の管理画面での保存**: Vercel上では `/tmp` フォルダに保存されるため、サーバーの再起動時にリセットされます（一時的なデバッグや更新には適しています）。
    - **永続的な保存**: ずっと覚えさせておきたい内容は、PC上の `knowledge_base.json` に直接書き込んでから `git push`（またはデプロイ実行）してください。これにより、ソースコードの一部として永続化されます。
    - **将来の改善**: 大規模な運用や頻繁な更新が必要な場合は、Vercel Blob や外部データベース（Supabase/MongoDB等）への移行を検討してください。
