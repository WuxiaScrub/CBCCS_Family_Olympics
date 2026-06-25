const MAX_MEMBERS = 7

const memberInputsContainer = document.getElementById('member-inputs')
const teamNameInput = document.getElementById('team-name-input')
const contactInfoInput = document.getElementById('contact-info-input')
const statusMessage = document.getElementById('status-message')
const form = document.getElementById('register-form')

memberInputsContainer.innerHTML = Array.from({ length: MAX_MEMBERS })
  .map((_, i) => {
    const required = i === 0
    return `
      <label class="field">
        Member ${i + 1}${required ? '' : ' (optional)'}
        <input type="text" data-role="member-input" ${required ? 'required' : ''} />
      </label>
    `
  })
  .join('')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const teamName = teamNameInput.value.trim()
  const contactInfo = contactInfoInput.value.trim()
  const memberNames = [...memberInputsContainer.querySelectorAll('[data-role="member-input"]')]
    .map((input) => input.value.trim())
    .filter((name) => name !== '')

  if (!teamName) return

  statusMessage.textContent = 'Registering...'
  form.querySelector('button[type="submit"]').disabled = true

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name: teamName, contact_info: contactInfo || null })
    .select()
    .single()

  if (teamError) {
    statusMessage.textContent = teamError.message.includes('duplicate')
      ? 'A team with that name already exists. Please choose a different name.'
      : `Error: ${teamError.message}`
    form.querySelector('button[type="submit"]').disabled = false
    return
  }

  const { error: membersError } = await supabase
    .from('team_members')
    .insert(memberNames.map((name) => ({ team_id: team.id, name })))

  if (membersError) {
    await supabase.from('teams').delete().eq('id', team.id)
    statusMessage.textContent = `Error: ${membersError.message}`
    form.querySelector('button[type="submit"]').disabled = false
    return
  }

  form.innerHTML = `<p class="status">Thanks! "${escapeHtml(teamName)}" is registered with ${memberNames.length} members.</p>`
})
