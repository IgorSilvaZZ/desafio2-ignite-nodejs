import request from "supertest";
import { Connection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Create Statement Controller", () => {
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

  it("Should be able create deposit statement", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest",
    });

    const { token } = responseAuth.body;

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 250,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(250);
    expect(response.status).toBe(201);
  });

  it("Should be able create withdraw statement", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest",
    });

    const { token } = responseAuth.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 250,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "Test Withdraw",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toBe(100);
    expect(response.status).toBe(201);
  });

  it("Should not be able create withdraw with amount insufficient", async () => {
    await request(app).post("/api/v1/users").send({
      name: "User Test",
      email: "user@dev.com.br",
      password: "userTest",
    });

    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "user@dev.com.br",
      password: "userTest",
    });

    const { token } = responseAuth.body;

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 300,
        description: "Test Withdraw",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(400);
  });

  it("Should not be able create deposit statement with user not exists", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 250,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer token_is_not_exists`,
      });

    expect(response.status).toBe(401);
  });
});
