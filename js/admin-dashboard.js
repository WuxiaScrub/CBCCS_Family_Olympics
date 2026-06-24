let teams = []
const content = document.getElementById('content')

function teamName(id) {
  return teams.find((t) => t.id === id)?.name ?? 'Unknown team'
}

const MEDALS = { 1: '\u{1F947}', 2: '\u{1F948}', 3: '\u{1F949}' }

function rankDisplay(rank) {
  const medal = MEDALS[rank]
  return medal ? `${rank} ${medal}` : String(rank)
}

function renderSpiritChart(spiritLeaderboard) {
  if (spiritLeaderboard.length === 0) return ''
  const max = Math.max(...spiritLeaderboard.map((r) => r.total_spirit_points), 1)
  return `
    <div class="chart-wrap">
      ${spiritLeaderboard
        .map(
          (row) => `
            <div class="bar-row">
              <span class="bar-label">${escapeHtml(row.team_name)}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${(row.total_spirit_points / max) * 100}%"></div>
              </div>
              <span class="bar-value">${escapeHtml(String(row.total_spirit_points))}</span>
            </div>
          `,
        )
        .join('')}
    </div>
  `
}

function renderSpiritSection(spiritLeaderboard) {
  if (spiritLeaderboard.length === 0) {
    return '<p>No teams registered yet.</p>'
  }
  return `
    ${renderSpiritChart(spiritLeaderboard)}
    <table class="table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          <th>Total Spirit Points</th>
        </tr>
      </thead>
      <tbody>
        ${spiritLeaderboard
          .map(
            (row, i) => `
              <tr>
                <td>${rankDisplay(i + 1)}</td>
                <td>${escapeHtml(row.team_name)}</td>
                <td>${escapeHtml(String(row.total_spirit_points))}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `
}

function renderStationSection(stations, rankings) {
  if (stations.length === 0) {
    return '<p>No stations yet.</p>'
  }
  return stations
    .map((station) => {
      const rows = rankings
        .filter((r) => r.station_id === station.id)
        .sort((a, b) => a.place - b.place)
      const valueHeader = station.scoring_type === 'time' ? 'Time' : 'Score'
      const note = station.scoring_type === 'time' ? 'lower time wins' : 'higher score wins'
      return `
        <div class="station-results">
          <h3>${escapeHtml(station.name)} <span class="muted">(${note})</span></h3>
          ${
            rows.length === 0
              ? '<p class="muted">No scores recorded yet.</p>'
              : `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Place</th>
                      <th>Team</th>
                      <th>${valueHeader}</th>
                      <th>Spirit Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows
                      .map(
                        (r) => `
                          <tr>
                            <td>${rankDisplay(r.place)}</td>
                            <td>${escapeHtml(teamName(r.team_id))}</td>
                            <td>${escapeHtml(String(r.value))}</td>
                            <td>${escapeHtml(String(r.spirit_points))}</td>
                          </tr>
                        `,
                      )
                      .join('')}
                  </tbody>
                </table>
              `
          }
        </div>
      `
    })
    .join('')
}

async function reload() {
  const [spiritRes, stationsRes, teamsRes, rankingsRes] = await Promise.all([
    supabase.from('spirit_leaderboard').select('*'),
    supabase.from('stations').select('*').order('sort_order'),
    supabase.from('teams').select('*'),
    supabase.from('station_rankings').select('*'),
  ])
  const spiritLeaderboard = spiritRes.data ?? []
  const stations = stationsRes.data ?? []
  teams = teamsRes.data ?? []
  const rankings = rankingsRes.data ?? []

  content.innerHTML = `
    <div class="dashboard-header">
      <h2>Spirit Award</h2>
      <button id="refresh-button">Refresh</button>
    </div>
    <p class="muted">
      Every station records a spirit points value per team. This is the only score
      that's combined across stations &mdash; each event below stands on its own.
    </p>
    ${renderSpiritSection(spiritLeaderboard)}
    <h2>Results by station</h2>
    ${renderStationSection(stations, rankings)}
  `
  document.getElementById('refresh-button').addEventListener('click', reload)
}

reload()
