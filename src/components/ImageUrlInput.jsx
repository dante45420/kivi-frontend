export default function ImageUrlInput({ value, onChange }) {
  return (
    <input
      type="url"
      placeholder="https://..."
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%' }}
    />
  )
}
