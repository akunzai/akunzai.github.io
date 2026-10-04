---
title: "Herdr 在 macOS：Ghostty、Zsh 與 Homebrew"
description: 在 Mac 上用 Herdr 同時執行 Claude Code、Codex 等 Coding Agent 時，終端機、Shell、Prompt 與套件管理工具中哪些選擇真正重要。
sidebar:
  order: 8
---

本篇說明 Herdr 底下的 macOS 各層設定。Herdr 的模型、按鍵與 Plugin 請先閱讀 [Herdr 基礎](../herdr-getting-started/)；Windows 使用者請看 [Herdr 在 Windows](../herdr-terminal-windows/)。

---

## 1. 外層終端機：Ghostty

### 使用 Nerd Font，且選 Mono 變體

Starship Prompt 會使用 Private Use Area 的圖示，Herdr 的符號狀態指示與側邊欄也仰賴乾淨的字形渲染。沒有 [Nerd Font](https://www.nerdfonts.com/) 時，這些圖示會變成豆腐方塊。建議選 **Mono** 變體（`JetBrainsMono Nerd Font Mono`）：它把圖示限制在單一格寬，Pane 邊框與側邊欄的格線才不會位移。

### 讓 Option 以 Alt 傳到 Shell

Herdr、Shell 與編輯器都會用到 `Alt` 組合鍵。macOS 的終端機必須設定成把 Option 當作 Alt，否則 Option+方向鍵會輸出 `;3D`，而不是以單字為單位移動（[Herdr 文件有說明](https://herdr.dev/docs/troubleshooting/)）。

```text
# 左 Option 當作 Alt；右 Option 保留給輸入特殊字元
macos-option-as-alt = left
```

### 別讓終端機的快速鍵擋住 Herdr

Herdr 的 Prefix 是 `ctrl+b`，不用 Prefix 的組合鍵在 `ctrl+alt` 上最穩定，所以終端機本身不該佔用這些組合。我的 Ghostty Gist 把分割視窗的導覽移到 `super+ctrl+方向鍵`。既然用 Herdr 當多工器，你很少需要終端機自己的分割，但仍要確保組合鍵不衝突。

對 Agent 工作流實用的其他小設定：

- **大容量 Scrollback**（`scrollback-limit = 100000`）：Agent 的輸出很長，而你通常事後才閱讀。
- **選取即複製**（`copy-on-select = true`）。
- **Kitty graphics**：Ghostty 支援它，因此可在 Herdr 的 `config.toml` 啟用 `[experimental] kitty_graphics = true`。

參考 Gist：[Ghostty 設定](https://gist.github.com/akunzai/34b4531b686a2dbf79ba8abc419e7492)（`config.ghostty`）。

---

## 2. Shell：讓非互動式 Shell 也能正常運作

最昂貴的錯誤，是只設定了*你自己*輸入指令的那個 Shell。Agent 是透過**非互動式** Shell 執行指令的，它們不會讀取 `.zshrc`，所以在你的 Pane 裡正常的 `PATH`，到了 Agent 的工具呼叫裡就失效。

依檔案被讀取的時機分工：

| 檔案 | 誰會讀取 | 該放什麼 |
| :--- | :--- | :--- |
| `~/.zshenv` | 所有 zsh，包含 Agent 的工具 Shell | `PATH`、`XDG_BIN_HOME`、環境變數、非互動情境下的 mise 啟用 |
| `~/.zprofile` | Login Shell | Homebrew `shellenv` |
| `~/.zshrc` | 僅互動式 Shell | Prompt、自動補全、別名、外掛 |

我的 `.zshenv` Gist 中，真正發揮作用的寫法：

```bash
# 非互動式 Shell（Coding Agent）不會讀 ~/.zshrc，因此在這裡載入 mise。
if [[ $- != *i* ]]; then
  [[ -d /opt/homebrew/bin ]] && export PATH="/opt/homebrew/bin:$PATH"
  command -v mise &>/dev/null && eval "$(mise hook-env -s zsh)"
fi
```

互動式 Shell 則改在 `.zshrc` 使用 `mise activate zsh`，它會掛上 Prompt hook，對 Agent 而言是多餘的負擔。

### 為長壽命 Session 固定 `SSH_AUTH_SOCK`

Herdr Session 會比你的 SSH 登入與終端機視窗活得更久。若 `SSH_AUTH_SOCK` 指向每次登入轉送的 Socket，它會隨該次登入一起消失，導致仍在執行的 Pane 內 Commit 簽署失效。解法是固定一個 Socket 路徑（`~/.ssh/agent.sock`），並在 Shell 啟動時自我修復。完整推導請見 [SSH 金鑰與安全](../ssh-keys-security/)；Gist 的 `.zshenv` 有支援 Keychain 的版本。

> [!WARNING]
> 若 Herdr server 是第一次從 SSH 登入啟動，它無法存取 Keychain。遇到時請執行 `herdr server stop`，再從一般的 GUI 終端機重新啟動 Herdr（見[疑難排解](https://herdr.dev/docs/troubleshooting/)）。

參考 Gist：[Zsh Profile](https://gist.github.com/akunzai/616796de59282c8bfdae3005511c588e)（`.zshenv`、`.zprofile`、`.zshrc`）。

---

## 3. Prompt：Starship

[Starship](https://starship.rs/) 是單一執行檔搭配單一 `starship.toml`。對 Agent 工作流有兩個關鍵選擇：

- **只在 SSH 時顯示主機名稱**（`ssh_only = true`），讓你一眼就知道 Pane 是本機還是遠端。
- **維持速度**（設定 `command_timeout`，並停用不需要的模組，例如 `nodejs` 與 `package`）。每個 Agent 指令之後 Prompt 都會重繪。

我的設定採用 Catppuccin 色板，與 Herdr 主題一致：[Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5)。請把 Starship 的初始化放在 `.zshrc` 的**最後**，位於自動補全與外掛之後，避免拖慢其他項目。

---

## 4. 用 Homebrew 與 mise 安裝一切

不要手動下載安裝程式。

- **GUI 軟體與字型**：Homebrew。
- **開發用 CLI**：[mise](https://mise.jdx.dev/)，讓*同一份*全域 `config.toml` 在 Windows 也能使用。

```bash
brew install --cask ghostty font-jetbrains-mono-nerd-font
brew install mise zsh-autosuggestions zsh-fast-syntax-highlighting
```

```toml
# ~/.config/mise/config.toml
[tools]
herdr = "latest"
starship = "latest"
fzf = "latest"
zoxide = "latest"
ripgrep = "latest"
fd = "latest"
neovim = "latest"
```

```bash
mise install
```

> [!TIP]
> Herdr 也能用 `brew install herdr` 安裝。請依 [Herdr 基礎](../herdr-getting-started/#安裝)的說明，只選一種來源。

---

## 驗收清單

| 檢查項目 | 指令 / 檢視方式 | 預期結果 |
| :--- | :--- | :--- |
| 字型 | 開啟 Herdr，觀察側邊欄與 Starship Prompt | 沒有豆腐方塊，邊框對齊 |
| Alt 鍵 | 在 Shell 提示列按 Option+Left | 以單字為單位移動，沒有 `;3D` |
| Agent 工具 Shell | `zsh -c 'command -v mise'` | 不需載入 `.zshrc` 即可找到 |
| Agent 環境 | 請 Agent 執行 `which node` | 與 mise 選定的版本一致 |
| Pane 內簽署 | 在 Herdr Pane 執行 `ssh-add -l` | 重新連線後仍列出你的金鑰 |
| 重新連線 | 關閉終端機後執行 `herdr` | Session 與 Agent 都還在 |

---

## 參考資料

- [Herdr：Troubleshooting](https://herdr.dev/docs/troubleshooting/) — Option 當 Alt、Keychain 與 server 重啟問題
- [Herdr：Keyboard](https://herdr.dev/docs/keyboard/) — 各終端機的預設快速鍵衝突
- [Ghostty configuration](https://ghostty.org/docs/config) — 上述終端機設定的選項參考
- [Starship Configuration](https://starship.rs/config/) — Prompt 模組、色板與效能選項
- [mise 文件](https://mise.jdx.dev/) — 全域工具設定與 Shell 啟用
- [Homebrew](https://brew.sh/) — macOS 的套件管理工具
- [Nerd Fonts](https://www.nerdfonts.com/) — 內含開發者圖示的修補字型
