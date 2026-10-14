import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import type { ReactNode } from "react";
import styles from "~/styles.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">🧹 Room Chores</span>
        <nav>
          <NavLink to="/" end>
            Fairness
          </NavLink>
          <NavLink to="/assignments">Assignments</NavLink>
          <NavLink to="/chores">Chores</NavLink>
          <NavLink to="/roommates">Roommates</NavLink>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Something went wrong.";
  if (isRouteErrorResponse(error)) {
    const data = error.data as { message?: string } | string | undefined;
    message =
      (typeof data === "object" && data?.message) ||
      (typeof data === "string" && data) ||
      `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }
  return (
    <Shell>
      <section className="card error-card">
        <h2>Couldn't load this page</h2>
        <p>{message}</p>
        <p className="muted">
          The API is expected at <code>API_URL</code> (default <code>http://localhost:8080</code>).
        </p>
      </section>
    </Shell>
  );
}
