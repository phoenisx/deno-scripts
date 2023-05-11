/**
 * Inspired from:
 *    - https://github.com/Rich-Harris/degit
 *    - https://github.com/lukeed/gittar
 *
 * Currently I am focused with github templates,
 * later I might support gitlab, but never bitbucket since I never
 * use it.
 *
 * Get a new Personal Token to make this script work from here:
 *    - https://github.com/settings/tokens/new
 */
import { parse } from "https://deno.land/std@0.184.0/flags/mod.ts";
import {
   dirname,
   fromFileUrl,
   resolve,
} from "https://deno.land/std@0.186.0/path/mod.ts";
import { ensureDir, ensureFile } from "https://deno.land/std@0.186.0/fs/mod.ts";
import { Untar } from "https://deno.land/std@0.186.0/archive/untar.ts";
import {
   copy,
   readerFromStreamReader,
} from "https://deno.land/std@0.186.0/streams/mod.ts";

// 3rd party libs
import Kia from "https://deno.land/x/kia@0.4.1/mod.ts";

const kia = new Kia({ text: "Degit" });
kia.stop();

import { Github } from "./github.ts";
import { getGithubToken } from "./get-github-token.ts";
import { homedir, parseUrlPath } from "./utils.ts";

const getFilePath = async (...relativeFilePath: string[]) => {
   console.log(">>>>>>> homedir: ", homedir());
   const filePath = resolve(homedir(), ".degit", ...relativeFilePath);
   console.log(">>>>>>> filePath: ", filePath);
   const fileDir = dirname(filePath);
   console.log(">>>>>>> fileDir: ", fileDir);
   await ensureDir(fileDir);
   return filePath;
};

window.onunload = (ev) => {
   if (kia.isSpinning()) {
      kia.stop();
   }
};

let __dirname: string;
try {
   const url = new URL(import.meta.url);
   if (url.protocol === "file:") {
      __dirname = dirname(fromFileUrl(import.meta.url));
      // The following is for localtesting, cause I don't want to download git repo in current dir.
      __dirname = resolve(__dirname, "..", "..", "test-git");
   } else {
      __dirname = Deno.cwd();
   }
} catch {
   __dirname = Deno.cwd();
}
if (import.meta.main) {
   const args = parse(Deno.args);
   const urlPath = args._[0];

   if (!urlPath || typeof urlPath === "number") {
      console.error(
         "Path to repo is required in format: github:user/repo#branch",
      );
      Deno.exit(1);
   }

   kia.start("Getting github token");
   const [remote, ...tokens] = parseUrlPath(urlPath);
   const githubToken = await getGithubToken();
   kia.succeed("Success: github token");

   const github = new Github(...tokens, githubToken);
   // const buffer = await github.run();

   // if (!buffer || buffer.byteLength === 0) {
   //    Deno.exit(1);
   // }

   /**
    * I can save the buffer to a file, for caching, but not required for me right now.
    */
   // const absFilePath = await getFilePath(tokens[0], tokens[1], `${tokens[2]}.tar.gz`);
   // await Deno.writeFile(
   //    absFilePath,
   //    new Uint8Array(buffer),
   // );

   kia.start("Downloading the git tarball");
   const stream = await github.getTarballStream();
   kia.succeed("Downloaded git tarball");

   if (!stream) {
      console.error("No tarball found");
      Deno.exit(1);
   }

   kia.start('Extracting git tarball');
   const ds = new DecompressionStream("gzip");
   const reader = readerFromStreamReader(stream.pipeThrough(ds).getReader());
   const untar = new Untar(reader);

   for await (const entry of untar) {
      const [root, ...path] = entry.fileName.split(/\/(.*)/i);
      const resolvedPath = resolve(__dirname, ...path);
      if (entry.type === "g" || entry.fileName === `${root}/`) {
         continue;
      }
      if (entry.type === "directory") {
         await ensureDir(resolvedPath);
         continue;
      }

      await ensureFile(resolvedPath);
      const file = await Deno.open(resolvedPath, { write: true });
      // <entry> is a reader.
      await copy(entry, file);
   }

   kia.succeed('Extracting complete');
}
