# Pricing rules — smartphone + laptop v1 (DEMO values)

Human-readable mirror of `seeds/pricing/phone_deductions.json` and
`seeds/pricing/laptop_deductions.json`. If they differ, the seed files win;
update this doc in the same commit.

**Formula** (`CLAUDE.md` §6): `final = base_price(variant) − Σ deductions + Σ bonuses`,
floored at `max(base × 5%, ₹300)` scrap value. Bonuses are stored as negative
deductions. `pct` deductions are computed on the **base** price, not the running total.

**Status:** all values below are demo placeholders for M1. The admin pricing pass
(M2) owns real numbers; every change writes to `audit_log`.

## Deduction matrix

| Section | Question | Answer | Impact |
|---|---|---|---|
| Device check | Original phone? | Bought in India | — |
| | | Imported | — (agent checks region lock) |
| | | Copy / first-copy | **deal killed** — polite decline |
| Power | Switches on and runs normally? | Yes | — |
| | | Hangs / restarts | −18% |
| | | Doesn't switch on | −65% |
| Display | Condition | Flawless | — |
| | | Minor scratches | −5% |
| | | Spots / patches / lines | −22% |
| | | Glass cracked, display works | −30% |
| | | Shattered / not visible | −45% |
| | Touch fully working? | Yes | — |
| | | Dead zones | −28% |
| Body | Condition | Like new | — |
| | | Light scratches | −4% |
| | | Dents / chips | −10% |
| | | Bent frame / cracked back | −18% |
| Functions | Cameras | Clean | — |
| | | Blur / spots | −12% |
| | | Not working | −22% |
| | Battery | >85% health | — |
| | | 80–85% | −6% |
| | | <80% / service warning | −14% |
| | Biometrics | Working | — |
| | | Not working | −8% |
| | Speaker / mic | Fine | — |
| | | Issues | −8% |
| | Network / SIM | Fine | — |
| | | Issues | −25% |
| | Water damage | Never | — |
| | | Yes / not sure | −35% |
| Extras | Original box (IMEI match) | | **+₹300** |
| | Original charger / cable | | **+₹250** |
| Bill | Bill + active warranty | | **+3%** |
| | Bill only | | **+₹200** |
| | No bill | | — |

## Laptop deduction matrix (composed mode)

Laptops resolve their base price first: `base_config` buyback + one INR modifier
per axis (CPU / RAM / storage / GPU) from `demo_base_prices.laptop.json` — every
axis has exactly one ₹0 "base" label (unit-tested invariant). Then deductions apply:

| Section | Question | Worst answers | Impact |
|---|---|---|---|
| Ownership | Can sign out of iCloud/Microsoft/BIOS? | No — locked | **deal killed** |
| Power & boot | Boots normally? | Hangs −20% · dead −60% |
| Display | Condition | Spots/lines −18% · cracked −30% |
| Keyboard/trackpad | Working fully? | Some keys −10% · mostly dead −18% |
| Body & hinge | Condition | Dents −10% · hinge broken −18% |
| Battery | Charge held | Fast drain −8% · plugged-in only −15% |
| Ports | All working? | Some dead −8% |
| Storage health | Warnings/slowness? | Issues −10% |
| OS licence | Genuine & activated? | No −₹1,500 flat |
| Charger | Included? | Third-party −₹500 · none −₹1,500 |
| Bill | Purchase bill? | Bill+warranty **+3%** · bill only **+₹300** |

## Base prices

Demo base prices: `seeds/pricing/demo_base_prices.phone.json` (per variant) and
`seeds/pricing/demo_base_prices.laptop.json` (base_config + axis modifiers).
Seeds never carry buyback prices (`base_price_inr` / `modifier_inr` stay null per
SEED_SCHEMA); the demo files stand in for the `base_prices` and `variant_axes`
tables until the admin dashboard exists.
