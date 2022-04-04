import request from "supertest";
import { Connection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Authenticate User Controller", () => {
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

  it("Should be able authenticate user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest",
    });

    expect(response.status).toBe(200);
  });

  it("Should not be able authenticate user with email incorrect", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "user_incorrect_email@test.com.br",
      password: "userTest",
    });

    expect(response.status).toBe(401);
  });

  it("Should not be able authenticate user with password incorrect", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "user@test.com.br",
      password: "userTest123",
    });

    expect(response.status).toBe(401);
  });
});
