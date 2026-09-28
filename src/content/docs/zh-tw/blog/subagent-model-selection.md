---
title: "Token Value Maxxing（3）MODEL：規則寫了，卻不在做決定的那一刻"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "subagents"]
description: "我寫了 tech-lead 與 cheap-dev-workers，要求派工前先挑最便宜的模型，委派卻仍有四成直接沿用 Opus。追下去才發現：那條規則幾乎從沒被讀到。"
---

:::note[Token Value Maxxing 系列]
0. [總綱：五個誤解與四個槓桿](/zh-tw/blog/token-value-maxxing/)
1. [INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變](/zh-tw/blog/agents-md-instruction-budget/)
2. [CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)
3. **MODEL：用對模型**（本篇）
4. [REWORK：別再問「要怎麼避免再發生」](/zh-tw/blog/prevent-recurrence/)
5. [分發：沒寫成 skill 的 SOP，每個 agent 都要撞一次牆](/zh-tw/blog/skills-distribution/)

延伸閱讀：[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)
:::

《食神》裡有一句：「**只要用心，人人都可以是食神。**」

模型也一樣：Haiku、Sonnet、Opus 都能把事情做好，前提是派給它們合適的工作。問題是，**派工這件事，得有人真的去做決定。**

---

## 從 98% 到 42%，然後卡住

總綱提過這組數字：在我開始用自己寫的 `tech-lead` skill 之前，subagent 委派有 **98%** 沒指定模型，直接沿用主對話的 Opus；開始用之後降到 46%。

這篇往下拆。我只在大型或可平行處理的任務才會呼叫 `/tech-lead`，所以只看 9/15 之後**明確呼叫它的 20 個 session**，共 166 次委派：

| 任務類型 | 沿用主模型 | 指定 Sonnet | 指定 Haiku |
|---|---|---|---|
| 審查（spec／standards review） | 7 | 5 | 0 |
| 實作 slice | 29 | 35 | 1 |
| 測試／e2e | 9 | 10 | 0 |
| 調查／其他 | 9 | 12 | 14 |
| **cheap-dev-workers 的角色** | **13** | 13 | 5 |
| 內建的 Explore／claude-code-guide | 3 | 1 | 0 |
| **合計** | **70（42%）** | 76 | 20 |

沿用主模型不一定是錯。審查需要判斷力，沿用 Opus 很合理；有些實作 slice 牽涉安全修補，刻意沿用也說得通。但有兩件事說不過去：

- **專為便宜模型設計的 worker 角色，有四成跑在 Opus 上。**
- **70 次沿用裡，只有 2 次在 brief 裡寫了為什麼要沿用。** 其餘看起來不像「評估後決定沿用」，比較像「沒有評估」。

---

## Harness 不會替你挑便宜的模型

先釐清預設行為。依照 [Claude Code 官方文件](https://code.claude.com/docs/en/sub-agents)，subagent 的模型依序由這四者決定：

1. 呼叫時傳入的 `model` 參數
2. Subagent 定義裡的 `model` 欄位（`inherit` 表示沿用主模型）
3. `CLAUDE_CODE_SUBAGENT_MODEL` 環境變數
4. 主對話的模型

前三個都沒設，就是第 4 個：**沿用主模型**。連內建的 Explore，現在也改成沿用主模型（上限為 Opus），不再固定跑 Haiku。

換句話說，**harness 不會依難度替你降級**。「何時委派、派給誰、用哪個模型與 effort」必須寫下來，而且呼叫端要真的照做。

---

## 我的做法：tech-lead 與 cheap-dev-workers

### tech-lead：主模型只當技術主管

[`tech-lead`](https://github.com/akunzai/agent-skills/tree/main/skills/tech-lead) 讓主對話扮演技術主管：

1. **切分**：把任務切成可以獨立完成的 slice，標明每個 slice 可以改動的檔案，以及能否平行處理。
2. **選模型**：每個 slice 選「能完成它的最便宜模型與 effort」。**不帶 model 參數等於沿用主模型，只有高判斷的 slice 才該這樣做**；機械性的 slice，一律明確指定更便宜的模型。
3. **隔離與驗收**：可平行的 slice 放在各自的 git worktree；主對話只負責驗收，審查類的 skill 也留在主對話。

### 意外的收穫：兩個大腦把關

`tech-lead` 要求每份 brief 分開標示兩種內容：一種是查過程式碼、確認無誤的事實，另一種是我自己的推測，留給實作者確認。這個設計帶來一個我沒預料到的好處：**實作者會回頭修正技術主管的假設。**

那 20 個 session 共有 167 份實作回報，其中至少 5 份明確指出 brief 的假設有誤。例如 brief 以為某個服務沒用到某個元件，或以為某份資料得重建；實作者查證後直接推翻，並在回報裡說明。這是用關鍵字篩出來的下限，實際次數可能更多。

效果就像真的有一位技術主管和一位實作工程師：主管負責拆解與判斷，工程師在第一線查證，**一方寫錯的假設，另一方有機會攔下來。** 關鍵在於把假設明確標成假設；沒標的話，實作者只會把整份 brief 當成事實照做。

### cheap-dev-workers：把會灌爆 context 的雜事外包

[cheap-dev-workers](https://github.com/akunzai/agent-skills/tree/main/plugins/cheap-dev-workers) 是一組權限受限的 worker：

- **repo-explorer**：唯讀，回答一個有範圍的程式碼問題，附上檔案與行號作為證據。
- **evidence-collector**：依照你寫的情境，擷取執行中 app 的截圖、錄影或終端機輸出。
- **log-summarizer**：把大型的 build 或 CI log 濃縮成根因。

我**刻意不在定義裡寫死模型**，也不綁定特定 harness 或 effort：各角色只在描述中提醒呼叫端：挑一顆能勝任的最便宜模型。至於挑哪一顆，由呼叫端在執行時決定。這樣換了 harness、出了新模型，定義都不用改。

代價就是上表那 13 次：**呼叫端一忘記傳 `model`，就沿用 Opus。**

---

## 根本原因：規則在，但不在場

「派工前要指定最便宜的模型」這條規則，其實早就寫在我的全域規則 `~/.agents/rules/subagents.md` 裡。這個檔案是[第 1 篇](/zh-tw/blog/agents-md-instruction-budget/)講的**按需載入**：全域 `AGENTS.md` 只留一行觸發條件，需要時才讀。

問題出在觸發條件。原本寫的是：

> when the platform provides subagents and a task is bounded and context-heavy

這句描述的是「任務的性質」，而不是「做決定的時刻」。結果是：**那 20 個 session 裡，只有 1 個真的讀過 `subagents.md`。** 規則寫了，卻在 agent 準備委派的那一刻不在場。

這是漸進式揭露的失敗模式：**按需載入的規則，觸發條件必須對準做決定的那一刻，而不是描述一種情境。**

我把觸發條件改成：

> before delegating to any subagent, or when a bounded, context-heavy task might warrant one: what to delegate, which model to request, what stays in the primary.

代價是每次委派前多讀一次約 2.4 KB 的規則；好處是規則終於會在做決定時出現。

### 其他可以擋住漏洞的做法

如果你不像我這麼在意可攜性，還有兩個更強硬的選項：

- **設定 `CLAUDE_CODE_SUBAGENT_MODEL`**：沒指定模型的 subagent 會改用這個模型，而不是主模型。缺點是刻意沿用 Opus 的審查類 slice 也會被一起降級。
- **加一個 `PreToolUse` hook**：呼叫 worker 時沒帶 `model` 就擋下，要求呼叫端先做決定。它不替你挑模型，只強制你挑；缺點是只對 Claude Code 有效。

---

## 正面範例：把委派寫進 skill

[第 2 篇](/zh-tw/blog/cache-session-habits/)提到的 `agentsview-resume`，是委派寫得比較完整的例子。它在 skill 裡明確寫著：讀對話紀錄這一步，只要 harness 支援 subagent，就交給「能勝任的最便宜設定」，因為這是摘要，不是判斷。

**把「為什麼可以用便宜的模型」寫進 skill，比只寫「用便宜的模型」更有效。** 呼叫端知道理由，就比較不會忘記。

---

## 今天就能做的一件事

**量一下你的委派有多少沒指定模型。** Claude Code 的對話紀錄存在 `~/.claude/projects/`，一行指令就能統計：

```bash
cat ~/.claude/projects/*/*.jsonl | jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and (.name=="Agent" or .name=="Task")) | if .input.model then "explicit: \(.input.model)" else "inherit" end' | sort | uniq -c
```

`inherit` 那一行就是「沒有人做決定、預設用主模型」的次數。

---

## 附錄：資料方法與限制

- **範圍**：2026-09-15 至 2026-09-28、使用者明確呼叫 `/tech-lead` 的 20 個 Claude Code session，排除 fork。
- **分類**：依委派的簡短描述歸類，由我人工判讀；原始描述牽涉工作內容，不公開。
- **「是否讀過 `subagents.md`」**：以 session 內是否有工具呼叫讀取該檔案判定。
- **限制**：無法從紀錄判斷「沿用主模型」是否經過評估，只能從 brief 裡有沒有寫理由間接推測。

---

## 參考資料

- [Claude Code：Subagents](https://code.claude.com/docs/en/sub-agents) — subagent 模型的決定順序
- [akunzai/agent-skills：tech-lead](https://github.com/akunzai/agent-skills/tree/main/skills/tech-lead) — 切分、選模型、隔離與驗收
- [akunzai/agent-skills：cheap-dev-workers](https://github.com/akunzai/agent-skills/tree/main/plugins/cheap-dev-workers) — 權限受限的便宜 worker
- [My Global Agent Instructions（GitHub Gist）](https://gist.github.com/akunzai/c6c90c01a07eba50d26514ce676eaa40) — 包含 `subagents.md` 與修正後的觸發條件
- [AgentsView](https://github.com/kenn-io/agentsview) — 本機 AI agent session 瀏覽與成本分析工具
