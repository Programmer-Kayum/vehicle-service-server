const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0jck.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // **********************************************************************************
    const servicesCollection = client.db("VehicleDB").collection("services");
    const bookingCollection = client.db("VehicleDB").collection("booking");

    // **********************************************************************************
    //JWT section*****************

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send({ success: true });
    });

    //services section*******************
    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    // Order section****************************************************
    app.post("/booking", async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      const result = await bookingCollection.insertOne(newUser);
      res.send(result);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
    });

    app.get("/booking", async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //Query section***************

    app.get("/bookings", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // Delete order ************************
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);

      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Delete all orders***************

    // Route to delete all orders and check remaining
    app.delete("/bookings", async (req, res) => {
      try {
        // Delete all orders
        const deleteResult = await bookingCollection.deleteMany({});

        // Check remaining orders in the collection
        const remainingCount = await bookingCollection.countDocuments();

        res.status(200).send({
          message: "All orders deleted successfully",
          deletedCount: deleteResult.deletedCount,
          remainingOrders: remainingCount,
        });
      } catch (error) {
        res.status(500).send({ message: "Failed to delete orders", error });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server-one is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
