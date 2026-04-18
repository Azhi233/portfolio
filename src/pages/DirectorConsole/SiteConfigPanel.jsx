export default function SiteConfigPanel({
  hasUnsavedSiteConfig,
  handleApplySiteConfig,
  resetCaseStudies,
  setSiteConfigDraft,
  moveIntroProject,
  introProjectId,
  handleApplyVideoIntro,
  hasUnsavedIntro,
  introTargetProject,
  handleSaveAndNextIntro,
  sortedProjects,
  setIntroProjectId,
  setIntroDraft,
  introDraft,
  updateIntroDraftField,
  saveBulkProjectVideos,
  bulkProjectVideoForm,
  setBulkProjectVideoForm,
  bulkProjectVideoError,
  setBulkProjectVideoError,
  siteConfigDraft,
  formInputClass,
  formTextareaClass,
  LocalUploadField,
  uploadState,
  handleUploadLogo,
  handleUploadQrCode,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">SITE CONFIG & ABOUT</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">管理联系方式、简历数据与全局 SEO 配置</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm('恢复 Case Study 模块默认文案？此操作仅重置目标/动作/素材/复盘字段。');
              if (!confirmed) return;

              resetCaseStudies();
              setSiteConfigDraft((prev) => ({
                ...prev,
                caseToyTarget: '占位：品牌定位、用户画像、传播核心信息、视觉风格基准。',
                caseToyAction: '占位：电商主图/详情页、短视频脚本、素材矩阵、投放组合。',
                caseToyAssets: '占位：主KV、产品白底图、组装过程短视频、店铺详情页切片。',
                caseToyReview: '占位：复购内容、社媒栏目化输出、UGC 激励机制、视觉资产复用策略。',
                caseIndustryTarget: '占位：展会主KV、传播节奏、媒体包与新闻素材、统一叙事框架。',
                caseIndustryAction: '占位：销售手册视频、工艺亮点模块化表达、客户场景案例包装。',
                caseIndustryAssets: '占位：生产线工艺图集、展会采访片段、企业标准化视觉模板。',
                caseIndustryReview: '占位：客户见证内容、标准化工厂纪录资产、年度视觉策略迭代。',
              }));
            }}
            className="rounded-md border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.14em] text-amber-200 transition hover:bg-amber-300/20"
          >
            RESET CASE STUDIES
          </button>

          <button
            type="button"
            onClick={handleApplySiteConfig}
            disabled={!hasUnsavedSiteConfig}
            className={`rounded-md border px-4 py-2 text-xs tracking-[0.14em] transition ${
              hasUnsavedSiteConfig
                ? 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20'
                : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
            }`}
          >
            SAVE TO SERVER
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tracking-[0.18em] text-zinc-400">VIDEO INTRO EDITOR (EXISTING PROJECTS)</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => moveIntroProject('prev')}
                disabled={!introProjectId}
                className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                  introProjectId
                    ? 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                    : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                PREV
              </button>

              <button
                type="button"
                onClick={() => moveIntroProject('next')}
                disabled={!introProjectId}
                className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                  introProjectId
                    ? 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400'
                    : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                NEXT
              </button>

              <button
                type="button"
                onClick={handleApplyVideoIntro}
                disabled={!hasUnsavedIntro || !introTargetProject}
                className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                  hasUnsavedIntro && introTargetProject
                    ? 'border-cyan-300/70 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20'
                    : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                SAVE VIDEO INTRO
              </button>

              <button
                type="button"
                onClick={handleSaveAndNextIntro}
                disabled={!introTargetProject}
                className={`rounded-md border px-3 py-2 text-xs tracking-[0.14em] transition ${
                  introTargetProject
                    ? 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20'
                    : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                SAVE & NEXT
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Select Uploaded Project</p>
              <select
                value={introProjectId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setIntroProjectId(nextId);
                  const target = sortedProjects.find((project) => project.id === nextId);
                  setIntroDraft({
                    title: target?.title || '',
                    description: target?.description || '',
                    credits: target?.credits || '',
                    role: target?.role || '',
                    clientAgency: target?.clientAgency || '',
                  });
                }}
                className={formInputClass}
              >
                <option value="">-- Select one project --</option>
                {sortedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video Title</p>
              <input value={introDraft.title} onChange={(event) => updateIntroDraftField('title', event.target.value)} className={formInputClass} placeholder="Video title" />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Role</p>
              <input value={introDraft.role} onChange={(event) => updateIntroDraftField('role', event.target.value)} className={formInputClass} placeholder="DOP / Director / Colorist" />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video Description</p>
              <textarea value={introDraft.description} onChange={(event) => updateIntroDraftField('description', event.target.value)} className={formTextareaClass} placeholder="Video intro / synopsis" />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Copy / Credits</p>
              <input value={introDraft.credits} onChange={(event) => updateIntroDraftField('credits', event.target.value)} className={formInputClass} placeholder="Credits / copy" />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client / Agency</p>
              <input value={introDraft.clientAgency} onChange={(event) => updateIntroDraftField('clientAgency', event.target.value)} className={formInputClass} placeholder="Client / agency" />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs tracking-[0.18em] text-zinc-400">BULK PROJECT VIDEO IMPORT</p>
            <button type="button" onClick={saveBulkProjectVideos} className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200">
              SAVE TO DB
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Target Project</p>
              <select
                value={bulkProjectVideoForm.projectId}
                onChange={(event) => {
                  setBulkProjectVideoForm((prev) => ({ ...prev, projectId: event.target.value }));
                  if (bulkProjectVideoError) setBulkProjectVideoError('');
                }}
                className={formInputClass}
              >
                <option value="">-- Select project --</option>
                {sortedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Video URLs (one per line)</p>
              <textarea
                value={bulkProjectVideoForm.urlsText}
                onChange={(event) => {
                  setBulkProjectVideoForm((prev) => ({ ...prev, urlsText: event.target.value }));
                  if (bulkProjectVideoError) setBulkProjectVideoError('');
                }}
                className={formTextareaClass}
                placeholder="https://.../video-1.mp4\nhttps://.../video-2.mp4"
              />
            </label>

            {bulkProjectVideoError ? (
              <p className="md:col-span-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">
                {bulkProjectVideoError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">可修改内容 · 品牌基础层</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">站点标题</p>
              <input
                value={siteConfigDraft.siteTitle}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, siteTitle: event.target.value }))}
                className={formInputClass}
                placeholder="DIRECTOR.VISION"
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">站点描述</p>
              <textarea
                value={siteConfigDraft.siteDescription}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, siteDescription: event.target.value }))}
                className={formTextareaClass}
                placeholder="Portfolio description for SEO"
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Logo 占位图 URL</p>
              <input
                value={siteConfigDraft.logoImageUrl || ''}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, logoImageUrl: event.target.value }))}
                className={formInputClass}
                placeholder="https://.../logo.png"
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Logo 替代文字</p>
              <input
                value={siteConfigDraft.logoAltText || ''}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, logoAltText: event.target.value }))}
                className={formInputClass}
                placeholder="DIRECTOR.VISION"
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">OG 封面图 URL</p>
              <input
                value={siteConfigDraft.ogImage}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, ogImage: event.target.value }))}
                className={formInputClass}
                placeholder="https://.../og-cover.jpg"
              />
            </label>

            <LocalUploadField
              label="Logo 占位图"
              value={siteConfigDraft.logoImageUrl || ''}
              placeholder="https://.../logo.png"
              accept="image/*"
              buttonText="上传 Logo 到本地服务器"
              uploadState={uploadState.logo || { status: 'idle', progress: 0 }}
              onChange={(value) => setSiteConfigDraft((prev) => ({ ...prev, logoImageUrl: value }))}
              onUpload={handleUploadLogo}
            />

            <LocalUploadField
              label="微信二维码"
              value={siteConfigDraft.qrCodeImageUrl || ''}
              placeholder="https://.../wechat-qr.jpg"
              accept="image/*"
              buttonText="上传二维码到本地服务器"
              uploadState={uploadState.qrCode || { status: 'idle', progress: 0 }}
              onChange={(value) => setSiteConfigDraft((prev) => ({ ...prev, qrCodeImageUrl: value }))}
              onUpload={handleUploadQrCode}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">可修改内容 · 联络信息</p>
          <div className="space-y-3">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">邮箱</p>
              <input
                value={siteConfigDraft.contactEmail}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, contactEmail: event.target.value }))}
                className={formInputClass}
                placeholder="you@email.com"
              />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">电话</p>
              <input
                value={siteConfigDraft.contactPhone}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, contactPhone: event.target.value }))}
                className={formInputClass}
                placeholder="+86 ..."
              />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">所在地</p>
              <input
                value={siteConfigDraft.contactLocation}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, contactLocation: event.target.value }))}
                className={formInputClass}
                placeholder="Shanghai / Beijing / Remote"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">可修改内容 · 履历与能力</p>
          <div className="space-y-3">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">奖项（每行一项）</p>
              <textarea
                value={siteConfigDraft.resumeAwardsText}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, resumeAwardsText: event.target.value }))}
                className={formTextareaClass}
                placeholder="Award A&#10;Award B"
              />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">经历（每行一项）</p>
              <textarea
                value={siteConfigDraft.resumeExperienceText}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, resumeExperienceText: event.target.value }))}
                className={formTextareaClass}
                placeholder="Company / Role / Year"
              />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">器材清单（每行一项）</p>
              <textarea
                value={siteConfigDraft.resumeGearText}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, resumeGearText: event.target.value }))}
                className={formTextareaClass}
                placeholder="ARRI / SONY / LENS ..."
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">可修改内容 · 社会证明与合作范围</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">客户口碑（quote|role|company 每行一条）</p>
              <textarea
                value={siteConfigDraft.testimonialsText}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, testimonialsText: event.target.value }))}
                className={formTextareaClass}
                placeholder='"团队协作顺畅..."|市场负责人|消费品牌'
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">品牌名单（每行一项）</p>
              <textarea
                value={siteConfigDraft.brandNamesText}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, brandNamesText: event.target.value }))}
                className={formTextareaClass}
                placeholder="TOYVERSE&#10;INDUSTRIAL PRO"
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">合作服务（title|deliverables|timeline|bestFor 每行一条）</p>
              <textarea
                value={siteConfigDraft.servicesText}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, servicesText: event.target.value }))}
                className={formTextareaClass}
                placeholder="商业视觉项目统筹|前期策略,拍摄执行,后期交付|2-6周|品牌新品发布"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">CASE STUDY · TOY PROJECT</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">目标 TARGET</p>
              <textarea
                value={siteConfigDraft.caseToyTarget}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyTarget: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 toy 项目目标"
              />
            </label>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">动作 ACTION</p>
              <textarea
                value={siteConfigDraft.caseToyAction}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyAction: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 toy 项目动作"
              />
            </label>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">素材 ASSETS</p>
              <textarea
                value={siteConfigDraft.caseToyAssets}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyAssets: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 toy 项目素材"
              />
            </label>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">复盘 REVIEW</p>
              <textarea
                value={siteConfigDraft.caseToyReview}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseToyReview: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 toy 项目复盘结论"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4 md:col-span-2">
          <p className="mb-3 text-xs tracking-[0.18em] text-zinc-400">CASE STUDY · INDUSTRY PROJECT</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">目标 TARGET</p>
              <textarea
                value={siteConfigDraft.caseIndustryTarget}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseIndustryTarget: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 industry 项目目标"
              />
            </label>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">动作 ACTION</p>
              <textarea
                value={siteConfigDraft.caseIndustryAction}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseIndustryAction: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 industry 项目动作"
              />
            </label>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">素材 ASSETS</p>
              <textarea
                value={siteConfigDraft.caseIndustryAssets}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseIndustryAssets: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 industry 项目素材"
              />
            </label>
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">复盘 REVIEW</p>
              <textarea
                value={siteConfigDraft.caseIndustryReview}
                onChange={(event) => setSiteConfigDraft((prev) => ({ ...prev, caseIndustryReview: event.target.value }))}
                className={formTextareaClass}
                placeholder="填写 industry 项目复盘结论"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
