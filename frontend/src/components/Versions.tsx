import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState({
    platform: 'Vercel Web',
    rendered: 'Browser'
  })

  return (
    <ul className="versions">
      <li className="electron-version">Plataforma: {versions.platform}</li>
      <li className="chrome-version">Motor: {versions.rendered}</li>
    </ul>
  )
}

export default Versions
