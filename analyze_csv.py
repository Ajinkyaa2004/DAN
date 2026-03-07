import csv
import sys

def analyze_csv(filename):
    total_sum = 0
    outstanding_sum = 0
    valid_rows = 0
    invalid_date_rows = 0
    invalid_total_rows = 0
    empty_branch_rows = 0
    total_rows = 0
    
    print(f"Analyzing: {filename}\n")
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            
            # Check if Issue Date is present
            issue_date = row.get('Issue Date', '').strip()
            if not issue_date:
                invalid_date_rows += 1
                continue
            
            # Check Branch
            branch = row.get('Branch', '').strip()
            entity_name = row.get('Entity Name', '').strip()
            
            # Check if Total is a valid number
            total_str = row.get('Total', '').replace(',', '').strip()
            outstanding_str = row.get('Outstanding', '').replace(',', '').strip()
            
            try:
                total = float(total_str) if total_str else 0
                outstanding = float(outstanding_str) if outstanding_str else 0
                
                total_sum += total
                outstanding_sum += outstanding
                valid_rows += 1
            except ValueError:
                invalid_total_rows += 1
                
    print(f"Total rows: {total_rows:,}")
    print(f"Valid rows: {valid_rows:,}")
    print(f"Invalid date rows: {invalid_date_rows:,}")
    print(f"Invalid total rows: {invalid_total_rows:,}")
    print(f"\nTotal column sum: ${total_sum:,.2f}")
    print(f"Outstanding column sum: ${outstanding_sum:,.2f}")
    print(f"\nDiscrepancy from expected $228,357,152.16: ${228357152.16 - total_sum:,.2f}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_csv(sys.argv[1])
    else:
        analyze_csv('Weekly-Sales-MERN-main/client/public/RAW_ALL BRANCES_COMBINED.csv')
