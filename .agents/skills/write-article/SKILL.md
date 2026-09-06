---
name: write-article
description: Author, edit, or translate technical articles and notes in akunzai.github.io. Triggers on creating new posts, translating between zh-tw and en, applying Taiwanese typography and Pangu spacing, or structuring architectural narratives.
---

# Write Article & Tech Note Skill

Universal authoring guide for `akunzai.github.io`. Synthesizes rigorous technical depth with executive architectural storytelling, practical verification, and professional craft.

## Steps

Execute these steps in order when producing or editing content:

1. **Establish Scope & Problem Statement**
   - Identify the real-world engineering friction point or architectural challenge.
   - Define the audience, context, and why existing conventional approaches fall short.

2. **Draft the Architectural Narrative ("Why before How")**
   - Frame the conceptual foundation before introducing configurations or implementation details.
   - Contrast legacy anti-patterns or common misconceptions against modern, robust solutions.
   - Maintain an engaging, peer-to-peer senior engineering voice—practical, direct, and grounded in lived production reality.

3. **Construct Definitive Implementations & Configurations**
   - Provide minimal, production-grade, and verified code or configuration blocks.
   - Annotate inline with comments explaining non-obvious design choices or gotchas.
   - Keep filenames, titles, and slugs clean; omit arbitrary numerical prefixes (e.g. `01-`, `02-`, `Part 1:`) and control ordering via frontmatter metadata (such as `sidebar.order`).
   - Use `<placeholder>` syntax for user-supplied variables.

4. **Design Architectural Visuals & Diagrams (When Applicable)**
   - Never output raw ASCII art or Unicode box-drawing diagrams.
   - Render diagrams using standard `mermaid` code blocks, natively transformed by `astro-mermaid` for responsive, theme-adaptive vector rendering.
   - Strictly avoid emojis (`🛡️`, `🚀`, etc.) and clunky bracket tags (`[SEC-1]`, `[RULE-2]`); use clean typographic Unicode symbols (`◆`, `◈`, `§`, `▲`, `▸`) when visual distinction is beneficial.

5. **Append Authoritative References**
   - Conclude every article and note with a dedicated references section (`## 參考資料` in `zh-tw`, `## References` in `en`).
   - Itemize official vendor documentation, standards/RFCs, and primary source links relevant to the topic.

6. **Localize & Mirror (Bilingual Parity)**
   - Maintain full parity across `src/content/docs/zh-tw/...` and `src/content/docs/en/...`.
   - Preserve identical heading structures, code blocks, and technical accuracy across both locales.
   - Ensure the English edition reads with natural senior peer clarity, while the Traditional Chinese edition strictly follows Taiwanese technical terminology and Pangu spacing.

7. **Validate Type Safety, Content & Build**
   - Run `aubr check` to diagnose Astro components, Markdown/MDX frontmatter, and TypeScript typing.
   - Run `aubr build` to ensure clean static page compilation, routing integrity, and Pagefind search index generation.

## In-File Reference

### Language & Typography

- **Taiwanese IT Terminology**:
  - `文件` (never 文檔)
  - `儲存庫` or `存放庫` (never 倉庫)
  - `專案` (never 項目)
  - `指令` (never 命令)
  - `程式` (never 程序)
  - `程式碼` (never 代碼)
  - `主分支` (never 主幹)
  - `預設` (never 默認)
  - `支援` (never 支持)
  - `資訊` (never 信息)
  - `介面` (never 接口)
  - `伺服器` (never 服務器)
- **Pangu Space (盤古之白)**: Maintain a single half-width space between CJK characters and alphanumeric words, numbers, or inline code (e.g., `採用 Ed25519 演算法，提升 50% 效能`).
- **Punctuation**: Use full-width punctuation marks (，、。？！：；「」『』) in Chinese prose; use half-width in code blocks and English prose.
- **Idiomatic English**: Write active-voice, professional engineering prose. Avoid translationese, buzzword stuffing, or passive padding.
- **English Default for Repository Content**: Except for Traditional Chinese articles in `src/content/docs/zh-tw/` and locale strings, all repository code, CSS/configuration comments, agent instructions/skills, PR descriptions, and commit messages must be in English.

### Tone & Engineering Style

- **Senior Peer Perspective**: Write with the voice of an experienced staff/principal engineer sharing hard-won production insights.
- **Actionable & Grounded**: Pair warnings with immediate architectural solutions or verified code samples. Avoid vague hand-waving.
- **Respect Context & Attention**: Respect the reader's cognitive budget—deliver maximum information density without unnecessary fluff.

### Information Architecture & Navigation

- **Native Sidebar Sequence**: Let Starlight's sidebar handle reading flow and navigation ordering. Set sequence cleanly via `sidebar.order` in frontmatter instead of embedding manual numbers in headings or filenames.
- **Clean Slugs & Titles**: Keep filenames and titles clean, concise, and descriptive. Avoid `01-`, `Part 01:`, or numerical prefixes.
- **Semantic Cross-Links**: Link between companion articles using clean relative paths (`./<slug>/`) and descriptive titles.

### Diagrams & Visual Discipline

- **Native Mermaid Integration**: Use standard ````mermaid```` code blocks. `astro-mermaid` automatically renders vector diagrams adapted to light and dark themes.
- **No ASCII Slop**: Never generate raw ASCII or Unicode box-drawing diagrams (`┌───┐`, `│`, etc.) in production content.
- **Zero Emoji Policy**: Absolutely NO color emojis in diagrams, headings, or structural labels. Emojis degrade technical credibility and create an unmistakable "AI slop" impression.
- **Clean Typographic Markers**: When distinct hierarchical or category indicators are helpful, use clean monochrome Unicode glyphs:
  - `◆` (filled diamond) for primary tiers or core pillars
  - `◈` (nested diamond) for key boundaries, safeguards, or invariant rules
  - `§` (section sign) for governance clauses, arbitration, or policies
  - `▸` / `▲` / `↓` for directional flow, transitions, or overrides
- **Visual Discipline**:
  - Keep subgraphs and node styling clean and uncluttered.
  - Rely on theme-adaptive colors and subtle strokes rather than loud, saturated color fills.
  - Maximum 1–2 highlighted focus elements per diagram.

### Authoritative References

- **Mandatory Closing Section**: Every article and technical note must conclude with `## 參考資料` (in `zh-tw`) or `## References` (in `en`).
- **Primary Sources**: Prioritize primary authoritative links: vendor official documentation, RFCs, specification standards, and authoritative open-source repositories.
- **Format**: Format each entry as `- [Resource Name](URL) — Contextual summary of the cited standard, specification, or guide.`

### Code Blocks & Formatting

- **Expressive Code Compatibility**: Use valid language identifiers supported by Expressive Code (e.g. `bash`, `sh`, `powershell`, `ts`, `js`, `json`, `yaml`, `toml`, `mermaid`, `text`).
- **Copy-Pasteability**: Write clean commands without `$` or `#` prefixes. Add `$` prefix only when alternating commands with expected terminal outputs.
- **Callouts**: Use GitHub-style alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) strategically for contextual notes or critical risks.

## Completion Criteria

Work is complete when all of the following conditions are satisfied:
- [ ] **Bilingual Parity**: Matching files exist in both `src/content/docs/zh-tw/` and `src/content/docs/en/`.
- [ ] **Navigation & Slugs**: No numerical prefixes in filenames or titles; sequence defined via `sidebar.order`.
- [ ] **Diagram Standards**: Diagrams use native Mermaid syntax with tasteful Unicode typographic symbols (`◆`, `◈`, `§`) if applicable; zero ASCII art, zero clunky bracket tags, zero emojis.
- [ ] **Authoritative References**: Article concludes with official documentation and primary source links in `## 參考資料` / `## References`.
- [ ] **Terminology Audit**: Traditional Chinese files pass Taiwanese terminology check.
- [ ] **Typography Audit**: Pangu spacing is present across all CJK / alphanumeric boundaries; full-width punctuation in Chinese prose.
- [ ] **Syntax & Types**: `aubr check` runs with 0 errors.
- [ ] **Clean Build**: `aubr build` exits with code 0 and indexes all pages.
