import path from "node:path";
import type { CommandRenderer } from "../types";

export function slashCommands(commandsDirectory: string): CommandRenderer {
  return (skills, skillsDirectory) =>
    skills.map((skill) => ({
      contents: renderCommand(
        skill.name,
        skill.description,
        path.posix.join(skillsDirectory, skill.name, skill.entrypoint),
      ),
      path: path.posix.join(commandsDirectory, `${skill.name}.md`),
    }));
}

function renderCommand(skillName: string, description: string, skillEntrypointPath: string): string {
  return [
    "---",
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `Use the \`${skillName}\` skill (\`${skillEntrypointPath}\`) for this request.`,
    "",
    "$ARGUMENTS",
    "",
  ].join("\n");
}
