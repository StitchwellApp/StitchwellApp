import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Flower2,
  Heart,
  Home,
  ImagePlus,
  LogIn,
  LogOut,
  LockKeyhole,
  Plus,
  Search,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import "./App.css";

type Sal = {
  id: string;
  title: string;
  description: string;
  designer: string;
  tags: string[];
  sections: number;
  start: string;
  cadence: number;
  art: string;
  coverPreview?: string;
  patternFiles?: {
    name: string;
    size: number;
    section: number | null;
    path?: string;
  }[];
};
type DraftPatternFile = {
  id: string;
  file: File;
  section: number | "full" | null;
};
type DemoProfile = {
  name: string;
  bio: string;
  location: string;
  avatarPreview?: string;
};
type DatabaseSal = {
  id: string;
  title: string;
  description: string;
  theme_tags: string[] | null;
  section_count: number;
  start_date: string;
  cadence_days: number;
  cover_path: string | null;
  designer?:
    { display_name: string | null } | { display_name: string | null }[] | null;
  pattern_files?:
    | {
        file_name: string;
        byte_size: number;
        section_number: number | null;
        storage_path: string;
      }[]
    | null;
};
type Screen = "home" | "browse" | "calendar" | "library" | "profile" | "detail";
type Status = "Live" | "Upcoming" | "Library";
const day = 86400000;
const dateShift = (offset: number) => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) +
      offset * day,
  )
    .toISOString()
    .slice(0, 10);
};
const release = (sal: Sal, section: number) =>
  Date.parse(`${sal.start}T00:00:00Z`) + section * sal.cadence * day;
const status = (sal: Sal, at: number): Status =>
  at < release(sal, 0)
    ? "Upcoming"
    : at >= release(sal, sal.sections - 1)
      ? "Library"
      : "Live";
const unlocked = (sal: Sal, at: number) =>
  Array.from({ length: sal.sections }, (_, i) => release(sal, i)).filter(
    (value) => value <= at,
  ).length;
function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
const localTime = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
async function makeLocalImagePreview(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image preview could not be prepared.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.76);
}
const seed: Sal[] = [
  {
    id: "garden",
    title: "Garden Cottage SAL",
    description:
      "A peaceful cottage surrounded by a blooming garden, stitched one cozy section at a time.",
    designer: "Hazel & Oak Designs",
    tags: ["Cottage", "Floral"],
    sections: 12,
    start: dateShift(-21),
    cadence: 7,
    art: "cottage",
  },
  {
    id: "wildflowers",
    title: "Wildflower Bouquet",
    description:
      "A cheerful collection of meadow flowers, with a new surprise each week.",
    designer: "Poppy & Pine",
    tags: ["Floral", "Nature"],
    sections: 8,
    start: dateShift(-14),
    cadence: 7,
    art: "flowers",
  },
  {
    id: "cat",
    title: "Curious Cat",
    description: "Meet a curious companion among the flowers.",
    designer: "Owl & Fox",
    tags: ["Animals", "Floral"],
    sections: 10,
    start: dateShift(-9),
    cadence: 3,
    art: "cat",
  },
  {
    id: "lighthouse",
    title: "Lighthouse View",
    description: "A gentle coastal scene unfolding beside the sea.",
    designer: "Coastal Stitches",
    tags: ["Coastal", "Landscape"],
    sections: 12,
    start: dateShift(12),
    cadence: 3,
    art: "sea",
  },
  {
    id: "harvest",
    title: "Autumn Harvest",
    description: "Pumpkins, leaves, and all the warmth of autumn.",
    designer: "Hazel & Oak Designs",
    tags: ["Autumn", "Seasonal"],
    sections: 6,
    start: dateShift(-100),
    cadence: 7,
    art: "pumpkin",
  },
  {
    id: "swedish",
    title: "Swedish Home",
    description: "A welcoming home stitched in soft Scandinavian colors.",
    designer: "Nordic Stitch Co.",
    tags: ["Cottage", "Winter"],
    sections: 8,
    start: dateShift(-150),
    cadence: 7,
    art: "home",
  },
];
function saved<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}
function Art({ kind, small = false }: { kind: string; small?: boolean }) {
  const marks: Record<string, string> = {
    cottage: "⌂",
    flowers: "✿",
    cat: "♧",
    sea: "⌁",
    pumpkin: "◒",
    home: "⌂",
    custom: "✿",
  };
  return (
    <div className={`art ${kind} ${small ? "small" : ""}`} aria-hidden="true">
      <i className="sun" />
      <i className="hill" />
      <strong>{marks[kind] || "✿"}</strong>
      <span className="flower f1">✽</span>
      <span className="flower f2">✽</span>
    </div>
  );
}
function SalArt({ sal, small = false }: { sal: Sal; small?: boolean }) {
  if (sal.coverPreview) {
    return (
      <div className={`art photo-art${small ? " small" : ""}`}>
        <img src={sal.coverPreview} alt={`${sal.title} cover`} />
      </div>
    );
  }
  return <Art kind={sal.art} small={small} />;
}
function Badge({ value }: { value: Status }) {
  return <span className={`badge ${value.toLowerCase()}`}>● {value}</span>;
}
function Title({
  label,
  title,
  sub,
}: {
  label: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="page-title">
      <span className="eyebrow">{label}</span>
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  );
}
function Empty({
  title,
  body,
  action,
  actionLabel = "Browse SALs",
}: {
  title: string;
  body: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="empty">
      <Flower2 size={34} />
      <h3>{title}</h3>
      <p>{body}</p>
      {action && (
        <button className="primary" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
function Card({
  sal,
  open,
  progress = false,
}: {
  sal: Sal;
  open: () => void;
  progress?: boolean;
}) {
  const now = useClock();
  return (
    <button className="sal-card" onClick={open}>
      <SalArt sal={sal} />
      <div className="sal-card-body">
        <Badge value={status(sal, now)} />
        <h3>{sal.title}</h3>
        <p>by {sal.designer}</p>
        <div className="meta">
          <span>
            <BookOpen size={13} /> {sal.sections} sections
          </span>
          <span>
            <Clock3 size={13} /> Every {sal.cadence} days
          </span>
        </div>
        {progress && (
          <small className="progress-label">
            {unlocked(sal, now)} of {sal.sections} sections released
          </small>
        )}
      </div>
      <ChevronRight className="card-arrow" size={18} />
    </button>
  );
}
function Detail({
  sal,
  isJoined,
  toggle,
  back,
  byDesigner,
}: {
  sal: Sal;
  isJoined: boolean;
  toggle: () => void;
  back: () => void;
  byDesigner: () => void;
}) {
  const [tab, setTab] = useState<"sections" | "about">("sections");
  const now = useClock();
  return (
    <>
      <button className="back" onClick={back}>
        <ArrowLeft size={16} /> Browse SALs
      </button>
      <div className="detail-top">
        <div className="detail-art">
          <SalArt sal={sal} />
        </div>
        <div className="detail-copy">
          <Badge value={status(sal, now)} />
          <h1>{sal.title}</h1>
          <button className="designer-link" onClick={byDesigner}>
            by {sal.designer} <ChevronRight size={14} />
          </button>
          <p>{sal.description}</p>
          <div className="detail-facts">
            <span>
              <BookOpen size={17} /> {sal.sections} sections
            </span>
            <span>
              <Clock3 size={17} /> Every {sal.cadence} days
            </span>
            <span>
              <CalendarDays size={17} /> Starts {localTime(release(sal, 0))}
            </span>
          </div>
          <button
            className={`primary join ${isJoined ? "joined" : ""}`}
            onClick={toggle}
          >
            {isJoined ? (
              <>
                <Check size={17} /> Joined — in your library
              </>
            ) : (
              "Join this free SAL"
            )}
          </button>
          <small>
            {isJoined
              ? "Released sections are listed below."
              : "Free to join. Sections unlock for everyone on the release date."}
          </small>
        </div>
      </div>
      <div className="detail-bottom">
        <div className="tabs">
          <button
            className={tab === "sections" ? "active" : ""}
            onClick={() => setTab("sections")}
          >
            Sections
          </button>
          <button
            className={tab === "about" ? "active" : ""}
            onClick={() => setTab("about")}
          >
            About
          </button>
        </div>
        {tab === "sections" ? (
          <>
            <div className="release-summary">
              <strong>
                {unlocked(sal, now)} of {sal.sections} released
              </strong>
              <div className="track">
                <span
                  style={{
                    width: `${(unlocked(sal, now) / sal.sections) * 100}%`,
                  }}
                />
              </div>
            </div>
            {Array.from({ length: sal.sections }, (_, i) => {
              const available = release(sal, i) <= now;
              return (
                <div className="section-line" key={i}>
                  <span className={available && isJoined ? "open" : ""}>
                    {available && isJoined ? (
                      <Check size={16} />
                    ) : (
                      <LockKeyhole size={16} />
                    )}
                  </span>
                  <div>
                    <strong>Section {i + 1}</strong>
                    <small>
                      {available
                        ? isJoined
                          ? sal.patternFiles?.some(
                              (file) => file.section === i + 1,
                            )
                            ? "File mapped in local preview · connect Stitchwell for secure access"
                            : "Available in your library · connect Stitchwell for file access"
                          : "Join to access"
                        : `Releases ${localTime(release(sal, i))}`}
                    </small>
                    {available &&
                      isJoined &&
                      sal.patternFiles
                        ?.filter((file) => file.section === i + 1 && file.path)
                        .map((file) => (
                          <button
                            className="file-download"
                            key={file.path}
                            onClick={async () => {
                              const { data, error } = await supabase!.storage
                                .from("sal-patterns")
                                .createSignedUrl(file.path!, 60);
                              if (error || !data?.signedUrl) {
                                window.alert(
                                  "This pattern file could not be opened.",
                                );
                                return;
                              }
                              window.open(
                                data.signedUrl,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            <BookOpen size={13} /> Download {file.name}
                          </button>
                        ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="about">
            <p>{sal.description}</p>
            <div className="tags">
              {sal.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p>
              Releases happen at 00:00 UTC. Displayed dates and times use your
              local time zone.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
function Calendar({ sals, open }: { sals: Sal[]; open: (id: string) => void }) {
  const [offset, setOffset] = useState(0);
  const now = new Date(useClock());
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const events = sals
    .flatMap((sal) =>
      Array.from({ length: sal.sections }, (_, i) => ({
        sal,
        i,
        at: new Date(release(sal, i)),
      })),
    )
    .filter(
      (event) =>
        event.at.getFullYear() === month.getFullYear() &&
        event.at.getMonth() === month.getMonth(),
    )
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return (
    <>
      <Title
        label="PLAN YOUR STITCHING"
        title="Release calendar"
        sub="See what’s coming next. Times are shown in your local time zone."
      />
      <div className="calendar-box">
        <div className="calendar-head">
          <h2>
            {new Intl.DateTimeFormat(undefined, {
              month: "long",
              year: "numeric",
            }).format(month)}
          </h2>
          <div>
            <button
              aria-label="Previous month"
              onClick={() => setOffset(offset - 1)}
            >
              <ArrowLeft size={17} />
            </button>
            <button
              aria-label="Next month"
              onClick={() => setOffset(offset + 1)}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((item) => (
            <strong key={item}>{item}</strong>
          ))}
          {Array.from({ length: month.getDay() }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
            <div className="calendar-day" key={n}>
              <span>{n}</span>
              {events
                .filter((e) => e.at.getDate() === n)
                .map((e) => (
                  <button
                    key={`${e.sal.id}-${e.i}`}
                    onClick={() => open(e.sal.id)}
                    title={`${e.sal.title}, section ${e.i + 1}`}
                  >
                    {e.sal.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
      <div className="section-heading">
        <h2>Release dates</h2>
      </div>
      <div className="event-list">
        {events.map((e) => (
          <button key={`${e.sal.id}-${e.i}`} onClick={() => open(e.sal.id)}>
            <CalendarDays size={18} />
            <span>
              <strong>
                {e.sal.title} · Section {e.i + 1}
              </strong>
              <small>{localTime(e.at.getTime())}</small>
            </span>
            <ChevronRight size={17} />
          </button>
        ))}
        {!events.length && (
          <Empty
            title="A quiet month"
            body="No releases are scheduled here yet."
          />
        )}
      </div>
    </>
  );
}
function Designer({
  created,
  add,
  connected,
}: {
  created: Sal[];
  add: (sal: Sal, files: DraftPatternFile[], cover?: File) => Promise<void>;
  connected: boolean;
}) {
  const now = useClock();
  const [page, setPage] = useState<"overview" | "create">("overview");
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [tags, setTags] = useState(""),
    [sections, setSections] = useState(8),
    [cadenceMode, setCadenceMode] = useState<
      "weekly" | "three-days" | "custom"
    >("weekly"),
    [customCadence, setCustomCadence] = useState(5),
    [start, setStart] = useState(dateShift(7)),
    [files, setFiles] = useState<DraftPatternFile[]>([]),
    [coverPreview, setCoverPreview] = useState(""),
    [coverFile, setCoverFile] = useState<File>(),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const cadence =
    cadenceMode === "weekly"
      ? 7
      : cadenceMode === "three-days"
        ? 3
        : customCadence;
  const choose = (list: FileList | null) => {
    if (!list) return;
    const next = [...list];
    if (next.some((file) => !/\.(pdf|zip|jpe?g|png)$/i.test(file.name)))
      return setError("Choose PDF, ZIP, JPG, or PNG files.");
    if (next.some((file) => file.size === 0))
      return setError("Empty files cannot be added.");
    if (next.some((file) => file.size > 50 * 1024 * 1024))
      return setError("Each file must be 50 MB or smaller.");
    setFiles((current) => [
      ...current,
      ...next.map((file) => ({ id: crypto.randomUUID(), file, section: null })),
    ]);
    setError("");
  };
  const chooseCover = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Choose a JPG or PNG cover image.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("The cover image must be 50 MB or smaller.");
      return;
    }
    try {
      setCoverPreview(await makeLocalImagePreview(file));
      setCoverFile(file);
      setError("");
    } catch {
      setError("This image could not be previewed. Please choose another one.");
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!files.length) return setError("Add at least one pattern file first.");
    if (files.some((item) => item.section === null))
      return setError(
        "Choose a section for each file, or mark it as a full pattern.",
      );
    if (!Number.isInteger(sections) || sections < 1)
      return setError(
        "The number of sections must be a whole number of at least one.",
      );
    if (cadence < 1 || !Number.isInteger(cadence))
      return setError(
        "The interval must be a whole number of at least one day.",
      );
    if (!start || Number.isNaN(Date.parse(`${start}T00:00:00Z`)))
      return setError("Choose a valid start date.");
    const sal: Sal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      designer: "Your designer studio",
      tags: tags
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      sections,
      cadence,
      start,
      art: "custom",
      coverPreview: coverPreview || undefined,
      patternFiles: files.map(({ file, section }) => ({
        name: file.name,
        size: file.size,
        section: section === "full" ? null : section!,
      })),
    };
    setSaving(true);
    try {
      await add(sal, files, coverFile);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The SAL could not be saved. Please try again.",
      );
      setSaving(false);
      return;
    }
    setNotice(title);
    setTitle("");
    setDescription("");
    setTags("");
    setFiles([]);
    setCoverPreview("");
    setCoverFile(undefined);
    setError("");
    setPage("overview");
    setSaving(false);
  };
  return (
    <div className="designer-layout">
      <aside className="designer-side">
        <span className="eyebrow">DESIGNER STUDIO</span>
        <button
          className={page === "overview" ? "active" : ""}
          onClick={() => setPage("overview")}
        >
          <Home size={18} /> Overview
        </button>
        <button
          className={page === "create" ? "active" : ""}
          onClick={() => setPage("create")}
        >
          <Plus size={18} /> Create a SAL
        </button>
        <div className="side-note">
          <Flower2 size={22} />
          <strong>Make something wonderful.</strong>
          <p>Your next stitch-along starts here.</p>
        </div>
      </aside>
      <main className="designer-main">
        {page === "overview" ? (
          <>
            <div className="studio-hero">
              <div>
                <span className="eyebrow">DESIGNER STUDIO</span>
                <h1>Welcome, creator.</h1>
                <p>
                  Share your patterns and bring stitchers together, one section
                  at a time.
                </p>
                <button className="primary" onClick={() => setPage("create")}>
                  <Plus size={17} /> Create a stitch-along
                </button>
              </div>
              <Flower2 className="hero-flower" size={115} strokeWidth={1.1} />
            </div>
            {notice && (
              <div className="notice">
                <Check size={17} /> “{notice}” was saved in this local preview.
                Connect Supabase to publish it for stitchers.
              </div>
            )}
            <div className="stats">
              <div>
                <span>Your SALs</span>
                <strong>{created.length}</strong>
              </div>
              <div>
                <span>Currently live</span>
                <strong>
                  {created.filter((s) => status(s, now) === "Live").length}
                </strong>
              </div>
              <div>
                <span>Coming soon</span>
                <strong>
                  {created.filter((s) => status(s, now) === "Upcoming").length}
                </strong>
              </div>
            </div>
            <div className="section-heading">
              <h2>Your stitch-alongs</h2>
              <button className="text-link" onClick={() => setPage("create")}>
                Create new <Plus size={16} />
              </button>
            </div>
            {created.length ? (
              <div className="studio-list">
                {created.map((s) => (
                  <div key={s.id}>
                    <SalArt sal={s} small />
                    <span>
                      <strong>{s.title}</strong>
                      <small>
                        {s.sections} sections · every {s.cadence} days
                        {s.patternFiles?.length
                          ? ` · ${s.patternFiles.length} files mapped`
                          : ""}
                      </small>
                    </span>
                    <Badge value={status(s, now)} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Your first SAL starts here"
                body="Create a free stitch-along and set its release schedule."
                action={() => setPage("create")}
                actionLabel="Create a SAL"
              />
            )}
          </>
        ) : (
          <>
            <button className="back" onClick={() => setPage("overview")}>
              <ArrowLeft size={16} /> Studio overview
            </button>
            <Title
              label="NEW STITCH-ALONG"
              title="Create a stitch-along"
              sub="Set up your pattern and schedule. All SALs are free in this MVP."
            />
            <form className="create-form" onSubmit={submit}>
              <section>
                <div className="form-intro">
                  <span>01</span>
                  <div>
                    <h2>The essentials</h2>
                    <p>Give your SAL a name and a story.</p>
                  </div>
                </div>
                <div className="fields">
                  <label>
                    SAL title
                    <input
                      required
                      maxLength={100}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Garden Cottage SAL"
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What will stitchers create with you?"
                    />
                  </label>
                  <label>
                    Theme tags <small>separate with commas</small>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Cottage, Floral, Spring"
                    />
                  </label>
                  <label>
                    Cover image
                    <div
                      className={`cover-picker ${coverPreview ? "has-cover" : ""}`}
                    >
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Selected SAL cover preview"
                        />
                      ) : (
                        <ImagePlus size={22} />
                      )}
                      <span>
                        <strong>
                          {coverPreview
                            ? "Change cover image"
                            : "Choose a cover image"}
                        </strong>
                        <small>JPG or PNG · up to 50 MB</small>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                        onChange={(e) => chooseCover(e.target.files?.[0])}
                      />
                    </div>
                  </label>
                </div>
              </section>
              <section>
                <div className="form-intro">
                  <span>02</span>
                  <div>
                    <h2>Your pattern</h2>
                    <p>Choose the files for your SAL.</p>
                  </div>
                </div>
                <div className="fields">
                  <label className="upload">
                    <UploadCloud size={26} />
                    <strong>Choose pattern files</strong>
                    <small>PDF, ZIP, JPG, or PNG · up to 50 MB each</small>
                    <input
                      type="file"
                      accept=".pdf,.zip,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => {
                        choose(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {files.map((item) => (
                    <div className="file-assignment" key={item.id}>
                      <BookOpen size={17} />
                      <span className="file-name">
                        <strong>{item.file.name}</strong>
                        <small>
                          {(item.file.size / 1048576).toFixed(1)} MB
                        </small>
                      </span>
                      <select
                        aria-label={`Assign ${item.file.name}`}
                        value={
                          item.section === "full"
                            ? "full"
                            : (item.section ?? "")
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setFiles((current) =>
                            current.map((file) =>
                              file.id !== item.id
                                ? file
                                : {
                                    ...file,
                                    section:
                                      value === ""
                                        ? null
                                        : value === "full"
                                          ? "full"
                                          : Number(value),
                                  },
                            ),
                          );
                        }}
                      >
                        <option value="">Choose access</option>
                        <option value="full">
                          Full pattern (designer only)
                        </option>
                        {Array.from({ length: sections }, (_, i) => i + 1).map(
                          (number) => (
                            <option key={number} value={number}>
                              Section {number}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((current) =>
                            current.filter((file) => file.id !== item.id),
                          )
                        }
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}
                  <label>
                    Number of sections
                    <input
                      required
                      type="number"
                      min={1}
                      step={1}
                      value={sections}
                      onChange={(e) => {
                        const next = Math.max(
                          1,
                          Math.floor(Number(e.target.value) || 1),
                        );
                        setSections(next);
                        setFiles((current) =>
                          current.map((item) =>
                            typeof item.section === "number" &&
                            item.section > next
                              ? { ...item, section: next }
                              : item,
                          ),
                        );
                      }}
                    />
                  </label>
                </div>
              </section>
              <section>
                <div className="form-intro">
                  <span>03</span>
                  <div>
                    <h2>Release schedule</h2>
                    <p>Sections release at 00:00 UTC.</p>
                  </div>
                </div>
                <div className="fields">
                  <label>
                    Release cadence
                    <div className="cadence">
                      {(
                        [
                          ["weekly", "Weekly"],
                          ["three-days", "Every 3 days"],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          type="button"
                          key={mode}
                          className={cadenceMode === mode ? "active" : ""}
                          onClick={() => setCadenceMode(mode)}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={cadenceMode === "custom" ? "active" : ""}
                        onClick={() => setCadenceMode("custom")}
                      >
                        Custom
                      </button>
                    </div>
                  </label>
                  {cadenceMode === "custom" && (
                    <label>
                      Days between sections
                      <input
                        required
                        min={1}
                        step={1}
                        type="number"
                        value={customCadence}
                        onChange={(e) =>
                          setCustomCadence(
                            Math.floor(Number(e.target.value) || 1),
                          )
                        }
                      />
                    </label>
                  )}
                  <label>
                    Start date
                    <input
                      required
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </label>
                  <div className="schedule-note">
                    <CalendarDays size={18} /> First release:{" "}
                    {localTime(Date.parse(`${start}T00:00:00Z`))} in your time
                    zone
                  </div>
                </div>
              </section>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-footer">
                <small>
                  <LockKeyhole size={15} />
                  {connected
                    ? "Pattern files upload to private storage and release by enrollment and date."
                    : "Preview only: pattern files are not saved or uploaded."}
                </small>
                <button className="primary" type="submit" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : connected
                      ? "Publish SAL"
                      : "Save preview SAL"}{" "}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
function AuthDialog({
  close,
  initialMode = "sign-in",
}: {
  close: () => void;
  initialMode?: "sign-in" | "new-password";
}) {
  const [mode, setMode] = useState<
    "sign-in" | "sign-up" | "reset" | "new-password"
  >(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "new-password") {
        const { error: authError } = await supabase.auth.updateUser({
          password,
        });
        if (authError) throw authError;
        close();
      } else if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        close();
      } else if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: location.origin,
          },
        });
        if (authError) throw authError;
        if (!data.session)
          setMessage(
            "Check your email for a confirmation link to finish creating your account.",
          );
        else close();
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: location.origin,
          },
        );
        if (authError) throw authError;
        setMessage(
          "If an account exists for that address, a reset link is on its way.",
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Account request failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="auth-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          className="auth-close"
          type="button"
          aria-label="Close"
          onClick={close}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">STITCHWELL ACCOUNT</span>
        <h2 id="auth-title">
          {mode === "sign-up"
            ? "Join the stitching circle"
            : mode === "reset"
              ? "Reset your password"
              : mode === "new-password"
                ? "Choose a new password"
                : "Welcome back"}
        </h2>
        <p>
          {mode === "reset"
            ? "We’ll email you a secure password reset link."
            : mode === "new-password"
              ? "Choose a new password for your account."
              : "Sign in to save your stitch-alongs and pattern library."}
        </p>
        <form onSubmit={submit}>
          {mode === "sign-up" && (
            <label>
              Your name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          {mode !== "new-password" && (
            <label>
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              {mode === "new-password" ? "New password" : "Password"}
              <input
                required
                type="password"
                minLength={8}
                autoComplete={
                  mode === "sign-up" || mode === "new-password"
                    ? "new-password"
                    : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "sign-up"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : mode === "new-password"
                    ? "Save new password"
                    : "Sign in"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-links">
          {mode === "sign-in" && (
            <button type="button" onClick={() => setMode("reset")}>
              Forgot password?
            </button>
          )}
          {mode === "reset" || mode === "new-password" ? (
            <button type="button" onClick={() => setMode("sign-in")}>
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setMode(mode === "sign-in" ? "sign-up" : "sign-in")
              }
            >
              {mode === "sign-in"
                ? "Create an account"
                : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
function App() {
  const now = useClock();
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<
    "sign-in" | "new-password"
  >("sign-in");
  const [remoteSals, setRemoteSals] = useState<Sal[]>([]);
  const [remoteCreated, setRemoteCreated] = useState<Sal[]>([]);
  const [serviceMessage, setServiceMessage] = useState("");
  const [designer, setDesigner] = useState(
    location.pathname.startsWith("/designer"),
  );
  const [screen, setScreen] = useState<Screen>("home");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("garden");
  const [joined, setJoined] = useState<string[]>(() =>
    saved("stitchwell-joined", ["garden"]),
  );
  const [created, setCreated] = useState<Sal[]>(() =>
    saved("stitchwell-created", []),
  );
  const [profile, setProfile] = useState<DemoProfile>(() =>
    saved<DemoProfile>("stitchwell-profile", {
      name: "Your name",
      bio: "",
      location: "",
    }),
  );
  const [editProfile, setEditProfile] = useState(false);
  const [profileImageError, setProfileImageError] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File>();
  const [avatarPath, setAvatarPath] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setAuthInitialMode("new-password");
        setAuthOpen(true);
      } else if (event === "SIGNED_OUT") {
        setAuthInitialMode("sign-in");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const client = supabase;
    if (!client) {
      setRemoteSals([]);
      setRemoteCreated([]);
      return;
    }
    let cancelled = false;
    if (!session?.user.id) {
      setRemoteCreated([]);
      setJoined(saved("stitchwell-joined", ["garden"]));
      setProfile(
        saved<DemoProfile>("stitchwell-profile", {
          name: "Your name",
          bio: "",
          location: "",
        }),
      );
      setAvatarPath("");
      void client
        .from("sals")
        .select(
          "id,title,description,theme_tags,section_count,start_date,cadence_days,cover_path",
        )
        .eq("publication_status", "published")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setServiceMessage("Published stitch-alongs could not be loaded.");
            return;
          }
          setRemoteSals(
            (data || []).map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description,
              designer: "Stitchwell designer",
              tags: row.theme_tags || [],
              sections: row.section_count,
              start: row.start_date,
              cadence: row.cadence_days,
              art: "custom",
              coverPreview: row.cover_path
                ? client.storage.from("sal-covers").getPublicUrl(row.cover_path)
                    .data.publicUrl
                : undefined,
            })),
          );
          setServiceMessage("");
        });
      return () => {
        cancelled = true;
      };
    }
    const load = async () => {
      const select =
        "id,title,description,theme_tags,section_count,start_date,cadence_days,cover_path,designer_id,designer:profiles!sals_designer_id_fkey(display_name),pattern_files(file_name,byte_size,section_number,storage_path)";
      const [
        { data: published, error: publishedError },
        { data: own, error: ownError },
        { data: memberships, error: membershipError },
        { data: ownProfile },
      ] = await Promise.all([
        client
          .from("sals")
          .select(select)
          .eq("publication_status", "published")
          .order("created_at", { ascending: false }),
        client
          .from("sals")
          .select(select)
          .eq("designer_id", session.user.id)
          .order("created_at", { ascending: false }),
        client
          .from("enrollments")
          .select("sal_id")
          .eq("user_id", session.user.id),
        client
          .from("profiles")
          .select("display_name,bio,location,avatar_path")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (publishedError || ownError || membershipError) {
        setServiceMessage(
          "Connected to Stitchwell, but some account data could not be loaded. Please refresh.",
        );
        return;
      }
      const mapSal = (row: DatabaseSal): Sal => ({
        id: row.id,
        title: row.title,
        description: row.description,
        designer:
          (Array.isArray(row.designer)
            ? row.designer[0]?.display_name
            : row.designer?.display_name) || "Stitchwell designer",
        tags: row.theme_tags || [],
        sections: row.section_count,
        start: row.start_date,
        cadence: row.cadence_days,
        art: "custom",
        coverPreview: row.cover_path
          ? client.storage.from("sal-covers").getPublicUrl(row.cover_path).data
              .publicUrl
          : undefined,
        patternFiles: (row.pattern_files || []).map((file) => ({
          name: file.file_name,
          size: file.byte_size,
          section: file.section_number,
          path: file.storage_path,
        })),
      });
      const ownSals = (own || []).map(mapSal);
      const publishedSals = (published || []).map(mapSal);
      setRemoteSals(publishedSals);
      setRemoteCreated(ownSals);
      setJoined([
        "garden",
        ...(memberships || []).map((item: { sal_id: string }) => item.sal_id),
      ]);
      if (ownProfile) {
        setAvatarPath(ownProfile.avatar_path || "");
        const avatarPreview = ownProfile.avatar_path
          ? client.storage.from("avatars").getPublicUrl(ownProfile.avatar_path)
              .data.publicUrl
          : undefined;
        setProfile({
          name: ownProfile.display_name || "Your name",
          bio: ownProfile.bio || "",
          location: ownProfile.location || "",
          avatarPreview,
        });
      }
      setServiceMessage("");
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);
  const chooseProfileImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setProfileImageError("Choose a JPG or PNG photo.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setProfileImageError("The photo must be 50 MB or smaller.");
      return;
    }
    try {
      const avatarPreview = await makeLocalImagePreview(file);
      setProfile((current) => ({ ...current, avatarPreview }));
      setProfilePhotoFile(file);
      setProfileImageError("");
    } catch {
      setProfileImageError(
        "This photo could not be previewed. Please choose another one.",
      );
    }
  };
  const saveProfile = async () => {
    if (!supabase || !session?.user.id) return;
    let nextAvatarPath = avatarPath;
    let uploadedPath = "";
    if (profilePhotoFile) {
      const extension = profilePhotoFile.type === "image/png" ? "png" : "jpg";
      uploadedPath = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(uploadedPath, profilePhotoFile, {
          contentType: profilePhotoFile.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      nextAvatarPath = uploadedPath;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.name,
        bio: profile.bio,
        location: profile.location,
        avatar_path: nextAvatarPath || null,
      })
      .eq("id", session.user.id);
    if (error) {
      if (uploadedPath)
        await supabase.storage.from("avatars").remove([uploadedPath]);
      throw error;
    }
    setAvatarPath(nextAvatarPath);
    if (nextAvatarPath) {
      const client = supabase;
      setProfile((current) => ({
        ...current,
        avatarPreview: client.storage
          .from("avatars")
          .getPublicUrl(nextAvatarPath).data.publicUrl,
      }));
    }
    setProfilePhotoFile(undefined);
    setServiceMessage("Your profile is saved to Stitchwell.");
  };
  const deleteAccount = async () => {
    if (!supabase || !session) return;
    if (
      !window.confirm(
        "Permanently delete your Stitchwell account, SALs, and uploaded files? This cannot be undone.",
      )
    )
      return;
    setDeletingAccount(true);
    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });
    if (error) {
      setServiceMessage(
        error.message || "Account deletion could not be completed.",
      );
      setDeletingAccount(false);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setRemoteSals([]);
    setRemoteCreated([]);
    setAvatarPath("");
    setServiceMessage(
      "Your Stitchwell account and stored files have been deleted.",
    );
    setDeletingAccount(false);
  };
  const saveSal = async (
    sal: Sal,
    draftFiles: DraftPatternFile[],
    cover?: File,
  ) => {
    if (!supabase || !session?.user.id) {
      setCreated((current) => [sal, ...current]);
      return;
    }
    const userId = session.user.id;
    const uploaded: { bucket: string; path: string }[] = [];
    const savedPatternFiles: NonNullable<Sal["patternFiles"]> = [];
    try {
      const { error: salError } = await supabase.from("sals").insert({
        id: sal.id,
        designer_id: userId,
        title: sal.title,
        description: sal.description,
        theme_tags: sal.tags,
        section_count: sal.sections,
        start_date: sal.start,
        cadence_days: sal.cadence,
        publication_status: "published",
        access_model: "free",
        price_cents: 0,
      });
      if (salError) throw salError;
      const { error: sectionError } = await supabase
        .from("sal_sections")
        .insert(
          Array.from({ length: sal.sections }, (_, index) => ({
            sal_id: sal.id,
            section_number: index + 1,
          })),
        );
      if (sectionError) throw sectionError;
      for (const item of draftFiles) {
        const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${sal.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("sal-patterns")
          .upload(path, item.file, {
            contentType: item.file.type || "application/octet-stream",
            upsert: false,
          });
        if (uploadError) throw uploadError;
        uploaded.push({ bucket: "sal-patterns", path });
        const { error: metadataError } = await supabase
          .from("pattern_files")
          .insert({
            sal_id: sal.id,
            section_number: item.section === "full" ? null : item.section,
            storage_path: path,
            file_name: item.file.name,
            mime_type: item.file.type || "application/octet-stream",
            byte_size: item.file.size,
          });
        if (metadataError) throw metadataError;
        savedPatternFiles.push({
          name: item.file.name,
          size: item.file.size,
          section: item.section === "full" ? null : item.section,
          path,
        });
      }
      let coverPreview = sal.coverPreview;
      if (cover) {
        const extension = cover.type === "image/png" ? "png" : "jpg";
        const path = `${sal.id}/cover-${crypto.randomUUID()}.${extension}`;
        const { error: coverError } = await supabase.storage
          .from("sal-covers")
          .upload(path, cover, { contentType: cover.type, upsert: false });
        if (coverError) throw coverError;
        uploaded.push({ bucket: "sal-covers", path });
        const { error: updateError } = await supabase
          .from("sals")
          .update({ cover_path: path })
          .eq("id", sal.id);
        if (updateError) throw updateError;
        coverPreview = supabase.storage.from("sal-covers").getPublicUrl(path)
          .data.publicUrl;
      }
      const savedSal = {
        ...sal,
        coverPreview,
        designer: profile.name || "Your designer studio",
        patternFiles: savedPatternFiles,
      };
      setRemoteCreated((current) => [savedSal, ...current]);
      setRemoteSals((current) => [savedSal, ...current]);
      setServiceMessage(
        "Your stitch-along is published and pattern files are stored privately.",
      );
    } catch (reason) {
      await Promise.all(
        ["sal-patterns", "sal-covers"].map((bucket) =>
          supabase!.storage
            .from(bucket)
            .remove(
              uploaded
                .filter((item) => item.bucket === bucket)
                .map((item) => item.path),
            ),
        ),
      );
      await supabase.from("sals").delete().eq("id", sal.id);
      throw reason;
    }
  };
  const toggleJoin = async (sal: Sal) => {
    if (supabase && remoteSals.some((item) => item.id === sal.id)) {
      if (!session) {
        setAuthOpen(true);
        return;
      }
      const leaving = joined.includes(sal.id);
      const request = leaving
        ? supabase
            .from("enrollments")
            .delete()
            .eq("user_id", session.user.id)
            .eq("sal_id", sal.id)
        : supabase
            .from("enrollments")
            .insert({ user_id: session.user.id, sal_id: sal.id });
      const { error } = await request;
      if (error) {
        setServiceMessage(error.message);
        return;
      }
      setJoined((current) =>
        leaving ? current.filter((id) => id !== sal.id) : [...current, sal.id],
      );
      return;
    }
    setJoined((current) =>
      current.includes(sal.id)
        ? current.filter((id) => id !== sal.id)
        : [...current, sal.id],
    );
  };
  const sals = useMemo(() => {
    const unique = new Map(
      [...remoteSals, ...created].map((sal) => [sal.id, sal]),
    );
    for (const sample of seed)
      if (!unique.has(sample.id)) unique.set(sample.id, sample);
    return [...unique.values()];
  }, [remoteSals, created]);
  useEffect(() => {
    if (!session && !supabaseConfigured)
      localStorage.setItem("stitchwell-joined", JSON.stringify(joined));
  }, [joined, session]);
  useEffect(
    () => localStorage.setItem("stitchwell-created", JSON.stringify(created)),
    [created],
  );
  useEffect(() => {
    if (!session && !supabaseConfigured)
      localStorage.setItem("stitchwell-profile", JSON.stringify(profile));
  }, [profile, session]);
  const go = (s: Screen) => {
    setScreen(s);
    scrollTo(0, 0);
  };
  const open = (id: string) => {
    setSelected(id);
    go("detail");
  };
  const mode = () => {
    const next = !designer;
    setDesigner(next);
    history.replaceState(null, "", next ? "/designer" : "/");
    scrollTo(0, 0);
  };
  const closeAuth = () => {
    setAuthOpen(false);
    setAuthInitialMode("sign-in");
  };
  const matches = sals.filter(
    (s) =>
      (filter === "All" || status(s, now) === filter) &&
      `${s.title} ${s.designer} ${s.description} ${s.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selectedSal = sals.find((s) => s.id === selected) || sals[0];
  const nav = [
    { id: "home", Icon: Home, label: "Home" },
    { id: "browse", Icon: Search, label: "Browse" },
    { id: "calendar", Icon: CalendarDays, label: "Calendar" },
    { id: "library", Icon: BookOpen, label: "Library" },
    { id: "profile", Icon: UserRound, label: "Profile" },
  ] as const;
  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => (designer ? mode() : go("home"))}
        >
          <Heart size={21} fill="currentColor" /> Stitchwell
        </button>
        <div>
          <span className="preview">
            ● {supabaseConfigured ? "Supabase connected" : "Local preview"}
          </span>
          {session ? (
            <button
              className="account-button"
              onClick={() => void supabase?.auth.signOut()}
              title={`Signed in as ${session.user.email || "Stitchwell member"}`}
            >
              <LogOut size={15} /> Sign out
            </button>
          ) : supabaseConfigured ? (
            <button
              className="account-button"
              onClick={() => setAuthOpen(true)}
            >
              <LogIn size={15} /> Sign in
            </button>
          ) : null}
          <button className="role" onClick={mode}>
            {designer ? "Stitcher view" : "Designer studio"}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
      </header>
      {serviceMessage && (
        <p className="service-message" role="status">
          {serviceMessage}
        </p>
      )}
      {designer ? (
        <Designer
          created={session ? remoteCreated : created}
          connected={Boolean(session && supabase)}
          add={saveSal}
        />
      ) : (
        <>
          <div className="layout">
            <aside className="sidebar">
              <span className="eyebrow">EXPLORE</span>
              {nav.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  className={screen === id ? "active" : ""}
                  onClick={() => go(id)}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
              <div className="side-note">
                <Flower2 size={23} />
                <strong>A little joy in every stitch.</strong>
                <p>Find your next project and make something lovely.</p>
                <button onClick={() => go("browse")}>
                  Explore SALs <ArrowRight size={14} />
                </button>
              </div>
            </aside>
            <main className="main">
              {screen === "home" && (
                <>
                  <Title
                    label="WELCOME TO STITCHWELL"
                    title="Find your next happy stitch."
                    sub="Join a stitch-along, follow every release, and keep your patterns together."
                  />
                  <div className="search">
                    <Search size={18} />
                    <input
                      aria-label="Search SALs"
                      placeholder="Search by theme, keyword, or designer"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && go("browse")}
                    />
                    <button onClick={() => go("browse")}>Search</button>
                  </div>
                  <div className="section-heading">
                    <h2>Upcoming events</h2>
                    <button
                      className="text-link"
                      onClick={() => go("calendar")}
                    >
                      View calendar <ArrowRight size={16} />
                    </button>
                  </div>
                  <button
                    className="event-banner"
                    onClick={() => go("calendar")}
                  >
                    <CalendarDays size={27} />
                    <span>
                      <strong>
                        There’s always something to look forward to.
                      </strong>
                      <small>See when new sections become available.</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                  <div className="section-heading">
                    <h2>Stitch-alongs to explore</h2>
                    <button className="text-link" onClick={() => go("browse")}>
                      See all SALs <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="cards">
                    {sals.slice(0, 3).map((s) => (
                      <Card key={s.id} sal={s} open={() => open(s.id)} />
                    ))}
                  </div>
                </>
              )}
              {screen === "browse" && (
                <>
                  <Title
                    label="DISCOVER"
                    title="Browse stitch-alongs"
                    sub="A new project is waiting for you."
                  />
                  <div className="search">
                    <Search size={18} />
                    <input
                      aria-label="Search SALs"
                      placeholder="Search themes, keywords, or designers"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="filters">
                    {(["All", "Live", "Upcoming", "Library"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          className={filter === f ? "active" : ""}
                          onClick={() => setFilter(f)}
                        >
                          {f}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="cards">
                    {matches.map((s) => (
                      <Card key={s.id} sal={s} open={() => open(s.id)} />
                    ))}
                  </div>
                  {!matches.length && (
                    <Empty
                      title="No SALs found"
                      body="Try a different keyword or status."
                    />
                  )}
                </>
              )}
              {screen === "calendar" && <Calendar sals={sals} open={open} />}
              {screen === "library" && (
                <>
                  <Title
                    label="YOUR COLLECTION"
                    title="My pattern library"
                    sub="Every unlocked section, together in one cozy place."
                  />
                  <div className="cards">
                    {sals
                      .filter((s) => joined.includes(s.id))
                      .map((s) => (
                        <Card
                          key={s.id}
                          sal={s}
                          open={() => open(s.id)}
                          progress
                        />
                      ))}
                  </div>
                  {!joined.length && (
                    <Empty
                      title="Your library is waiting"
                      body="Join a stitch-along to see its released sections here."
                      action={() => go("browse")}
                    />
                  )}
                </>
              )}
              {screen === "profile" && (
                <>
                  <Title
                    label="YOUR SPACE"
                    title="My profile"
                    sub="A little corner for your stitching journey."
                  />
                  <div className="profile">
                    <div className="avatar">
                      {profile.avatarPreview ? (
                        <img src={profile.avatarPreview} alt="Your profile" />
                      ) : (
                        <UserRound size={31} />
                      )}
                    </div>
                    {editProfile ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            if (session) await saveProfile();
                            setEditProfile(false);
                          } catch (reason) {
                            setServiceMessage(
                              reason instanceof Error
                                ? reason.message
                                : "Your profile could not be saved.",
                            );
                          }
                        }}
                      >
                        <label>
                          Profile photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              chooseProfileImage(e.target.files?.[0]);
                              e.currentTarget.value = "";
                            }}
                          />
                          <small>
                            JPG or PNG ·{" "}
                            {session
                              ? "stored with your account"
                              : "saved in this browser preview only"}
                          </small>
                          {profileImageError && (
                            <small className="error-inline">
                              {profileImageError}
                            </small>
                          )}
                        </label>
                        <label>
                          Name
                          <input
                            required
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Bio
                          <textarea
                            rows={3}
                            value={profile.bio}
                            onChange={(e) =>
                              setProfile({ ...profile, bio: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Location
                          <input
                            value={profile.location}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                location: e.target.value,
                              })
                            }
                          />
                        </label>
                        <button className="primary">Save profile</button>
                      </form>
                    ) : (
                      <div>
                        <h2>{profile.name}</h2>
                        <p>
                          {profile.bio ||
                            "Tell fellow stitchers a little about yourself."}
                        </p>
                        <small>{profile.location}</small>
                        <button
                          className="outline"
                          onClick={() => setEditProfile(true)}
                        >
                          Edit profile
                        </button>
                      </div>
                    )}
                  </div>
                  {session && (
                    <button
                      className="delete-account"
                      type="button"
                      disabled={deletingAccount}
                      onClick={() => void deleteAccount()}
                    >
                      {deletingAccount
                        ? "Deleting account…"
                        : "Delete my account and uploaded data"}
                    </button>
                  )}
                  <div className="section-heading">
                    <h2>In progress</h2>
                  </div>
                  <div className="cards">
                    {sals
                      .filter(
                        (s) =>
                          joined.includes(s.id) && status(s, now) !== "Library",
                      )
                      .map((s) => (
                        <Card
                          key={s.id}
                          sal={s}
                          open={() => open(s.id)}
                          progress
                        />
                      ))}
                  </div>
                  <div className="section-heading">
                    <h2>Completed SALs</h2>
                  </div>
                  <div className="cards">
                    {sals
                      .filter(
                        (s) =>
                          joined.includes(s.id) && status(s, now) === "Library",
                      )
                      .map((s) => (
                        <Card
                          key={s.id}
                          sal={s}
                          open={() => open(s.id)}
                          progress
                        />
                      ))}
                  </div>
                </>
              )}
              {screen === "detail" && (
                <Detail
                  sal={selectedSal}
                  isJoined={joined.includes(selectedSal.id)}
                  toggle={() => void toggleJoin(selectedSal)}
                  back={() => go("browse")}
                  byDesigner={() => {
                    setQuery(selectedSal.designer);
                    setFilter("All");
                    go("browse");
                  }}
                />
              )}
            </main>
          </div>
          <nav className="bottom-nav">
            {nav.map(({ id, Icon, label }) => (
              <button
                key={id}
                className={screen === id ? "active" : ""}
                onClick={() => go(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
      {authOpen && supabase && (
        <AuthDialog initialMode={authInitialMode} close={closeAuth} />
      )}
    </div>
  );
}
export default App;
