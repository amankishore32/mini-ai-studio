import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { login, signUp } from "../src/controllers/auth.controller";

// Mock dependencies
jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller Integration Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let prismaClient: any;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup Prisma mock
    prismaClient = new PrismaClient();

    // Setup Express response mock
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Setup JWT secret
    process.env.JWT_SECRET = "test_secret_key";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe("signUp", () => {
    it("should create a new user successfully", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
      prismaClient.user.create.mockResolvedValue(mockUser);

      await signUp(mockRequest as Request, mockResponse as Response);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@example.com",
          password: "hashed_password",
        },
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "User created successfully",
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          createdAt: mockUser.createdAt,
        },
      });
    });

    it("should return 409 if user already exists", async () => {
      const existingUser = {
        id: 1,
        email: "existing@example.com",
        name: "Existing User",
        password: "hashed",
      };

      mockRequest = {
        body: {
          name: "New User",
          email: "existing@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockResolvedValue(existingUser);

      await signUp(mockRequest as Request, mockResponse as Response);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
      });
      expect(prismaClient.user.create).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ message: "User already exists" });
    });

    it("should return 500 on database error", async () => {
      mockRequest = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockRejectedValue(new Error("DB Error"));

      await signUp(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = {
        body: {
          email: "john@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock_jwt_token");

      await login(mockRequest as Request, mockResponse as Response);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password");
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: "john@example.com" },
        "test_secret_key",
        { expiresIn: "1h" }
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Login successful",
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          updatedAt: mockUser.updatedAt,
          token: "mock_jwt_token",
        },
      });
    });

    it("should return 404 if user not found", async () => {
      mockRequest = {
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "nonexistent@example.com" },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 401 with invalid password", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest = {
        body: {
          email: "john@example.com",
          password: "wrong_password",
        },
      };

      prismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("wrong_password", "hashed_password");
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 500 on database error", async () => {
      mockRequest = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockRejectedValue(new Error("DB Error"));

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Internal server error" });
    });

    it("should handle bcrypt comparison error", async () => {
      const mockUser = {
        id: 1,
        email: "john@example.com",
        password: "hashed_password",
      };

      mockRequest = {
        body: {
          email: "john@example.com",
          password: "password123",
        },
      };

      prismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error("Bcrypt error"));

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });
});
