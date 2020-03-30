function tasksController(methods, options) {
  var Task = require('../models/task.model.js');
  var config = require('../../config/app.config.js');
  var tasksConfig = config.tasks;
  var moment = require('moment');
  this.addTask = (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var taskName = req.body.taskName;
    var projectName = req.body.projectName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var role = req.body.role;
    if (!taskName || !projectName || !dueDate || !description || !role) {
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
      if (!projectName) {
        errors.push({
          field: "projectName",
          message: "ProjectName cannot be empty"
        });
      }
      if (!role) {
        errors.push({
          field: "role",
          message: "Role cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    const newTask = new Task({
      projectName: projectName,
      taskName: taskName,
      dueDate: dueDate,
      description: description,
      role: role,
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
  this.listTask = async(req, res) => {
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
      var taskList = await Task.find(filters,queryProjection,pageParams);
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
  }
}
module.exports = tasksController
