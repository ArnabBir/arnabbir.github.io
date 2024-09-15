import { HomeIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
import HelloWorld from "./pages/HelloWorld.jsx";
import HappyBirthday from "./pages/HappyBirthday.jsx";
import GoodNight from "./pages/GoodNight.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Hello World",
    to: "/hello-world",
    page: <HelloWorld />,
  },
  {
    title: "Happy Birthday",
    to: "/happy-birthday",
    page: <HappyBirthday />,
  },
  {
    title: "Good Night",
    to: "/good-night",
    page: <GoodNight />,
  },
];
