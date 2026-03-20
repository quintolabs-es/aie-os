# Run cli locally from the repo

Use the local wrapper at `./bin/aie-os-cli`.

```bash
git clone https://www.github.com/quintolabs-es/aie-os-cli
cd aie-os-cli
pnpm run build

# init interactive
bash ./bin/aie-os-cli init [--project-path defaults/to/cwd]
# init explicit 
bash ./bin/aie-os-cli init \
  --kb-path ./content/knowledge-base \
  --agent-path ./content/agent \
  --skills-path ./content/skills \
  --agent-persona software-developer \
  --languages typescript \
  --application-type cli

bash bin/aie-os-cli build --tool codex [--project-path defaults/to/cwd]

```