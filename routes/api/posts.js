const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Post Model
const Post = require("../../models/Post");
// Load Profile Model
const Profile = require("../../models/Profile");

// Validation
const ValidatePostInput = require("../../validation/post");

// @route   GET api/posts/test
// @desc    Tests posts route
// @access  Public
router.get("/test", (req, res) => {
  res.json({ msg: "Posts Works" });
});

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostfound: "No posts found" }));
});

// @route   GET api/posts/:id
// @desc    Get a post
// @access  Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: "No post found with that ID" })
    );
});

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = ValidatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.user.name,
      avatar: req.user.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Public
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check Id of owner post
    Post.findOneAndRemove({ _id: req.params.id, user: req.user.id })
      .then(post => {
        return !post
          ? res
              .status(401)
              .json({ postnotfound: "Your are not authorized to do that" })
          : res.status(200).json({ postdeleted: "Your post was deleted" });
      })
      .catch(err =>
        res
          .status(404)
          .json({ postnotfound: "There was a problem deleting the post" })
      );
  }
);

// @route   POST api/posts/like/:id
// @desc    Like a post
// @access  Public
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check Id of owner post
    Post.findById({ _id: req.params.id, user: req.user.id }).then(post => {
      if (
        post.likes.filter(like => like.user.toString() === req.user.id).length >
        0
      ) {
        return res
          .status(400)
          .json({ alreadyliked: "User already liked this post" });
      }

      post.likes.unshift({ user: req.user.id });

      post.save().then(post => res.json(post));
    });
  }
);

// @route   POST api/posts/unlike/:id
// @desc    unLike a post
// @access  Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check Id of owner post
    Post.findById({ _id: req.params.id, user: req.user.id }).then(post => {
      if (
        post.likes.filter(like => like.user.toString() === req.user.id)
          .length === 0
      ) {
        return res
          .status(400)
          .json({ notliked: "You have not yet liked this post" });
      }

      // Get remove index
      const removeIndex = post.likes
        .map(item => item.user.toString())
        .indexOf(req.user.id);

      // Splice out of array
      post.likes.splice(removeIndex, 1);

      // Save
      post.save().then(post => res.json(post));
    });
  }
);

// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = ValidatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

module.exports = router;
