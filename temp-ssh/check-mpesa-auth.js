const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();
async function run() {
  await ssh.connect({ host: "178.162.240.231", username: "root", password: "hGrA6wXBgdgE3kFD", readyTimeout: 20000 });
  const cmd = `set -a && . /opt/whatsapp-saas/.env && set +a && node -e '
const auth=Buffer.from(process.env.MPESA_CONSUMER_KEY+":"+process.env.MPESA_CONSUMER_SECRET).toString("base64");
fetch(process.env.MPESA_OAUTH_URL,{headers:{Authorization:"Basic "+auth}}).then(async r=>{const j=await r.json(); console.log(JSON.stringify({ok:r.ok, hasToken:Boolean(j.access_token), error:j.error||j.errorMessage||null}));}).catch(e=>{console.log(JSON.stringify({ok:false,error:e.message})); process.exitCode=1;});
'`;
  const result = await ssh.execCommand(cmd, { cwd: "/opt/whatsapp-saas" });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.code !== 0) process.exitCode = result.code;
}
run().catch((err)=>{ console.error(err); process.exitCode=1; }).finally(()=>ssh.dispose());
