import request from "supertest";
import { Connection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuid();

    const password = await hash("userTest", 8);

    await connection.query(`
                insert into users (id, name, email, password, created_at, updated_at) 
                values ('${id}', 'user', 'user@test.com.br', '${password}', now(), now())
        `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able get balance a user", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest",
    });

    const { token } = responseAuth.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 150,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(150);
  });

  it("Should not be able get balance with user not exists", async () => {
    const response = await request(app).get("/api/v1/statements/balance").set({
      Authorization: `Bearer token_is_invalid`,
    });

    expect(response.status).toBe(401);
  });
});
