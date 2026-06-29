/**
 * Aegis fixtures.
 *
 * Owns the richer presentation shapes consumed by the Guard pages
 * (trusted device profiles, decision replays with weighted petals).
 * Routes import the contract types only; fixtures stay private to the
 * service layer.
 */

import type { DecisionReplay, DeviceProfile } from "./aegis.contract";

export const DEVICE_PROFILES: ReadonlyArray<DeviceProfile> = [
  {
    id: "dev-mbp-14",
    name: "MacBook Pro 14",
    kind: "laptop",
    os: "macOS 15.2",
    browser: "Safari 18",
    location: "Lisbon, PT",
    lastActive: "Now",
    confidence: 99.1,
    trust: 9.8,
    primary: true,
  },
  {
    id: "dev-iphone-15",
    name: "iPhone 15 Pro",
    kind: "phone",
    os: "iOS 18.2",
    browser: "Native app",
    location: "Lisbon, PT",
    lastActive: "2h ago",
    confidence: 97.4,
    trust: 9.4,
  },
  {
    id: "dev-ipad-air",
    name: "iPad Air",
    kind: "tablet",
    os: "iPadOS 18.2",
    browser: "Safari",
    location: "Lisbon, PT",
    lastActive: "Yesterday",
    confidence: 95.8,
    trust: 9.0,
  },
  {
    id: "dev-imac-office",
    name: "Office iMac",
    kind: "desktop",
    os: "macOS 15.1",
    browser: "Chrome 131",
    location: "Lisbon, PT",
    lastActive: "3 days ago",
    confidence: 92.6,
    trust: 8.4,
  },
];

export const DECISION_REPLAYS: ReadonlyArray<DecisionReplay> = [
  {
    id: "dec-replay-1",
    time: "Today · 11:07",
    title: "New beneficiary added",
    outcome: "Step-up OTP",
    confidence: 99.4,
    petals: [
      {
        label: "Behavior match",
        weight: 38,
        sentence: "Typing rhythm and mouse flow match your signature.",
      },
      { label: "Device match", weight: 26, sentence: "MacBook Pro · trusted for 312 days." },
      {
        label: "Historical match",
        weight: 18,
        sentence: "Recognized in 312 of 312 recent sessions.",
      },
      {
        label: "Session consistency",
        weight: 12,
        sentence: "Calm, focused session for the last 2 hours.",
      },
      {
        label: "New beneficiary risk",
        weight: -8,
        sentence: "First transfer to this recipient — one extra proof.",
      },
    ],
  },
  {
    id: "dec-replay-2",
    time: "Today · 10:52",
    title: "Transfer €4,800",
    outcome: "Allowed silently",
    confidence: 98.9,
    petals: [
      {
        label: "Behavior match",
        weight: 42,
        sentence: "Strong rhythm match during press-and-hold.",
      },
      { label: "Device match", weight: 28, sentence: "Same trusted device, same location." },
      { label: "Historical match", weight: 18, sentence: "Similar amounts seen in last 90 days." },
      { label: "Risk delta", weight: -4, sentence: "Slightly above your monthly median." },
    ],
  },
  {
    id: "dec-replay-3",
    time: "Today · 09:14",
    title: "Sign in",
    outcome: "Trusted",
    confidence: 96.2,
    petals: [
      { label: "Behavior match", weight: 36, sentence: "Login rhythm matched immediately." },
      { label: "Device match", weight: 30, sentence: "Primary device, recognized." },
      { label: "Location match", weight: 22, sentence: "Lisbon · usual range." },
      { label: "Time of day", weight: 12, sentence: "Within your normal active hours." },
    ],
  },
];
