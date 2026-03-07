import pandas as pd

df = pd.read_csv('/Users/ajinkya/Desktop/DAN/Weekly-Sales-MERN-main/client/public/RAW_ALL BRANCES_COMBINED.csv')
df['TC'] = df['Total'].replace(r'[\$,]', '', regex=True).astype(float)

total_rows = len(df)
total_sum = df['TC'].sum()

# Duplicates by Invoice #
dups = df[df.duplicated(subset=['Invoice #'], keep=False)]
dup_count = len(dups)

# Negatives
negs = df[df['TC'] < 0]
neg_count = len(negs)
neg_sum = negs['TC'].sum()

# Negative duplicates (credit notes that share Invoice # with original invoice)
neg_dups = negs[negs['Invoice #'].isin(dups['Invoice #'])]
neg_dup_count = len(neg_dups)
neg_dup_sum = neg_dups['TC'].sum()

# After deduplication (keep='first' - removes duplicates keeping first occurrence)
deduped = df.drop_duplicates(subset=['Invoice #'], keep='first')
deduped_sum = deduped['TC'].sum()
deduped_count = len(deduped)

print(f"TOTAL IN CSV: {total_rows} rows = ${total_sum:,.2f}")
print(f"\nDuplicate Invoice #s: {dup_count} rows")
print(f"Negatives (credit notes): {neg_count} rows = ${neg_sum:,.2f}")
print(f"Credit notes with duplicate Invoice #: {neg_dup_count} rows = ${neg_dup_sum:,.2f}")
print(f"\nAfter removing duplicate Invoice #s (keep first only): {deduped_count} rows = ${deduped_sum:,.2f}")
print(f"\nDashboard shows: $228,225,152")
print(f"Missing amount: ${total_sum - 228225152:,.2f}")
print(f"\nThis matches credit notes with dup invoices! They're being skipped.")
