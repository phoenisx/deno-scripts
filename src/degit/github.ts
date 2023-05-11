type ResponseErrorState = {
   status: number;
   text: string;
};

type BranchResponse = {
   name: string;
   commit: {
      sha: string;
      node_id: string;
      // Ofcourse there are more properties, which I don't care of right now.
   };
};

type TarFetchResponse<T extends boolean> = T extends false ? ArrayBuffer
   : ReadableStream<Uint8Array>;

class ResponseError extends Error {
   status: number;
   constructor(state: ResponseErrorState) {
      super(state.text);
      this.status = state.status;
   }
}

const processResError = async (res: Response): Promise<ResponseErrorState> => {
   return {
      status: res.status,
      text: await res.text(),
   };
};

const getGHHeaders = (githubToken: string) => {
   const headers = new Headers();
   headers.append("Accept", "application/vnd.github+json");
   headers.append("Authorization", `Bearer ${githubToken}`);
   headers.append("X-Github-Api-Version", "2022-11-28");
   return headers;
};

export class Github {
   owner: string;
   repo: string;
   branch: string;
   token: string;

   /**
    * @param args Should contain an array of 4 strings: [owner, repo, branch, token];
    */
   constructor(...args: [string, string, string, string]) {
      this.owner = args[0];
      this.repo = args[1];
      this.branch = args[2];
      this.token = args[3];
   }

   private async getLatestCommit() {
      const url =
         `https://api.github.com/repos/${this.owner}/${this.repo}/branches/${this.branch}`;
      try {
         const res = await fetch(
            url,
            {
               headers: getGHHeaders(this.token),
            },
         );
         const data = await res.json() as BranchResponse;
         return data.commit.sha;
      } catch (e) {
         console.error("Failed to fetch branch details:", e);
         Deno.exit(1);
      }
   }

   /**
    * Ref: https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives#source-code-archive-urls
    */
   private async getGithubTar<T extends boolean>(
      commitHash: string,
      stream?: T,
   ) {
      // API ref: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#download-a-repository-archive-tar
      return await fetch(
         `https://api.github.com/repos/${this.owner}/${this.repo}/tarball/${commitHash}`,
         {
            headers: getGHHeaders(this.token),
         },
      ).then<
         ResponseErrorState | ArrayBuffer | ReadableStream<Uint8Array> | null
      >(
         (res) => {
            if (
               res.ok &&
               res.headers.get("content-type") === "application/x-gzip"
            ) {
               if (stream) {
                  return res.body as ReadableStream<Uint8Array>;
               } else {
                  return res.arrayBuffer();
               }
            } else {
               return processResError(res);
            }
         },
      ).then<ArrayBuffer | ReadableStream<Uint8Array> | null>((result) => {
         if (
            result == null || result instanceof ArrayBuffer ||
            result instanceof ReadableStream
         ) {
            return result;
         }
         throw new ResponseError(result);
      }).catch((error) => {
         console.error(">>>>>>>> Fetch Error: ", error);
         Deno.exit(1);
      });
   }

   async run() {
      // const hash = await this.getLatestCommit();
      // await this.getGithubTar(hash);

      // Commit is note required to be fetch, `ref` can be a branch name as well.
      return await this.getGithubTar(this.branch) as ArrayBuffer;
   }

   async getTarballStream() {
      // Commit is note required to be fetch, `ref` can be a branch name as well.
      return await this.getGithubTar(this.branch, true) as
         | ReadableStream<Uint8Array>
         | null;
   }
}
