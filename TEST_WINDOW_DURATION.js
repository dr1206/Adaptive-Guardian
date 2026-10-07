// Test script to verify window duration behavior in BehavioralCollector
// This test verifies whether the current implementation can create windows with:
// - windowDurationMs <= 0
// - windowDurationMs < 1000 ms
// And whether this leads to artificially large keysPerSec values

const { performance } = require("perf_hooks");

// Mock the browser environment
global.navigator = {
  userAgent: "test-agent",
  platform: "test-platform",
};
global.Intl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({ timeZone: "UTC" }),
  }),
};
global.crypto = {
  randomUUID: () => "test-uuid",
};

// Import the actual collector code
const fs = require("fs");
const vm = require("vm");

// Read the collector source code
const collectorCode = fs.readFileSync(
  "G:\\New folder\\adaptive-guardian\\src\\services\\behavioral\\collector.ts",
  "utf8",
);

// Since we can't directly run TypeScript, we'll extract the key logic and test it in JavaScript
// We'll focus on the rotateWindow method and related timing logic

console.log("=== Testing Window Duration Logic ===\n");

// Simulate the key variables and methods from BehavioralCollector
class TestBehavioralCollector {
  constructor() {
    this.currentWindowStart = 0;
    this.dwellTimes = [];
    this.flightTimes = [];
    this.mouseSamples = [];
    this.mouseTravelPx = 0;
    this.keyDownTimes = new Map();
    this.clickEvents = [];
    this.scrollDeltas = [];
    this.bufferedWindows = [];
    this.STale_KEYDOWN_MS = 10000;
    this.FLUSH_INTERVAL_MS = 30000;
    this.MAX_BUFFERED_WINDOWS = 60;
    this.MAX_VELOCITY_PX_MS = 8;
  }

  // Mock performance.now() - in real browser this returns milliseconds since page load
  mockPerformanceNow(baseTime = 0) {
    return baseTime + Date.now();
  }

  // Extract the core timing logic from rotateWindow
  testRotateWindowTiming(nowTimestamp) {
    const windowStart = this.currentWindowStart;
    const windowEnd = nowTimestamp;
    const windowDurationMs = windowEnd - windowStart;

    // This is the exact line from collector.ts line 398
    const windowSec = Math.max(windowDurationMs, 1000) / 1000;

    return {
      windowStart,
      windowEnd,
      windowDurationMs,
      windowSec,
      isZeroOrNegative: windowDurationMs <= 0,
      isLessThan1000ms: windowDurationMs > 0 && windowDurationMs < 1000,
      windowSecValue: windowSec,
    };
  }

  // Test the keysPerSec calculation
  testKeysPerSecCalculation(dwellsLength, windowDurationMs) {
    const windowSec = Math.max(windowDurationMs, 1000) / 1000;
    const keysPerSec = dwellsLength / windowSec;
    return {
      dwellsLength,
      windowDurationMs,
      windowSec,
      keysPerSec,
      isArtificiallyLarge: keysPerSec > 1000, // Consider >1000 keys/sec as artificially high for testing
    };
  }
}

console.log("1. Testing normal window duration (30 seconds):");
const collector = new TestBehavioralCollector();
collector.currentWindowStart = 1000000; // Some arbitrary start time
const now30sLater = collector.currentWindowStart + 30000; // 30 seconds later
const result30s = collector.testRotateWindowTiming(now30sLater);
console.log(`   windowStart: ${result30s.windowStart}`);
console.log(`   windowEnd: ${result30s.windowEnd}`);
console.log(`   windowDurationMs: ${result30s.windowDurationMs}`);
console.log(`   windowSec: ${result30s.windowSec}`);
console.log(`   Is <= 0ms: ${result30s.isZeroOrNegative}`);
console.log(`   Is < 1000ms: ${result30s.isLessThan1000ms}\n`);

console.log("2. Testing edge case: windowDurationMs = 0 (same start/end time):");
const nowSameTime = collector.currentWindowStart;
const resultZero = collector.testRotateWindowTiming(nowSameTime);
console.log(`   windowStart: ${resultZero.windowStart}`);
console.log(`   windowEnd: ${resultZero.windowEnd}`);
console.log(`   windowDurationMs: ${resultZero.windowDurationMs}`);
console.log(`   windowSec: ${resultZero.windowSec} (due to Math.max(0, 1000)/1000)`);
console.log(`   Is <= 0ms: ${resultZero.isZeroOrNegative}`);
console.log(`   Is < 1000ms: ${resultZero.isLessThan1000ms}\n`);

console.log("3. Testing edge case: windowDurationMs = 1ms (very short window):");
const now1msLater = collector.currentWindowStart + 1;
const result1ms = collector.testRotateWindowTiming(now1msLater);
console.log(`   windowStart: ${result1ms.windowStart}`);
console.log(`   windowEnd: ${result1ms.windowEnd}`);
console.log(`   windowDurationMs: ${result1ms.windowDurationMs}`);
console.log(`   windowSec: ${result1ms.windowSec} (due to Math.max(1, 1000)/1000 = 1000/1000 = 1)`);
console.log(`   Is <= 0ms: ${result1ms.isZeroOrNegative}`);
console.log(`   Is < 1000ms: ${result1ms.isLessThan1000ms}\n`);

console.log("4. Testing edge case: windowDurationMs = 500ms (less than 1000ms threshold):");
const now500msLater = collector.currentWindowStart + 500;
const result500ms = collector.testRotateWindowTiming(now500msLater);
console.log(`   windowStart: ${result500ms.windowStart}`);
console.log(`   windowEnd: ${result500ms.windowEnd}`);
console.log(`   windowDurationMs: ${result500ms.windowDurationMs}`);
console.log(
  `   windowSec: ${result500ms.windowSec} (due to Math.max(500, 1000)/1000 = 1000/1000 = 1)`,
);
console.log(`   Is <= 0ms: ${result500ms.isZeroOrNegative}`);
console.log(`   Is < 1000ms: ${result500ms.isLessThan1000ms}\n`);

console.log("5. Testing keysPerSec calculation with various scenarios:");
console.log("   Scenario A: 10 keyups in 30-second window (normal):");
const normalResult = collector.testKeysPerSecCalculation(10, 30000);
console.log(`      dwells.length: ${normalResult.dwellsLength}`);
console.log(`      windowDurationMs: ${normalResult.windowDurationMs}ms`);
console.log(`      windowSec: ${normalResult.windowSec}s`);
console.log(`      keysPerSec: ${normalResult.keysPerSec.toFixed(2)}`);
console.log(`      Is artificially large (>1000): ${normalResult.isArtificiallyLarge}\n`);

console.log("   Scenario B: 10 keyups in 0-second window (edge case):");
const zeroWindowResult = collector.testKeysPerSecCalculation(10, 0);
console.log(`      dwells.length: ${zeroWindowResult.dwellsLength}`);
console.log(`      windowDurationMs: ${zeroWindowResult.windowDurationMs}ms`);
console.log(`      windowSec: ${zeroWindowResult.windowSec}s (clamped to 1s)`);
console.log(`      keysPerSec: ${zeroWindowResult.keysPerSec.toFixed(2)}`);
console.log(`      Is artificially large (>1000): ${zeroWindowResult.isArtificiallyLarge}\n`);

console.log("   Scenario C: 10 keyups in 1ms window (extreme case):");
const oneMsResult = collector.testKeysPerSecCalculation(10, 1);
console.log(`      dwells.length: ${oneMsResult.dwellsLength}`);
console.log(`      windowDurationMs: ${oneMsResult.windowDurationMs}ms`);
console.log(`      windowSec: ${oneMsResult.windowSec}s (clamped to 1s)`);
console.log(`      keysPerSec: ${oneMsResult.keysPerSec.toFixed(2)}`);
console.log(`      Is artificially large (>1000): ${oneMsResult.isArtificiallyLarge}\n`);

console.log("   Scenario D: 50 keyups in 500ms window (high activity):");
const highActivityResult = collector.testKeysPerSecCalculation(50, 500);
console.log(`      dwells.length: ${highActivityResult.dwellsLength}`);
console.log(`      windowDurationMs: ${highActivityResult.windowDurationMs}ms`);
console.log(`      windowSec: ${highActivityResult.windowSec}s (clamped to 1s)`);
console.log(`      keysPerSec: ${highActivityResult.keysPerSec.toFixed(2)}`);
console.log(`      Is artificially large (>1000): ${highActivityResult.isArtificiallyLarge}\n`);

console.log("   Scenario E: 100 keyups in 100ms window (very high activity):");
const veryHighActivityResult = collector.testKeysPerSecCalculation(100, 100);
console.log(`      dwells.length: ${veryHighActivityResult.dwellsLength}`);
console.log(`      windowDurationMs: ${veryHighActivityResult.windowDurationMs}ms`);
console.log(`      windowSec: ${veryHighActivityResult.windowSec}s (clamped to 1s)`);
console.log(`      keysPerSec: ${veryHighActivityResult.keysPerSec.toFixed(2)}`);
console.log(`      Is artificially large (>1000): ${veryHighActivityResult.isArtificiallyLarge}\n`);

console.log("\n=== CONCLUSION ===");
console.log("Based on the code analysis:");
console.log("- windowDurationMs CAN be <= 0 if windowStart == windowEnd (same timestamp)");
console.log("- windowDurationMs CAN be < 1000ms (e.g., 1ms, 10ms, 100ms)");
console.log(
  "- However, due to line 398: const windowSec = Math.max(windowDurationMs, 1000) / 1000;",
);
console.log("  Any windowDurationMs < 1000ms gets clamped to 1000ms before division");
console.log("  This means windowSec is ALWAYS >= 1 second");
console.log("  Therefore, keysPerSec = dwells.length / windowSec where windowSec >= 1");
console.log("  This actually PREVENTS artificially large keysPerSec values!");
console.log("  Instead, it UNDERESTIMATES keysPerSec for very short windows.");
console.log("");
console.log("Example:");
console.log("  Actual scenario: 100 keyups in 50ms window");
console.log("  Actual keysPerSec: 100 / 0.05 = 2000 keys/sec");
console.log("  Reported keysPerSec: 100 / 1 = 100 keys/sec (due to clamping)");
console.log("");
console.log("So the current implementation actually PROTECTS against artificially");
console.log("high keysPerSec values by clamping short windows to 1 second duration.");
console.log("");
console.log("However, there is still a potential issue:");
console.log("- If dwells.length becomes extremely large due to duplicate event counting");
console.log("- Or if there is a bug in event buffering/clearing");
console.log("- Then even with the clamping, large dwells.length could still produce");
console.log("  high keysPerSec values (but limited by the actual number of events)");
console.log("");
console.log("To get keysPerSec = 49,146 with the current clamping:");
console.log("  dwells.length would need to be 49,146");
console.log("  This would require 49,146 keyup events in whatever time window");
console.log("  This suggests the issue is likely duplicate event counting,");
console.log("  not the window duration calculation itself.");
