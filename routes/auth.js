const express = require('express')

const router = express.Router()

const mongoose = require('mongoose')

const bcrypt = require("bcryptjs")

const User = mongoose.model("User")

const crypto = require('crypto')

const jwt = require("jsonwebtoken")

const {JWT_SECRET} = require('../config/keys')

const requireLogin = require('../middleware/requireLogin')

const nodemailer = require('nodemailer')

const sendgridTransport = require('nodemailer-sendgrid-transport')

//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

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key:"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"
    }
}))



router.post('/signup',(req,res)=>{
    const {name,email,password,pic} = req.body
    if(!email || !password || !name){
        return res.status(422).json({error:"please add all the fields"})
    }
    //res.json({message:"successfully posted"})

    User.findOne({email:email})
    .then((savedUser)=>{
        if(savedUser){
            return res.status(422).json({error:"user already exists with that email"})
        }
        bcrypt.hash(password,12)
        .then(hashedpassword=>{

            const user = new User({
                email,
                password:hashedpassword,
                name,
                pic
            })
    
            user.save()
            .then(user=>{
                transporter.sendMail({
                    to:user.email,
                    from:"no-reply@bunny.com",
                    Subject:"signup success",
                    html:"<h1>Welcome to insta world</h1>"
                })
                res.json({message:"saved successfully"})
            })
            .catch(err=>{
                console.log(err)
            })

        })
       
    })
    .catch(err=>{
        console.log(err)
    })
    
})


router.post('/signin',(req,res)=>{
    const {email,password} = req.body

    if(!email || !password){
        return res.status(422).json({error:"please add email or password"})
    }
    User.findOne({email:email})
    .then(savedUser =>{
        if(!savedUser){
            return res.status(422).json({error:"Invalid Email or password"})
        }

        bcrypt.compare(password,savedUser.password)
        .then(doMatch=>{
            if(doMatch){
                //res.json({message:"successfully signed in"})
                const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
                const {_id,name,email,followers,following,pic}  = savedUser
                res.json({token,user:{_id,name,email,followers,following,pic}})
            }
            else{
                return res.status(422).json({error:"Invalid Email or password"})
            }
        }).catch(err=>{
            console.log("err",err)
        })
    }).catch(err=>{
        console.log('err',err)
    })
})

router.post('/reset-password',(req,res)=>{
       crypto.randomBytes(32,(err,buffer)=>{
           if(err){
               console.log(err)

           }

           const token = buffer.toString("hex")
           User.findOne({email:req.body.email})
           .then(user=>{
               if(!user){
                   return res.status(422).json({error:"User dont exists with that email"})
               }
               user.resetToken = token
               user.expireToken = Date.now() + 3600000
               user.save().then((result)=>{
                   transporter.sendMail({
                       to:user.email,
                       from:"no-reply@insta.com",
                       subject:"password reset",
                       html:`
                       <p> you requested for password reset</p>
                       <h5>click in this <a href="http://localhost:3000/reset/${token}">LINK</a>LINK to reset password</h5>
                       `
                   })
                   res.json({message:"check your email"})
               })
           })
       })
})

module.exports = router