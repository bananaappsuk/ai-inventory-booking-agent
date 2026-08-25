import bcrypt from "bcryptjs";
import { User, type UserDoc } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { signToken, type Role } from "../middleware/auth.js";
import { notify } from "./notification.service.js";

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  status: "pending" | "approved" | "rejected";
}

function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    phone: user.phone ?? undefined,
    status: user.status as "pending" | "approved" | "rejected"
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
    role: "user",
    status: "pending"
  });

  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin._id.toString(),
        type: "user_signup_admin_alert",
        title: "New user awaiting approval",
        message: `${params.name} (${params.email}) signed up and needs approval before they can log in.`
      })
    )
  );

  return { pending: true as const, message: "Your account has been created and is awaiting admin approval." };
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
  if (user.status === "pending") {
    throw ApiError.forbidden("Your account is awaiting admin approval");
  }
  if (user.status === "rejected") {
    throw ApiError.forbidden("Your signup request was rejected. Contact an admin for details.");
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
    role: "admin",
    status: "approved"
  });
  return toPublicUser(user);
}

export async function listPendingUsers() {
  const users = await User.find({ status: "pending" }).sort({ createdAt: 1 });
  return users.map(toPublicUser);
}

export async function approveUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.status !== "pending") throw ApiError.conflict("Only pending users can be approved");

  user.status = "approved";
  await user.save();

  await notify({
    userId: user._id.toString(),
    type: "user_approved",
    title: "Account approved",
    message: "Your account has been approved. You can now log in."
  });

  return toPublicUser(user);
}

export async function rejectUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.status !== "pending") throw ApiError.conflict("Only pending users can be rejected");

  user.status = "rejected";
  await user.save();

  await notify({
    userId: user._id.toString(),
    type: "user_rejected",
    title: "Account request rejected",
    message: "Your signup request was rejected. Contact an admin for details."
  });

  return toPublicUser(user);
}
