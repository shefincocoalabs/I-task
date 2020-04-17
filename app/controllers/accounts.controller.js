var gateway = require('../components/gateway.component.js');

function accountsController(methods, options) {
  var Users = require('../models/user.model.js');
  var Members = require('../models/member.model.js');
  var Task = require('../models/task.model.js');
  var Project = require('../models/project.model.js');
  var Otp = require('../models/otp.model.js');
  var config = require('../../config/app.config.js');
  var projectsConfig = config.projects;
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
    console.log('files');
    console.log(req.files);
    console.log(req.body.name);
    var fullName = req.body.fullName;
    var phone = req.body.phone;
    var email = req.body.email;
    var position = req.body.position;
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    if (!fullName || !email || !phone || !position || !password || !confirmPassword) {
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
      if (!position) {
        errors.push({
          field: "position",
          message: "Position cannot be empty"
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
      position: position,
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
    var userType = req.body.userType;
    let user;
    if (!email || !password || !userType) {
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
      if (!userType) {
        errors.push({
          field: "userType",
          message: "User type cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };

    try {
      if (userType == 'Admin') {
        user = await Users.findOne({
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
          type: 'Admin',
          image: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
        };
        var token = jwt.sign({
          data: payload,
        }, JWT_KEY, {
          expiresIn: '30 days'
        });
      } else {
        user = await Members.findOne({
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
          type: 'Member',
          image: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
        };
        var token = jwt.sign({
          data: payload,
        }, JWT_KEY, {
          expiresIn: '30 days'
        });
      }
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

  // *** Get Proifle ***   Author: Shefin S

  this.getProfile = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var profileData;
    var queryProjection = {
      fullName: 1,
      email: 1,
      phone: 1,
      position: 1
    };
    try {
      if (userType == 'Admin') {
        profileData = await Users.findOne({
          _id: userId,
          status: 1
        }, queryProjection);
        res.send({
          success: 1,
          statusCode: 200,
          profileData: profileData,
          message: 'Profile data fetched successfully'
        });
      } else {
        profileData = await Members.findOne({
          _id: userId,
          status: 1
        }, queryProjection);
        res.send({
          success: 1,
          statusCode: 200,
          profileData: profileData,
          message: 'Profile data fetched successfully'
        });
      }
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
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
  };

  // *** Change Password ****  Author: Shefin S

  this.changePasssword = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;
    if (!currentPassword || !newPassword || !confirmPassword) {
      var errors = [];
      if (!currentPassword) {
        errors.push({
          field: "currentPassword",
          message: "Current Password cannot be empty"
        });
      }
      if (!newPassword) {
        errors.push({
          field: "newPassword",
          message: "New Password cannot be empty"
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
    let checkPassword = await Members.findOne({
      _id: userId
    }).catch(err => {
      console.error(err);
    });
    if (checkPassword.password == currentPassword) {
      if (newPassword == confirmPassword) {
        var filter = {
          _id: userId
        };
        var update = {
          password: newPassword
        };
        try {
          let passwordUpdate = await Members.findOneAndUpdate(filter, update, {
            new: true,
            useFindAndModify: false
          });
          res.send({
            success: 1,
            statusCode: 200,
            message: 'Password changed successfully'
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        res.send({
          success: 0,
          statusCode: 400,
          message: 'Both new password and confirm password sholud be same'
        })
      }
    } else {
      return res.send({
        success: 0,
        statusCode: 400,
        message: 'current password is incorreect'
      })
    }
  };

  // *** Search using keyword ***  Author: Shefin S

  this.fullSearch = async (req, res) => {
    var bearer = req.headers['authorization'];
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var type = req.query.type;
    var filter = req.body.filter;
    var search = req.query.searchKeyword || '.*';
    var findCriteriaTasks;
    var findCriteriaProject;
    var findCriteriaMembers;
    var searchResult;
    var itemsCount;
    var i;
    search = search + '.*';
    var params = req.query;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || projectsConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : projectsConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
      skip: offset,
      limit: perPage
    };
    if (!type) {
      return res.send({
        success: 0,
        statusCode: 400,
        message: 'Type cannot be empty'
      })
    };
    var findCriteriaProject = {};
    if (filter) {
      for (i in filter) {
        if (filter[i] == 'Archieved') {
          findCriteriaProject.isArchieved = true;
        };
        if (filter[i] == 'Completed') {
          findCriteriaProject.isCompleted = true;
        };
      };
    };

    if (userType == 'Admin') {
      findCriteriaTasks = {
        $or: [{
          taskName: {
            $regex: search,
            $options: 'i'
          }
        }, {
          dueDate: {
            $regex: search,
            $options: 'i'
          }
        }],
        taskCreatedBy: userId,
        status: 1
      };
      findCriteriaProject.projectName = {
        $regex: search,
        $options: 'i'
      };
      findCriteriaProject.projectCreatedBy = userId;
      findCriteriaProject.status = 1;

      findCriteriaMembers = {
        $or: [{
          fullName: {
            $regex: search,
            $options: 'i',
          }
        }, {
          email: {
            $regex: search,
            $options: 'i'
          }
        }],
        createdBy: userId,
        status: 1
      };
    } else {
      findCriteriaTasks = {
        $or: [{
          taskName: {
            $regex: search,
            $options: 'i'
          }
        }, {
          dueDate: {
            $regex: search,
            $options: 'i'
          }
        }],
        memberId: userId,
        status: 1
      };
    }
    console.log(findCriteriaProject);
    try {
      if (type == 'Members' || type == 'Tasks') {
        if (type == 'Members') {
          searchResult = await Members.find(findCriteriaMembers, {
            fullName: 1,
            image: 1,
            position: 1
          }, pageParams);
          itemsCount = await Members.countDocuments(findCriteriaMembers);
        } else if (type == 'Tasks') {
          searchResult = await Task.find(findCriteriaTasks, {
              taskName: 1,
              dueDate: 1
            }, pageParams)
            .populate([{
                path: 'memberId',
                select: 'fullName image'
              },
              {
                path: 'projectId',
                select: 'projectName dueDate'
              }
            ]);
          itemsCount = await Task.countDocuments(findCriteriaTasks);
        }
        var totalPages = itemsCount / perPage;
        totalPages = Math.ceil(totalPages);
        var hasNextPage = page < totalPages;
        res.send({
          success: 1,
          statusCode: 200,
          items: searchResult,
          page: page,
          perPage: perPage,
          hasNextPage: hasNextPage,
          totalItems: itemsCount,
          totalPages: totalPages,
          message: 'Search results listed successfully'
        })
      } else {
        let prokectListReqObj = {
          findCriteriaProject,
          bearer,
          url: '/projects/list',
        };
        getProjectList(prokectListReqObj, function (err, result) {
          var searchedProj = {
            items: []
          };
          if (!err) {
            searchedProj = JSON.parse(result);
            res.send(searchedProj);
          }
        })
      }

    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };

  this.getFilterOptions = (req, res) => {
    var type = req.query.type;
    var filterOptions = [];
    if (type == 'Project') {
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8e',
        title: "Completed",
      });
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8a',
        title: "Archieved",
      });
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8b',
        title: "Pending",
      });

    } else if (type == 'Tasks') {
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8e',
        title: "Completed",
      });
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8b',
        title: "Pending",
      });
    } else {
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8c',
        title: "Assigned",
      });
      filterOptions.push({
        id: '5e81ca631433140dcadd5c8d',
        title: "UnAssigned",
      });
    }
    res.send({
      success: 1,
      statusCode: 200,
      items: filterOptions,
      message: 'Positions listed successfully'
    });
  };

  this.getMulter = (multer) => {
    var upload = multer({
      dest: 'uploads/'
    });
    upload = upload.single('avatar');
    return upload;
  };
}

function getProjectList(reqObj, callback) {
  let bearer = reqObj.bearer;
  let url = reqObj.url;
  delete reqObj.bearer;
  delete reqObj.url;
  gateway.getWithAuth(url, reqObj, bearer, function (err, result) {
    if (err) {
      console.log("Error while project list..." + url);

    }
    callback(err, result);
  });

};
module.exports = accountsController
