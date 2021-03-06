const router = require("express").Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

//Models =====> User, Artists, Workart
// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");
const Workart = require("../models/Workart.model");

/*
                                                                                 
  ####  ###### #####          #       ####   ####   ####  ###### #####  # #    # 
 #    # #        #            #      #    # #    # #    # #      #    # # ##   # 
 #      #####    #   #####    #      #    # #      #      #####  #    # # # #  # 
 #  ### #        #            #      #    # #  ### #  ### #      #    # # #  # # 
 #    # #        #            #      #    # #    # #    # #      #    # # #   ## 
  ####  ######   #            ######  ####   ####   ####  ###### #####  # #    # 
                                                                                 
  */

router.get("/loggedin", (req, res, next) => {
	if (!req.user) {
		res.status(403).json({ errorMessage: "Not authorized!" });
		return;
	}

	User.findById(req.user._id)
		.populate("favorites")
		.then((userFromDB) => {
			res.json(userFromDB); // dernieres infos a jour du user
		})
		.catch((err) => {
			console.log(err);
			next(err);
		});
});

/*
//Created the error :ERR_HTTP_HEADERS_SENT'!!
router.get("/loggedin", (req, res) => {
	res.json(req.user);
	if (req.user) {
		res
			.status(400)
			.json({ errorMessage: "You are not loggedin please login." });
		return;
	}
	res.json(req.session.user);
});

*/

////////////////////// signup page ===> /users///////////////////////////

/*
                                                                    
 #####   ####   ####  #####             #    #  ####  ###### #####  
 #    # #    # #        #               #    # #      #      #    # 
 #    # #    #  ####    #      #####    #    #  ####  #####  #    # 
 #####  #    #      #   #               #    #      # #      #####  
 #      #    # #    #   #               #    # #    # #      #   #  
 #       ####   ####    #                ####   ####  ###### #    #
*/
router.post("/users", isLoggedOut, (req, res) => {
	const { email, password, firstname, city } = req.body;

	if (!email) {
		return res.status(400).json({ errorMessage: "Please provide your email." });
	}

	if (!firstname) {
		return res
			.status(400)
			.json({ errorMessage: "Please provide your firstname." });
	}

	if (!city) {
		return res.status(400).json({ errorMessage: "Please provide your city." });
	}

	//password policy
	if (password.length < 8) {
		return res.status(400).json({
			errorMessage: "Your password needs to be at least 8 characters long.",
		});
	}

	//   ! This use case is using a regular expression to control for special characters and min length

	const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

	if (!regex.test(password)) {
		return res.status(400).json({
			errorMessage:
				"Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.",
		});
	}

	// Search the database for a user with the username submitted in the form
	User.findOne({ email }).then((found) => {
		// If the user is found, send the message username is taken
		if (found) {
			return res.status(400).json({ errorMessage: "email is  already taken." });
		}

		// if user is not found, create a new user - start with hashing the password
		return bcrypt
			.genSalt(saltRounds)
			.then((salt) => bcrypt.hash(password, salt))
			.then((hashedPassword) => {
				// Create a user and save it in the database
				return User.create({
					email,
					password: hashedPassword,
					firstname,
					city,
				});
			})
			.then((user) => {
				// Bind the user to the session object
				req.session.user = user; // favorites = { nameArt,}, IDlkflkfs
				res.status(201).json(user);
			})
			.catch((error) => {
				if (error instanceof mongoose.Error.ValidationError) {
					return res.status(400).json({ errorMessage: error.message });
				}
				if (error.code === 11000) {
					return res.status(400).json({
						errorMessage:
							"email need to be unique. The email you chose is already in use.",
					});
				}
				return res.status(500).json({ errorMessage: error.message });
			});
	});
});

/*
                                                                                    
 #####   ####   ####  #####              ####  ######  ####   ####  #  ####  #    # 
 #    # #    # #        #               #      #      #      #      # #    # ##   # 
 #    # #    #  ####    #      #####     ####  #####   ####   ####  # #    # # #  # 
 #####  #    #      #   #                    # #           #      # # #    # #  # # 
 #      #    # #    #   #               #    # #      #    # #    # # #    # #   ## 
 #       ####   ####    #                ####  ######  ####   ####  #  ####  #    # 
*/

router.post("/sessions", isLoggedOut, (req, res, next) => {
	const { email, password } = req.body;
	console.log(req.body);
	if (!email) {
		return res.status(400).json({ errorMessage: "Please provide your email." });
	}
	if (!password) {
		return res
			.status(400)
			.json({ errorMessage: "Please provide your password." });
	}

	// Here we use the same logic as above
	// - either length based parameters or we check the strength of a password
	if (password.length < 8) {
		return res.status(400).json({
			errorMessage: "Your password needs to be at least 8 characters long.",
		});
	}

	// Search the database for a user with the username submitted in the form
	User.findOne({ email })
		// !!!!!!!!!refresh the page!!!!!!!!!!!!!!!!
		// need to add the  !!!!!!!!!.populate("favorites")!!!!!!!!!!!!!!!
		.populate("favorites")
		.then((user) => {
			// If the user isn't found, send the message that user provided wrong credentials
			if (!user) {
				return res
					.status(400)
					.json({ errorMessage: "The email already exists." });
			}

			// If user is found based on the username, check if the in putted password matches the one saved in the database
			bcrypt.compare(password, user.password).then((isSamePassword) => {
				if (!isSamePassword) {
					return res.status(400).json({ errorMessage: "Wrong credentials." });
				}
				req.session.user = user;
				// req.session.user = user._id; // ! better and safer but in this case we saving the entire user object
				return res.json(user);
			});
		})

		.catch((err) => {
			// in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
			// you can just as easily run the res.status that is commented out below
			next(err);
			return res.status(500).render("login", { errorMessage: err.message });
		});
});

/*
                                                                   ##                                                    ##   
 #####   ####   ####  #####             ###### #####  # #####     #   #    #  ####  #####    #    #  ####  ###### #####    #  
 #    # #    # #        #               #      #    # #   #      #    ##   # #    #   #      #    # #      #      #    #    # 
 #    # #    #  ####    #      #####    #####  #    # #   #      #    # #  # #    #   #      #    #  ####  #####  #    #    # 
 #####  #    #      #   #               #      #    # #   #      #    #  # # #    #   #      #    #      # #      #    #    # 
 #      #    # #    #   #               #      #    # #   #       #   #   ## #    #   #      #    # #    # #      #    #   #  
 #       ####   ####    #               ###### #####  #   #        ## #    #  ####    #       ####   ####  ###### #####  ##   
                                                                                                                              
*/
router.post("/edit", (req, res, next) => {
	// Check user is logged in
	if (!req.user) {
		res
			.status(401)
			.json({ errorMessage: "You need to be logged in to edit your profile" });
		return;
	}

	// Updating `req.user` with each `req.body` field (excluding some internal fields `cannotUpdateFields`)
	const cannotUpdateFields = ["_id", "password"];
	Object.keys(req.body)
		.filter((key) => cannotUpdateFields.indexOf(key) === -1)
		.forEach((key) => {
			req.user[key] = req.body[key];
		});

	// Validating user with its new values (see: https://mongoosejs.com/docs/validation.html#async-custom-validators)
	req.user.validate(function (error) {
		if (error) {
			// see: https://mongoosejs.com/docs/validation.html#validation-errors
			res.status(400).json({ errorMessage: error.errors });
			return;
		}

		// Validation ok, let save it
		req.user.save(function (err) {
			if (err) {
				res
					.status(500)
					.json({ errorMessage: "Error while saving user into DB." });
				return;
			}

			res.status(200).json(req.user);
		});
	});
});

/*
                                                                                                  
  ####  ###### #####             #       ####   ####   ####  ###### #####      ####  #    # ##### 
 #    # #        #               #      #    # #    # #    # #      #    #    #    # #    #   #   
 #      #####    #      #####    #      #    # #      #      #####  #    #    #    # #    #   #   
 #  ### #        #               #      #    # #  ### #  ### #      #    #    #    # #    #   #   
 #    # #        #               #      #    # #    # #    # #      #    #    #    # #    #   #   
  ####  ######   #               ######  ####   ####   ####  ###### #####      ####   ####    #   
                                                                                                  
*/
router.get("/logout", isLoggedIn, (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({ errorMessage: err.message });
		}
		res.json({ message: "Done" });
	});
});
module.exports = router;
