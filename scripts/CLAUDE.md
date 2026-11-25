# CLAUDE.md: scripts/

Setup, deploy and seed scripts. Owner: Wikan. Root rules in `/CLAUDE.md` also apply.

- `setup-wsl.sh` (planned): installs the pinned Gno toolchain in WSL Ubuntu, with the version from `sc/CLAUDE.md`.
- `deploy.sh` (planned): deploys `sc/` packages to Onyx with the team deployer key. Only Ancung runs it against the team namespace.
- `seed.sh` (planned): creates demo profiles, vouches and jobs on testnet.
- Scripts read keys and endpoints from env vars, never from arguments or committed files. They print every transaction hash they produce.
