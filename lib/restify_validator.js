/*
 * This binds the node-validator library to the req object so that
 * the validation / sanitization methods can be called on parameter
 * names rather than the actual strings.
 *
 * 1. Be sure to include `req.mixinParams()` as middleware to merge
 *    query string, body and named parameters into `req.params`
 *
 * 2. To validate parameters, use `req.check(param_name, [err_message])`
 *        e.g. req.check('param1').len(1, 6).isInt();
 *        e.g. req.checkHeader('referer').contains('mydomain.com');
 *
 *    Each call to `check()` will throw an exception by default. To
 *    specify a custom err handler, use `req.onValidationError(errback)`
 *    where errback receives a parameter containing the error message
 *
 * 3. To sanitize parameters, use `req.sanitize(param_name)`
 *        e.g. req.sanitize('large_text').xss();
 *        e.g. req.sanitize('param2').toInt();
 *
 * 4. Done! Access your validated and sanitized paramaters through the
 *    `req.params` object
 */

var Validator = require('validator').Validator;
var Filter = require('validator').Filter;

var validator = new Validator();

var restifyValidator = function(req, res, next) {

  req.assert = function(param, fail_msg) {
    var value;

    // If param is not an array, then split by dot notation
    // returning an array. It will return an array even if
    // param doesn't have the dot notation.
    //      'blogpost' = ['blogpost']
    //      'login.username' = ['login', 'username']
    // For regex matches you can access the parameters using numbers.
    if (!Array.isArray(param)) {
      param = typeof param === 'number' ?
              [param] :
              param.split('.').filter(function(e){
                return e !== '';
              });
    }

    // Extract value from params
    param.map(function(item) {
      if (value === undefined) {
        value = (typeof(req.params[item]) !== "undefined" && req.params[item]) || (typeof(req.body[item]) !== "undefined" && req.body[item]) || undefined;
      } else {
        value = value[item];
      }
    });
    param = param.join('.');

    validator.error = function(msg) {
      var error = {
        param: param,
        msg: msg
      };
      
      if (req._validationErrors === undefined) {
        req._validationErrors = [];
      }
      req._validationErrors.push(error);
    };

    return validator.check(value, fail_msg);
  };

  req.checkForAssertErrors = function(CustomError) {
    CustomError = CustomError || Error;

    if (req._validationErrors && req._validationErrors.length > 0) {
      throw new CustomError(req._validationErrors);
    }
  };

  return next();
};

module.exports = restifyValidator;