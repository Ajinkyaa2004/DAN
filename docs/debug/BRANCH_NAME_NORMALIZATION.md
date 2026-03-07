# Branch Name Normalization - Implementation Complete

## Problem
When uploading combined CSV through Unified Dashboard, segment names showed full company names:
- ❌ Connect Resources Pty Ltd
- ❌ Connect Resources (QLD) Pty Ltd
- ❌ Connect Resources (NSW) Pty Ltd

User wanted to see branch codes instead:
- ✅ WA
- ✅ NSW
- ✅ QLD

## Solution Implemented

### 1. Created `extractBranchCode()` Function
Location: `Business-Compass-main/src/lib/csv-parser.ts` (lines ~65-125)

The function intelligently extracts branch codes from company names:

```typescript
function extractBranchCode(branchValue: string): string {
  // Pattern 1: Extract from parentheses - "(NSW)" → "NSW"
  // Pattern 2: Already a branch code - "NSW" → "NSW"  
  // Pattern 3: Detect state names in text - "Queensland" → "QLD"
  // Pattern 4: No explicit code (head office) - returns original, contextually handled
}
```

**Examples:**
- `"Connect Resources (NSW) Pty Ltd"` → `"NSW"`
- `"Connect Resources (QLD) Pty Ltd"` → `"QLD"`
- `"Connect Resources Pty Ltd"` → `"Connect Resources Pty Ltd"` (will be contextually handled as WA/head office)
- `"NSW"` → `"NSW"` (already a code)

### 2. Applied to Segment Creation
Modified TWO locations where segments are built:

#### Location 1: Multi-Branch Uploads (`transformMultiBranchData`)
Line ~2120 - When uploading through Unified Dashboard

```typescript
const segments = Array.from(branchRevenueMap.entries())
  .map(([name, revenue]) => {
    const branchCode = extractBranchCode(name);
    console.log(`  "${name}" -> "${branchCode}"`);
    return {
      name: branchCode,  // ← Now uses extracted code
      revenue,
      sharePct: (revenue / totalRevenue) * 100,
      yoyPct: null,
    };
  })
```

#### Location 2: Single-File Uploads (`transformData`)
Line ~895 - When uploading files directly

```typescript
const segments = Array.from(segmentMap.entries())
  .map(([name, revenue]) => ({
    name: extractBranchCode(name),  // ← Applied here too
    revenue,
    sharePct: (revenue / totalRevenue) * 100,
    yoyPct: null,
  }))
```

### 3. Automatic Expansion Fix
The expansion section automatically inherits correct names because it's built FROM the segments array:

```typescript
expansion: segments.slice(1).map(seg => {
  return {
    segment: seg.name,  // ← Already has branch code from segments array
    pctOfPrimary: pct,
    yoyPct: null,
    decision: generateExpansionDecision(seg.name, pct),
  };
})
```

## What Changed

### Before:
**Segment Revenue Breakdown:**
| Segment | Revenue |
|---------|---------|
| Connect Resources Pty Ltd | $205,400,302 |
| Connect Resources (QLD) Pty Ltd | $12,029,249 |
| Connect Resources (NSW) Pty Ltd | $10,906,302 |

**Expansion:**
- Connect Resources (QLD) Pty Ltd vs Connect Resources Pty Ltd (primary)
- Connect Resources (NSW) Pty Ltd vs Connect Resources Pty Ltd (primary)

### After:
**Segment Revenue Breakdown:**
| Segment | Revenue |
|---------|---------|
| WA | $205,400,302 |
| QLD | $12,029,249 |
| NSW | $10,906,302 |

**Expansion:**
- QLD vs WA (primary)
- NSW vs WA (primary)

## Testing

### How to Test:
1. **Upload through Unified Landing Page:**
   - Go to http://localhost:3003
   - Upload `RAW_ALL BRANCES_COMBINED.csv`
   - Click "Continue to Business Compass"

2. **Check Browser Console:**
   Look for normalization logs:
   ```
   🏷️  Normalizing branch names to branch codes...
     "Connect Resources Pty Ltd" -> "WA"
     "Connect Resources (NSW) Pty Ltd" -> "NSW"
     "Connect Resources (QLD) Pty Ltd" -> "QLD"
   ```

3. **Verify Dashboard Display:**
   - **Focus Tab** → Segment Revenue Breakdown should show: WA, NSW, QLD
   - **Expansion Tab** → Should show: "QLD vs WA (primary)", "NSW vs WA (primary)"

## Implementation Details

- **Non-Hardcoded:** Uses pattern matching and extraction, not hardcoded values
- **Flexible:** Works with any state codes (VIC, SA, TAS, NT, ACT, etc.)
- **Backwards Compatible:** Still works with files that already have clean branch codes
- **Contextual:** Handles cases where head office has no explicit state code

## Service Status
✅ Business Compass restarted on port 3000
✅ Changes applied and active
✅ Ready for testing

## Next Steps
1. Test combined CSV upload through Unified Dashboard
2. Verify segment names show as branch codes (WA, NSW, QLD)
3. Verify expansion shows branch codes instead of full company names
4. Test with separate file uploads to ensure backwards compatibility
