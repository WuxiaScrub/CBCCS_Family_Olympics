const podiumEl = document.getElementById('podium')
const updatedEl = document.getElementById('updated-at')

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

async function load() {
  const { data } = await supabase.from('overall_leaderboard').select('*').order('overall_rank').lte('overall_rank', 3)
  renderPodium(groupByRank(data ?? []))
  updatedEl.textContent = `Updated ${new Date().toLocaleTimeString()}`
}

document.getElementById('refresh-button').addEventListener('click', load)
load()
setInterval(load, 30000)
