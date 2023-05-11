import { assert } from "https://deno.land/std@0.186.0/testing/asserts.ts";

const getTokenFromKeychain = async (): Promise<string> => {
   let out: Uint8Array;
   const p = Deno.run({
      cmd: [
         "security",
         "find-generic-password",
         "-a",
         "phoenisx", // This should probably we dynamic and set by user, but it's fine for now
         "-s",
         "github_token",
         "-w",
      ],
      stdout: "piped",
   });
   try {
      const status = await p.status();
      if (!status.success && status.code === 44) {
         throw new Deno.errors.NotFound();
      }
      assert(status.success, `cmd security failed - code: ${status.code}`);
   } finally {
      out = await p.output();
      p.close();
   }

   return new TextDecoder().decode(out);
};

/**
 * For MacOS it's better to keep the passwords in keychain.
 * For other OS'es I can use dotenv to access token, but not a major concern right now.
 */
export const getGithubToken = async () => {
   if (Deno.build.os === "darwin") {
      try {
         return await getTokenFromKeychain();
      } catch {
         console.error("Couldn't get token from keychain");
         Deno.exit(1);
      }
   } else {
      console.error("Not implemented");
      Deno.exit(1);
   }
};
