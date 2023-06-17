const express = require('express');
const cors = require('cors');
const app=express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port=process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT=(req,res,next)=>{
  const authorization =req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message:'unauthorized access'});
  }
  // bearer token
  const token =authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      return res.status(401).send({error:true, message:'unauthorized access'})
    }
    req.decoded=decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.syvc8b9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classCollection=client.db("schoolDb").collection("classes");
    const reviewCollection=client.db("schoolDb").collection("reviews");
    const usersCollection=client.db("schoolDb").collection("users");
    const selectedClassCollection=client.db("schoolDb").collection("selectedClass");

    // create jwt token
    app.post('/jwt', (req,res)=>{
      const user=req.body;
      const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'2h'});
      res.send({token})
    })

    // create user api
    app.get('/users', async(req,res)=>{
      const result=await usersCollection.find().toArray();
      res.send(result);
    })

    // delete user
    app.delete('/users/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    app.post('/users', async(req,res)=>{
      const user=req.body;
      console.log(user)
      const query={email:user.email}
      const existingUser =await usersCollection.findOne(query);
      console.log('existing User :',existingUser);
      if(existingUser){
        return res.send({message:'user already exists'})
      }
      const result=await usersCollection.insertOne(user);
      res.send(result);
    })

    app.get('/classes', async(req,res)=>{
      const result=await classCollection.find().toArray();
      res.send(result);
    })

    app.get('/reviews', async(req,res)=>{
      const result=await reviewCollection.find().toArray();
      res.send(result);
    })

    // make admin
    app.patch('/users/admin/:id', async(req,res)=>{
      const id=req.params.id;
      const filter= {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result =await usersCollection.updateOne(filter,updateDoc);
      res.send(result);
    })
    
    app.patch('/users/instructor/:id', async(req,res)=>{
      const id=req.params.id;
      const filter= {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role:'instructor'
        },
      };
      const result =await usersCollection.updateOne(filter,updateDoc);
      res.send(result);
    })
    
    // selected classes
    app.get('/myClasses', async(req,res)=>{
      const email=req.query.email;
      console.log(email);
      if(!email){
        res.send([]);
      }
      const query={email:email};
      const result=await selectedClassCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/myClasses', async(req,res)=>{
      const selectedClass=req.body;
      console.log(selectedClass);
      const result=await selectedClassCollection.insertOne(selectedClass);
      res.send(result);
    })

    app.delete('/myClasses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
  res.send('School is running');
})
app.listen(port, ()=>{
  console.log(`Summer Camp School is Running on port : ${port}`);
})