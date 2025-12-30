import React, { useMemo, useState } from "react";
import type { CrisisProtocol, CrisisCategory } from "../types";

const PROTOCOLS: CrisisProtocol[] = [
  // Immediate Safety
  {
    id: "eap-evac",
    title: "Emergency Action Plan: Evacuation",
    category: "Immediate Safety",
    whenToUse: "Fire alarm, smoke, structural risk, or instructed evacuation.",
    steps: [
      "Stop non-essential activity; assess immediate danger.",
      "Activate alarm / follow site alarm instructions.",
      "Use nearest safe exit; do not use lifts.",
      "Assist vulnerable persons using PEEP if applicable.",
      "Go to assembly point; report hazards and missing persons.",
      "Do not re-enter until authorised."
    ],
  },
  {
    id: "eap-lockdown",
    title: "Lockdown (CLOSE-style)",
    category: "Immediate Safety",
    whenToUse: "Threat nearby or on-site; instructed lockdown.",
    steps: [
      "Close doors/windows; lock if possible.",
      "Lights off; stay low/out of sight.",
      "Silence phones; no one opens doors.",
      "Account for people; report concerns via safe channel.",
      "Wait for verified ‘all clear’."
    ],
  },
  {
    id: "eap-shelter",
    title: "Shelter-in-Place",
    category: "Immediate Safety",
    whenToUse: "External threat, severe weather, police incident, air quality hazard.",
    steps: [
      "Move to safest internal area; away from glass.",
      "Close windows/doors; reduce ventilation if advised.",
      "Headcount; identify vulnerable persons.",
      "Monitor official updates; avoid rumours.",
      "Remain until instructed otherwise."
    ],
  },
  {
    id: "eap-missing-person",
    title: "Missing Person / Vulnerable Adult",
    category: "Immediate Safety",
    whenToUse: "A vulnerable person unaccounted for, missing from ward/site/home setting.",
    steps: [
      "Confirm last known location/time; check sign-in/out.",
      "Search immediate environment and likely areas.",
      "Escalate per policy (security/site lead/police as appropriate).",
      "Preserve relevant CCTV/access logs where applicable.",
      "Document timeline and actions taken."
    ],
  },

  // Mental Health
  {
    id: "mh-suicide",
    title: "Suicide / Self-Harm Threat",
    category: "Mental Health",
    whenToUse: "Intent/plan/means disclosed; severe distress; imminent risk indicators.",
    steps: [
      "Stay present; calm, non-judgmental.",
      "Ask directly about intent, plan, means, timeframe.",
      "If imminent: do not leave alone; contact crisis team/999 as appropriate.",
      "Remove means if safe; ensure safe environment.",
      "Document: what was said/observed and actions taken."
    ],
    notes: ["Avoid dismissive language. Focus on safety and escalation if you’re not clinically trained."]
  },
  {
    id: "mh-panic",
    title: "Acute Panic / Severe Anxiety Episode",
    category: "Mental Health",
    whenToUse: "Hyperventilation, overwhelm, shaking, fear spike.",
    steps: [
      "Reduce stimulation; move to quieter place if possible.",
      "Coach breathing: inhale 4, hold 2, exhale 6.",
      "Grounding 5-4-3-2-1 (senses).",
      "Validate emotion; encourage hydration if appropriate.",
      "If chest pain/collapse/prolonged symptoms: seek medical support."
    ],
  },
  {
    id: "mh-psychosis",
    title: "Acute Psychosis / Paranoia (De-escalation)",
    category: "Mental Health",
    whenToUse: "Hallucinations/delusions causing distress or risk.",
    steps: [
      "Keep voice calm; give space; remove audience if possible.",
      "Do not argue about beliefs; validate feelings instead.",
      "Offer simple choices; keep instructions short.",
      "Assess risk to self/others; call for trained help.",
      "Document behaviours and triggers observed."
    ],
  },
  {
    id: "mh-agitation",
    title: "Agitation / Aggression (Unarmed)",
    category: "Mental Health",
    whenToUse: "Escalating anger, shouting, threatening gestures.",
    steps: [
      "Maintain safe distance and exit route.",
      "Use calm tone; avoid confrontation; set boundaries.",
      "Remove triggers; reduce crowd; call support early.",
      "If risk increases: initiate security response.",
      "After: debrief, document, update safety plan."
    ],
  },

  // Clinical
  {
    id: "clinical-bls",
    title: "Cardiac Arrest (Basic Life Support)",
    category: "Clinical",
    whenToUse: "Unresponsive and not breathing normally.",
    steps: [
      "Call emergency response; get AED.",
      "Start compressions (100–120/min).",
      "Use AED as soon as available; follow prompts.",
      "Continue cycles until help arrives."
    ],
  },
  {
    id: "clinical-stroke",
    title: "Suspected Stroke (FAST)",
    category: "Clinical",
    whenToUse: "Face droop, arm weakness, speech difficulty, sudden onset.",
    steps: [
      "FAST screen immediately.",
      "Call emergency response / 999.",
      "Record time last known well.",
      "Keep safe, no food/drink.",
      "Rapid handover."
    ],
  },
  {
    id: "clinical-anaphylaxis",
    title: "Anaphylaxis",
    category: "Clinical",
    whenToUse: "Breathing issues, swelling, collapse after allergen exposure.",
    steps: [
      "Call emergency response / 999.",
      "Administer IM adrenaline if trained/available.",
      "Position: lie flat with legs raised unless breathing compromised.",
      "Monitor; be ready to repeat per guidance.",
      "Handover to clinical care."
    ],
  },
  {
    id: "clinical-sepsis",
    title: "Suspected Sepsis (First Hour)",
    category: "Clinical",
    whenToUse: "Deterioration + infection signs (fever/low temp, tachy, confusion).",
    steps: [
      "Escalate urgently; follow local sepsis pathway.",
      "Record observations; start monitoring.",
      "Prepare for cultures, antibiotics, fluids per policy.",
      "Document time of recognition and actions."
    ],
  },
  {
    id: "clinical-bleed",
    title: "Major Bleeding / Haemorrhage",
    category: "Clinical",
    whenToUse: "Uncontrolled bleeding, shock signs.",
    steps: [
      "Apply direct pressure; elevate if appropriate.",
      "Use dressings/tourniquet if trained.",
      "Call emergency response.",
      "Keep warm; monitor breathing/awareness.",
      "Document and handover."
    ],
  },

  // Security
  {
    id: "security-intruder",
    title: "Armed Intruder / Active Threat (Run/Hide/Tell)",
    category: "Security",
    whenToUse: "Weapon seen, credible threat, active violence.",
    steps: [
      "Run if safe; get out; keep hands visible.",
      "Hide if you can’t escape; lock/barricade; silence phones.",
      "Tell authorities when safe; share location/details.",
      "Do not open doors until verified by authorities."
    ],
  },
  {
    id: "security-bomb",
    title: "Bomb Threat / Suspicious Package",
    category: "Security",
    whenToUse: "Threat call/message or suspicious item discovered.",
    steps: [
      "Do not touch item; clear immediate area calmly.",
      "Notify security/management; call police per policy.",
      "Record threat details: time, wording, caller ID, background noise.",
      "Follow cordon/evacuation instructions."
    ],
  },
  {
    id: "security-hostage",
    title: "Hostage Situation (Contain & Escalate)",
    category: "Security",
    whenToUse: "Person held against will; credible hostage threat.",
    steps: [
      "Do not intervene physically.",
      "Alert police/security immediately (quietly if possible).",
      "Contain the area; keep others away.",
      "Follow police instructions; provide building access info.",
      "Document and support aftercare."
    ],
  },

  // Fire / HazMat
  {
    id: "fire-race",
    title: "Fire Response (RACE)",
    category: "Fire / HazMat",
    whenToUse: "Fire/smoke detected.",
    steps: [
      "Rescue if safe.",
      "Alarm.",
      "Contain (close doors).",
      "Extinguish/Evacuate (only if trained)."
    ],
  },
  {
    id: "hazmat-spill",
    title: "Hazardous Spill / Chemical Release",
    category: "Fire / HazMat",
    whenToUse: "Unknown substance spill, fumes, exposure risk.",
    steps: [
      "Isolate area; keep people away.",
      "Do not clean unless trained with PPE.",
      "Notify site lead; consult COSHH/SDS if available.",
      "If exposure: rinse/flush; seek medical assessment.",
      "Document incident."
    ],
  },
  {
    id: "fire-gas",
    title: "Gas Leak",
    category: "Fire / HazMat",
    whenToUse: "Smell of gas, alarms, suspected leak.",
    steps: [
      "Do not use switches; avoid ignition sources.",
      "Ventilate if safe; evacuate area.",
      "Call emergency services and gas provider per local guidance.",
      "Account for people; do not re-enter until cleared."
    ],
  },

  // Cyber / Data
  {
    id: "cyber-incident",
    title: "Cybersecurity Incident (Containment First)",
    category: "Cyber / Data",
    whenToUse: "Ransomware signs, suspicious login, data leak indicators.",
    steps: [
      "Disconnect affected device from network.",
      "Preserve evidence; don’t wipe logs.",
      "Notify IT/Security via out-of-band channel if possible.",
      "Record timeline and actions.",
      "Follow IR plan for restoration and legal notification."
    ],
  },
  {
    id: "cyber-phishing",
    title: "Phishing / Credential Compromise",
    category: "Cyber / Data",
    whenToUse: "Suspicious link, password entered, unusual MFA prompts.",
    steps: [
      "Report to IT/Security immediately.",
      "Change password using known-good device.",
      "Revoke sessions/tokens if possible.",
      "Monitor accounts for unusual activity.",
      "Document what was clicked/sent."
    ],
  },

  // Operational
  {
    id: "ops-utility",
    title: "Utility Failure / Power Outage",
    category: "Operational",
    whenToUse: "Power loss, water outage, heating failure affecting service delivery.",
    steps: [
      "Assess immediate safety; stop hazardous processes.",
      "Activate backups if available.",
      "Switch to manual processes for critical services.",
      "Communicate status to staff/leadership.",
      "Document impacts and recovery steps."
    ],
  },
  {
    id: "ops-capacity",
    title: "Operational Pressure / Capacity Surge",
    category: "Operational",
    whenToUse: "Sustained overload, unsafe staffing/capacity pressure.",
    steps: [
      "Escalate to duty lead; initiate surge plan.",
      "Prioritise critical work; pause non-essential activity per policy.",
      "Deploy additional staff/resources if available.",
      "Communicate service impact and updated SLAs.",
      "Document decisions and safety mitigations."
    ],
  },

  // Communication
  {
    id: "comms-holding",
    title: "Crisis Communication: Holding Statement",
    category: "Communication",
    whenToUse: "Incident has public impact; need fast acknowledgement while facts develop.",
    steps: [
      "Acknowledge quickly; avoid speculation.",
      "State what actions are underway.",
      "Set next update timeframe.",
      "Single spokesperson; consistent message across channels.",
      "Log what was said and when."
    ],
  },
  {
    id: "comms-family",
    title: "Family Notification (Sensitive Incident)",
    category: "Communication",
    whenToUse: "Serious incident requires notifying family/next-of-kin.",
    steps: [
      "Confirm facts; agree spokesperson and message.",
      "Contact promptly; use calm, compassionate tone.",
      "Share what is known, what is not, and next steps.",
      "Offer support resources and follow-up time.",
      "Document communication and outcomes."
    ],
  },
];

const CATS: CrisisCategory[] = [
  "Immediate Safety",
  "Mental Health",
  "Clinical",
  "Security",
  "Fire / HazMat",
  "Cyber / Data",
  "Operational",
  "Communication",
];

export default function CrisisProtocols({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CrisisCategory | "ALL">("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PROTOCOLS.filter((p) => {
      if (cat !== "ALL" && p.category !== cat) return false;
      if (!query) return true;
      const notesText = Array.isArray(p.notes) ? p.notes.join(" ") : (p.notes || "");
      const blob = `${p.title} ${p.whenToUse} ${p.category} ${p.steps.join(" ")} ${notesText}`.toLowerCase();
      return blob.includes(query);
    });
  }, [q, cat]);

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar nav-safe">
      <div className="p-4 pt-12 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-800">Crisis Protocols</h1>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (e.g. fire, suicide, phishing)…"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          />

          <div className="flex gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setCat("ALL")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${
                cat === "ALL" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              ALL
            </button>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${
                  cat === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar pb-40">
        {filtered.length === 0 && <div className="text-center text-slate-400 py-10">No matches.</div>}

        {filtered.map((p) => {
          const open = openId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-3xl border border-slate-200 p-4">
              <button className="w-full text-left" onClick={() => setOpenId(open ? null : p.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-500">{p.category}</div>
                    <div className="text-base font-extrabold text-slate-800">{p.title}</div>
                    <div className="mt-1 text-xs text-slate-600">{p.whenToUse}</div>
                  </div>
                  <div className="text-xs font-bold text-indigo-600">{open ? "Hide" : "Open"}</div>
                </div>
              </button>

              {open && (
                <div className="mt-3">
                  <div className="text-xs font-extrabold text-slate-700 mb-2">Steps</div>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                    {p.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>


                  {p.notes && (Array.isArray(p.notes) ? p.notes.length : p.notes.trim().length) ? (
                    <>
                      <div className="text-xs font-extrabold text-slate-700 mt-4 mb-2">Notes</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                        {(Array.isArray(p.notes) ? p.notes : [p.notes]).map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
