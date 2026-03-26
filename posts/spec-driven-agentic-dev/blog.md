# Spec-Driven Agentic Development — A Lifecycle Analysis

Constitution written. Specifications approved. Plan generated. Task breakdown clean. Then a bug surfaces in the auth layer that invalidates three upstream requirements. The spec needs surgery — update the requirements, regenerate the plan, re-scope tasks, re-implement. What took 30 minutes to scaffold now blocks the afternoon.

This is the lifecycle tension at the heart of spec-driven agentic development. The pipeline works in one direction. The question is what happens when reality pushes back.

![Hand-drawn pencil sketch of a factory conveyor belt with five stations labeled CONSTITUTION, SPECS, PLAN, TASKS, and CODE. The belt runs smoothly through the first three stations but cracks apart between PLAN and TASKS, where a sign reads REALITY. Documents scatter from the break point into chaos on the right side.](images/pipeline-breaks-sketch.jpg)

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The&nbsp;Promise&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Unstructured AI coding produces measurable problems. CodeRabbit's analysis of 470 GitHub pull requests found AI-co-authored code carries 1.7x more issues than human-only code, with security vulnerabilities at 2.74x the rate [1]. METR's randomized controlled trial showed experienced developers were 19% slower with AI tools — despite believing they were 20% faster [2]. A 39-percentage-point perception gap. The most dramatic case: Jason Lemkin's 12-day Replit experiment, where an AI agent deleted a live production database containing 1,206 executive records — despite being told 11 times in ALL CAPS not to do it [3].

The response: formalize the workflow. Spec-driven development defines requirements as specifications, generates plans from those specs, breaks plans into tasks, and lets agents implement within constraints. Den Delimarsky, the GitHub PM behind Spec Kit, frames the underlying assumption: "We treat coding agents like search engines when we should be treating them more like literal-minded pair programmers" [4]. Addy Osmani extends the argument: spend 70% of effort on problem definition, 30% on execution [5].

The strongest argument for SDD is that specs give entire teams a shared artifact. Product owners, architects, and engineers can all contribute during the spec phase — before a single token flows. Brooker calls this "shared understanding between developers and stakeholders" [15]. The appeal is obvious: a BA or PM can read a spec and understand scope, motivation, and acceptance criteria without parsing a pull request.

But Bockeler found a gap between that promise and practice. The SDD tools she reviewed don't clarify "who is the target user?" — they assume a solo developer doing all the analysis, not a collaborating team [10]. The stakeholder-engagement narrative is largely aspirational marketing, not documented practice. Somma identifies a deeper problem with spec review itself: "Planning often becomes a social process. People nod. People optimize for alignment. People avoid being the blocker. Under time pressure, that tendency gets amplified" [16]. Spec review risks becoming ceremonial approval rather than genuine alignment.

Osmani frames the tension precisely: reviewing specs instead of code is "appealing in the same way Waterfall methodology was once appealing" — but "translating a spec to working code involves an enormous number of implicit decisions — edge cases, data structures, error handling, performance tradeoffs — that no spec ever fully captures" [17]. Only 48% of developers consistently check AI-assisted code before committing it [17]. Specs add a review layer, but do not eliminate the need for the code review that half of developers already skip.

The logic is clean. The problem is real. Whether the cure introduces its own complications is the open question.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The&nbsp;Bootstrap&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Where spec-driven genuinely delivers is the 0-to-1 phase. New projects, new features, new systems — the blank-slate problem where agents have no existing code to learn from and developers have not yet formed strong opinions about architecture.

![Hand-drawn pencil sketch showing a blank whiteboard on the left labeled BLANK SLATE, an arrow pointing right through a clock to a fully scaffolded building structure labeled SCAFFOLD with blueprint documents fluttering around it. A dotted arrow below continues rightward into a tangled knot of arrows labeled ITERATION.](images/bootstrap-scaffold-sketch.jpg)

In this phase, specs do three things well. They force upfront thinking before tokens start flowing. They create shared vocabulary between developer and agent. They scaffold quickly — constitution to working code in a single session.

Kent Beck offers a useful frame: "What game are we playing?" [18]. The Finish Line Game — build X, you're done — is where specs work. The codebase is empty. The developer needs structure. The spec provides a single, clear target. Bootstrap is a Finish Line Game.

One Hacker News developer described spending "2-3 hours writing a spec focusing on acceptance criteria and then by the end of the day I have a working, tested next version of a feature." An embedded systems engineer reported doing "over 70% using LLMs by specs — great for grounding." Prezi Engineering tested the approach across four teams and found it "both terrifying and exciting" — with the caveat that "some team members felt that for certain work, going through all the stages seemed like overkill."

The pattern is consistent: bootstrap value is real. But every testimonial carries a qualifier about what happens next. The pipeline runs forward. Then iteration begins. Beck's second game — the Compounding Game, where "the first thing we finish will earn the resources for the next thing" — requires a different approach entirely [18]. Most software is a Compounding Game.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Four&nbsp;Walls&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

The same lifecycle that makes bootstrapping smooth creates friction at four points when the project moves from scaffold to iteration.

**Over-contexting.** ETH Zurich tested 138 real-world tasks across four coding agents and found that LLM-generated context files reduced success rates by 3% while increasing costs by 20% and reasoning tokens by 22% [6]. The key finding was counterintuitive: "The agents did follow the instructions — they ran more tests, searched more files. So the problem isn't that agents ignore the files. Rather, unnecessary requirements made the tasks harder" [6]. The "Curse of Instructions" research explains part of the mechanism: prompt-level accuracy follows a power law where accuracy equals per-instruction accuracy raised to the number of instructions. At 10 instructions, GPT-4o drops to 15% compliance [7].

The context budget makes this concrete. A 200K-token window has roughly 140K usable tokens after system prompt and autocompact buffer. Spec Kit generates 3.7x to 7.5x more markdown than code — a single feature's specs can consume 100K tokens [8]. That leaves roughly 40K tokens for actual code reasoning, barely above the compaction threshold.

![Hand-drawn pencil sketch of a glass jar representing a context window. The jar is stuffed with stacked documents labeled SPECS, REQUIREMENTS, ACCEPTANCE CRITERIA, and ARCHITECTURE filling most of the space. A tiny sliver at the top holds a thin document labeled CODE. An arrow points to the code sliver with the label 2.5% SIGNAL.](images/context-window-jar-sketch.jpg)

Attention is zero-sum: every spec token competes with code for the model's finite attention. In a 20K-token context, the relevant code may be only 500 tokens — a 2.5% signal ratio [19]. Degradation starts early. Chroma's study of 18 models found performance degrades at 25% of window capacity, not at the limit [19]. A model with a 200K window shows significant degradation at 50K tokens — one quarter of the advertised size. NVIDIA's RULER benchmark confirms: effective context is 50-65% of advertised across frontier models [20]. Well-structured specification documents with consistent terminology may actually create more semantic interference, not less — Chroma found that "shuffled haystacks consistently outperformed structured ones across all 18 models" because organized documents create plausible distractors [19].

SDD advocates counter that specs are curated context, not dumping — structured, intentional, domain-specific [5]. The distinction is real. Whether it survives at scale — when a project accumulates specs across multiple features, each loaded into the same finite window — is the open question.

**Static rigidity.** Colin Eberhardt ran the most rigorous head-to-head comparison. Spec Kit took 33.5 minutes of agent time plus 3.5 hours of human review to produce 2,577 lines of markdown and 689 lines of code. Iterative prompting took 8 minutes plus 15 minutes of review to produce 1,000 lines of code [8]. Ten times slower, 14 times the review burden. Zaninotto documented Spec Kit generating 8 files and 1,300 lines of markdown for a feature that displays the current date [9]. Bockeler found reviewing the spec markdown "tedious" — "I'd rather review code" [10].

Kiro added two-way sync — code changes update specs, spec changes regenerate tasks. Tessl builds specs that evolve with the codebase. These are real iteration mechanisms, but they are documentation claims, not measured outcomes.

![Hand-drawn pencil sketch of a confused robot sitting between a dusty document labeled STALE SPEC v1.0 with cobwebs and a spider, and a modern laptop showing clean code labeled EVOLVED CODE with checkmarks. The robot holds the spec in one hand and points at the laptop with the other, with a question mark thought bubble above its head.](images/spec-afterlife-sketch.jpg)

**Spec afterlife.** What happens to specs after the initial build? The consensus: most teams abandon them. The arXiv paper explicitly labels spec-first as "May abandon" [22]. Breunig identifies the practical barrier: "The spec gets written, it gets implemented, it gets released. Is the spec updated? No" [23]. Updating specs "feels like overhead, especially when you're moving fast. And the entire point of using agents is to move fast" [23]. Augment Code frames the structural reason: "Every documentation-first initiative in software has failed for the same reason: it asked developers to do continuous maintenance work that nobody sees and nobody rewards" [13].

Stale specs do not merely sit idle — they actively mislead. Unlike stale docs that mislead humans who can exercise judgment, stale specs mislead agents who execute confidently on wrong information. Augment Code: "They'll execute a plan that no longer matches reality, confidently, and they won't flag that anything is wrong" [13]. Bockeler observed this directly: an agent took spec descriptions of existing classes and created duplicates — it read old specs as new instructions [10]. Context debt compounds: specs plus code equals parallel sources of truth. Each iteration widens the gap between them. A Reddit user summarized the practitioner experience: "You update a business rule but the spec still says the old thing. The agent doesn't know. It just builds from what it finds."

Kiro and Tessl claim living specs that evolve with the codebase. The evidence is from tool documentation, not longitudinal user data.

**No end-to-end verification.** One GitHub Spec Kit user reported: "most of the tests don't match the code" [14]. Zaninotto documented an agent that marked verification complete without writing a single unit test — it wrote manual testing instructions instead [9]. Bockeler identified the deeper risk: spec-as-source approaches combine "the downsides of both MDD and LLMs: inflexibility AND non-determinism" [10].

Tessl integrates testing as a core pillar alongside plans and specs. Kiro generates property-based tests from requirements. These are genuine responses to the verification gap — but the gap itself remains well-documented in practice.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The&nbsp;Industry&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

The most significant finding across six research reports: none of the three major AI coding tool vendors endorse spec-driven development.

![Hand-drawn pencil sketch of three roads labeled ANTHROPIC (Context Engineering), OPENAI (Bias to Action), and GOOGLE (Right Tool) converging into a single bold path labeled ITERATIVE + VERIFY. A fourth path labeled SPEC-DRIVEN (Kiro) diverges away from the group with a question mark at its end.](images/industry-convergence-sketch.jpg)

**Anthropic** advocates "context engineering" — "the set of strategies for curating and maintaining the optimal set of tokens" [21]. The philosophy is surgical context, not comprehensive specification. Best practice: "Explore first, then plan, then code" — but skip planning when scope is clear [25]. Internal teams favor "try one-shot first, then collaborate" — let the agent attempt the full implementation, and if it works (roughly one-third of the time), you have saved significant time [26]. On CLAUDE.md: "Would removing this cause Claude to make mistakes? If not, cut it" [25].

**OpenAI** defaults to action: "Default to implementing with reasonable assumptions; do not end your turn with clarifications unless truly blocked" [24]. Plan only roughly 25% of tasks [24]. AGENTS.md is "an open-format README for agents" — keep it "short, accurate" [27]. The emphasis is on configuring once, then iterating over time — not front-loading comprehensive specifications.

**Google** prescribes tool-task matching — inline generation for functions, agents for multi-file work, Jules for async background tasks [28]. No single methodology prescribed. "Writing a new function? Use inline generation. Taking an app from v1 to v2? Use an agent." Flexibility is the methodology.

All three independently arrived at the same meta-pattern: persistent config files (CLAUDE.md / AGENTS.md / GEMINI.md) plus plan mode for complex tasks plus progressive context loading plus verification-first. None chose spec-first. AWS/Kiro stands alone as the major vendor championing SDD [15]. Thoughtworks placed SDD in the "Assess" ring — the lowest recommendation level [11].

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Open&nbsp;Ground&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Proxy evidence creates a plausible case for structure over chaos. METR's RCT found unstructured AI use made experienced devs 19% slower, partly due to "overly simple prompts" [2] — implying structure helps, but not proving SDD specifically. Tessl's benchmark across roughly 270 repos showed structured API docs improved agent correctness by 35% [29] — but that measures API correctness, not productivity, and it is a vendor study. GitClear's analysis of 211 million lines found refactoring collapsed from 25% to under 10% while copy-paste doubled in the AI era [30] — implying unstructured AI use degrades quality. DORA 2025 identified "AI-accessible internal data" as one of seven capabilities that amplify AI benefits [31] — organizational context matters, but methodology-level evidence is absent.

The direct evidence is thin — and points the other direction. Eberhardt's head-to-head found SDD 10x slower for a small feature [8]. Bockeler's qualitative evaluation found all three SDD tools "verbose" and "tedious" [10]. No vendor — not Kiro, Tessl, or Spec Kit — has published comparative productivity data. The arXiv paper claiming "error reductions of up to 50%" cites blog posts, not peer-reviewed studies — the claim is an extrapolation, not a measurement [22].

The honest framing: the proxy evidence creates a plausible case that structured approaches outperform unstructured ones. Plausibility is not proof. The gap is temporal — SDD is less than 12 months old, and the tooling is too new for controlled studies. The one existing head-to-head comparison found SDD slower for small features, which says more about task-size fit than methodology. The question is not whether structure helps — the METR and Tessl data suggest it does — but whether full SDD pipelines provide the right amount of structure or overshoot into bureaucracy.

Beck's framework holds: the Finish Line Game — build X, you're done — is where specs work [18]. The Compounding Game — continuous evolution — is where "a better spec will never get you from N to N+1 forever" [18].

![Hand-drawn pencil sketch showing two contrasting game boards side by side. Left: a straight race track with a runner approaching a FINISH banner, labeled FINISH LINE GAME (Bootstrap). Right: a spiral track with checkpoints marked by flags that loops endlessly inward, with a runner who can never reach an end, labeled COMPOUNDING GAME (Everything After). An arrow between them reads MOST SOFTWARE.](images/finish-line-compounding-sketch.jpg)

The historical parallel is direct: CASE tools in the 1980s, UML and Model Driven Architecture in the 2000s — Fowler called MDA "Night of the Living CASE Tools" [12]. Bockeler identified the specific risk for SDD: combining MDD's inflexibility with LLMs' non-determinism [10].

![Hand-drawn pencil sketch of three monuments on a shared stone foundation labeled SAME FOUNDATION. Left: a tall weathered obelisk labeled CASE TOOLS (1980s). Center: a shorter gravestone labeled MDA/UML (2000s). Right: a shiny new structure under construction with scaffolding and a crane, labeled SPEC-DRIVEN DEV (2020s). A developer in a DEV t-shirt stands to the right scratching their head.](images/methodology-monuments-sketch.jpg)

**If you're evaluating**, the proxy evidence favors structure over chaos. The unanswered question is how much structure — and whether full SDD pipelines overshoot.

**If you already use them**, watch for spec afterlife. The moment specs stop getting updated is the moment they start misleading your agents.

**If you're building these tools**, the industry is converging on iterative context engineering, not upfront specification. Follow the evidence as it arrives.

---

![Hand-drawn pencil sketch of a balance scale on a pedestal labeled WORKING SOFTWARE. The left side holds a heavy stack of documents labeled SPECIFICATION, weighing it down. The right side holds a figure running inside a circular loop of arrows labeled ITERATION, with upward momentum. The scale tips toward specification but the iteration side rises.](images/spec-vs-iteration-sketch.jpg)

The tension between specification and iteration predates AI by decades. The Agile Manifesto chose "working software over comprehensive documentation." Spec-driven tools are testing whether AI changes that calculus. The evidence so far says: for bootstrapping, partially. For the rest of the lifecycle, not a verdict — SDD does not fail because specifications are wrong. It struggles because software is not a Finish Line Game.

---

**References**

1. CodeRabbit. "State of AI vs Human Code Generation." [businesswire.com](https://www.businesswire.com/news/home/20251217666881/en/).
2. METR. "AI-Experienced Developer Productivity Study." [metr.org](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/).
3. Business Insider. "Replit CEO Apologizes After AI Coding Tool Deletes Database." [businessinsider.com](https://www.businessinsider.com/replit-ceo-apologizes-ai-coding-tool-delete-company-database-2025-7).
4. Den Delimarsky. "Spec-Driven Development with Spec Kit." [github.blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/).
5. Addy Osmani. "How to Write a Good Spec for AI Agents." [addyosmani.com](https://addyosmani.com/blog/good-spec/).
6. Gloaguen et al. "Evaluating AGENTS.md." ETH Zurich. [arxiv.org](https://arxiv.org/html/2602.11988v1).
7. "Curse of Instructions." [openreview.net](https://openreview.net/forum?id=R6q67CDBCH).
8. Colin Eberhardt. "Putting Spec Kit Through Its Paces." [blog.scottlogic.com](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html).
9. Francois Zaninotto. "SDD: The Waterfall Strikes Back." [marmelab.com](https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html).
10. Birgitta Bockeler. "Understanding SDD: Kiro, spec-kit, and Tessl." [martinfowler.com](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html).
11. Thoughtworks Technology Radar. "Spec-Driven Development." [thoughtworks.com](https://www.thoughtworks.com/radar/techniques/spec-driven-development).
12. Martin Fowler. "Model Driven Architecture." [martinfowler.com](https://martinfowler.com/bliki/ModelDrivenArchitecture.html).
13. Augment Code. "What SDD Gets Wrong." [augmentcode.com](https://www.augmentcode.com/blog/what-spec-driven-development-gets-wrong).
14. GitHub Spec Kit Discussion #988. [github.com](https://github.com/github/spec-kit/discussions/988).
15. Marc Brooker. "Kiro and the Future of Software Development." [kiro.dev](https://kiro.dev/blog/kiro-and-the-future-of-software-development/).
16. Marco Somma. "Adversarial Planning for SDD." [dev.to](https://dev.to/marcosomma/adversarial-planning-for-spec-driven-development-4c3n).
17. Addy Osmani. "Comprehension Debt." [addyosmani.com](https://addyosmani.com/blog/comprehension-debt/).
18. Kent Beck. "Earn And Learn." [tidyfirst.substack.com](https://tidyfirst.substack.com/p/earn-and-learn).
19. Chroma Research. "Context Rot." [research.trychroma.com](https://research.trychroma.com/context-rot).
20. NVIDIA. "RULER: What's the Real Context Size?" [arxiv.org](https://arxiv.org/html/2404.06654v1).
21. Anthropic. "Effective Context Engineering for AI Agents." [anthropic.com](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).
22. Naszcyniec et al. "Spec-Driven Development: From Code to Contract." [arxiv.org](https://arxiv.org/pdf/2602.00180).
23. Drew Breunig. "The SDD Triangle." [dbreunig.com](https://www.dbreunig.com/2026/03/04/the-spec-driven-development-triangle.html).
24. OpenAI. "Codex Prompting Guide." [developers.openai.com](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide).
25. Anthropic. "Claude Code Best Practices." [code.claude.com](https://code.claude.com/docs/en/best-practices).
26. Anthropic. "How Anthropic Teams Use Claude Code." [claude.com](https://claude.com/blog/how-anthropic-teams-use-claude-code).
27. OpenAI. "AGENTS.md Guide." [developers.openai.com](https://developers.openai.com/codex/guides/agents-md).
28. Google. "Five Best Practices for AI Coding Assistants." [cloud.google.com](https://cloud.google.com/blog/topics/developers-practitioners/five-best-practices-for-using-ai-coding-assistants).
29. Tessl. "A Proposed Evaluation Framework for Coding Agents." [tessl.io](https://tessl.io/blog/proposed-evaluation-framework-for-coding-agents).
30. GitClear. "AI Copilot Code Quality: 2025 Data." [gitclear.com](https://www.gitclear.com/ai_assistant_code_quality_2025_research).
31. Google Cloud DORA. "State of AI-assisted Software Development 2025." [dora.dev](https://dora.dev/dora-report-2025/).
