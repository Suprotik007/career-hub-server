const express =require('express')
const cors=require('cors')
require('dotenv').config()
const app =express()
const jwt=require('jsonwebtoken')
const cookieParser =require('cookie-parser')
const port=process.env.PORT ||3000
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true


}))
app.use(express.json())
app.use(cookieParser())
const logger=(req,res,next)=>{
  console.log('inside logger');
  next()
  
}
const verifyToken=(req,res,next)=>{
  const token=req?.cookies?.token
  console.log('cookies in the md',token);
  if(!token){
    return res.status(401).send({message:'unauth access'})
  }

  jwt.verify(token,process.env.DB_SECRET,(err,decoded)=>{
    if(err){
   return res.status(401).send({message:'unauth access'})
    }
    req.decoded=decoded
    console.log(decoded);
    next()
  })
  next()
  
}

app.get('/',(req,res)=>{
    res.send('career cooking')
})
app.listen(port,()=>{
    console.log(`server${port}`);
    
})





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8n6fjbk.mongodb.net/?retryWrites=true&w=majority&appName=cluster0`;

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

    const jobsCollection=client.db('career-code').collection('job-collection')
    const applicationsCollection=client.db('career-code').collection('application-collection')

    // jwt

     app.post('/jwt',async(req,res)=>{
     const {email}=req.body
     const user={email}
     const token=jwt.sign(user,process.env.DB_SECRET,{expiresIn:'1h'})
     res.cookie('token',token,{
      httpOnly:true,
      secure:false
     })
     res.send({success:true})
      
    })


    app.get('/jobs',async(req,res)=>{
        const cursor=jobsCollection.find()
        const result=await cursor.toArray()
        res.send(result)
    })

    app.get('/jobs/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id)}
      const result=await jobsCollection.findOne(query)
      res.send(result)

    })
    app.post('/jobs',async(req,res)=>{
      const newJob=req.body
      console.log(newJob)
      const result=await jobsCollection.insertOne(newJob)
      res.send(result)
      
    })

    app.get('/applications/job/:job_id',async(req,res)=>{
      const job_id=req.params.job_id
      const query={jobId:job_id}
      const result=await applicationsCollection.find(query).toArray()
      res.send(result)
    })
    app.post('/applications',async(req,res)=>{
      const application=req.body
      console.log(application);
      
      const result=await applicationsCollection.insertOne(application)
      res.send(result)
    })

    app.get('/applications',logger,async(req,res)=>{
      const email=req.query.email
      console.log('inside',req.cookies);
      
      const query={  
        applicant:email
      }
      const result=await applicationsCollection.find(query).toArray()

      for (const application of result){
        const jobId=application.jobId
        const jobQuery={_id: new ObjectId(jobId)}
        const job = await jobsCollection.findOne(jobQuery)
        application.company=job.company
        application.company_logo=job.company_logo
      }
      res.send(result)
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
