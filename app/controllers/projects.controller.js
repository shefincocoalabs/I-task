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
      res.send({
        success: 1,
        statusCode: 200,
        message: 'New project added successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    };
  };

  // **** List Projects **** Author: Shefin S
  this.listProject = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    console.log(userId);
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
      projectCreatedBy: userId,
      status: 1
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
        for (i = 0; i < listProjects.length; i++) {
          var projectDetails = {};
          projectId = listProjects[i]._id;
          let countTasks = await Task.countDocuments({
            projectId: projectId,
            status: 1
          });
          let countMembers = await (await Task.distinct('memberId', {
            projectId: projectId,
            status: 1
          })).length;
          projectDetails.id = listProjects[i]._id;
          projectDetails.projectName = listProjects[i].projectName;
          projectDetails.dueDate = listProjects[i].dueDate;
          projectDetails.taskCount = countTasks;
          projectDetails.membersCount = countMembers;
          promiseArr.push(listProjects[i]);
          items.push(projectDetails);
        };

        //now execute promise all
        Promise.all(promiseArr)
          .then((result) => res.send({
            success: 1,
            statusCode: 200,
            items: items,
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
        let listProjectMemberData = await Task.find({
          memberId: userId,
          status: 1
        }).populate({
          path: 'projectId',
          select: 'projectName dueDate'
        }).lean();
        let promiseArr = [];
        let memberDetailsArray = [];
        for (i = 0; i < listProjectMemberData.length; i++) {
          var memberProjectDetails = {};
          projectId = listProjectMemberData[i].projectId._id;
          let countTasks = await Task.countDocuments({
            projectId: projectId,
            status: 1
          });
          let countMembers = await (await Task.distinct('memberId', {
            projectId: projectId,
            status: 1
          })).length;
          memberProjectDetails.id = listProjectMemberData[i].projectId._id;
          memberProjectDetails.projectName = listProjectMemberData[i].projectId.projectName;
          memberProjectDetails.dueDate = listProjectMemberData[i].projectId.dueDate;
          memberProjectDetails.taskCount = countTasks;
          memberProjectDetails.membersCount = countMembers;
          promiseArr.push(listProjectMemberData[i]);
          memberDetailsArray.push(memberProjectDetails);
        };
        //now execute promise all
        Promise.all(promiseArr)
          .then((result) =>
            res.send({
              success: 1,
              statusCode: 200,
              items: memberDetailsArray,
              message: 'Project listed successfully'
            }))
          .catch((err) => res.send({
            success: 0,
            statusCode: 400,
            message: err.message
          }));
      }
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    };
  };

  //   **** Get project detail **** Author: Shefin S
  this.getProjectDetail = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
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
    var filter = {
      _id: projectId,
      status: 1
    };
    var queryProjection = {
      projectName: 1,
      dueDate: 1,
      description: 1,
    };
    var taskQueryProjection = {
      taskName: 1,
      dueDate: 1
    }
    try {
      let projectData = await Project.findOne(filter, queryProjection);
      let projectId = projectData._id;
      let projectMembers = await Task.find({
        projectId: projectId,
        status: 1
      }, taskQueryProjection).populate({
        path: 'memberId',
        select: 'fullName image'
      })
      let projectDetails = {};
      projectDetails.projectName = projectData.projectName;
      projectDetails.dueDate = projectData.dueDate;
      projectDetails.membersTask = projectMembers;
      res.send({
        success: 1,
        statusCode: 200,
        projectDetails: projectDetails,
        message: 'Project details fetched successfully'
      })
    } catch (err) {
      res.send({
        success: 0,
        statusCode: 500,
        message: err.message
      });
    }

  };
}
module.exports = projectController
