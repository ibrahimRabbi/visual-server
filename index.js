const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000
var jwt = require('jsonwebtoken');
//middlewere
app.use(express.json())
app.use(cors())

const accessToken = "11b9f30ffe457554a235d7011288010a3ac858fbbce0b5e3690e41386f14b8c6f54c7466df42066dbb7d66f3a3b40d5352c99badad7914f1813d26aaf2aa033d"



const name = process.env.MONGO_USER
const password = process.env.MONGP_PASS
const uri = `mongodb+srv://${name}:${password}@cluster0.oqkryfl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const courseDataCollaction = client.db('visual').collection('courses')
const saveCourseCollaction = client.db('visual').collection('saveCourses')
const userCollaction = client.db('visual').collection('users')

const verifyJwt = (req,res,next) => {
    console.log('hwt verify func hitting')
    const token = req.headers.authorization
    if (!token) {
        return res.status(401).send({error:true,message:"unauthorizde access"})
    }

    jwt.verify(token, accessToken, (error, decode) => {
        if (error) {
            return req.status(403).send({error:true,message:'unauthorized access'})
        }
        req.decode = decode
        next()
    })

}
async function run() {
    try {
        await client.connect();

        app.get('/data', async (req, res) => {
            const data = await courseDataCollaction.find().toArray()
            res.send(data)
        })

        app.get('/data/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const data = await courseDataCollaction.findOne(id)
            res.send(data)
        })

        app.post('/savecourse', async (req, res) => {
            const added = await saveCourseCollaction.insertOne(req.body)
            res.send(added)
        })

        app.post('/user', async (req, res) => {
            const user = await userCollaction.insertOne(req.body)
            res.send(user)
        })

        app.get('/savecourse', verifyJwt, async (req, res) => {
            console.log(req.decode)
            const query = { email: req.query.email }
            const data = await saveCourseCollaction.find(query).toArray()
            res.send(data)
        })

        app.delete('/savecourse/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id)}
            const data = await saveCourseCollaction.deleteOne(id)
            res.send(data)
        })

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, accessToken,{ expiresIn: '1h' })
            res.send({refreshToken:token})
        })

    } finally {
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('hello world')
})

app.listen(port, () => {
    console.log('your app is running')
})
