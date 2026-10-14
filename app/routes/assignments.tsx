import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { actionError, api, loaderFailure } from "~/lib/api.server";
import { addDays, formatDay, todayIso } from "~/lib/dates";
import { isEligible } from "~/lib/eligibility";
import type { Assignment, GenerateResult, Roommate } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Room Chores · Assignments" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const today = todayIso();
  const from = url.searchParams.get("from") || today;
  const to = url.searchParams.get("to") || addDays(from, 6);
  try {
    const [assignments, roommates] = await Promise.all([
      api<Assignment[]>(`/api/assignments?from=${from}&to=${to}`),
      api<Roommate[]>("/api/roommates"),
    ]);
    return json({ assignments, roommates, from, to, today });
  } catch (error) {
    return loaderFailure(error);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const id = String(form.get("id") ?? "");

  try {
    switch (intent) {
      case "complete":
        await api(`/api/assignments/${id}/complete`, { method: "POST" });
        return json({ ok: "Marked as done." });
      case "miss":
        await api(`/api/assignments/${id}/miss`, { method: "POST" });
        return json({ ok: "Marked as missed." });
      case "swap":
        await api(`/api/assignments/${id}/swap`, {
          method: "POST",
          body: { roommateId: String(form.get("roommateId") ?? "") },
        });
        return json({ ok: "Swapped." });
      case "generate": {
        const date = String(form.get("date") ?? "");
        const result = await api<GenerateResult>(`/api/assignments/generate?date=${encodeURIComponent(date)}`, {
          method: "POST",
        });
        const skipped = result.skipped.length > 0 ? ` Skipped: ${result.skipped.join(", ")}.` : "";
        return json({ ok: `Created ${result.created.length} assignment(s) for ${result.date}.${skipped}` });
      }
      default:
        return json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    return actionError(error);
  }
}

function StatusPill({ assignment }: { assignment: Assignment }) {
  if (assignment.status === "COMPLETED") return <span className="pill good">done · +{assignment.pointsAwarded}</span>;
  if (assignment.status === "MISSED") return <span className="pill bad">missed</span>;
  return <span className="pill">pending</span>;
}

function AssignmentRow({ assignment, roommates }: { assignment: Assignment; roommates: Roommate[] }) {
  const swapTargets = roommates.filter((r) => r.id !== assignment.roommate.id && isEligible(r, assignment.chore));

  return (
    <tr>
      <td>
        <strong>{assignment.chore.name}</strong>
        <div className="muted">
          {assignment.chore.points} pts · ~{assignment.chore.estimatedMinutes} min
          {assignment.chore.location ? ` · ${assignment.chore.location}` : ""}
          {assignment.note ? ` · ${assignment.note}` : ""}
        </div>
      </td>
      <td>{assignment.roommate.name}</td>
      <td>
        <StatusPill assignment={assignment} />
      </td>
      <td>
        {assignment.status === "PENDING" && (
          <div className="row">
            <Form method="post" className="inline">
              <input type="hidden" name="id" value={assignment.id} />
              <button className="small primary" name="intent" value="complete">
                Done
              </button>
            </Form>
            <Form method="post" className="inline">
              <input type="hidden" name="id" value={assignment.id} />
              <button className="small danger" name="intent" value="miss">
                Missed
              </button>
            </Form>
            {swapTargets.length > 0 && (
              <Form method="post" className="inline">
                <input type="hidden" name="id" value={assignment.id} />
                <select name="roommateId" aria-label="Swap with">
                  {swapTargets.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button className="small" name="intent" value="swap">
                  Swap
                </button>
              </Form>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function Assignments() {
  const { assignments, roommates, from, to, today } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  const days = new Map<string, Assignment[]>();
  for (const assignment of assignments) {
    const list = days.get(assignment.dueDate) ?? [];
    list.push(assignment);
    days.set(assignment.dueDate, list);
  }

  return (
    <>
      <h1>Assignments</h1>
      <p className="muted">
        Showing {formatDay(from)} – {formatDay(to)}.
      </p>

      <div className="row">
        <Link to={`?from=${addDays(from, -7)}`}>← Previous week</Link>
        <Link to={`?from=${today}`}>This week</Link>
        <Link to={`?from=${addDays(from, 7)}`}>Next week →</Link>
      </div>

      {result && "ok" in result && <div className="notice ok">{result.ok}</div>}
      {result && "error" in result && <div className="notice err">{result.error}</div>}

      <section className="card">
        <h2>Generate chores</h2>
        <p className="muted">
          Assigns everything due that day (daily chores every day, weekly on Mondays, monthly on the 1st) to the
          eligible roommate who is furthest below their fair share.
        </p>
        <Form method="post" className="row">
          <input type="date" name="date" defaultValue={today} required />
          <button className="primary" name="intent" value="generate">
            Generate
          </button>
        </Form>
      </section>

      {days.size === 0 && <div className="card muted">Nothing assigned in this range yet.</div>}

      {[...days.entries()].map(([date, list]) => (
        <section key={date} className="day">
          <h2>
            {formatDay(date)}
            {date === today ? " · today" : ""}
          </h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Chore</th>
                  <th>Who</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((assignment) => (
                  <AssignmentRow key={assignment.id} assignment={assignment} roommates={roommates} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
