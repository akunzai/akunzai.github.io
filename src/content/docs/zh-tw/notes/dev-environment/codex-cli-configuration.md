---
title: "Codex CLI：共用 Profile 與本機配置"
description: 用原生 Profile 在 macOS 與 Windows 共用 Codex CLI 偏好，讓 Plugin、本機路徑與執行狀態由各機器管理。
sidebar:
  order: 11
---

我的 Codex 配置原本混合了可共用偏好、macOS 執行檔與 Runtime 路徑。現在改用原生配置 Profile 共用偏好，各機器保留自己的基礎設定。Shell 配置放在 [macOS](../herdr-terminal-macos/)與 [Windows](../herdr-terminal-windows/)終端機筆記；[Claude Code](../claude-code-configuration/)另有獨立配置筆記。

## 配置來源

| Gist | 內容 |
| --- | --- |
| [Codex 共用 Profile](https://gist.github.com/akunzai/d8931f45ad333e1dbc54e18c62f7cf7c) | `shared.config.toml` 與安裝／限制說明 |
| [Unix 捷徑](https://gist.github.com/akunzai/c3aca93fbe7f715c0c3b1a220e25b4f9) | `.profile.local` 中的 `cx` 與 `cx.yolo` 別名 |
| [PowerShell Profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf) | `profile.ps1` 中的對應函式 |

先依[官方 CLI 指南](https://learn.chatgpt.com/docs/cli)安裝，再用 `codex --version` 檢查。Profile Gist 是供已安裝的 CLI 使用。

## 共用偏好，本機狀態各自保留

| 位置 | 內容 |
| --- | --- |
| `shared.config.toml` | 模型、推理強度、Verbosity、權限政策、TUI 偏好、Feature flags 與記憶偏好 |
| 本機 `config.toml` | Plugin 啟用、所有 Marketplace 來源、MCP 執行檔／環境、通知指令、Hook 核准狀態、受信任專案與桌面／Runtime 狀態 |

`--profile shared` 會把 `$CODEX_HOME/shared.config.toml` 疊加在使用者基礎設定上；`CODEX_HOME` 預設是 `~/.codex`。檔名必須是 `shared.config.toml`，不是 `config.shared.toml`。目前 Profile 使用獨立檔案，不使用舊式 `[profiles.shared]` 區塊。專案設定與 CLI 覆寫仍可優先於 Profile（[官方 Profile 說明](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles)）。

模型與推理強度是共用工作偏好，不是 OS 路徑；需要時可為單次執行覆寫，不同帳號的可用模型也可能不同。本機 Plugin 與 Hook 需另外安裝、檢查。不要複製整個 Codex 家目錄，也不要拿另一台機器的檔案覆蓋本機基礎設定。

## 安裝或更新 Profile

以下指令會備份既有 Profile，只替換該檔案，保留基礎 `config.toml`。

### macOS／Unix

```sh
codex_dir="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$codex_dir" &&
if [ -f "$codex_dir/shared.config.toml" ]; then
  cp -p "$codex_dir/shared.config.toml" "$codex_dir/shared.config.toml.backup-$(date +%Y%m%d-%H%M%S)"
fi &&
curl -fsSL https://gist.githubusercontent.com/akunzai/d8931f45ad333e1dbc54e18c62f7cf7c/raw/shared.config.toml \
  -o "$codex_dir/shared.config.toml.download" &&
chmod 600 "$codex_dir/shared.config.toml.download" &&
mv "$codex_dir/shared.config.toml.download" "$codex_dir/shared.config.toml"
```

### Windows PowerShell

```powershell
$codexDir = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
New-Item -ItemType Directory -Path $codexDir -Force -ErrorAction Stop | Out-Null
$target = Join-Path $codexDir 'shared.config.toml'
if (Test-Path -LiteralPath $target) {
    Copy-Item -LiteralPath $target -Destination "$target.backup-$(Get-Date -Format yyyyMMdd-HHmmss)" -ErrorAction Stop
}
Invoke-WebRequest -Uri 'https://gist.githubusercontent.com/akunzai/d8931f45ad333e1dbc54e18c62f7cf7c/raw/shared.config.toml' -OutFile "$target.download" -ErrorAction Stop
Move-Item -LiteralPath "$target.download" -Destination $target -Force -ErrorAction Stop
```

安裝 Profile 時會保留基礎設定。Windows 若曾收到從 macOS 複製的設定，請先檢查：Profile 不會刪除繼承的通知、MCP 或 Marketplace 路徑。

## 捷徑與權限

Unix 別名：

```sh
alias cx='codex --profile shared'
alias cx.yolo='codex --profile shared --yolo'
```

PowerShell 函式：

```powershell
function cx { codex --profile shared @args }
function cx.yolo { codex --profile shared --yolo @args }
```

我的 `.zshrc` 會載入 `~/.profile.local`，PowerShell 則載入 `profile.ps1`。重新載入對應 Profile 或開啟新終端機。

| 指令 | 行為 |
| --- | --- |
| `cx` | 共用 Profile，保留 Sandbox 並自動審核核准請求 |
| `cx -a never` | 不詢問核准；被 Sandbox 阻擋的指令會失敗，不會要求升權 |
| `cx.yolo` | 共用偏好，但停用核准與 Sandbox |
| `codex` | 原本的本機設定，不選擇這份 Profile |

`--yolo` 是 `--dangerously-bypass-approvals-and-sandbox` 的別名，不會保留 Profile 的檔案或網路 Sandbox 限制（[CLI 參考](https://learn.chatgpt.com/docs/cli/reference)）。Claude Code 在 Bypass mode 保留明確 deny 規則是另一種機制；OS 權限與外部隔離仍然存在。

共用檔案宣告 `default_permissions` 與 `[permissions]`。這套 Beta permission profile 不能和舊式 `sandbox_mode`／`sandbox_workspace_write` 混用：任何已載入設定檔出現 `sandbox_mode`，Codex 就改用舊式設定。因此，依賴 Profile 的 deny 規則前，先檢查保留的基礎設定（[Permission profile 文件](https://learn.chatgpt.com/docs/permissions)）。這份 Gist 為 Windows／WSL／Linux 設定 `glob_scan_max_depth = 10`；目錄更深的專案與啟動掃描成本需另行評估。

## 共用背景伺服器限制

在 macOS 使用 Codex CLI `0.162.1`，選擇這份 Profile 時實測出現：

```text
Running without the shared background server: --profile requires embedded mode.
```

Profile 仍會載入，但這次執行使用自己的 Embedded server。兩個捷徑都受此限制，與 YOLO 無關。`cx --no-daemon` 或 `cx.yolo --no-daemon` 只是明確選擇此模式、避免自動切換提示，不會重新支援共用 Daemon。

如果工作流程需要 `codex agents` 的集中即時 Session 管理，或共用 Daemon 的 Remote control，應改把共用偏好套用到各機器的 `config.toml`。這與 Herdr 維持 Pane 行程存活是不同層次。Windows 執行行為尚未實機驗證，完整限制見 Gist README；升級 Codex 後需重新確認。

## 建議配置：自動審核

日常工作保留 Sandbox，讓 Reviewer agent 處理符合條件的核准請求：

```toml
approval_policy = "on-request"
approvals_reviewer = "auto_review"
default_permissions = "secure-workspace"
```

這會選擇共用 Gist 已定義的 `[permissions.secure-workspace]` policy。從所有生效的配置層移除舊式 `sandbox_mode` 與 `[sandbox_workspace_write]`，避免覆蓋它。保留檔案 deny，只開放任務需要的目錄、快取與網路目的地。若啟用指令網路與網域規則，也要啟用 `features.network_proxy`；只有網域表格不會強制過濾。詳見 [Permissions](https://learn.chatgpt.com/docs/permissions)。

`cx` 刻意不加 `-a never`：[Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review) 需要核准請求才有東西可審。Sandbox 內的日常工作直接執行，符合條件的升權請求則交給獨立 Agent。獲准升權的動作可能在 Sandbox 外執行，因此審核是授權判斷，不是絕對禁止存取資源的邊界。Computer Use 的 App 核准等部分能力仍會詢問使用者，自動審核也會增加模型請求用量。

需要阻擋動作直接失敗、不升權時，用 `cx -a never`。`cx.yolo` 則留給有外部隔離邊界的環境。Permission profile 管理本機 Sandbox 指令；MCP、Connector、Browser 與 Computer Use 需要各自的控制。隔離 Harness 時，不要掛載完整家目錄或高權限 Socket，憑證只提供必要範圍。

## 切換 YOLO 會影響 Prompt cache 嗎？

[OpenAI API 快取指南](https://developers.openai.com/api/docs/guides/prompt-caching)建議保持對話歷史與工具定義穩定，但沒有建立 Codex CLI／訂閱切換核准或 Sandbox 模式時的保證。若模式切換改變模型可見的指示、工具或較早的脈絡，快取重用可能改變；這是依快取機制推論，不是 YOLO 實測結果。

不能直接說切換 YOLO 一定清空快取，也不能保證完全不影響。應在模型、Effort、工具、對話、間隔與 Client 版本不變時，比較各次模型請求。[既有的對話／快取觀察](/zh-tw/blog/cache-session-habits/)測的是 Effort 切換，不是 Permission mode，不能拿來證明 YOLO 的行為。這篇沒有另外執行付費推論實驗。

## CLI 編輯會寫入哪個檔案？

Profile 是配置覆寫層，不是雙向同步。選擇 `shared` 不會刪除基礎 `config.toml` 已有的值，也不會把所有 Profile 設定複製回去。

我在 macOS 使用 Codex CLI `0.162.1`，以 `--profile shared` 啟動，在 `/statusline` 調整順序並儲存。Codex 把 `tui.status_line` 寫入已定義該欄位的 `shared.config.toml`，基礎 `config.toml` 沒有改變。調整後的順序為：

```toml
[tui]
status_line = ["model-with-reasoning", "five-hour-limit", "weekly-limit", "context-remaining", "run-state", "project-name", "git-branch"]
```

這確認了此環境中的編輯器會更新所選 Profile。其他指令可能寫入不同的層，例如 [`codex features enable/disable`](https://learn.chatgpt.com/docs/developer-commands#codex-features) 會寫入基礎 `config.toml`，也不接受 `--profile`。修改其他 CLI 設定後，仍需檢查對應檔案；本機變更不會自動上傳 Gist 或傳到另一台機器。

## 驗證與切回

先執行 `codex --profile shared --strict-config`，再用 `/status` 與 `/permissions` 檢查。檔案 deny 請用可丟棄的測試檔驗證，且不要在 YOLO 模式測試。本機 Plugin 與 Hook 另行確認；成功解析設定不代表 Sandbox 規則已生效。

`cx resume` 可沿用 Profile 延續對話；若只要使用本機基礎設定，直接執行 `codex`。
