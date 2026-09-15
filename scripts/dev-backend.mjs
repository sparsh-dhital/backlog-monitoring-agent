// Starts the FastAPI backend for local development with whichever Python is
// available: the project's virtualenv when one exists, otherwise the system one.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
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

const server = spawn(
  python,
  ["-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
  {
    cwd: backendDir,
    stdio: "inherit",
    env: { ...process.env, DEMO_LOGIN_ENABLED: "true" },
  },
);

server.on("error", (error) => {
  console.error(`Could not start the backend with "${python}": ${error.message}`);
  console.error("Install Python 3.12, then run: pip install -r backend/requirements.txt");
  process.exit(1);
});
server.on("exit", (code) => process.exit(code ?? 0));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
