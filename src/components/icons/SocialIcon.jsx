import React from "react";
import { Github, Linkedin, Mail, Globe, X } from "lucide-react";
import { SiLeetcode, SiSubstack } from "react-icons/si";
import { FaHackerrank, FaInstagram } from "react-icons/fa";

const ICONS = {
  github: Github,
  linkedin: Linkedin,
  mail: Mail,
  website: Globe,
  x: X,
  substack: SiSubstack,
  leetcode: SiLeetcode,
  instagram: FaInstagram,
  hackerrank: FaHackerrank,
};

export default function SocialIcon({ name, className }) {
  const Icon = ICONS[name] || Globe;
  return <Icon className={className} aria-hidden="true" />;
}
