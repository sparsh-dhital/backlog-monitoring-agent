import { ArrowLeft, Compass, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import "../styles/not-found.css";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <div className="not-found-orbit orbit-one" />
      <div className="not-found-orbit orbit-two" />
      <nav className="not-found-nav">
        <Link className="brand" to="/">
          <Brand />
        </Link>
        <span>Academic recovery, made actionable.</span>
      </nav>
      <section className="not-found-content">
        <div className="not-found-icon">
          <Compass size={31} />
        </div>
        <span className="not-found-code">404 · Signal not found</span>
        <h1>
          This page missed the <em>academic timeline.</em>
        </h1>
        <p>
          The address is validly formatted, but this destination does not exist
          in EduRecover yet.
        </p>
        <div className="not-found-actions">
          <Link className="primary-button" to="/">
            <Home size={16} /> Return home
          </Link>
          <button className="secondary-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </section>
    </main>
  );
}
