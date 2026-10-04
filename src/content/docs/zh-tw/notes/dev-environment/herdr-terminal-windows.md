---
title: "Herdr 在 Windows：Windows Terminal、PowerShell 7 與 Scoop"
description: 在原生 Windows 上用 Herdr 同時執行 Claude Code、Codex 等 Coding Agent 時，終端機、Shell、Prompt 與套件管理工具中哪些選擇真正重要。
sidebar:
  order: 9
---

本篇說明 Herdr 底下的 Windows 各層設定。Herdr 的模型、按鍵與 Plugin 請先閱讀 [Herdr 基礎](../herdr-getting-started/)；Mac 使用者請看 [Herdr 在 macOS](../herdr-terminal-macos/)。

Herdr 透過 ConPTY 支援原生 Windows。目前已支援與部分支援的功能清單，請見 [Herdr：Windows support](https://herdr.dev/docs/windows-beta/)。

> [!NOTE]
> Windows 上的 Plugin 支援仍是 preview，Kitty graphics 的渲染取決於終端機，CJK 輸入法的組字定位也只有部分支援。Windows 可用的 Agent Integration 範圍同樣比 macOS 與 Linux 窄。

---

## 1. 外層終端機：Windows Terminal

### 使用 Nerd Font，且選 Mono 變體

Starship Prompt 會使用 Private Use Area 的圖示，Herdr 的符號狀態指示與側邊欄也仰賴乾淨的字形渲染。建議選 **Mono** 變體，圖示才會固定一格寬，Pane 邊框也不會位移。在 Windows Terminal 的 `settings.json` 中：

```json
"profiles": {
  "defaults": {
    "font": { "face": "JetBrainsMono Nerd Font Mono", "size": 16 }
  }
}
```

### 複製貼上，同時不破壞 Ctrl+C

我的 Gist 把 `ctrl+c` 綁定為複製、`ctrl+v` 綁定為貼上，並開啟 `copyOnSelect`。Windows Terminal 在有選取文字時複製，沒有選取時仍會送出中斷，所以對經常需要取消長時間執行的 Agent 工作流是安全的。

### 別讓終端機的快速鍵擋住 Herdr

Herdr 的 Prefix 是 `ctrl+b`，不用 Prefix 的組合鍵在 `ctrl+alt` 上最穩定。我的 Windows Terminal Gist 用 `alt+shift+z` 與 `alt+shift+d` 處理縮放與複製 Pane，兩者都不會與上述組合衝突。綁定更多按鍵前，請先查閱[鍵盤指南](https://herdr.dev/docs/keyboard/)。

參考 Gist：[Windows Terminal 設定](https://gist.github.com/akunzai/b4b1f394db3ceb399ba1976a30e540fa)（`settings.json`）。

---

## 2. Shell：PowerShell 7

建議使用 PowerShell 7（`pwsh`），而非 Windows PowerShell 5.1。

Windows 沒有對應 `.zshenv` 的機制，所以 Agent 看到的環境來自你永久的**使用者** `PATH` 與環境變數。請確保工具位於永久的 `PATH`，而不是只在單一 Session 中加入。我的 Profile 提供 `Add-Path`、`Remove-Path` 與 `Get-Path` 來處理：

```powershell
Add-Path "C:\Tools"   # 永久生效，並同步套用到目前 Session
Get-Path              # 編號清單，並標示不存在的項目
```

Profile 維持拆分：`Microsoft.PowerShell_profile.ps1` 放互動行為，`profile.ps1` 放個人輔助函式。我的 Profile Gist 值得參考的部分：

- PSReadLine 的歷史預測，以及 Emacs 風格的 `Ctrl+a/e/w` 按鍵，讓行編輯體驗與 macOS 一致。
- `rgit`（對子目錄中的所有儲存庫執行 Git 指令）、`ln` 與 UNIX 風格的 `ls`，讓肌肉記憶與 Agent 產生的指令都能直接沿用。
- `up`：一次更新 PowerShell 模組、Scoop 與 Winget。

若要在長壽命的 Pane 內進行 Commit 簽署，請使用 [SSH 金鑰與安全](../ssh-keys-security/)所述的 Windows OpenSSH Agent 服務，讓所有 Pane 共用同一個 Agent。

> [!CAUTION]
> 我的 Gist 包含 `cc.yolo`、`cd.yolo` 之類的捷徑，會以關閉權限確認的方式啟動 Agent。請只在可隨時丟棄的環境使用，並在複製前先閱讀系列[總覽](../)中的防護說明。

參考 Gist：[PowerShell Profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf)。

---

## 3. Prompt：Starship

這裡可以使用與 macOS 相同的 `starship.toml`，兩邊的 Prompt 看起來完全一致。請在 Profile 接近結尾處初始化：

```powershell
if (Get-Command starship -ErrorAction SilentlyContinue) {
  Invoke-Expression (&starship init powershell)
}
```

只在 SSH 時顯示主機名稱（`ssh_only = true`），並停用不需要的模組。每個 Agent 指令之後 Prompt 都會重繪。參考 [Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5)。

---

## 4. 用 Scoop 與 mise 安裝一切

不要手動下載安裝程式。

- **GUI 軟體與字型**：Scoop（或 Winget）。
- **開發用 CLI**：[mise](https://mise.jdx.dev/)，讓*同一份*全域 `config.toml` 在 macOS 也能使用。

```powershell
scoop bucket add extras
scoop bucket add nerd-fonts
scoop install windows-terminal JetBrainsMono-NF-Mono mise
```

```toml
# %USERPROFILE%\.config\mise\config.toml
[tools]
herdr = "latest"
starship = "latest"
fzf = "latest"
zoxide = "latest"
ripgrep = "latest"
fd = "latest"
neovim = "latest"
```

```powershell
mise install
```

> [!TIP]
> Herdr 也能用 `scoop install herdr`（`main` bucket）或 Herdr 的 PowerShell 安裝指令稿安裝。請依 [Herdr 基礎](../herdr-getting-started/#安裝)的說明，只選一種來源。

---

## 驗收清單

| 檢查項目 | 指令 / 檢視方式 | 預期結果 |
| :--- | :--- | :--- |
| 字型 | 開啟 Herdr，觀察側邊欄與 Starship Prompt | 沒有豆腐方塊，邊框對齊 |
| Ctrl+C | 選取文字後按 `ctrl+c`，再在沒有選取時按一次 | 先複製，再中斷 |
| 永久 PATH | 開啟新終端機，執行 `Get-Path` | 工具目錄皆在清單中並標示為 OK |
| Agent 環境 | 請 Agent 執行 `where.exe node` | 與 mise 選定的版本一致 |
| Pane 內簽署 | 在 Herdr Pane 執行 `ssh-add -l` | 列出你的金鑰 |
| 重新連線 | 關閉終端機後執行 `herdr` | Session 與 Agent 都還在 |

---

## 參考資料

- [Herdr：Windows support](https://herdr.dev/docs/windows-beta/) — 原生 Windows 上已支援與部分支援的功能
- [Herdr：Install](https://herdr.dev/docs/install/) — PowerShell 安裝指令稿、mise 與更新行為
- [Herdr：Keyboard](https://herdr.dev/docs/keyboard/) — 各終端機（含 Windows Terminal）的預設快速鍵衝突
- [Windows Terminal 文件](https://learn.microsoft.com/en-us/windows/terminal/) — 設定、快速鍵與配色方案
- [PowerShell 文件](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 Profile 與 PSReadLine
- [Starship Configuration](https://starship.rs/config/) — Prompt 模組、色板與效能選項
- [mise 文件](https://mise.jdx.dev/) — 全域工具設定與 Shell 啟用
- [Scoop](https://scoop.sh/) — Windows 命令列安裝工具，含 `nerd-fonts` bucket
- [Nerd Fonts](https://www.nerdfonts.com/) — 內含開發者圖示的修補字型
