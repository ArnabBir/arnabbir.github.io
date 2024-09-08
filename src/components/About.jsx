import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <section id="about" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">About Me</h2>
        <Card className="bg-white shadow-xl">
          <CardContent className="p-8">
            <p className="text-lg mb-6 leading-relaxed text-gray-700">
              I'm Arnab Bir, a passionate Software Engineer currently working at PhonePe. With a rich background in the tech industry, I've had the privilege of working with industry giants like Google and Flipkart, as well as interning at innovative companies such as Axio and Hilabs.
            </p>
            <p className="text-lg mb-6 leading-relaxed text-gray-700">
              My journey in software engineering has been driven by a constant desire to learn, innovate, and solve complex problems. I specialize in building scalable systems and distributed architectures, and I'm always excited to take on new challenges that push the boundaries of what's possible in technology.
            </p>
            <p className="text-lg leading-relaxed text-gray-700">
              When I'm not coding, you can find me writing tech blogs, contributing to open-source projects, or exploring the latest advancements in the tech world. I'm passionate about sharing knowledge and inspiring others in the tech community.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default About;