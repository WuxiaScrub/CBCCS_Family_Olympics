import { requireAdminAuth } from './admin-auth.js'

await requireAdminAuth()

const podiumEl = document.getElementById('podium')
const updatedEl = document.getElementById('updated-at')
const resultsTableEl = document.getElementById('results-table')

const RANK_META = {
  1: { label: '1st Place', medal: '\u{1F947}', className: 'gold' },
  2: { label: '2nd Place', medal: '\u{1F948}', className: 'silver' },
  3: { label: '3rd Place', medal: '\u{1F949}', className: 'bronze' },
}

function groupByRank(rows) {
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.overall_rank)) map.set(row.overall_rank, [])
    map.get(row.overall_rank).push(row)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0])
}

function renderPodium(groups) {
  if (groups.length === 0) {
    podiumEl.innerHTML = '<p class="podium-empty">No results yet.</p>'
    return
  }
  podiumEl.innerHTML = groups
    .map(([rank, rows]) => {
      const meta = RANK_META[rank]
      return `
        <div class="podium-spot podium-${meta.className}" style="animation-delay: ${(rank - 1) * 0.15}s">
          <div class="podium-medal">${meta.medal}</div>
          <div class="podium-teams">
            ${rows.map((r) => `<div class="podium-team-name">${escapeHtml(r.team_name)}</div>`).join('')}
          </div>
          <div class="podium-points">${escapeHtml(String(rows[0].total_points))} pts</div>
          <div class="podium-block">${meta.label}</div>
        </div>
      `
    })
    .join('')
}

const MEDALS = { 1: '\u{1F947}', 2: '\u{1F948}', 3: '\u{1F949}' }

function medalCell(place) {
  return MEDALS[place] ? `<span title="${RANK_META[place].label}">${MEDALS[place]}</span>` : '—'
}

function renderResultsGrid(teams, stations, stationRankings, spiritLeaderboard) {
  if (teams.length === 0) {
    resultsTableEl.innerHTML = '<p class="podium-empty">No results yet.</p>'
    return
  }

  const placeByTeamStation = new Map()
  for (const r of stationRankings) {
    placeByTeamStation.set(`${r.team_id}_${r.station_id}`, r.place)
  }

  const spiritRankByTeam = new Map()
  spiritLeaderboard
    .slice()
    .sort((a, b) => b.total_spirit_points - a.total_spirit_points)
    .forEach((row, i) => spiritRankByTeam.set(row.team_id, i + 1))

  resultsTableEl.innerHTML = `
    <div class="results-grid-wrap">
      <table class="table results-grid">
        <thead>
          <tr>
            <th>Team</th>
            ${stations.map((s) => `<th>${escapeHtml(s.name)}</th>`).join('')}
            <th>Spirit Points</th>
          </tr>
        </thead>
        <tbody>
          ${teams
            .map(
              (team) => `
                <tr>
                  <td>${escapeHtml(team.name)}</td>
                  ${stations
                    .map((s) => `<td>${medalCell(placeByTeamStation.get(`${team.id}_${s.id}`))}</td>`)
                    .join('')}
                  <td>${medalCell(spiritRankByTeam.get(team.id))}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

async function load() {
  const [overallRes, teamsRes, stationsRes, stationRankingsRes, spiritRes] = await Promise.all([
    supabase.from('overall_leaderboard').select('*').order('overall_rank').lte('overall_rank', 3),
    supabase.from('teams').select('*').order('name'),
    supabase.from('stations').select('*').order('sort_order'),
    supabase.from('station_rankings').select('*'),
    supabase.from('spirit_leaderboard').select('*'),
  ])
  renderPodium(groupByRank(overallRes.data ?? []))
  renderResultsGrid(teamsRes.data ?? [], stationsRes.data ?? [], stationRankingsRes.data ?? [], spiritRes.data ?? [])
  updatedEl.textContent = `Updated ${new Date().toLocaleTimeString()}`
}

document.getElementById('refresh-button').addEventListener('click', load)
load()
setInterval(load, 30000)
