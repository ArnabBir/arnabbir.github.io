import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';
import { FaJava, FaPython, FaDatabase, FaAws, FaDocker, FaGitAlt } from 'react-icons/fa';
import { SiCplusplus, SiC, SiScala, SiJavascript, SiKubernetes, SiApachekafka, SiApachespark, SiElasticsearch, SiRedis, SiMongodb, SiMysql, SiPostgresql, SiApachehadoop, SiGooglecloud, SiMicrosoftazure, SiRabbitmq, SiApachehive, SiIstio, SiAmazonec2 } from 'react-icons/si';

const TechnicalSkills = () => {
  const skills = [
    {
      category: 'PROGRAMMING',
      items: [
        { name: 'Java', icon: FaJava },
        { name: 'C++', icon: SiCplusplus },
        { name: 'Python', icon: FaPython },
        { name: 'C', icon: SiC },
        { name: 'Scala', icon: SiScala },
        { name: 'JavaScript', icon: SiJavascript },
      ]
    },
    {
      category: 'TECHNOLOGIES',
      items: [
        { name: 'Kubernetes', icon: SiKubernetes },
        { name: 'Docker', icon: FaDocker },
        { name: 'Kafka', icon: SiApachekafka },
        { name: 'Spark', icon: SiApachespark },
        { name: 'Git', icon: FaGitAlt },
        { name: 'ELK Stack', icon: SiElasticsearch },
        { name: 'Zookeeper', icon: FaDatabase },
        { name: 'RabbitMQ', icon: SiRabbitmq },
        { name: 'Hive', icon: SiApachehive },
        { name: 'Istio', icon: SiIstio },
        { name: 'GCP', icon: SiGooglecloud },
        { name: 'Azure', icon: SiMicrosoftazure },
        { name: 'AWS EC2', icon: SiAmazonec2 },
      ]
    },
    {
      category: 'DATABASE',
      items: [
        { name: 'MySQL', icon: SiMysql },
        { name: 'PostgreSQL', icon: SiPostgresql },
        { name: 'MongoDB', icon: SiMongodb },
        { name: 'Redis', icon: SiRedis },
        { name: 'Elasticsearch', icon: SiElasticsearch },
        { name: 'Hadoop', icon: SiApachehadoop },
        { name: 'Spanner', icon: FaDatabase },
        { name: 'Vertica', icon: FaDatabase },
        { name: 'Aerospike', icon: FaDatabase },
        { name: 'HBase', icon: FaDatabase },
        { name: 'GCS', icon: SiGooglecloud },
        { name: 'S3', icon: FaAws },
        { name: 'HDFS', icon: SiApachehadoop },
      ]
    }
  ];

  return (
    <motion.section
      id="skills"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8 text-center">
        <TypewriterEffect text="Technical Skills" speed={100} loop={true} pause={30000} />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {skills.map((skillSet, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-200 border-b pb-2">{skillSet.category}</h3>
              <div className="grid grid-cols-3 gap-4">
                {skillSet.items.map((skill, skillIndex) => (
                  <div key={skillIndex} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <skill.icon className="text-3xl mb-2 text-blue-500 dark:text-blue-400" />
                    <span className="text-xs text-center text-gray-600 dark:text-gray-300">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default TechnicalSkills;