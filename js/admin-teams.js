import { requireAdminAuth } from './admin-auth.js'

await requireAdminAuth()

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
  const checkedInCount = teams.filter((t) => t.checked_in).length
  const takenColors = new Set(teams.filter((t) => t.checked_in && t.color).map((t) => t.color))
  teamsContent.innerHTML = `
    <p class="muted">${checkedInCount} / ${teams.length} teams checked in</p>
    <div class="team-grid">
      ${teams
        .map(
          (team) => `
            <div class="team-card${team.checked_in ? ' team-card-checked-in' : ''}">
              <div class="team-card-header">
                <h3>${escapeHtml(team.name)}</h3>
                <div>
                  <button class="link-button" data-action="rename-team" data-id="${team.id}">Rename</button>
                  <button class="link-button" data-action="remove-team" data-id="${team.id}">Delete</button>
                </div>
              </div>
              <label class="checkin-toggle">
                <input
                  type="checkbox"
                  data-action="toggle-checkin"
                  data-id="${team.id}"
                  ${team.checked_in ? 'checked' : ''}
                />
                Checked in
              </label>
              ${
                team.checked_in
                  ? `
                    <label class="field">
                      Color
                      <select data-action="assign-color" data-id="${team.id}">
                        <option value="">No color</option>
                        ${TEAM_COLOR_CODES.filter((code) => code === team.color || !takenColors.has(code))
                          .map(
                            (code) =>
                              `<option value="${code}" ${team.color === code ? 'selected' : ''}>${code}</option>`,
                          )
                          .join('')}
                      </select>
                    </label>
                  `
                  : ''
              }
              <p class="muted">
                Contact: ${team.contact_info ? escapeHtml(team.contact_info) : 'none'}
                <button class="link-button" data-action="edit-contact" data-id="${team.id}">Edit</button>
              </p>
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

async function editContact(id, currentValue) {
  const value = prompt('Contact info (email/phone)', currentValue ?? '')
  if (value === null) return
  const trimmed = value.trim()
  const { error } = await supabase.from('teams').update({ contact_info: trimmed || null }).eq('id', id)
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
    return
  }
  reload()
}

async function toggleCheckedIn(id, checkedIn) {
  const { error } = await supabase.from('teams').update({ checked_in: checkedIn }).eq('id', id)
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
    reload()
    return
  }
  if (!checkedIn) {
    await supabase.from('teams').update({ color: null }).eq('id', id)
  }
  reload()
}

async function assignColor(id, color) {
  const { error } = await supabase.from('teams').update({ color: color || null }).eq('id', id)
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
  }
  reload()
}

async function autoMergeSmallTeams() {
  const smallTeams = teams
    .map((t) => ({ id: t.id, count: members.filter((m) => m.team_id === t.id).length }))
    .filter((t) => t.count > 0 && t.count < 5)

  if (smallTeams.length === 0) {
    statusMessage.textContent = 'No teams with fewer than 5 members to merge.'
    return
  }

  const password = prompt(
    `This will merge ${smallTeams.length} team(s) with fewer than 5 members into combined teams of 5-7 members. This cannot be undone.\n\nRe-enter the admin password to confirm:`,
  )
  if (password === null) return
  const { data, error } = await supabase.rpc('verify_admin_password', { input_password: password })
  if (error || data !== true) {
    alert('Incorrect password. Merge cancelled.')
    return
  }

  const pool = [...smallTeams].sort((a, b) => b.count - a.count)
  const groups = []
  while (pool.length > 0) {
    const base = pool.shift()
    const group = [base]
    let count = base.count
    while (count < 5 && pool.length > 0) {
      let idx = pool.findIndex((t) => count + t.count <= 7)
      if (idx === -1) idx = pool.length - 1
      const [pick] = pool.splice(idx, 1)
      group.push(pick)
      count += pick.count
    }
    groups.push(group)
  }

  for (const group of groups) {
    if (group.length < 2) continue
    const [surviving, ...rest] = group
    for (const team of rest) {
      await supabase.from('team_members').update({ team_id: surviving.id }).eq('team_id', team.id)
      await supabase.from('teams').delete().eq('id', team.id)
    }
  }

  statusMessage.textContent = `Merged ${smallTeams.length} small team(s) into ${groups.length} team(s).`
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
  if (action === 'edit-contact') {
    const team = teams.find((t) => t.id === target.dataset.id)
    editContact(target.dataset.id, team?.contact_info)
  }
  if (action === 'remove-member') removeMember(target.dataset.id)
  if (action === 'add-member') addMember(target.dataset.teamId)
})

teamsContent.addEventListener('change', (e) => {
  const checkinTarget = e.target.closest('[data-action="toggle-checkin"]')
  if (checkinTarget) {
    toggleCheckedIn(checkinTarget.dataset.id, checkinTarget.checked)
    return
  }
  const colorTarget = e.target.closest('[data-action="assign-color"]')
  if (colorTarget) {
    assignColor(colorTarget.dataset.id, colorTarget.value)
  }
})

document.getElementById('auto-merge-button').addEventListener('click', autoMergeSmallTeams)

teamsContent.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return
  const target = e.target.closest('input[data-role="new-member-input"]')
  if (!target) return
  e.preventDefault()
  addMember(target.dataset.teamId)
})

reload()
