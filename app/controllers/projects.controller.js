function projectController(methods, options) {
  var Project = require('../models/project.model.js');
  var Members = require('../models/member.model.js');
  var MemberTask = require('../models/memberTask.model.js');
  var Task = require('../models/task.model.js');
  var moment = require('moment');
  var config = require('../../config/app.config.js');
  var ObjectId = require('mongoose').Types.ObjectId;
  var projectsConfig = config.projects;
  //   *** Create Project *** Author: Shefin S
  this.addProject = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var projectName = req.body.projectName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var members = req.body.members;
    if (!projectName || !dueDate || !description) {
      var errors = [];
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
      return res.send({
        success: 0,
        statusCode: 400,
        errors: errors,
      });
    };
    const newProject = new Project({
      projectName: projectName,
      dueDate: dueDate,
      description: description,
      projectCreatedBy: userId,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });
    try {
      let saveNewProject = await newProject.save();
      let promiseArr = [];
      members.forEach(async function (element) {
        element.tasks.forEach(async function (elements) {
          const newTask = new MemberTask({
            taskId: elements,
            memberId: element.member,
            projectId: saveNewProject._id,
            dueDate: dueDate,
            description: description,
            status: 1,
            tsCreatedAt: Number(moment().unix()),
            tsModifiedAt: null
          });
          let saveNewTask = await newTask.save();
          promiseArr.push(element);
        });
      });
      Promise.all(promiseArr)
        .then((result) => res.send({
          success: 1,
          statusCode: 200,
          message: 'New project added successfully'
        }))
        .catch((err) => res.send({
          success: 0,
          statusCode: 400,
          message: err.message
        }));
    } catch (err) {
      console.error(err);
    };
  };

  // **** List Projects **** Author: Shefin S
  this.listProject = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var params = req.query;
    var projectId;
    var projectData;
    let i;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || projectsConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : projectsConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
      skip: offset,
      limit: perPage
    };
    var filters = {
      projectCreatedBy: userId
    };
    var filterTasks = {
      projectId: projectId
    };
    var queryProjection = {

    };
    try {
      if (userType == 'Admin') {
        let listProjects = await Project.find(filters, queryProjection, pageParams).limit(perPage);
        let itemsCount = await Project.countDocuments(filters);
        var totalPages = itemsCount / perPage;
        totalPages = Math.ceil(totalPages);
        var hasNextPage = page < totalPages;
        let promiseArr = [];
        let items = [];
        let projectDetails = {};
        for (i = 0; i < listProjects.length; i++) {
          projectId = listProjects[i]._id;
          let countTasks = await Task.countDocuments(filterTasks);
          projectDetails.projectName = listProjects[i].projectName;
          projectDetails.dueDate = listProjects[i].dueDate;
          projectDetails.taskCount = countTasks;
          promiseArr.push(listProjects[i]);
        };
        items.push(projectDetails);

        //now execute promise all
        Promise.all(promiseArr)
          .then((result) => res.send({
            success: 1,
            statusCode: 200,
            items: projectDetails,
            page: page,
            perPage: perPage,
            hasNextPage: hasNextPage,
            totalItems: itemsCount,
            totalPages: totalPages,
            message: 'Projects listed successfully'
          }))
          .catch((err) => res.send({
            success: 0,
            statusCode: 400,
            message: err.message
          }));
      } else {
        let listProjectMember = await MemberTask.find({
          memberId: userId
        }).distinct('projectId');
        let promiseArr = [];
        for (i = 0; i < listProjectMember.length; i++) {
          projectData = await Project.find({
            _id: listProjectMember[i]
          });
          promiseArr.push(listProjectMember[i]);
        }
        //now execute promise all
        Promise.all(promiseArr)
          .then((result) =>
            res.send({
              success: 1,
              statusCode: 200,
              items: projectData,
              message: 'Project listed successfully'
            }))
          .catch((err) => res.send({
            success: 0,
            statusCode: 400,
            message: err.message
          }));
      }
    } catch (err) {
      console.error(err);
    };
  };

  //   **** Get project detail **** Author: Shefin S
  this.getProjectDetail = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var projectId = req.params.id;
    var isValidId = ObjectId.isValid(projectId);
    if (!isValidId) {
      var responseObj = {
        success: 0,
        status: 401,
        message: 'Id is invalid'
      }
      res.send(responseObj);
      return;
    };
    var filters = {
      _id: projectId,
      projectCreatedBy: userId
    };
    var filterMembers = {
      projectId: projectId
    };
    var queryProjection = {
      taskId: 1,
      memberId: 1
    };
    try {
      let projectData = await Project.findOne(filters);
      let projectMembers = await MemberTask.find(filterMembers, queryProjection).populate([{
        path: 'memberId',
        select: 'fullName inage'
      }, {
        path: 'taskId',
        select: 'taskName dueDate'
      }]);
      let projectDetails = {};
      projectDetails.projectName = projectData.projectName;
      projectDetails.dueDate = projectData.dueDate;
      projectDetails.description = projectData.description;
      res.send({
        success: 1,
        statusCode: 200,
        projectDetails: projectDetails,
        projectMembers: projectMembers,
        message: 'Project details fetched successfully'
      })
    } catch (err) {
      console.error(err);
    }

  };
}
module.exports = projectController
