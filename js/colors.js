// Each color has no suffix and an "I" suffix, giving 28 unique color codes
// that checked-in teams can claim.
// Keep this in sync with the check constraint in supabase/schema.sql.
const TEAM_COLORS = [
  'Lime Green',
  'Yellow',
  'Apple Red',
  'Magenta Red',
  'Orange',
  'Blue',
  'Pink',
  'Purple',
  'White',
  'Tan',
  'Black',
  'Light Pink',
  'Silver',
  'Gold',
]
const TEAM_COLOR_CODES = TEAM_COLORS.flatMap((color) => [color, `${color} I`])
