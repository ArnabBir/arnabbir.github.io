import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Blogs = () => {
  const blogs = [
    {
      title: 'Demystifying TStore: The Backbone of Billions of Transactions at PhonePe',
      url: 'https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe/',
      description: 'An in-depth look at the technology powering PhonePe\'s transaction system.',
      thumbnail: '/placeholder-thumbnail-1.jpg',
    },
    {
      title: 'Demystifying TStore: The Backbone of Billions of Transactions at PhonePe - Chapter 2',
      url: 'https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe-chapter-2/',
      description: 'Continuing the exploration of PhonePe\'s transaction system architecture.',
      thumbnail: '/placeholder-thumbnail-2.jpg',
    },
  ];

  return (
    <section id="blogs" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-12 text-center terminal-cursor">Tech Blogs</h2>
        <div className="space-y-8">
          {blogs.map((blog, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 bg-card">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img src={blog.thumbnail} alt={blog.title} className="w-full h-48 object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none" />
                </div>
                <div className="md:w-2/3 p-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">{blog.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{blog.description}</p>
                    <Button asChild variant="outline">
                      <a href={blog.url} target="_blank" rel="noopener noreferrer">Read More</a>
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blogs;