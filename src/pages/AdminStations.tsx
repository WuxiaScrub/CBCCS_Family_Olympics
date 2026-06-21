import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ScoringDirection, ScoringType, Station } from '../types'

export default function AdminStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [name, setName] = useState('')
  const [scoringType, setScoringType] = useState<ScoringType>('points')
  const [status, setStatus] = useState<string | null>(null)

  async function reload() {
    const { data } = await supabase.from('stations').select('*').order('sort_order')
    setStations(data ?? [])
  }

  useEffect(() => {
    reload()
  }, [])

  function directionFor(type: ScoringType): ScoringDirection {
    return type === 'time' ? 'asc' : 'desc'
  }

  async function addStation(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const { error } = await supabase.from('stations').insert({
      name: name.trim(),
      scoring_type: scoringType,
      direction: directionFor(scoringType),
      sort_order: stations.length,
    })
    if (error) {
      setStatus(`Error: ${error.message}`)
      return
    }
    setName('')
    reload()
  }

  async function removeStation(id: string) {
    if (!confirm('Delete this station and all its scores?')) return
    await supabase.from('stations').delete().eq('id', id)
    reload()
  }

  async function updateScoringType(id: string, type: ScoringType) {
    await supabase
      .from('stations')
      .update({ scoring_type: type, direction: directionFor(type) })
      .eq('id', id)
    reload()
  }

  return (
    <div>
      <h2>Add a station</h2>
      <form onSubmit={addStation} className="form-inline">
        <input
          type="text"
          placeholder="Station name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={scoringType} onChange={(e) => setScoringType(e.target.value as ScoringType)}>
          <option value="points">Points (higher wins)</option>
          <option value="time">Time (lower wins)</option>
        </select>
        <button type="submit">Add Station</button>
      </form>
      {status && <p className="status">{status}</p>}

      <h2>Stations ({stations.length})</h2>
      {stations.length === 0 ? (
        <p>No stations yet. Add up to 8 for the event.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Scoring</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <select
                    value={s.scoring_type}
                    onChange={(e) => updateScoringType(s.id, e.target.value as ScoringType)}
                  >
                    <option value="points">Points (higher wins)</option>
                    <option value="time">Time (lower wins)</option>
                  </select>
                </td>
                <td>
                  <button className="link-button" onClick={() => removeStation(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
