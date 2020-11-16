const express = require("express");
const data = require('../database');
const passport = require('../passport').passport;
const config = require('../config/configs');

const router = express.Router();



const IsAuth = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

router.get('/profile',IsAuth, (req, res) => {
    if(req.user.admin){
        res.render("profile", {
            username: req.user.username,
            admin: req.user.admin.toString(),
            avatar: "images/admin.jpg"
        });
    }
    else {
        res.render("profile", {
            username: req.user.username,
            admin: req.user.admin.toString(),
            avatar: "images/user.jpg"
        });
    }
})

router.get('/logout', IsAuth, (req, res) => {
    req.logout();
    res.redirect('/');
})

router.get('/',(req, res) => {
    res.render('main', {
        title: "Main page",
        avatar: 'images/van.jpg'
    });
});

router.get('/login', async (req, res) => {
    res.render("login", {
        title: "Login",
        auth: '/login'
    });
});

router.get('/register', async (req,res) => {
    res.render('register', {
        title: "Registration",
        auth: '/register'
    });
});

router.post('/login',passport.authenticate('login',{
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password.'
}));

router.post('/register', passport.authenticate('reg', {
    successRedirect: '/',
    failureRedirect: '/register',
    failureFlash: 'User already exist'
}))

//GRUD

//READ
router.get('/rest_api', IsAuth, (req, res) => {
    if(!req.query.id){
        res.json({success: false, message: "Wrong request(without id)"})
    }
    else{
        data.FindById(req.query.id)
            .then(user => {
                if(user !== undefined && user !== null) {
                    res.json({success: true, username: user.username, admin: user.admin})
                }
                else{
                    res.json({success: false, message: "User does not exist"})
                }
            })
            .catch(e => {
                console.log(e)
                res.json({success: true, message: e.toString()})
            })
    }
})

//DELETE
router.delete('/rest_api',IsAuth ,(req, res) => {
    if(!req.query.id){
        res.json({success: false, message: "Wrong request(without id)"})
    }
    else{
        if(req.user.admin){
            data.FindById(req.query.id)
                .then(user => {
                    if(user !== undefined && user !== null){
                        data.Delete(req.query.id)
                            .then(user => {
                                res.json({success: true})
                            })
                            .catch(e => {
                                console.log("Error: " + e);
                                res.json({success: false, message: e});
                            })
                    }
                    else{
                        res.json({success: false, message: "User does not exist"});
                    }
                })
                .catch(e => {
                    res.json({success: false, message: e.toString()});
                })
        }
        else{
            res.json({success: false, message: "You are not an admin"})
        }
    }
})

//UPDATE
router.put('/rest_api', IsAuth, (req, res) => {
    if(req.query.id && (req.query.username || req.query.password)){
        if(req.user.admin){
            data.FindById(req.query.id)
                .then(user => {
                    let flag = false;
                    if(req.query.username){
                        data.UpdateUsername(req.query.id, req.query.username)
                            .then(user => {
                                flag = true
                            })
                            .catch(e => {
                                res.json({success: false, message: e.toString()});
                            })
                    }
                    if(req.query.password){
                        data.UpdatePassword(req.query.id, req.query.password)
                            .then(user => {
                                flag = true
                            })
                            .catch(e => {
                                res.json({success: false, message: e.toString()});
                            })
                    }
                    res.json({success: true});
                })
                .catch(e => {
                    res.json({success: false, message: e.toString()});
                })
        }
        else{
            res.json({success: false, message: "You are not an admin"})
        }
    }
    else{
        res.json({success: false, message: "Wrong request(without id and username/password)"})
    }
})

//CREATE
router.post('/rest_api', IsAuth, (req, res) => {
    console.log(req.body.username)
    console.log(req.body.password)
    if(req.body.username && req.body.password){
        if(req.user.admin) {
            data.UserExists(req.body.username)
                .then(yes => {
                    if (yes) {
                        res.json({success: false, message: "User exists"})
                    }
                    else{
                        data.CreateUser(req.body.username, req.body.password, config.user)
                            .then(user => {
                                res.json({success: true, message: "New user " + req.body.username})
                            })
                            .catch(e => {
                                res.json({success: false, message: e.toString()});
                            })
                    }
                })
                .catch(e => {
                    res.json({success: false, message: e.toString()})
                })
        }
        else{
            res.json({success: false, message: "You are not an admin"})
        }
    }
    else{
        res.json({success: false, message: "Wrong request(without username and password)"})
    }
})

module.exports = router;