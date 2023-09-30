const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')("sk_test_51NFaHHHYxG7WJPCTo6DyF8n9Ty7LHso58T2LKEWbMN1RnwDs6Vdb8c1AIEk6ywGP4JAayNmD8PMlNtmwQBIsvcjK00SvyfXze0")
var jwt = require('jsonwebtoken');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000

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
const enrolledCollaction = client.db('visual').collection('enrolled')

const verifyJwt = (req, res, next) => {
    console.log('hwt verify func hitting')
    const token = req.headers.authorization
    if (!token) {
        return res.status(401).send({ error: true, message: "unauthorizde access" })
    }

    jwt.verify(token, accessToken, (error, decode) => {
        if (error) {
            return res.status(403).send({ error: true, message: 'unauthorized access' })
        }
        req.decode = decode
        next()
    })

}
async function run() {
    try {
        //await client.connect();

        app.get('/data', async (req, res) => {
            let query = {}
            if (req.query.email) {
                query = { email: req.query.email }
            }
            if (req.query.search) {
                query = { name: { $regex: req.query.search, $options: 'i' } }
            }
            const data = await courseDataCollaction.find(query).toArray()
            res.send(data)
        })

        app.post('/data', async (req, res) => {
            const data = req.body
            const response = await courseDataCollaction.insertOne(data)
            res.send(response)
        })

        app.delete('/data/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const delet = await courseDataCollaction.deleteOne(id)
            res.send(delet)
        })

        app.get('/data/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const data = await courseDataCollaction.findOne(id)
            res.send(data)
        })

        app.patch("/data/:id", async (req, res) => {
            const data = req.body;
            const id = { _id: new ObjectId(req.params.id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: data.className,
                    price: data.classPrice,
                    thumbnail : data.videoLink,
                    img: data.image,
                },
            };
            const result = await courseDataCollaction.updateOne(id, updateDoc, options);
            res.send(result);
        });

        app.post('/savecourse', async (req, res) => {
            const added = await saveCourseCollaction.insertOne(req.body)
            res.send(added)
        })

        app.post('/user', async (req, res) => {
            const user = await userCollaction.insertOne(req.body)
            res.send(user)
        })

        app.get('/user', async (req, res) => {
            const email = { email: req.query.email }
            const user = await userCollaction.findOne(email)
            res.send(user)
        })


        app.get('/savecourse', verifyJwt, async (req, res) => {
            console.log(req.decode)
            const query = { email: req.query.email }
            const data = await saveCourseCollaction.find(query).toArray()
            res.send(data)
        })

        app.delete('/savecourse/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const data = await saveCourseCollaction.deleteOne(id)
            res.send(data)
        })

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, accessToken, { expiresIn: '1h' })
            res.send({ refreshToken: token })
        })

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: price * 100,
                currency: "bdt",
                payment_method_types: ["card"],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/enrolled', async (req, res) => {
            const id = { _id: new ObjectId(req.body.id) }
            const data = await courseDataCollaction.findOne(id)
            const object = {
                userEmail: req.body.UserEmail,
                ...data
            }
            const response = await enrolledCollaction.insertOne(object)
            res.send(response)
        })

        app.get('/enrolled', async (req, res) => {
            const query = { userEmail: req.query.email }
            const data = await enrolledCollaction.find(query).toArray()
            res.send(data)
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
