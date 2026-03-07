import csv

# Calculate Outstanding column too
outstanding_sum_all = 0
outstanding_sum_positive = 0
outstanding_negative_count = 0

total_sum_all = 0
total_sum_positive = 0
total_negative_count = 0

with open('/Users/ajinkya/Desktop/DAN/Weekly-Sales-MERN-main/client/public/RAW_ALL BRANCES_COMBINED.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        total_str = row.get('Total', '').replace(',', '').strip()
        outstanding_str = row.get('Outstanding', '').replace(',', '').strip()
        
        try:
            total = float(total_str) if total_str else 0
            total_sum_all += total
            if total > 0:
                total_sum_positive += total
            else:
                total_negative_count += 1
        except:
            pass
        
        try:
            outstanding = float(outstanding_str) if outstanding_str else 0
            outstanding_sum_all += outstanding
            if outstanding > 0:
                outstanding_sum_positive += outstanding
            else:
                outstanding_negative_count += 1
        except:
            pass

print("=== TOTAL COLUMN ===")
print(f"Sum (all values):      ${total_sum_all:,.2f}")
print(f"Sum (only >0):         ${total_sum_positive:,.2f}")
print(f"Rows filtered (<=0):   {total_negative_count}")

print("\n=== OUTSTANDING COLUMN ===")
print(f"Sum (all values):      ${outstanding_sum_all:,.2f}")
print(f"Sum (only >0):         ${outstanding_sum_positive:,.2f}")
print(f"Rows filtered (<=0):   {outstanding_negative_count}")

print(f"\n=== COMPARISON ===")
print(f"User expects: $228,357,152.16 (manual calculation of Total)")
print(f"Business Compass shows: $228,335,853")
print(f"Difference: ${228357152.16 - 228335853:,.2f}")

print(f"\nChecking if $228,335,853 matches any calculated value...")
if abs(total_sum_positive - 228335853) < 100:
    print(f"✅ Matches Total (>0 only): ${total_sum_positive:,.2f}")
if abs(outstanding_sum_positive - 228335853) < 100:
    print(f"✅ Matches Outstanding (>0 only): ${outstanding_sum_positive:,.2f}")
if abs(outstanding_sum_all - 228335853) < 100:
    print(f"✅ Matches Outstanding (all): ${outstanding_sum_all:,.2f}")
