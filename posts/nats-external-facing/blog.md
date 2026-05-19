# NATS Goes Outside

NATS markets itself on simplicity: one binary, full-mesh routing, accounts in a few lines of config. The simplicity is real — and it is exactly why a NATS cluster cannot face external clients without rebuilding its trust model from scratch.

Inside a VPC, servers gossip membership, share subject interest, and route queue work between mesh peers with no per-message authorization. Point partners at that same cluster and every implicit share becomes attack surface. Going external inverts the model in four places: auth, mesh, region, durability.

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Scoped&nbsp;Identity&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

External clients change the auth question from "is this connection trusted" to "what is this user allowed to do, per request." NATS's answer is a three-tier JWT chain: an **operator** NKey signs **account** JWTs; the account signs **user** JWTs. The account is the tenancy boundary — subjects are namespaced per account, with explicit imports for cross-account flows.

The chain works. Permissions baked into the user JWT do not scale. The `max_control_line` default is 4 KB, and a CONNECT message is a single protocol line. Fifty subject patterns in a user's `pub.allow` push past the limit.

![Pencil schematic of the NATS JWT trust chain. The operator NKey signs the account NKey; the account holds a signing key with an attached permissions template; the signing key issues a small user JWT carrying only identity. A note shows that user JWTs without scoped signing keys can exceed the 4 KB protocol line limit.](images/auth-chain-schematic.png)

**Scoped signing keys** (NATS 2.9+) move permissions off the user JWT entirely. Policy lives on a template attached to a signing key: `--allow-sub "tenant.{{tag(tenant)}}.>"`. Users signed by that key inherit the template at connect time. Edit the template, run `nsc push`, and every connected user picks up the new permissions instantly. The pattern generalizes: when policy and identity travel together, identity wins by size or policy wins by drift. Separating them lets you edit one without redeploying the other.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Mesh&nbsp;Outside&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

Full-mesh routing is what makes a NATS cluster fast. Every server holds a TCP route to every other; a publish reaches any subscriber in one hop. Interest propagation is the optimization that keeps mesh from being a flood: when a client subscribes to `orders.>`, every server learns "forward `orders.*` traffic this way." Queue groups distribute work locality-first across those same routes. All three behaviors were designed for trusted peers.

Now imagine an external client subscribing to `>`. Every internal server forwards production traffic to the externally-facing node. External queue subscribers absorb work meant for internal workers. The mesh is doing exactly what it was designed to do.

![Pencil cross-section sketch of an open-plan office. Inside the office, three desks face each other; small speech bubbles read 'orders.>', 'billing.event', 'telemetry.>' — representing implicit subject interest sharing in a NATS cluster. A wall with a single door separates the office from the outside. Just outside the doorway stands a security guard labelled 'leaf node'; in front of the guard stands a stick figure with a clipboard labelled 'external client'. The visitor speaks only to the guard, never to the desks inside.](images/office-and-guard-sketch.png)

The canonical pattern is to never put external clients on the cluster's client port. Put a **leaf node** in front: an outbound, one-way TCP connection from edge to hub, authenticated locally and bridged upstream as one account-scoped user. Leaf-local clients keep working when the hub link goes down. N implicit mesh edges collapse into one explicit, audited hop.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Across&nbsp;Regions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

When the boundary spans regions, two primitives compose. **Gateways** join clusters — not servers — with interest-only propagation: cluster A ships across the gateway only when cluster B has shown interest in a subject. Connection counts stay sub-quadratic. Three clusters of thirty servers need 180 gateway connections, not the 4,005 a flat full-mesh would require.

**JetStream** is where the trade-off bites. Streams replicate via Raft; the documented maximum is R5. Stretch R5 across three regions and every write commit pays one cross-region round-trip for quorum — a thirty- to two-hundred-fifty-millisecond floor per write, before any application logic runs.

![Pencil schematic of two NATS clusters in separate regions, each with three servers in a triangular full-mesh. A single labelled gateway connects the two clusters, marked 'interest-only.' Inside Region A, three stacked disk icons represent a JetStream R3 stream marked 'home'; inside Region B, a single disk icon marked 'mirror' with an arrow showing async replication from Region A. A note reads 'writes commit in-region; cross-region replication is async.'](images/regions-r3-mirror-schematic.png)

The right shape is R3 inside one region (the stream's "home") plus an asynchronous **mirror stream** in each other region. Mirrors retain the source's sequence numbers and timestamps and tolerate disconnects, but are not part of the write quorum. Cross-region durability becomes eventual rather than synchronous — a price chosen at design time, not at RTT.

---

```mermaid
flowchart TD
    H(["&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Default&nbsp;Trust&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"])
    style H fill:#455a64,color:#fff,stroke:#90a4ae,stroke-width:3px,font-weight:bold,font-size:18px
```

In December 2025, Jepsen published an analysis of NATS 2.12.1. A single-bit error injected on one of five nodes lost 49.7% of acknowledged writes — 679,000 of 1.37 million. A coordinated power failure lost 14.1%. Root cause: NATS calls `fsync` to flush JetStream data to disk once every 120 seconds by default, but acknowledges writes immediately. Raft requires nodes to flush before acknowledging.

The fix is one config line: `sync_interval: always`. Jepsen confirms it restores correctness. Throughput drops to "a few hundred messages per second" — a 100× to 1,000× hit against the headline benchmarks.

![Pencil sketch comparing two delivery lanes representing NATS JetStream write paths. The top lane (labelled 'default: sync_interval 120s') is a fast conveyor; packages stamped 'ACK' fly down it but several fall to the floor unrecovered. The bottom lane (labelled 'sync_interval: always') is slower; each package is written into a ledger book on a shelf before being stamped 'ACK' and continuing on. A small note reads '100–1000× throughput cost.'](images/two-delivery-lanes-sketch.png)

Five months later, NATS 2.14.0 shipped without changing the default. The fast and the durable cannot both be true on the shipped config; operators must opt into the slow path deliberately. This is not NATS-specific. Every distributed system has a config knob whose default favors marketing benchmarks over correctness — and the discipline is to find that knob before production does.

---

NATS going external is not "expose the cluster" — it is collapse the cluster's implicit trust edges into explicit, scoped, account-segregated hops. Auth, mesh, region, durability: the same inversion appears four times. Inside the wall, sharing everything is the point. Outside, every share is a contract that must be named, signed, and audited.

---

**References**

1. Aphyr / Jepsen. "Jepsen: NATS 2.12.1." [jepsen.io/analyses/nats-2.12.1](https://jepsen.io/analyses/nats-2.12.1).
2. Synadia. "Jepsen NATS 2.12.1 — Synadia Response." [synadia.com/blog/jepsen-nats-2-12-1](https://www.synadia.com/blog/jepsen-nats-2-12-1).
3. NATS Documentation. "JWT and Decentralized Authentication." [docs.nats.io/running-a-nats-service/nats_admin/security/jwt](https://docs.nats.io/running-a-nats-service/nats_admin/security/jwt).
4. NATS Documentation. "Scoped Signing Keys." [docs.nats.io/using-nats/nats-tools/nsc/signing_keys](https://docs.nats.io/using-nats/nats-tools/nsc/signing_keys).
5. NATS Documentation. "Leaf Nodes." [docs.nats.io/running-a-nats-service/configuration/leafnodes](https://docs.nats.io/running-a-nats-service/configuration/leafnodes).
6. NATS Documentation. "Gateways." [docs.nats.io/running-a-nats-service/configuration/gateways](https://docs.nats.io/running-a-nats-service/configuration/gateways).
7. NATS Documentation. "JetStream Streams (replicas)." [docs.nats.io/nats-concepts/jetstream/streams](https://docs.nats.io/nats-concepts/jetstream/streams).
8. NATS Documentation. "JetStream Source & Mirror." [docs.nats.io/nats-concepts/jetstream/source_and_mirror](https://docs.nats.io/nats-concepts/jetstream/source_and_mirror).
9. nats-io/nats-server issue #7564. "JetStream loses acknowledged writes by default due to deferred fsync." [github.com/nats-io/nats-server/issues/7564](https://github.com/nats-io/nats-server/issues/7564).
