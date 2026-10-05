---
title: "Herdr 在 macOS：Ghostty、Zsh 與 Homebrew"
description: 在 Mac 上用 Herdr 同時執行 Claude Code、Codex 等 Coding Agent 時，終端機、Shell、Prompt 與套件管理工具中哪些選擇真正重要。
sidebar:
  order: 8
---

本篇說明 Herdr 底下的 macOS 各層設定。Herdr 的模型、按鍵與 Plugin 請先閱讀 [Herdr 基礎](../herdr-getting-started/)；Windows 使用者請看 [Herdr 在 Windows](../herdr-terminal-windows/)。

---

## 外層終端機：Ghostty

### 使用 Nerd Font，且選 Mono 變體

若 Starship Prompt 設定使用 Nerd Font 圖示，就需要 [Nerd Font](https://www.nerdfonts.com/) 或相容的 fallback 字型。建議選 **Mono** 變體（`JetBrainsMono Nerd Font Mono`），讓圖示使用單一格寬。Herdr 的一般 Unicode 狀態符號本身不需要 Nerd Font；請分別檢查 Prompt 圖示與 Pane 的對齊。

### 讓 Option 以 Alt 傳到 Shell

Herdr、Shell 與編輯器都會用到 `Alt` 組合鍵。先設定 Ghostty，讓左 Option 以 Alt 傳送：

```text
# 左 Option 當作 Alt；右 Option 保留給輸入特殊字元
macos-option-as-alt = left
```

若 Option+方向鍵仍輸出 `;3D` 或 `;3C`，請在 `.zshrc` 加入以下綁定，放在 `bindkey -e` 或 `bindkey -v` 之後。Herdr 會保留帶修飾鍵的方向鍵序列，Shell 必須知道如何處理（見[疑難排解](https://herdr.dev/docs/troubleshooting/)）。

```sh
bindkey $'\e[1;3D' backward-word
bindkey $'\e[1;3C' forward-word
```

### 別讓終端機的快速鍵擋住 Herdr

Herdr 的 Prefix 是 `ctrl+b`，不用 Prefix 的組合鍵在 `ctrl+alt` 上最穩定，所以終端機本身不該佔用這些組合。我的 Ghostty Gist 把分割視窗的導覽移到 `super+ctrl+方向鍵`。既然用 Herdr 當多工器，你很少需要終端機自己的分割，但仍要確保組合鍵不衝突。

對 Agent 工作流實用的其他小設定：

- **Scrollback 以 bytes 計算**：Ghostty 的 `scrollback-limit = 100000` 約為 100 KB，不是 10 萬行。例如 `10000000` 可提供每個終端機 surface 約 10 MB。Herdr 另以 `[advanced] scrollback_limit_bytes` 保留各 Pane 的歷史。
- **選取即複製**（`copy-on-select = true`）。
- **Kitty graphics**：Ghostty 支援它，因此可在 Herdr 的 `config.toml` 使用 `[terminal] kitty_graphics = true`（預設已啟用；`[experimental]` 是舊版相容設定）。

參考 Gist：[Ghostty 設定](https://gist.github.com/akunzai/34b4531b686a2dbf79ba8abc419e7492)（`config.ghostty`）。

---

## Shell：讓非互動式 Shell 也能正常運作

最昂貴的錯誤，是只設定了*你自己*輸入指令的那個 Shell。Agent 工具經常透過**非互動式** Shell 執行指令。非互動式 zsh 不會讀取 `.zshrc`，因此僅供互動情境的工具設定可能缺席。子行程也會繼承親代行程的環境；實際讀取哪些啟動檔，取決於 harness 使用 Login Shell、互動式 Shell，或其他 Shell。

依檔案被讀取的時機分工：

| 檔案 | 誰會讀取 | 該放什麼 |
| :--- | :--- | :--- |
| `~/.zshenv` | 所有 zsh，包含 Agent 的工具 Shell | `PATH`、`XDG_BIN_HOME`、環境變數、非互動情境下的 mise 啟用 |
| `~/.zprofile` | Login Shell | Homebrew `shellenv` |
| `~/.zshrc` | 僅互動式 Shell | Prompt、自動補全、別名、外掛 |

我的 `.zshenv` Gist 中，真正發揮作用的寫法：

```bash
# Non-interactive zsh does not read ~/.zshrc; load the startup mise context here.
if [[ $- != *i* ]]; then
  # Prepend both Homebrew locations, with Apple silicon taking precedence.
  for brew_bin in /usr/local/bin /opt/homebrew/bin; do
    [[ -d "$brew_bin" ]] && path=("$brew_bin" $path)
  done
  typeset -U path
  command -v mise &>/dev/null && eval "$(mise hook-env -s zsh)"
fi
```

互動式 Shell 則在 `.zshrc` 評估啟用指令稿：

```sh
eval "$(mise activate zsh)"
```

上述 `.zshenv` hook 只會依啟動目錄選取一次工具。若 Agent 在同一個 Shell 內切換目錄，請用 `mise exec -- <command>` 或 `mise run <task>` 重新載入目標專案的工具與環境。`.zshenv` 也會用於指令稿，請保持精簡且不輸出訊息。

### 為長壽命 Session 固定 `SSH_AUTH_SOCK`

Herdr Session 會比你的 SSH 登入與終端機視窗活得更久。若 `SSH_AUTH_SOCK` 指向每次登入轉送的 Socket，它會隨該次登入一起消失，導致仍在執行的 Pane 內 Commit 簽署失效。本機簽署可使用固定的本機 Agent Socket（`~/.ssh/agent.sock`），並在 Shell 啟動時檢查健康狀態，避開每次登入的依賴。若刻意使用 Agent forwarding，請保留轉送的 Socket；替換它會改變可用的金鑰。完整推導請見 [SSH 金鑰與安全](../ssh-keys-security/)；Gist 的 `.zshenv` 有支援 Keychain 的版本。

> [!WARNING]
> 從 SSH 或背景工作啟動的 server 可能無法存取互動式 Keychain。若依賴 Keychain 的工具失敗，請先完成或儲存執行中的工作，再執行 `herdr server stop`；它會終止所有 Pane 行程。接著從 GUI 終端機重新啟動 Herdr（見[疑難排解](https://herdr.dev/docs/troubleshooting/)）。

參考 Gist：[Zsh Profile](https://gist.github.com/akunzai/616796de59282c8bfdae3005511c588e)（`.zshenv`、`.zprofile`、`.zshrc`）。

---

## Prompt：Starship

[Starship](https://starship.rs/) 是單一執行檔搭配單一 `starship.toml`。對 Agent 工作流有兩個關鍵選擇：

- **只在 SSH 時顯示主機名稱**（`ssh_only = true`），讓你一眼就知道 Pane 是本機還是遠端。
- **維持速度**（設定 `command_timeout`，並停用不需要的模組，例如 `nodejs` 與 `package`）。這有助於互動式 Pane；非互動式 Agent 工具呼叫通常不會顯示 Starship。

我的設定採用 Catppuccin 色板，與 Herdr 主題一致：[Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5)。請把 Starship 的初始化放在 `.zshrc` 的**最後**，位於自動補全與外掛之後，讓 Prompt 初始化接在其他互動式 Shell 設定之後。

---

## 用 Homebrew 與 mise 安裝一切

在受管理的 Mac 上，先確認 Homebrew 已配置，且你的帳號可寫入 Homebrew prefix。初次配置可能需要管理員權限；部分企業環境提權可能需要額外申請。配置完成後，一般 formula 的安裝與更新可由 prefix 擁有者執行。若 prefix 不可寫，不要以 `sudo brew` 執行；部分 Cask 也可能需要提權。

- **GUI 軟體與字型**：Homebrew。
- **開發用 CLI**：[mise](https://mise.jdx.dev/)，讓*同一份*全域 `config.toml` 在 Windows 也能使用。

```bash
export HOMEBREW_NO_SUDO=1
brew install --cask --appdir="$HOME/Applications" ghostty
brew install --cask font-jetbrains-mono-nerd-font
brew install mise zsh-autosuggestions zsh-fast-syntax-highlighting
```

`HOMEBREW_NO_SUDO=1` 讓 Homebrew 在需要提權時直接失敗；`--appdir="$HOME/Applications"` 將 Ghostty 放在使用者目錄，字型 Cask 預設寫入 `~/Library/Fonts`。需要 sudo 的 Cask 會在此設定下被拒絕安裝；若工具需要系統權限，請依所在環境的軟體安裝規範處理。

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
| Agent 環境 | 在同一專案比較 `zsh -c 'node --version'` 與 `mise exec -- node --version` | 版本相同；啟動情境不同時改用 `mise exec` |
| Pane 內簽署 | 在 Herdr Pane 執行 `ssh-add -l` | 重新連線後仍列出你的金鑰 |
| 重新連線 | 關閉終端機後執行 `herdr` | Session 與 Agent 都還在 |

---

## 參考資料

- [Herdr：Troubleshooting](https://herdr.dev/docs/troubleshooting/) — Option 當 Alt、Keychain 與 server 重啟問題
- [Herdr：Keyboard](https://herdr.dev/docs/keyboard/) — 各終端機的預設快速鍵衝突
- [Ghostty option reference](https://ghostty.org/docs/config/reference) — 上述終端機設定的選項參考
- [Starship Configuration](https://starship.rs/config/) — Prompt 模組、色板與效能選項
- [mise shims 與啟用方式](https://mise.jdx.dev/dev-tools/shims.html) — 互動式啟用與指令稿的明確執行方式
- [Zsh 啟動檔](https://zsh.sourceforge.io/Doc/Release/Files.html) — Login 與互動式啟動順序
- [Herdr 設定參考](https://herdr.dev/docs/config-reference/) — Kitty graphics 與各 Pane 的 Scrollback 上限
- [Homebrew](https://brew.sh/) — macOS 的套件管理工具
- [Nerd Fonts](https://www.nerdfonts.com/) — 內含開發者圖示的修補字型
- [Homebrew Installation](https://docs.brew.sh/Installation) — 非管理員帳號、Cask 與可寫入的安裝位置
