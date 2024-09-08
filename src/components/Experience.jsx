import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Experience = () => {
  const experiences = [
    {
      company: 'PhonePe',
      position: 'Software Engineer',
      period: 'Current',
      description: 'Working on cutting-edge payment solutions and financial technology.',
    },
    {
      company: 'Google',
      position: 'Software Engineer',
      period: 'Previous',
      description: 'Contributed to large-scale projects and innovative technologies.',
    },
    {
      company: 'Flipkart',
      position: 'Software Engineer',
      period: 'Previous',
      description: 'Developed e-commerce solutions and improved user experiences.',
    },
    {
      company: 'Flipkart',
      position: 'Intern',
      period: 'Internship',
      description: 'Gained hands-on experience in e-commerce technology.',
    },
    {
      company: 'Axio',
      position: 'Intern',
      period: 'Internship',
      description: 'Worked on innovative projects in the tech industry.',
    },
    {
      company: 'Hilabs',
      position: 'Intern',
      period: 'Internship',
      description: 'Contributed to software development projects and gained valuable experience.',
    },
  ];

  return (
    <section id="experience" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-12 text-center terminal-cursor">Professional Experience</h2>
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 bg-card">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{exp.company}</span>
                  <Badge variant="secondary">{exp.period}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-2">{exp.position}</h3>
                <p className="text-muted-foreground">{exp.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;