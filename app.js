const express = require('express')

const app = express()

const PORT = process.env.PORT || 5000

const mongoose = require('mongoose')

const {MONGOURI} = require('./config/keys')



mongoose.connect(MONGOURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true

})

mongoose.connection.on('connected',()=>{
    console.log("connected to mongo cool!!!")
})
mongoose.connection.on('error',(err)=>{
    console.log("err connecting",err)
})
//models
require('./models/user')  //register models(after connection got established)
require('./models/post')  //register models(after connection got established)

app.use(express.json())  //parse the json(middleware)

//routes

app.use(require('./routes/auth'))  //register routes(middleware)
app.use(require('./routes/post'))  //register routes(middleware)
app.use(require('./routes/user'))  //register routes(middleware)

if(process.env.NODE_ENV=="production"){
    app.use(express.static('client/build'))
    const path = require("path")
    app.get('*',(req,res)=>{
        res.sendFile(path.resolve(__dirname,'client','build','index.html'))
    })
}


app.listen(PORT,()=>{
    console.log("server is running",PORT)
})