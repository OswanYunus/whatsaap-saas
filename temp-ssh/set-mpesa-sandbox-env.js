const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

const host = "178.162.240.231";
const username = "root";
const password = "hGrA6wXBgdgE3kFD";
const envPath = "/opt/whatsapp-saas/.env";

const updates = {
  MPESA_CONSUMER_KEY: "SdiKYX8qz0mMvyMGh7SlOalZgMhPTiyGiaFNrVZ9TFpTQQGs",
  MPESA_CONSUMER_SECRET: "RaUUXcK5tThfGIcVivytkZu5HtLjRAMNNJcMV6R7JCgHjQGEJg0E2JBXDkxrxgdn",
  MPESA_SHORTCODE: "174379",
  MPESA_PASSKEY: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  MPESA_CALLBACK_URL: "https://wa.tukonectdigital.co.ke/api/billing/mpesa/callback",
  MPESA_STK_PUSH_URL: "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  MPESA_OAUTH_URL: "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  MPESA_TRANSACTION_TYPE: "CustomerPayBillOnline",
  MPESA_ACCOUNT_REFERENCE: "CEREBRO",
  MPESA_TRANSACTION_DESC: "Cerebro subscription",
  MPESA_AMOUNT_OVERRIDE: "1"
};

function quote(value) {
  return JSON.stringify(value);
}

async function exec(command) {
  const result = await ssh.execCommand(command, { cwd: "/opt/whatsapp-saas" });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.code !== 0) throw new Error(`Command failed: ${command}`);
}

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  const current = await ssh.execCommand(`test -f ${envPath} && cat ${envPath} || true`);
  const lines = current.stdout.split(/\r?\n/).filter(Boolean);
  const next = [];
  const seen = new Set();

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match && Object.prototype.hasOwnProperty.call(updates, match[1])) {
      next.push(`${match[1]}=${quote(updates[match[1]])}`);
      seen.add(match[1]);
    } else {
      next.push(line);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) next.push(`${key}=${quote(value)}`);
  }

  const temp = `/tmp/cerebro-env-${Date.now()}`;
  await ssh.execCommand(`cat > ${temp} <<'EOF'\n${next.join("\n")}\nEOF`);
  await exec(`install -m 600 ${temp} ${envPath} && rm -f ${temp}`);
  await exec("pm2 restart all --update-env");
  await exec("pm2 save");
  await exec("curl -fsS https://wa.tukonectdigital.co.ke/health");
  console.log("M-Pesa sandbox env configured.");
}

run().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => ssh.dispose());
