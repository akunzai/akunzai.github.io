---
title: "Claude Code：Gist 與跨平台配置"
description: 在 macOS 與 Windows 配置 Claude Code 使用者設定、Statusline 輔助指令稿與 CLI 捷徑，並區分工具權限與程序隔離。
sidebar:
  order: 10
---

我把 Harness 配置與終端機設定分開。Shell 與工具 PATH 請先看 [macOS](../herdr-terminal-macos/)或 [Windows](../herdr-terminal-windows/)終端機筆記；這篇集中整理 Claude Code 配置。[Codex CLI](../codex-cli-configuration/)的配置與權限語意不同，另有一篇說明。

## 配置來源

| Gist | 內容 |
| --- | --- |
| [Claude Code 設定](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380) | `settings.json`、`statusline.sh` 與安裝說明 |
| [Unix 捷徑](https://gist.github.com/akunzai/c3aca93fbe7f715c0c3b1a220e25b4f9) | `.profile.local`，由我的互動式 `.zshrc` 載入 |
| [PowerShell Profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf) | `profile.ps1` 中的個人輔助函式 |

先依[官方安裝指南](https://code.claude.com/docs/en/setup)安裝 CLI，再用 `claude --version` 與 `claude doctor` 檢查。設定 Gist 是供已安裝的 CLI 使用，不會替你安裝 Claude Code。

## 選擇設定範圍

| 檔案 | 範圍 |
| --- | --- |
| `~/.claude/settings.json` | 這台機器上跨專案的個人預設 |
| `.claude/settings.json` | 共用的專案設定 |
| `.claude/settings.local.json` | 個人在專案內的覆寫 |

Windows 的家目錄通常是 `%USERPROFILE%`；`CLAUDE_CONFIG_DIR` 可改變使用者配置目錄。決定偏好應放哪個檔案前，先看[設定檔與優先序](https://code.claude.com/docs/en/settings)。

先備份自己的設定，再下載 Gist 作為參考，合併需要的欄位。它包含個人 Plugin 選擇與風險選擇，例如 `sandbox.enabled: false`；複製這份檔案不會啟用 Sandbox。認證、Session 歷史與本機狀態不要放進 Gist。

語言與模型偏好可共用；Plugin 相依工具、Hook 指令、Statusline 指令、Unix Socket 路徑與平台工具則應逐台確認。改用家目錄相對路徑，只能消除使用者目錄相依，不能消除平台相依。

## 安裝 Statusline 輔助指令稿

Gist 的輔助指令稿顯示模型／Context／Cache 用量、剩餘額度，以及 Sandbox／目錄／Git 資訊。它需要 PATH 中有 Bash、`jq` 與 Git；Windows 可使用 Git Bash／MSYS2。依 Gist 的安裝說明下載並檢查 `statusline.sh`，再於使用者設定配置指令：

```json
{
  "language": "zh-TW",
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

macOS 要讓輔助指令稿可執行；上面的指令會直接啟動它。

### Windows：明確選擇 Git for Windows

我的 Windows 環境直接啟動指令稿時，`bash` 會解析成 WSL，而非 Git Bash。在 Windows 的使用者設定把 `statusLine.command` 覆寫為明確的 `sh` 呼叫：

```json
{
  "statusLine": {
    "type": "command",
    "command": "sh ~/.claude/statusline.sh"
  }
}
```

在 PowerShell 檢查 PATH 找到的執行檔：

```powershell
where.exe sh
where.exe bash
```

確認 `sh` 來自 Git for Windows；若找到其他來源，改指定預期的 `sh.exe` 完整路徑。這是上述 Windows Shell 解析問題的處理方式，不代表每台 Windows 都會選到 WSL。[官方 Statusline 指南](https://code.claude.com/docs/en/statusline#windows-configuration)另有 PowerShell 寫法。若改變配置目錄，也要更新輔助指令稿的路徑。

## 捷徑與權限模式

Unix 別名：

```sh
alias cc='claude'
alias cc.yolo='claude --dangerously-skip-permissions'
```

PowerShell 的 `cc.yolo` 使用函式轉送參數：

```powershell
function cc.yolo { claude --dangerously-skip-permissions @args }
```

PowerShell 的一般 Session 直接執行 `claude`。修改捷徑後，重新載入 Shell Profile 或開啟新終端機。

`cc.yolo` 選擇 `bypassPermissions`。[官方權限模式文件](https://code.claude.com/docs/en/permission-modes)明確說明，這個模式仍套用明確的 deny 規則；這與連 Sandbox 一起停用的 Codex `--yolo` 不同。不過，`Read(...)` 之類的工具規則，不是針對所有 Shell 指令的 OS 層檔案存取邊界；工具檢查與程序隔離必須分開理解。

無人值守工作若需要拒絕所有原本會詢問的動作，可考慮 `claude --permission-mode dontAsk`。在新 Session 用 `/permissions` 與 `/status` 檢查，並以可丟棄的測試檔驗證規則，不要拿真實憑證檔測試。

## 減少提示的建議配置

一般 Session 維持 `permissions.defaultMode = "auto"`。另建 `~/.claude/sandbox.settings.json`，放入以下覆寫，再用 `cc --settings ~/.claude/sandbox.settings.json` 啟動；PowerShell 則直接用 `claude --settings`：

```json
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "autoAllowBashIfSandboxed": true,
    "enableWeakerNetworkIsolation": false,
    "network": {
      "strictAllowlist": true,
      "allowedDomains": ["github.com", "*.npmjs.org"]
    },
    "filesystem": {
      "denyRead": ["~/.aws", "~/.azure", "~/.ssh", "~/.gnupg", "~/.env.local", "~/.config/gcloud", "~/.config/rclone"]
    }
  }
}
```

這是邊界範例，不是使用者設定的替代檔。保留明確的工具 deny 規則與憑證／環境變數過濾，網路目的地與可寫入的快取目錄，只加入專案需要的項目。從原設定來源移除不需要的 `excludedCommands` 與 Socket 允許項目；Claude 會合併清單。即使在這份檔案設定空陣列，原本的清單項目仍會留下。

以 `--settings` 載入嚴格 Sandbox 覆寫，可防止專案依[官方 Sandbox 指南](https://code.claude.com/docs/en/sandboxing)所列的設定放寬限制。Auto mode 審核動作，Auto-allow 則讓符合條件的 Sandbox Bash 指令免除人工核准。原生 Windows 無法執行此 Sandbox，`failIfUnavailable` 會拒絕啟動；應使用 WSL2 或外部隔離。

若確實需要 Bypass mode，`cc.yolo --settings ~/.claude/sandbox.settings.json` 可保留這層 Shell Sandbox 與工具 deny 規則，前提是已移除命令例外。這個邊界涵蓋 Shell 指令，不涵蓋 Hook、MCP server、檔案工具或瀏覽器能力。要一起隔離，必須把整個 Harness 放進外部程序／容器／VM 邊界，限制掛載與憑證權限。

## 切換 YOLO 會影響 Prompt cache 嗎？

Claude Code 的[快取文件](https://code.claude.com/docs/en/prompt-caching#changing-permission-mode)明確說明，Permission mode 切換不改變 System prompt 或工具定義，因此單純換模式會保留快取；`opusplan` 切換模型的例外仍適用。這不代表新對話、快取到期、升級、換模型或更換工具／Plugin 都不影響快取。比較模式時，延續同一對話並維持其他設定；這裡沒有另外執行 YOLO 快取實驗。更多脈絡見[對話與快取筆記](/zh-tw/blog/cache-session-habits/)。
