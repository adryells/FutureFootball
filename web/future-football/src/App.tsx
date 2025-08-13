import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LeagueView from "./pages/LeagueView";
import CreateLeague from "./pages/CreateLeague";
import Home from "./pages/Home";


export default function App() {
  return (
    <BrowserRouter>
      <header style={{ padding: "1rem", background: "#222", color: "#fff" }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
          FutureFootball
        </Link>
      </header>
      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-league" element={<CreateLeague />} />
          <Route path="/league/:id" element={<LeagueView />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
