  var gateway = require('../components/gateway.component.js');
  var Users = require('../models/user.model.js');
  var Members = require('../models/member.model.js');
  var Task = require('../models/task.model.js');
  var Project = require('../models/project.model.js');
  var Otp = require('../models/otp.model.js');
  var config = require('../../config/app.config.js');
  var userConfig = config.users;
  var memberConfig = config.members;
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

  exports.signUp = async (req, res) => {
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
      image: '',
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

  exports.login = async (req, res) => {
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
          image: user.image,
          imageBase: userConfig.imageBase
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
          position: user.position,
          type: 'Member',
          image: user.image,
          imageBase: memberConfig.imageBase
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

  exports.getProfile = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var profileData;
    var queryProjection = {
      fullName: 1,
      email: 1,
      phone: 1,
      position: 1,
      image: 1
    };
    var userDetails = {};
    try {
      if (userType == 'Admin') {
        profileData = await Users.findOne({
          _id: userId,
          status: 1
        }, queryProjection);
        userDetails.userId = profileData._id;
        userDetails.fullName = profileData.fullName;
        userDetails.email = profileData.email;
        userDetails.phone = profileData.phone;
        userDetails.position = profileData.position;
        userDetails.type = userType
        userDetails.image = profileData.image;
        userDetails.imageBase = userConfig.imageBase
        res.send({
          success: 1,
          statusCode: 200,
          userDetails: userDetails,
          message: 'Profile data fetched successfully'
        });
      } else {
        profileData = await Members.findOne({
          _id: userId,
          status: 1
        }, queryProjection);
        userDetails.userId = profileData._id;
        userDetails.fullName = profileData.fullName;
        userDetails.email = profileData.email;
        userDetails.phone = profileData.phone;
        userDetails.position = profileData.position;
        userDetails.type = userType;
        userDetails.image = profileData.image;
        userDetails.imageBase = memberConfig.imageBase;
        res.send({
          success: 1,
          statusCode: 200,
          userDetails: userDetails,
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

  exports.updateProfile = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var fullName = req.body.fullName;
    var email = req.body.email;
    var phone = req.body.phone;
    var position = req.body.position;
    var profileImage = req.file;
    if (!fullName && !email && !phone && !position && !profileImage) {
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
    if (profileImage) {
      update.image = profileImage.filename;
    }
    var filter = {
      _id: userId,
      status: 1
    };
    try {
      if (userType == 'Admin') {
        var updateUser = await Users.update(filter, update);
      } else {
        var updateMember = await Members.update(filter, update)
      }
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

  exports.sendSms = async (req, res) => {
    var phone = req.body.phone;
    var userType = req.body.type;
    var expiry = Date.now() + (otpConfig.expirySeconds * 1000);
    var checkPhone;
    if (!phone || userType) {
      var errors = [];
      if (!phone) {
        errors.push({
          field: "phone",
          message: "Phone cannot be empty"
        });
      }
      if (!userType) {
        errors.push({
          field: "type",
          message: "User type cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    var filter = {
      phone: phone,
      status: 1
    };
    try {
      if (userType == 'Admin') {
        checkPhone = await Users.findOne(filter);
      } else {
        checkPhone = await Members.findOne(filter);
      }
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
  exports.verifyOtp = async (req, res) => {
    var phone = req.body.phone;
    var otp = req.body.otp;
    var apiToken = req.body.apiToken;
    var userType = req.body.type;
    var updateUserData;
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
        if (userType == 'Admin') {
           updateUserData = await Users.findOneAndUpdate({
            phone: phone,
            status: 1
          }, {
            passwordResetToken: buffer
          }, {
            new: true,
            useFindAndModify: false
          });
        } else {
           updateUserData = await Members.findOneAndUpdate({
            phone: phone,
            status: 1
          }, {
            passwordResetToken: buffer
          }, {
            new: true,
            useFindAndModify: false
          });
        }
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
  exports.resetPasssword = async (req, res) => {
    var Usertype = req.body.type;
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    var passwordResetToken = req.body.passwordResetToken;
    var phone = req.body.phone;
    var updatePassword;
    if (!Usertype || !password || !confirmPassword || !phone || !passwordResetToken) {
      var errors = [];
      if (!Usertype) {
        errors.push({
          field: "type",
          message: "User type cannot be empty"
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
    if (Usertype == 'Admin') {
      updatePassword = await Users.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
    } else {
      updatePassword = await Members.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
    }
    res.send({
      success: 1,
      statusCode: 200,
      message: 'Your password has been reset successfully'
    })
  };

  // *** Change Password ****  Author: Shefin S

  exports.changePasssword = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;
    var checkPassword;
    var passwordUpdate;
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
    if (userType == 'Admin') {
      checkPassword = await Users.findOne({
        _id: userId
      }).catch(err => {
        console.error(err);
      });
    } else {
      checkPassword = await Members.findOne({
        _id: userId
      }).catch(err => {
        console.error(err);
      });
    }
    if (checkPassword.password == currentPassword) {
      if (newPassword == confirmPassword) {
        var filter = {
          _id: userId
        };
        var update = {
          password: newPassword
        };
        try {
          if (userType == 'Admin') {
            passwordUpdate = await Users.findOneAndUpdate(filter, update, {
              new: true,
              useFindAndModify: false
            });
          } else {
            passwordUpdate = await Members.findOneAndUpdate(filter, update, {
              new: true,
              useFindAndModify: false
            });
          }
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

  exports.fullSearch = async (req, res) => {
    var bearer = req.headers['authorization'];
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var params = req.query;
    var type = params.type;
    var filter = params.filter;
    var search = params.searchKeyword || '.*';
    var projectId = params.projectId;
    var findCriteriaMembers;
    var searchResult;
    var itemsCount;
    search = search + '.*';
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
    if (projectId) {
      let seperateListReqObj = {
        projectId,
        type,
        search,
        page,
        perPage,
        userType,
        bearer,
        url: '/projects/helper',
      };
      getSeperateList(seperateListReqObj, function (err, result) {
        var searchedProj = {
          items: []
        };
        if (!err) {
          searchedProj = JSON.parse(result);
          res.send(searchedProj);
        }
      })
    } else {
      var findCriteriaProject = {};
      var findCriteriaProjectMember = {};
      var findCriteriaTasks = {};
      var findCriteriaMembers = {};
      if (filter) {
        if (filter == 'Archieved') {
          findCriteriaProject.isArchieved = true;
          findCriteriaProjectMember.isArchieved = true
        };
        if (filter == 'Completed') {
          findCriteriaProject.isCompleted = true;
          findCriteriaProjectMember.isCompleted = true;
          findCriteriaTasks.isCompleted = true;
        };
        if (filter == 'Pending') {
          findCriteriaProject.isCompleted = false;
          findCriteriaProjectMember.isCompleted = false;
          findCriteriaTasks.isCompleted = false;
        };
      };

      if (userType == 'Admin') {
        // Tasks findcriteria using searchKeyword and filter
        findCriteriaTasks.taskName = {
          $regex: search,
          $options: 'i'
        };
        findCriteriaTasks.taskCreatedBy = userId;
        findCriteriaTasks.status = 1;

        // Project findcriteria using searchKeyword and filter
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
        // Tasks findcriteria using searchKeyword and filter
        findCriteriaTasks.taskName = {
          $regex: search,
          $options: 'i'
        };
        findCriteriaTasks.memberId = userId;
        findCriteriaTasks.status = 1;
      }
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
                dueDate: 1,
                memberId: 1,
                projectId: 1,
                isCompleted: 1,
                completedDate: 1,
              }, pageParams)
              .populate([{
                  path: 'memberId',
                  select: 'fullName image position'
                },
                {
                  path: 'projectId',
                  select: 'projectName dueDate'
                }
              ])

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
            imageBase: memberConfig.imageBase,
            message: 'Search results listed successfully'
          })
        } else {
          let projectListReqObj = {
            findCriteriaProject,
            findCriteriaProjectMember,
            page,
            perPage,
            userType,
            bearer,
            url: '/projects/list',
          };
          getProjectList(projectListReqObj, function (err, result) {
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
    }
  };

  exports.getFilterOptions = (req, res) => {
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
    };
    res.send({
      success: 1,
      statusCode: 200,
      items: filterOptions,
      message: 'Positions listed successfully'
    });
  };


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

  function getSeperateList(reqObj, callback) {
    let bearer = reqObj.bearer;
    let url = reqObj.url;
    delete reqObj.bearer;
    delete reqObj.url;
    gateway.getWithAuth(url, reqObj, bearer, function (err, result) {
      if (err) {
        console.log("Error while fetching seperate list..." + url);

      }
      callback(err, result);
    });
  }
