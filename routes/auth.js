const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//REGISTER
router.post("/register", async (req, res) => {
    const newUser= new User({
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(
            req.body.password,
            process.env.PASS_SEC
            ).toString(),
    });

    try{
        const savedUser = await newUser.save();
        res.status(201).json(savedUser)
    }
    catch(err){
        res.status(500).json(err.message)
    }

})

//LOGIN
router.post("/login", async (req, res) => {
    try{
        // Getting the user details from DB
        const user = await User.findOne({username: req.body.username});

        // Checking whether entered username is correct or not
        !user && res.status(401).json("Wrong username");

        // Decrypting Password
        const hashedPassword = CryptoJS.AES.decrypt(
            user.password, 
            process.env.PASS_SEC
            );
        const OriginalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

        // Checking whether entered password is correct or not
        OriginalPassword !== req.body.password && res.status(401).json("Wrong password");

        // JWT Token
        const accessToken = jwt.sign(

            {
                id: user._id,
                isAdmin: user.isAdmin,
            },

            process.env.JWT_SEC,

            {
                expiresIn:"3d"
            }
        );
        
        // Object destructuring such that password is not passed as res
        const {password, ...others} = user._doc;
        
        // if everything is correct return user details
        res.status(200).json({...others, accessToken});

    }
    catch(err){
        res.status(500).json(err);
    }
})

module.exports = router