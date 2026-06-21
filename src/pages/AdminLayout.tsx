import { Link, NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <h1>Admin</h1>
      <nav className="tabs">
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/teams">Teams</NavLink>
        <NavLink to="/admin/stations">Stations</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
