import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Github, Home, Linkedin, Mail, Rocket, Briefcase } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { siteContent } from "@/content";

const SECTIONS = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: Rocket },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FileText },
  { id: "writing", label: "Writing", icon: FileText },
  { id: "skills", label: "Skills", icon: FileText },
  { id: "education", label: "Education", icon: FileText },
  { id: "certifications", label: "Certifications", icon: FileText },
  { id: "contact", label: "Contact", icon: Mail },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export default function CommandMenu({ open, onOpenChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = async (id) => {
    onOpenChange(false);

    if (id === "home") {
      if (location.pathname !== "/") navigate("/");
      setTimeout(() => scrollToId("home"), 50);
      return;
    }

    // If we're already on the home page, just scroll.
    if (location.pathname === "/") {
      const ok = scrollToId(id);
      if (!ok) window.location.hash = `#${id}`;
      return;
    }

    // Otherwise navigate to home first, then scroll.
    navigate("/");
    setTimeout(() => {
      const ok = scrollToId(id);
      if (!ok) window.location.hash = `#${id}`;
    }, 150);
  };

  const openLink = (href) => {
    onOpenChange(false);
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const resumeUrl = siteContent.resumeUrl;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sections, links, projects…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {SECTIONS.map((s, idx) => {
            const Icon = s.icon;
            const shortcut = idx === 0 ? "H" : undefined;
            return (
              <CommandItem key={s.id} onSelect={() => goToSection(s.id)}>
                <Icon className="mr-2 h-4 w-4" />
                {s.label}
                {shortcut ? <CommandShortcut>{shortcut}</CommandShortcut> : null}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick links">
          <CommandItem onSelect={() => openLink("https://github.com/ArnabBir")}>
            <Github className="mr-2 h-4 w-4" /> GitHub
          </CommandItem>
          <CommandItem onSelect={() => openLink("https://www.linkedin.com/in/arnabbir/") }>
            <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
          </CommandItem>
          <CommandItem onSelect={() => openLink(`mailto:${siteContent.email}`)}>
            <Mail className="mr-2 h-4 w-4" /> Email
          </CommandItem>
          {resumeUrl ? (
            <CommandItem onSelect={() => openLink(resumeUrl)}>
              <FileText className="mr-2 h-4 w-4" /> Resume
            </CommandItem>
          ) : null}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
