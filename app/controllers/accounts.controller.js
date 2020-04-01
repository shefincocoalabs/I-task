function accountsController(methods, options) {
  var Users = require('../models/user.model.js');
  var Otp = require('../models/otp.model.js');
  var config = require('../../config/app.config.js');
  var otpConfig = config.otp;
  const paramsConfig = require('../../config/params.config');
  const JWT_KEY = paramsConfig.development.jwt.secret;
  var moment = require('moment');
  var jwt = require('jsonwebtoken');
  const uuidv4 = require('uuid/v4');
  const accountSid = 'AC956b7a18fda1f4626cd37f993d9c40b0';
  const authToken = '42f107da0a81cef5f75bc8621949baec';
  const client = require('twilio')(accountSid, authToken);
  const crypto = require('crypto');

  //   **** Sign-up **** Author: Shefin S
  this.signUp = async (req, res) => {
    var fullName = req.body.fullName;
    var phone = req.body.phone;
    var email = req.body.email;
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    if (!fullName || !email || !phone || !password || !confirmPassword) {
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
          message: "Password cannot be empty"
        });
      }
      if (!confirmPassword) {
        errors.push({
          field: "confirmPassword",
          message: "ConfirmPassword cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };

    if (password != confirmPassword) {
      return res.send({
        success: 0,
        message: 'Password and confirrm password fields should be same'
      })
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

  //   **** Login ****  Author: Shefin S

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
        phone: user.phone,
        position: '',
        image: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
      };
      var token = jwt.sign({
        data: payload,
      }, JWT_KEY, {
        expiresIn: '30 days'
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'User logged in successfully',
        token: token,
        userDetails: payload
      });

    } catch (err) {
      console.error(err);
    }
  };

  //   **** Update Profile ****  Author: Shefin S

  this.updateProfile = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var fullName = req.body.fullName;
    var email = req.body.email;
    var phone = req.body.phone;
    var position = req.body.position
    if (!fullName && !email && !phone && !position) {
      return res.send({
        success: 0,
        statusCode: 401,
        message: 'Nothing to update'
      })
    };
    var update = {};
    if (fullName) {
      update.fullName = fullName;
    };
    if (email) {
      update.email = email;
    };
    if (phone) {
      update.phone = phone;
    };
    if (position) {
      update.position = position;
    };
    var filter = {
      _id: userId
    };
    try {
      var updateUser = await Users.update(filter, update);
      res.send({
        success: 1,
        statusCode: 200,
        message: 'User updated successfully'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // **** Send OTP **** Author: Shefin S

  this.sendSms = async (req, res) => {
    var phone = req.body.phone;
    var expiry = Date.now() + (otpConfig.expirySeconds * 1000);
    if (!phone) {
      return res.send({
        success: 0,
        message: 'Phone cannot be empty'
      });
    };
    var filter = {
      phone: phone
    };
    try {
      let checkPhone = await Users.findOne(filter);
      if (!checkPhone) {
        return res.send({
          success: 0,
          statusCode: 401,
          message: 'Please enter your registered phone number to proceed'
        });
      };
      let otp = Math.floor(100000 + Math.random() * 900000);
      const apiToken = uuidv4();
      const newOtp = new Otp({
        phone: phone,
        isUsed: false,
        userToken: otp,
        apiToken: apiToken,
        expiry: parseInt(expiry)
      });
      let otpSave = await newOtp.save();

      // client.messages
      //   .create({
      //     from: 'I-task',
      //     body: `OTP to reset your password is ${otp}. Please do not share this OTP with anyone.`,
      //     to: phone
      //   })
      //   .then(message => {
      //    console.log(message.sid)
      //    res.send({
      //      success: 1,
      //      message: 'OTP has been send to your registered phone number'
      //    })
      // });
      res.send({
        success: 1,
        otp: otp,
        apiToken: apiToken,
        message: 'OTP has been send to your registered phone number'
      })

    } catch (err) {
      console.error(err);
    }
  };

  // *** Verify OTP ***  Author: Shefin S
  this.verifyOtp = async (req, res) => {
    var phone = req.body.phone;
    var otp = req.body.otp;
    var apiToken = req.body.apiToken;
    const buffer = crypto.randomBytes(20).toString('hex');
    if (!phone || !otp || !apiToken) {
      var errors = [];
      if (!phone) {
        errors.push({
          field: "phone",
          message: "Phone cannot be empty"
        });
      }
      if (!otp) {
        errors.push({
          field: "otp",
          message: "Otp cannot be empty"
        });
      }
      if (!apiToken) {
        errors.push({
          field: "apiToken",
          message: "apiToken cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    var findCriteria = {
      userToken: otp,
      apiToken: apiToken,
      isUsed: false
    }
    var otpData = await Otp.findOne(findCriteria);
    if (otpData) {
      let currentTime = Date.now();

      var otpData1 = await Otp.findOne({
        userToken: otp,
        apiToken: apiToken,
        isUsed: false,
        expiry: {
          $gt: currentTime
        }
      });
      if (otpData1 === null) {
        return res.send({
          success: 0,
          message: 'otp expired,please resend otp to get a new one'
        })
      } else {
        var filter = {
          userToken: otp,
          apiToken: apiToken
        };
        var update = {
          isUsed: true
        };
        let updateOtpData = await Otp.findOneAndUpdate(filter, update, {
          new: true,
          useFindAndModify: false
        });
        let updateUserData = await Users.findOneAndUpdate({
          phone: phone
        }, {
          passwordResetToken: buffer
        }, {
          new: true,
          useFindAndModify: false
        });
        res.send({
          success: 1,
          statusCode: 200,
          passwordResetToken: buffer,
          message: 'Otp verified successfully'
        })
      }
    } else {
      return res.send({
        success: 0,
        message: 'Otp does not matching'
      })
    }
  };

  // *** Reset Password ***  Author: Shefin S
  this.resetPasssword = async (req, res) => {
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    var passwordResetToken = req.body.passwordResetToken;
    var phone = req.body.phone;
    if (!password || !confirmPassword || !phone || !passwordResetToken) {
      var errors = [];
      if (!password) {
        errors.push({
          field: "password",
          message: "Password cannot be empty"
        });
      }
      if (!confirmPassword) {
        errors.push({
          field: "confirmPassword",
          message: "ConfirmPassword cannot be empty"
        });
      }
      if (!passwordResetToken) {
        errors.push({
          field: "passwordResetToken",
          message: "PasswordResetToken cannot be empty"
        });
      }
      if (!phone) {
        errors.push({
          field: "phone",
          message: "Phone cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };

    if (password != confirmPassword) {
      return res.send({
        success: 0,
        message: 'Password and confirrm password fields should be same'
      })
    };
    var filter = {
      phone: phone,
      passwordResetToken: passwordResetToken
    };
    var update = {
      password: password
    };
    let updatePassword = await Users.findOneAndUpdate(filter, update, {
      new: true,
      useFindAndModify: false
    });
    res.send({
      success: 1,
      statusCode: 200,
      message: 'Your password has been reset successfully'
    })
  }
}
module.exports = accountsController
