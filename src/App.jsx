import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import PortfolioHome from './pages/PortfolioHome.jsx';
import VideosPage from './pages/VideosPage.jsx';
import OldVideoPage from './pages/OldVideoPage.jsx';
import ImagesPage from './pages/ImagesPage.jsx';
import OldImagesPage from './pages/OldImagesPage.jsx';
import ImageDetailPage from './pages/ImageDetailPage.jsx';
import VideoDetailPage from './pages/VideoDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ClientAccessPage from './pages/ClientAccessPage.jsx';
import OldClientAccessPage from './pages/OldClientAccessPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import StudioNotesPage from './pages/StudioNotesPage.jsx';
import ConsoleHome from './pages/console/index.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioHome />} />
      <Route path="/videos" element={<VideosPage />} />
      <Route path="/oldvideos" element={<OldVideoPage />} />
      <Route path="/projects" element={<Navigate to="/videos" replace />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/images" element={<ImagesPage />} />
      <Route path="/oldImages" element={<OldImagesPage />} />
      <Route path="/images/:id" element={<ImageDetailPage />} />
      <Route path="/videos/:id" element={<VideoDetailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/oldabout" element={<Navigate to="/about" replace />} />
      <Route path="/client-access" element={<ClientAccessPage />} />
      <Route path="/oldclient-access" element={<OldClientAccessPage />} />
      <Route path="/studio-notes" element={<StudioNotesPage />} />
      <Route path="/oldhome" element={<Home />} />
      <Route path="/console" element={<ConsoleHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
