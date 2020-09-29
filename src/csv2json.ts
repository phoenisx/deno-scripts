import {
  ensureFile,
} from "https://deno.land/std/fs/mod.ts";

const filename = Deno.args[0];
const outputFilename = Deno.args[1] || './out/temp.json';

async function writeJson(path: string, data: object): Promise<string> {
  try {
    await ensureFile(path);
    await Deno.writeTextFile(path, JSON.stringify(data));

    return "Written to " + path;
  } catch (e) {
    return e.message;
  }
}

(async () => {

  if (filename) {

    // TODO: Apply better logic to open part of file to save memory.
    const url = new URL(filename, import.meta.url);
    const csvData: string = await Deno.readTextFile(url);
    const out: Record<string, any>[] = [];
    const rows = csvData.split(/\r?\n/);
    const [firstRow, otherRows] = [rows[0], rows.slice(1)]
    let JSON_KEYS: string[] = firstRow.split(",");
    console.log(JSON_KEYS);
    otherRows.forEach((row, index) => {
      const columns = row.split(",");

      if (JSON_KEYS.length === columns.length) {
        const jsonObj: Record<string, any> = {};
        columns.forEach((column, ci) => {
          jsonObj[JSON_KEYS[ci]] = column;
        });
        out.push(jsonObj);
      }
    });

    await writeJson(outputFilename, out);
  } else {
    console.error("No Filename Provided");
  }

})()
