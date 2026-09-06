---
title: "雙平台落地指南：macOS 與 Windows 開發環境最佳實踐"
description: 從套件管理、終端機調校到憑證穿透，全面梳理 macOS 與 Windows（PowerShell / WSL 2）的現代工程配置。
sidebar:
  order: 6
---

在多元化的軟體研發團隊中，新人的開發機可能是 **macOS**，也可能是 **Windows**。

雖然兩種作業系統底層核心不同，但在現代工具鏈的支撐下，我們完全可以做到**在雙平台上享有高度一致、乾淨且高效的開發體驗**。

本篇作為系列的收官之作，將為兩大平台分別梳理最精準的環境落地清單，並解決跨平台開發中最常見的效能與憑證穿透問題。

---

## 1. macOS 環境最佳實踐

macOS 是 Unix-like 系統，天生具備絕佳的命令列體驗，但依然需要適度調校以符合現代工程標準。

### 1.1 套件管理：[Homebrew](https://brew.sh/)
不要手動下載 `.pkg` 或 `.dmg` 來安裝開發工具，一律使用 Homebrew 進行版本化管理：

```bash
# 安裝 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安裝現代版本控制與平台 CLI
brew install git gh glab

# 安裝現代終端機（如 Ghostty）與字型
brew install --cask ghostty font-jetbrains-mono-nerd-font
```

### 1.2 現代終端機與 Terminfo 調校
如果你使用新一代 GPU 加速終端機（例如 Ghostty、Alacritty、Kitty），在透過 SSH 登入遠端老舊 Linux 伺服器時，可能會遭遇：
```text
xterm-ghostty: unknown terminal type
```
想像一下：你開著最新款、擁有 GPU 渲染極致流暢平滑的現代終端機，連線進公司一台運行了十多年從未重開機過的舊主機，結果遠端伺服器一臉茫然地抗議「我這輩子沒見過這種外星生物」——這種宛如拿著 iPhone 16 穿越回石器時代的尷尬，就是因為老舊伺服器的 terminfo 資料庫根本不認得新終端機。

**最佳解法**：在本地 `~/.ssh/config` 中，預設將連線終端環境回退為最相容的 256 色定義：

```ssh-config
# ~/.ssh/config
Host *
  SetEnv TERM=xterm-256color
```

### 1.3 執行環境版本管理：[mise](https://mise.jdx.dev/)
避免全域安裝 Node.js、Python、Go 等特定版本導致不同專案打架。推薦採用現代高效的環境管理工具 **mise**（或透過 [akunzai/agent-skills](https://github.com/akunzai/agent-skills) 內的 `mise` 技能引導 AI 正確配置 `mise.toml`）。

```bash
brew install mise
mise use --global node@lts
```

---

## 2. Windows 環境最佳實踐（Native & WSL 2）

Modern Windows 開發環境在過去幾年有了翻天覆地的演進。現代 Windows 開發者有兩種主流工作流：
1. **Windows 原生環境（Native PowerShell 7）**：適合 .NET、跨平台 CLI 或桌面應用開發。
2. **WSL 2（Windows Subsystem for Linux）**：適合深度依賴 Linux 容器、Docker 或原生 Unix 建置工具鏈的專案。

### 2.1 套件管理：Winget
Windows 10/11 內建的 `winget` 是最標準的套件管理器：

```powershell
# 安裝 Git、GitHub CLI 與 GitLab CLI
winget install --id Git.Git -e --source winget
winget install --id GitHub.cli -e --source winget
winget install --id GitLab.glab -e --source winget

# 安裝現代 Windows Terminal 與 PowerShell 7
winget install --id Microsoft.WindowsTerminal -e --source winget
winget install --id Microsoft.PowerShell -e --source winget
```

### 2.2 開啟 Windows 內建 OpenSSH Agent
確保背景服務處於自動執行狀態，以便記憶金鑰密碼：

```powershell
# 以管理員身分執行
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

### 2.3 WSL 2 核心避坑黃金法則
如果你選擇在 WSL 2（如 Ubuntu on Windows）下工作，請務必銘記以下兩條血淚經驗：

#### 規則一：程式碼必須放在 Linux 檔案系統內！
- ❌ **嚴重降速寫法**：把專案放在 `/mnt/c/Users/...` 下進行開發。跨作業系統的 9P 協議檔案系統轉換開銷極大，每次 `npm install` 或 `git status` 花的時間足以讓你悠閒手沖三次咖啡，硬生生把 NVMe SSD 性能折磨成 5400 轉老機械硬碟！
- ✅ **正確寫法**：一律把程式碼放置於 WSL 2 的原生路徑（如 `~/code/...` 或 `/home/username/code`）。若需要在 Windows 端用 VS Code 開啟，只需在 WSL 內輸入 `code .` 即可無縫遠端編輯。

#### 規則二：在 WSL 內複用 Windows 的 Git Credential Manager
不需要在 WSL 內重新登入各種 HTTPS Token，可以直接呼叫 Windows 端已經驗證過的 GCM：

```bash
# 在 WSL 2 內的 Linux 終端機設定
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

---

## 3. 新人環境驗收清單（Final Checklist）

恭喜你！完成本系列五部曲的設定後，你的個人電腦已經具備了產業第一線的標準工程基礎。

在開始投入實際開發前，請執行這份**新人環境驗收清單**：

| 檢驗項目 | 驗證指令 / 確認方式 | 預期結果 |
| :--- | :--- | :--- |
| **SSH 演算法** | `ls ~/.ssh/` | 存在 `id_ed25519.pub`，無過時 RSA 弱密鑰 |
| **Passphrase 保護** | `ssh-keygen -y -f ~/.ssh/id_ed25519` | 提示輸入 passphrase，非免密私鑰 |
| **金鑰隔離** | 檢視 `~/.ssh/config` | 具備 `IdentitiesOnly yes` 與 `ForwardAgent no` |
| **Git 核心配置** | `git config core.autocrlf` | macOS/Linux 為 `input`；Windows 為 `true` |
| **衝突重現** | `git config rerere.enabled` | 輸出 `true` |
| **Commit 簽章** | `git config commit.gpgsign` | 輸出 `true`，且 `gpg.format` 為 `ssh` |
| **身分切換** | `git config user.email`（在公司目錄） | 自動解析為公司公務信箱，無須手動指定 |
| **Agent 防護** | `glab skills list` 或 `skills ls` | 已安裝官方 `glab` 技能，AI 具備確鑿 CI 指令 |

---

## 結語：工程師的核心主權

軟體工程的世界正在發生歷史性的轉變。未來的開發日常，將會是人與數十個自主 AI Agent 協同建構大型系統的時代。

程式碼編寫的門檻被大幅降低，但這絕不代表工程素養變得廉價——**相反地，懂得如何劃定安全界限、如何管理憑證與主權、如何讓協同工具與代理人在明確的規範下穩定運轉，正是現代優秀工程師最無可替代的核心價值**。

願這套指南，能成為你邁向卓越工程師之路的堅實基石。

---

## 參考資料

- [Homebrew 官方網站與文件](https://brew.sh/) — macOS 套件管理工具安裝、維護與 Cask 生態系統
- [Microsoft Learn：WSL 安裝與最佳實踐](https://learn.microsoft.com/en-us/windows/wsl/setup/environment) — WSL 2 開發環境建置、Linux 發行版管理與遠端除錯
- [Microsoft Learn：比較 WSL 1 與 WSL 2 架構差異](https://learn.microsoft.com/en-us/windows/wsl/compare-versions) — 跨作業系統 9P 檔案系統協議效能深入剖析
- [Microsoft Learn：Windows 套件管理員 (winget)](https://learn.microsoft.com/en-us/windows/package-manager/winget/) — Windows 現代化指令列套件探索與安裝標準
- [PowerShell 官方文件](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 跨平台命令列、模組與自動化環境指南
