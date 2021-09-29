import { spawn, spawnSync } from "child_process";
import { unlinkSync } from "fs";
import path from "path";

import { getLang } from "../../src/parser/parseSync";

// This is somewhat similar to the spawnServer function in parseSync but
// slightly different in that it logs its information into environment variables
// so that it can be reused across the test suite.
function globalSetup() {
  // Set a RUBY_VERSION environment variable because certain tests will only run
  // for certain versions of Ruby.
  const args = ["--disable-gems", "-e", "puts RUBY_VERSION"];
  process.env.RUBY_VERSION = spawnSync("ruby", args).stdout.toString().trim();

  // Set up just one parsing server for the entirety of the test suite.
  const filepath = `/tmp/prettier-ruby-parser-${process.pid}.info`;
  const server = spawn(
    "ruby",
    [path.join(__dirname, "../../src/parser/server.rb"), filepath],
    {
      env: Object.assign({}, process.env, { LANG: getLang() }),
      detached: true,
      stdio: "inherit"
    }
  );

  // Get the connection information from the parsing server.
  const info = spawnSync("node", [
    path.join(__dirname, "../../src/parser/getInfo.js"),
    filepath
  ]);

  if (info.status !== 0) {
    throw new Error("Failed to spawn parse server.");
  }

  process.env.PRETTIER_RUBY_HOST = info.stdout.toString();
  process.env.PRETTIER_RUBY_PID = `${server.pid}`;

  unlinkSync(filepath);
  server.unref();
}

export default globalSetup;
