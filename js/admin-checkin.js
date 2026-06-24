import { requireAdminAuth } from './admin-auth.js'

await requireAdminAuth()

let teams = []
let members = []
const expandedTeamIds = new Set()

const checkinContent = document.getElementById('checkin-content')

async function reload() {
  const [teamsRes, membersRes] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('team_members').select('*'),
  ])
  teams = teamsRes.data ?? []
  members = membersRes.data ?? []
  render()
}

function render() {
  if (teams.length === 0) {
    checkinContent.innerHTML = '<p>No teams yet.</p>'
    return
  }
  checkinContent.innerHTML = `
    <div class="checkin-list">
      ${teams
        .map((team) => {
          const teamMembers = members.filter((m) => m.team_id === team.id)
          const expanded = expandedTeamIds.has(team.id)
          return `
            <div class="checkin-row${team.checked_in ? ' is-checked-in' : ''}">
              <div class="checkin-row-main">
                <input
                  type="checkbox"
                  class="checkin-checkbox"
                  data-action="toggle-checkin"
                  data-id="${team.id}"
                  ${team.checked_in ? 'checked' : ''}
                />
                <button class="checkin-name-button" data-action="toggle-expand" data-id="${team.id}">
                  <span class="checkin-chevron">${expanded ? '▾' : '▸'}</span>
                  ${escapeHtml(team.name)} <span class="muted">(${teamMembers.length})</span>
                </button>
              </div>
              ${
                expanded
                  ? `
                    <ul class="checkin-members">
                      ${
                        teamMembers.length === 0
                          ? '<li class="muted">No members</li>'
                          : teamMembers.map((m) => `<li>${escapeHtml(m.name)}</li>`).join('')
                      }
                    </ul>
                  `
                  : ''
              }
            </div>
          `
        })
        .join('')}
    </div>
  `
}

async function toggleCheckin(id, checkedIn) {
  await supabase.from('teams').update({ checked_in: checkedIn }).eq('id', id)
  reload()
}

checkinContent.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action="toggle-expand"]')
  if (!target) return
  const id = target.dataset.id
  if (expandedTeamIds.has(id)) {
    expandedTeamIds.delete(id)
  } else {
    expandedTeamIds.add(id)
  }
  render()
})

checkinContent.addEventListener('change', (e) => {
  const target = e.target.closest('[data-action="toggle-checkin"]')
  if (!target) return
  toggleCheckin(target.dataset.id, target.checked)
})

reload()
