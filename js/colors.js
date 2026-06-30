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

// Swatch hex values for displaying each color visually. Keyed by base color
// name (strip a trailing " I" from a color code to look it up).
const TEAM_COLOR_HEX = {
  'Lime Green': '#32cd32',
  Yellow: '#ffeb3b',
  'Apple Red': '#e2231a',
  'Magenta Red': '#d6006d',
  Orange: '#ff8c00',
  Blue: '#1e66f5',
  Pink: '#ff4fa3',
  Purple: '#8e24aa',
  White: '#ffffff',
  Tan: '#d2b48c',
  Black: '#000000',
  'Light Pink': '#ffb6c1',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
}

function colorCodeHex(code) {
  return TEAM_COLOR_HEX[code.replace(/ I$/, '')]
}
