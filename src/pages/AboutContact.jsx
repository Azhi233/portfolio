import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, QrCode } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import EditableText from '../components/EditableText.jsx';
import EditableMedia from '../components/EditableMedia.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

gsap.registerPlugin(ScrollTrigger);

const CAPABILITIES = ['视觉资产统筹', '无菌美学摄影', '商业全栈后期'];
const DEFAULT_QR_IMAGE = 'https://via.placeholder.com/400x400?text=WeChat+QR';

function AboutContact() {
  const { config } = useConfig();
  const sectionRef = useRef(null);
  const wechatRef = useRef(null);
  const [wechatOpen, setWechatOpen] = useState(false);

  const email = config.contactEmail?.trim() || 'hello@director.vision';
  const emailHref = `mailto:${email}`;
  const qrCodeImageUrl = config.qrCodeImageUrl?.trim() || DEFAULT_QR_IMAGE;

  const introText = useMemo(
    () =>
      config.resumeExperienceText?.trim() ||
      '作为视觉资产主理人，我将品牌信息、拍摄执行与后期交付统一到同一套高标准叙事系统中，帮助企业把“看起来专业”升级为“足以被信任”。',
    [config.resumeExperienceText],
  );

  useGSAP(
    () => {
      const targets = gsap.utils.toArray('.reveal-block');
      gsap.fromTo(
        targets,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
          },
        },
      );
    },
    { scope: sectionRef },
  );

  useGSAP(
    () => {
      if (!wechatRef.current) return;
      gsap.fromTo(
        wechatRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: wechatRef.current,
            start: 'top 80%',
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <main ref={sectionRef} className="min-h-screen bg-white text-[#1E293B]">
      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-24 md:px-12 md:pt-28">
        <div className="grid gap-12 md:grid-cols-[0.92fr_1.08fr] md:items-center">
          <div className="reveal-block">
            <div className="aspect-[4/5] w-full overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] grayscale shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
              <div className="flex h-full items-center justify-center border border-slate-200/70">
                <div className="text-center">
                  <EditableMedia type="image" src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80" className="mx-auto h-28 w-28 rounded-full object-cover" onChange={() => {}} />
                  <EditableText as="p" className="mt-4 text-[10px] tracking-[0.32em] text-slate-400" value="主理人肖像占位符" />
                </div>
              </div>
            </div>
          </div>

          <div className="reveal-block space-y-8">
            <div className="space-y-4">
              <EditableText as="p" className="text-xs tracking-[0.28em] text-slate-400" value="MANIFESTO / BIO" />
              <EditableText as="h1" className="max-w-4xl font-serif text-4xl leading-[1.02] tracking-[-0.05em] text-[#1E293B] md:text-7xl" value="将公差参数，翻译为全球商业信任。" />
              <EditableText as="p" className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg" value={introText} />
            </div>

            <div className="flex flex-wrap gap-3">
              {CAPABILITIES.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1 text-sm tracking-[0.08em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-28 md:px-12">
        <div className="reveal-block text-center">
          <EditableText as="p" className="text-xs tracking-[0.3em] text-slate-400" value="ENGAGEMENT" />
          <EditableText as="h2" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.05em] text-[#1E293B] md:text-7xl" value="准备好重塑您的企业视觉引擎了吗？" />
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <a
            href={emailHref}
            className="reveal-block group flex min-h-44 items-center justify-between border border-slate-200 bg-white px-6 py-8 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(30,41,59,0.08)] md:px-8"
          >
            <div>
              <EditableText as="p" className="text-xs tracking-[0.28em] text-slate-400" value="EMAIL BLOCK" />
              <EditableText as="p" className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#1E293B] md:text-3xl" value={email} />
              <EditableText as="p" className="mt-2 text-sm text-slate-500" value="点击直接发起商业联络" />
            </div>
            <Mail className="h-7 w-7 text-slate-300 transition group-hover:text-slate-500" />
          </a>

          <div
            ref={wechatRef}
            onMouseEnter={() => setWechatOpen(true)}
            onMouseLeave={() => setWechatOpen(false)}
            className="group relative min-h-44 overflow-hidden border border-slate-200 bg-white px-6 py-8 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(30,41,59,0.08)] md:px-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <EditableText as="p" className="text-xs tracking-[0.28em] text-slate-400" value="WECHAT BLOCK" />
                <EditableText as="p" className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#1E293B] md:text-3xl" value="WeChat" />
                <EditableText as="p" className="mt-2 text-sm text-slate-500" value="Hover 展开二维码" />
              </div>
              <QrCode className="h-7 w-7 text-slate-300 transition group-hover:text-slate-500" />
            </div>

            <div
              className={`mt-6 grid overflow-hidden transition-all duration-500 ease-out ${wechatOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="w-fit rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img src={qrCodeImageUrl} alt="WeChat QR code" className="h-44 w-44 object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AboutContact;
