"use client";
import { useEffect, useState } from "react";

type Settings = {
  hero_title?: string;
  hero_text?: string;
  manager_name?: string;
  manager_role?: string;
  manager_phone?: string;
  manager_image_url?: string;
  ticker_text?: string;
  ticker_speed_seconds?: number;
  ticker_gap_seconds?: number;
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
  achiever_group?: string;
  honor_featured?: number;
  sort_order: number;
  published: number;
};
const blankCard = {
  itemType: "REPORT",
  title: "",
  body: "",
  imageUrl: "",
  mediaUrl: "",
  achieverPercentage: "",
  achieverAverage: "",
  achieverRank: "",
  achieverGroup: "MORNING",
  honorFeatured: false,
  sortOrder: "0",
  published: true,
};
const blankAchiever = { ...blankCard, itemType: "ACHIEVER" };
const images = (value: string) =>
  value
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

export default function PublicContentSettings({
  notify,
}: {
  notify: (s: string) => void;
}) {
  const [settings, setSettings] = useState<Settings>({}),
    [items, setItems] = useState<Item[]>([]),
    [card, setCard] = useState(blankCard),
    [achiever, setAchiever] = useState(blankAchiever),
    [editing, setEditing] = useState<Item | null>(null),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(""),
    [progress, setProgress] = useState("");
  const load = () =>
    fetch("/api/homepage", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings !== undefined) {
          setSettings(d.settings || {});
          setItems(d.items || []);
        } else setError(d.error || "تعذر تحميل المحتوى");
      })
      .catch(() => setError("تعذر تحميل المحتوى"));
  useEffect(() => {
    load();
  }, []);
  const send = async (p: Record<string, unknown>) => {
    setError("");
    const r = await fetch("/api/homepage", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error || "تعذر الحفظ");
      return false;
    }
    notify(p.action === "delete" ? "تم حذف المحتوى" : "تم حفظ المحتوى");
    setEditing(null);
    load();
    return true;
  };
  const uploadFiles = async (files: File[], target: string) => {
    setError("");
    setUploading(target);
    const urls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (target !== "video" && !file.type.startsWith("image/"))
          throw new Error(`${file.name} ليس صورة`);
        setProgress(`رفع ${i + 1} من ${files.length}: ${file.name}`);
        const data = new FormData();
        data.append("file", file);
        const r = await fetch("/api/uploads", { method: "POST", body: data }),
          d = await r.json();
        if (!r.ok) throw new Error(`${file.name}: ${d.error || "تعذر الرفع"}`);
        urls.push(d.url);
      }
      return urls;
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر رفع الملفات");
      return [];
    } finally {
      setUploading("");
      setProgress("");
    }
  };
  const uploadManager = async (file: File) => {
    const urls = await uploadFiles([file], "manager");
    if (urls[0]) {
      setSettings((s) => ({ ...s, manager_image_url: urls[0] }));
      notify("تم رفع صورة المدير؛ اضغط حفظ");
    }
  };
  const uploadCardImages = async (files: File[]) => {
    const urls = await uploadFiles(files, "card");
    if (urls.length) {
      setCard((f) => ({
        ...f,
        imageUrl: [...images(f.imageUrl), ...urls].join("|"),
      }));
      notify(`تم رفع ${urls.length} صورة؛ عاينها ثم احفظ`);
    }
  };
  const uploadAchiever = async (file: File) => {
    const urls = await uploadFiles([file], "achiever");
    if (urls[0]) {
      setAchiever((f) => ({ ...f, imageUrl: urls[0] }));
      notify("تم رفع صورة المتفوق");
    }
  };
  const uploadVideo = async (file: File) => {
    const urls = await uploadFiles([file], "video");
    if (urls[0]) setCard((f) => ({ ...f, mediaUrl: urls[0] }));
  };
  const edit = (x: Item) => {
    const value = {
      itemType: x.item_type,
      title: x.title,
      body: x.body,
      imageUrl: x.image_url,
      mediaUrl: x.media_url,
      achieverPercentage: x.achiever_percentage || "",
      achieverAverage: x.achiever_average || "",
      achieverRank: x.achiever_rank || "",
      achieverGroup: x.achiever_group === "EVENING" ? "EVENING" : "MORNING",
      honorFeatured: !!x.honor_featured,
      sortOrder: String(x.sort_order),
      published: !!x.published,
    };
    setEditing(x);
    x.item_type === "ACHIEVER" ? setAchiever(value) : setCard(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
    notify("تم تحميل المحتوى للتعديل");
  };
  const submitCard = async () => {
    if (uploading) return setError("انتظر حتى يكتمل رفع الصور");
    if (
      await send({
        action: editing ? "update" : "create",
        id: editing?.id,
        ...card,
      })
    )
      setCard(blankCard);
  };
  const submitAchiever = async () => {
    if (uploading) return setError("انتظر حتى يكتمل رفع الصورة");
    if (
      await send({
        action: editing ? "update" : "create",
        id: editing?.id,
        ...achiever,
        itemType: "ACHIEVER",
      })
    )
      setAchiever(blankAchiever);
  };
  const achievers = items.filter((x) => x.item_type === "ACHIEVER"),
    cards = items.filter((x) => x.item_type !== "ACHIEVER");
  return (
    <section className="homepage-settings">
      <div className="panel settings-intro">
        <div>
          <h2>إعدادات الصفحة العامة — الصور والمتفوقون</h2>
          <p>
            الصور تُرفع بأحجامها الأصلية، والمتفوقون في نموذج وقائمة مستقلين عن
            الأخبار والتقارير.
          </p>
        </div>
        <a className="public-login" href="/showcase">
          معاينة الصفحة ↗
        </a>
      </div>
      {error && <div className="form-error">{error}</div>}
      {progress && <div className="upload-progress">{progress}</div>}
      <form
        className="panel settings-premium-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await send({
            action: "settings",
            heroTitle: settings.hero_title,
            heroText: settings.hero_text,
            managerName: settings.manager_name,
            managerRole: settings.manager_role,
            managerPhone: settings.manager_phone,
            managerImageUrl: settings.manager_image_url,
            tickerText: settings.ticker_text,
            tickerSpeed: settings.ticker_speed_seconds,
            tickerGap: settings.ticker_gap_seconds,
          });
        }}
      >
        <div className="form-section-title">
          <h3>واجهة المدرسة وبطاقة المدير</h3>
          <p>تخصيص العناوين والترحيب</p>
        </div>
        <div className="form-grid">
          <label>
            <span>عنوان الواجهة</span>
            <input
              value={settings.hero_title || ""}
              onChange={(e) =>
                setSettings({ ...settings, hero_title: e.target.value })
              }
            />
          </label>
          <label>
            <span>النص التعريفي</span>
            <textarea
              value={settings.hero_text || ""}
              onChange={(e) =>
                setSettings({ ...settings, hero_text: e.target.value })
              }
            />
          </label>
          <label className="wide">
            <span>رسائل شريط التنويه</span>
            <textarea
              value={settings.ticker_text || ""}
              onChange={(e) =>
                setSettings({ ...settings, ticker_text: e.target.value })
              }
              placeholder="اكتب كل رسالة في سطر، أو افصل بينها بعلامة |"
            />
            <small>يمكن إضافة رسالتين أو ثلاث أو أكثر، كل رسالة في سطر مستقل.</small>
          </label>
          <label>
            <span>مدة حركة الرسالة بالثواني</span>
            <input type="number" min="5" max="60" value={settings.ticker_speed_seconds || 23} onChange={(e)=>setSettings({...settings,ticker_speed_seconds:Number(e.target.value)})}/>
            <small>رقم أقل = حركة أسرع، رقم أكبر = حركة أبطأ.</small>
          </label>
          <label>
            <span>الفاصل بين الرسائل بالثواني</span>
            <input type="number" min="0" max="20" value={settings.ticker_gap_seconds ?? 2} onChange={(e)=>setSettings({...settings,ticker_gap_seconds:Number(e.target.value)})}/>
          </label>
          <label>
            <span>اسم المدير</span>
            <input
              value={settings.manager_name || ""}
              onChange={(e) =>
                setSettings({ ...settings, manager_name: e.target.value })
              }
            />
          </label>
          <label>
            <span>المسمى الوظيفي</span>
            <input
              value={settings.manager_role || ""}
              onChange={(e) =>
                setSettings({ ...settings, manager_role: e.target.value })
              }
            />
          </label>
          <label>
            <span>رقم التواصل</span>
            <input
              inputMode="tel"
              value={settings.manager_phone || ""}
              onChange={(e) =>
                setSettings({ ...settings, manager_phone: e.target.value })
              }
            />
          </label>
          <label>
            <span>صورة المدير</span>
            <input
              type="file"
              accept="image/*"
              disabled={!!uploading}
              onChange={(e) =>
                e.target.files?.[0] && uploadManager(e.target.files[0])
              }
            />
            <small>تُقبل الصور الكبيرة حتى حد الاستضافة</small>
          </label>
          <label>
            <span>أو رابط الصورة</span>
            <input
              type="url"
              value={settings.manager_image_url || ""}
              onChange={(e) =>
                setSettings({ ...settings, manager_image_url: e.target.value })
              }
            />
          </label>
        </div>
        <div className="settings-actions">
          <button className="primary" disabled={!!uploading}>
            حفظ بيانات الواجهة
          </button>
        </div>
      </form>
      <form
        className="panel settings-premium-form achiever-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await submitAchiever();
        }}
      >
        <div className="form-section-title">
          <h3>إضافة طالب أو طالبة متفوقة</h3>
          <p>قسم مستقل عن الأخبار والتقارير، والصورة اختيارية.</p>
        </div>
        <div className="form-grid">
          <label>
            <span>اسم الطالب/الطالبة</span>
            <input
              required
              value={achiever.title}
              onChange={(e) =>
                setAchiever({ ...achiever, title: e.target.value })
              }
            />
          </label>
          <label>
            <span>فترة الدراسة</span>
            <select
              value={achiever.achieverGroup}
              onChange={(e) =>
                setAchiever({ ...achiever, achieverGroup: e.target.value })
              }
            >
              <option value="MORNING">الفترة الصباحية — الأولاد</option>
              <option value="EVENING">الفترة المسائية — البنات</option>
            </select>
            <small>سيظهر الأولاد أعلى الصفحة والبنات أسفلهم.</small>
          </label>
          <label>
            <span>النسبة المئوية</span>
            <input
              inputMode="decimal"
              value={achiever.achieverPercentage}
              onChange={(e) =>
                setAchiever({ ...achiever, achieverPercentage: e.target.value })
              }
              placeholder="مثال: 98.5%"
            />
          </label>
          <label>
            <span>المعدل</span>
            <input
              inputMode="decimal"
              value={achiever.achieverAverage}
              onChange={(e) =>
                setAchiever({ ...achiever, achieverAverage: e.target.value })
              }
              placeholder="مثال: 98.5 أو ممتاز"
            />
          </label>
          <label>
            <span>الترتيب على مستوى المدرسة</span>
            <input
              value={achiever.achieverRank}
              onChange={(e) =>
                setAchiever({ ...achiever, achieverRank: e.target.value })
              }
              placeholder="مثال: الأول على مستوى المدرسة"
            />
          </label>
          <label className="wide">
            <span>التقرير عن الطالب</span>
            <textarea
              value={achiever.body}
              onChange={(e) =>
                setAchiever({ ...achiever, body: e.target.value })
              }
              placeholder="نبذة عن التفوق والإنجازات"
            />
          </label>
          <label>
            <span>صورة اختيارية</span>
            <input
              type="file"
              accept="image/*"
              disabled={!!uploading}
              onChange={(e) =>
                e.target.files?.[0] && uploadAchiever(e.target.files[0])
              }
            />
            <small>بدون صورة سيظهر الاسم والتقرير</small>
          </label>
          <label>
            <span>ترتيب العرض</span>
            <input
              type="number"
              value={achiever.sortOrder}
              onChange={(e) =>
                setAchiever({ ...achiever, sortOrder: e.target.value })
              }
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={achiever.published}
              onChange={(e) =>
                setAchiever({ ...achiever, published: e.target.checked })
              }
            />{" "}
            نشر مباشرة
          </label>
          <label className="check wide honor-choice">
            <input
              type="checkbox"
              checked={achiever.honorFeatured}
              onChange={(e) =>
                setAchiever({ ...achiever, honorFeatured: e.target.checked })
              }
            />{" "}
            اختيار ضمن بطاقة «الأوائل على مستوى المدرسة»
            <small>اختر حتى ثلاثة من كل فترة لتظهر في البطاقة الاحتفالية.</small>
          </label>
        </div>
        {achiever.imageUrl && (
          <div className="single-upload-preview">
            <img src={achiever.imageUrl} alt="معاينة صورة المتفوق" />
          </div>
        )}
        <div className="settings-actions">
          <button className="primary" disabled={!!uploading}>
            {editing?.item_type === "ACHIEVER"
              ? "حفظ التعديل"
              : "إضافة إلى لوحة المتفوقين"}
          </button>
        </div>
      </form>
      <form
        className="panel settings-premium-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await submitCard();
        }}
      >
        <div className="form-section-title">
          <h3>إضافة خبر أو تقرير أو صور</h3>
          <p>يمكن إرفاق عدة صور، ولن يمكن الحفظ قبل اكتمال رفعها.</p>
        </div>
        <div className="form-grid">
          <label>
            <span>نوع المحتوى</span>
            <select
              value={card.itemType}
              onChange={(e) => setCard({ ...card, itemType: e.target.value })}
            >
              <option value="NEWS">خبر أو قرار</option>
              <option value="REPORT">تقرير مدرسي</option>
              <option value="MEDIA">صور أو فيديو</option>
            </select>
          </label>
          <label>
            <span>العنوان</span>
            <input
              required
              value={card.title}
              onChange={(e) => setCard({ ...card, title: e.target.value })}
            />
          </label>
          <label className="wide">
            <span>التقرير أو الوصف</span>
            <textarea
              value={card.body}
              onChange={(e) => setCard({ ...card, body: e.target.value })}
            />
          </label>
          <label>
            <span>اختر صورة أو عدة صور</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={!!uploading}
              onChange={(e) =>
                e.target.files?.length &&
                uploadCardImages(Array.from(e.target.files))
              }
            />
            <small>تُرفع بأحجامها الأصلية واحدة بعد الأخرى</small>
          </label>
          <label>
            <span>فيديو قصير</span>
            <input
              type="file"
              accept="video/*"
              disabled={!!uploading}
              onChange={(e) =>
                e.target.files?.[0] && uploadVideo(e.target.files[0])
              }
            />
          </label>
          <label>
            <span>روابط الصور مفصولة بـ |</span>
            <input
              type="text"
              value={card.imageUrl}
              onChange={(e) => setCard({ ...card, imageUrl: e.target.value })}
            />
          </label>
          <label>
            <span>رابط فيديو / يوتيوب</span>
            <input
              type="url"
              value={card.mediaUrl}
              onChange={(e) => setCard({ ...card, mediaUrl: e.target.value })}
            />
          </label>
          <label>
            <span>ترتيب العرض</span>
            <input
              type="number"
              value={card.sortOrder}
              onChange={(e) => setCard({ ...card, sortOrder: e.target.value })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={card.published}
              onChange={(e) =>
                setCard({ ...card, published: e.target.checked })
              }
            />{" "}
            نشر مباشرة
          </label>
        </div>
        {images(card.imageUrl).length > 0 && (
          <div className="upload-previews">
            {images(card.imageUrl).map((url) => (
              <figure key={url}>
                <img src={url} alt="معاينة الصورة المرفوعة" />
                <button
                  type="button"
                  onClick={() =>
                    setCard((f) => ({
                      ...f,
                      imageUrl: images(f.imageUrl)
                        .filter((x) => x !== url)
                        .join("|"),
                    }))
                  }
                >
                  حذف
                </button>
              </figure>
            ))}
          </div>
        )}
        <div className="settings-actions">
          <button className="primary" disabled={!!uploading}>
            {uploading
              ? "انتظر اكتمال الرفع..."
              : editing && editing.item_type !== "ACHIEVER"
                ? "حفظ التعديل"
                : "إضافة المحتوى"}
          </button>
        </div>
      </form>
      <ContentList
        title="الطلاب المتفوقون"
        empty="لم تضف طلابًا متفوقين بعد."
        items={achievers}
        edit={edit}
        remove={(id) => send({ action: "delete", id })}
      />
      <ContentList
        title="الأخبار والتقارير والصور"
        empty="لا توجد أخبار أو تقارير محفوظة."
        items={cards}
        edit={edit}
        remove={(id) => send({ action: "delete", id })}
      />
    </section>
  );
}

function ContentList({
  title,
  empty,
  items,
  edit,
  remove,
}: {
  title: string;
  empty: string;
  items: Item[];
  edit: (x: Item) => void;
  remove: (id: number) => void;
}) {
  return (
    <section className="panel relation-card">
      <h2>{title}</h2>
      <div className="homepage-items">
        {items.map((x) => (
          <article key={x.id}>
            <div>
              <strong>{x.title}</strong>
              <small>
                {x.item_type === "ACHIEVER"
                  ? [
                      x.achiever_percentage &&
                        `النسبة ${x.achiever_percentage}`,
                      x.achiever_average && `المعدل ${x.achiever_average}`,
                      x.achiever_rank,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "بيانات المتفوق"
                  : `${x.item_type} • ${x.published ? "منشور" : "مخفي"} • ${images(x.image_url).length} صورة`}
              </small>
              <p>{x.body}</p>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="action-link"
                onClick={() => edit(x)}
              >
                تعديل
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => remove(x.id)}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
        {!items.length && <p>{empty}</p>}
      </div>
    </section>
  );
}
