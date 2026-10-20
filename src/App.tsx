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
  LockKeyhole,
  Plus,
  Search,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
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
      <Art kind={sal.art} />
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
          <Art kind={sal.art} />
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
                          ? "Available in your library · connect Supabase for file access"
                          : "Join to access"
                        : `Releases ${localTime(release(sal, i))}`}
                    </small>
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
}: {
  created: Sal[];
  add: (sal: Sal) => void;
}) {
  const now = useClock();
  const [page, setPage] = useState<"overview" | "create">("overview");
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [tags, setTags] = useState(""),
    [sections, setSections] = useState(8),
    [cadence, setCadence] = useState(7),
    [start, setStart] = useState(dateShift(7)),
    [files, setFiles] = useState<File[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const choose = (list: FileList | null) => {
    if (!list) return;
    const next = [...list];
    if (next.some((file) => !/\.(pdf|zip|jpe?g|png)$/i.test(file.name)))
      return setError("Choose PDF, ZIP, JPG, or PNG files.");
    if (next.some((file) => file.size > 50 * 1024 * 1024))
      return setError("Each file must be 50 MB or smaller.");
    setFiles([...files, ...next]);
    setError("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!files.length) return setError("Add a pattern file first.");
    if (cadence < 1) return setError("The interval must be at least one day.");
    add({
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
    });
    setNotice(title);
    setTitle("");
    setDescription("");
    setTags("");
    setFiles([]);
    setError("");
    setPage("overview");
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
                    <Art kind={s.art} small />
                    <span>
                      <strong>{s.title}</strong>
                      <small>
                        {s.sections} sections · every {s.cadence} days
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
                    <div className="cover-placeholder">
                      <ImagePlus size={21} /> Cover upload awaits Supabase
                      storage
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
                      onChange={(e) => choose(e.target.files)}
                    />
                  </label>
                  {files.map((file, i) => (
                    <div className="file" key={`${file.name}-${i}`}>
                      <BookOpen size={17} />
                      <span>
                        {file.name} · {(file.size / 1048576).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles(files.filter((_, n) => n !== i))
                        }
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}
                  <label>
                    Number of sections
                    <select
                      value={sections}
                      onChange={(e) => setSections(Number(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} sections
                        </option>
                      ))}
                    </select>
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
                      {[7, 3].map((n) => (
                        <button
                          type="button"
                          key={n}
                          className={cadence === n ? "active" : ""}
                          onClick={() => setCadence(n)}
                        >
                          {n === 7 ? "Weekly" : "Every 3 days"}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={![7, 3].includes(cadence) ? "active" : ""}
                        onClick={() => setCadence(5)}
                      >
                        Custom
                      </button>
                    </div>
                  </label>
                  {![7, 3].includes(cadence) && (
                    <label>
                      Days between sections
                      <input
                        required
                        min={1}
                        max={365}
                        type="number"
                        value={cadence}
                        onChange={(e) => setCadence(Number(e.target.value))}
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
                  <LockKeyhole size={15} /> Local preview: selected files are
                  not uploaded or saved.
                </small>
                <button className="primary" type="submit">
                  Save preview SAL <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
function App() {
  const now = useClock();
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
  const [profile, setProfile] = useState(() =>
    saved("stitchwell-profile", { name: "Your name", bio: "", location: "" }),
  );
  const [editProfile, setEditProfile] = useState(false);
  const sals = useMemo(() => [...created, ...seed], [created]);
  useEffect(
    () => localStorage.setItem("stitchwell-joined", JSON.stringify(joined)),
    [joined],
  );
  useEffect(
    () => localStorage.setItem("stitchwell-created", JSON.stringify(created)),
    [created],
  );
  useEffect(
    () => localStorage.setItem("stitchwell-profile", JSON.stringify(profile)),
    [profile],
  );
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
          <span className="preview">● Local preview</span>
          <button className="role" onClick={mode}>
            {designer ? "Stitcher view" : "Designer studio"}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
      </header>
      {designer ? (
        <Designer created={created} add={(s) => setCreated([s, ...created])} />
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
                      <UserRound size={31} />
                    </div>
                    {editProfile ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setEditProfile(false);
                        }}
                      >
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
                  toggle={() =>
                    setJoined(
                      joined.includes(selectedSal.id)
                        ? joined.filter((id) => id !== selectedSal.id)
                        : [...joined, selectedSal.id],
                    )
                  }
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
    </div>
  );
}
export default App;
