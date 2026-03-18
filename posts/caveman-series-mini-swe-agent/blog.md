# One Tool, One Loop, One Done Marker

Strip an AI coding agent to its minimum. One tool: bash. One control flow: loop until done. One completion signal: a marker string in the output. No function-calling framework, no tool registry, no planner module.

This is mini-swe-agent — roughly 200 lines of Python that solves real coding tasks by doing the simplest thing that could possibly work.

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The&nbsp;Loop&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

The agent receives a task. It asks the model for one bash command. It runs that command in a subprocess. It reads the output. It asks for the next command. This repeats until the model outputs a DONE marker — a specific string like `COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT` — as the first line of its response.

```mermaid
flowchart TD
    A(Receive Task) --> B(Ask Model for<br/>Bash Command)
    B --> C(Run Command<br/>in Subprocess)
    C --> D(Capture Output<br/>& Return Code)
    D --> E(DONE Marker<br/>Found?)
    E -->|No| B
    E -->|Yes| F(Return<br/>Final Result)

    classDef dark fill:#1a1a2e,color:#fff,stroke:#16213e,stroke-width:2px
    classDef teal fill:#00897b,color:#fff,stroke:#00695c,stroke-width:2px
    classDef blue fill:#1565c0,color:#fff,stroke:#0d47a1,stroke-width:2px

    class A dark
    class B,C,D teal
    class E dark
    class F blue
```

That is the entire architecture. No routing logic, no chain-of-thought orchestration, no multi-agent coordination. The model sees the full conversation history each iteration and decides what to do next based on everything that has happened so far.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The&nbsp;Prompt&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Every iteration sends the complete conversation to the model. The messages array starts with a system prompt and the task description, then grows by two messages per cycle: the model's bash command (assistant role) and the execution output (user role, labeled as an observation).

```mermaid
flowchart TD
    A(System Prompt) --> B(Task Message)
    B --> C(Command 1)
    C --> D(Observation 1)
    D --> E(Command 2)
    E --> F(Observation 2)
    F --> G(Command N...)
    G --> H(Observation N...)

    classDef dark fill:#1a1a2e,color:#fff,stroke:#16213e,stroke-width:2px
    classDef teal fill:#00897b,color:#fff,stroke:#00695c,stroke-width:2px

    class A,B dark
    class C,D,E,F,G,H teal
```

By step 10, the model sees the system prompt, the task, and 20 additional messages — 10 commands and 10 observations. The context grows linearly. The model processes everything from scratch each time, which is simple but expensive: a 50-step task sends the full history 50 times.

The system prompt is a Jinja2 template that renders with runtime variables — task description, step limit, cost limit, and working directory. The observation template wraps each command output with the return code, so the model knows whether a command succeeded or failed without parsing stderr.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Error&nbsp;Paths&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Three things break the loop. Format errors: the model returns something other than a single bash code block — the agent sends an error message back and lets the model retry. Timeouts: a command runs longer than the configured limit — the agent kills the process and reports what happened. Limit violations: step count or inference cost exceeds the ceiling — the agent stops and returns whatever it has.

```mermaid
flowchart TD
    A(Model Response) --> B(Valid Format?)
    B -->|No| C(Format Error<br/>Send Feedback)
    C --> D(Model Retries)
    B -->|Yes| E(Run Command)
    E --> F(Timed Out?)
    F -->|Yes| G(Kill Process<br/>Report Timeout)
    F -->|No| H(Check Limits)
    H -->|Exceeded| I(Stop Agent)
    H -->|OK| J(Continue Loop)

    classDef dark fill:#1a1a2e,color:#fff,stroke:#16213e,stroke-width:2px
    classDef red fill:#c62828,color:#fff,stroke:#b71c1c,stroke-width:2px
    classDef orange fill:#e65100,color:#fff,stroke:#bf360c,stroke-width:2px
    classDef teal fill:#00897b,color:#fff,stroke:#00695c,stroke-width:2px

    class A dark
    class B dark
    class C,G red
    class D,J teal
    class E dark
    class F dark
    class H orange
    class I red
```

Format errors are recoverable — the model gets feedback and adjusts. Timeouts are informational — the model sees what happened and can try a different approach. Limit violations are terminal. The DONE marker is the only clean exit. If the model never outputs it, the loop runs until a limit stops it.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Why&nbsp;Simple&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Three components carry all the weight. The model decides what to do — it is the reasoning engine. The environment executes bash commands — it is the hands. The agent manages the loop, validates format, enforces limits, and assembles messages — it is the coordinator.

```mermaid
flowchart TD
    A(Model<br/>Reasoning) --> B(Agent<br/>Coordination)
    B --> C(Environment<br/>Execution)
    C --> B

    classDef teal fill:#00897b,color:#fff,stroke:#00695c,stroke-width:2px
    classDef blue fill:#1565c0,color:#fff,stroke:#0d47a1,stroke-width:2px
    classDef dark fill:#1a1a2e,color:#fff,stroke:#16213e,stroke-width:2px

    class A teal
    class B dark
    class C blue
```

This decomposition is the same one used by every agent framework, just without the abstraction layers. Claude Code uses dozens of tools and sophisticated routing, but underneath it follows the same pattern: model generates action, environment executes, agent coordinates. The simplicity of mini-swe-agent makes this visible.

One tool works because bash is universal. File reads, writes, searches, compilations, test runs, git operations — all reachable through a single interface. The model does not need a curated tool menu. It needs a shell.

---

The pattern behind every AI coding agent is the same loop: observe, decide, act, observe again. Complexity comes from adding tools, routing, and parallelism — but the core loop does not change. Understanding the minimum viable agent makes the sophisticated ones legible, not mysterious — it strips away scaffolding to reveal the mechanism underneath.

---

**References**

1. SWE-agent. "Mini SWE Agent." [github.com/SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent).
2. Jimenez, Carlos et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" [arxiv.org](https://arxiv.org/abs/2310.06770).
