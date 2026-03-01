# Task 0: Comprehension Report (Uniswap/uniswap-ai)

## What the project does
`Uniswap/uniswap-ai` is an Nx monorepo of agent-facing plugins, skills, and evals that encode Uniswap integration workflows for coding agents rather than shipping a single executable trading application. Its core artifacts are markdown skill specs, plugin manifests, and Promptfoo eval suites that standardize how an agent should guide developers through swaps, liquidity planning, v4 hook security, viem/wagmi integration, and CCA configuration/deployment.

## Core function at protocol level
At the protocol layer, the repo solves orchestration and correctness for AI-assisted Uniswap integration by codifying canonical patterns (Trading API 3-step flow, Universal Router commanding, Permit2 handling, chain/router address references, safety checks) and continuously evaluating response quality. It reduces integration errors that commonly occur when moving from natural language requests to route selection, approval semantics, and transaction submission patterns.

## AI <> DeFi integration pattern (prompt -> intent -> transaction)
1. Prompt classification: skill trigger metadata routes user prompts into domain-specific skills (e.g., `swap-integration`, `swap-planner`, `liquidity-planner`).
2. Structured planning: skill workflows extract token/amount/chain intent and enforce validation (address formats, chain allowlists, parameter completeness).
3. Protocol preparation: the trading skill maps to Uniswap Trading API calls (`/check_approval`, `/quote`, `/swap`) or Universal Router SDK/contract flows.
4. Execution handoff:
   - `uniswap-trading` returns executable transaction payloads for wallet signing/submission.
   - `uniswap-driver` intentionally outputs deep links to `app.uniswap.org` for explicit user execution (plan-then-execute safety model).
5. Quality guardrails: eval suites assert required protocol details and anti-footgun behaviors (routing-shape differences, Permit2 null/field handling, quote spread semantics).

## Architectural decisions worth replicating
- Agent-agnostic skill format: markdown-first skills and manifests that work beyond a single model runtime.
- Separation of concerns by plugin: trading integration, planning/deep-link UX, viem/wagmi fundamentals, and security each isolated into focused packages.
- Eval-first development: Promptfoo suites/rubrics enforce protocol-correct responses and prevent regression in AI guidance quality.
- Strong operational docs: chain maps, known pitfalls, and routing-type-specific request construction are explicit and test-backed.
- Safety posture in planner plugin: user executes via interface deep links instead of opaque autonomous transaction sends.

## Gaps, rough edges, missing features
- No unified production app: repository is guidance/evaluation heavy but not an end-user dApp implementation.
- Limited direct executable TypeScript modules: most integration logic is prescriptive markdown, not reusable runtime libraries.
- Uniswap-centric assumptions: strong coupling to Trading API semantics and Universal Router details limits direct portability.
- Deep-link planner scope: good for transparency, but excludes fully automated execution architecture by design.
- Partial coverage for non-swap DeFi primitives in executable form (e.g., no concrete LP management SDK layer inside this repo).

## Primary references
- [uniswap-ai README](https://github.com/Uniswap/uniswap-ai)
- [Architecture docs](https://github.com/Uniswap/uniswap-ai/tree/main/docs/architecture)
- [uniswap-trading skill](https://github.com/Uniswap/uniswap-ai/blob/main/packages/plugins/uniswap-trading/skills/swap-integration/SKILL.md)
- [uniswap-driver skills](https://github.com/Uniswap/uniswap-ai/tree/main/packages/plugins/uniswap-driver/skills)
