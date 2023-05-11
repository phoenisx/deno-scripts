export function homedir() {
   return Deno.env.get("HOME") || Deno.env.get("HOMEPATH") ||
      Deno.env.get("USERPROFILE") || "/";
}

/**
 * Will only support the following string pattern for quick development
 * {remote_name}:{user_name}/{path/to/repo}#{branch}
 *
 * If I ever felt a need to support commitHash/tags, I'll add them later.
 */
export const parseUrlPath = (url: string) => {
   const [remote, path, branch] = url.split(/:|#/);
   const [owner, repo] = path.split(/\/(.*)/i);
   return [remote, owner, repo, branch] as const;
};
