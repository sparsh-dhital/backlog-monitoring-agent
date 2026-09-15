// Starts the FastAPI backend for local development with whichever Python is
// available: the project's virtualenv when one exists, otherwise the system one.
//
// It restarts the API itself when a .py file changes instead of using
// uvicorn --reload: on Windows that reloader can hang halfway through a restart
// and keep serving the old code, so new routes answer "Not Found".
import { spawn, spawnSync } from "node:child_process";
import { existsSync, statSync, watch } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..", "backend");
const venvPython = ["venv", ".venv"]
  .map((folder) =>
    join(
      backendDir,
      folder,
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    ),
  )
  .find((candidate) => existsSync(candidate));
const python = venvPython ?? (process.platform === "win32" ? "python" : "python3");
const args = ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"];

let server = null;
let restarting = false;
let stopping = false;

function start() {
  server = spawn(python, args, {
    cwd: backendDir,
    stdio: "inherit",
    env: { ...process.env, DEMO_LOGIN_ENABLED: "true", PYTHONUNBUFFERED: "1" },
  });
  server.on("error", (error) => {
    console.error(`Could not start the backend with "${python}": ${error.message}`);
    console.error("Install Python 3.12, then run: pip install -r backend/requirements.txt");
    process.exit(1);
  });
  server.on("exit", (code) => {
    server = null;
    if (stopping) return;
    if (restarting) {
      restarting = false;
      start();
      return;
    }
    // Like uvicorn's reloader, stay up so fixing the file brings the API back.
    console.error(
      `[dev-backend] The API stopped (exit code ${code}). Save a backend file to restart it.` +
        " If port 8000 is already in use, stop the other backend first.",
    );
  });
}

function stopServer() {
  if (!server) return;
  if (process.platform === "win32") {
    // Kill the whole tree; a signal alone does not reliably stop uvicorn here.
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
  } else {
    server.kill("SIGTERM");
  }
}

// Windows reports watch events when a file is merely read (Python imports,
// antivirus, editor tooling), so only a newer modification time counts.
const startedAt = Date.now();
const lastModified = new Map();

function modifiedSinceLastSeen(file) {
  const fullPath = join(backendDir, file);
  let modified;
  try {
    modified = statSync(fullPath).mtimeMs;
  } catch {
    return true; // Deleted or renamed: the code did change.
  }
  const previous = lastModified.get(fullPath) ?? startedAt;
  lastModified.set(fullPath, Math.max(modified, previous));
  return modified > previous;
}

let restartTimer;
let changedFile = "";
watch(backendDir, { recursive: true }, (_event, file) => {
  if (!file || !file.endsWith(".py") || /(^|[\\/])(venv|\.venv|__pycache__)[\\/]/.test(file)) {
    return;
  }
  if (!modifiedSinceLastSeen(file)) return;
  changedFile = file;
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    console.log(`[dev-backend] ${changedFile} changed; restarting the API...`);
    if (server) {
      restarting = true;
      stopServer();
    } else {
      start();
    }
  }, 300);
});

start();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    stopServer();
    process.exit(0);
  });
}
