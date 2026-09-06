---
title: "公私分明：GitHub、GitLab 多身分動態隔離與 Agent Skills"
description: 利用 Git includeIf 實現工作與個人身分的無感切換，並搭配 Skills Manager 與官方 Agent Skills 為 AI 助手建立精確的 GitLab CI/CD 操作邊界。
sidebar:
  order: 5
---

每一位工程師進入職場後，最常遇到的第一道尷尬難題就是：**身分混淆**。

- 在公司機密專案的生產環境歷史中，不小心用國高中時期申請的熱血中二信箱（例如 `xx_dark_dragon_xx@gmail.com`）提交了幾十個 Commit，讓整個 Code Review 會議都在熱烈討論這位「暗黑龍尊」究竟是何方神聖。
- 在個人的公開開源專案中，不小心留下了公司內部的企業信箱甚至私有跳板機 IP，直接觸發資安事件。
- 在推送程式碼時，因為拿錯金鑰或憑證衝突，在終端機前反覆面對 `Permission denied (publickey)` 抓狂。

傳統作法是要求工程師「每次 clone 專案後，一定要記得手動下 `git config user.email ...`」。但人類工程師只要趕著下班，就有一萬個理由忘記。

本篇將示範如何運用現代 Git 的 **條件式引入機制（`includeIf`）** 與 **憑證助手分流** 徹底實現全自動隔離，並進一步探討在人機協作環境下，如何為 AI Agents 裝載官方技能包，杜絕指令幻覺。

---

## 1. 神級配置：Git `includeIf` 自動切換身分

自 Git 2.13 起，Git 支援了 `includeIf`；在 Git 2.26 之後，更支援直接**依據遠端倉庫的 Remote URL** 進行條件匹配。

這意味著：無論你把專案 clone 在電腦的哪個目錄，**只要遠端連線指向公司的 Git 伺服器，Git 就會自動載入公司的公務設定！**

### 步驟 1：建立全域基礎設定（`~/.gitconfig`）
在你的全域設定檔中，以個人或最通用的身分為基底：

```ini
# ~/.gitconfig
[user]
	name = Your Name
	email = user@example.com
	signingkey = ~/.ssh/id_ed25519.pub

# 當專案的 remote URL 指向公司 GitLab 網域時，自動套用覆蓋設定
[includeIf "hasconfig:remote.*.url:https://git.company.example.com/**"]
	path = ~/.config/git/company.ini

# 或者：依據本機目錄劃分（例如所有放在 ~/work/ 下的專案）
[includeIf "gitdir:~/work/"]
	path = ~/.config/git/company.ini
```

### 步驟 2：建立公司專用覆蓋設定（`~/.config/git/company.ini`）
在該獨立檔案中，只定義需要覆蓋的公務身分與專用簽名金鑰：

```ini
# ~/.config/git/company.ini
[user]
	email = employee@company.example.com
	signingkey = ~/.ssh/id_ed25519_company.pub
```

### 效果驗證
進入任何一個公司的專案目錄，執行：
```bash
git config user.email
```
你會發現它自動印出 `employee@company.example.com`；而切換到開源專案時，又自動變回 `user@example.com`。

從此再也不需要手動改配置，也徹底避免信箱穿幫的低級失誤！

---

## 2. 憑證助手（Credential Helper）精確分流

如果你透過 HTTPS 協定存取儲存庫，在不同平台（GitHub、自建 GitLab、Azure DevOps）之間，憑證管理往往容易打架。

現代 Git 支援針對不同 Host 獨立配置憑證小幫手（Credential Helper）：

```ini
# ~/.gitconfig

# 全域預設：採用微軟跨平台 Git Credential Manager (GCM)
[credential]
	helper = 
	helper = /usr/local/share/gcm-core/git-credential-manager

# GitHub 專用：交由 GitHub CLI 原生處理 Token 與驗證
[credential "https://github.com"]
	helper = 
	helper = !gh auth git-credential

# 公司內部 GitLab 專用：交由 GitLab CLI 原生處理
[credential "https://git.company.example.com"]
	helper = 
	helper = !glab auth git-credential
```

> 💡 **注意事項**：在指定自訂 helper 前先放一行空白的 `helper =`，是為了清空 Git 預設的快取設定，避免舊憑證優先度過高產生衝突。

---

## 3. 人機協作實踐：讓 AI 精準掌握 GitLab CLI

當現代開發流程進入「人類工程師 + AI Coding Agents」協同作業時，新的挑戰出現了：**當你滿懷信任地對 AI 說『幫我看下 CI/CD 的狀況』，結果它以 120% 的自信心，在終端機裡瞎編出一句根本不存在的 `glab ci fire-missiles --force`**。

又或者，AI 為了圖方便，直接用脆弱的 `curl` 寫了 80 行嵌套跳脫字元的腳本試圖去暴力轟炸 GitLab 的私有 REST API，結果在發布 Merge Request 說明時，因為 Markdown 內含反引號與 `$` 變數，觸發了未預期的 Shell 變數展開，把整個 MR 的版面炸得體無完膚。

### 為什麼會這樣？
主流大型語言模型（LLM）雖然訓練時吞進了海量程式碼，但對特定企業環境中 `glab` CLI 的最新子指令與安全邊界缺乏確鑿約束。換言之，**它在用無比篤定的語氣「認真地胡說八道」**。

### 解決方案：官方 Agent Skills
治好 AI「幻覺併發症」的唯一解藥，不是在 Prompt 裡寫八百字咒語哀求它「千萬不要猜指令」，而是直接**給它一本由 GitLab 官方認證的『操作說明書』**。

GitLab 官方在最新版 `glab` CLI 中，正式推出了符合 **Agent Skills** 規範的內建技能包：

```bash
# 檢視 glab 內建技能
glab skills list

# 為本機的全域 AI Agents 安裝 glab 技能
glab skills install glab --global --force
```

透過安裝此 Skill，AI Agent（如 Claude Code、Gemini CLI / Antigravity、Codex 等）將立即具備確鑿的行動依據：
- **精確的 CI/CD 檢測**：學會使用 `glab ci status --output json` 與 `glab ci get --merge-request <iid> --with-job-details`，不再瞎猜。
- **杜絕 Shell 跳脫陷阱**：在提交多行 Markdown 註解或 MR 內容時，嚴格遵循 Standard Input 管道（`glab mr note create <iid> < /tmp/body.md`）或引用 Heredoc（`<< 'EOF'`），徹底避免 `$` 與反引號引發的未預期執行。
- **正規的跨專案參照**：要求所有引用必須使用完整 URL 展開，確保跨群組 Epic 與 Issue 均能正常渲染。

---

## 4. 企業環境的技能治理：Skills Manager 與 agent-skills

在團隊多人協同環境中，如何讓所有同仁以及其各自使用的 AI Agents 擁有一致、可受控的技能與工作流程？

推薦採用以下開源工具鏈進行標準化管理：

### 1. 使用 [Skills Manager](https://github.com/akunzai/skills-manager) 統一管理金鑰與工具鏈
[Skills Manager](https://github.com/akunzai/skills-manager) 是一個專為 AI Coding Agents 設計的技能管理 CLI。它將本機與遠端的各類 Agent Skills 統一收整於 `~/.agents/skills.json`：

```json
{
  "local": {
    "glab": {
      "type": "command",
      "command": "glab skills install glab --global --force",
      "check": "which glab",
      "description": "GitLab CLI (glab) core agent skill"
    }
  }
}
```
透過 `skills ls` 與 `skills add`，團隊可以將包括 `glab`、`playwright-cli` 在內的工具鏈以聲明式（Declarative）的方式固化下來，新進人員只要一行指令就能將所有必備 Agent 技能部署完成。

### 2. 引進精選工程技能庫：[akunzai/agent-skills](https://github.com/akunzai/agent-skills)
除了官方 CLI 技能外，團隊的特定工作流程（如 Epic 規劃、PR 規範、Commit 整理）往往也需要給 AI 明確的指引。

[akunzai/agent-skills](https://github.com/akunzai/agent-skills) 提供了多套實用的工程技能：
- `gitlab-epic`：協助 AI 嚴格遵循 GitLab Epic 與 Work Items 的層級關係進行規劃與拆解。
- `pr-workflow`：引導 AI 依照標準 Pull Request / Merge Request 流程進行檢查清單確認與程式碼說明撰寫。
- `tidy-commits`：引導 AI 將零散改動整理成乾淨、符合 Conventional Commits 的提交。

---

## 總結

真正的工程素養，不僅止於手動配置好自己的開發機，更包含了**為與你協同作戰的 AI Agents 劃定清晰的邊界與提供精確的工具**。

1. **對內對外分明**：利用 `includeIf` 實現身分與金鑰的零摩擦切換。
2. **憑證專用隔離**：讓 `gh` 與 `glab` 各自守護對應的網域憑證。
3. **消除 AI 幻覺**：透過 [Skills Manager](https://github.com/akunzai/skills-manager) 安裝官方 `glab` 技能與 [agent-skills](https://github.com/akunzai/agent-skills)，確保 AI 在操作企業內部 CI/CD 時每一次都精準合規。

在最後一篇中，我們將跨越作業系統平台，進入[雙平台落地指南：macOS 與 Windows 開發環境最佳實踐](./cross-platform-macos-windows/)，探討 macOS 與 Windows（WSL2 / Native）雙平臺的落地配置。

---

## 參考資料

- [Git 官方文件：Conditional Includes (includeIf)](https://git-scm.com/docs/git-config#_conditional_includes) — 依據目錄與遠端倉庫 URL（`hasconfig:remote.*.url`）動態載入身分設定
- [GitHub CLI 官方手冊](https://cli.github.com/manual/) — `gh auth` 憑證隔離與 GitHub 企業端點管理
- [GitLab CLI (glab) 官方文件](https://docs.gitlab.com/ee/editor_extensions/gitlab_cli/) — GitLab CLI 核心指令、MR 自動化與 CI Pipeline 操作
- [Git Credential Manager 官方文件](https://github.com/git-ecosystem/git-credential-manager) — 跨平台 Git 憑證儲存、OAuth 認證與多身分路由
- [GitHub 專案：akunzai/skills-manager](https://github.com/akunzai/skills-manager) — 跨 AI Agents 平台的技能宣告式安裝與管理工具
- [GitHub 專案：akunzai/agent-skills](https://github.com/akunzai/agent-skills) — 提供給 AI 助手的精選工程工作流程技能包 (`gitlab-epic`、`pr-workflow`、`tidy-commits`)
