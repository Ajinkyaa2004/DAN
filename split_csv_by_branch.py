import csv
import sys

def split_combined_csv(input_file, output_dir='/Users/ajinkya/Desktop/DAN/Weekly-Sales-MERN-main/server/test-data'):
    """
    Split the combined CSV file into separate files for NSW, QLD, and WA branches
    """
    nsw_rows = []
    qld_rows = []
    wa_rows = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        
        for row in reader:
            entity_name = row.get('Entity Name', '').upper()
            
            # Detect branch from Entity Name
            if 'NSW' in entity_name:
                nsw_rows.append(row)
            elif 'QLD' in entity_name:
                qld_rows.append(row)
            elif 'WA' in entity_name or ('PTY' in entity_name and 'NSW' not in entity_name and 'QLD' not in entity_name):
                # WA or default (company name without state identifier)
                wa_rows.append(row)
            else:
                # Unknown - add to WA as default
                wa_rows.append(row)
    
    # Write NSW CSV
    nsw_file = f'{output_dir}/nsw.csv'
    with open(nsw_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(nsw_rows)
    print(f"✅ Created {nsw_file} with {len(nsw_rows):,} rows")
    
    # Write QLD CSV
    qld_file = f'{output_dir}/qld.csv'
    with open(qld_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(qld_rows)
    print(f"✅ Created {qld_file} with {len(qld_rows):,} rows")
    
    # Write WA CSV
    wa_file = f'{output_dir}/wa.csv'
    with open(wa_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(wa_rows)
    print(f"✅ Created {wa_file} with {len(wa_rows):,} rows")
    
    print(f"\n📊 Summary:")
    print(f"  NSW: {len(nsw_rows):,} rows")
    print(f"  QLD: {len(qld_rows):,} rows")
    print(f"  WA:  {len(wa_rows):,} rows")
    print(f"  Total: {len(nsw_rows) + len(qld_rows) + len(wa_rows):,} rows")
    
    return nsw_file, qld_file, wa_file

if __name__ == "__main__":
    input_file = '/Users/ajinkya/Desktop/DAN/Weekly-Sales-MERN-main/client/public/RAW_ALL BRANCES_COMBINED.csv'
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    
    print(f"Splitting {input_file} into branch-specific files...\n")
    split_combined_csv(input_file)
