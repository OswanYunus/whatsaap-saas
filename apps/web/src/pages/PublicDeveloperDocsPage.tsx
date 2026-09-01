import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle, Code2, Copy, MessageCircle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Code2 size={15} />
          {title}
        </div>
        <button
          onClick={copy}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          title="Copy code"
        >
          {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-700">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 border-b border-slate-200 py-10 last:border-b-0">
      <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
      <div className="mt-5 space-y-5 text-[15px] leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

const sendExample = `curl -X POST "https://wa.tukonectdigital.co.ke/api/v1/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: wak_your_api_key" \\
  -d "{\\"recipient\\":\\"254712345678\\",\\"message\\":\\"Your booking has been confirmed.\\"}"`;

const scheduleExample = `curl -X POST "https://wa.tukonectdigital.co.ke/api/v1/messages/schedule" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: wak_your_api_key" \\
  -d "{\\"recipient\\":\\"254712345678\\",\\"message\\":\\"Your WiFi package expires tomorrow.\\",\\"scheduledAt\\":\\"2026-09-20T08:00:00Z\\"}"`;

const campaignExample = `{
  "name": "Monthly WiFi Renewal Notice",
  "message": "Hello {{name}}, your WiFi package expires soon.",
  "audience": {
    "type": "GROUP",
    "groupName": "WiFi Customers"
  },
  "scheduledAt": "2026-09-30T08:00:00Z",
  "footerEnabled": true
}`;

const javascriptExample = `const response = await fetch("https://wa.tukonectdigital.co.ke/api/v1/messages/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.CEREBRO_API_KEY
  },
  body: JSON.stringify({
    recipient: "254712345678",
    message: "Hello from the hotel system."
  })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error?.message || "Cerebro API request failed");
}

console.log(data);`;

const pythonExample = `import os
import requests

response = requests.post(
    "https://wa.tukonectdigital.co.ke/api/v1/messages/send",
    headers={"X-API-Key": os.environ["CEREBRO_API_KEY"]},
    json={
        "recipient": "254712345678",
        "message": "Your booking has been confirmed.",
    },
    timeout=30,
)

data = response.json()

if not response.ok:
    raise Exception(data.get("error", {}).get("message", "Cerebro API request failed"))

print(data)`;

const phpExample = `<?php

$apiKey = getenv("CEREBRO_API_KEY");

$payload = json_encode([
    "recipient" => "254712345678",
    "message" => "Your service is due for renewal."
]);

$ch = curl_init("https://wa.tukonectdigital.co.ke/api/v1/messages/send");

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-API-Key: " . $apiKey
    ],
    CURLOPT_POSTFIELDS => $payload
]);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($status >= 400) {
    throw new Exception($result);
}

echo $result;`;

const laravelExample = `use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    "X-API-Key" => env("CEREBRO_API_KEY"),
])->post("https://wa.tukonectdigital.co.ke/api/v1/messages/schedule", [
    "recipient" => "254712345678",
    "message" => "Your WiFi subscription expires tomorrow.",
    "scheduledAt" => "2026-09-20T08:00:00Z",
]);

if ($response->failed()) {
    throw new Exception($response->json("error.message") ?? "Cerebro API failed");
}

return $response->json();`;

export default function PublicDeveloperDocsPage() {
  const nav = useMemo(() => [
    ["overview", "Overview"],
    ["requirements", "Requirements"],
    ["keys", "API keys"],
    ["first-test", "First test"],
    ["messages", "Messages"],
    ["scheduling", "Scheduling"],
    ["campaigns", "Campaigns"],
    ["languages", "Code examples"],
    ["errors", "Errors"],
    ["handoff", "Developer handoff"]
  ], []);

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <MessageCircle size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-950">Cerebro</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">Developer API</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
              <BookOpen size={16} />
              Contents
            </div>
            <nav className="space-y-1">
              {nav.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
              Customers can read this page without logging in. API keys are still created only inside a logged-in Cerebro workspace.
            </div>
          </div>
        </aside>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eefcf6)] px-6 py-10 sm:px-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              Public integration guide
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950">
              Integrate external systems with Cerebro WhatsApp messaging
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
              This documentation explains how a customer system can send immediate messages, schedule future messages, and create campaigns through Cerebro. It is written for developers connecting hotel systems, CRMs, ERPs, ISP billing systems, POS tools, and custom business software.
            </p>
          </div>

          <div className="px-6 sm:px-10">
            <Section id="overview" title="Overview">
              <p>
                The Developer API allows an external system to ask Cerebro to send WhatsApp messages. The external system does not connect to WhatsApp directly. Cerebro owns the WhatsApp connection, validates the customer workspace, checks the subscription package, queues the message, sends it through the connected WhatsApp instance, and records delivery status.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["External system", "Booking, billing, CRM, ERP, POS, or hotel software."],
                  ["Cerebro API", "Receives the request, checks the key, and queues delivery."],
                  ["WhatsApp customer", "Receives the message from the connected business number."]
                ].map(([title, text]) => (
                  <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-950">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="requirements" title="Requirements before integration">
              <p>Before a developer can test successfully, the customer needs these items ready inside Cerebro.</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>A Cerebro account and workspace.</li>
                <li>An active Basic, Premium, or Pro subscription. Admins may also grant a package manually for testing.</li>
                <li>A connected WhatsApp instance in the workspace.</li>
                <li>An active Developer API key.</li>
                <li>A valid recipient phone number in international format, for example <code>254712345678</code>.</li>
              </ol>
              <p>
                If the workspace has no package, API sends fail with <code>PAYMENT_REQUIRED</code>. If no WhatsApp instance is connected, API sends fail with <code>NO_CONNECTED_INSTANCE</code>.
              </p>
            </Section>

            <Section id="keys" title="How to get an API key">
              <p>API keys are created inside the logged-in Cerebro dashboard. The key belongs to one workspace and cannot access another customer's workspace.</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Log in to Cerebro.</li>
                <li>Open <strong>Developer API</strong> from the sidebar.</li>
                <li>Enter a key name, such as <code>Hotel System Test</code>.</li>
                <li>Click <strong>Generate API Key</strong>.</li>
                <li>Copy the key immediately. It will not be shown again.</li>
                <li>Store the key in the external system's backend environment variables.</li>
              </ol>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Never place the API key in browser JavaScript, public HTML, or a public GitHub repository. Treat it like a password.
              </div>
            </Section>

            <Section id="first-test" title="First test request">
              <p>Start with the health check, then send one message to a test recipient.</p>
              <CodeBlock title="Health check" code={`curl "https://wa.tukonectdigital.co.ke/api/v1/health"`} />
              <CodeBlock title="Send one test message" code={sendExample} />
              <p>A successful send returns <code>202 Accepted</code> and a message ID. Keep that ID if you want to check delivery status later.</p>
            </Section>

            <Section id="messages" title="Immediate messages">
              <p>Use immediate messages when the external system needs to send something now, such as a booking confirmation, payment receipt, service alert, or check-in message.</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-sm text-slate-800">POST https://wa.tukonectdigital.co.ke/api/v1/messages/send</div>
              </div>
              <CodeBlock title="Request body" code={`{
  "recipient": "254712345678",
  "message": "Hello, your booking has been confirmed."
}`} />
              <CodeBlock title="Successful response" code={`{
  "id": "msg_abc123",
  "status": "QUEUED",
  "recipient": "254712345678"
}`} />
            </Section>

            <Section id="scheduling" title="Scheduled messages">
              <p>Use scheduled messages when the external system already knows when the message should be sent. A hotel system can schedule check-in reminders. An ISP billing system can schedule renewal notices. A service system can schedule monthly follow-ups.</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-sm text-slate-800">POST https://wa.tukonectdigital.co.ke/api/v1/messages/schedule</div>
              </div>
              <CodeBlock title="Schedule request" code={scheduleExample} />
              <p>
                The <code>scheduledAt</code> value must be a future ISO date. Use UTC in the API request. If the customer thinks in Kenya time, the customer system should convert the time before sending.
              </p>
            </Section>

            <Section id="campaigns" title="Campaigns and recurring reminders">
              <p>
                Use campaigns when Cerebro should send to contacts already stored in the workspace. A campaign can target all contacts, one group, selected tags, or a manual list of contact IDs. Campaigns can also be scheduled.
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-sm text-slate-800">POST https://wa.tukonectdigital.co.ke/api/v1/campaigns</div>
              </div>
              <CodeBlock title="Campaign request" code={campaignExample} />
              <p>Audience types supported by the API are <code>ALL</code>, <code>GROUP</code>, <code>TAGS</code>, and <code>MANUAL</code>.</p>
              <CodeBlock title="Recurring campaign request" code={`{
  "name": "Monthly WiFi Reminder",
  "message": "Hello {{name}}, your WiFi subscription is due for renewal.",
  "audience": {
    "type": "TAGS",
    "tags": ["wifi"]
  },
  "recurring": {
    "cronExpression": "0 8 1 * *",
    "timezone": "Africa/Nairobi"
  },
  "footerEnabled": true
}`} />
            </Section>

            <Section id="languages" title="Language examples">
              <p>The API works with any language that can make HTTPS requests. The most common examples are below.</p>
              <div className="grid gap-5">
                <CodeBlock title="JavaScript" code={javascriptExample} />
                <CodeBlock title="Python" code={pythonExample} />
                <CodeBlock title="PHP cURL" code={phpExample} />
                <CodeBlock title="Laravel" code={laravelExample} />
              </div>
            </Section>

            <Section id="errors" title="Common errors">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Code</th>
                      <th className="px-4 py-3 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="px-4 py-3">401</td><td className="px-4 py-3 font-mono">MISSING_API_KEY</td><td className="px-4 py-3">The request did not include an API key.</td></tr>
                    <tr><td className="px-4 py-3">401</td><td className="px-4 py-3 font-mono">INVALID_API_KEY</td><td className="px-4 py-3">The key is wrong, expired, or revoked.</td></tr>
                    <tr><td className="px-4 py-3">402</td><td className="px-4 py-3 font-mono">PAYMENT_REQUIRED</td><td className="px-4 py-3">The workspace does not have an active package.</td></tr>
                    <tr><td className="px-4 py-3">429</td><td className="px-4 py-3 font-mono">RATE_LIMIT_EXCEEDED</td><td className="px-4 py-3">The key exceeded 100 requests per minute.</td></tr>
                    <tr><td className="px-4 py-3">503</td><td className="px-4 py-3 font-mono">NO_CONNECTED_INSTANCE</td><td className="px-4 py-3">No WhatsApp number is connected in the workspace.</td></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="handoff" title="Developer handoff checklist">
              <p>Send the customer developer these items when they are ready to integrate.</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>The public documentation link: <code>https://wa.tukonectdigital.co.ke/developer-docs</code>.</li>
                <li>The base URL: <code>https://wa.tukonectdigital.co.ke/api/v1</code>.</li>
                <li>The API key generated inside the customer's Cerebro workspace.</li>
                <li>The test recipient phone number.</li>
                <li>Confirmation that the workspace has an active package.</li>
                <li>Confirmation that the WhatsApp sender number is connected in Cerebro.</li>
              </ol>
              <p>Do not send VPS credentials, database credentials, or the full source code for a normal API integration.</p>
            </Section>
          </div>
        </article>
      </main>
    </div>
  );
}
