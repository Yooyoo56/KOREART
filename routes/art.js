const router = require("express").Router();
const mongoose = require("mongoose");

//sending the mail from the localhost

// Require the Artist, Workart model in order to interact with the database
const User = require("../models/User.model");
const Artist = require("../models/Artist.model");
const Workart = require("../models/Workart.model");

//la base de donnees ->
router.get("/artists", (req, res, next) => {
	Artist.find()
		.then((artists) => {
			res.json({ artists });
		})
		.catch((error) => {
			res.status(500).json({ errorMessage: "Failed to load the artists page" });
		});
});

router.get("/artists/:id", (req, res) => {
	Artist.findById()
		.then((artistId) => {
			res.json({ artistId });
		})
		.catch((error) => {
			res
				.status(500)
				.json({ errorMessage: "Failed to load the artists id page" });
		});
});

router.get("/workarts", (req, res) => {
	Workart.find()
		.then((workarts) => {
			res.json({ workarts });
		})
		.catch((error) => {
			res.status(500).json({ errorMessage: "Failed to load the workart page" });
		});
});

router.get("/workarts/:id", (req, res) => {
	Workart.findById()
		.then((workartId) => {
			res.json({ workartId });
		})
		.catch((error) => {
			res
				.status(500)
				.json({ errorMessage: "Failed to load the workart id page" });
		});
});

//sendgrid? -> heroku.app
//contact-us (Form)
/*
router.post("/contact", (req, res, next) => {
  let { email, subject, message } = req.body;
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAIL_USERNAME, // need to define on the .env
      pass: process.env.MAIL_PASSWORD  // need to define on the .env
    }
  });
  transporter.sendMail({
    from: '"message from website mycoach" <questions@koreart.com>',
    to: email, 
    subject: subject, 
    text: message,
    html:`<b>${message}</b>`
  })
  .then(info => res.render('message', {email, subject, message, info}))
  .catch(error => console.log(error));
});
*/

router.get("/favorites", (req, res) => {
	Workart.findById()
		.then((userFavorite) => {
			res.json({ userFavorite });
		})
		.catch((error) => {
			res
				.status(401)
				.json({ errorMessage: "User doesn't have any authorisation" });
		});
});

//put -> update
// it worked with the router.post
router.put("/add/:workartId/favorite", (req, res) => {
	const { workart } = req.params.workartId;
	console.log("WORKART =>>", req.params.workartId);
	if (!req.session.user) {
		res
			.status(401)
			.json({ errorMessage: "User doesn't have any authorisation" });
	}
	if (!req.params.workartId) {
		res.status(401).json({ errorMessage: "Workart error" });
	}
	User.findByIdAndUpdate(
		{ _id: req.session.user._id },
		{ $push: { favorites: mongoose.Types.ObjectId(req.params.workartId) } },
		{ new: true }
	)
		.then((updatedUser) => {
			res.json({ updatedUser });
		})
		.catch((error) => {
			res.status(500).json({ errorMessage: error.message });
		});
});

//params
router.put("/delete/favorite", (req, res) => {
	Workart.findByIdAndRemove(req.params.id)
		.then(() => {
			res.json({
				message: `Task with ${req.params.id} is removed successfully.`,
			});
		})
		.catch((error) => {
			res.status().json({ errorMessage: "Error on deleting workart" });
		});
});

module.exports = router;
