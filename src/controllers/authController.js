import bcrypt from 'bcrypt';
import generateAccessToken from '../helpers/auth/generateAccessToken.js';
import User from '../models/usersModel.js';

export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);

    const status = await User.create({
      email: email.toLowerCase(),
      password: encryptedPassword,
      name,
    });

    const token = generateAccessToken({ email });

    res.status(201).json({
      status,
      token,
    });
  } catch (err) {
    if (err?.code === 11000) {
      next({
        message: `Another user with email ${err?.keyValue?.email} is already registered.`,
        stack: err.stack,
        statusCode: 409,
      });
      return;
    }
    if (['CastError', 'ValidationError'].includes(err?.name)) {
      next({
        message: err.message,
        stack: err.stack,
        statusCode: 400,
      });
      return;
    }
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      next({
        message: 'email and password are required',
        statusCode: 400,
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      next({
        message: 'invalid credentials',
        statusCode: 401,
      });
      return;
    }

    const token = generateAccessToken({ email });

    res.json({
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};
