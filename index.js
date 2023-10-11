const express = require("express");
const axios = require("axios");
const _ = require("lodash");

const app = express();
const port = 3000;

let blogs; // Variable to store the blog data

// Memoize the analytics function with a cache expiration of 5 minutes (300000 milliseconds)
const memoizedAnalytics = _.memoize(
  async () => {
    try {
      // Fetch data 
      const response = await axios.get(
        "https://intent-kit-16.hasura.app/api/rest/blogs",
        {
          headers: {
            "x-hasura-admin-secret":
              "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
          },
        }
      );

      // Extract blog data
      blogs = response.data.blogs; 

      // Data analysis using Lodash
      const totalBlogs = blogs.length;
      const longestBlog = _.maxBy(blogs, "title.length");
      const blogsWithPrivacy = _.filter(blogs, (blog) =>
        _.includes(_.toLower(blog.title), "privacy")
      );
      const uniqueBlogTitles = _.uniqBy(blogs, "title").map(
        (blog) => blog.title
      );

      return {
        totalBlogs,
        longestBlogTitle: longestBlog.title,
        blogsWithPrivacy: blogsWithPrivacy.length,
        uniqueBlogTitles,
      };
    } catch (error) {
      // Handle errors
      console.error(error.message);
      throw new Error("Internal Server Error");
    }
  },
  () => 300000
); // Cache expiration time: 5 minutes (300,000 milliseconds)

// Middleware for data retrieval and analysis
app.get("/api/blog-stats", async (req, res) => {
  try {
    // Get analytics results from cache or fetch and cache if not available
    const analyticsResults = await memoizedAnalytics();

    // Respond with analytics
    res.json(analyticsResults);
  } catch (error) {
    // Handle errors
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Blog search endpoint
app.get("/api/blog-search", async (req, res) => {
  try {
    const query = req.query.query.toLowerCase();

    // Get analytics results from cache or fetch and cache if not available
    const analyticsResults = await memoizedAnalytics();

    // Filter blogs based on the query string
    const searchResults = _.filter(blogs, (blog) =>
      _.includes(_.toLower(blog.title), query)
    );

    res.json({ results: searchResults });
  } catch (error) {
    // Handle errors
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Listen on port 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
