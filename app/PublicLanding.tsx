"use client";
import { useEffect, useState } from "react";
import PublicShiftStats from "./PublicShiftStats";
type School = {
  school_name?: string;
  logo_url?: string;
  country?: string;
  governorate?: string;
  district?: string;
  area?: string;
  address?: string;
  phone?: string;
  email?: string;
  academic_year?: string;
  current_term?: string;
};
type Home = {
  hero_title?: string;
  hero_text?: string;
  manager_name?: string;
  manager_role?: string;
  manager_phone?: string;
  manager_image_url?: string;
  ticker_text?: string;
};
type Item = {
  id: number;
  item_type: string;
  title: string;
  body: string;
  image_url: string;
  media_url: string;
  achiever_percentage?: string;
  achiever_average?: string;
  achiever_rank?: string;
};
const embed = (u: string) => {
  const m = u.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/,
  );
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : "";
};
export default function PublicLanding() {
  const [school, setSchool] = useState<School>({
      school_name: "مدرسة الصومعه",
      area: "يافع",
      district: "المفلحي",
      country: "اليمن",
    }),
    [home, setHome] = useState<Home>({}),
    [items, setItems] = useState<Item[]>([]),
    [ann, setAnn] = useState<Array<{ title: string; body: string }>>([]),
    [preview, setPreview] = useState<{ src: string; alt: string } | null>(null),
    [tickerIndex, setTickerIndex] = useState(0);
  useEffect(() => {
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => {
        setSchool((s) => ({ ...s, ...d.school }));
        setHome(d.home || {});
        setItems(d.items || []);
        setAnn(d.announcements || []);
      });
  }, []);
  const tickerMessages=(home.ticker_text||"").split(/\r?\n|\|/).map(x=>x.trim()).filter(Boolean);
  useEffect(()=>{setTickerIndex(0);if(tickerMessages.length<2)return;const timer=setInterval(()=>setTickerIndex(i=>(i+1)%tickerMessages.length),25000);return()=>clearInterval(timer)},[home.ticker_text]);
  const location = [
      school.area,
      school.district,
      school.governorate,
      school.country,
    ]
      .filter(Boolean)
      .join(" — "),
    achievers = items.filter((x) => x.item_type === "ACHIEVER"),
    news = [
      ...items.filter((x) => ["NEWS", "REPORT"].includes(x.item_type)),
      ...ann.map((x, i) => ({
        id: -i - 1,
        item_type: "NEWS",
        title: x.title,
        body: x.body,
        image_url: "",
        media_url: "",
      })),
    ],
    media = items.filter((x) => x.item_type === "MEDIA");

  const ExpandableText = ({ text }: { text: string }) => {
    const [expanded, setExpanded] = useState(false),
      isLong = text.trim().length > 90;
    return (
      <>
        {text && (
          <p className={`news-body ${expanded ? "expanded" : "collapsed"}`}>
            {expanded ? text : `${text.slice(0, 90)}${isLong ? "…" : ""}`}
          </p>
        )}
        {isLong && (
          <button
            type="button"
            className="read-more"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "عرض أقل ↑" : "المزيد ↓"}
          </button>
        )}
      </>
    );
  };
  const NewsCard = ({ x }: { x: any }) => {
    const images = x.image_url ? x.image_url.split("|") : [];
    const text = x.body || "";
    return (
      <article key={x.id}>
        <span>{x.item_type === "REPORT" ? "تقرير" : "إعلان مدرسي"}</span>
        {images.length > 0 && (
          <div className={`card-gallery count-${images.length}`}>
            {images.map((img: string) => (
              <img className="zoomable-image" key={img} loading="lazy" src={img} alt={x.title} onClick={() => setPreview({ src: img, alt: x.title })} />
            ))}
          </div>
        )}
        <h3>{x.title}</h3>
        <ExpandableText text={text} />
      </article>
    );
  };

  return (
    <main className="public-school public-premium" dir="rtl">
      <nav>
        <a className="public-brand" href="#home">
          {school.logo_url ? (
            <img src={school.logo_url} alt="شعار المدرسة" />
          ) : (
            <b>ص</b>
          )}
          <span>{school.school_name}</span>
        </a>
        <div>
          <a href="#achievers">المتفوقون</a>
          <a href="#news">الأخبار</a>
          <a href="#contact">تواصل معنا</a>
          <a className="public-login" href="/login">
            دخول النظام
          </a>
        </div>
      </nav>
      {home.ticker_text && (
        <div className="school-ticker">
          <strong>تنويه المدرسة</strong>
          <span key={tickerIndex}>{tickerMessages[tickerIndex]||home.ticker_text}</span>
        </div>
      )}
      <section id="home" className="public-hero premium-hero">
        <div>
          <span>بوابة المدرسة الرقمية الرسمية</span>
          <h1>{home.hero_title || school.school_name}</h1>
          <p>{home.hero_text || "أهلاً بكم في البوابة الرسمية للمدرسة"}</p>
          <div className="hero-actions">
            <a className="public-primary" href="/login">
              دخول النظام
            </a>
            <a className="public-secondary" href="#achievers">
              لوحة المتفوقين
            </a>
          </div>
          <small>
            {location} • العام الدراسي {school.academic_year}
          </small>
        </div>
        <div className="hero-card">
          <i>✦</i>
          <strong>{school.current_term}</strong>
          <p>تعليم، تميز، ومستقبل مشرق</p>
        </div>
      </section>
      {achievers.length > 0 && (
        <section id="achievers" className="public-section achievers-section">
          <div className="public-title">
            <span>نجوم المدرسة</span>
            <h2>الطلبة المتفوقون</h2>
            <p>لوحة مستقلة لتكريم أصحاب المراكز والنتائج المتميزة</p>
          </div>
          <div className="achievers-grid">
            {achievers.map((x) => (
              <article
                className={`achiever-card ${x.image_url ? "has-photo" : "no-photo"}`}
                key={x.id}
              >
                {x.image_url && (
                  <img className="zoomable-image"
                    loading="lazy"
                    src={x.image_url.split("|")[0]}
                    alt={x.title}
                    onClick={() => setPreview({ src: x.image_url.split("|")[0], alt: x.title })}
                  />
                )}
                <div>
                  <small>طالب / طالبة متفوق</small>
                  <h3>{x.title}</h3>
                  <div className="achiever-metrics">
                    {x.achiever_percentage && (
                      <span>
                        <b>{x.achiever_percentage}</b>النسبة
                      </span>
                    )}
                    {x.achiever_average && (
                      <span>
                        <b>{x.achiever_average}</b>المعدل
                      </span>
                    )}
                    {x.achiever_rank && (
                      <span className="rank">
                        <b>★</b>
                        {x.achiever_rank}
                      </span>
                    )}
                  </div>
                  {x.body && <p>{x.body}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <PublicShiftStats />
      {home.manager_name && (
        <section className="public-section manager-section">
          <article className="manager-card">
            {home.manager_image_url ? (
              <img className="zoomable-image"
                loading="lazy"
                src={home.manager_image_url}
                alt={home.manager_name}
                onClick={() => setPreview({ src: home.manager_image_url || "", alt: home.manager_name || "صورة المدير" })}
              />
            ) : (
              <div className="manager-placeholder">مد</div>
            )}
            <div>
              <span>إدارة المدرسة</span>
              <h2>{home.manager_name}</h2>
              <p>{home.manager_role || "مدير المدرسة"}</p>
              {home.manager_phone && (
                <a href={`tel:${home.manager_phone}`}>☎ {home.manager_phone}</a>
              )}
            </div>
          </article>
        </section>
      )}
      {news.length > 0 && (
        <section id="news" className="public-section public-news">
          <div className="public-title">
            <span>آخر المستجدات</span>
            <h2>الإعلانات والقرارات والتقارير</h2>
          </div>
          <div className="news-grid">
            {news.slice(0, 9).map((x) => (
              <NewsCard key={x.id} x={x} />
            ))}
          </div>
        </section>
      )}
      {media.length > 0 && (
        <section className="public-section">
          <div className="public-title">
            <span>من ذاكرة المدرسة</span>
            <h2>صور ولقطات مرئية</h2>
          </div>
          <div className="media-grid">
            {media.map((x) => {
              const y = embed(x.media_url),
                imgs = x.image_url
                  ? x.image_url.split("|").filter(Boolean)
                  : [];
              return (
                <article key={x.id}>
                  {y ? (
                    <iframe
                      src={y}
                      title={x.title}
                      loading="lazy"
                      allowFullScreen
                    />
                  ) : x.media_url ? (
                    <video
                      controls
                      preload="metadata"
                      poster={imgs[0] || undefined}
                    >
                      <source src={x.media_url} />
                    </video>
                  ) : imgs.length ? (
                    <div className={`card-gallery count-${imgs.length}`}>
                      {imgs.map((img) => (
                        <img className="zoomable-image" key={img} loading="lazy" src={img} alt={x.title} onClick={() => setPreview({ src: img, alt: x.title })} />
                      ))}
                    </div>
                  ) : (
                    <div className="media-placeholder">
                      <span>لا توجد صورة مرفوعة</span>
                    </div>
                  )}
                  <h3>{x.title}</h3>
                  <ExpandableText text={x.body || ""} />
                </article>
              );
            })}
          </div>
        </section>
      )}
      <section id="contact" className="public-contact">
        <div>
          <h2>تواصل معنا</h2>
          <p>{school.address || location}</p>
        </div>
        <div>
          {school.phone && <a href={`tel:${school.phone}`}>☎ {school.phone}</a>}
          {school.email && (
            <a href={`mailto:${school.email}`}>✉ {school.email}</a>
          )}
          <a href="/login">دخول النظام ←</a>
        </div>
      </section>
      {preview && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={preview.alt} onClick={() => setPreview(null)}><button type="button" aria-label="إغلاق الصورة" onClick={() => setPreview(null)}>×</button><img src={preview.src} alt={preview.alt} onClick={(e) => e.stopPropagation()} /></div>}
      <footer>© 2026 {school.school_name} — جميع الحقوق محفوظة</footer>
    </main>
  );
}
