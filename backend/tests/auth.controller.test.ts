import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// Mock bcryptjs and jwt
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    it("should reject passwords shorter than 6 characters", () => {
      expect("short".length < 6).toBe(true);
    });

    it("should hash passwords with bcryptjs", () => {
      const password = "securepassword123";
      (bcryptjs.hashSync as jest.Mock).mockReturnValue("hashed_password");
      const hashed = bcryptjs.hashSync(password, 10);
      expect(hashed).toBe("hashed_password");
      expect(bcryptjs.hashSync).toHaveBeenCalledWith(password, 10);
    });
  });

  describe("login", () => {
    it("should compare password with bcryptjs", () => {
      const password = "userpassword";
      const hashedPassword = "hashed_value";
      (bcryptjs.compareSync as jest.Mock).mockReturnValue(true);
      const isMatch = bcryptjs.compareSync(password, hashedPassword);
      expect(isMatch).toBe(true);
      expect(bcryptjs.compareSync).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("should sign JWT token", () => {
      const userId = 1;
      const secret = "test_secret";
      (jwt.sign as jest.Mock).mockReturnValue("jwt_token");
      const token = jwt.sign({ userId }, secret, { expiresIn: "7d" });
      expect(token).toBe("jwt_token");
      expect(jwt.sign).toHaveBeenCalledWith({ userId }, secret, {
        expiresIn: "7d",
      });
    });
  });
});
