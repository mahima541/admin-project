const Posts = require("../models/postModel");
const Users = require("../models/userModel");
const Comments = require("../models/commentModel");
const { post } = require("../routes/adminRouter");
const bcrypt = require("bcrypt");


///-------------------get total no. of users--------------------------///
const adminCtrl = {
  getTotalUsers: async (req, res) => {
    try {
      const users = await Users.find();
      const total_users = users.length;
      res.json({ total_users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  ///--------------------------get user list---------------------------------////

  getAllUsers: async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await Users.find().select('-password');

      res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

///---------------------------get total posts-------------------------///

  getTotalPosts: async (req, res) => {
    try {
      const posts = await Posts.find();
      const total_posts = posts.length;
      res.json({ total_posts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

///---------------------get taotal comments-----------------------------------////

  getTotalComments: async (req, res) => {
    try {
      const comments = await Comments.find();
      const total_comments = comments.length;
      res.json({ total_comments });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

///--------------------------get total likes---------------------------------///

  getTotalLikes: async (req, res) => {
    try {
      const posts = await Posts.find();
      let total_likes = 0;
      await posts.map((post) => (total_likes += post.likes.length));
      res.json({ total_likes });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

///--------------------------get total spam posts------------------------------//

  getTotalSpamPosts: async (req, res) => {
    try {
      const posts = await Posts.find();
      
      const reportedPosts = await posts.filter(post => post.reports.length>2);
      const total_spam_posts = reportedPosts.length;
      res.json({ total_spam_posts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getSpamPosts: async (req, res) => {
    try {
      const posts = await Posts.find()
        .select("user createdAt reports content")
        .populate({ path: "user", select: "username avatar email" });
      const spamPosts = posts.filter((post) => post.reports.length > 1);
      
      res.json({ spamPosts });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteSpamPost: async (req, res) => {
    try {
      const post = await Posts.findOneAndDelete({
        _id: req.params.id,
      });

      await Comments.deleteMany({ _id: { $in: post.comments } });

      res.json({ msg: "Post deleted successfully." });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

// ----------------------add user by admin-----------------------------------///
  addUser: async (req, res) => {
    try {
      // Extract user details from request body
      const { username, password, fullname, email, role } = req.body;

      // Check if the username already exists
      const existingUser = await Users.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ msg: 'Username already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user object
      const newUser = new Users({
        username,
        password: hashedPassword,
        fullname,
        email,
        role, // Assuming 'role' is a field indicating user role (e.g., 'admin', 'user')
      });

      // Save the new user to the database
      await newUser.save();

      res.json({ msg: 'User added successfully' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  //----------------------edit user by admin-----------------------------------///
  editUserProfile: async (req, res) => {
    // try {
    //   // Extract user ID and updated profile details from request body
    //   const { userId, ...updatedProfile } = req.body;

      // Update the user's profile in the database
    //   await Users.findByIdAndUpdate(userId, updatedProfile);

    try {
        const {
          avatar,
          fullname,
          mobile,
          address,
          story,
          website,
          gender,
        } = req.body;
        if (!fullname) {
          return res.status(400).json({ msg: "Please add your full name." });
        }

      await Users.findOneAndUpdate(
                { _id: req.user._id },
                 { avatar, fullname, mobile, address, story, website, gender }
               );
        

      res.json({ msg: 'User profile updated successfully' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },


// updateUser: async (req, res) => {
    // try {
    //   const {
    //     avatar,
    //     fullname,
    //     mobile,
    //     address,
    //     story,
    //     website,
    //     gender,
    //   } = req.body;
    //   if (!fullname) {
    //     return res.status(400).json({ msg: "Please add your full name." });
    //   }

//       await Users.findOneAndUpdate(
//         { _id: req.user._id },
//         { avatar, fullname, mobile, address, story, website, gender }
//       );

//       res.json({ msg: "Profile updated successfully." });
//     } catch (err) {
//       return res.status(500).json({ msg: err.message });
//     }
//   },

//   

///--------------------------change user password--------------------------///

//   changeUserPassword: async (req, res) => {
//     try {
//       // Extract user ID and new password from request body
//       const { userId, newPassword } = req.body;

//       // Hash the new password
//       const hashedPassword = await bcrypt.hash(newPassword, 10);

//       // Update the user's password in the database
//       await Users.findByIdAndUpdate(userId, { password: hashedPassword });

//       res.json({ msg: 'User password updated successfully' });
//     } catch (err) {
//       return res.status(500).json({ msg: err.message });
//     }
//   },


changeUserPassword: async (req, res) => {
    try {
      const {oldPassword, newPassword} = req.body;

      const user = await Users.findOne({ _id: req.user._id });

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Your password is wrong." });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 characters long." });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      
      await Users.findOneAndUpdate({_id: req.user._id}, {password: newPasswordHash });

      res.json({msg: "Password updated successfully."})

    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

};

module.exports = adminCtrl;