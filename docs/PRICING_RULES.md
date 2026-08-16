# Pricing rules — smartphone v1 (DEMO values)

Human-readable mirror of `seeds/pricing/phone_deductions.json`. If the two differ,
the seed file wins; update this doc in the same commit.

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

## Base prices

Demo base prices per variant: `seeds/pricing/demo_base_prices.phone.json`.
Seeds never carry buyback prices (`base_price_inr` stays null per SEED_SCHEMA);
the demo file stands in for the `base_prices` table until the admin dashboard exists.
