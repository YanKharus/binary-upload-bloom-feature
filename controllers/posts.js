const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

module.exports = {
  getProfile: async (req, res) => {
    try {
      if (!req.params.id) req.params.id = req.user.id // default behaviour because of how my requests are setup with undefined being default
      console.log(req.body)
      const posts = await Post.find({ user: req.user.id });
      console.log(req.user.id, 'lalalalallallal', req.params)
      if ( req.params.id == req.user.id) {
        res.render("profile.ejs", { posts: posts, user: req.user });
      } else {
        const userPosts = await Post.find({ user: req.params.id})
        const viewedUser = await User.findOne ({ _id: req.params.id})
        console.log(viewedUser, 'vieweduser')
        res.render("userProfile.ejs", { posts: userPosts, user: viewedUser });  // anywhere I am writing user I am implying not logged in user
      }

    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      console.log(req.body)
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const comments = await Comment.find({postId: req.params.id}); 
      let namesToComments = {}
      
      await Promise.all(
        comments.map(async z => {
          if (!namesToComments[z.userId]) {
    
            namesToComments[z.userId] = (await User.findById(z.userId).lean()).userName // parentheses need to be around 
          }                                                                             // await up till findbyid for it to work
        })// because it instantly returns a promise and accessing a promise.userName will give nothing but controlling
      )   // order of operations by putting parentheses around the database fetch lets it resolve before being accessed for data
      console.log(namesToComments, 'lallalalalal')
      res.render("post.ejs", { post: post, user: req.user, comments: comments });
    } catch (err) {
      console.log(err); 
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect(`/profile`);  
    } catch (err) {
      console.log(err);
    }
  },
  createComment: async (req, res) => {
    try {
      await Comment.create({
        comment: req.body.comment,
        postId: req.params.postId,
        likes: 0,
        userId: req.user.id,
      });
      console.log("comment created");
      res.redirect(`/post/${req.params.postId}`);
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
