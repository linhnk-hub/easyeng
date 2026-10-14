# Security Specification: Learner Profiles & Progress Sync

## 1. Data Invariants
1. `learnerId` path parameter must match `^[a-zA-Z0-9_-]+$` with length <= 64.
2. Learners documents at `/learners/{learnerId}` must store valid profile information:
   - `id`: string matching `learnerId`
   - `name`: string, length between 1 and 64 characters
   - `grade`: number (1 to 12)
   - `avatar`: string, length <= 350000
   - `pin`: string, length == 4, numeric digits only
   - `totalStars`, `level`, `xp`, `currentStreak`, `highestStreak`: positive or zero numbers
   - `completedUnits`: map object
   - `unlockedBadges`: list of string badge keys
3. Writes must maintain identity consistency: document id matches path id.

## 2. Dirty Dozen Payloads Tested
1. Path injection: `/learners/../../system`
2. ID mismatch: Path `/learners/ty` with body `{ id: "na" }`
3. Extreme string length: Name > 1000 characters
4. Negative values: `totalStars: -99`
5. Non-whitelisted fields: Ghost field `{ isAdmin: true }`
6. Empty name: `{ name: "" }`
7. Array poisoning: `unlockedBadges` containing 500 items
8. Invalid grade: `grade: 999`
9. Non-string avatar: `{ avatar: 123 }`
10. Malformed payload: Missing required `name`
11. Bad type for stars: `{ totalStars: "many" }`
12. Malformed path with special symbols: `/learners/@#$%`
