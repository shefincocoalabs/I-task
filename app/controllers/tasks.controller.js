  var Task = require('../models/task.model.js');
  var Project = require('../models/project.model.js');
  var TaskReport = require('../models/memberTaskReport.model.js');
  var Member = require('../models/member.model.js');
  var config = require('../../config/app.config.js');
  var ObjectId = require('mongoose').Types.ObjectId;
  var memberConfig = config.members;
  var tasksConfig = config.tasks;
  var moment = require('moment');

  //   *** Add new task *** Author: Shefin S
  exports.addTask = (req, res) => {
    var userData = req.identity.data; 
    var userId = userData.userId;
    var taskName = req.body.taskName;
    var projectId = req.body.projectId;
    var memberId = req.body.memberId;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var files = req.files;
    var documents = [];
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
    if (files.documents) {
      var len = files.documents.length;
      var i = 0;
      while (i < len) {
        documents.push(files.documents[i].filename);
        i++;
      }
    };
    const newTask = new Task({
      projectId: projectId,
      memberId: memberId ? memberId : null,
      taskName: taskName,
      dueDate: dueDate,
      description: description,
      taskCreatedBy: userId,
      isCompleted: false,
      completedDate: '',
      documents: documents || [],
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
  exports.listTask = async (req, res) => {
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
      taskCreatedBy: userId,
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

    var queryProjectionMemberTask = {
      taskName: 1,
      dueDate: 1,
      memberId: 1,
      projectId: 1,
      isCompleted: 1,
      completedDate: 1
    };
    var filterMemberTasks = {
      memberId: userId,
      status: 1
    };
    try {
      if (userType == 'Admin') {
        taskList = await Task.find(filters, queryProjection, pageParams).populate([{
          path: 'memberId',
          select: 'fullName image'
        }, {
          path: 'projectId',
          select: 'projectName dueDate'
        }]).limit(perPage);
        itemsCount = await Task.countDocuments(filters);
      } else {
        taskList = await Task.find(filterMemberTasks, queryProjectionMemberTask, pageParams).populate([{
          path: 'memberId',
          select: 'fullName image'
        }, {
          path: 'projectId',
          select: 'projectName dueDate'
        }]).limit(perPage);
        itemsCount = await Task.countDocuments(filterMemberTasks);
      }
      var totalPages = itemsCount / perPage;
      totalPages = Math.ceil(totalPages);
      var hasNextPage = page < totalPages;
      res.send({
        success: 1,
        statusCode: 200,
        imageBase: memberConfig.imageBase,
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

  // *** List unassigned tasks ****  Author: Shefin S

  exports.listUnassignedTasks = async (req, res) => {
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
    var filter = {
      taskCreatedBy: userId,
      memberId: null,
      status: 1
    };
    var queryProjection = {
      projectId: 1,
      taskName: 1,
      dueDate: 1
    };

    try {
      let listUnassignedTasks = await Task.find(filter, queryProjection, pageParams).populate({
        path: 'projectId',
        select: 'projectName'
      });
      let itemsCount = await Task.countDocuments(filter);
      var totalPages = itemsCount / perPage;
      totalPages = Math.ceil(totalPages);
      var hasNextPage = page < totalPages;
      res.send({
        success: 1,
        statusCode: 200,
        items: listUnassignedTasks,
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages,
        message: 'All unassigned tasks listed successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  }

  // *** Get task details ***  Author: Shefin S
  exports.detailTask = async (req, res) => {
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
      taskCreatedBy: userId,
      status: 1
    };
    var filterMemberTasks = {
      _id: taskId,
      memberId: userId,
      status: 1
    };
    var queryProjection = {
      taskName: 1,
      dueDate: 1,
      description: 1,
      isCompleted: 1,
      completedDate: 1,
      projectId: 1,
      memberId: 1,
      documents: 1
    };
    try {
      if (userType == 'Admin') {
        let taskDetail = await Task.findOne(findCriteria, queryProjection)
          .populate([{
              path: 'projectId',
              select: 'projectName'
            },
            {
              path: 'memberId',
              select: 'fullName image position'
            }
          ])
        res.send({
          success: 1,
          statusCode: 200,
          fileBase: tasksConfig.fileBase,
          imageBase: memberConfig.imageBase,
          taskDetails: taskDetail,
          message: 'Task detail fetched successfully'
        });
      } else {
        let memberTaskDetail = await Task.findOne(filterMemberTasks, queryProjection).populate([{
          path: 'projectId',
          select: 'projectName'
        }, {
          path: 'memberId',
          select: 'fullName image position'
        }]);
        res.send({
          success: 1,
          statusCode: 200,
          fileBase: tasksConfig.fileBase,
          imageBase: memberConfig.imageBase,
          taskDetails: memberTaskDetail,
          message: 'Task detail fetched successfully'
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

  // *** Submit task report for member *** Author: Shefin S

  exports.submitTaskReport = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var taskId = req.params.id;
    var projectId = req.body.projectId;
    var notes = req.body.notes;
    var i;
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
    if (!projectId) {
      return res.send({
        success: 0,
        statusCode: 400,
        message: 'ProjectId cannot be empty'
      })
    };
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    const newTaskReport = new TaskReport({
      taskId: taskId,
      memberId: userId,
      notes: notes,
      completedDate: today,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });
    var filter = {
      _id: taskId,
      status: 1
    };
    var update = {
      isCompleted: true,
      completedDate: today
    }
    try {
      let saveNewTaskReport = await newTaskReport.save();
      let updateTask = await Task.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
      let checkAllTasks = await Task.find({
        projectId: projectId,
        status: 1
      });

      for (i = 0; i < checkAllTasks.length; i++) {
        if (checkAllTasks[i].isCompleted == false) {
          break;
        } else {
          let updateProject = await Project.findOneAndUpdate({
            _id: projectId
          }, {
            isCompleted: true,
            completedDate: today
          }, {
            new: true,
            useFindAndModify: false
          });
        }
      }
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task completed successfully'
      });
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };

  //   *** Delete tasks ***  Author: Shefin S
  exports.deleteTask = async (req, res) => {
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

  exports.updateTask = async (req, res) => {
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
      update.projectId = projectId;
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

// *** Transfer task to a member ***  Author: Shefin S

  exports.transferTask = async (req, res) => {
    var taskId = req.params.id;
    var memberId = req.body.memberId;
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
    if (!memberId) {
      return res.send({
        success: 0,
        statusCode: 200,
        message: 'memberId cannot be empty'
      })
    };
    var filter = {
      _id: taskId,
      status: 1
    };
    var update = {
      memberId: memberId
    };
    try {
      let findMember = await Task.findOne({
        _id: taskId,
        status: 1
      });
      let taskMember = findMember.memberId;
      if (taskMember == memberId) {
        return res.send({
          success: 0,
          statusCode: 400,
          message: 'This task is already assigned to this member, please select another member'
        });
      };
      let updateMember = await Task.findOneAndUpdate(filter, update, {
        new: true,
        useFindAndModify: false
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Task transfered successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };

  // **** Append more files to array in a task ****  Author: Shefin S
  exports.appendFilesArray = async (req, res) => {
    var taskId = req.body.taskId;
    var files = req.files;
    var documents = [];
    if (!files || !taskId) {
      var errors = [];
      if (!files) {
        errors.push({
          field: "files",
          message: "files array cannot be empty"
        });
      }
      if (!taskId) {
        errors.push({
          field: "taskId",
          message: "taskId cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    try {
      if (req.files.documents) {
        var len = files.documents.length;
        var i = 0;
        let promiseArr = [];
        while (i < len) {
          promiseArr.push(files.documents[i].filename);
          documents.push(files.documents[i].filename);
          let appendFilesArray = await Task.update({
            _id: taskId
          }, {
            $push: {
              documents: files.documents[i].filename
            }
          })
          i++;
        }
        Promise.all(promiseArr)
          .then((result) => res.send({
            success: 1,
            statusCode: 200,
            message: 'More documents added successfully to the task'
          }))
          .catch((err) => res.send({
            success: 0,
            statusCode: 400,
            message: err.message
          }));
      };

    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };
  // **** Remove files from array in a task  ****  Author: Shefin S
  exports.removeDocs = async (req, res) => {
    var docIds = req.body.docIds;
    var taskId = req.body.taskId;
    if (!docIds || !taskId) {
      var errors = [];
      if (!docIds) {
        errors.push({
          field: "docIds",
          message: "docIds array cannot be empty"
        });
      }
      if (!taskId) {
        errors.push({
          field: "taskId",
          message: "taskId cannot be empty"
        });
      }
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    try {
      let removeDoc = await Task.update({
        _id: taskId
      }, {
        $pullAll: {
          documents: docIds
        }
      });
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Selected documents removed successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }
  };
