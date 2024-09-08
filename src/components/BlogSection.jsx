import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const BlogSection = () => {
  const blogs = [
    {
      title: <TypewriterEffect text="Demystifying TStore: The Backbone of Billions of Transactions at PhonePe | Chapter 2" speed={30} loop={true} />,
      url: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe-chapter-2/",
      source: "PhonePe Tech Blog",
      thumbnail: "/images/tstore2.png"
    },
    {
      title: <TypewriterEffect text="Demystifying TStore: The Backbone of Billions of Transactions at PhonePe | Chapter 1" speed={30} loop={true} />,
      url: "https://tech.phonepe.com/demystifying-tstore-the-backbone-of-billions-of-transactions-at-phonepe/",
      source: "PhonePe Tech Blog",
      thumbnail: "/images/tstore1.png"
    }
  ];

  return (
    <motion.section
      id="blogs"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">
        <TypewriterEffect text="Engineering Blogs" speed={100} loop={true} />
      </h2>
      <div className="grid grid-cols-1 gap-8">
        {blogs.map((blog, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <a
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex flex-col md:flex-row">
              <img 
  src={blog.thumbnail} 
  alt={blog.title} 
  className="w-full md:w-48 h-48 object-contain rounded-t-lg md:rounded-l-lg md:rounded-t-none" 
/>                <div className="p-6 flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{blog.title}</h3>
                    <p className="text-gray-600">{blog.source}</p>
                  </div>
                  <button className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-green-800 transition-colors duration-300 w-full md:w-32">
                    Read more
                  </button>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default BlogSection;