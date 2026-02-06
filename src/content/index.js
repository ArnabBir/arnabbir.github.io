import { ContentSchema } from "./schema";

import site from "./site";
import experience from "./experience";
import projects from "./projects";
import writing from "./writing";
import education from "./education";
import certifications from "./certifications";
import skills from "./skills";

const parsed = ContentSchema.parse({
  site,
  experience,
  projects,
  writing,
  education,
  certifications,
  skills,
});

export const content = parsed;

export const {
  site: siteContent,
  experience: experienceContent,
  projects: projectsContent,
  writing: writingContent,
  education: educationContent,
  certifications: certificationsContent,
  skills: skillsContent,
} = parsed;
