import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

export default function Layout({ children, role = "user", title, subtitle }) {
  return (
    <div className="appLayout">
      <Sidebar role={role} />
      <main className="mainContent">
        <header className="pageHeader">
          <div>
            <p className="eyebrow">PWDConnect PH</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <ThemeToggle />
        </header>
        {children}
      </main>
    </div>
  );
}
