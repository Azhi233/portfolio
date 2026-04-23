import { Navigate, Route, Routes } from 'react-router-dom';
import PortfolioHome from './pages/PortfolioHome.jsx';
import VideosPage from './pages/VideosPage.jsx';
import ImagesPage from './pages/ImagesPage.jsx';
import ImageDetailPage from './pages/ImageDetailPage.jsx';
import VideoDetailPage from './pages/VideoDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ClientAccessPage from './pages/ClientAccessPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import StudioNotesPage from './pages/StudioNotesPage.jsx';
import ConsoleHome from './pages/console/index.jsx';
import EditorModePage from './pages/console/EditorModePage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioHome />} />
      <Route path="/videos" element={<VideosPage />} />
      <Route path="/projects" element={<Navigate to="/videos" replace />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/images" element={<ImagesPage />} />
      <Route path="/images/:id" element={<ImageDetailPage />} />
      <Route path="/videos/:id" element={<VideoDetailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/client-access" element={<ClientAccessPage />} />
      <Route path="/studio-notes" element={<StudioNotesPage />} />
      <Route path="/oldhome" element={<Navigate to="/" replace />} />
      <Route path="/console" element={<ConsoleHome />} />
      <Route path="/console/editor" element={<EditorModePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
