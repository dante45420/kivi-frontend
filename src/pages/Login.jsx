export default function Login() {
  function save(e) {
    e.preventDefault()
    const token = new FormData(e.currentTarget).get('token')
    // No almacenamos en localStorage para no duplicar; se maneja por .env en dev.
    alert('Para dev, setea VITE_AUTH_TOKEN en .env. Para prod, se integrará un almacenamiento simple.')
  }
  return (
    <form onSubmit={save}>
      <h2>Login</h2>
      <input name="token" placeholder="Token" />
      <button type="submit">Guardar</button>
    </form>
  )
}
