import AboutProfileCard from './AboutProfileCard.jsx';

function AboutProfilesGrid({ profiles = [] }) {
  const visibleProfiles = profiles.filter((profile) => profile?.enabled !== false);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-10 pb-24 md:px-12 md:pt-12 md:pb-28">
      <div className="grid gap-6 lg:grid-cols-3 xl:gap-6">
        {visibleProfiles.map((profile) => (
          <AboutProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </section>
  );
}

export default AboutProfilesGrid;
