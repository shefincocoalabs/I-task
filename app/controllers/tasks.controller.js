function tasksController(methods, options) {
  var Task = require('../models/task.model.js');
  var Project = require('../models/project.model.js');
  var MemberTask = require('../models/memberTask.model.js');
  var TaskReport = require('../models/memberTaskReport.model.js');
  var Member = require('../models/member.model.js');
  var config = require('../../config/app.config.js');
  var ObjectId = require('mongoose').Types.ObjectId;
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
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }

  };

  //   *** List added tasks  Author: Shefin S
  this.listTask = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var params = req.query;
    var taskList;
    var itemsCount;
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
      createdBy: userId,
      status: 1
    };
    var queryProjection = {
      taskId: 1,
      memberId: 1
    };

    var queryProjectionMemberTask = {
      taskId: 1,
      memberId: 1
    };
    var filterMemberTasks = {
      memberId: userId
    };
    try {
      if (userType == 'Admin') {
        taskList = await MemberTask.find(filters, queryProjection, pageParams).populate([{
          path: 'taskId',
          select: 'taskName dueDate'
        }, {
          path: 'memberId',
          select: 'fullName image'
        }]).limit(perPage);
        itemsCount = await MemberTask.countDocuments({
          createdBy: userId
        });
      } else {
        taskList = await MemberTask.find(filterMemberTasks, queryProjectionMemberTask, pageParams).populate([{
          path: 'taskId',
          select: 'taskName dueDate'
        }, {
          path: 'memberId',
          select: 'fullName image'
        }]).limit(perPage);
        itemsCount = await MemberTask.countDocuments(filterMemberTasks);
      }
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
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };

  // *** Get task details ***  Author: Shefin S
  this.detailTask = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var taskId = req.params.id;
    var isValidId = ObjectId.isValid(taskId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        message: 'Id is invalid'
      };
      res.send(responseObj);
      return;
    };
    var findCriteria = {
      _id: taskId,
      createdBy: userId,
      status: 1
    };
    var filterMemberTasks = {
      memberId: userId,
      taskId: taskId,
      status: 1
    };
    var queryProjection = {
      projectId: 1,
      taskId: 1,
      memberId: 1
    };
    var queryProjectionMemberTask = {
      taskId: 1,
      projectId: 1
    };
    try {
      if (userType == 'Admin') {
        let taskDetail = await MemberTask.findOne(findCriteria, queryProjection)
          .populate([{
              path: 'taskId',
              select: 'taskName dueDate description'
            },
            {
              path: 'projectId',
              select: 'projectName'
            },
            {
              path: 'memberId',
              select: 'fullName image'
            }
          ])
        res.send({
          success: 1,
          statusCode: 200,
          taskDetails: taskDetail,
          message: 'Task detail fetched successfully'
        });
      } else {
        let memberTaskDetail = await MemberTask.findOne(filterMemberTasks, queryProjectionMemberTask).populate([{
          path: 'taskId',
          select: 'taskName dueDate description'
        }, {
          path: 'projectId',
          select: 'projectName'
        }]);
        if (memberTaskDetail.length == 0) {
          return res.send({
            success: 0,
            statusCode: 400,
            message: 'Task details not found'
          });
        } else {
          // let taskDetail = {};
          // taskDetail.taskName = memberTaskDetail.taskDetail.task.taskName;
          // taskDetail.dueDate = memberTaskDetail.taskDetail.task.dueDate;
          // taskDetail.description = memberTaskDetail.taskDetail.task.description;
          // taskDetail.projectName = memberTaskDetail.taskDetail.project.projectName;
          res.send({
            success: 1,
            statusCode: 200,
            taskDetail: memberTaskDetail,
            message: 'Task detail fetched successfully'
          });
        }

      }

    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }

  };

  // *** Submit task report for member *** Author: Shefin S

  this.submitTaskReport = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var taskId = req.params.id;
    var notes = req.body.notes;
    var isValidId = ObjectId.isValid(taskId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        message: 'Id is invalid'
      }
      res.send(responseObj);
      return;
    };
    const newTaskReport = new TaskReport({
      taskId: taskId,
      memberId: userId,
      notes: notes,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });
    try {
      let saveNewTaskReport = await newTaskReport.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task completed successfully'
      });
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
      let deleteTask = await Task.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task deleted successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    };

  };

  //   *** Update Tasks ***  Author: Shefin S

  this.updateTask = async (req, res) => {
    var taskId = req.params.id;
    var taskName = req.body.taskName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var projectId = req.body.projectId
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
    if (!taskName && !description && !dueDate && !projectId) {
      return res.send({
        success: 0,
        statusCode: 401,
        message: 'Nothing to update'
      })
    };
    var update = {};
    if (taskName) {
      update.taskName = taskName;
    };
    if (dueDate) {
      update.dueDate = dueDate;
    };
    if (description) {
      update.description = description;
    };
    if (projectId) {
      update.projectId = projectId
    };
    var filter = {
      _id: taskId,
      status: 1
    };
    try {
      var updateTask = await Task.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task updated successfully'
      });
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };
}
module.exports = tasksController
