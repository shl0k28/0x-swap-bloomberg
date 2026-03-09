# Task 1: Protocol Mapping (Uniswap -> 0x / Matcha)

## Translation table

| Uniswap-specific dependency/pattern | Where it appears in `uniswap-ai` | 0x / Matcha equivalent | Migration notes |
| --- | --- | --- | --- |
| Trading API base URL `https://trade-api.gateway.uniswap.org/v1` | `swap-integration` skill | 0x API base URL `https://api.0x.org` | Use `0x-api-key` + `0x-version: v2` headers. |
| `POST /check_approval` | 3-step flow docs | `GET /swap/allowance-holder/price` or `/quote` issues.allowance + spender | 0x returns approval requirement inline via `issues.allowance` and allowance target fields. |
| `POST /quote` | Trading API quote step | `GET /swap/allowance-holder/quote` (or `/swap/permit2/quote`) | 0x quote returns executable transaction + route fills; pick allowance-holder or Permit2 path explicitly. |
| `POST /swap` | Trading API execution payload generation | `GET /swap/allowance-holder/quote` already returns executable tx | 0x model is quote-first with tx payload in quote response; no separate swap endpoint in this path. |
| UniswapX route types (`DUTCH_V2/V3`, `PRIORITY`) | Routing docs in skill | 0x RFQ/aggregated liquidity routed internally; surfaced as `route.fills[].source` and quote metadata | Matcha (powered by 0x) inherits this liquidity graph behavior; route sources represent venue composition. |
| `x-universal-router-version: 2.0` header | Trading API request headers | No Universal Router version header | 0x does not expose router-version pinning in API headers. |
| `@uniswap/universal-router-sdk` | SDK integration section | 0x API tx building (preferred) or direct viem send on returned tx | Skip manual command encoding in most cases; 0x computes route + calldata server side. |
| `@uniswap/router-sdk`, `@uniswap/v3-sdk`, `@uniswap/sdk-core` | Direct router/path construction | 0x quote/price endpoints + optional source filtering/exclusions | Path math and pool graph construction move from client to 0x SOR backend. |
| Universal Router `execute(commands, inputs, deadline)` ABI and command bytes | Universal Router reference | 0x `transaction` object (`to`, `data`, `value`, optional gas fields) | Router opcode-level assembly is replaced by prebuilt transaction payload returned by 0x. |
| Universal Router chain addresses | Skill address tables | 0x Settler / exchange proxy targets in quote response | Do not hardcode transaction target; trust `quote.transaction.to` per chain. |
| Permit2 decision matrix (CLASSIC vs UniswapX permitData) | Skill troubleshooting and flow docs | 0x Permit2 path: `/swap/permit2/*` and gasless Permit2 payloads | Keep route-aware signature logic but apply to 0x typed data structures (`permit2.eip712`). |
| Deep links `app.uniswap.org/swap` and `/positions/create` | `uniswap-driver` plugin | Matcha UI ([matcha.xyz](https://matcha.xyz)) + direct 0x API integration | For portfolio build, use direct API and custom UI; Matcha deep-link parity is not a public API contract. |
| Liquidity planning V2/V3/V4 primitives | `liquidity-planner` skill | No direct LP-position creation equivalent in 0x Swap API | LP creation/range mgmt remains protocol-specific (e.g., Uniswap position managers), outside 0x swap scope. |
| Uniswap V3 pool/factory ABIs (`slot0`, `getPool`) | viem integration references | Optional viem reads + 0x route transparency (`route.fills`, token metadata) | Keep viem for wallet/contract ops; avoid bespoke pool discovery unless needed for analytics. |
| Trading API rate-limit handling | advanced patterns reference | Same pattern for 0x (`429` retries, jittered backoff) | Reuse resilient client patterns and batch throttling. |
| ERC-4337 smart account wrapper around swap calldata | advanced patterns reference | Same approach with 0x tx payload (`to/data/value`) inside UserOperation | Architecture is portable: replace Uniswap calldata source with 0x quote transaction object. |
| L2 WETH unwrapping caveats | advanced patterns reference | Chain-specific post-trade unwrap checks still applicable | Keep post-trade asset reconciliation (WETH vs native) where route settles wrapped assets. |

## Direct endpoint mapping used in `valence`

| Capability | Uniswap stack | 0x stack implemented |
| --- | --- | --- |
| Indicative quote | Trading API `/quote` | `GET /swap/allowance-holder/price` |
| Executable quote | Trading API `/quote` + `/swap` | `GET /swap/allowance-holder/quote` |
| Allowance detection | `/check_approval` | `issues.allowance` in quote/price + spender target |
| Standard swap execution | `/swap` tx output | `quote.transaction` -> viem wallet send |
| Gasless indicative/executable | UniswapX route families | `GET /gasless/price`, `GET /gasless/quote` |
| Gasless submission | UniswapX signed order submit | `POST /gasless/submit` |
| Gasless status polling | UniswapX lifecycle | `GET /gasless/status/{tradeHash}` |

## Primary references
- [0x API docs](https://0x.org/docs/api)
- [Swap API intro](https://0x.org/docs/0x-swap-api/introduction)
- [Allowance Holder guide](https://0x.org/docs/0x-swap-api/advanced-topics/how-to-set-your-token-allowances)
- [Gasless API get started](https://0x.org/docs/gasless-api/guides/get-started-with-gasless-api)
- [Gasless API reference](https://0x.org/docs/gasless-api/api-references/getgaslessquote)
