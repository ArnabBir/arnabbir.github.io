import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-background text-foreground py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Arnab Bir. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-primary mx-2">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-primary mx-2">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;