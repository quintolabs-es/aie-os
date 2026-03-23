### Use in `aie-os` project

### Initialize and build for AIE OS

```bash
cd aie-os
pnpm run build
bash bin/aie-os init \
  --kb-path content/knowledge-base \
  --agent-path content/agent \
  --agent-persona software-developer \
  --skills-path content/skills \
  --languages typescript \
  --application-type cli 

bash bin/aie-os build
```
