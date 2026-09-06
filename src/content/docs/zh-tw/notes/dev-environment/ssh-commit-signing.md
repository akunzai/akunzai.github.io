---
title: "不可否認的程式碼承諾：基於 SSH 的 Git Commit 數位簽署"
description: 告別 GPG 的複雜噩夢！利用 Git 原生支援的 SSH 金鑰進行 Commit 數位簽名，建立防偽造與合規的工程信任鏈。
sidebar:
  order: 4
---

在團隊中，你是否曾看過有人送出 Commit 時，大頭貼與名字顯示為他人，或是由不知名的機器人帳號發出？

在 Git 的底層設計中，**Commit 的作者資訊（Author Name 與 Email）本質上只是毫無防護的純文字字串**。不信的話，你現在打開終端機輸入：
```bash
git commit --amend --author="Linus Torvalds <torvalds@linux-foundation.org>"
```
Git 會面不改色地把 Linux 之父的大名寫進你的專案歷史裡。要是你順手改成某些矽谷巨頭的名字，甚至能讓不知情的人以為他們半夜偷偷跑來幫你的開源專案修 Bug。

在 AI Coding Agents 盛行的當下，大量程式碼由輔助工具生成後再交由人類檢驗合併。如何確保「這個 Commit 確實是由具備主權與責任能力的工程師親自審核並送出」？答案就是：**數位簽章（Commit Signing）**。

---

## 1. 為什麼選擇 SSH Signing，而不是 GPG？

多年以來，Git 簽章的唯一主流是 **GPG（GNU Privacy Guard）**。但在實務上，90% 的工程團隊推行 GPG 時都會遭遇「集體抗拒」：

- **工具鏈臃腫**：需要額外安裝 `gpg`、`pinentry`，且在 Windows 與 macOS 上的守護程序（`gpg-agent`）動不動就死結或休眠。
- **金鑰管理繁瑣**：GPG 金鑰有過期時間、主金鑰/子金鑰結構複雜，其配置體驗宛如**蒙著雙眼、拿著缺損的六角扳手在狂風中組裝 IKEA 家具**。
- **維護成本過高**：新人進公司往往要花半天除錯令人生無可戀的 `error: gpg failed to sign the data`。

### 現代救星：Git 原生 SSH 簽名
自 **Git 2.34**（2021 年底釋出）起，Git 正式支援直接使用 **SSH 金鑰** 進行簽章與驗證！

這意味著：**你在先前的 [SSH 金鑰安全配置](./ssh-keys-security/) 中生成的 `id_ed25519` 金鑰，既可以用來做遠端驗證與 Push，也可以直接拿來為程式碼簽名！** 不需要額外安裝任何軟體、不需要管理兩套金鑰，完全無痛。

---

## 2. 三步啟用 SSH Commit 簽章

請打開終端機，執行以下三行全域配置：

```bash
# 1. 將簽章格式從預設的 openpgp 改為 ssh
git config --global gpg.format ssh

# 2. 指定用來簽名的公鑰路徑 (注意：填寫 .pub 公鑰檔案即可)
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# 3. 啟用所有 commit 預設強制簽名
git config --global commit.gpgsign true
```

> 💡 **為什麼 `signingkey` 是填公鑰（`.pub`）？**  
> 這是 OpenSSH 簽名機制的精妙之處。Git 讀取公鑰以取得金鑰特徵碼（Fingerprint），簽署時會直接呼叫本地的 `ssh-agent` 或搜尋對應的私鑰來完成密碼學簽署。因此你的私鑰仍然受到 Passphrase 與安全記憶體的嚴格保護。

### 額外好習慣：為 Git Tag 也啟用簽章
發布正式版本（Release Tag）是軟體供應鏈安全的最關鍵節點：
```bash
git config --global tag.gpgsign true
```

---

## 3. 在 GitHub 與 GitLab 顯示「Verified」綠色徽章

當你把簽名過的 Commit 推送到雲端平台時，平台需要知道這把簽名金鑰是否屬於你的帳號。

### GitHub 設定步驟
1. 複製你的公鑰內容：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
2. 進入 GitHub **Settings** → **SSH and GPG keys**。
3. 點選 **New SSH Key**：
   - **Key type**：請務必下拉選擇 **Signing Key**（如果之前已經加過作為 Authentication Key，請在此處重新加一次並標註用途）。
   - 貼上公鑰內容並儲存。

### GitLab 設定步驟
1. 進入 GitLab **Preferences** → **SSH Keys**。
2. 貼上公鑰內容：
   - 在 **Usage type** 下拉選單中，選擇 **Authentication & Signing**（或專門選擇 Signing）。
   - 點選 **Add key**。

設定完成後，你推送的每一次 Commit，在 GitHub / GitLab 的提交歷史上就會點亮耀眼的 **Verified** 徽章！

---

## 4. 本地端簽名驗證：建立 `allowed_signers`

在雲端平台上，平台會代為比對公鑰；但在本地端，當你執行 `git log --show-signature` 時，Git 預設並不知道哪些人的金鑰是可信任的，因而會顯示警告：
```text
Good "ssh" signature for user@example.com with ED25519 key ...
No signature found in allowed signers list.
```

### 配置信任簽署著名單（Allowed Signers）
若希望在本地端也能嚴格驗證同事或自己的簽名，我們需要建立一份信任清單：

```bash
# 建立配置目錄與簽名信任檔
touch ~/.config/git/allowed_signers

# 告訴 Git 本地信任清單的位置
git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers
```

### 加入信任公鑰
`allowed_signers` 的格式遵循 OpenSSH 規範（`<身分識別> <金鑰類型> <Base64金鑰本體>`）：

```text
# ~/.config/git/allowed_signers
user@example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
alice@company.example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
bob@company.example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
```

設定完成後，再次執行：
```bash
git log --show-signature
```
你將看到確鑿無疑的驗證結果：
```text
Good "ssh" signature with ED25519 key SHA256:...
Verified that the code came from user@example.com
```

---

## 5. 工程素養：簽名代表的承諾

在導入數位簽章後，請記住一項重要的心理轉變：

> **簽名等同於你在法律合約上的親筆簽名。**

- 當你使用你的金鑰簽署一個 Commit，代表你**對這份程式碼負起工程與法律責任**。
- 如果這段程式碼是由 AI Agent 生成的，在你點選提交、觸發簽章的那一瞬間，就代表你已經仔細審查（Review）過程式碼邏輯、確認無安全漏洞與敏感憑證洩漏，並以你的個人名譽對其結果背書。

在下一篇中，我們將進入企業多環境實戰：[企業級多身分隔離與 GitLab CI / Agent Skills 整合實踐](./multi-identity-gitlab-agent-skills/)，探討如何利用 Git 的動態條件引入機制（`includeIf`）以及官方 Agent Skills，優雅隔離**個人開源身分**與**公司企業身分**。

---

## 參考資料

- [Git 官方手冊：Git Tools - Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) — Git 2.34+ SSH 金鑰數位簽署與驗證機制詳解
- [GitHub 文件：About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) — 提交數位簽章原理、信任鏈與 Verified 綠色徽章
- [GitHub 文件：Telling Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key) — 配置 SSH 簽署金鑰與 `allowed_signers` 本地信任庫
- [GitLab 文件：Sign commits with SSH keys](https://docs.gitlab.com/ee/user/project/repository/signed_commits/ssh.html) — GitLab 伺服器端 SSH 簽署金鑰驗證與稽核指引
