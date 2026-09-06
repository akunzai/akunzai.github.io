---
title: "工欲善其事：現代 Git 必備全域配置與避坑指南"
description: 從 autocrlf、ignorecase 到 rerere 與 histogram diff，打造乾淨、高效且跨平台零地雷的 Git 工作環境。
sidebar:
  order: 3
---

在許多新人的觀念中，安裝完 Git 之後只需要做兩件事：
```bash
git config --global user.name "Your Name"
git config --global user.email "user@example.com"
```
然後就直接開始 `git add .` 與 `git commit`。

然而，Git 誕生於 Linux 核心開發社群，許多歷史預設值建立在二十多年前的背景下。若沒有妥善配置，在現代團隊協作中很快就會遭遇：**Windows 與 macOS 開發者互相污染換行符號、檔名大小寫修改在 CI 上炸裂、頻繁 rebase 導致重複解衝突、以及模糊不清的 diff 比對**。

本篇將帶你逐一盤點並配置現代 Git 的關鍵參數，將這些協作隱患在第一天就徹底消除。

---

## 1. 跨平台防禦：換行符號與大小寫敏感度

團隊中最普遍也最惱人的問題，往往來自「有人用 macOS，有人用 Windows」。

### 換行符號地雷：LF vs. CRLF
- **Unix / macOS / Linux**：使用 `LF`（`\n`）。
- **Windows**：預設使用 `CRLF`（`\r\n`）。

如果你曾在團隊中看過有人「只改了一個變數名稱，送出 Pull Request 時卻驚悚地顯示 `+50,214 -50,214` 行，GitHub 網頁直接轉圈卡死」——恭喜你，你見證了軟體工程界的經典慘案：**跨平台換行大屠殺**。

程式碼本身一個字沒變，但 Windows 編輯器默默幫整份檔案的所有行尾補上了 `\r`，讓整個 Review 介面瞬間報廢，也讓 Reviewer 當場血壓飆升。

#### 最佳配置方案

- **macOS / Linux 開發者**：
  ```bash
  git config --global core.autocrlf input
  git config --global core.safecrlf true
  ```
  `autocrlf = input` 表示：簽出（Checkout）時維持檔案原始換行符號不變，但簽入（Commit）時強制將 CRLF 轉換為 LF，確保儲存庫內始終保持純淨的 LF。

- **Windows 開發者**：
  ```bash
  git config --global core.autocrlf true
  git config --global core.safecrlf true
  ```
  `autocrlf = true` 表示：簽出時轉為 Windows 原生的 CRLF 以便編輯器解析，簽入時自動轉換回 LF。

- **`safecrlf = true` 防護網**：
  不允許簽入混合換行符號（不可逆轉換）的檔案，防止檔案損毀。

> 💡 **專案層級最佳保險：`.gitattributes`**  
> 除了本機全域設定外，團隊應在專案根目錄建立 `.gitattributes`，強制所有人遵循一致規則：
> ```text
> # 預設自動偵測文字檔
> * text=auto
> 
> # Shell 腳本與 Linux 配置強制 LF
> *.sh text eol=lf
> 
> # Windows 批次檔強制 CRLF
> *.bat text eol=crlf
> *.cmd text eol=crlf
> 
> # 二進位資源避免任何轉換
> *.png binary
> *.jpg binary
> ```

### 檔名大小寫陷阱：`core.ignorecase`
macOS（APFS）與 Windows（NTFS）的檔案系統預設都是**大小寫不敏感（Case-Insensitive, Case-Preserving）**，而 Linux 與 CI 伺服器則是**大小寫嚴格敏感（Case-Sensitive）**。

這孕育了另一個著名的工程迷因：**「明明在我電腦上可以跑！」（It works on my machine）**。

如果你將 `utils.js` 重構改名為大寫的 `Utils.js`，在 macOS 本機開發與單元測試一路綠燈。但若未關閉 Git 的大小寫忽略，Git 會一臉無辜地認為檔名根本沒有任何變化！直到推送到 Linux CI 建置時，因找不到大小寫匹配的模組而當場噴紅燈爆炸。

```bash
# 關閉大小寫忽略，精確捕捉檔名大小寫變更
git config --global core.ignorecase false
```

---

## 2. 歷史與同步流暢度：Rebase、Push 與 Rerere

### 保持線性歷史：`pull.rebase = true`
新人在同步最新主分支時，最習慣直接敲 `git pull`。但預設行為會在本地產生大量的 `Merge branch 'main' of ...` 雜訊節點，時間線糾纏得像一盤義大利麵。

```bash
# 同步遠端時預設採用 rebase，維持乾淨的線性歷史
git config --global pull.rebase true
```

### 告別 `--set-upstream`：`push.autoSetupRemote = true`
在本地建立新分支後，首次推送通常需要輸入長長的：
```bash
git push --set-upstream origin feature/my-branch
```
自 Git 2.37 起，可以開啟自動關聯設定：
```bash
git config --global push.autoSetupRemote true
```
之後任何新分支，只需敲 `git push`，Git 就會自動為你在遠端建立同名分支並建立 upstream 關聯。

### 衝突記憶神器：`rerere.enabled = true`
**Rerere** 是 **Reuse Recorded Resolution**（重用記錄的衝突解決方案）的縮寫。

身為工程師，人生苦短，實在沒有必要在週五晚上第十次 rebase 長期分支時，對著同一個檔案的同一個衝突重複抓狂解題五次。

開啟 `rerere` 後，Git 會在本地快取你解決過的衝突與最終結果。當同一個衝突再次出現時，Git 會自動套用你上次的解法！

```bash
git config --global rerere.enabled true
```

---

## 3. 程式碼審查與品質輔助

### 提升比對精確度：`diff.algorithm = histogram`
Git 預設的比對演算法（Myers）在面對程式碼重構、函式搬移或多層括號縮排變更時，經常會產出「雖然語法正確，但人類讀起來很彆扭」的 diff 切割方式。

**Histogram Diff** 演算法會優先尋找低頻率出現的結構標記（如函式宣告行），產生邏輯結構更清晰、更容易閱讀的差異比對：

```bash
git config --global diff.algorithm histogram
```

### Commit 時顯示完整差異：`commit.verbose = true`
在終端機輸入 `git commit` 開啟編輯器時，預設只會列出被修改的檔案清單。開啟 `verbose` 後，編輯器下方會直接附帶本次提交的完整 `diff`（以註解形式呈現，不會被存入 commit message）：

```bash
git config --global commit.verbose true
```
這能讓你在寫下 Commit Message 的那一刻，最後一眼檢視所有異動，及時發現不小心留下的 `console.log` 或暫存測試碼。

### 空白符號錯誤醒目標示
```bash
git config --global core.whitespace trailing-space,space-before-tab,cr-at-eol
```
在執行 `git diff` 時，行尾多餘的空白字元（trailing space）或混雜的 tab/space 會被自動以醒目的紅色標示。

---

## 4. 全域排除清單：保持 Repository 乾淨

每個開發者的電腦都會產生特定的垃圾暫存檔（例如 macOS 的 `.DS_Store`、Windows 的 `Thumbs.db`、VS Code 的 `.vscode/`、JetBrains 的 `.idea/`）。這些檔案**絕不應該**被寫入各專案的 `.gitignore`，更不該推送到公開儲存庫。

建立全域忽略設定檔：

```bash
mkdir -p ~/.config/git
git config --global core.excludesfile ~/.config/git/ignore
```

在 `~/.config/git/ignore` 中加入常見的本機環境雜項：

```text
# macOS
.DS_Store
.AppleDouble
.LSOverride
._*

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini

# IDE & 編輯器暫存檔
.idea/
.vscode/
*.swp
*~
```

---

## 5. 人機協作下的提交修養

在 AI Agent 協助撰寫程式碼的時代，一次 prompt 可能就會修改多個檔案。若未經整理就直接整包提交，往往會產生大而無當的「一大坨 Commit」，使日後的 `git bisect` 除錯與 Code Review 變得寸步難行。

保持良好工程習慣的原則是：**邏輯原子化提交（Atomic Commits）** 與 **標準化的語義說明（Conventional Commits）**。

> 🛠️ **工具推薦**：  
> 若希望讓 AI 協助梳理與規範提交歷程，您可以搭配安裝 [akunzai/agent-skills](https://github.com/akunzai/agent-skills) 中的 `tidy-commits` 技能。它能指導 AI 依照團隊規格，將零散的實作進度拆解為邏輯清晰的微型提交，兼顧開發敏捷度與版本歷史的美觀。

---

## 現代 `.gitconfig` 範本參考

以下為整合上述所有精華的範本（可放置於 `~/.gitconfig`）：

```ini
[user]
	name = Your Name
	email = user@example.com

[init]
	defaultBranch = main

[core]
	autocrlf = input          # Windows 請改為 true
	safecrlf = true
	ignorecase = false
	excludesfile = ~/.config/git/ignore
	whitespace = trailing-space,space-before-tab,cr-at-eol

[pull]
	rebase = true

[push]
	autoSetupRemote = true

[rerere]
	enabled = true

[diff]
	algorithm = histogram

[commit]
	verbose = true

[color]
	ui = true
```

掌握了這些全域配置後，你的 Git 就具備了極佳的防禦性與流暢度。在下一篇中，我們將探討如何利用上一篇配置的 SSH 金鑰，實作[不可否認的程式碼承諾：基於 SSH 的 Git Commit 數位簽署](./ssh-commit-signing/)，讓你的每一次提交都具備無可偽造的信任背書。

---

## 參考資料

- [Git 官方文件：git-config(1)](https://git-scm.com/docs/git-config) — `pull.rebase`、`init.defaultBranch` 與全域參數權威指南
- [Git 官方文件：gitattributes(5)](https://git-scm.com/docs/gitattributes) — 跨平台換行字元（EOL）正規化與文字屬性定義
- [Git 官方文件：gitignore(5)](https://git-scm.com/docs/gitignore) — 全域與專案層級排除規則語法
- [Git 官方手冊：Git Tools - Rerere](https://git-scm.com/book/en/v2/Git-Tools-Rerere) — 重複衝突自動解決機制深度解析
- [Conventional Commits 規範](https://www.conventionalcommits.org/) — 結構化提交訊息標準與語義化版本控制
- [GitHub 專案：akunzai/agent-skills](https://github.com/akunzai/agent-skills) — 支援 AI Agent 提交梳理的工程規範技能包 (`tidy-commits`)
