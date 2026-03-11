import { createFileRoute } from '@tanstack/react-router'
import { ChatPhone } from '../components/ChatPhone'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main>
      <ChatPhone />
    </main>
  )
}
