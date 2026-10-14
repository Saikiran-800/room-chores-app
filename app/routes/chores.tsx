import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { actionError, api, loaderFailure } from "~/lib/api.server";
import type { Chore } from "~/lib/types";
import { FREQUENCIES, SKILLS } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Room Chores · Chores" }];

export async function loader(_args: LoaderFunctionArgs) {
  try {
    const chores = await api<Chore[]>("/api/chores?includeDisabled=true");
    return json({ chores });
  } catch (error) {
    return loaderFailure(error);
  }
}

function codeFromName(name: string): string {
  return (
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "CHORE"
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const text = (key: string) => String(form.get(key) ?? "").trim();

  try {
    if (intent === "create") {
      const name = text("name");
      await api("/api/chores", {
        method: "POST",
        body: {
          code: codeFromName(name),
          name,
          category: text("category") || "General",
          points: Number(text("points") || 1),
          estimatedMinutes: Number(text("estimatedMinutes") || 10),
          frequency: text("frequency") || "AS_NEEDED",
          requiredSkill: text("requiredSkill") || null,
          location: text("location") || null,
        },
      });
      return json({ ok: `Added "${name}".` });
    }

    if (intent === "toggle") {
      const code = text("code");
      const action = text("enable") === "true" ? "enable" : "disable";
      await api(`/api/chores/${encodeURIComponent(code)}/${action}`, { method: "POST" });
      return json({ ok: `${action === "enable" ? "Enabled" : "Disabled"} ${code}.` });
    }

    if (intent === "points") {
      const code = text("code");
      const chores = await api<Chore[]>("/api/chores?includeDisabled=true");
      const chore = chores.find((c) => c.code === code);
      if (!chore) return json({ error: "Chore not found." }, { status: 404 });
      await api(`/api/chores/${encodeURIComponent(code)}`, {
        method: "PUT",
        body: { ...chore, points: Number(text("points")) },
      });
      return json({ ok: `Updated points for ${chore.name}.` });
    }

    return json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return actionError(error);
  }
}

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  AS_NEEDED: "As needed",
};

export default function Chores() {
  const { chores } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  const byCategory = new Map<string, Chore[]>();
  for (const chore of chores) {
    const list = byCategory.get(chore.category) ?? [];
    list.push(chore);
    byCategory.set(chore.category, list);
  }

  return (
    <>
      <h1>Chore catalog</h1>
      <p className="muted">
        Points describe the effort of one completion. Adjust them after a few weeks of real use — that's the
        calibration step.
      </p>

      {result && "ok" in result && <div className="notice ok">{result.ok}</div>}
      {result && "error" in result && <div className="notice err">{result.error}</div>}

      <details className="card">
        <summary>
          <strong>Add a chore</strong>
        </summary>
        <Form method="post" className="row" style={{ marginTop: 12 }}>
          <input name="name" placeholder="Name" required />
          <input name="category" placeholder="Category" list="categories" />
          <datalist id="categories">
            {[...byCategory.keys()].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <label>
            Pts <input type="number" name="points" min={1} max={10} defaultValue={2} required />
          </label>
          <label>
            Min <input type="number" name="estimatedMinutes" min={1} defaultValue={10} />
          </label>
          <select name="frequency" defaultValue="AS_NEEDED">
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </select>
          <select name="requiredSkill" defaultValue="">
            <option value="">No skill needed</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                Needs {s}
              </option>
            ))}
          </select>
          <input name="location" placeholder="Location" />
          <button className="primary" name="intent" value="create">
            Add
          </button>
        </Form>
      </details>

      {[...byCategory.entries()].map(([category, list]) => (
        <section key={category} className="card">
          <h2>{category}</h2>
          <table>
            <thead>
              <tr>
                <th>Chore</th>
                <th>Points</th>
                <th>Time</th>
                <th>How often</th>
                <th>Skill</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((chore) => (
                <tr key={chore.code} className={chore.enabled ? "" : "off"}>
                  <td>
                    {chore.name}
                    <div className="muted">{chore.location ?? ""}</div>
                  </td>
                  <td>
                    <Form method="post" className="inline">
                      <input type="hidden" name="code" value={chore.code} />
                      <input type="number" name="points" min={1} max={10} defaultValue={chore.points} aria-label="Points" />
                      <button className="small" name="intent" value="points">
                        Save
                      </button>
                    </Form>
                  </td>
                  <td>{chore.estimatedMinutes} min</td>
                  <td>{FREQUENCY_LABEL[chore.frequency]}</td>
                  <td>{chore.requiredSkill ? <span className="pill warn">{chore.requiredSkill}</span> : "—"}</td>
                  <td>
                    <Form method="post" className="inline">
                      <input type="hidden" name="code" value={chore.code} />
                      <input type="hidden" name="enable" value={String(!chore.enabled)} />
                      <button className="small" name="intent" value="toggle">
                        {chore.enabled ? "Disable" : "Enable"}
                      </button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
