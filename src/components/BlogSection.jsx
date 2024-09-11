import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';
import { Link } from 'react-router-dom';

const BlogSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const blogs = [
    {
      title: <TypewriterEffect text="Demystifying TStore: The Backbone of Billions of Transactions at PhonePe | Chapter 2" speed={30} loop={true} hideCursorOnComplete={true} />,
      url: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe-chapter-2/",
      source: <TypewriterEffect text="In this chapter we will dive deep into TStore's architecture, explaining its datastores, message queues, disaster recovery strategy, and security measures." speed={10} loop={true} hideCursorOnComplete={true} />,
      thumbnail: "/images/tstore2.png"
    },
    {
      title: <TypewriterEffect text="Demystifying TStore: The Backbone of Billions of Transactions at PhonePe | Chapter 1" speed={30} loop={true} hideCursorOnComplete={true} />,
      url: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe/", 
      source:  <TypewriterEffect text="Demystifying TStore: The Backbone of Billions of Transactions at PhonePe! Imagine thousands of transactions every second, involving complex data exchanges—debits, credits, settlements, offers, notifications, services, refunds, and more. To deliver a seamless, real-time payment experience and instant access to transaction history, PhonePe relies on the Transaction Store (TStore)." speed={10} loop={true} hideCursorOnComplete={true} />,
      thumbnail: "/images/tstore1.png"
    },
    {
      title: <TypewriterEffect text="Sample Blog Post 3" speed={30} loop={true} hideCursorOnComplete={true} />,
      url: "#",
      source: <TypewriterEffect text="This is a sample blog post to demonstrate the layout and design." speed={10} loop={true} hideCursorOnComplete={true} />,
      thumbnail: "/images/placeholder.svg"
    },
    {
      title: <TypewriterEffect text="Sample Blog Post 4" speed={30} loop={true} hideCursorOnComplete={true} />,
      url: "#",
      source: <TypewriterEffect text="Another sample blog post to show multiple entries when expanded." speed={10} loop={true} hideCursorOnComplete={true} />,
      thumbnail: "/images/placeholder.svg"
    },
    {
      title: <TypewriterEffect text="Sample Blog Post 5" speed={30} loop={true} hideCursorOnComplete={true} />,
      url: "#",
      source: <TypewriterEffect text="Yet another sample blog post to demonstrate the expanded view." speed={10} loop={true} hideCursorOnComplete={true} />,
      thumbnail: "/images/placeholder.svg"
    }
  ];

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const displayedBlogs = isExpanded ? blogs : blogs.slice(0, 3);

  return (
    <motion.section
      id="blogs"
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6">
        <TypewriterEffect text="Engineering Blogs" speed={100} loop={true} pause={30000} hideCursorOnComplete={true} />
      </h2>
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {displayedBlogs.map((blog, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <a
                href={blog.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    <img 
                      src={blog.thumbnail} 
                      alt={blog.title} 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4 md:w-2/3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{blog.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-justify">{blog.source}</p>
                    </div>
                    <div className="mt-2">
                      <span className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300">
                        Read more →
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={toggleExpand}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300 text-sm font-semibold"
        >
          {isExpanded ? "Collapse" : "Explore More"}
        </button>
      </div>
    </motion.section>
  );
};

export default BlogSection;