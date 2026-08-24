import bcrypt from "bcryptjs";
import { User, type UserDoc } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { signToken, type Role } from "../middleware/auth.js";

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    phone: user.phone ?? undefined
  };
}

export async function signup(params: { name: string; email: string; password: string; phone?: string }) {
  const existing = await User.findOne({ email: params.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }
  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const user = await User.create({
    name: params.name,
    email: params.email.toLowerCase(),
    passwordHash,
    phone: params.phone,
    role: "user"
  });
  const token = signToken({ id: user._id.toString(), role: "user" });
  return { token, user: toPublicUser(user) };
}

export async function login(params: { email: string; password: string }) {
  const user = await User.findOne({ email: params.email.toLowerCase() });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const matches = await bcrypt.compare(params.password, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const token = signToken({ id: user._id.toString(), role: user.role as Role });
  return { token, user: toPublicUser(user) };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return toPublicUser(user);
}

export async function adminBootstrap(params: {
  name: string;
  email: string;
  password: string;
  callerRole?: Role;
  suppliedSecret?: string;
  expectedSecret: string;
}) {
  const adminExists = await User.exists({ role: "admin" });

  const authorizedByCaller = params.callerRole === "admin";
  const authorizedBySecret =
    !adminExists && !!params.expectedSecret && params.suppliedSecret === params.expectedSecret;

  if (!authorizedByCaller && !authorizedBySecret) {
    throw ApiError.forbidden("Not authorized to create an admin account");
  }

  const existing = await User.findOne({ email: params.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }
  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const user = await User.create({
    name: params.name,
    email: params.email.toLowerCase(),
    passwordHash,
    role: "admin"
  });
  return toPublicUser(user);
}
