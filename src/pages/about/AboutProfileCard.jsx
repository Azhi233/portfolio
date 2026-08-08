import { resolveResourceUrl } from '../../utils/api.js';

function getInitials(name) {
  const value = String(name || '').trim();
  if (!value) return 'PF';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function AboutProfileCard({ profile }) {
  const initials = getInitials(profile?.name);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-[#141414]/8 bg-white shadow-[0_12px_44px_rgba(20,20,20,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_64px_rgba(20,20,20,0.08)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1ece4]">
        {profile?.portraitUrl ? (
          <img
            src={resolveResourceUrl(profile.portraitUrl)}
            alt={profile.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(143,111,82,0.12),transparent_58%),linear-gradient(180deg,#f6efe7_0%,#ede4d7_100%)] text-[#8f6f52]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#8f6f52]/15 bg-white/70 text-[1.05rem] tracking-[0.18em] shadow-[0_10px_30px_rgba(20,20,20,0.05)]">
              {initials}
            </div>
            <p className="mt-4 text-[10px] tracking-[0.26em] text-[#8f6f52]/80">PROFILE PORTRAIT</p>
            <p className="mt-2 max-w-[14rem] px-6 text-center text-[12px] leading-5 tracking-[0.04em] text-[#141414]/45">
              No image provided yet. This space keeps the card visually balanced until a portrait is uploaded.
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#8f6f52]">Profile</p>
            <h3 className="mt-3 text-[1.35rem] font-light tracking-[0.03em] text-[#141414] md:text-[1.5rem]">{profile?.name || 'Unnamed'}</h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#141414]/45">{profile?.role || '—'}</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#141414]/10 px-3 py-1 text-[10px] tracking-[0.18em] text-[#141414]/55">
            {profile?.sortOrder + 1 || 1}
          </span>
        </div>

        <p className="text-[14px] leading-7 text-[#141414]/64">{profile?.summary || 'No summary provided.'}</p>

        <div className="grid gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8f6f52]">Capabilities</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile?.capabilities || []).length ? profile.capabilities.slice(0, 4).map((item) => (
                <span key={item} className="rounded-full border border-[#141414]/10 px-3 py-1 text-[11px] tracking-[0.08em] text-[#141414]/70">{item}</span>
              )) : <span className="text-sm text-[#141414]/45">—</span>}
            </div>
          </div>

          {Array.isArray(profile?.experience) && profile.experience.length ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#8f6f52]">Experience</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#141414]/68">
                {profile.experience.slice(0, 2).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}
        </div>

        {(profile?.contact?.email || profile?.contact?.phone || profile?.contact?.wechat) ? (
          <div className="mt-auto border-t border-[#141414]/8 pt-4 text-[13px] text-[#141414]/62">
            {profile?.contact?.email ? <p>{profile.contact.email}</p> : null}
            {profile?.contact?.phone ? <p>{profile.contact.phone}</p> : null}
            {profile?.contact?.wechat ? <p>{profile.contact.wechat}</p> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default AboutProfileCard;
