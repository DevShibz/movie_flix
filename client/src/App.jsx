import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/header";
import { MoviesByCategory } from "./pages/MoviesByCategory";
import { MovieDetail } from "./pages/MovieDetail";
import { Admin } from "./pages/Admin";
import { NotFound } from "./pages/NotFound";

export default function App() {

  return (
    <div className="flex min-h-screen flex-col">
      <Header></Header>
      <Routes>
        <Route path="/" element={<Navigate to="/movies/action" replace />} />
        <Route path="/movies/:category" element={<MoviesByCategory />} />
        <Route path="/movie/:movieId" element={<MovieDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
