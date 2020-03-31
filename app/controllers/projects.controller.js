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
    var memberId = req.body.memberId;
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
    }
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
      var filter = {
        memberId: memberId
      };
      var update = {
        projectId: saveNewProject._id
      };
      let updateMemberData = await MemberTask.update(filter, update);
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New project added successfully'
      })
    } catch (err) {
      console.error(err);
    }
  };

  this.addProjectMember = async(req, res) => {
    var memberId = req.body.memberId;
    var tasks = req.body.taskIds;
    if (!memberId) {
      var errors = [];
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
    }
    const newMemberTask = new MemberTask({
      memberId: memberId,
      tasks: tasks,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });

    try {
      let saveNewMemberTask = await newMemberTask.save();
      res.send({
        success: 1,
        statusCode: 200,
        message: 'Project member added successfully'
      })
    } catch (err) {
      console.error(err);
    }
  }
  // **** List Projects **** Author: Shefin S
  this.listProject = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
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
    var filters = {
      projectCreatedBy: userId
    };
    var queryProjection = {

    };
    var projectObj = {};
    try {
      let listProjects = await Project.find(filters, queryProjection, pageParams).limit(perPage);
      let itemsCount = await Project.countDocuments(filters);
      var totalPages = itemsCount / perPage;
      totalPages = Math.ceil(totalPages);
      var hasNextPage = page < totalPages;
      res.send({
        success: 1,
        statusCode: 200,
        items: listProjects,
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages,
        message: 'Projects listed successfully'
      })
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
        errors: [{
          field: "id",
          message: "id is invalid"
        }]
      }
      res.send(responseObj);
      return;
    };
    var filters = {
      _id: projectId,
      projectCreatedBy: userId
    };
    var dataProjection = {
      description: 1,
      dueDate: 1
    };
    var queryProjection = {
      tasks: 1,
      memberId: 1
    };
    try {
      let projectData = await Project.findOne(filters, dataProjection);
      let projectMembersData = await MemberTask.find({
        projectId: projectId
      }, queryProjection).populate('tasks', Task).populate('memberId', Members);
      res.send({
        success: 1,
        statusCode: 200,
        projectDetails: projectData,
        projectMembersData: projectMembersData,
        message: 'Project details fetched successfully'
      })
    } catch (err) {
      console.error(err);
    }

  };
}
module.exports = projectController
