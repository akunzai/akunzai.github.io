---
title: "Herdr 在 Windows：Windows Terminal、PowerShell 7 與 Scoop"
description: 在原生 Windows 上用 Herdr 同時執行 Claude Code、Codex 等 Coding Agent 時，終端機、Shell、Prompt 與套件管理工具中哪些選擇真正重要。
sidebar:
  order: 9
---

本篇說明 Herdr 底下的 Windows 各層設定。Herdr 的模型、按鍵與 Plugin 請先閱讀 [Herdr 基礎](../herdr-getting-started/)；Mac 使用者請看 [Herdr 在 macOS](../herdr-terminal-macos/)。

Herdr 的原生 Windows 支援已正式推出，使用 ConPTY。目前已支援與部分支援的功能清單，請見 [Herdr：Windows support](https://herdr.dev/docs/windows-beta/)。

> [!NOTE]
> Windows 上的 Plugin 支援仍是 preview，Kitty graphics 的渲染取決於終端機，CJK 輸入法的組字定位也只有部分支援。Windows 可用的 Agent Integration 範圍同樣比 macOS 與 Linux 窄。

---

## 外層終端機：Windows Terminal

### 使用 Nerd Font，且選 Mono 變體

若 Starship Prompt 設定使用 Nerd Font 圖示，就需要相容的字型；Herdr 的一般 Unicode 狀態符號本身不需要 Nerd Font。建議選 **Mono** 變體，圖示才會固定一格寬，Pane 邊框也不會位移。在 Windows Terminal 的 `settings.json` 中：

```json
{
  "profiles": {
    "defaults": {
      "font": { "face": "JetBrainsMono Nerd Font Mono", "size": 16 }
    }
  }
}
```

請把此片段合併至現有設定，保留其他 Profile 與設定。

### 複製貼上，同時不破壞 Ctrl+C

我的 Gist 把 `ctrl+c` 綁定為複製、`ctrl+v` 綁定為貼上，並開啟 `copyOnSelect`。Windows Terminal 有自己的文字選取時，`ctrl+c` 會複製；沒有選取時則會送出中斷。Herdr 內拖曳選取 Pane 文字時，由 Herdr 處理複製；貼上文字請使用 Windows Terminal 的 `ctrl+shift+v`。需要用 Windows Terminal 選取時，按住 `Shift` 再拖曳。

### 別讓終端機的快速鍵擋住 Herdr

Herdr 的 Prefix 是 `ctrl+b`，不用 Prefix 的組合鍵在 `ctrl+alt` 上最穩定。我的 Windows Terminal Gist 用 `alt+shift+z` 與 `alt+shift+d` 處理縮放與複製 Pane，兩者都不會與上述組合衝突。綁定更多按鍵前，請先查閱[鍵盤指南](https://herdr.dev/docs/keyboard/)。

參考 Gist：[Windows Terminal 設定](https://gist.github.com/akunzai/b4b1f394db3ceb399ba1976a30e540fa)（`settings.json`）。

---

## Shell：PowerShell 7

建議使用 PowerShell 7（`pwsh`），而非 Windows PowerShell 5.1。

子行程會繼承親代行程的環境。PowerShell 有 Profile，但 harness 可用 `-NoProfile` 略過它；不要假設每次 Agent 工具呼叫都會載入 Profile。請把基本工具目錄加入永久的**使用者** `PATH`。既有終端機與 Herdr server 會保留舊環境，直到重新啟動，因此請從新終端機驗證。我的 Profile 提供 `Add-Path`、`Remove-Path` 與 `Get-Path` 來處理：

```powershell
Add-Path "C:\Tools"   # 永久生效，並同步套用到目前 Session
Get-Path              # 編號清單，並標示不存在的項目
```

Profile 維持拆分：`Microsoft.PowerShell_profile.ps1` 放互動行為，`profile.ps1` 放個人輔助函式。我的 Profile Gist 值得參考的部分：

- PSReadLine 的歷史預測，以及 Emacs 風格的 `Ctrl+a/e/w` 按鍵，讓行編輯體驗與 macOS 一致。
- `rgit`（對子目錄中的所有儲存庫執行 Git 指令）、`ln` 與 UNIX 風格的 `ls`，讓肌肉記憶與 Agent 產生的指令都能直接沿用。
- `up`：一次更新 PowerShell 模組、Scoop 與 Winget；其中 `winget upgrade --all --silent` 可能更新受管理的軟體或要求提權。在受管理的裝置上，建議只更新可自行管理的使用者範圍工具，不要直接執行整個 `up`。

`Add-Path` 預設修改使用者 `PATH`；若沒有管理員權限，不要指定 `-Scope Machine`。

若要在長壽命的 Pane 內進行 Commit 簽署，可使用 [SSH 金鑰與安全](../ssh-keys-security/)所述的 Windows OpenSSH Agent 服務，讓所有 Pane 共用同一個 Agent。若服務尚未啟用，設定或啟動它需要系統管理員權限；尚未取得權限時，可先用私鑰 Passphrase 逐次簽署。

> [!CAUTION]
> 我的 Gist 包含 `cc.yolo`、`cd.yolo` 之類的捷徑，會以關閉權限確認的方式啟動 Agent。請只在可隨時丟棄的環境使用，並在複製前先閱讀系列[總覽](../)中的防護說明。

參考 Gist：[PowerShell Profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf)。

---

## Prompt：Starship

這裡可以使用與 macOS 相同的 `starship.toml`，兩邊的 Prompt 看起來完全一致。請在 Profile 接近結尾處初始化：

```powershell
if (Get-Command starship -ErrorAction SilentlyContinue) {
  Invoke-Expression (&starship init powershell)
}
```

只在 SSH 時顯示主機名稱（`ssh_only = true`），並停用不需要的模組。這有助於互動式 Pane；非互動式 Agent 工具呼叫通常不會顯示 Starship。參考 [Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5)。

---

## 用 Scoop 與 mise 安裝一切

Scoop、Herdr 官方安裝器與 mise 預設安裝至使用者目錄，不需提權。Windows Terminal 或 PowerShell 7 若未預先配置，先確認可用的安裝來源；Winget 的 `--scope user` 只有在套件提供使用者範圍安裝時才適用。若安裝程式要求系統管理員權限，部分企業環境提權可能需要額外申請。

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

Scoop 只會提供 `mise` 本身，不會提供它安裝的工具。請在 PowerShell 的 `$PROFILE` 加入以下內容，放在 Starship 初始化之前，再重新載入 Profile 或開啟新終端機：

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

Agent 指令若略過 Profile，請用 `mise exec -- <command>` 或 `mise run <task>`，明確選取工具並載入專案環境變數。若需要在未啟用時直接執行工具，請把 mise 的工具 shims 目錄（通常是 `%LOCALAPPDATA%\mise\shims`）加入使用者 `PATH`；shims 不提供明確執行方式的所有環境功能。詳見 [mise 在 Windows 的安裝方式](https://mise.jdx.dev/installing-mise.html#windows-scoop)。

> [!TIP]
> Herdr 也能用 `scoop install herdr`（`main` bucket）或 Herdr 的 PowerShell 安裝指令稿安裝。請依 [Herdr 基礎](../herdr-getting-started/#安裝)的說明，只選一種來源。

---

## 驗收清單

| 檢查項目 | 指令 / 檢視方式 | 預期結果 |
| :--- | :--- | :--- |
| 字型 | 開啟 Herdr，觀察側邊欄與 Starship Prompt | 沒有豆腐方塊，邊框對齊 |
| 複製與中斷 | 在 Herdr Pane 中拖曳選取文字，再在沒有選取時按 `ctrl+c` | 選取內容已複製，`ctrl+c` 送出中斷 |
| 貼上 | 在 Herdr Pane 中按 `ctrl+shift+v` | 剪貼簿文字貼入 Pane |
| 永久 PATH | 開啟新終端機，執行 `$env:PATH -split ';'` | 工具目錄列於清單中；可用 `Test-Path <目錄>` 檢查個別路徑 |
| Agent 環境 | 在設定 Node.js 的專案比較 `node --version` 與 `mise exec -- node --version` | 版本相同；略過 Profile 時改用明確執行方式 |
| Pane 內簽署 | 在 Herdr Pane 執行 `ssh-add -l` | 若 OpenSSH Agent 服務已啟用，列出你的金鑰 |
| 重新連線 | 關閉終端機後執行 `herdr` | Session 與 Agent 都還在 |

---

## 參考資料

- [Herdr：Windows support](https://herdr.dev/docs/windows-beta/) — 原生 Windows 上已支援與部分支援的功能
- [Herdr：Install](https://herdr.dev/docs/install/) — PowerShell 安裝指令稿、mise 與更新行為
- [Herdr：Keyboard](https://herdr.dev/docs/keyboard/) — 各終端機（含 Windows Terminal）的預設快速鍵衝突
- [Windows Terminal 文件](https://learn.microsoft.com/en-us/windows/terminal/) — 設定、快速鍵與配色方案
- [PowerShell 文件](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 Profile 與 PSReadLine
- [Starship Configuration](https://starship.rs/config/) — Prompt 模組、色板與效能選項
- [mise 安裝與 Shell 啟用](https://mise.jdx.dev/installing-mise.html) — Scoop 設定與 PowerShell 啟用
- [mise shims](https://mise.jdx.dev/dev-tools/shims.html) — 不依賴互動式啟用的工具搜尋方式
- [Scoop](https://scoop.sh/) — Windows 命令列安裝工具，含 `nerd-fonts` bucket
- [Nerd Fonts](https://www.nerdfonts.com/) — 內含開發者圖示的修補字型
- [Windows Terminal Actions](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions) — 複製、貼上與 `ctrl+c` 的按鍵行為
- [WinGet install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install) — `--scope user` 與安裝範圍限制
