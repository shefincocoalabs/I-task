function projectController(methods, options) {
  var Project = require('../models/project.model.js');
  var Members = require('../models/member.model.js');
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
    var fullName = req.body.memberName;
    var email = req.body.email;
    var phone = req.body.phone;
    var position = req.body.position;
    var tasks = req.body.tasks;
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
    const newMember = new Members({
      fullName: fullName,
      email: email,
      phone: phone,
      position: position,
      tasks: tasks,
      status: 1,
      tsCreatedAt: Number(moment().unix()),
      tsModifiedAt: null
    });
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
      let saveNewProjectMember = await newMember.save();
      var filter = {
        _id: saveNewProjectMember._id
      };
      var update = {
        projectId: saveNewProject._id
      };
      let updateMemberData = await Members.update(filter, update);
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New project added successfully'
      })
    } catch (err) {
      console.error(err);
    }
  };
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
    try {
      let projectData = await Project.findOne(filters).populate('members', Members);
      let projectMembersData = await Members.find({
        projectId: projectId
      }).populate('tasks', Task)
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
