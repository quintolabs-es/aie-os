### Use in `aie-os` project

### Clone `aie-os` into the target project
The repo also includes a ready-to-use [`/content`](../content) folder for getting started.
```bash
cd aie-os
git clone https://github.com/quintolabs-es/aie-os
pnpm --dir aie-os run build
```

### Initialize and build for AIE OS

```bash
cd aie-os
bash bin/cli init \
  --kb-path content/knowledge-base \
  --agent-path content/agent \
  --agent-persona software-developer \
  --skills-path content/skills \
  --languages typescript \
  --application-type cli 

bash bin/cli build --tool codex 
```
