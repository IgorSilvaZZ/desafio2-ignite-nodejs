import request from "supertest";
import { Connection } from "typeorm";
import { hash } from "bcryptjs";

import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should ble able to create a new user", async () => {
    const password = await hash("userTest", 8);

    const response = await request(app).post("/api/v1/users").send({
      name: "User Test",
      email: "user@test.com.br",
      password,
    });

    expect(response.status).toBe(201);
  });

  it("Should not able to create a new user with email exists", async () => {
    const password = await hash("userTest", 8);

    await request(app).post("/api/v1/users").send({
      name: "User Test",
      email: "user@test.com.br",
      password,
    });

    const response = await request(app).post("/api/v1/users").send({
      name: "User Test",
      email: "user@test.com.br",
      password,
    });

    expect(response.status).toBe(400);
  });
});
