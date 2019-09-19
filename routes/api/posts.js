const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

// models
const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// ========================
// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      // validation
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    // check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // get the user
      const user = await User.findById(req.user.id).select('-password');
      // instantiate post object
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      // save the new post to the db
      const post = await newPost.save();
      // send post as response
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ========================
// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // get all posts and sort by most recent
    const posts = await Post.find().sort({ date: -1 });
    // return posts
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ========================
// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // get post by id
    const post = await Post.findById(req.params.id);
    // check if post exists
    if (!post) {
      return res.status(404).json({ msg: 'Post not found ' });
    }
    // return posts
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found ' });
    }
    res.status(500).send('Server error');
  }
});

// ========================
// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // get post by id
    const post = await Post.findById(req.params.id);
    // check if post exists
    if (!post) {
      return res.status(404).json({ msg: 'Post not found ' });
    }
    // check if logged in user owns post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    // delete post
    await post.remove();
    // return message
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found ' });
    }
    res.status(500).send('Server error');
  }
});

// ========================
// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    // find the post by id
    const post = await Post.findById(req.params.id);
    // check if post has already been like by the user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    // add like
    post.likes.unshift({ user: req.user.id });
    // save to db
    await post.save();
    // send response
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ========================
// @route   PUT api/posts/unlike/:id
// @desc    Like a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    // find the post by id
    const post = await Post.findById(req.params.id);
    // check if post has already been like by the user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }
    // get remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    // remove like
    post.likes.splice(removeIndex, 1);

    // save to db
    await post.save();
    // send response
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ========================
// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  '/comment/:id',
  [
    auth,
    [
      // validation
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    // check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // get the user
      const user = await User.findById(req.user.id).select('-password');
      // get the post
      const post = await Post.findById(req.params.id);
      // create comment object
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      // add the new comment
      post.comments.unshift(newComment);
      // save to the db
      await post.save();
      // send all comments as response
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ========================
// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    // get post by id
    const post = await Post.findById(req.params.id);
    // get comment from post
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );
    // check comment exists
    if (!comment) {
      return res.status(500).json({ msg: 'Comment does not exit' });
    }
    // check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    // get remove index
    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);
    // remove like
    post.comments.splice(removeIndex, 1);
    // save post
    await post.save();
    // return comments
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ========================
module.exports = router;
