  var Member = require('../models/member.model.js');
  var Task = require('../models/task.model.js');
  var Project = require('../models/project.model.js');
  var config = require('../../config/app.config.js');
  var membersConfig = config.members;
  var moment = require('moment');
  var ObjectId = require('mongoose').Types.ObjectId;

  //   **** Add a new member ****  Author: Shefin S
  exports.addMember = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var fullName = req.body.fullName;
    var email = req.body.email;
    var phone = req.body.phone;
    var position = req.body.position;
    var password = req.body.password;
    var image = req.file ? req.file.filename : '';
    if (!fullName || !email || !phone || !position || !password) {
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
          message: "position cannot be empty"
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

    const member = new Member({
      fullName: fullName,
      email: email,
      phone: phone,
      image: image,
      position: position,
      password: password,
      createdBy: userId,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });

    try {
      let checkMember = await Member.findOne({
        email: email,
        status: 1
      });
      let checkPhone = await Member.findOne({
        phone: phone,
        status: 1
      });
      if (checkMember) {
        return res.send({
          success: 0,
          statusCode: 401,
          message: 'Member with email exists'
        })
      };
      if (checkPhone) {
        return res.send({
          success: 0,
          statusCode: 401,
          message: 'Member with phone exists'
        })
      }
      let newMember = await member.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New member added successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };

  //   **** List-members ****  Author: Shefin S

  exports.listMember = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var params = req.query;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || membersConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : membersConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
      skip: offset,
      limit: perPage
    };
    var filters = {
      createdBy: userId,
      status: 1
    };
    var queryProjection = {
      fullName: 1,
      image: 1,
      position: 1
    };
    try {
      let memberList = await Member.find(filters, queryProjection, pageParams).limit(perPage);
      let itemsCount = await Member.countDocuments(filters);
      var totalPages = itemsCount / perPage;
      totalPages = Math.ceil(totalPages);
      var hasNextPage = page < totalPages;
      res.send({
        success: 1,
        statusCode: 200,
        imageBase: membersConfig.imageBase,
        items: memberList,
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages,
        message: 'Members listed successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    };

  };

  // *** Get personal info of a member ***  Author: Shefin S
  exports.personalInfo = async (req, res) => {
    var memberId = req.params.id;
    var isValidId = ObjectId.isValid(memberId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        errors: [{
          field: "id",
          message: "id is invalid"
        }]
      }
      res.send(responseObj);
      return;
    };
    var filter = {
      _id: memberId,
      status: 1
    };
    var queryProjection = {
      fullName: 1,
      email: 1,
      phone: 1,
      image: 1,
      position: 1
    };
    try {
      let memberInfo = await Member.findOne(filter, queryProjection);
      res.send({
        success: 1,
        statusCode: 200,
        personalInfo: memberInfo,
        message: 'Member personal-info feteched successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };

  // *** Add multiple tasks from existing unassigned tasks to the member ***  Author: Shefin S

  exports.addExisting = async (req, res) => {
    var memberId = req.body.memberId;
    var tasks = req.body.tasks;
    if (!memberId || !tasks) {
      var errors = [];
      if (!memberId) {
        errors.push({
          field: "memberId",
          message: "memberId cannot be empty"
        });
      }
      if (!tasks) {
        errors.push({
          field: "tasks",
          message: "tasks cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    var i;
    let promiseArr = [];
    for (i = 0; i < tasks.length; i++) {
      promiseArr.push(tasks[i]);
      var filter = {
        _id: tasks[i],
        status: 1
      };
      var update = {
        memberId: memberId
      };
      let updateTask = await Task.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
    };
    Promise.all(promiseArr)
      .then((result) =>
        res.send({
          success: 1,
          statusCode: 200,
          message: 'Tasks added successfully'
        }))
      .catch((err) => res.send({
        success: 0,
        statusCode: 400,
        message: err.message
      }));
  }

  // *** List task of a member ***  Author: Shefin S
  
  exports.listTask = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var memberId = req.params.id;
    var isValidId = ObjectId.isValid(memberId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        errors: [{
          field: "id",
          message: "id is invalid"
        }]
      }
      res.send(responseObj);
      return;
    };
    var params = req.query;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || membersConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : membersConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
      skip: offset,
      limit: perPage
    };
    var filters = {
      memberId: memberId,
      status: 1
    };
    var queryProjection = {
      taskName: 1,
      dueDate: 1,
      memberId: 1, 
      projectId: 1,
      isCompleted: 1,
      completedDate: 1
    };
    try {
      let memberTask = await Task.find(filters, queryProjection, pageParams).populate([{
        path: 'memberId',
        select: 'fullName image'
      }, {
        path: 'projectId',
        select: 'projectName dueDate'
      }])
      let itemsCount = await Task.countDocuments(filters);
      var totalPages = itemsCount / perPage;
      totalPages = Math.ceil(totalPages);
      var hasNextPage = page < totalPages;
      res.send({
        success: 1,
        statusCode: 200,
        items: memberTask,
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages,
        message: 'Member task listed successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    };

  };
  //   **** Delete task for a member ****  Author: Shefin S
  exports.deleteTask = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var memberId = req.params.id;
    var isValidId = ObjectId.isValid(memberId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        errors: [{
          field: "id",
          message: "id is invalid"
        }]
      }
      res.send(responseObj);
      return;
    };
    var filter = {
      memberId: memberId,
      taskCreatedBy: userId,
      status: 1
    };
    var update = {
      status: 0
    };
    try {
      let deleteTask = await Task.update(filter, update, {
        new: true
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task deleted successfully'
      })
    } catch (err) {
      console.error(err);
    };

  };

  //   **** Update Task for member ****  Author: Shefin S

  exports.updateTask = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var memberId = req.params.id;
    var taskName = req.body.taskName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var isValidId = ObjectId.isValid(memberId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        errors: [{
          field: "id",
          message: "id is invalid"
        }]
      }
      res.send(responseObj);
      return;
    };
    if (!taskName && !description && !dueDate) {
      return res.send({
        success: 0,
        statusCode: 401,
        message: 'Nothing to update'
      })
    };
    var update = {};
    if (taskName) {
      update.taskName = taskName
    };
    if (dueDate) {
      update.dueDate = dueDate
    };
    if (description) {
      update.description = description
    };
    var filter = {
      memberId: memberId,
      taskCreatedBy: userId,
      status: 1
    };
    try {
      var updateTask = await Task.update(filter, update);
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task updated successfully'
      });
    } catch (err) {
      console.error(err);
    }
  };

  exports.listPositions = (req, res) => {
    var position = [];
    position.push({
      title: "Marketing Executive",
    });
    position.push({
      title: "Sales Executive",
    });
    position.push({
      title: "Graphic Designer",
    });
    position.push({
      title: "Software Developer",
    });
    res.send({
      success: 1,
      statusCode: 200,
      items: position,
      message: 'Positions listed successfully'
    })
  };
