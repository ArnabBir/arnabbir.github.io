import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import home from './home'; // First Page (previous index.js)
import portfoliohub from './portfoliohub'; // Second Page

const Index = () => {
  return (
    <Router>
      <div>
        <nav className="bg-gray-800 p-4 text-white">
          <ul className="flex space-x-4">
            {/* Navigation links */}
            <li><Link to="/">Home</Link></li>
            <li><Link to="/second">Second Page</Link></li>
          </ul>
        </nav>
        
        <Switch>
          {/* Define routes */}
          <Route exact path="/" component={home} />
          <Route path="/second" component={portfoliohub} />
        </Switch>
      </div>
    </Router>
  );
};

export default Index;
