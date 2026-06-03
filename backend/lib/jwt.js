import jwt from "jsonwebtoken";

const collectSecrets = (primary, previous) => {
  const secrets = [];
  if (primary) secrets.push(primary);
  if (previous) secrets.push(previous);
  return secrets;
};

export const getAccessTokenSecrets = () =>
  collectSecrets(
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_SECRET_PREVIOUS,
  );

export const getRefreshTokenSecrets = () =>
  collectSecrets(
    process.env.REFRESH_TOKEN_SECRET,
    process.env.REFRESH_TOKEN_SECRET_PREVIOUS,
  );

export const verifyWithSecretRotation = (token, secrets, options = {}) => {
  let lastError;

  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret, options);
    } catch (error) {
      lastError = error;
      if (error.name === "TokenExpiredError") {
        throw error;
      }
    }
  }

  throw lastError || new Error("Invalid token");
};

export const signAccessToken = (payload) => {
  const [secret] = getAccessTokenSecrets();
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

export const signRefreshToken = (payload) => {
  const [secret] = getRefreshTokenSecrets();
  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
