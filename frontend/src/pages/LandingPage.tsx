
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  Check,
  ChevronDown,
  CircleCheckBig,
  CirclePlay,
  Fingerprint,
  Globe,
  HandHelping,
  LayoutDashboard,
  ClipboardCheck,
  MessageCircle,
  Mail,
  Radar,
  ScanSearch,
  UserCheck,
} from "lucide-react";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import otherLogos from "../assets/Other-Logos.png";

const workflowSteps = [
  ["01", "Detect", "Spot a change in a student's academic signal."],
  ["02", "Understand", "Bring the full academic context into view."],
  ["03", "Identify", "Surface repeated patterns and root causes."],
  ["04", "Assess", "Calculate eligibility, severity and recovery room."],
  ["05", "Recommend", "Suggest the most appropriate next action."],
  ["06", "Approve", "Keep consequential decisions with people."],
  ["07", "Intervene", "Coordinate the support a student needs."],
  ["08", "Monitor", "Track whether the intervention is working."],
  ["09", "Recover", "Clear the backlog or escalate with context."],
];

const roleIcons = [
  BookOpen,
  HandHelping,
  LayoutDashboard,
  ClipboardCheck,
  BriefcaseBusiness,
];

const roles = [
  ["Student", "See your backlogs, attempts and a clear recovery plan.", "01"],
  ["Faculty / Mentor", "Know who needs your time and what to discuss.", "02"],
  ["HOD", "See department-wide academic health before risk compounds.", "03"],
  ["Examination Cell", "Keep eligibility, attempts and fees compliant.", "04"],
  ["Placement Cell", "Understand placement constraints early.", "05"],
];



const workflowIcons = [
  Radar,
  ScanSearch,
  Fingerprint,
  Calculator,
  ClipboardCheck,
  UserCheck,
  HandHelping,
  Activity,
  CircleCheckBig,
];

export default function LandingPage({
  onEnter,
  onPrototype,
}: {
  onEnter: (roleId?: string) => void;
  onPrototype: () => void;
}) {
  return (
    <main className="landing-page">
      <div
        className="institutional-strip"
        aria-label="Institutional affiliations"
      >
        <div className="institutional-inner">
          <a
            className="institutional-vignan"
            href="https://vignan.ac.in/"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Vignan's Foundation for Science, Technology and Research"
          >
            <img
              src="/vignan-logo-with-deemed.svg"
              alt="Vignan's Foundation for Science, Technology and Research, Deemed to be University"
            />
          </a>
          <span className="institutional-divider" aria-hidden="true" />
          <div className="institutional-recognition">
            <img
              src={otherLogos}
              alt="NAAC A plus, NIRF, NBA, AICTE, UGC, Ministry of Education and ABET recognitions"
            />
          </div>
        </div>
      </div>
      <nav className="site-nav">
        <a className="brand" href="#top" aria-label="EduRecover home">
          <Brand />
        </a>
        <div className="nav-links">
          <a href="#platform">Platform</a>
          <a href="#workflows">Workflows</a>
          <a href="#roles">For institutions</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <button className="link-button" onClick={onPrototype}>
            Prototype
          </button>
          <ThemeToggle className="navbar-theme-toggle" />
          <button className="primary-button small" onClick={() => onEnter()}>
            Get started <ArrowUpRight size={15} />
          </button>
        </div>
      </nav>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Academic recovery platform
          </div>
          <h1>
            Turn academic signals into <em>timely student action.</em>
          </h1>
          <p>
            Student records change every week. EduRecover turns those changes
            into a clear next step for the people who can help, before a backlog
            becomes a surprise at the end of term.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onEnter()}>
              Explore platform <ArrowUpRight size={16} />
            </button>
            <button className="secondary-button" onClick={onPrototype}>
              <CirclePlay size={20} /> View live demo
            </button>
          </div>
          <div className="hero-proof">
            <span className="proof-avatars">
              <i>AS</i>
              <i>PR</i>
              <i>NK</i>
            </span>
            <span>Built for the people who move students forward.</span>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Academic command center preview"
        >
          <div className="visual-glow" />
          <div className="dashboard-preview">
            <div className="preview-top">
              <div className="mini-brand">
                <Brand compact /> Academic Health
              </div>
              <span className="live-pill">
                <i /> Live
              </span>
            </div>
            <div className="preview-heading">
              <div>
                <small>Department-wide overview</small>
                <strong>Academic Command Center</strong>
              </div>
              <span className="date-pill">
                2025 - 26 <ChevronDown size={10} strokeWidth={2.2} />
              </span>
            </div>
            <div className="preview-metrics">
              <div>
                <small>Active backlogs</small>
                <strong>214</strong>
                <span className="positive">↗ 12% last term</span>
              </div>
              <div>
                <small>Students affected</small>
                <strong>87</strong>
                <span className="positive">↗ 8% last term</span>
              </div>
              <div>
                <small>Duration risk</small>
                <strong className="orange">13</strong>
                <span className="warning">↗ 5% last term</span>
              </div>
            </div>
            <div className="preview-charts">
              <div className="chart-panel">
                <small>Backlogs by semester</small>
                <div className="bars">
                  {[45, 72, 52, 88, 63, 76].map((height) => (
                    <i style={{ height: `${height}%` }} key={height} />
                  ))}
                </div>
                <div className="chart-labels">
                  <span>Sem 1</span>
                  <span>Sem 2</span>
                  <span>Sem 3</span>
                  <span>Sem 4</span>
                  <span>Sem 5</span>
                  <span>Sem 6</span>
                </div>
              </div>
              <div className="chart-panel donut-panel">
                <small>Recoverability</small>
                <div className="donut">
                  <b>
                    214<small>Total</small>
                  </b>
                </div>
                <div className="legend">
                  <span>
                    <i className="blue-dot" /> Routine 54%
                  </span>
                  <span>
                    <i className="orange-dot" /> Intensive 14%
                  </span>
                </div>
              </div>
            </div>
            <div className="preview-alert">
              <span className="alert-icon">!</span>
              <div>
                <small>Requires HOD attention</small>
                <strong>9 critical cases need review</strong>
              </div>
              <span className="arrow">→</span>
            </div>
            <div className="float-card repeat-card">
              <span className="float-icon coral">!</span>
              <div>
                <small>Repeated failure</small>
                <strong>Data Structures × 3</strong>
              </div>
            </div>
            <div className="float-card plan-card">
              <span className="float-icon mint">
                <Check size={14} />
              </span>
              <div>
                <small>Intervention completed</small>
                <strong>Student #2048</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section section-shell" id="workflows">
        <div className="section-heading centered">
          <div className="eyebrow">One platform · nine connected workflows</div>
          <h2>
            From early detection to <em>lasting recovery.</em>
          </h2>
          <p>
            A backlog should never arrive as a surprise. Follow the work from
            the first signal to the action that helps a student recover.
          </p>
        </div>
        <div className="bento-grid">
          {workflowSteps.map(([number, title, description], index) => {
            const Icon = workflowIcons[index];
            return (
              <div
                className={`bento-tile bento-tile-${index}`}
                key={number}
              >
                <span className="bento-num">{number}</span>
                <span className="bento-icon">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <strong className="bento-title">{title}</strong>
                <p className="bento-desc">{description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="roles-section section-shell" id="roles">
        <div className="section-heading">
          <div className="eyebrow">Built for every stakeholder</div>
          <h2>
            Different roles. <em>One shared goal.</em>
          </h2>
          <p>
            Everyone sees the signal that matters to them, without losing the
            context behind it.
          </p>
        </div>
        <div className="role-grid">
          {roles.map(([title, description, number], index) => {
            const Icon = roleIcons[index];
            return (
              <article
                className="role-card"
                key={title}
              >
                <span className="role-number">{number}</span>
                <div className="role-icon">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    const roleIds = ["student", "mentor", "hod", "exam", "placement"];
                    onEnter(roleIds[index]);
                  }}
                >
                  See workspace <ArrowUpRight size={14} />
                </button>
              </article>
            );
          })}
        </div>

      </section>

      <section className="human-section section-shell" id="platform">
        <div className="human-copy">
          <div className="eyebrow">Trust by design</div>
          <h2>
            AI monitors. <em>Humans decide.</em>
          </h2>
          <p>
            EduRecover makes the reasoning visible while keeping consequential
            academic decisions with the people responsible for students.
          </p>
          <button className="secondary-button trust-cta" onClick={() => onEnter()}>
            Explore the command center <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="decision-flow">
          <div className="flow-node ai-node">
            <span>
              <Activity size={18} />
            </span>
            <div>
              <small>Academic review</small>
              <strong>Detect · calculate · recommend</strong>
            </div>
          </div>
          <div className="flow-connector" aria-hidden="true">
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2 L12 24 M6 18 L12 26 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flow-node human-node">
            <span>
              <Check size={18} />
            </span>
            <div>
              <small>Human review</small>
              <strong>Approve · edit · act</strong>
            </div>
          </div>
          <div className="flow-result">
            <span>↗</span>
            <div>
              <small>Better outcomes</small>
              <strong>Clearer action. Earlier support.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section section-shell" id="about">
        <div>
          <div className="eyebrow">Start with the signal</div>
          <h2>
            Academic problems become harder when they're discovered too late.
          </h2>
          <p>Notice earlier. Understand clearly. Support students well.</p>
        </div>
        <button className="primary-button" onClick={() => onEnter()}>
          Get started <ArrowUpRight size={16} />
        </button>
      </section>

      <footer className="site-footer">
        <div className="footer-wave footer-wave-one" />
        <div className="footer-wave footer-wave-two" />
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <Brand />
            </a>
            <p>Academic recovery, made actionable.</p>
            <span className="footer-live">
              <i /> Ready for early support
            </span>
            <button className="footer-cta" onClick={onPrototype}>
              Open the prototype <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="footer-links">
            <div>
              <strong>Explore</strong>
              <a href="#platform">How it works</a>
              <a href="#workflows">Connected workflows</a>
              <a href="#about">About EduRecover</a>
            </div>
            <div>
              <strong>For people</strong>
              <a href="#roles">Students</a>
              <a href="#roles">Faculty & mentors</a>
              <a href="#roles">Institutions</a>
            </div>
            <div>
              <strong>Trust center</strong>
              <a href="#platform">Human oversight</a>
              <a href="#platform">Responsible practice</a>
              <a href="#platform">Privacy & security</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 EduRecover · Academic recovery, made actionable.</span>
          <div className="footer-legal">
            <a href="#platform">Privacy</a>
            <a href="#platform">Terms</a>
            <span className="footer-socials">
              <a href="#about" aria-label="Email EduRecover">
                <Mail size={15} />
              </a>
              <a href="#about" aria-label="EduRecover community">
                <MessageCircle size={15} />
              </a>
              <a href="#about" aria-label="EduRecover website">
                <Globe size={15} />
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
