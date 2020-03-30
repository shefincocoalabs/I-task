function accountsController(methods, options) {
  var Users = require('../models/user.model.js');
  const paramsConfig = require('../../config/params.config');
  const JWT_KEY = paramsConfig.development.jwt.secret;
  var moment = require('moment');
  var jwt = require('jsonwebtoken');

  //   **** Sign-up ****
  this.signUp = async (req, res) => {
    var fullName = req.body.fullName;
    var phone = req.body.phone;
    var email = req.body.email;
    var password = req.body.password;
    if (!fullName || !email || !phone || !password) {
      var errors = [];
      if (!fullName) {
        errors.push({
          field: "fullName",
          message: "Name cannot be empty"
        });
      }
      if (!email) {
        errors.push({
          field: "email",
          message: "Email cannot be empty"
        });
      }
      if (!phone) {
        errors.push({
          field: "phone",
          message: "Phone cannot be empty"
        });
      }
      if (!password) {
        errors.push({
          field: "password",
          message: "password cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };

    const newRegistration = new Users({
      fullName: fullName,
      email: email,
      phone: phone,
      password: password,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });

    try {
      let checkUser = await Users.findOne({
        email: email
      });
      if (checkUser) {
        return res.send({
          success: 0,
          statusCode: 401,
          message: 'User with email already exists'
        })
      }
      let user = await newRegistration.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New user registered successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      })
    }
  };

  //   **** Login ****

  this.login = async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    if (!email || !password) {
      var errors = [];
      if (!email) {
        errors.push({
          field: "email",
          message: "Email cannot be empty"
        });
      }
      if (!password) {
        errors.push({
          field: "password",
          message: "password cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };

    try {
      let user = await Users.findOne({
        email: email,
        password: password
      });
      if (!user) {
        return res.send({
          success: 0,
          statusCode: 401,
          message: 'Incorrect user credentials'
        })
      };
      var payload = {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      };
      var token = jwt.sign({
        data: payload,
      }, JWT_KEY, {
        expiresIn: '30 days'
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'User logged in successully',
        token: token,
        userDetails: payload
      });

    } catch (err) {
      console.error(err);
    }
  }
}
module.exports = accountsController
