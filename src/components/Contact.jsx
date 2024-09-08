import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Github, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { z } from "zod";

const Contact = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const emailSchema = z.string().email({ message: "Invalid email address" });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      console.log('Resume requested by:', email);
      setEmail('');
      setEmailError('');
      alert('Thank you! Your resume request has been received.');
    } catch (error) {
      setEmailError(error.errors[0].message);
    }
  };

  const socialLinks = [
    { icon: <Linkedin className="h-6 w-6" />, url: "https://www.linkedin.com/in/arnabbir/", label: "LinkedIn" },
    { icon: <Github className="h-6 w-6" />, url: "https://github.com/yourgithub", label: "GitHub" },
    { icon: <Instagram className="h-6 w-6" />, url: "https://www.instagram.com/yourinstagram", label: "Instagram" },
    { icon: <Twitter className="h-6 w-6" />, url: "https://twitter.com/yourtwitter", label: "Twitter" },
    { icon: <Facebook className="h-6 w-6" />, url: "https://www.facebook.com/yourfacebook", label: "Facebook" },
    { icon: <Mail className="h-6 w-6" />, url: "mailto:your.email@example.com", label: "Email" },
  ];

  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-12 text-center terminal-cursor">Get in Touch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Connect with Me</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                  >
                    {link.icon}
                    <span className="mt-2 text-sm">{link.label}</span>
                  </a>
                ))}
              </div>
              <div className="mt-6">
                <a
                  href="https://topmate.io/arnab_bir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-primary-foreground py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Book a Session on Topmate
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Request Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-muted text-foreground"
                />
                {emailError && <p className="text-destructive">{emailError}</p>}
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-accent">
                  Request Resume
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;