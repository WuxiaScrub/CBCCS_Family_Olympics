import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../lib/supabase'
import type { SpiritLeaderboardRow, Station, StationRankingRow, Team } from '../types'

export default function AdminDashboard() {
  const [spiritLeaderboard, setSpiritLeaderboard] = useState<SpiritLeaderboardRow[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [rankings, setRankings] = useState<StationRankingRow[]>([])
  const [loading, setLoading] = useState(true)

  async function reload() {
    const [spiritRes, stationsRes, teamsRes, rankingsRes] = await Promise.all([
      supabase.from('spirit_leaderboard').select('*'),
      supabase.from('stations').select('*').order('sort_order'),
      supabase.from('teams').select('*'),
      supabase.from('station_rankings').select('*'),
    ])
    setSpiritLeaderboard(spiritRes.data ?? [])
    setStations(stationsRes.data ?? [])
    setTeams(teamsRes.data ?? [])
    setRankings(rankingsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  function teamName(id: string) {
    return teams.find((t) => t.id === id)?.name ?? 'Unknown team'
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div className="dashboard-header">
        <h2>Spirit Award</h2>
        <button onClick={reload}>Refresh</button>
      </div>
      <p className="muted">
        Every station records a spirit points value per team. This is the only score
        that's combined across stations — each event below stands on its own.
      </p>

      {spiritLeaderboard.length === 0 ? (
        <p>No teams registered yet.</p>
      ) : (
        <>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spiritLeaderboard}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team_name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total_spirit_points" fill="#d6973b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Total Spirit Points</th>
              </tr>
            </thead>
            <tbody>
              {spiritLeaderboard.map((row, i) => (
                <tr key={row.team_id}>
                  <td>{i + 1}</td>
                  <td>{row.team_name}</td>
                  <td>{row.total_spirit_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Results by station</h2>
      {stations.length === 0 ? (
        <p>No stations yet.</p>
      ) : (
        stations.map((station) => {
          const rows = rankings
            .filter((r) => r.station_id === station.id)
            .sort((a, b) => a.place - b.place)
          return (
            <div key={station.id} className="station-results">
              <h3>
                {station.name}{' '}
                <span className="muted">
                  ({station.scoring_type === 'time' ? 'lower time wins' : 'higher score wins'})
                </span>
              </h3>
              {rows.length === 0 ? (
                <p className="muted">No scores recorded yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Place</th>
                      <th>Team</th>
                      <th>{station.scoring_type === 'time' ? 'Time' : 'Score'}</th>
                      <th>Spirit Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.score_id}>
                        <td>{r.place}</td>
                        <td>{teamName(r.team_id)}</td>
                        <td>{r.value}</td>
                        <td>{r.spirit_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
