import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { api, loaderFailure } from "~/lib/api.server";
import { currentMonth } from "~/lib/dates";
import type { FairnessReport, RoommateFairness } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Room Chores · Fairness" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const month = new URL(request.url).searchParams.get("month") || currentMonth();
  try {
    const report = await api<FairnessReport>(`/api/fairness?month=${encodeURIComponent(month)}`);
    return json({ report });
  } catch (error) {
    return loaderFailure(error);
  }
}

function FairnessCard({ person }: { person: RoommateFairness }) {
  const percent = person.target > 0 ? Math.min(100, (person.earned / person.target) * 100) : 0;
  const onTrack = person.target > 0 && person.earned >= person.target;
  const deltaClass = person.delta >= 0 ? "good" : person.delta > -5 ? "warn" : "bad";
  const deltaLabel = `${person.delta > 0 ? "+" : ""}${person.delta} pts`;

  return (
    <article className="card">
      <div className="row spread">
        <h2>{person.name}</h2>
        <span className={`pill ${deltaClass}`}>{deltaLabel}</span>
      </div>
      <div>
        <strong>{person.earned}</strong> <span className="muted">/ {person.target} pts fair share</span>
      </div>
      <div className={`bar ${onTrack ? "over" : ""}`} role="img" aria-label={`${Math.round(percent)}% of fair share`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="muted">
        {person.assigned} pts assigned · {person.missed} missed
      </div>
    </article>
  );
}

export default function Fairness() {
  const { report } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Monthly fairness</h1>
      <p className="muted">
        Fair share is each person's capacity share of all points assigned this month. Missed chores still count as
        workload, so skipping them shows up as a negative delta.
      </p>

      <Form method="get" className="row">
        <label>
          Month <input type="month" name="month" defaultValue={report.month} />
        </label>
        <button type="submit">Show</button>
      </Form>

      {report.roommates.length === 0 ? (
        <div className="card">
          No roommates yet. <Link to="/roommates">Add roommates</Link>, then{" "}
          <Link to="/assignments">generate today's chores</Link>.
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          {report.roommates.map((person) => (
            <FairnessCard key={person.roommateId} person={person} />
          ))}
        </div>
      )}

      <p className="muted">
        Total workload for {report.month}: <strong>{report.totalWorkload}</strong> points.
      </p>
    </>
  );
}
