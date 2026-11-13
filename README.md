# My Portfolio

## 現在のファイル構成

```text
.
├─ index.html
├─ .nojekyll
├─ common/
│  ├─ components/
│  │  ├─ header.html
│  │  └─ footer.html
│  ├─ css/
│  │  └─ base.css
│  └─ js/
│     └─ layout.js
├─ home/
│  ├─ index.html
│  ├─ style.css
│  └─ script.js
├─ about/
│  ├─ index.html
│  ├─ style.css
│  └─ script.js
├─ works/
│  ├─ index.html
│  ├─ style.css
│  └─ script.js
├─ contact/
│  ├─ index.html
│  ├─ style.css
│  └─ script.js
├─ gas/
│  ├─ Code.gs
│  └─ README.md
├─ README.md
└─ assets/
   └─ images/
      └─ works/
         └─ .gitkeep
```

## サイト全体構成

- Home（トップ）
- About
- Works
- Contact

共通要素（全ページ共通）

- ヘッダー（ロゴ/サイト名、グローバルナビ）
- フッター（著作権表記、SNS/外部リンク）
- モバイル対応ナビゲーション

## Aboutページ

掲載内容

- 自己紹介・経歴
- スキル一覧
- 得意な業種・制作スタイル

推奨セクション例

- プロフィール（名前、活動領域、簡単な紹介文）
- 経歴（時系列）
- スキル（言語/フレームワーク/デザインツール）
- 制作スタンス（得意ジャンル、価値提供できること）

## Worksページ（実績一覧）

各作品に含める項目

- スクリーンショット（PC・スマホ）
- 目的
- 使用技術
- 工夫したポイント
- サイトURL（公開している場合）

作品カードの推奨フォーマット

- タイトル
- サムネイル（PC/スマホ）
- 概要（1-2文）
- 技術タグ
- 詳細（目的、工夫）
- リンク（サイトURL/GitHub）

## Contactページ

掲載内容

- フォーム（Googleフォーム埋め込み）
- メールアドレス
- GitHubアカウント

推奨セクション例

- 問い合わせ導線（短い案内文）
- Googleフォーム埋め込み
- 直接連絡先（メール）
- GitHubリンク

## 次の実装ステップ

- Worksページのスクリーンショット差し替え（`assets/images/works/`）
- WorksページのサイトURLを実URLへ更新
- ContactページへGoogleフォームのiframeを埋め込み
- ContactページのメールアドレスとGitHubアカウントを実情報へ更新