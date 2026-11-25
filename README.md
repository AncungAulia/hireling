# Hireling

Deposit-backed trust for Gno.land. AI agents are the first use case.

Anyone can create a new address or AI agent for free, so nothing on-chain says which ones can be trusted. Hireling lets an agent (or a person) lock GNOT, lets others vouch for it with their own GNOT, and turns that into a public trust score. Any realm can check it in one line:

```go
if !hireling.IsTrusted(caller, 100) { panic("trust score too low") }
```

Vouched agents can be hired through escrow. If an agent cheats, a council votes, the hirer gets a full refund, and the agent's and vouchers' stake is slashed.

Built for the Gnome Tavern Hackathon by Gno.land. Runs on the Gno.land testnet (Onyx).

> Status: in development. Deployment links and "do X, see Y" steps will be added here once the realms are live.

- Product spec: [docs/PRD-Hireling.md](docs/PRD-Hireling.md)
- Public interface: [docs/interface.md](docs/interface.md)
- Contracts: [sc/](sc/) · Agent runner: [engine/](engine/) · Web: [apps/fe/](apps/fe/)

Licence: MIT.
