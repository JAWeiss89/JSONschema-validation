process.env.NODE_ENV= "test"; // This ensures we use test database. 

const request = require("supertest");
const app = require("../app");
const db = require("../db");

// ===============================
//   TEST SET UP 
// ===============================

// Set up inserts one book into database

let testBook;


beforeEach( async ()=> {
    let results = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('111000333', 'amazon.com', 'Daffy Duck', 'English', 123, 'Looney Tunes', 'Space Jam', 1998)
        RETURNING *`);
    testBook = results.rows[0];
    
})

// ===============================
//   TESTS
// ===============================

describe("GET /books", () => {
    test("Gets all books", async() => {
        const res = await request(app).get("/books");
        expect(res.statusCode).toBe(200);
        expect(res.body.books).toHaveLength(1);
        expect(res.body.books).toContainEqual(testBook);
    })
})

describe("POST /books", () => {
    test("Adds book in correct format to database", async() => {
        const bodyReq ={
            "book" : {
                "isbn": "5125734717",
                "amazon_url": "amazonprime.com",
                "author": "Bugs Bunny",
                "language": "spanish",
                "pages": 100,
                "publisher": "Warner Bros Ent",
                "title": "The Bugz",
                "year": 2000
            }
        }
        const res = await request(app).post("/books").send(bodyReq);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(bodyReq);
    })

    test("Returns 2 errors when 2 properties in book have incorrect format", async() => {
        const bodyReq ={
            "book" : {
                "isbn": "5125734717",
                "amazon_url": "amazonprime.com",
                "author": 123,
                "language": "spanish",
                "pages": "three",
                "publisher": "Warner Bros Ent",
                "title": "The Bugz",
                "year": 2000
            }
        }
        const res = await request(app).post("/books").send(bodyReq);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toHaveLength(2);
    })
    test("Returns error when missing value from request body", async() => {
        const bodyReq ={
            "book" : {
                "isbn": "5125734717",
                "amazon_url": "amazonprime.com",
                "author": "Hello",
                "language": "spanish",
                // "author" : "Sylvester Cat",
                "publisher": "Warner Bros Ent",
                "title": "The Bugz",
                "year": 2000
            }
        }
        const res = await request(app).post("/books").send(bodyReq);
        expect(res.statusCode).toBe(400);
    })
})

describe("PUT /books", () => {
    test("Book updates correctly when req body format is correct", async () => {
        const bodyReq ={
            "book" : {
                "isbn": "111000333",
                "amazon_url": "amazonprime.com",
                "author": "Bugs Bunny",
                "language": "spanish",
                "pages": 100,
                "publisher": "Warner Bros Ent",
                "title": "The Bugz",
                "year": 2000
            }
        }
        const res = await request(app).put(`/books/${testBook.isbn}`).send(bodyReq);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(bodyReq);
    })
    test("Returns error when req body is missing data", async () => {
        const bodyReq ={
            "book" : {
                "isbn": "111000333",
                "amazon_url": "amazonprime.com",
                // "author": "Bugs Bunny",
                "language": "spanish",
                "pages": 100,
                "publisher": "Warner Bros Ent",
                "title": "The Bugz",
                "year": 2000
            }
        }
        const res = await request(app).put(`/books/${testBook.isbn}`).send(bodyReq);
        expect(res.statusCode).toBe(400);
    })
})


// ===============================
//   TEST TEAR DOWN
// ===============================

afterEach(async function() {
    // delete entry made in set up
    await db.query(`DELETE FROM books WHERE isbn='111000333'`);
    await db.query(`DELETE FROM books WHERE isbn='5125734717'`);
})

afterAll(async function() {


    // close db connection
    await db.end();
});