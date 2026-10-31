import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { IUser, User } from '../models/User.js';

export async function loginUser(email: string, password: string): Promise<{ user: IUser; token: string }> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    const error: any = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error: any = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
}

export async function getMe(userId: string): Promise<IUser | null> {
  return User.findById(userId).select('-passwordHash');
}

export async function ensureInitialOwner(): Promise<void> {
  const count = await User.countDocuments();
  if (count === 0) {
    const { INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = env;
    if (!INITIAL_ADMIN_NAME || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
      throw new Error(
        'No owner account exists. Configure INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD before starting the server.'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, salt);

    await User.create({
      name: INITIAL_ADMIN_NAME,
      email: INITIAL_ADMIN_EMAIL,
      passwordHash,
      role: 'owner',
    });

    console.log('Initial owner account created from deployment configuration.');
  }
}
