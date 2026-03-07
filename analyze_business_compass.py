import csv
import sys

def clean_numeric_value(value):
    """
    Mimics the cleanNumericValue function in Business Compass
    """
    if not value:
        return 0
    
    # Remove currency symbols ($), commas, spaces, and trim
    cleaned = str(value).replace('$', '').replace('€', '').replace('£', '').replace(',', '').replace(' ', '').strip()
    
    try:
        num = float(cleaned)
        return num if num > 0 else 0  # Mirror the logic: if (revenue <= 0) return;
    except:
        return 0

def analyze_business_compass_filtering(filename):
    total_rows = 0
    rows_with_valid_revenue = 0
    rows_with_zero_or_negative = 0
    rows_with_invalid_numeric = 0
    
    sum_all_totals = 0
    sum_valid_totals = 0
    
    zero_examples = []
    invalid_examples = []
    
    print(f"Analyzing (Business Compass logic): {filename}\n")
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            total_rows += 1
            
            total_str = row.get('Total', '')
            
            # Try to parse as raw float first (for comparison)
            try:
                total_raw = float(total_str.replace(',', '').strip())
                sum_all_totals += total_raw
            except:
                total_raw = 0
            
            # Use Business Compass logic
            total_cleaned = clean_numeric_value(total_str)
            
            if total_cleaned > 0:
                rows_with_valid_revenue += 1
                sum_valid_totals += total_cleaned
            else:
                if total_raw <= 0:
                    rows_with_zero_or_negative += 1
                    if len(zero_examples) < 5:
                        zero_examples.append(f"Row {i+2}: Total='{total_str}' -> {total_cleaned}")
                else:
                    rows_with_invalid_numeric += 1
                    if len(invalid_examples) < 5:
                        invalid_examples.append(f"Row {i+2}: Total='{total_str}' -> {total_cleaned}")
    
    print(f"Total rows: {total_rows:,}")
    print(f"Rows with valid revenue (>0): {rows_with_valid_revenue:,}")
    print(f"Rows filtered out (<=0 or invalid): {rows_with_zero_or_negative + rows_with_invalid_numeric:,}")
    print(f"  - Zero or negative: {rows_with_zero_or_negative:,}")
    print(f"  - Invalid numeric: {rows_with_invalid_numeric:,}")
    
    if zero_examples:
        print(f"\nZero/negative examples:")
        for ex in zero_examples:
            print(f"  {ex}")
    
    if invalid_examples:
        print(f"\nInvalid numeric examples:")
        for ex in invalid_examples:
            print(f"  {ex}")
    
    print(f"\nSum of all Total values (raw): ${sum_all_totals:,.2f}")
    print(f"Sum after Business Compass filtering: ${sum_valid_totals:,.2f}")
    print(f"\nDiscrepancy from expected $228,357,152.16: ${228357152.16 - sum_valid_totals:,.2f}")
    
    if abs(sum_valid_totals - 228335853) < 100:
        print(f"\n✅ This matches the Business Compass display value of $228,335,853!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_business_compass_filtering(sys.argv[1])
    else:
        analyze_business_compass_filtering('Weekly-Sales-MERN-main/client/public/RAW_ALL BRANCES_COMBINED.csv')
