function tasksController(methods, options) {
  var Task = require('../models/task.model.js');
  var MemberTask = require('../models/memberTask.model.js');
  var Member = require('../models/member.model.js');
  var config = require('../../config/app.config.js');
  var tasksConfig = config.tasks;
  var moment = require('moment');
  //   *** Add new task *** Author: Shefin S
  this.addTask = (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var taskName = req.body.taskName;
    var projectId = req.body.projectId;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    if (!taskName || !projectId || !dueDate || !description) {
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
      if (!projectId) {
        errors.push({
          field: "projectId",
          message: "ProjectId cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    const newTask = new Task({
      projectId: projectId,
      taskName: taskName,
      dueDate: dueDate,
      description: description,
      taskCreatedBy: userId,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });

    try {
      let saveNewTask = newTask.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New task added successfully'
      });
    } catch (err) {
      console.error(err);
    }

  };

  //   *** List added tasks  Author: Shefin S
  this.listTask = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var params = req.query;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || tasksConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : tasksConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
      skip: offset,
      limit: perPage
    };
    var filters = {
      taskCreatedBy: userId
    };
    var queryProjection = {

    };
    try {
      var taskList = await Task.find(filters, queryProjection, pageParams).limit(perPage);
      var itemsCount = await Task.countDocuments({
        taskCreatedBy: userId
      });
      var totalPages = itemsCount / perPage;
      totalPages = Math.ceil(totalPages);
      var hasNextPage = page < totalPages;
      res.send({
        success: 1,
        statusCode: 200,
        items: taskList,
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages,
        message: 'Tasks listed successfully'
      })
    } catch (err) {
      console.error(err);
    }
  };

  // *** Get task details ***  Author: Shefin S
  this.detailTask = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var taskId = req.params.id;
    var findCriteria = {
      _id: taskId,
      taskCreatedBy: userId
    };
    var queryProjection = {
      projectName: 1,
      taskName: 1,
      dueDate: 1,
      description: 1
    };
    try {
      let taskDetail = await Task.find(findCriteria, queryProjection);
      let taskMembers = await MemberTask.find({
        tasks: taskId
      }).populate('memberId', Member)
      res.send({
        success: 1,
        statusCode: 200,
        taskDetails: taskDetail,
        taskMembers: taskMembers,
        message: 'Task detail fetched successfully'
      })
    } catch (err) {
      console.error(err);
    }

  };

  //   *** Delete tasks ***  Author: Shefin S
  this.deleteTask = async (req, res) => {
    var taskId = req.params.id;
    var isValidId = ObjectId.isValid(taskId);
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
      _id: taskId
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

  //   *** Update Tasks ***  Author: Shefin S

  this.updateTask = async (req, res) => {
    var taskId = req.params.id;
    var taskName = req.body.taskName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var projectName = req.body.projectName
    var isValidId = ObjectId.isValid(taskId);
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
    if (!taskName && !description && !dueDate && !projectName) {
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
    if (projectName) {
      update.projectName = projectName
    };
    var filter = {
      _id: taskId
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
module.exports = tasksController
