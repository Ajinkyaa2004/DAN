import pandas as pd

df = pd.read_csv('/Users/ajinkya/Desktop/DAN/Weekly-Sales-MERN-main/client/public/RAW_ALL BRANCES_COMBINED.csv')
df['TC'] = df['Total'].replace(r'[\$,]', '', regex=True).astype(float)

# Find rows that sum to approximately $132,000
target = 132000.16

# Check specific patterns
print("Looking for rows that could total $132,000...")
print(f"\nTotal in CSV: ${df['TC'].sum():,.2f}")
print(f"Dashboard shows: $228,225,152")
print(f"Missing: ${target:,.2f}\n")

# Check if any rows have specific values
print("Checking for large transactions near $132k:")
large = df[df['TC'].abs() > 100000]
print(f"Rows > $100k: {len(large)}")
if len(large) > 0:
    print(large[['Entity Name', 'Branch', 'Invoice #', 'TC']].head(10))

# Check for specific amounts
print(f"\n\nChecking rows that could sum to ~$132k:")
# Sort by revenue and see if there's a pattern
df_sorted = df[df['TC'] != 0].sort_values('TC', ascending=False)
cumsum = df_sorted['TC'].cumsum()
close_to_target = cumsum[(cumsum > target - 1000) & (cumsum < target + 1000)]
if len(close_to_target) > 0:
    idx = close_to_target.index[0]
    rows_to_target = df_sorted.loc[:idx]
    print(f"First {len(rows_to_target)} rows sum to: ${rows_to_target['TC'].sum():,.2f}")
    print(rows_to_target[['Entity Name', 'Branch', 'Invoice #', 'Issue Date', 'TC']].head(20))
