import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Score, Station, Team } from '../types'

export default function StationLeader() {
  const [stations, setStations] = useState<Station[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [stationId, setStationId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [value, setValue] = useState('')
  const [recordedBy, setRecordedBy] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [stationsRes, teamsRes] = await Promise.all([
        supabase.from('stations').select('*').order('sort_order'),
        supabase.from('teams').select('*').order('name'),
      ])
      setStations(stationsRes.data ?? [])
      setTeams(teamsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!stationId) {
      setScores([])
      return
    }
    supabase
      .from('scores')
      .select('*')
      .eq('station_id', stationId)
      .then(({ data }) => setScores(data ?? []))
  }, [stationId])

  const station = stations.find((s) => s.id === stationId)

  async function submitScore(e: React.FormEvent) {
    e.preventDefault()
    if (!stationId || !teamId || value === '') return
    setStatus('Saving...')
    const { error } = await supabase.from('scores').upsert(
      {
        station_id: stationId,
        team_id: teamId,
        value: Number(value),
        recorded_by: recordedBy || null,
      },
      { onConflict: 'station_id,team_id' },
    )
    if (error) {
      setStatus(`Error: ${error.message}`)
      return
    }
    setStatus('Saved!')
    setValue('')
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('station_id', stationId)
    setScores(data ?? [])
  }

  function teamName(id: string) {
    return teams.find((t) => t.id === id)?.name ?? 'Unknown team'
  }

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <h1>Station Leader</h1>

      <label className="field">
        Station
        <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
          <option value="">Select a station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {stationId && (
        <>
          <form onSubmit={submitScore} className="form">
            <label className="field">
              Team
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">Select a team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              {station?.scoring_type === 'time' ? 'Time (seconds)' : 'Score'}
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  station?.scoring_type === 'time'
                    ? 'e.g. 32.5'
                    : 'e.g. 10'
                }
              />
            </label>

            <label className="field">
              Your name (optional)
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
              />
            </label>

            <button type="submit">Save Score</button>
            {status && <p className="status">{status}</p>}
          </form>

          <h2>Entries so far</h2>
          {scores.length === 0 ? (
            <p>No scores recorded yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>{station?.scoring_type === 'time' ? 'Time' : 'Score'}</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id}>
                    <td>{teamName(s.team_id)}</td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="hint">
            Tip: re-submitting a score for the same team updates their existing entry.
          </p>
        </>
      )}
    </div>
  )
}
