---
title: "現代開發者的身分基石：SSH 金鑰與安全實務"
description: 捨棄 RSA，全面轉向 Ed25519。深入剖析 SSH 金鑰生成、Passphrase 保護、多金鑰管理與 Agent 安全邊界。
sidebar:
  order: 2
---

在 AI agents 能夠自動生成程式碼的今天，身分認證（Authentication）與存取控制（Access Control）卻是無可妥協的工程底線。任何遠端操作——不論是將程式碼推送到 GitHub/GitLab、登入開發跳板機、或是部署服務——其權限的起點都建立在你的 **SSH 金鑰** 上。

如果金鑰遺失、洩漏或配置混亂，可能導致整間公司的程式碼庫遭受未授權篡改，而日誌上記錄的卻是你的名字。

本篇將從現代加密演算法出發，逐步帶你建立一套專業、高安全度且日常使用完全無痛的 SSH 環境。

---

## 1. 告別歷史：為什麼全面採用 Ed25519？

過去二十年間，RSA 一直是 SSH 的代名詞。然而在現代軟體工程中，**RSA 已經不再是首選**：

- **安全性評級**：小於 2048 位的 RSA 已經被視為不安全；即便使用 RSA 3072 或 4096 位，其抗暴力破解演算法的價效比也遠不如現代橢圓曲線密碼學。
- **效能與體積**：RSA 4096 位的金鑰長度龐大，加解密運算開銷顯著；而 **Ed25519**（基於 Edwards-curve 25519）金鑰僅有 68 個字元長，計算速度極快且天生免疫旁路攻擊（Side-channel attacks）。
- **廣泛支援**：自 OpenSSH 6.5（2014 年）起即獲得原生支援，如今 GitHub、GitLab、主流 Linux 發行版與 macOS 均預設完美相容。

> 💡 **判斷準則**：除非需要連線至 10 年以上無人維護的老舊嵌入式系統或 Legacy 伺服器，否則**所有新環境一律只生成 Ed25519 金鑰**。

---

## 2. 生成第一把金鑰：必備參數與 Passphrase

打開終端機，執行以下指令生成 Ed25519 金鑰對：

```bash
ssh-keygen -o -a 100 -t ed25519 -C "your_email@example.com"
```

### 關鍵參數解析
- `-t ed25519`：指定使用 Ed25519 演算法。
- `-C "your_email@example.com"`：為公鑰加上註解（Comment）。強烈建議填寫個人或公司公務信箱，方便日後在伺服器 `authorized_keys` 或 GitHub/GitLab 介面上辨識金鑰歸屬。
- `-o`：強制使用 OpenSSH 新式金鑰格式（相較於舊式 PEM 格式，更具備抗暴力破解機制）。
- `-a 100`：指定金鑰導出函數（KDF，基於 bcrypt）迭代計算 100 次。這會大幅增加攻擊者在私鑰被盜取時使用暴力窮舉密碼的運算成本，而對你日常登入幾乎感覺不到延遲。

### 為什麼私鑰「必須」設定 Passphrase？
在執行過程中，`ssh-keygen` 會提示輸入密碼（Passphrase）：

```text
Enter passphrase (empty for no passphrase):
```

很多新手看到 `empty for no passphrase`，就像看到免死金牌一樣毫不猶豫地連按兩次 Enter 留空。心裡想著：*「反正我這只是本機開發，等之後正式上線我再來補密碼」*——這句軟體開發界名言的可靠程度，大概就跟「我下週一開始一定會早起去健身房」差不多。

**不設密碼的私鑰，本質上就像是一張貼在筆電背面的明信片，上面寫滿了你的帳號權限**：
- 一旦你的筆電在咖啡廳被順手牽羊、硬碟備份意外上傳至公開 S3、或是被某個假冒 npm 套件植入了資訊竊取木馬（InfoStealer），任何人只要拿到你的 `~/.ssh/id_ed25519`，就能瞬間以你的名義登入伺服器或篡改整個公司的程式庫。
- 加了 Passphrase 的私鑰是一份透過 bcrypt 高強度加密的加密容器；即便檔案實體外洩，在缺乏密碼的情況下，攻擊者用超級電腦算到天荒地老也只能乾瞪眼。

---

## 3. 免密體驗：讓 ssh-agent 代勞記憶密碼

「每次 `git push` 都要輸入一串長密碼，不是很反人類嗎？」

現代作業系統提供了金鑰代理（`ssh-agent`），能將解密後的私鑰暫存在記憶體中。配合系統原生密碼庫，你可以做到：**僅在開機或首次連線時解鎖一次，後續完全靜默免密**。

### macOS：整合系統 Keychain
在 macOS 上，OpenSSH 深度整合了系統鑰匙圈（Keychain）。

建立或編輯 `~/.ssh/config`，加入以下配置：

```ssh-config
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

執行以下指令將私鑰 Passphrase 一次性寫入 macOS 鑰匙圈：

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

日後重新開機時，macOS 會自動透過 Keychain 解鎖並載入私鑰至 `ssh-agent`，既享有高強度 Passphrase 的保護，又兼具零干擾的開發體驗。

### Windows：啟用 OpenSSH Authentication Agent 服務
Windows 10/11 內建了 OpenSSH，但其背景服務預設是停用的。請以**系統管理員身分**開啟 PowerShell 執行：

```powershell
# 設定服務啟動類型為「自動」並立即啟動
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent

# 確認服務運行狀態
Get-Service ssh-agent
```

接著新增金鑰至 agent（此時會提示輸入一次 passphrase）：

```powershell
ssh-add $HOME\.ssh\id_ed25519
```

---

## 4. 多金鑰管理核心技能：`~/.ssh/config` 配置心法

隨著工作展開，你通常會擁有至少兩把金鑰：
1. **個人金鑰**（`id_ed25519`）：用於個人的 GitHub 帳號與開源專案。
2. **公司公務金鑰**（`id_ed25519_company`）：用於公司內部的 GitLab / GitHub Enterprise 或跳板機。

當本機存在多把金鑰時，若缺乏妥善設定，極易遇到伺服器報錯：
```text
Received disconnect from ... port 22: 2: Too many authentication failures
```

### 為什麼會出現 `Too many authentication failures`？
SSH 用戶端連線時，預設會將 `ssh-agent` 內所有的金鑰**按順序一把一把嘗試登入**。這就像你帶著一串掛了十幾支鑰匙的龐大鑰匙圈在高級私人會所門口逐一試插，門口嚴格的保全（SSH 伺服器）在你看起來像個可疑闖入者之前，直接一腳把你踹出門（通常累積 5~6 次失敗就會無情中斷連線）。

### 必學良方：`IdentitiesOnly yes`
在 `~/.ssh/config` 中，透過 `Host` 規則搭配 `IdentitiesOnly yes`，強制用戶端**只使用指定的金鑰**進行認證：

```ssh-config
# 全域預設安全基線
Host *
  ForwardAgent no
  StrictHostKeyChecking ask

# GitHub 個人帳號
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes

# 公司內部 GitLab 伺服器
Host git.company.example.com
  HostName git.company.example.com
  User git
  IdentityFile ~/.ssh/id_ed25519_company
  IdentitiesOnly yes

# 開發跳板主機 (Jump Host)
Host bastion-dev
  HostName 10.0.1.10
  User alice
  IdentityFile ~/.ssh/id_ed25519_company
  IdentitiesOnly yes
```

有了上述配置：
- 當你執行 `git clone git@github.com:...` 時，SSH 只會拿 `~/.ssh/id_ed25519` 去認證。
- 當你連線至公司 GitLab 時，只會拿公務金鑰，絕不互相干擾，更不會觸發登入嘗試超限。

---

## 5. 安全界線：謹慎使用 SSH Agent Forwarding

在需要透過跳板機（Bastion / Jump Server）連入內網主機的場景，新人常會看到一種做法：**開啟金鑰轉發（Agent Forwarding）**。

轉發的原理是：本地的 `ssh-agent` 透過 SSH 連線通道為遠端主機提供認證服務，因此你不需要把私鑰複製到遠端伺服器上。

但請牢記這條安全天條：
> ⚠️ **切勿在 `Host *` 全域設定 `ForwardAgent yes`！**

### 風險在哪裡？（想想 xz-utils 的教訓）
自從 2024 年震撼整個開源界的 xz-utils 後門事件之後，工程界對軟體供應鏈與權限橫向移動（Lateral Movement）的警惕達到了歷史新高。

如果轉發的目標伺服器遭到入侵，或該伺服器的 `root` 管理員不可信，惡意人士可以直接透過該伺服器上的轉發 Unix Socket，以你的名義向你的本地 `ssh-agent` 發起認證請求，進而橫向滲透你在其他內部系統上的所有資源——這就像允許陌生伺服器把手直接伸進你的口袋裡翻鑰匙一樣危險。

### 最佳實踐：最小權限與精確授權
僅在真正需要轉發的中繼主機上單獨開啟：

```ssh-config
# 僅對信任且必要的遠端主機開啟轉發
Host bastion.company.example.com
  ForwardAgent yes
  IdentityFile ~/.ssh/id_ed25519_company
```

更好且更現代的做法是使用 OpenSSH 的 **`ProxyJump`**（跳板代理），它在傳輸層直接轉發流量，兩端主機維持端對端（End-to-End）加密，連 Agent Forwarding 的風險都不復存在：

```ssh-config
# 透過 bastion 直接連線至內網私有伺服器
Host internal-db
  HostName 192.168.10.50
  User dbadmin
  ProxyJump bastion.company.example.com
  IdentityFile ~/.ssh/id_ed25519_company
```

---

## 總結檢查清單（Checklist）

完成本章設定後，請執行以下步驟自我查核：

- [ ] 是否已捨棄舊版 RSA，改用 `ssh-keygen -t ed25519` 生成金鑰？
- [ ] 私鑰是否有設定高強度 Passphrase，而非空白？
- [ ] 是否已設定作業系統 Agent（macOS Keychain / Windows Service）達成免密使用？
- [ ] `~/.ssh/config` 中是否已針對不同 Host 配置 `IdentitiesOnly yes`？
- [ ] 是否確認全域 `ForwardAgent no`，避免憑證濫用風險？

完成了身分認證的基石之後，下一篇我們將深入探討版本控制的核心——[現代 Git 必備全域配置與避坑指南](./git-core-configuration/)。

---

## 參考資料

- [OpenSSH 官方手冊：ssh-keygen(1)](https://man.openbsd.org/ssh-keygen.1) — 金鑰生成、演算法選型（Ed25519）與 KDF rounds 參數規範
- [OpenSSH 官方手冊：ssh_config(5)](https://man.openbsd.org/ssh_config.5) — `IdentitiesOnly`、`ProxyJump` 與 `AddKeysToAgent` 配置說明
- [GitHub 文件：Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) — SSH 金鑰建立、新增至帳戶與連線測試指引
- [GitLab 文件：Use SSH keys to communicate with GitLab](https://docs.gitlab.com/ee/user/ssh.html) — GitLab SSH 驗證與金鑰管理策略
- [Microsoft Learn：Key management with OpenSSH on Windows](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement) — Windows 內建 OpenSSH 服務與金鑰權限管理
