let stations = []
let teams = []
let scores = []

const stationSelect = document.getElementById('station-select')
const teamSelect = document.getElementById('team-select')
const entrySection = document.getElementById('entry-section')
const valueLabelText = document.getElementById('value-label-text')
const valueInput = document.getElementById('value-input')
const valueHeader = document.getElementById('value-header')
const joyInput = document.getElementById('joy-input')
const patienceInput = document.getElementById('patience-input')
const humilityInput = document.getElementById('humility-input')
const cheerInput = document.getElementById('cheer-input')
const joyValue = document.getElementById('joy-value')
const patienceValue = document.getElementById('patience-value')
const humilityValue = document.getElementById('humility-value')
const cheerValue = document.getElementById('cheer-value')
const spiritTotal = document.getElementById('spirit-total')
const statusMessage = document.getElementById('status-message')
const noScoresMessage = document.getElementById('no-scores-message')
const scoresTable = document.getElementById('scores-table')
const scoresBody = document.getElementById('scores-body')

function currentStation() {
  return stations.find((s) => s.id === stationSelect.value)
}

function teamName(id) {
  return teams.find((t) => t.id === id)?.name ?? 'Unknown team'
}

function updateSpiritTotal() {
  joyValue.textContent = joyInput.value
  patienceValue.textContent = patienceInput.value
  humilityValue.textContent = humilityInput.value
  cheerValue.textContent = cheerInput.value
  spiritTotal.textContent = String(
    Number(joyInput.value) + Number(patienceInput.value) + Number(humilityInput.value) + Number(cheerInput.value),
  )
}

function renderValueFields() {
  const station = currentStation()
  const isTime = station?.scoring_type === 'time'
  valueLabelText.textContent = isTime ? 'Time (seconds)' : 'Score'
  valueInput.placeholder = isTime ? 'e.g. 32.5' : 'e.g. 10'
  valueHeader.textContent = isTime ? 'Time' : 'Score'
}

function renderScoresTable() {
  if (scores.length === 0) {
    noScoresMessage.style.display = ''
    scoresTable.style.display = 'none'
    return
  }
  noScoresMessage.style.display = 'none'
  scoresTable.style.display = ''
  scoresBody.innerHTML = scores
    .map(
      (s) => `
        <tr>
          <td>${escapeHtml(teamName(s.team_id))}</td>
          <td>${escapeHtml(String(s.value))}</td>
          <td>${escapeHtml(String(s.spirit_points))}</td>
        </tr>
      `,
    )
    .join('')
}

async function loadScoresForStation() {
  const stationId = stationSelect.value
  if (!stationId) {
    scores = []
    entrySection.style.display = 'none'
    return
  }
  entrySection.style.display = ''
  renderValueFields()
  const { data } = await supabase.from('scores').select('*').eq('station_id', stationId)
  scores = data ?? []
  renderScoresTable()
  prefillForTeam()
}

function prefillForTeam() {
  const existing = scores.find((s) => s.team_id === teamSelect.value)
  valueInput.value = existing ? String(existing.value) : ''
  joyInput.value = existing ? String(existing.joy_points) : 1
  patienceInput.value = existing ? String(existing.patience_points) : 1
  humilityInput.value = existing ? String(existing.humility_points) : 1
  cheerInput.value = existing ? String(existing.cheer_points) : 1
  updateSpiritTotal()
}

const STATION_PASSWORD = 'FO20260703'

// Basic deterrent only, not real security: the password is hardcoded here
// and visible in page source. Fine for keeping casual visitors off the entry
// form at a private one-day event; see README for the caveats on RLS too.
// Admins are already verified server-side, so an admin session skips this.
function requireStationAuth() {
  if (sessionStorage.getItem('cbccs-station-auth') === 'true') return true
  if (sessionStorage.getItem('cbccs-admin-auth') === 'true') return true
  while (true) {
    const input = prompt('Station leader password:')
    if (input === null) {
      window.location.href = 'index.html'
      return false
    }
    if (input === STATION_PASSWORD) {
      sessionStorage.setItem('cbccs-station-auth', 'true')
      return true
    }
    alert('Incorrect password.')
  }
}

async function init() {
  const [stationsRes, teamsRes] = await Promise.all([
    supabase.from('stations').select('*').order('sort_order'),
    supabase.from('teams').select('*').order('name'),
  ])
  stations = stationsRes.data ?? []
  teams = teamsRes.data ?? []

  stationSelect.innerHTML =
    '<option value="">Select a station</option>' +
    stations.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')

  teamSelect.innerHTML =
    '<option value="">Select a team</option>' +
    teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')
}

stationSelect.addEventListener('change', loadScoresForStation)
teamSelect.addEventListener('change', prefillForTeam)
;[joyInput, patienceInput, humilityInput, cheerInput].forEach((input) =>
  input.addEventListener('input', updateSpiritTotal),
)

document.getElementById('score-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const stationId = stationSelect.value
  const teamId = teamSelect.value
  const value = valueInput.value
  if (!stationId || !teamId || value === '') {
    statusMessage.textContent = 'Please select a station and team, and enter a score.'
    return
  }

  statusMessage.textContent = 'Saving...'
  const joyPoints = Number(joyInput.value)
  const patiencePoints = Number(patienceInput.value)
  const humilityPoints = Number(humilityInput.value)
  const cheerPoints = Number(cheerInput.value)
  const { error } = await supabase.from('scores').upsert(
    {
      station_id: stationId,
      team_id: teamId,
      value: Number(value),
      joy_points: joyPoints,
      patience_points: patiencePoints,
      humility_points: humilityPoints,
      cheer_points: cheerPoints,
      spirit_points: joyPoints + patiencePoints + humilityPoints + cheerPoints,
    },
    { onConflict: 'station_id,team_id' },
  )
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
    return
  }
  statusMessage.textContent = 'Saved!'
  const { data } = await supabase.from('scores').select('*').eq('station_id', stationId)
  scores = data ?? []
  renderScoresTable()
})

if (requireStationAuth()) {
  init()
}
