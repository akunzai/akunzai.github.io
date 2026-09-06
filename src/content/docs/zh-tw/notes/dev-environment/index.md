---
title: 現代開發環境與工程素養指南
description: 在 AI 時代，重新審視開發者基礎設施、身分認證、Git 規範與人機協作最佳實踐。
sidebar:
  order: 1
---

歡迎來到「Vibe Coding」的大航海時代！在生成式 AI 與 Coding Agents 漫天飛舞的今天，你可以只靠幾句 prompt 就在 3 秒內生成幾百行程式碼，連單元測試和重構都被包辦得體體貼貼。

但殘酷的現實是：**「自動化無法取代責任，代理人無法代行主權。」**

當週日凌晨兩點資料庫憑證外洩、或是生產環境伺服器被當作礦機時，**上線參加 Post-mortem（事故檢討會）扛責任的，絕對不會是那個剛剛在終端機裡對你說「好的，這就為您修復」的 LLM**。在人人都能一鍵生程式碼的時代，真正決定一位工程師身價的，正是你對底層安全架構的理解、對防護網邊界的掌控，以及願為每一行被合併入主分支的程式碼背書的專業素養。

1. **基礎開發環境的配置與合規**：別讓你的本機連線像個沒有密碼的公共電話亭。
2. **架構設計與防禦性邊界**：告訴 AI 什麼能做、什麼不能碰，為 Agents 劃定不可逾越的安全紅線。
3. **對產出結果的終極負責**：數位簽章、身分切換與乾淨的版本歷史，是工程師不可被剝奪的權力與義務。

本系列文章專為工程團隊新人（以及被 AI 幻覺搞到心力交瘁的資深工程師）量身打造，帶你在動手敲程式碼之前，先築起堅不可摧的工程護城河。

---

## 系列文章導覽

### [現代開發者的身分基石：SSH 金鑰與安全實務](./ssh-keys-security/)
- 為什麼全面轉向 Ed25519 演算法？
- 私鑰 Passphrase 與本機 Agent 自動載入（macOS Keychain / Windows OpenSSH Service）
- 多金鑰共存防坑指南：`IdentitiesOnly yes`
- Agent Forwarding 的安全邊界與跳板機防護

### [工欲善其事：現代 Git 必備全域配置與避坑指南](./git-core-configuration/)
- Git 全域衛生習慣：預設主分支命名、`pull.rebase` 與 `rerere`
- 跨平台換行與檔名大小寫避坑（CRLF / LF / ignorecase）
- 高效率比對：Histogram Diff 與 Commit 資訊詳細化
- 全域 `.gitignore` 與 `.gitattributes` 最佳實踐

### [不可否認的程式碼承諾：基於 SSH 的 Git Commit 數位簽署](./ssh-commit-signing/)
- 為什麼 Commit Author 很容易被冒用？
- 告別繁瑣的 GPG：採用 Git 原生支援的 SSH Commit 簽名
- 本地信任庫建立：`allowed_signers` 配置
- GitHub / GitLab Verified 徽章設定

### [公私分明：GitHub、GitLab 多身分動態隔離與 Agent Skills](./multi-identity-gitlab-agent-skills/)
- 個人開源 vs. 公司企業專案的身分碰撞痛點
- 神級語法：Git `includeIf` 依 URL / 目錄自動切換信箱與簽名金鑰
- 憑證助手分流（`gh`、`glab` 與 Git Credential Manager）
- 人機協作防護：透過 [Skills Manager](https://github.com/akunzai/skills-manager) 與 [agent-skills](https://github.com/akunzai/agent-skills) 配置官方 Agent Skills（以 `glab skill` 為例），避免 AI 亂猜 CI 指令

### [雙平台落地指南：macOS 與 Windows 開發環境最佳實踐](./cross-platform-macos-windows/)
- macOS 環境：Homebrew 套件管理、Ghostty/Terminal terminfo、Zsh 生態
- Windows 環境：Winget / Scoop、OpenSSH Agent 自動啟動、PowerShell 與 WSL2
- 跨環境檔案屬性、換行與憑證安全共存
