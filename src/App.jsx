import "./css/App.css";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Pricing from "./pages/Pricing/Pricing";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Thought from "./pages/Thought/Thought";
import PageNotFound from "./pages/PageNotFound/PageNotFound";
import Unauthorized from "./pages/Unauthorized/Unauthorized";
import Lists from "./pages/Lists/Lists";
import Settings from "./pages/Settings/Settings";
import Categories from "./pages/Categories/Categories";
import Tags from "./pages/Tags/Tags";
import Prompts from "./pages/Prompts/Prompts";
import PromptDetail from "./pages/Prompts/PromptDetail";
import Goals from "./pages/Goals/Goals";
import MoodBoards from "./pages/MoodBoards/MoodBoards";
import MoodBoardDetail from "./pages/MoodBoards/MoodBoardDetail";
import Insights from "./pages/Insights/Insights";
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  const noLayoutRoutes = [
    "/login",
    "/register",
    "/dashboard",
    "/thoughts",
    "/thought",
    "/lists",
    "/settings",
    "/categories",
    "/tags",
    "/prompts",
    "/goals",
    "/mood-boards",
    "/insights",
  ];

  const hideLayout =
    location.pathname === "/" ||
    noLayoutRoutes.some((path) => location.pathname.startsWith(path));

  return (
    <>
      {!hideLayout && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/thoughts" element={<Dashboard />} />
        <Route path="/thoughts/:ListName" element={<Dashboard />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/lists/:ListName" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/thought/:ThoughtName" element={<Thought />} />
        <Route path="/404" element={<PageNotFound />} />
        <Route path="/Unauthorized" element={<Unauthorized />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/prompts/:categoryKey" element={<PromptDetail />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/mood-boards" element={<MoodBoards />} />
        <Route path="/mood-boards/:moodBoardId" element={<MoodBoardDetail />} />
        <Route path="/insights" element={<Insights />} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
