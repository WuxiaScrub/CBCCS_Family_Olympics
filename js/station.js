let stations = []
let teams = []
let scores = []

const stationSelect = document.getElementById('station-select')
const teamSelect = document.getElementById('team-select')
const entrySection = document.getElementById('entry-section')
const valueLabelText = document.getElementById('value-label-text')
const valueInput = document.getElementById('value-input')
const valueHeader = document.getElementById('value-header')
const spiritInput = document.getElementById('spirit-input')
const recordedByInput = document.getElementById('recorded-by-input')
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
  spiritInput.value = existing ? String(existing.spirit_points) : ''
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

document.getElementById('score-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const stationId = stationSelect.value
  const teamId = teamSelect.value
  const value = valueInput.value
  if (!stationId || !teamId || value === '') return

  statusMessage.textContent = 'Saving...'
  const spiritPoints = spiritInput.value
  const { error } = await supabase.from('scores').upsert(
    {
      station_id: stationId,
      team_id: teamId,
      value: Number(value),
      spirit_points: spiritPoints === '' ? 0 : Number(spiritPoints),
      recorded_by: recordedByInput.value || null,
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

init()
