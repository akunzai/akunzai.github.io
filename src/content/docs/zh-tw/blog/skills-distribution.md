---
title: "Token Value Maxxing（5）分發：沒寫成 skill 的 SOP，每個 agent 都要撞一次牆"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "skills"]
description: "我同時用好幾個 AI coding agent，重複的 SOP 如果不寫成 skill，每個 agent 都得花 token 自己撞牆。這篇談我怎麼從對話紀錄萃取 skills，又為什麼自己寫了一套能驗簽的 skills 管理工具。"
---

:::note[Token Value Maxxing 系列]
0. [總綱：五個誤解與四個槓桿](/zh-tw/blog/token-value-maxxing/)
1. [INPUT：知識翻倍、常駐少四分之三，遵守率卻沒變](/zh-tw/blog/agents-md-instruction-budget/)
2. [CACHE：隔一小時再回來，那一回合貴了 80 倍](/zh-tw/blog/cache-session-habits/)
3. [MODEL：規則寫了，卻不在做決定的那一刻](/zh-tw/blog/subagent-model-selection/)
4. [REWORK：別再問「要怎麼避免再發生」](/zh-tw/blog/prevent-recurrence/)
5. **分發：把 skills 沉澱下來**（本篇）

延伸閱讀：[拒當失憶鹹魚：我的全域 AGENTS.md 分層治理架構](/zh-tw/blog/global-agents-architecture/)
:::

《功夫》裡，乞丐把《如來神掌》秘笈塞給年幼的阿星，說：「**維護世界和平就靠你了！**」電影最後，他手上還有一整疊秘笈，準備賣給下一個小孩。

Skill 就是寫給 agent 的秘笈。和那位乞丐不同的是，我希望每一本都是真的、驗證過的，而且每個 agent 都拿得到同一本。

---

## 為什麼要寫成 skill

我平常會輪流使用好幾個 harness：Claude Code、Codex、grok-build、Cursor、muse-code、Antigravity CLI。只要某個重複的流程沒有寫下來，**每個 agent 都得自己撞一次牆**，而每一次撞牆都在燒 token。

我最常撞的牆是 GitLab 的 `glab` CLI：參數、輸出格式、討論串的回覆方式，agent 幾乎每次都要試錯好幾輪。後來我發現 `glab` 自己就附有 skills（`glab skills install glab`），裝上之後，這些試錯幾乎消失了。**如果你用 GitLab，這是我最推薦先裝的 skill。**

寫成 skill 的成本很低。依照 [Claude Code 官方文件](https://code.claude.com/docs/en/skills)，平常只有 skill 的名稱與描述會常駐在 context 裡，完整內容要等 skill 被呼叫時才載入。這正是[第 1 篇](/zh-tw/blog/agents-md-instruction-budget/)講的漸進式揭露：**裝一百個 skill，平常也只付一百行描述的錢。** 而且 skills 遵循 [Agent Skills](https://agentskills.io) 開放標準，同一份 skill 可以給不同的 agent 用。

---

## 從對話紀錄萃取 skill

問題是：哪些流程值得寫成 skill？我不想靠記憶判斷，所以寫了 [`agentsview-extract`](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-extract)。

它透過 [AgentsView](https://github.com/kenn-io/agentsview) 搜尋我在各個 harness 留下的對話紀錄，找出反覆出現的要求，再依性質分流：

- **踩過的坑或個人偏好** → 寫進 `AGENTS.md`（要不要寫、寫在哪一層，照[第 4 篇](/zh-tw/blog/prevent-recurrence/)的 Prevent Recurrence 判斷）
- **重複的工作流程** → 寫成一個新的 `SKILL.md`

因為 AgentsView 同時收錄多個 harness 的紀錄，在 Codex 裡反覆交代的事，也能萃取成一個 Claude Code 用得到的 skill。

## 我寫了哪些 skill

我的 [agent-skills](https://github.com/akunzai/agent-skills) 大致分成三類：

- **Git 相關**：工程師的工作離不開 git，所以這類最多，例如整理 commit 歷史的 `tidy-commits`、開 PR 前檢查的 `pr-workflow`，以及管理 GitHub／GitLab epic 的 `github-epic`、`gitlab-epic`。
- **工具鏈**：例如 `mise`。我很喜歡用 mise 在專案層級統一管理工具版本，但當時找不到給使用者用的 mise skill，就自己寫了一個。
- **記憶與流程**：這個系列提過的 `agents-md`、`agents-memory`、`tech-lead`、`agentsview-resume`、`setup-agent-ready-repo` 等。

---

## 分發：為什麼我自己寫了 skills-manager

一開始我用 [`npx skills`](https://github.com/vercel-labs/skills) 管理 skills，但很快遇到三個需求它當時無法滿足：

1. **跨裝置同步**：我在好幾台機器之間切換，希望在一台裝好，其他台就能還原成同樣的狀態。
2. **工具自帶的 skills**：像 `glab`、`playwright-cli` 這類本機工具，skill 是用工具本身的指令安裝，版本跟著工具走，不是從 git repo 取得。
3. **本機 symlink**：開發中的 skill，我希望直接 symlink 到自己的工作目錄，改了就生效。

所以我寫了 [skills-manager](https://github.com/akunzai/skills-manager)。它把所有 skill 的來源與「哪些 agent 看得到」宣告在一份 `skills.json` 裡：

- **三種來源**：遠端 git repo、本機目錄（symlink），以及**指令**，例如 `glab skills install glab --global`、`playwright-cli install --global --skills=agents`。
- **可用性是持久的政策**：`--agent claude` 不是只連結這一次；之後每次 `skills sync`，都會還原成同樣的可用性。
- **跨裝置**：我把 `skills.json` 放在雲端硬碟，換一台機器只要 `skills sync`。

### 驗簽：確認秘笈不是乞丐賣的

Skill 本質上是一段會被 agent 照做的指令，來路不明的 skill，風險和來路不明的程式碼一樣。所以我最近幫 skills-manager 加上了[驗簽](https://github.com/akunzai/skills-manager/blob/main/docs/SIGNING.md)：

- 支援 [OpenSSF Model Signing](https://github.com/sigstore/model-transparency) 的 `skill.oms.sig` 簽章，[NVIDIA/skills](https://github.com/NVIDIA/skills) 與我的 agent-skills 都有簽。
- 安裝前逐一比對：每個檔案都必須和簽章時一致，也不能多出未簽章的檔案。
- 使用 Sigstore keyless 簽章時，第一次看到的簽署者會記在 `skills.json`；之後換了人簽，就拒絕安裝。
- 驗證失敗的 skill 不會寫入，原本的版本保留不動。

---

## 系列回顧

五篇寫下來，其實都在回答同一個問題：**同一顆 token，能不能多做一點正事？**

| 槓桿 | 一句話 |
|---|---|
| INPUT | 知識可以翻倍，常駐的部分要寫成索引 |
| CACHE | 別中途換模型，離開超過一小時就開新對話 |
| MODEL | 把「用哪個模型」的規則，放在做決定的那一刻 |
| REWORK | 別只記下教訓，從根源擋住；讓 agent 自己驗 |
| 分發 | 重複的 SOP 寫成 skill，讓每個 agent 都拿到同一本秘笈 |

---

## 今天就能做的一件事

**找出你最常重複交代的一件事，把它寫成 skill。** 如果想不到，先看看你常用的 CLI 有沒有自帶 skill：`glab`、`playwright-cli` 都有，裝上就能少撞很多牆。

---

## 參考資料

- [Claude Code：Skills](https://code.claude.com/docs/en/skills) — skills 的載入方式
- [Agent Skills](https://agentskills.io) — 跨工具的 skill 開放標準
- [akunzai/agent-skills](https://github.com/akunzai/agent-skills) — 我的 skills
- [akunzai/agent-skills：agentsview-extract](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-extract) — 從對話紀錄萃取 AGENTS.md 規則與 skills
- [akunzai/skills-manager](https://github.com/akunzai/skills-manager) — 跨 agent 的 skills 宣告式管理與驗簽
- [vercel-labs/skills](https://github.com/vercel-labs/skills) — `npx skills`
- [OpenSSF Model Signing](https://github.com/sigstore/model-transparency) — skill 簽章所用的格式
