const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const { Pool } = require("pg");

// const pool = new Pool({
//   user: process.env.PGUSER,
//   host: process.env.PGHOST,
//   database: process.env.PGDATABASE,
//   password: process.env.PGPASSWORD,
//   port: process.env.PGPORT,
// });

const pool = new Pool({
  connectionString:
    "postgres://default:1eQyKahT3IDs@ep-flat-feather-a4ptshbs.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require",
});

const app = express();

// Increase the request body size limit (e.g., 10MB)
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));

// Middleware to enable CORS
app.use((req, res, next) => {
  // Set the Access-Control-Allow-Origin header to allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Set other CORS headers as needed
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Call next middleware in the chain
  next();
});

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const tableName = "prawn_products";

  try {
    // Execute the query using the pool connection
    const result = await pool.query(`SELECT * FROM ${tableName}`);

    // Extract column names from the query result
    const columnNames = result.rows;

    res.json(columnNames);
  } catch (error) {
    // Handle any errors
    console.error("Error retrieving column names:", error);
    throw error;
  }
});

app.post("/get_table", async (req, res) => {
  const { tableName } = req.body;

  try {
    // Execute the query using the pool connection
    const result = await pool.query(`SELECT * FROM ${tableName}`);

    // Extract column names from the query result
    const columnNames = result.rows;

    res.json(columnNames);
  } catch (error) {
    // Handle any errors
    console.error("Error retrieving column names:", error);
    throw error;
  }
});

app.post("/clear_table", async (req, res) => {
  const { tableName } = req.body;

  try {
    const result = await pool.query(`TRUNCATE TABLE ${tableName}`);

    res.json(result);
  } catch (error) {
    console.error(`Error truncating table ${tableName}:`, error);
    throw error;
  }
});

app.post("/delete_table", async (req, res) => {
  const { tableName } = req.body;

  try {
    const result = await pool.query(`DROP TABLE ${tableName}`);

    res.json({ message: `Table ${tableName} deleted successfully`, result });
  } catch (error) {
    console.error(`Error deleting table ${tableName}:`, error);
    res.status(500).json({ error: `Error deleting table ${tableName}` });
  }
});

// Post request to get column names
app.post("/get_column_names", async (req, res) => {
  const { tableName } = req.body;

  try {
    // Query to retrieve column names from information schema
    const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
  `;

    // Execute the query using the pool connection
    const result = await pool.query(query, [tableName]);

    // Extract column names from the query result
    const columnNames = result.rows.map((row) => row.column_name);

    res.json(columnNames);
  } catch (error) {
    // Handle any errors
    console.error("Error retrieving column names:", error);
    throw error;
  }
});

// POST request to get product data (a row from a certain table)
app.post("/get_product_data", async (req, res) => {
  const { tableName, productName } = req.body;

  try {
    // Database query to retrieve the specified row from the table with
    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE name = $1`,
      [productName]
    );
    const data = result.rows[0];

    // Send response
    res.json(data);
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

app.post("/get_products", async (req, res) => {
  const { tableName, category } = req.body;

  try {
    // Database query to retrieve the specified row from the table with an additional category condition
    const result = await pool.query(
      `SELECT * FROM ${tableName} WHERE category = $1`,
      [category]
    );

    // Send response
    res.json(result.rows);
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

// POST request handler to retrieve a column from a table
app.post("/get_column", async (req, res) => {
  const { tableName, columnNames } = req.body;

  try {
    // Database query to retrieve the specified column from the table
    const result = await pool.query(
      `SELECT ${columnNames.join(", ")} FROM ${tableName}`
    );
    const data = result.rows;

    // Send response
    res.json(data);
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

// POST request handler to retrieve a column from a table
app.post("/get_category", async (req, res) => {
  const { tableName, columnName, productName } = req.body;

  try {
    // Database query to retrieve the specified column from the table
    const result = await pool.query(
      `SELECT ${columnName} FROM ${tableName} WHERE name = $1`,
      [productName]
    );
    const data = result.rows;

    // Send response
    res.json(data);
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

// POST request handler to retrieve a column from a table
app.post("/get_property", async (req, res) => {
  const { tableName, columnName, productName, category } = req.body;

  try {
    // Database query to retrieve the specified column from the table
    const result = await pool.query(
      `SELECT ${columnName} FROM ${tableName} WHERE name = $1 AND category = $2`,
      [productName, category]
    );
    const data = result.rows;

    // Send response
    res.json(data);
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

app.post("/update_property", async (req, res) => {
  const { tableName, columnName, productName, newValue } = req.body;
  console.log(tableName, columnName, productName, newValue.length);

  try {
    const result = await pool.query(
      `UPDATE ${tableName} SET ${columnName} = $1 WHERE name = $2`,
      [newValue, productName]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query", err.stack);
  }
});

app.post("/upload_image", async (req, res) => {
  const { tableName, imageUrl } = req.body;

  try {
    // Database query to retrieve the specified column from the table
    const result = await pool.query(
      `INSERT INTO ${tableName} (image) VALUES ($1)`,
      [imageUrl]
    );

    // Send response
    res.json("image uploaded");
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

// POST request handler to retrieve a categories a table
app.post("/get_categories", async (req, res) => {
  const { tableName } = req.body;

  try {
    // Database query to retrieve the specified column from the table
    const result = await pool.query(`SELECT category FROM ${tableName}`);
    const data = result.rows;

    // Send response
    res.json(data);
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ message: "Failed to fetch data from database" });
  }
});

const port = 3000;

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
