const podiumEl = document.getElementById('podium')
const updatedEl = document.getElementById('updated-at')
const resultsTableEl = document.getElementById('results-table')

const RANK_META = {
  1: { label: '1st Place', medal: '\u{1F947}', className: 'gold' },
  2: { label: '2nd Place', medal: '\u{1F948}', className: 'silver' },
  3: { label: '3rd Place', medal: '\u{1F949}', className: 'bronze' },
}

let overallRows = []
let isAdmin = sessionStorage.getItem('cbccs-admin-auth') === 'true'

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

function renderResultsTable(rows) {
  if (!isAdmin) {
    resultsTableEl.innerHTML = `<button id="admin-results-toggle" class="podium-admin-toggle">Admin: show full standings</button>`
    return
  }
  if (rows.length === 0) {
    resultsTableEl.innerHTML = '<p class="podium-empty">No results yet.</p>'
    return
  }
  resultsTableEl.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          <th>Points</th>
          <th>Events</th>
          <th>1st</th>
          <th>2nd</th>
          <th>3rd</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(String(row.overall_rank))}</td>
                <td>${escapeHtml(row.team_name)}</td>
                <td>${escapeHtml(String(row.total_points))}</td>
                <td>${escapeHtml(String(row.events_participated))}</td>
                <td>${escapeHtml(String(row.first_place_count))}</td>
                <td>${escapeHtml(String(row.second_place_count))}</td>
                <td>${escapeHtml(String(row.third_place_count))}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `
}

async function authenticateAdmin() {
  const input = prompt('Admin password:')
  if (input === null) return
  const { data, error } = await supabase.rpc('verify_admin_password', { input_password: input })
  if (!error && data === true) {
    sessionStorage.setItem('cbccs-admin-auth', 'true')
    isAdmin = true
    renderResultsTable(overallRows)
  } else {
    alert('Incorrect password.')
  }
}

resultsTableEl.addEventListener('click', (e) => {
  if (e.target.id === 'admin-results-toggle') authenticateAdmin()
})

async function load() {
  const { data } = await supabase.from('overall_leaderboard').select('*').order('overall_rank')
  overallRows = data ?? []
  renderPodium(groupByRank(overallRows.filter((row) => row.overall_rank <= 3)))
  renderResultsTable(overallRows)
  updatedEl.textContent = `Updated ${new Date().toLocaleTimeString()}`
}

document.getElementById('refresh-button').addEventListener('click', load)
load()
setInterval(load, 30000)
