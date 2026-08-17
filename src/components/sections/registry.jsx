import {
  Award,
  BookOpen,
  Briefcase,
  Code2,
  GraduationCap,
  Home,
  PenTool,
  Rocket,
  Send,
} from "lucide-react";

import About from "./About";
import Certifications from "./Certifications";
import Contact from "./Contact";
import Education from "./Education";
import Experience from "./Experience";
import Hero from "./Hero";
import Library from "./Library";
import Projects from "./Projects";
import Skills from "./Skills";
import Writing from "./Writing";

export const portfolioSections = [
  { id: "home", label: "Home", icon: Home, component: Hero },
  { id: "about", label: "About", icon: Rocket, component: About, navigation: true },
  { id: "experience", label: "Experience", icon: Briefcase, component: Experience, navigation: true },
  { id: "education", label: "Education", icon: GraduationCap, component: Education, navigation: true },
  { id: "projects", label: "Projects", icon: Code2, component: Projects, navigation: true },
  { id: "library", label: "Library", icon: BookOpen, component: Library, navigation: true },
  { id: "writing", label: "Writing", icon: PenTool, component: Writing, navigation: true },
  { id: "skills", label: "Skills", icon: Code2, component: Skills, navigation: true },
  { id: "certifications", label: "Certifications", icon: Award, component: Certifications, navigation: true },
  { id: "contact", label: "Contact", icon: Send, component: Contact, navigation: true },
];

export const navigationSections = portfolioSections.filter((section) => section.navigation);
