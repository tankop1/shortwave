import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import AppShell from './layout/AppShell'
import Home from './pages/Home'
import Search from './pages/Search'
import Projects from './pages/Projects'
import Portfolio from './pages/Portfolio'
import Saved from './pages/Saved'
import Invite from './pages/Invite'
import Inbox from './pages/Inbox'
import PublicPortfolio from './pages/PublicPortfolio'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/invite/:token" element={<Invite />} />
            <Route path="/list" element={<Saved />} />
            <Route path="/:slug" element={<PublicPortfolio />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
