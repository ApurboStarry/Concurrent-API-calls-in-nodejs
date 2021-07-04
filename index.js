const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/ping", (req, res) => {
  return res.send({ success: true });
});

app.get("/api/concurrent/posts", async (req, res) => {
  let posts = [];

  // retrieve and filter all the tags from the URL
  const tags = getTags(req.query.tags);

  // make concurrent api calls
  const requests = tags.map((tag) =>
    axios.get("https://api.hatchways.io/assessment/blog/posts?tag=" + tag)
  );

  try {
    // wait until all the api calls resolves
    const result = await Promise.all(requests);

    // posts are ready. accumulate all the posts without duplicates
    result.map((item) => {
      posts = addNewPosts(posts, item.data.posts);
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }

  return res.send({ posts: posts });
});

app.get("/api/nonconcurrent/posts", async (req, res) => {
  let posts = [];

  // retrieve and filter all the tags from the URL
  const tags = getTags(req.query.tags);

  for(let i = 0; i < tags.length; i++) {
    const { data: newPosts } = await axios.get(
      "https://api.hatchways.io/assessment/blog/posts?tag=" + tags[i]
    );
    
    posts = addNewPosts(posts, newPosts.posts);
  }

  return res.send({ posts: posts });
});

function getTags(tags) {
  const tokens = tags.split(",");

  for (let i = 0; i < tokens.length; i++) {
    tokens[i] = tokens[i].trim();
  }

  return tokens;
}

function addNewPosts(oldPosts, newPosts) {
  for (let i = 0; i < newPosts.length; i++) {
    isAlreadyAvailable = false;

    for (let j = 0; j < oldPosts.length; j++) {
      if (_.isEqual(oldPosts[j], newPosts[i])) {
        isAlreadyAvailable = true;
        break;
      }
    }

    // add a post to old posts only if it already has not added
    if (!isAlreadyAvailable) {
      oldPosts.push(newPosts[i]);
    }
  }

  return oldPosts;
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log("Listening on port", port));
