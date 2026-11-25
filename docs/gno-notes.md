# Gno.land Notes (team reference)

Quick reference for writing, testing and deploying Gno code. Sources: docs.gno.land
(fetched 2026-11-25) and our own on-chain checks. The docs describe the `master`
branch, which can be ahead of what the chain runs. When the docs and the chain
disagree, the chain wins.

---

## 1. Networks

| Network | Chain ID | RPC | Notes |
|---|---|---|---|
| Mainnet | `gnoland-1` | `https://rpc.gno.land:443` | Live since 2026-09-12. No faucet. |
| Testnet Onyx (Test17) | `onyx-1` | `https://rpc.onyx.testnets.gno.land:443` | Use this one. |
| Latest-testnet alias | (currently `onyx-1`) | `https://rpc.latest.testnets.gno.land:443` | Always points at the current testnet. |
| Staging | `staging` | - | Down since 2026-07-10. Do not use. |

- Onyx runs mainnet's code (each mainnet release is rehearsed there first), keeps
  state across upgrades, has a faucet and open transfers. What works on Onyx works
  on mainnet.
- gnoweb (testnet): `https://latest.testnets.gno.land/r/<g1addr>/<pkg>`
- Faucet: https://faucet.gno.land (rate-limited per address, one request is enough).
- **Package approval.** On the testnet a new package is not active immediately: an
  approver enables it, normally a few seconds after `addpkg`. Check status:

  ```sh
  gnokey query vm/qpkgmeta_json -data "gno.land/r/<g1addr>/<pkg>" \
    -remote https://rpc.latest.testnets.gno.land:443
  ```

  `"status":"live"` = enabled, `"inert"` = not yet, `"absent"` = nothing at that
  path. A refused package still reads "waiting for a package approver". Reasons
  for refusal: https://gpas.latest.testnets.gno.land (look up the exact path).
  Still inert after a minute: ask on Discord. **Deploy early, never at the deadline.**
- **Namespaces.** Use `gno.land/r/<g1addr>/...` and `gno.land/p/<g1addr>/...`
  (no registration needed). Named namespaces (`gno.land/r/<name>/...`) need
  registration in `r/sys/users`. Custom namespaces are not supported.
- Path rules: last element matches `[a-z][a-z0-9_]+` (no hyphens); a version
  suffix like `/v1` is allowed (package name stays without `v1`); max 256 chars.

## 2. Toolchain

- **Install (Linux/macOS only).** On Windows, use WSL (Ubuntu), or build from
  source with Go 1.25+.

  ```sh
  curl -fsSL https://raw.githubusercontent.com/gnolang/gno/master/misc/install.sh | sh
  # installs into ~/.gno/bin: gno, gnokey, gnodev, gnoweb
  ```

- **Version match.** The toolchain must match the version Onyx runs. The launch
  version and every upgrade are listed in `misc/deployments/onyx.gno.land/UPGRADES.md`
  in `gnolang/gno` (that directory lives on the `chain/mainnet` branch, not
  `master`). A `master` install can accept code the chain rejects.
- **`gno`**: `gno mod init gno.land/r/<g1addr>/<name>`, `gno fmt ./...`,
  `gno lint ./...`, `gno test ./... -v`, `gno run -expr "println(F())" .`
  (`gno run` works only for non-crossing functions).
- **`gnokey`**: key management, queries, transactions (see section 9).
- **`gnodev .`**: local chain with hot reload, gnoweb on `:8888`, every key in
  your keybase is pre-funded, a `devtest` account exists.
  - Keys: `A` balances, `R` reload, `N`/`P` move through txs, `E` export genesis,
    `Ctrl+S`/`Ctrl+R` save/reset state.
  - Pull packages from the testnet instead of `master` examples:
    `gnodev -remote gno.land=https://rpc.latest.testnets.gno.land:443 .`
  - Other flags: `-extra-root <dir>`, `-add-account`, `-txs-file`.
- **`gnomod.toml`** (created by `gno mod init`):

  ```toml
  module = "gno.land/r/<g1addr>/myapp"   # must equal the addpkg -pkgpath
  gno = "0.9"                            # only supported value
  # private = true   # re-uploadable (overwrites), but nothing can import it
  ```

  A module with `[[replace]]` cannot be deployed (`development packages are not allowed`).
- **`gnowork.toml`**: an **empty** file at the repo root. Without it, a local
  `r/` package cannot import a local `p/` package during `gno test`/`gno lint`.
  Support in `gnodev`/`gnopls` is still in progress.

## 3. Package kinds

| Kind | Path | Properties |
|---|---|---|
| Pure package | `gno.land/p/...` | Stateless library. Immutable after deploy (mutation panics: "package is immutable post-init"). **Cannot import `/r/`.** |
| Realm | `gno.land/r/...` | Stateful. Globals persist automatically. Has its own address and can hold coins. |
| Ephemeral | `gno.land/e/<addr>/run` | A `maketx run` script with `main()`. Not stored. |

- No in-place upgrade of a public realm. Publish a new version path (`/v2`).
- Suggested layout: types/interfaces in `p/<ns>/<app>`, state and entry points
  in `r/<ns>/<app>`. An `internal` path segment restricts who may import.

## 4. Interrealm v2

A **crossing function** takes `cur realm` (or `_ realm`) as its first parameter.
Every exported function that changes state and is called from outside must be
crossing. `gnokey maketx call` can only call crossing functions, and it crosses
automatically.

```go
package counter

import "chain"

var count int

func init(cur realm) {
	// runs once at deploy; cur.Previous() is the deployer
}

func Increment(cur realm) int {
	caller := cur.Previous().Address() // who called us
	count++
	chain.Emit("Increment", "caller", caller.String())
	return count
}
```

- From another realm or a test: `counter.Increment(cross(cur))`.
- Inside the same realm (no crossing): `helper(cur, ...)`.
- In a filetest `main()`: `counter.Increment(cross)`.
- `realm` methods: `Address()`, `PkgPath()`, `Previous()`, `IsCurrent()`,
  `IsCode()`, `IsUser()`, `IsUserCall()`, `IsUserRun()`, `IsEphemeral()`,
  `Sub(subpath)`, `Subpath()`.
- `rlm.IsCurrent()` validates a realm value **handed to you by a caller**. It is
  useless on your own `cur` (always true).
- **Never persist a realm value.** Store `cur.Address()` or `PkgPath()` instead.
- `cur.Sub("x/1")` gives a sub-realm identity (`pkgpath#x/1`) with its own
  address. Useful for per-account or per-pool treasuries inside one realm.
- Objects of a foreign realm's type cannot be constructed from outside
  ("cannot allocate ... in realm ..."); use that realm's constructor.
- Closures carry the authority of the realm that created them.
- A panic crossing a realm boundary cannot be `recover`ed; the whole tx aborts.

## 5. Differences from Go

- Roughly **Go 1.17**: no generics, no `min`/`max`/`clear`, **no goroutines,
  channels, `select`, or `sync`**, no dot imports, no `reflect`.
- `fmt` is for tests only. Use `gno.land/p/nt/ufmt/v0` (`ufmt.Sprintf`).
- No `encoding/json` (use `p/onbloc/json/v0` (verify it is on-chain)), no `sort.Slice`
  (implement `sort.Interface`).
- `math/rand` uses v2 names (`IntN`); **no `crypto/rand`**. Randomness is
  deterministic, never use it for anything bettable.
- `crypto/sha256` has only `Sum256`. Also available: `crypto/keccak256`,
  `crypto/merkle`, `crypto/bech32`, `math/overflow` (use for token math).
- `time.Now()` is the block timestamp. No `Sleep`, no timers.
- Map iteration follows insertion order.
- **Returning an `error` does NOT revert state. Only `panic()` reverts.**
  Validate all inputs before mutating anything; panic on invalid input.
- **Do not shadow builtins** (`len`, `rune`, `cross`, ...). This is checked at
  deploy time, so code can pass `gno test` and still fail `addpkg`. `cur` is a
  contextual keyword.
- **Persistence cost**: everything reachable from a realm global is persisted.
  A `map` is one object, so reads/writes cost O(n); `avl.Tree` costs O(log n).
  Break-even is around 250-300 entries. Use `avl.Tree` for anything that grows;
  `map` only for small, bounded data.
- Data structures: `avl.Tree` (`Set/Get/Has/Remove/Iterate(start,end,fn)/ReverseIterate`),
  `seqid.ID` for sequential keys (`id.Next().String()`), a secondary tree for a
  second lookup key (e.g. `author/id`).

## 6. Chain stdlib

| Package | Key APIs |
|---|---|
| `chain` | `Emit(type, k, v, ...)`, `PackageAddress(pkgPath)`, `CoinDenom(pkgPath, name)`, `NewCoin(denom, amt)`, `Coins` |
| `chain/runtime` | `ChainID()`, `ChainHeight()`, `ChainDomain()`, `AssertOriginCall()` |
| `chain/runtime/unsafe` | `OriginCaller()`, `OriginSend()`, `CurrentRealm()`, `PreviousRealm()` (legacy; prefer `cur`) |
| `chain/banker` | `NewBanker(type, cur)`, `NewReadonlyBanker()`, `GetCoin`, `GetCoins`, `SendCoins`, `IssueCoin`, `RemoveCoin`, `TotalCoin` |

Builtins: `address` (with `IsValid()`), `realm`, `cross`.

Events from `chain.Emit` are readable via RPC `/block_results`. There is no event
subscription; poll, or use `tx-indexer`.

**Sending coins from the realm:**

```go
import (
	"chain"
	"chain/banker"
)

func payout(cur realm, to address, amt int64) {
	b := banker.NewBanker(banker.BankerTypeRealmSend, cur)
	b.SendCoins(cur.Address(), to, chain.Coins{chain.NewCoin("ugnot", amt)})
}
```

**Reading a balance:** `banker.NewReadonlyBanker().GetCoin(addr, "ugnot")`.
Do not use `GetCoins` (its cost grows with every denom an address holds, and
anyone can send junk denoms). `NewBanker` panics on `BankerTypeReadonly`.

**Accepting payment** (users push coins with `-send`; a realm cannot pull coins,
there is no `transferFrom`):

```go
import "chain/runtime/unsafe"

func Buy(cur realm) {
	if !cur.Previous().IsUserCall() { // NOT IsUser(): it also accepts MsgRun
		panic("must be called directly with maketx call")
	}
	if unsafe.OriginSend().AmountOf("ugnot") != price {
		panic("wrong payment amount")
	}
	// ...
}
```

Keep both checks together. `IsUser()` lets a `maketx run` script consume the
sent coins and then call you with `OriginSend()` still showing the amount.

**ugnot cannot be burned by a realm.** `IssueCoin`/`RemoveCoin` only work on the
realm's own qualified denom (`"/" + pkgPath + ":" + name`, built by
`chain.CoinDenom`). Genesis denoms such as `ugnot` cannot be issued or removed.
To "burn" ugnot, you can only lock it in the realm or send it somewhere.

## 7. Render and gnoweb

- `func Render(path string) string` returns Markdown. URL
  `/r/<ns>/<pkg>:<args>` passes `<args>` as `path`.
- Every realm page has tabs **Content / Source / Actions**. Actions shows a form
  per crossing function (signed via Adena) plus a copy-paste `gnokey` command.
- **TxLinks** (no JS): a Markdown link creates a transaction button.

  ```go
  func Render(path string) string {
  	return "# Counter\n\n[Increment]($help&func=Increment)\n" +
  		"[Vote yes]($help&func=Vote&id=1&choice=yes)\n"
  }
  ```

  Only listed args are prefilled; the client fetches the rest via `vm/qdoc`.
  Whether a TxLink can carry a `-send` amount is not documented (verify).
  Helper package: `p/moul/txlink/v0` (verify API).
- **GnoConnect** (for your own web page): add
  `<meta name="gnoconnect:rpc" ...>`, `gnoconnect:chainid`, `gnoconnect:txdomains`
  (`auto` = current domain). TxLinks must match a listed domain.
- **Sanitize all user input** in Render with `gno.land/p/nt/markdown/sanitize/v0`
  (`sanitize.InlineText(s)`), and escape `|` inside table cells.
- Allowed image hosts: imgur, github, `*.githubusercontent.com`, `*.github.io`,
  `sa.gno.services`, data: SVG.
- Example realms to read: `r/demo/counter`, `r/demo/defi/foo20`,
  `r/gnoland/boards2/v0`, `r/docs/*`.

## 8. Testing

```go
package counter

import (
	"testing"

	"gno.land/p/nt/testutils/v0"
)

func TestIncrement(cur realm, t *testing.T) {
	alice := testutils.TestAddress("alice")
	testing.SetRealm(testing.NewUserRealm(alice)) // simulate Alice calling
	if got := Increment(cross(cur)); got != 1 {
		t.Fatalf("expected 1, got %d", got)
	}
}
```

- `testing` helpers: `SetRealm`, `NewUserRealm(addr)`, `NewCodeRealm(pkgPath)`
  (simulate an intermediate realm, e.g. an attacker), `SetOriginCaller`,
  `SetOriginSend(coins)`, `IssueCoins(addr, coins)`, `SkipHeights(n)` (+5s per block).
- Assertions: `p/nt/uassert/v0` and `p/nt/urequire/v0` (urequire stops the test
  on failure) (verify exact function names, e.g. `uassert.Equal(t, want, got)`).
- `init()` is reserved in test files.
- Example tests with `// Output:` work for plain functions.
- **Filetests** (`filetests/*_filetest.gno`): golden tests that run `main()`.

  ```go
  // PKGPATH: gno.land/r/demo/counter_test
  // SEND: 1000000ugnot
  package counter_test

  import "gno.land/r/demo/counter"

  func main() {
  	counter.Increment(cross)
  	println(counter.Render(""))
  }

  // Output:
  // 1
  ```

  Output directives: `Output`, `Error`, `Events`, `Realm`, `Gas`, `Storage`,
  `Stacktrace`, `TypeCheckError`. Regenerate: `gno test --update-golden-tests .`
  Run only filetests: `gno test -run "_filetest.gno" .`
- Adversarial filetests (attacker realm calling us) are worth writing. Prior art:
  `gnovm/tests/files/zrealm_launder_*.gno`, `misc/audit-pattern-harness/`.

## 9. gnokey

```sh
RPC=https://rpc.latest.testnets.gno.land:443

gnokey add dev                 # new key (gnokey add --recover dev to import)
gnokey list                    # show g1... address
gnokey query bank/balances/<g1addr> -remote $RPC

# Deploy
gnokey maketx addpkg -pkgpath "gno.land/r/<g1addr>/myapp" -pkgdir . \
  -gas-fee 5000ugnot -gas-wanted 5000000 \
  -chainid onyx-1 -remote $RPC dev

# Call (args are primitives only; repeat -args per parameter)
gnokey maketx call -pkgpath "gno.land/r/<g1addr>/myapp" -func Buy \
  -args "1" -send 1000ugnot \
  -gas-fee 2000ugnot -gas-wanted 2000000 \
  -chainid onyx-1 -remote $RPC dev
```

- Transactions broadcast by default. `-broadcast=false > tx`, then `gnokey sign`
  and `gnokey broadcast`, gives an
  offline flow (verify exact sign/broadcast args). Multisig is supported.
- Free queries (`gnokey query <path> -remote $RPC`): `auth/accounts/<addr>`,
  `auth/gasprice`, `vm/qfuncs`, `vm/qfile`, `vm/qdoc`, `vm/qpaths`, `vm/qstorage`,
  `vm/qeval -data 'gno.land/r/x/app.Fn("a")'`, `vm/qrender -data 'gno.land/r/x/app:path'`,
  `vm/qpkgmeta_json -data '<pkgpath>'`.
- **`maketx run` (MsgRun) is not open to everyone on the public testnet.** Do not
  build the demo on it.
- Raw JSON-RPC: failed queries still return HTTP 200; check `ResponseBase.Error`.

## 10. Gas and storage

- `-gas-wanted` = gas ceiling; `-gas-fee` = flat fee in ugnot.
- Gas price floor: `1ugnot` per `1000` gas (0.001 ugnot/gas). It rises under
  load. Minimum fee = gas-wanted x price, e.g. 2,000,000 gas -> at least `2000ugnot`.
- Current price: `gnokey query auth/gasprice -remote $RPC`. Estimate a tx with
  `-simulate only` (verify flag syntax with `gnokey maketx call --help`).
- **Storage deposit: 100 ugnot per byte** of new code or state, locked and
  refunded when the data is deleted. A 3 KB deploy is about 0.32 GNOT. Cap it
  with `-max-deposit`. Default chain ceiling: 100000000ugnot (1 MB).
- Deposits are per realm, and whoever's tx deletes data gets the refund. The
  realm that allocates an object owns it and pays for it. Design for this.

## 11. Security checklist

1. Authenticate with `cur.Previous().Address()`, never with an `address` or
   pkgPath parameter (attacker-controlled). Check `IsCurrent()` on any `realm`
   value received from a caller.
2. Payment guard: `cur.Previous().IsUserCall()` + `unsafe.OriginSend().AmountOf("ugnot")`.
   Not `IsUser()`.
3. Never return pointers to internal state (slices, maps, `*avl.Tree`, struct
   pointers). Return values or primitives.
4. Do not call caller-supplied callbacks/interfaces while holding your realm's
   authority. Closures are safe; top-level FuncDecls from `/p/` are not.
5. Do not embed or export `/p/` types with callback methods (e.g. avl node `Iterate`).
6. Assert concrete types on interface parameters (e.g. `grc20.IsCanonicalTeller(t)`).
7. Never store `realm` values.
8. Do not mix `unsafe.PreviousRealm()` with `cur` (legacy API).
9. Holding a pointer is not holding authority.
10. Interface methods must not take `cur realm`; pass a `caller address` instead.
11. Read balances with `banker.NewReadonlyBanker().GetCoin(addr, "ugnot")`, not `GetCoins`.
12. Sanitize Render output (`sanitize.InlineText`) and escape `|` in table cells.
13. Never import `gno.land/r/tests/vm/test20`.

Also: validate before mutating and `panic` on bad input; keep public functions
thin and authenticated with logic in private helpers; never export a
`*PrivateLedger` (GRC20 `Mint`/`Burn` on it have no realm check).

## 12. Packages on-chain

**Rule: check that a package exists on-chain before importing it.** The docs and
`examples/` describe `master`, which can be ahead of the chain. Quick check:

```sh
gnokey query vm/qfile -data "gno.land/p/nt/avl/v0" -remote $RPC
# InvalidPackageError => not deployed
```

Verified deployed on the Onyx testnet (2026-11-25), all with `/v0` suffix:

| Namespace | Packages |
|---|---|
| `gno.land/p/nt/` | `avl`, `avl/pager`, `seqid`, `ufmt`, `ownable`, `markdown/sanitize`, `testutils`, `uassert`, `urequire`, `grc20`, `grc721`, `groups`, `treasury`, `mux`, `svg` |
| `gno.land/p/moul/` | `addrset`, `authz`, `md`, `mdtable`, `txlink`, `helplink`, `realmpath`, `once`, `fifo` |

**NOT deployed** (exist only on `master`): `p/nt/commondao/v0`, `p/nt/addrset/v0`.
Use `p/moul/addrset/v0` instead of `p/nt/addrset/v0`.

Packages labelled "quarantined" (e.g. `p/moul/collection`) cannot be imported on-chain.

GRC20 quick sketch: `grc20.NewToken(name, symbol, decimals, 0, cur)` returns
`(*Token, *PrivateLedger)`; keep the ledger unexported; transfers go through
`ledger.CallerTeller().Transfer(...)` (verify exact signature against
`r/demo/defi/foo20`).
