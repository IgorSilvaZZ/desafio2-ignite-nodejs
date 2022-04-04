import request from "supertest";
import { Connection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Get Statement Operation Controller", () => {
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

  it("Should be able get statement operation", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest",
    });

    const { token } = responseAuth.body;

    const responseDeposit = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 250,
        description: "Test Deposit",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "Test Withdraw",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .get(`/api/v1/statements/${responseDeposit.body.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(responseDeposit.body.id);
    expect(response.status).toBe(200);
  });

  it("Should not be able get statement with operation not exists", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest",
    });

    const { token } = responseAuth.body;

    const response = await request(app)
      .get(`/api/v1/statements/daa37906-c028-4d56-8c3b-cb53f4aec281`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.body.message).toBe("Statement not found");
    expect(response.status).toBe(404);
  });
});
