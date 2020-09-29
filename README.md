# deno-scripts

_My Handy Deno Scripts/Simple single file projects to run anywhere when needed_

## Projects

[csv2json.ts](./src/csv2json.ts)

```sh
deno run --allow-read --allow-write --unstable ./src/csv2json.ts input.csv [output.json]
```

[log_json_file_server.ts](.src/log_json_file_server.ts)

This script is mostly useless. It's usecase is very specific
to my current on-going project in upGrad. Anyways I learnt a
lot building everything from scratch though :smirk: :wink:

```sh
# Support uploading JSON payload as JSON log file
deno run --allow-net --allow-read --allow-write --unstable ./src/log_json_file_server.ts --port 9000 -f ./out/l3.json -u

# Don't allow JSON payload Posts (Writes) to create a JSON files, just allow reading already created JSON log files.
deno run --allow-net --allow-read --allow-write --unstable ./src/log_json_file_server.ts --port 9000
```
