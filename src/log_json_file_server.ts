import { parse, } from "https://deno.land/std/flags/mod.ts";
import {
  ensureFile,
} from "https://deno.land/std/fs/mod.ts";

// I could've used https://github.com/oakserver/oak, but who
// wants to do the easy thing, right!!! ;P
import { serve, } from "https://deno.land/std/http/server.ts";
import * as log from "https://deno.land/std/log/mod.ts";

const args = parse(Deno.args);

let outputPath = `./out/${new Date().toISOString()}.json`;
let port = 8080; // Default Port;
let upload = false; // Enable uploading logs to a file;

if (args.f || args.filename) {
  outputPath = args.filename || args.f;
}

if (args.u) {
  upload = true;
}

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: logRecord => {
        let msg = `${logRecord.datetime.toISOString()} [${logRecord.levelName}]: ${logRecord.msg}`;
        return msg;
      }
    }),

    file: new log.handlers.FileHandler("DEBUG", {
      filename: "./out/log.json",
      // you can change format of output message using any keys in `LogRecord`
      formatter: logRecord => {

        let msg = '';
        if (typeof msg === 'object') {
          msg = `${JSON.stringify(logRecord.msg)}`;
        } else {
          msg = logRecord.msg;
        }
        return msg;
      }
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
    save: {
      level: "DEBUG",
      handlers: ["file"]
    }
  }
});

async function readJson(path: string): Promise<string | Array<any>> {
  try {
    await ensureFile(path);
    const text = await Deno.readTextFile(path);
    const payload: Array<any> = text.startsWith('[') ? JSON.parse(text) : [];
    return payload;
  } catch (e) {
    return e.message;
  }
}

async function appendJson(path: string, data: object): Promise<string> {
  try {
    await ensureFile(path);
    const text = await Deno.readTextFile(path);
    const payload: Array<any> = JSON.parse(text);
    payload.push(data);
    await Deno.writeTextFile(path, JSON.stringify(payload));
    return "Written to " + path;
  } catch (e) {
    return e.message;
  }
}

async function writeJson(path: string, data: object): Promise<string> {
  try {
    await ensureFile(path);
    await Deno.writeTextFile(path, JSON.stringify([data]));
    return "Written to " + path;
  } catch (e) {
    return e.message;
  }
}

if (args.port || args.p) {
  if (typeof args.port === 'number') {
    port = args.port;
  } else if (Array.isArray(args.port)) {
    port = args.port[args.port.length - 1];
  } else if (typeof args.p === 'number') {
    port = args.p;
  } else if (Array.isArray(args.p)) {
    port = args.p[args.p.length - 1];
  } else {
    log.error("Pass --port or -p as a number");
    Deno.exit(1);
  }
}

const server = serve({ port, });

log.debug(`Running Server at: http://localhost:${port}`);

const headers =  new Headers();
headers.append('Content-Type', 'application/json');

const corsHeaders =  new Headers();
corsHeaders.append('Access-Control-Allow-Origin', '*');
corsHeaders.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
corsHeaders.append('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
corsHeaders.append('Access-Control-Max-Age', '36000');
corsHeaders.append('Allow', 'GET, POST, OPTIONS');
corsHeaders.append('Content-Type', 'application/json');

let initialized = false;
for await (const req of server) {
  if (req.method.toLowerCase() === 'post' && req.url === '/' && upload) {
    const buffer = await Deno.readAll(req.body);
    const body = new TextDecoder("utf-8").decode(buffer);
    const parsed = JSON.parse(body);
    initialized ? await appendJson(outputPath, parsed) : await writeJson(outputPath, parsed);
    initialized = true;
    req.respond({
      status: 204,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'OK'
      }),
    })
  } else if (req.method.toLowerCase() === 'get' && req.url === '/') {
    req.respond({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(await readJson(outputPath)),
    });
  } else if (req.method.toLowerCase() === 'options' && req.url === '/') {
    // Enable CORS
    req.respond({
      status: 200,
      headers: corsHeaders,
    });
  } else {
    req.respond({
      status: 404,
    })
  }
}
