const { spawn } = require("child_process");
require("dotenv").config();

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const npxCommand = isWindows ? "npx.cmd" : "npx";

const children = [];

function prefixOutput(prefix, stream) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`[${prefix}] ${line}`);
      }
    }
  });
}

function run(prefix, command, args, options = {}) {
  const spawnCommand = isWindows ? "cmd.exe" : command;
  const spawnArgs = isWindows
    ? ["/d", "/s", "/c", [command, ...args].join(" ")]
    : args;

  const child = spawn(spawnCommand, spawnArgs, {
    cwd: options.cwd || __dirname,
    env: process.env,
    shell: false,
  });

  children.push(child);
  prefixOutput(prefix, child.stdout);
  prefixOutput(prefix, child.stderr);

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${prefix}] stopped by ${signal}`);
      return;
    }

    if (code !== 0 && options.exitOnFailure !== false) {
      console.log(`[${prefix}] exited with code ${code}`);
      stopAll();
      process.exit(code || 1);
    }
  });

  return child;
}

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
}

async function runOnce(prefix, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = run(prefix, command, args, {
      ...options,
      exitOnFailure: false,
    });

    child.on("exit", (code) => {
      const index = children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${prefix} failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (nodeEnv !== "development") {
    console.log(`[setup] Combined frontend/backend launcher is disabled when NODE_ENV=${nodeEnv}.`);
    console.log("[setup] Run the frontend and backend in separate terminals/screens instead.");
    console.log("[setup] frontend: npm run dev:frontend");
    console.log("[setup] backend: npm run dev:backend");
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.log("[setup] DATABASE_URL is missing.");
    console.log("[setup] create a .env file in the main project folder.");
    console.log("[setup] you can copy .env.example and update the MySQL username/password/database.");
    process.exit(1);
  }

  const requiredBackendPackages = [
    "cors",
    "csv-parse",
    "morgan",
    "mysql",
    "winston",
  ];

  const missingBackendPackages = requiredBackendPackages.filter((packageName) => {
    try {
      require.resolve(packageName);
      return false;
    } catch {
      return true;
    }
  });

  if (missingBackendPackages.length > 0) {
    console.log(`[setup] missing backend packages: ${missingBackendPackages.join(", ")}`);
    console.log("[setup] run once from the main folder: npm install");
    process.exit(1);
  }

  try {
    await runOnce("prisma", npxCommand, ["prisma", "generate"]);
  } catch (error) {
    console.log("[prisma] generate failed. Continuing because Prisma Client may already be generated.");
    console.log("[prisma] if the app fails later, run: npx prisma generate");
  }

  try {
    await runOnce("backend-prisma", npxCommand, ["prisma", "generate"], {
      cwd: `${__dirname}/server`,
    });
  } catch (error) {
    console.log("[backend-prisma] generate failed. Continuing because the backend Prisma Client may already be generated.");
    console.log("[backend-prisma] if the server fails later, run: npm --prefix server exec prisma generate");
  }

  run("backend", npmCommand, ["--prefix", "server", "start"]);
  run("frontend", npxCommand, ["next", "dev", "--turbo"]);
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

main().catch((error) => {
  console.error(`[dev] ${error.message}`);
  stopAll();
  process.exit(1);
});
