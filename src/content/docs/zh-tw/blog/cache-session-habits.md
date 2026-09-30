---
title: "Token Value Maxxing（2）CACHE：隔一小時再回來，那一回合貴了 80 倍"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "prompt-caching"]
description: "我分析了 120 天、三萬多個對話回合：一般回合的快取未命中率只有 0.7%，但隔一小時才接續的回合，寫入量是一般回合的 80 倍。三個讓快取持續命中的習慣。"
---

:::note[Token Value Maxxing 系列]
0. [總綱：五個誤解與四個槓桿](/zh-tw/blog/token-value-maxxing/)
1. [INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變](/zh-tw/blog/agents-md-instruction-budget/)
2. **CACHE：多命中快取**（本篇）
3. [MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)
4. [REWORK：別再問「要怎麼避免再發生」](/zh-tw/blog/prevent-recurrence/)
5. [分發：沒寫成 skill 的 SOP，每個 agent 都要撞一次牆](/zh-tw/blog/skills-distribution/)

延伸閱讀：[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)
:::

《大話西遊》裡至尊寶說：「**如果非要在這份愛上加一個期限，我希望是一萬年。**」

快取的期限沒有一萬年。Claude 的提示快取只活 5 分鐘或 1 小時，時間一到，你和 agent 之間累積的一切都得重新付一次錢。

---

## 先看資料：哪些回合最貴

我用 [AgentsView](https://github.com/kenn-io/agentsview) 分析了 2026-06-01 以來，所有 Claude 主對話（不含 subagent）的回合，依「和上一回合隔了多久、有沒有換模型」分類：

| 回合類型 | 回合數 | 快取未命中率（中位數） | 平均每回合寫入 | 以 Opus 5 換算 |
|---|---|---|---|---|
| 一般回合（5 分鐘內，同一個模型） | 34,108 | 0.7% | 2.7k token | 約 $0.03 |
| Session 第一回合 | 1,362 | 44% | 18k token | 約 $0.18 |
| 間隔 5～60 分鐘 | 542 | 0.2% | 15k token | 約 $0.15 |
| **中途換模型** | 38 | **57%** | **69k token** | **約 $0.69** |
| **間隔超過 1 小時才接續** | 13 | **88%** | **224k token** | **約 $2.24** |

換算用的是 Opus 5 的 1 小時快取寫入價，每百萬 token $10（[官方定價](https://platform.claude.com/docs/en/about-claude/pricing)，金額皆為美元）。

兩件事一眼就看得出來：

- **隔一小時以上才回來，寫入量暴增約 80 倍。** 快取已經過期，整段歷史都得重新寫入。
- **中途換模型，那一回合要重新寫入約 69k token**，相當於 25 個一般回合。

這兩種回合我總共只有 51 次，卻佔了全部快取寫入的 4%。我平常大多守著「一個任務一串對話」，所以次數不多；但也正因如此，**偶爾破戒的代價特別顯眼**。

---

## 快取是怎麼運作的

先看 Claude 的三個快取規則，後面的習慣就很好懂：

1. **快取只認開頭。** 依照[官方文件](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)，快取依 `tools → system → messages` 的順序建立；前面任何一段變了，後面全部失效。
2. **快取以模型為單位。** 換了模型，就是另一份快取，整段歷史得用新模型從頭寫入。調整 thinking 設定，也會讓訊息部分的快取失效；在 Opus 5.5、Sonnet 5.5、Fable 5.1 上，Claude Code 中途調整 effort 會保留快取（[文件](https://code.claude.com/docs/en/prompt-caching#changing-effort-level)）；其他 Claude 模型仍會重置。
3. **快取有期限。** 5 分鐘或 1 小時，每次命中會重新計時。我實測 Claude Code 寫入的是 1 小時快取，寫入價是原價的 2 倍。

換句話說：**只要開頭不變、在期限內，快取就會一直幫你打折；一旦變動或過期，就得付一次昂貴的寫入費。**

---

## Claude Code 的 Sonnet 5.5：中途改 effort

依[官方文件](https://code.claude.com/docs/en/prompt-caching#changing-effort-level)，Sonnet 5.5 中途調整 effort 會保留快取。我在 2026-09-30 用同一個 Claude Code session、維持 Sonnet 5.5，用 `/effort` 做了一輪 `medium → low → medium` 切換。從 transcript 取各次模型請求的 usage，命中率以 `cache_read ÷ (input + cache_creation + cache_read)` 計算：

| 請求 | Effort | Input | Cache 寫入 | Cache 讀取 | 命中率 |
|---|---|---:|---:|---:|---:|
| 切到 low 前最後一筆 | medium | 2 | 615 | 54,903 | 98.89% |
| 切到 low 後第一筆 | low | 2 | 234 | 55,817 | 99.58% |
| low 下一筆 | low | 2 | 71 | 56,085 | 99.87% |
| 切回 medium 後第一筆 | medium | 2 | 234 | 56,191 | 99.58% |

每次切換後的第一筆請求都沒有掉命中率，只寫入數百個新 token，和文件的說明一致。這只是單一 session、一輪的觀察。Codex 的文件沒有明確說改 effort 不影響快取，下一節看到的下降也就不意外。

## Codex 的 GPT-6：effort 與快取期限

對 Codex 訂閱使用者，我關心的是：在同一串對話中從介面改 effort，下一筆請求還能不能沿用快取？這要看實際使用的模型與 client，不能直接套用 Claude Code 的結果。

我在 2026-09-30 用同一個 Codex 對話、維持 GPT-6.1 Sol，從介面做了兩輪 `medium → low → medium` 切換。從 session 紀錄的 `last_token_usage` 取各次模型請求用量，命中率以 `cached_input_tokens ÷ input_tokens` 計算；切換期間沒有記錄到 compaction：

| 輪次 | 請求 | Effort | Input tokens | Cached tokens | 命中率 |
|---|---|---|---:|---:|---:|
| 1 | 切到 low 前最後一筆 | medium | 191,625 | 190,336 | 99.33% |
| 1 | 切到 low 後第一筆 | low | 191,979 | 0 | 0% |
| 1 | low 下一筆 | low | 192,961 | 191,744 | 99.37% |
| 1 | 切回 medium 前最後一筆 | low | 194,395 | 193,408 | 99.49% |
| 1 | 切回 medium 後第一筆 | medium | 194,634 | 161,280 | 82.86% |
| 1 | medium 下一筆 | medium | 195,444 | 194,432 | 99.48% |
| 2 | 切到 low 前最後一筆 | medium | 203,149 | 201,856 | 99.36% |
| 2 | 切到 low 後第一筆 | low | 203,384 | 194,176 | 95.47% |
| 2 | low 下一筆 | low | 204,178 | 203,264 | 99.55% |
| 2 | 切回 medium 前最後一筆 | low | 205,807 | 204,800 | 99.51% |
| 2 | 切回 medium 後第一筆 | medium | 206,049 | 198,784 | 96.47% |
| 2 | medium 下一筆 | medium | 206,887 | 205,824 | 99.49% |

**兩輪共四次介面切換，下一筆請求的命中率都下降，但幅度不固定**：第一次完全未命中，後三次仍有部分命中，下一筆都恢復到約 99%。第二輪切到 low 與切回 medium，和前一筆請求分別只相隔約 53 秒、45 秒；未快取量分別從 1,293 增至 9,208 tokens、從 1,007 增至 7,265 tokens，之後降回 914、1,063 tokens。

這是同一 session 的兩輪觀察，沒有捕捉實際送出的 request 或控制快取路由，無法確認原因是 effort 更新方式、路由或其他因素，也不能據此推論所有 Codex 版本都會重置快取。重複測試讓「切換後下降、下一筆恢復」的現象更一致，但還不足以證明因果。表中的數字是每次模型請求，不是整個使用者回合的累計用量。

至於 Codex 訂閱的快取保留多久，官方的訂閱說明沒有給明確期限。我改從本機紀錄找線索：取 `~/.codex/sessions` 中使用量最多的舊模型 `gpt-5.6-sol`（GPT-6.1 Sol 才剛推出，資料太少），比對每筆請求與同一 session 前一筆請求的間隔，共 7,453 筆。已排除換模型或改 effort 後的第一筆、compaction 後的第一筆，以及 input tokens 比前一筆少 10% 以上的請求：

| 與前一筆的間隔 | 請求數 | 命中率中位數 | 命中率低於 50% |
|---|---:|---:|---:|
| 10 秒內 | 4,323 | 98.5% | 0.7% |
| 10～60 秒 | 2,666 | 98.6% | 0.7% |
| 1～5 分鐘 | 355 | 98.5% | 0.3% |
| 5～10 分鐘 | 53 | 98.4% | 1.9% |
| 10～15 分鐘 | 26 | 97.8% | 0% |
| 15～30 分鐘 | 21 | 98.5% | 0% |
| 30～60 分鐘 | 8 | 64.3% | 50% |
| 60 分鐘以上 | 1 | 8.1% | 100% |

間隔 30 分鐘內的中位數都約 98%；30 分鐘以上只有 9 筆，逐筆看很不穩定：26～33 分鐘為 95%～99%，36.6 分鐘為 99%，36.9 分鐘只有 4%，39.7 分鐘為 31%，44.7 分鐘又回到 99%，54 分鐘以上全部低於 10%。第三方也有類似觀察：一位使用者分析自己的 474 個 Codex session，回報 Sol 與 Astra 約 30 分鐘、Sol 偶爾撐到約 1 小時（[volt-hq/Volt #458](https://github.com/volt-hq/Volt/issues/458)，我只看到摘要，未驗證其原始資料）。OpenAI 的 API 文件也把 extended retention 描述為「通常約 30 分鐘、最長 24 小時」（[Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)），但那是 API 的說明，沒有提到訂閱。

所以我只把它當成「這台機器上的實際觀察」：約 30 分鐘內穩定命中，之後不穩定。樣本只有 9 筆，間隔也包含我自己的等待時間，只涵蓋單一模型，不能當成 TTL。

因此，下面「離開一小時就開新對話」是我的 Claude Code 習慣。對 Codex，離開超過約 30 分鐘後快取可能已失效，但不保證；先看可取得的 cache 用量，再決定是否改用精簡交接。

---

## 習慣一：開工前就決定模型，不要中途換

中途換模型最常見的理由是「這題有點難，換大的來」或「這段很簡單，換小的省錢」。兩種都會讓整段歷史用新模型全價重寫。

- **開工前先決定。** 任務本身的難度通常在開始時就看得出來。
- **難的子任務，派 subagent，不要換主模型。** subagent 有自己獨立的 context 與快取，主對話的快取不受影響。怎麼派得便宜又派得對，是第 3 篇〈[MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)〉的主題。
- **effort 在較新的模型上是例外。** 在 Opus 5.5、Sonnet 5.5、Fable 5.1 上，調整 effort 會保留快取（[文件](https://code.claude.com/docs/en/prompt-caching#changing-effort-level)；[公告](https://claude.com/blog/claude-opus-5-5-built-for-coding-sessions-that-use-more-context)）。Bedrock、Google Cloud Agent Platform、Claude apps gateway 不適用，而且 [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) 將 Fable 5.1 的修正標在 v2.1.260。Opus 5.5 在 Claude Code v2.1.280、Sonnet 5.5 在 v2.1.284 才首次推出，都晚於該版本，所以用這兩個模型時版本通常不成問題。我自己實測過：在 Sonnet 5.5 上，effort 依序切換 medium → low → medium，statusline 的快取命中率沒有下降；在 Opus 5.5 上依序切換 low → medium → low，transcript 顯示每一輪仍從快取讀取整段歷史，只寫入數百個新 token（各為單一 session）。其他情況請照 [Anthropic 的建議](https://claude.com/blog/maximizing-the-value-of-your-claude-code-sessions)事先設定好。

## 習慣二：一個任務一串對話，別隔天接著聊

我有 139 個 session 的 context 峰值超過 200k。這些多半不是「任務本來就這麼大」，而是「我懶得開新對話」。長對話有三個代價：

- **每回合都更貴。** 就算快取命中，每回合也要重送全部歷史。
- **過期時更痛。** 對話越長，快取過期後那一次重寫就越貴；上表那 224k token，就是長對話加上隔了一小時的結果。
- **注意力被稀釋。** 無關的舊脈絡混在裡面，回答品質會下降。

我的做法：**不同任務開不同對話；在 Claude Code 裡離開超過一小時，回來就開新對話，而不是接著聊。**

## 習慣三：開新對話不等於失憶

很多人不開新對話，是怕前面的脈絡接不回來。其實有三條路：

| 情境 | 做法 | 代價 |
|---|---|---|
| 同一個工具、同一台機器 | 原生 resume：`claude --resume`、`codex resume` | 還原完整脈絡，但快取過期時整段歷史要全價重寫 |
| 跨工具、跨機器，或原對話太長 | 我寫的 [`agentsview-resume`](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-resume) | 只帶一份不超過 40 行的交接摘要 |
| 已經知道要中斷：改天再做，或 quota 快用完 | 用 [`agents-memory`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-memory) 把交接寫進短期記憶 | 只帶交接文件，而且下次在任何一台機器都拿得到 |

`agentsview-resume` 會從 AgentsView 的對話紀錄重建一份交接，固定分成六段：目標、涉及範圍、已完成、未完成、停在哪裡、注意事項。讀對話紀錄這一步，只要 harness 支援 subagent，就交給能勝任的最便宜模型：這是摘要，不是判斷；而且原始紀錄完全不會進入主對話。接著它會**對照目前的 repo 驗證**這份交接：確認分支、看 diff、重讀提到的檔案，並指出每一處和現況不符的地方。最後**停下來等你決定**下一步，而不是憑著舊紀錄就直接動手。

如果原對話已經長到 200k，又隔了一段時間，原生 resume 等於要重寫 200k token；一份 40 行的交接只要幾百個 token。**只帶結論，不帶整段歷史。**

如果事先就知道要中斷，我會直接請 agent 用 `agents-memory` 把交接寫成一份短期記憶：它是一個帶日期的獨立檔案，平常不會常駐。我用 Google Drive 同步 `~/.agents` 底下的檔案，所以換一台機器也能接手。quota 快用完的情況，我另外用 [`codexbar-quota-handoff`](https://github.com/akunzai/agent-skills/tree/main/plugins/codexbar-quota-handoff) 自動化：[CodexBar](https://github.com/steipete/CodexBar) 回報 quota 用了 90% 時，它會提醒 agent 收尾，並在問過我之後，把交接寫進同一個短期記憶目錄。

---

## 把命中率放到眼前

這些習慣要能維持，前提是**你看得到快取的狀態**。我在 Claude Code 的 statusline 顯示模型、effort、context 用量和快取命中率（[腳本在這裡](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380)）：

- **高且穩**：繼續。
- **突然掉**：檢查是否換了模型、effort，或工具清單有變動。
- **長期低**：果斷開新對話。

---

## 側欄：如果你大量使用 MCP

我自己的工作流程幾乎不用 MCP，但這對 MCP 重度使用者很重要：**工具定義位於提示的最前面，只要工具清單一變，整個快取就失效。** MCP server 掉線或重連，都可能改變工具清單。

主流 harness 大多已內建「延遲載入工具定義」的機制，而且預設就開著，通常不需要另外設定：

| Harness | 內建機制 | 備註 |
|---|---|---|
| Claude Code | [tool search](https://code.claude.com/docs/en/mcp)，預設啟用 | 遠端 server 斷線會自動重連，最多 5 次；**stdio server 不會自動重連** |
| GitHub Copilot CLI | [tool search](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/tool-search)，預設啟用 | 工具約 30 個以上、且使用支援的模型時才會啟動；可用 `deferTools` 逐一設定 |
| Codex | MCP 工具[預設走 tool search](https://github.com/openai/codex/pull/29486)（2026 年 6 月起） | 已知問題：MCP server 通知工具清單變動後，不會重新整理（[#33266](https://github.com/openai/codex/issues/33266)，截至 9/28 仍未解決） |
| Antigravity CLI | [官方文件](https://antigravity.google/docs/mcp/)未說明 | 社群回報似乎會延遲載入，但我無法從官方來源確認 |

- **內建機制不夠用時，才考慮 gateway**，例如常掉線的 stdio server。[1MCP](https://github.com/1mcp-app/agent)（Apache-2.0）提供選用的 lazy loading，對外只露出 `tool_list`、`tool_schema`、`tool_invoke` 三個固定工具，並可為 stdio 後端自動復原。
- **注意授權與效果。** 另一個常被提到的 [mcp-gateway](https://github.com/MikkoParkkola/mcp-gateway) 採 PolyForm Noncommercial 授權，**在公司使用需要另購商業授權**；它自己的 benchmark 也指出，多一層搜尋並沒有讓完成任務的 token 變少。這類工具的價值在於讓工具清單保持穩定，而不是直接幫你省 token。以上兩者我都沒有實測過。

---

## 今天就能做的一件事

**給自己訂一條 Claude Code 的規則：離開超過一小時，回來就開新對話。** 需要延續脈絡時，用 resume 或交接摘要接上，不要硬接一串早已過期的長對話。

---

## 附錄：資料方法與限制

- **範圍**：2026-06-01 至 2026-09-28，Claude Code 的主對話，排除 subagent 與 sidechain；只計入有快取用量紀錄的 assistant 回合。
- **分類**：與同一 session 上一個 assistant 回合比較；模型不同歸為「中途換模型」，否則依時間間隔分類。
- **未命中率**：該回合快取寫入 ÷（快取寫入＋快取讀取）。
- **限制**：AgentsView 的紀錄裡沒有 effort 變化，所以測不到「中途改 effort」；「間隔 5～60 分鐘」的中位數幾乎沒有未命中，平均寫入卻偏高，推測是少數回合碰到 5 分鐘快取過期；金額為牌價換算，我實際使用的是訂閱方案。

---

## 參考資料

- [Claude Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — 快取的建立順序、期限與失效條件
- [Claude 模型定價](https://platform.claude.com/docs/en/about-claude/pricing) — 快取寫入與讀取的單價
- [Anthropic：Maximizing the value of your Claude Code sessions](https://claude.com/blog/maximizing-the-value-of-your-claude-code-sessions) — 官方的 session 習慣：`/clear`、`/compact`、事先設定模型與 effort
- [Anthropic：Claude Opus 5.5 is built for coding sessions that use more context](https://claude.com/blog/claude-opus-5-5-built-for-coding-sessions-that-use-more-context) — 快取讀取降價、中途調整 effort、1 小時快取
- [Claude Code：How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching) — 哪些操作會使快取失效，含調整 effort 的規則
- [Claude Code：MCP](https://code.claude.com/docs/en/mcp) — tool search 與斷線重連
- [akunzai/agent-skills：agentsview-resume](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-resume) — 跨工具、跨機器的交接 skill
- [AgentsView](https://github.com/kenn-io/agentsview) — 本機 AI agent session 瀏覽與成本分析工具
- [我的 Claude Code statusline 腳本（GitHub Gist）](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380) — 顯示模型、effort、context 用量與快取命中率
- [1MCP](https://github.com/1mcp-app/agent)、[mcp-gateway](https://github.com/MikkoParkkola/mcp-gateway) — MCP gateway
