import PageShell from '../components/PageShell.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';
import AboutHero from './about/AboutHero.jsx';
import AboutVisualDivider from './about/AboutVisualDivider.jsx';
import AboutCapabilities from './about/AboutCapabilities.jsx';
import AboutExperience from './about/AboutExperience.jsx';
import AboutCredentials from './about/AboutCredentials.jsx';
import AboutContact from './about/AboutContact.jsx';

function AboutPage() {
  return (
    <PageShell className="bg-[#faf8f4] text-[#141414]">
      <MinimalTopNav />
      <AboutHero />
      <AboutVisualDivider />
      <AboutCapabilities />
      <AboutExperience />
      <AboutCredentials />
      <AboutContact />
    </PageShell>
  );
}

export default AboutPage;
