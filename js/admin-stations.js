import { requireAdminAuth } from './admin-auth.js'

await requireAdminAuth()

let stations = []

const stationsContent = document.getElementById('stations-content')
const statusMessage = document.getElementById('status-message')

function directionFor(type) {
  return type === 'time' ? 'asc' : 'desc'
}

async function reload() {
  const { data } = await supabase.from('stations').select('*').order('sort_order')
  stations = data ?? []
  render()
}

function render() {
  stationsContent.innerHTML = `
    <h2>Stations (${stations.length})</h2>
    ${
      stations.length === 0
        ? '<p>No stations yet. Add up to 8 for the event.</p>'
        : `
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Scoring</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${stations
                .map(
                  (s) => `
                    <tr>
                      <td>${escapeHtml(s.name)}</td>
                      <td>
                        <select data-action="update-scoring-type" data-id="${s.id}">
                          <option value="points" ${s.scoring_type === 'points' ? 'selected' : ''}>Points (higher wins)</option>
                          <option value="time" ${s.scoring_type === 'time' ? 'selected' : ''}>Time (lower wins)</option>
                        </select>
                      </td>
                      <td>
                        <button class="link-button" data-action="remove-station" data-id="${s.id}">Delete</button>
                      </td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
        `
    }
  `
}

async function removeStation(id) {
  if (!confirm('Delete this station and all its scores?')) return
  await supabase.from('stations').delete().eq('id', id)
  reload()
}

async function updateScoringType(id, type) {
  await supabase.from('stations').update({ scoring_type: type, direction: directionFor(type) }).eq('id', id)
  reload()
}

document.getElementById('add-station-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const nameInput = document.getElementById('new-station-name')
  const typeSelect = document.getElementById('new-station-type')
  const name = nameInput.value.trim()
  if (!name) return
  const scoringType = typeSelect.value
  const { error } = await supabase.from('stations').insert({
    name,
    scoring_type: scoringType,
    direction: directionFor(scoringType),
    sort_order: stations.length,
  })
  if (error) {
    statusMessage.textContent = `Error: ${error.message}`
    return
  }
  nameInput.value = ''
  reload()
})

stationsContent.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action="remove-station"]')
  if (!target) return
  removeStation(target.dataset.id)
})

stationsContent.addEventListener('change', (e) => {
  const target = e.target.closest('[data-action="update-scoring-type"]')
  if (!target) return
  updateScoringType(target.dataset.id, target.value)
})

reload()
