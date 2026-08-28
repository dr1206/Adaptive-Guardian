# Simple verification that our changes are in place
with open('backend/src/app/seed.py', 'r') as f:
    content = f.read()

# Check that the behavioral data seeding is commented out
if '# await _seed_behavioral_data(uid, account_ids)' in content:
    print("✓ Behavioral data seeding is commented out (first occurrence)")
else:
    print("✗ Behavioral data seeding NOT commented out (first occurrence)")

if '# await _seed_behavioral_data(uid, account_ids)  # DISABLED to prevent synthetic data contamination' in content:
    print("✓ Behavioral data seeding is commented out (second occurrence)")
else:
    print("✗ Behavioral data seeding NOT commented out (second occurrence)")

print("\nChanges made to backend/src/app/seed.py:")
print("- Commented out calls to _seed_behavioral_data to prevent synthetic biometric data generation")
print("- Preserved all other seed data (users, accounts, transactions, etc.)")
print("- No changes to MongoDB schemas, authentication, frontend collector, ML code, or export architecture")

print("\nNext steps to verify:")
print("1. Start the application with these changes")
print("2. Confirm no synthetic behavioral biometric records are created in MongoDB")
print("3. Verify that training_events, training_features, behavioral_events, behavior_windows collections remain empty")
print("4. Test the export functionality - it should create valid CSV files with headers but no data rows")
print("5. Confirm genuine data from website collection still flows normally to MongoDB and export")