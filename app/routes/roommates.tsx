import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { actionError, api, loaderFailure } from "~/lib/api.server";
import type { Roommate } from "~/lib/types";
import { SKILLS } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Room Chores · Roommates" }];

export async function loader(_args: LoaderFunctionArgs) {
  try {
    const roommates = await api<Roommate[]>("/api/roommates");
    return json({ roommates });
  } catch (error) {
    return loaderFailure(error);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const body = {
    name: String(form.get("name") ?? "").trim(),
    capacityPercent: Number(form.get("capacityPercent") ?? 100),
    skills: form.getAll("skills").map(String),
  };

  try {
    if (intent === "create") {
      await api("/api/roommates", { method: "POST", body });
      return json({ ok: `Added ${body.name}.` });
    }
    if (intent === "update") {
      await api(`/api/roommates/${String(form.get("id"))}`, { method: "PUT", body });
      return json({ ok: `Saved ${body.name}.` });
    }
    if (intent === "deactivate") {
      await api(`/api/roommates/${String(form.get("id"))}`, { method: "DELETE" });
      return json({ ok: "Roommate deactivated. Their past assignments are kept." });
    }
    return json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return actionError(error);
  }
}

function SkillChecks({ selected }: { selected: string[] }) {
  return (
    <>
      {SKILLS.map((skill) => (
        <label key={skill} className="check">
          <input type="checkbox" name="skills" value={skill} defaultChecked={selected.includes(skill)} /> {skill}
        </label>
      ))}
    </>
  );
}

export default function Roommates() {
  const { roommates } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  return (
    <>
      <h1>Roommates</h1>
      <p className="muted">
        Capacity scales a person's fair share: 100% is a full share, 50% means half as much work expected (limited
        availability). Skills decide who can be assigned skill-gated chores such as cooking.
      </p>

      {result && "ok" in result && <div className="notice ok">{result.ok}</div>}
      {result && "error" in result && <div className="notice err">{result.error}</div>}

      <section className="card">
        <h2>Add a roommate</h2>
        <Form method="post" className="row">
          <input name="name" placeholder="Name" required />
          <label>
            Capacity % <input type="number" name="capacityPercent" min={0} max={100} defaultValue={100} />
          </label>
          <SkillChecks selected={[]} />
          <button className="primary" name="intent" value="create">
            Add
          </button>
        </Form>
      </section>

      {roommates.length === 0 && <div className="card muted">No roommates yet.</div>}

      {roommates.map((roommate) => (
        <section key={roommate.id} className="card">
          <Form method="post" className="row">
            <input type="hidden" name="id" value={roommate.id} />
            <input name="name" defaultValue={roommate.name} required aria-label="Name" />
            <label>
              Capacity %{" "}
              <input type="number" name="capacityPercent" min={0} max={100} defaultValue={roommate.capacityPercent} />
            </label>
            <SkillChecks selected={roommate.skills} />
            <button name="intent" value="update">
              Save
            </button>
            <button className="danger" name="intent" value="deactivate">
              Deactivate
            </button>
          </Form>
        </section>
      ))}
    </>
  );
}
