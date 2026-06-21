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
import type { LeaderboardRow, Station, StationPointsRow, Team } from '../types'

export default function AdminDashboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [stationPoints, setStationPoints] = useState<StationPointsRow[]>([])
  const [loading, setLoading] = useState(true)

  async function reload() {
    const [leaderboardRes, stationsRes, teamsRes, pointsRes] = await Promise.all([
      supabase.from('leaderboard').select('*'),
      supabase.from('stations').select('*').order('sort_order'),
      supabase.from('teams').select('*'),
      supabase.from('station_points').select('*'),
    ])
    setLeaderboard(leaderboardRes.data ?? [])
    setStations(stationsRes.data ?? [])
    setTeams(teamsRes.data ?? [])
    setStationPoints(pointsRes.data ?? [])
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
        <h2>Leaderboard</h2>
        <button onClick={reload}>Refresh</button>
      </div>

      {leaderboard.length === 0 ? (
        <p>No teams registered yet.</p>
      ) : (
        <>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaderboard}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team_name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total_points" fill="#3b6fd6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.team_id}>
                  <td>{i + 1}</td>
                  <td>{row.team_name}</td>
                  <td>{row.total_points}</td>
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
          const rows = stationPoints
            .filter((p) => p.station_id === station.id)
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
                      <th>Points awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.score_id}>
                        <td>{r.place}</td>
                        <td>{teamName(r.team_id)}</td>
                        <td>{r.value}</td>
                        <td>{r.points}</td>
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
