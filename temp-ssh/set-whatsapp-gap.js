const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();
async function run() {
  await ssh.connect({ host: "178.162.240.231", username: "root", password: "hGrA6wXBgdgE3kFD", readyTimeout: 20000 });
  const envPath = "/opt/whatsapp-saas/.env";
  const current = await ssh.execCommand(`cat ${envPath}`);
  const lines = current.stdout.split(/\r?\n/).filter(Boolean);
  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith("WHATSAPP_SEND_GAP_MS=")) {
      found = true;
      return "WHATSAPP_SEND_GAP_MS=10000";
    }
    return line;
  });
  if (!found) next.push("WHATSAPP_SEND_GAP_MS=10000");
  const temp = `/tmp/cerebro-env-gap-${Date.now()}`;
  await ssh.execCommand(`cat > ${temp} <<'EOF'\n${next.join("\n")}\nEOF`);
  for (const cmd of [
    `install -m 600 ${temp} ${envPath} && rm -f ${temp}`,
    "pm2 restart all --update-env",
    "pm2 save",
    "curl -fsS https://wa.tukonectdigital.co.ke/health"
  ]) {
    const result = await ssh.execCommand(cmd, { cwd: "/opt/whatsapp-saas" });
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    if (result.code !== 0) throw new Error(cmd);
  }
  console.log("WHATSAPP_SEND_GAP_MS set to 10000.");
}
run().catch((err)=>{ console.error(err); process.exitCode=1; }).finally(()=>ssh.dispose());
