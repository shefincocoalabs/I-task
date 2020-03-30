function memberController(methods, options) {
  var Member = require('../models/member.model.js');
  var MemberTask = require('../models/memberTask.model.js');
  var config = require('../../config/app.config.js');
  var membersConfig = config.members;
  var moment = require('moment');
  var ObjectId = require('mongoose').Types.ObjectId;

  //   **** Add a new member ****  Author: Shefin S
  this.addMember = async (req, res) => {
    var fullName = req.body.fullName;
    var email = req.body.email;
    var phone = req.body.phone;
    var position = req.body.position;
    if (!fullName || !email || !phone || !position) {
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
      position: position,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });

    try {
      let checkMember = await Member.findOne({
        email: email
      });
      if (checkMember) {
        return res.send({
          success: 0,
          statusCode: 401,
          message: 'Member with email exists'
        })
      };
      let newMember = await member.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New member added successfully'
      })

    } catch (err) {
      console.error(err);
    }
  };

  //   **** List-members ****  Author: Shefin S

  this.listMember = async (req, res) => {
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

    };
    var queryProjection = {

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
        items: memberList,
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages,
        message: 'Members listed successfully'
      })
    } catch (err) {
      console.error(err);
    };

  };

  // *** Get personal info of a member ***  Author: Shefin S
  this.personalInfo = async (req, res) => {
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
      _id: memberId
    };
    try {
      let memberInfo = await Member.findOne(filter);
      res.send({
        success: 1,
        statusCode: 200,
        personalInfo: memberInfo,
        message: 'Member personal-info feteched successfully'
      })
    } catch (err) {
      console.error(err);
    }
  };

  // **** Add task to a member ****  Author: Shefin S
  this.addTask = async (req, res) => {
    var taskName = req.body.taskName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var memberId = req.body.memberId;
    if (!taskName || !dueDate || !description || !memberId) {
      var errors = [];
      if (!taskName) {
        errors.push({
          field: "taskName",
          message: "Task name cannot be empty"
        });
      }
      if (!dueDate) {
        errors.push({
          field: "dueDate",
          message: "Due date cannot be empty"
        });
      }
      if (!description) {
        errors.push({
          field: "description",
          message: "Description cannot be empty"
        });
      }
      if (!memberId) {
        errors.push({
          field: "memberId",
          message: "MemberId cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };

    const newTask = new MemberTask({
      taskName: taskName,
      memberId: memberId,
      dueDate: dueDate,
      description: description,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });
    try {
      let saveNewTask = await newTask.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New task added successfully'
      });
    } catch (err) {
      console.error(err);
    };
  };

  // *** List task of a member ***  Author: Shefin S
  this.listTask = async (req, res) => {
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

    };
    try {
      let memberTask = await MemberTask.find(filters, queryProjection, pageParams);
      let itemsCount = await MemberTask.countDocuments(filters);

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
      console.error(err);
    };

  };
//   **** Delete task for a member ****  Author: Shefin S
  this.deleteTask = async (req, res) => {
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
      memberId: memberId
    };
    var update = {
      status: 0
    };
    try {
      let deleteTask = await MemberTask.update(filter, update, {
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

  this.updateTask = async (req, res) => {
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
      memberId: memberId
    };
    try {
      var updateTask = await MemberTask.update(filter, update);
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task updated successfully'
      });
    } catch (err) {
      console.error(err);
    }
  };
}
module.exports = memberController
