import { z } from "zod";

export const SocialLinkSchema = z.object({
  label: z.string(),
  href: z.string().min(1),
  icon: z.string().min(1),
});

export const SiteSchema = z.object({
  name: z.string(),
  role: z.string(),
  location: z.string().optional(),
  tagline: z.string(),
  summary: z.string(),
  email: z.string().email(),
  resumeUrl: z.string().optional(),
  socials: z.array(SocialLinkSchema),
  links: z
    .object({
      calendly: z.string().optional(),
      topmate: z.string().optional(),
      preplaced: z.string().optional(),
      codementor: z.string().optional(),
    })
    .optional(),
});

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  start: z.string(),
  end: z.string(),
  logo: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  tech: z.array(z.string()).default([]),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().min(1),
      })
    )
    .default([]),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().optional(),
  tags: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().min(1),
      })
    )
    .default([]),
  featured: z.boolean().default(false),
  kind: z.enum(["featured", "open-source", "lab"]).default("featured"),
});

export const WritingSchema = z.object({
  title: z.string(),
  publication: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  href: z.string().min(1),
  tag: z.string().optional(),
});

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  details: z.array(z.string()).default([]),
  logo: z.string().optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().min(1),
      })
    )
    .default([]),
});

export const CertificationSchema = z.object({
  title: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
  image: z.string().optional(),
  href: z.string().optional(),
});

export const SkillGroupSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export const LibraryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
  contentPath: z.string(),
  date: z.string().optional(),
  featured: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
  chapters: z.array(z.string()).default([]),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  readingTime: z.string().optional(),
});

export const ContentSchema = z.object({
  site: SiteSchema,
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  writing: z.array(WritingSchema),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema),
  skills: z.array(SkillGroupSchema),
  library: z.array(LibraryItemSchema).default([]),
});
