import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Team, TeamMember } from '../types'

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [newTeamName, setNewTeamName] = useState('')
  const [newMemberName, setNewMemberName] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)

  async function reload() {
    const [teamsRes, membersRes] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('team_members').select('*'),
    ])
    setTeams(teamsRes.data ?? [])
    setMembers(membersRes.data ?? [])
  }

  useEffect(() => {
    reload()
  }, [])

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    const { error } = await supabase.from('teams').insert({ name: newTeamName.trim() })
    if (error) {
      setStatus(`Error: ${error.message}`)
      return
    }
    setNewTeamName('')
    reload()
  }

  async function removeTeam(id: string) {
    if (!confirm('Delete this team and all its members/scores?')) return
    await supabase.from('teams').delete().eq('id', id)
    reload()
  }

  async function addMember(teamId: string) {
    const name = newMemberName[teamId]?.trim()
    if (!name) return
    await supabase.from('team_members').insert({ team_id: teamId, name })
    setNewMemberName((prev) => ({ ...prev, [teamId]: '' }))
    reload()
  }

  async function removeMember(id: string) {
    await supabase.from('team_members').delete().eq('id', id)
    reload()
  }

  return (
    <div>
      <h2>Register a team</h2>
      <form onSubmit={addTeam} className="form-inline">
        <input
          type="text"
          placeholder="Team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
        <button type="submit">Add Team</button>
      </form>
      {status && <p className="status">{status}</p>}

      <h2>Teams</h2>
      {teams.length === 0 ? (
        <p>No teams yet.</p>
      ) : (
        <div className="team-grid">
          {teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-card-header">
                <h3>{team.name}</h3>
                <button className="link-button" onClick={() => removeTeam(team.id)}>
                  Delete
                </button>
              </div>
              <ul>
                {members
                  .filter((m) => m.team_id === team.id)
                  .map((m) => (
                    <li key={m.id}>
                      {m.name}{' '}
                      <button className="link-button" onClick={() => removeMember(m.id)}>
                        ✕
                      </button>
                    </li>
                  ))}
              </ul>
              <div className="form-inline">
                <input
                  type="text"
                  placeholder="Add member"
                  value={newMemberName[team.id] ?? ''}
                  onChange={(e) =>
                    setNewMemberName((prev) => ({ ...prev, [team.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addMember(team.id)
                    }
                  }}
                />
                <button onClick={() => addMember(team.id)}>Add</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
