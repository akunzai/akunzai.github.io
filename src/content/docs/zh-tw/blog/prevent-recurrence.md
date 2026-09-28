---
title: "Token Value Maxxing（4）REWORK：別再問「要怎麼避免再發生」"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "verification"]
description: "我花了四個月才想通：要求 agent 記下教訓不夠，要從根源擋住問題。再加上讓 agent 自己驗證、自己錄影，把有問題的實作擋在人類審查之前。"
---

:::note[Token Value Maxxing 系列]
0. [總綱：五個誤解與四個槓桿](/zh-tw/blog/token-value-maxxing/)
1. [INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變](/zh-tw/blog/agents-md-instruction-budget/)
2. [CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)
3. [MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)
4. **REWORK：少做重工**（本篇）
5. 分發：把 skills 沉澱下來（撰寫中）

延伸閱讀：[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)
:::

《大話西遊》裡，至尊寶一次又一次喊著「**般若波羅蜜**」，用月光寶盒回到過去，想改寫結局。

和 agent 協作時，重工就是那個月光寶盒：同一個坑踩了又踩，每一次倒帶都要重新付一輪 token。前三篇省的是單價，這篇要省的是**次數**。

---

## 教訓該寫在哪裡：我走了四步

每次和 agent 一起解決一個棘手的問題，我都想讓下一次不必再解一次。這件事我前後改了四次做法：

| 時間 | 做法 | 問題 |
|---|---|---|
| 5 月 | 要求 agent 把學到的知識寫進 `AGENTS.md` | `AGENTS.md` 越來越肥（第 1 篇講過代價） |
| 8 月 | 拆到 `docs/lessons-learned/`，每個主題一個檔案 | 給人讀與給 agent 讀的內容沒有分開 |
| 9 月初 | 依讀者分流，改放 `docs/agents/lessons-learned.md` | 教訓記下了，**同樣的問題還是會再發生** |
| **9 月 8 日** | **Prevent Recurrence：先問怎麼防，不先問怎麼記** | — |

第三步之後，我發現自己每解決一個問題，都要再追問一句「要怎麼避免再發生」。agent 的第一反應總是「寫一條筆記」，因為規則問它的第一個問題就是「你學到了什麼」。那次改版的 [commit 訊息](https://github.com/akunzai/agent-skills/commit/6681be9)這樣寫：

> Self-Reflection asked "distil a rule" first, so after solving a problem the agent proposed a doc entry and the user had to follow up every time with "how do we stop this happening again?".

**記下教訓不等於不會再犯。** 筆記要被讀到才有用，而[第 3 篇](/zh-tw/blog/subagent-model-selection/)剛證明過：按需載入的文件，觸發條件沒對準就不會被讀到。測試不一樣，它每次都會跑。

---

## Prevent Recurrence：三個步驟

現在 [`agents-md`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) 的 Prevent Recurrence 規則只有三步：

1. **Candidate：先說出誰會再踩到。** 要能講清楚「誰、在哪個檔案、做什麼修改時」會再遇到。講不出情境，就不需要提任何東西。
2. **Promote：只提一個層級，由上往下找第一個擋得住的。**
   - **用程式碼擋住**：assert、型別或測試，並附上改動大小，讓我一個字就能核准。
   - 擋不住，就**在下一個人一定會經過的修改處留註解**。
   - 都不行，才寫進主題文件，而且要用一句話說明為什麼前兩層擋不住。
3. **Prune：寫入時順便清理。** 新增條目時，把同一個檔案裡已過時、已被程式碼擋住或重複的條目刪掉。

### 範例一：寫成測試

Claude Code 判斷 plugin 要不要更新，看的是 `plugin.json` 的版本號碼，而不是 git SHA。改了 plugin 卻忘記升版號，使用者就永遠拿不到更新。

這個坑沒有寫進任何筆記，而是變成一個[測試](https://github.com/akunzai/agent-skills/blob/main/tests/plugin-version-bump.sh)：只要 plugin 的檔案變了、版本號碼卻沒變，CI 就失敗。

### 範例二：從設計上消滅

我的 [skills-manager](https://github.com/akunzai/skills-manager) 原本在 `lessons-learned.md` 記著一條：CLI 框架的 flag 狀態會殘留到下一次執行，測試之間要記得重設。

後來我[改成每次執行都建立一棵全新的指令樹](https://github.com/akunzai/skills-manager/commit/2fd8e76)，flag 狀態從此不可能殘留。那條教訓、那些重設用的程式碼，都一起刪掉了。

**最好的教訓，是不需要再記得的教訓。**

---

## 讓 agent 自己驗，再交給人

另一種重工，來自「agent 說做完了，人一驗才發現壞掉」。

起因是工作上的一個專案：PM 和新進同事反映看不懂 agent 開的 merge request，於是我在它的 agent 文件裡加了三條要求：

1. **MR 的前半段寫給人看**：用白話說明改了什麼、為什麼改。
2. **交付前必須在本地驗證**，並把驗證結果寫進描述。
3. **依變更類型附上視覺化證據**：流程改動附流程圖，畫面改動附前後截圖，多步驟操作附錄影。

我原本只是想讓人看得懂，結果發現：**這三條常常在人類審查之前，就把有問題的實作擋下來了。** agent 要附證據，就得先真的跑一次；一跑，問題就浮現了。

後來我在 Anthropic Academy 的 [Give Claude a feedback loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/give-claude-a-feedback-loop) 讀到同樣的主張：一定要給 Claude 一個驗證自己成果的方法，不論是測試、建置還是截圖比對；它會反覆修正到驗證通過，所以交到工程師手上的，已經是通過驗證的東西。

### setup-agent-ready-repo：把它變成每個 repo 的標準配備

我把這套做法抽成 [`setup-agent-ready-repo`](https://github.com/akunzai/agent-skills/tree/main/skills/setup-agent-ready-repo)。它會訪談一次，然後產生：

- 開 issue 與開 PR／MR 的規範文件
- `docs/agents/verification.md`：把專案原本的啟動方式包成**一個不需互動的驗證指令**，實際跑一次，並記下它**無法驗證的部分**，而不是宣稱全部通過
- 在 `AGENTS.md` 加上「什麼時候該讀它們」的 Pointers

你正在讀的這個部落格就是這樣設定的。寫這個系列的過程中，`mise run verify` 在任何人看到之前，就抓到我在文章 frontmatter 用了某個欄位會讓 RSS 產生失敗；CI 用的正體中文用語檢查，也抓到了好幾個不符合臺灣用法的詞。**這些錯誤都沒有進到審查。**

### record-walkthrough：錄影也交給 agent

產品部門每次 release 都要錄功能介紹影片，reviewer 審網頁改動時，也得自己把分支拉下來建置、點一遍。於是我寫了 [`record-walkthrough`](https://github.com/akunzai/agent-skills/tree/main/skills/record-walkthrough)：讓 agent 自己把網站跑起來、依情境操作，錄成點擊處會自動放大的影片，附在 PR 或 MR 上。

這會多花 token，但我覺得很值得：reviewer 看影片就知道行為對不對；比起人工驗證，或是出錯後再要 agent 重做一輪，這點 token 便宜得多。

**擷取證據這件事，也可以交給便宜的模型。** 我最近剛改版的 cheap-dev-workers 裡有一個 evidence-collector：由主對話寫好情境，它負責執行並逐步回報觀察到的結果與預期是否相符，判斷仍留在主對話。這個角色才剛上線，還沒有實際資料可以分享。

---

## 今天就能做的一件事

**下次和 agent 一起修好一個 bug，別問「要怎麼避免再發生」，改問：**

> 誰會在哪個檔案、做什麼修改時再踩到它？能不能寫一個測試，讓它再發生時直接失敗？

如果答案是可以，那就不需要任何筆記了。

---

## 參考資料

- [akunzai/agent-skills：agents-md](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) — Prevent Recurrence 規則
- [akunzai/agent-skills：setup-agent-ready-repo](https://github.com/akunzai/agent-skills/tree/main/skills/setup-agent-ready-repo) — 讓 repo 能讓 agent 自己開單、開 PR 與驗證
- [akunzai/agent-skills：record-walkthrough](https://github.com/akunzai/agent-skills/tree/main/skills/record-walkthrough) — 自動錄製網站操作影片
- [akunzai/agent-skills：cheap-dev-workers](https://github.com/akunzai/agent-skills/tree/main/plugins/cheap-dev-workers) — 包含 evidence-collector
- [Anthropic Academy：Give Claude a feedback loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/give-claude-a-feedback-loop) — 讓 Claude 驗證自己的成果
