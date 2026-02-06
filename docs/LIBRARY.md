# Engineering Library Guide

The Engineering Library is a collection of interactive study materials with fancy HTML illustrations, charts, and visual explanations.

## Adding a New Library Item

### Step 1: Create Your HTML Content

1. Create your HTML file with interactive content (charts, simulations, visualizations)
2. Place it in `public/library/your-item-name.html`
3. You can use:
   - Chart.js for charts
   - MathJax for equations
   - Tailwind CSS (via CDN)
   - Any JavaScript libraries you need

### Step 2: Add to Library Content

Edit `src/content/library.js` and add a new entry:

```js
{
  id: "unique-id",
  title: "Your Study Material Title",
  description: "Brief description of what this covers",
  category: "Systems Design", // or "Algorithms", "Distributed Systems", etc.
  tags: ["Tag1", "Tag2", "Tag3"],
  thumbnail: "/images/your-thumbnail.png", // Optional - add to public/images/
  contentPath: "/library/your-item-name.html",
  date: "2024-02-07",
  featured: true, // Set to true for featured items
  highlights: [
    "Key highlight 1",
    "Key highlight 2",
    "Key highlight 3"
  ],
  difficulty: "Advanced", // "Beginner", "Intermediate", or "Advanced"
  readingTime: "20 min",
}
```

### Step 3: Design Tips

- **Interactive Elements**: Use Chart.js, D3.js, or Canvas for visualizations
- **Mathematical Content**: Use MathJax for LaTeX equations
- **Styling**: Follow the Mendel example - use Tailwind CSS for consistency
- **Responsive**: Ensure your HTML works on mobile devices
- **Dark Mode**: Consider adding dark mode support

### Example Structure

Your HTML file should follow this pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Title</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Add other libraries as needed -->
</head>
<body>
    <!-- Your interactive content -->
</body>
</html>
```

### Categories

Use consistent categories:
- Systems Design
- Algorithms & Data Structures
- Distributed Systems
- Database Systems
- Networking
- Security
- Machine Learning
- Software Engineering

### Tips

- Keep HTML files self-contained (include all CSS/JS)
- Use relative paths for assets
- Test on different screen sizes
- Add clear navigation/back buttons
- Include references and further reading
