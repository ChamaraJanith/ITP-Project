import { body, validationResult } from 'express-validator';

export const validatePrescription = [

  body("date").optional().isISO8601().withMessage("date must be a valid date"),
  body("diagnosis").notEmpty().withMessage("diagnosis is required").isString().withMessage("diagnosis must be a string").isLength({min: 3}).withMessage("Provide a valid diagnosis"),
  body("medicines").isArray({ min: 1 }).withMessage("At least one medicine required"),
  body("medicines.*.name").notEmpty().withMessage("Medicine name is required").isString().withMessage("Medicine name must be a string"),
  body("medicines.*.dosage").notEmpty().withMessage("Medicine dosage is required"),
  body("medicines.*.frequency").notEmpty().withMessage("Medicine frequency is required"),
  body("medicines.*.duration").notEmpty().withMessage("Medicine duration is required"),
  body("notes").optional().isString().withMessage("notes must be a string"),
];

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if(errors.isEmpty()) return next();

    return res.status(422).json({ errors: errors.array().map(e => ({field: e.param, msg: e.msg})) });
};
    
