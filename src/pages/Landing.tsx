import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="page page-centered">
      <h1>CBCCS Family Olympics</h1>
      <p className="subtitle">Choose how you're signing in</p>
      <div className="role-cards">
        <Link to="/station" className="role-card">
          <h2>Station Leader</h2>
          <p>Record scores for your station</p>
        </Link>
        <Link to="/admin" className="role-card">
          <h2>Admin</h2>
          <p>Manage teams, stations, and view results</p>
        </Link>
      </div>
    </div>
  )
}
