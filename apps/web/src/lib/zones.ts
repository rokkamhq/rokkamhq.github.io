import { ZONES } from "./catalog";
import type { Zone } from "./types";

export type ZoneMatch = { serviceable: true; zone: Zone } | { serviceable: false };

export function zoneForPincode(pincode: string): ZoneMatch | null {
  if (!/^\d{6}$/.test(pincode)) return null;
  for (const zone of ZONES) {
    if (zone.pincodes?.includes(pincode)) return { serviceable: true, zone };
  }
  for (const zone of ZONES) {
    if (zone.pincode_prefixes?.some((p) => pincode.startsWith(p))) {
      return { serviceable: true, zone };
    }
  }
  return { serviceable: false };
}
