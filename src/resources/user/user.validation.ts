import Joi from 'joi';

const create = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().required()
});

const register = Joi.object({
  username: Joi.string().max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const login = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export default { create, register, login };
