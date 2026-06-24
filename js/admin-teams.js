let teams = []
let members = []

const teamsContent = document.getElementById('teams-content')
const statusMessage = document.getElementById('status-message')

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
    teamsContent.innerHTML = '<p>No teams yet.</p>'
    return
  }
  teamsContent.innerHTML = `
    <div class="team-grid">
      ${teams
        .map(
          (team) => `
            <div class="team-card">
              <div class="team-card-header">
                <h3>${escapeHtml(team.name)}</h3>
                <div>
                  <button class="link-button" data-action="rename-team" data-id="${team.id}">Rename</button>
                  <button class="link-button" data-action="remove-team" data-id="${team.id}">Delete</button>
                </div>
              </div>
              <ul>
                ${members
                  .filter((m) => m.team_id === team.id)
                  .map(
                    (m) => `
                      <li>
                        ${escapeHtml(m.name)}
                        <button class="link-button" data-action="remove-member" data-id="${m.id}">&#10005;</button>
                      </li>
                    `,
                  )
                  .join('')}
              </ul>
              <div class="form-inline">
                <input type="text" placeholder="Add member" data-role="new-member-input" data-team-id="${team.id}" />
                <button data-action="add-member" data-team-id="${team.id}">Add</button>
              </div>
            </div>
          `,
        )
        .join('')}
    </div>
  `
}

async function renameTeam(id, currentName) {
  const name = prompt('Rename team', currentName)
  if (name === null) return
  const trimmed = name.trim()
  if (!trimmed || trimmed === currentName) return
  const { error } = await supabase.from('teams').update({ name: trimmed }).eq('id', id)
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
    return
  }
  reload()
}

async function removeTeam(id) {
  if (!confirm('Delete this team and all its members/scores?')) return
  await supabase.from('teams').delete().eq('id', id)
  reload()
}

async function removeMember(id) {
  await supabase.from('team_members').delete().eq('id', id)
  reload()
}

async function addMember(teamId) {
  const input = teamsContent.querySelector(
    `input[data-role="new-member-input"][data-team-id="${teamId}"]`,
  )
  const name = input.value.trim()
  if (!name) return
  await supabase.from('team_members').insert({ team_id: teamId, name })
  reload()
}

document.getElementById('add-team-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const input = document.getElementById('new-team-name')
  const name = input.value.trim()
  if (!name) return
  const { error } = await supabase.from('teams').insert({ name })
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
    return
  }
  input.value = ''
  reload()
})

teamsContent.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]')
  if (!target) return
  const action = target.dataset.action
  if (action === 'rename-team') {
    const team = teams.find((t) => t.id === target.dataset.id)
    renameTeam(target.dataset.id, team?.name ?? '')
  }
  if (action === 'remove-team') removeTeam(target.dataset.id)
  if (action === 'remove-member') removeMember(target.dataset.id)
  if (action === 'add-member') addMember(target.dataset.teamId)
})

teamsContent.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return
  const target = e.target.closest('input[data-role="new-member-input"]')
  if (!target) return
  e.preventDefault()
  addMember(target.dataset.teamId)
})

reload()
