# Tsukada Happy Wedding

結婚式のゲスト向け写真共有・メッセージアプリケーションです。
ゲスト同士で写真を共有し、新郎新婦へのお祝いメッセージを送ることができます。

## 機能
- **写真・動画の共有**: リアルタイムでタイムラインに投稿・表示されます。
- **お祝いメッセージ**: 写真なしでメッセージのみの投稿も可能です。
- **いいね機能**: 気に入った写真に「いいね」をつけることができます。
- **高速な表示と負荷分散**: バックグラウンドでの一括アップロード制御や、画像の事前読み込み（プリロード）により、大人数のゲストが同時にアクセスしてもサクサク動作します。
- **一括ダウンロード**: 投稿された写真をまとめてZIPでダウンロードできます。

## 技術スタック
### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (Icons)

### Backend
- Laravel 11
- PHP 8.2+
- SQLite (または MySQL)
- Intervention Image (画像のリサイズ・サムネイル生成)

## セットアップ手順

### フロントエンド
```bash
cd frontend
npm install
npm run dev
```

### バックエンド
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

## ライセンス
All rights reserved.
