const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

async function exec(command) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: "/opt/whatsapp-saas" });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return result;
}

async function run() {
  await ssh.connect({
    host: "178.162.240.231",
    username: "root",
    password: "hGrA6wXBgdgE3kFD",
    readyTimeout: 20000
  });

  console.log("Connected. Checking SSL and Nginx...\n");

  console.log("=== CERTBOT CERTIFICATES ===");
  await exec("certbot certificates");

  console.log("\n=== NGINX SITE CONFIG ===");
  await exec("cat /etc/nginx/sites-available/waas-api");

  console.log("\n=== NGINX CONFIG TEST ===");
  await exec("nginx -t");

  console.log("\nDone.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
