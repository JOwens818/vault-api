import Joi from 'joi';

const create = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().required()
});

export default { create };
