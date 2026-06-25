// Placeholder list of 10 colors (final list TBD). Each color has a "I"/"II"
// suffix, giving 20 unique color codes that checked-in teams can claim.
// Keep this in sync with the check constraint in supabase/schema.sql.
const TEAM_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Orange',
  'Purple',
  'Pink',
  'Teal',
  'Black',
  'White',
]
const TEAM_COLOR_CODES = TEAM_COLORS.flatMap((color) => [`${color} I`, `${color} II`])
