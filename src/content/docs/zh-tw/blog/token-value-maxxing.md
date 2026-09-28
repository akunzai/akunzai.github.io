---
title: "Token Value Maxxing：我的快取命中率 98.5%，卻還在浪費錢"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "cost"]
description: "「多用 Token」不是 KPI，產出才是。用我自己 120 天的 AgentsView 資料，拆解五個關於 AI Coding Agent 成本的常見誤解。"
---

:::note[Token Value Maxxing 系列]
0. **總綱：五個誤解與四個槓桿**（本篇）
1. [INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變](/zh-tw/blog/agents-md-instruction-budget/)
2. [CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)
3. [MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)
4. REWORK：少做重工（撰寫中）
5. 分發：把 skills 沉澱下來（撰寫中）

延伸閱讀：[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)
:::

《大話西遊》裡至尊寶說：「**曾經有一份真誠的愛情放在我面前，我沒有珍惜。**」

我的版本是：曾經有一顆便宜的模型放在我面前，我沒有指定。

---

## 先看資料：我以為自己很會省

我用 [AgentsView](https://github.com/kenn-io/agentsview) 回頭盤點了自己過去 120 天（2026-06-01 起）的 AI Coding Agent 使用紀錄。以下金額皆為美元（USD），且都是**以 API 牌價換算的估計值**。我平常用訂閱方案，實際付的錢遠低於此；但牌價最能反映每個習慣的真實代價。

| 指標 | 數值 |
|---|---|
| Claude 快取命中率 | **98.5%**（229 個 session 中有 195 個高於 95%） |
| 以牌價換算的花費 | 約 $3,924 |
| 快取省下的金額 | 約 $23,458，沒有快取的話帳單會是約 **7 倍** |

看起來很漂亮。但往下挖一層：

| 指標 | 數值 |
|---|---|
| 單一 session 的 context 峰值 | 平均約 192k；371 個 session 中有 139 個**超過 200k** |

再看委派給 subagent 的呼叫。我在 9 月 15 日開始採用自己寫的 `tech-lead` skill，要求主模型派工前先評估「能完成任務的最便宜模型」：

| 期間 | subagent 呼叫 | **沒指定模型**、直接沿用主模型 |
|---|---|---|
| 9/7–9/14（採用前） | 96 次 | 95 次（**98%**） |
| 9/15 之後（採用後） | 182 次 | 85 次（**46%**） |

採用前，幾乎每一次委派都沒人決定該用哪顆模型——不是評估後選了 Opus，而是**沒評估，預設就是 Opus**。採用後明顯改善，但仍有將近一半的委派沒經過這一步。

命中率 98.5% 只代表「送出去的東西大多打了折」，不代表「送出去的東西都該送」。

---

## 「多用 Token」不是 KPI，產出才是

去年很常聽到的指令是「多試幾個模型、多跑幾個 agent」。結果用量很漂亮，帳單也很有存在感。

今年該問的是：**同一顆 token，能不能多做一點正事？** 我用四個維度一起看：

> **成功率 × 速度 × 成本 × 可重複性**

只看成本會讓你把所有事都丟給最便宜的模型，然後重工三次；只看成功率會讓你什麼都開最大火力。四個一起看，才看得出錢花在哪裡值得。

### 一筆 AI 成本，三個人一起結帳

| 項目 | 內容 | 特性 |
|---|---|---|
| **Input** | 歷史對話、指令、工具定義 | 對話愈長，每回合重送愈多 |
| **Output** | 回覆與 reasoning | 單價最高，難題才值得開大火 |
| **Cache** | 命中時，重用開頭相同的內容 | 同一碗湯不要每天重熬 |

以 Claude 為例（[官方定價](https://platform.claude.com/docs/en/about-claude/pricing)，2026-09-28 查證，單位為美元／每百萬 token）：

| 模型 | 輸入 | 快取讀取 | 輸出 |
|---|---|---|---|
| Fable 5.1 | $10 | $0.25（2.5%） | $50 |
| Opus 5.5 | $4 | $0.20（5%） | $20 |
| Sonnet 5 | $2 | $0.20（10%） | $10 |
| Haiku 4.5 | $1 | $0.10（10%） | $5 |

兩件事值得記住：**快取命中至少打 1 折**，旗艦模型甚至更低；**Haiku 約是 Opus 5.5 的 1/4 價**。這兩個比例，就是後面所有技巧的槓桿來源。

---

## 五個常見誤解

### 誤解①：中途換模型，只影響後面的回答？

快取以模型為單位。中途切換模型，整段歷史就得用新模型全價重讀一次。調整 effort 或 thinking 設定、MCP 掉線導致工具定義變動，也都會讓快取從變動點往後失效——[官方文件](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)寫得很清楚，快取依 `tools → system → messages` 的順序建立，**前面一變，後面全廢**。

→ 詳見第 2 篇〈[CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)〉的 MCP 側欄。

### 誤解②：同一串對話用一整天，比較省？

快取只活 5 分鐘到 1 小時，隔天接著聊，整段歷史全價重讀。就算快取還在，每回合也要重送全部歷史，越後面的問題越貴；無關的舊脈絡還會稀釋注意力，讓回答品質下降。

我自己有 139 個 session 的 context 峰值超過 200k——這些多半不是「任務本來就這麼大」，而是「我懶得開新對話」。

→ 詳見第 2 篇〈[CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)〉：一個任務一串，用交接取代長對話。

### 誤解③：AGENTS.md 與記憶寫越多，AI 越聰明？

`AGENTS.md` 與記憶檔每回合都會重送。有快取的時候，重送其實不貴；真正的代價是**每個新 session 都要重新寫入快取**。我實測 Claude Code 寫入的是 1 小時快取，價格是原價的 **2 倍**；而且快取一失效，又得全價重讀。只有「每次都用得到的事實」值得常駐，其餘應該下放到 nested `AGENTS.md` 或按需載入的 skill。

→ 詳見第 1 篇〈[INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變](/zh-tw/blog/agents-md-instruction-budget/)〉。全域層的分層治理，另見〈[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)〉。

### 誤解④：harness 會自己判斷難度，派便宜的模型？

不會。多數 harness 預設由主模型包辦一切；沒指定模型的 subagent，多半直接沿用主對話的模型。我採用 `tech-lead` 前那 98% 的委派就是這樣來的：**不做決定，就等於選了最貴的那個**。

「何時委派、派給誰、用哪個模型與 effort」必須明確寫進 skill 或 agent 定義裡，而且呼叫端要真的傳遞這個選擇。

→ 詳見第 3 篇〈[MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)〉：`tech-lead` 與 cheap-dev-workers 的設計，以及剩下那 46% 是怎麼漏掉的。

### 誤解⑤：驗證留給人工比較省？

agent 交付後才由人工發現問題，退回重做的那一輪，才是最貴的 token。同一個坑踩第二次，更是純粹的浪費。讓 agent 能用單一指令在本地驗證、坑寫成測試而不是寫進常駐指令、截圖錄影交給便宜的 worker，主對話只看結果做判斷。

→ 詳見第 4 篇〈REWORK〉：Prevent Recurrence 與 agent-ready repo。

---

## 四個槓桿

把五個誤解反過來看，就是四個省 token 的槓桿，也是這個系列接下來的主軸：

| 槓桿 | 目標 | 手段 | 系列 |
|---|---|---|---|
| **INPUT** | 少送一點 | `AGENTS.md` 精簡分層、skills 按需載入、交接只帶摘要 | 第 1 篇 |
| **CACHE** | 多命中快取 | 不中途換模型、穩定工具介面、一個任務一串 | 第 2 篇 |
| **MODEL** | 用對模型 | 明確指定委派模型、主對話只做判斷 | 第 3 篇 |
| **REWORK** | 少做重工 | 坑寫成測試、本地驗證再交付、附證據一次過審 | 第 4 篇 |

最後一篇會講怎麼把這些重複的做法沉澱成 skills，並用 [skills-manager](https://github.com/akunzai/skills-manager) 在不同 agent 之間同步。

---

## 今天就能做的一件事

**先把命中率放到眼前。** 沒有儀表板，就像開車只看油表。

- 在 statusline 顯示模型與 effort、context 用量和快取命中率（可參考[我的 Claude Code statusline 腳本](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380)）：命中率**高且穩**就繼續；**突然掉**就檢查是否換了模型、effort 或 MCP；**長期低**就果斷開新對話。
- 裝上 [AgentsView](https://github.com/kenn-io/agentsview)，回頭看哪段對話越聊越貴、哪些 subagent 沒指定模型。

你不需要先相信我的五個誤解。先量，資料會自己說話——就像它對我做的那樣。

---

## 參考資料

- [Claude 模型定價](https://platform.claude.com/docs/en/about-claude/pricing) — 各模型輸入、輸出與快取單價
- [Claude Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — 快取的建立順序與失效條件
- [AgentsView](https://github.com/kenn-io/agentsview) — 本機 AI agent session 瀏覽與成本分析工具
- [我的 Claude Code statusline 腳本（GitHub Gist）](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380) — 顯示模型、effort、context 用量與快取命中率
- [GitHub 專案：akunzai/agent-skills](https://github.com/akunzai/agent-skills) — `tech-lead`、cheap-dev-workers 等 skills
- [GitHub 專案：akunzai/skills-manager](https://github.com/akunzai/skills-manager) — 跨 agent 的 skills 宣告式管理工具
