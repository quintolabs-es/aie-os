# Run cli locally from the repo

Use the local wrapper at `./bin/cli`.

```bash
git clone https://www.github.com/quintolabs-es/aie-os-cli
cd aie-os-cli
pnpm run build
pnpm run test

# init interactive
bash ./bin/cli init [--project-path defaults/to/cwd]
# init explicit 
bash ./bin/cli init \
  --kb-path ./content/knowledge-base \
  --agent-path ./content/agent \
  --skills-path ./content/skills \
  --agent-persona software-developer \
  --languages typescript \
  --application-type cli

bash bin/cli build --tool codex [--project-path defaults/to/cwd]

```
