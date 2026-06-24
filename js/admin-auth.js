// Gates the admin pages behind a single shared password, checked server-side
// via the verify_admin_password() Postgres function (see supabase/admin_auth.sql).
// The password itself is never sent to the browser — the RPC only returns
// true/false — so unlike a hardcoded JS check, it isn't visible in page source.
export async function requireAdminAuth() {
  if (sessionStorage.getItem('cbccs-admin-auth') === 'true') return

  while (true) {
    const input = prompt('Admin password:')
    if (input === null) {
      window.location.href = 'index.html'
      return
    }
    const { data, error } = await supabase.rpc('verify_admin_password', {
      input_password: input,
    })
    if (!error && data === true) {
      sessionStorage.setItem('cbccs-admin-auth', 'true')
      return
    }
    alert('Incorrect password.')
  }
}
