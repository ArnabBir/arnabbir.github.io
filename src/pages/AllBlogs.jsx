import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from '../components/TypewriterEffect';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

const AllBlogs = () => {
  const blogs = [
    {
      title: "Demystifying TStore: The Backbone of Billions of Transactions at PhonePe | Chapter 2",
      url: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe-chapter-2/",
      source: "In this chapter we will dive deep into TStore's architecture, explaining its datastores, message queues, disaster recovery strategy, and security measures.",
      thumbnail: "/images/tstore2.png"
    },
    {
      title: "Demystifying TStore: The Backbone of Billions of Transactions at PhonePe | Chapter 1",
      url: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe/", 
      source: "Demystifying TStore: The Backbone of Billions of Transactions at PhonePe! Imagine thousands of transactions every second, involving complex data exchanges—debits, credits, settlements, offers, notifications, services, refunds, and more. To deliver a seamless, real-time payment experience and instant access to transaction history, PhonePe relies on the Transaction Store (TStore).",
      thumbnail: "/images/tstore1.png"
    },
    {
      title: "Sample Blog Post 3",
      url: "#",
      source: "This is a sample blog post to demonstrate the layout and design.",
      thumbnail: "/images/placeholder.svg"
    },
    {
      title: "Sample Blog Post 4",
      url: "#",
      source: "Another sample blog post to show multiple entries on the All Blogs page.",
      thumbnail: "/images/placeholder.svg"
    },
    {
      title: "Sample Blog Post 5",
      url: "#",
      source: "Yet another sample blog post to demonstrate the grid layout on larger screens.",
      thumbnail: "/images/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <Navigation />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <motion.h1
          className="text-3xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TypewriterEffect text="All Engineering Blogs" speed={100} loop={true} pause={30000} />
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <img src={blog.thumbnail} alt={blog.title} className="w-full h-48 object-cover" />
              <div className="p-4 flex-grow">
                <h2 className="text-lg font-semibold mb-2">{blog.title}</h2>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{blog.source}</p>
              </div>
              <div className="p-4 pt-0">
                <a
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                >
                  Read Article →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; 2024 Arnab Bir. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AllBlogs;