---
title: "Token Value Maxxing（1）INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "agents-md"]
description: "我把一個大型專案的 AGENTS.md 瘦身後做了對照實驗：規則遵守率兩邊都是 18/18，真正省下的是每個新 session 的快取寫入。順便聊聊我為什麼放棄自動記憶。"
---

:::note[Token Value Maxxing 系列]
0. [總綱：五個誤解與四個槓桿](/zh-tw/blog/token-value-maxxing/)
1. **INPUT：少送一點**（本篇）
2. [CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)
3. [MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)
4. REWORK：少做重工（撰寫中）
5. 分發：把 skills 沉澱下來（撰寫中）

延伸閱讀：[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)
:::

《功夫》裡火雲邪神說：「**天下武功，無堅不破，唯快不破。**」

寫 `AGENTS.md` 的人大概都聽過類似的心法：指令越短越好，短到 100 行以內，agent 才不會漏看規則。我也這麼相信，還把它寫進了自己的 skill。直到我真的量了一次。

---

## 一次瘦身，一個反直覺的結果

我手上有一個工作上的大型專案：.NET Framework 後端，加上一個 React Native App。2026 年 9 月 11 日，我用自己的 [`agents-md`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) skill 重整了它的 agent 指令：

| 範圍 | 瘦身前 | 瘦身後 |
|---|---|---|
| Root `AGENTS.md`（每個 session 都載入） | 10.4 KB | 5.9 KB（−43%） |
| 在 App 目錄工作時常駐的指令（root 加 nested） | 35.1 KB | 8.8 KB（**−75%**） |
| 所有 agent 文件總量（含按需讀取的 `docs/agents/*.md`） | 40.1 KB | 80.9 KB（**約 2 倍**，截至 9/23） |

知識沒有刪掉，反而還翻倍了；只是從「每回合都讀」搬到「需要時才讀」。

接著我做了對照實驗：同一份程式碼，只替換 agent 文件，分成瘦身前、瘦身後兩組。出 6 道題，每題都踩在一條兩個版本都**常駐**的規則上，例如「客戶實體是 `PersonAccount`，不是 `Account`」、「陰影只能用 `theme.shadow`」、「不准建立 `index.ts` barrel」。每題各跑 3 次，模型用 Sonnet 5，只給唯讀工具。

| 指標 | 瘦身前 | 瘦身後 |
|---|---|---|
| 規則遵守 | **18/18** | **18/18** |
| 第一回合寫入快取的專案指令 | 約 18.5k token | 約 8.8k token（**−53%**） |
| 36 次實驗總花費（牌價） | $1.54 | $0.84（−46%） |
| 平均回合數 | 2.5 | 2.2 |

**遵守率完全沒變。** 在 35 KB 這個量級，現代模型並不會因為指令多了就漏看規則。我原本相信的那句心法，至少在這個規模下沒有被證實。

回頭看，這和我寫 `agents-md` 時參考的 [A Complete Guide To AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md) 其實不矛盾。那篇引用 HumanLayer 的觀察：前沿的思考型模型大約能穩定遵守 150 到 200 項指令。我瘦身前的常駐指令約有 140 條列點，還在這個範圍內；是我自己把它簡化成「100 行」的門檻，說得比原意更嚴。

那瘦身到底省了什麼？

---

## 常駐成本的真實帳

總綱提過，快取讀取至少打 1 折。所以常駐指令每回合重送，在快取命中時其實很便宜。真正的帳在兩個地方：

1. **每個新 session 都要重新寫入快取。** 我實測 Claude Code 寫入的是 1 小時快取，價格是原價的 **2 倍**（Sonnet 5 為每百萬 token $4、Opus 5.5 為 $8，[官方定價](https://platform.claude.com/docs/en/about-claude/pricing)）。
2. **快取一失效，就全價重讀。** 換模型、改 effort、隔天接著聊，都會觸發。

以這次瘦身省下的約 9.7k token 計算，每開一個新 session，Sonnet 5 省約 $0.04，Opus 5.5 省約 $0.08。單次不多，但我 120 天開了數百個 session，而且這還只是一個專案。

另一個省下的是**回合數**：指令少了，agent 花在「讀完所有規則再開始」的力氣也少了。

所以我修正了 `agents-md` 的說法：指令預算的理由是**寫入成本**與**維護成本**，不是遵守率；「100 行」是經驗值，不是硬性門檻。這個專案的 root 現在是 144 行，多出來的是一張 Pointers 表格，本身就是索引。

---

## 寫成索引，不寫成手冊

`agents-md` 的核心規則只有一句：**一行指令要常駐，必須是每個任務都用得到，或是在環境裡查起來很貴。**

Root `AGENTS.md` 只放：

- 用一句話說明這個專案
- 套件管理工具（如果不是生態系預設）
- 建置與測試指令（只放非標準、或不易自行發現的）
- Pointers：指向領域文件、schema、範例測試與 skills
- Prevent Recurrence 規則

其餘都放到 Pointer 後面。以這個專案為例，瘦身後的 root 開頭是一段「**Never guess these three**」：只能在 Windows 建置、`Account` 不是客戶、未經要求不准開 merge request。這三件事猜錯會毀掉整個任務，所以常駐；其餘整理成一張表：要做什麼事，就讀哪份文件。

實驗裡有一次作答，agent 自己沿著 Pointers，去讀了對應的測試指引文件。按需讀取不是理論，它真的會用。

幾個容易踩的細節：

- **Pointer 用反引號路徑**，不要用 `@path` 或 Markdown 連結。Claude Code 與 Copilot CLI 會把 `@path` 直接展開成常駐內容，等於白瘦身。
- **能指向就不要複製。** `package.json`、設定檔與目錄結構才是真實來源；只有查起來很貴的事實，才值得在 `AGENTS.md` 快取一份。
- **Claude Code 現在會直接讀 `AGENTS.md`。** 我實測過，額外建一個指向它的 `CLAUDE.md` symlink 也只會載入一次，不會重複計費。

## Nested AGENTS.md：只放在自治邊界

大型 repo 可以在子目錄放 nested `AGENTS.md`，讓規則就近載入。但不是每個目錄都要一份：

- **只在自治邊界加**，例如一個獨立建置、有自己工具鏈的 App。`src/`、`tests/` 不需要各放一份。
- **它是轉接頭，不是第二本手冊。** 這個專案的 App 目錄原本有一份 24.8 KB 的 nested 檔，瘦身後剩 2.9 KB：一段「猜錯就毀任務」的限制、一段「做之前要先問」，其餘全是 Pointers。
- **決策消失就刪掉。**

---

## 記憶要有門檻：我為什麼放棄自動記憶

INPUT 的另一個來源是記憶。這部分我繞了一大圈。

2026 年 5 月，我陸續試了幾套記憶系統：

- **[MemPalace](https://github.com/MemPalace/mempalace)**：當時它會自動存入不相干的記憶，而我找不到明確刪除某條記憶的方法。
- **[context-mode](https://github.com/mksglu/context-mode)**：當時遇過工具呼叫異常。
- **[episodic-memory](https://github.com/obra/episodic-memory)**：我想在 Antigravity CLI 上用，但它不支援。它後來陸續加入了 Codex、Cursor、opencode 等工具，但截至 2026-09-28，支援清單裡仍然沒有 Antigravity CLI。

它們都想解決「agent 會失憶」的問題，但對我來說都太重了。於是我在 6 月自己寫了一套 `mem-auto`，同樣以自動擷取為主，還一路補上跨 agent 橋接與「擷取雜訊防護」。

轉折發生在 8 月。8 月 4 日，我把 `agents-md` 裡的自省機制（後來改名為 Prevent Recurrence）強化成「每個坑只記一處」：先用程式碼擋住，擋不住就在要修改的位置留註解，都不行才寫進主題文件。**隔天**，我就把整套 `mem-*` 合併成一個只在明確要求時才寫入的 skill，也就是現在的 [`agents-memory`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-memory)。

原因很簡單：值得記住的教訓，在解決問題的當下就由 Prevent Recurrence 放到了最低的那一層。剩下需要「記憶」的，只有使用者明確說「記住這個」的事。自動擷取能補的空缺，已經不存在了，留下的只有雜訊，而每一條雜訊都在消耗 context。

現在的 `agents-memory` 只做兩個決定：

- **範圍**：全域，或只限這個專案。
- **層級**：**短期**候選是一個帶日期的獨立檔案，不會常駐；**長期**規則則直接寫進對應的 `AGENTS.md`，並且必須先經過驗證、可重用、穩定這三道門檻，寫入前還要人類確認。

順帶一提，我也在 Claude Code 關掉了內建的 auto memory（`"autoMemoryEnabled": false`），理由相同：我要的是有門檻的記憶，不是自動累積的記憶。

---

## 今天就能做的一件事

**量一下你專案的常駐成本。** 在專案目錄與一個空目錄各跑一次，兩者的差距就是這個專案每個新 session 要付的寫入量：

```bash
claude -p "Reply with just OK." --output-format json | jq '.usage | .cache_creation_input_tokens + .cache_read_input_tokens'
```

如果差距是幾萬 token，先別急著刪規則：把它們搬到 Pointer 後面，讓 agent 需要時再讀。知識可以翻倍，常駐的部分卻可以少四分之三。

---

## 附錄：實驗方法與限制

- **對照方式**：同一個 repo 開兩個 worktree，程式碼相同（兩個版本之間只有文件 commit），只差 agent 文件；兩邊都放了 `CLAUDE.md → AGENTS.md` 的 symlink。
- **題目**：6 題，每題對應一條兩個版本都常駐的規則。瘦身時新增的規則（例如「只能在 Windows 建置」）對瘦身前不公平，所以排除。
- **執行**：`claude -p`、Sonnet 5、只給 Read／Grep／Glob、`--no-session-persistence`，每題 3 次，6 個並行。
- **限制**：樣本小（每組 18 次）；只測了一個模型；遵守與否由我人工判讀；並行執行會共用部分快取，所以總花費只能看大致方向，第一回合寫入量才是乾淨的比較。

---

## 參考資料

- [akunzai/agent-skills：agents-md](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) — 指令預算與漸進式揭露的 skill
- [akunzai/agent-skills：agents-memory](https://github.com/akunzai/agent-skills/tree/main/skills/agents-memory) — 明確寫入、分短期與長期的記憶 skill
- [AGENTS.md](https://agents.md/) — 跨工具的 agent 指令檔格式
- [A Complete Guide To AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md) — `agents-md` 準則的主要參考，包括指令預算與漸進式揭露
- [Claude 模型定價](https://platform.claude.com/docs/en/about-claude/pricing) — 快取寫入與讀取的單價
- [MemPalace](https://github.com/MemPalace/mempalace)、[context-mode](https://github.com/mksglu/context-mode)、[episodic-memory](https://github.com/obra/episodic-memory) — 我試用過的記憶系統
