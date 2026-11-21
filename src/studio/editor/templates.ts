import { createTemplateEntities, launchTemplates } from "./templateFactory";
import type { Entity } from "../shared";

/** Shell-facing catalog. Each builder returns fresh entities for a new board. */
export const studioTemplates: {
  id: string;
  title: string;
  description: string;
  build: () => Entity[];
}[] = launchTemplates.map((template) => ({
  id: template.id,
  title: template.name,
  description: template.description,
  build: () => createTemplateEntities(template.id),
}));
