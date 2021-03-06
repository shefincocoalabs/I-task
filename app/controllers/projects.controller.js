var Project = require('../models/project.model.js');
var Members = require('../models/member.model.js');
var Task = require('../models/task.model.js');
var moment = require('moment');
var config = require('../../config/app.config.js');
var membersConfig = config.members;
var projectsConfig = config.projects;
var ObjectId = require('mongoose').Types.ObjectId;
var gateway = require('../components/gateway.component.js');

//   *** Create Project *** Author: Shefin S
exports.addProject = async (req, res) => {
    var userData = req.identity.data;
    var userId = userData.userId;
    var projectName = req.body.projectName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
    var admin = req.body.admin;
    var files = req.files;
    var projectCode;
    var documents = [];
    if (!projectName || !dueDate || !description || !admin) {
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
        if (!admin) {
            errors.push({
                field: "admin",
                message: "Admin cannot be empty"
            });
        }
        return res.send({
            success: 0,
            statusCode: 400,
            errors: errors,
        });
    };
    try {
        let projectsCount = await Project.countDocuments({
            projectCreatedBy: userId
        });
        if (projectsCount < 10) {
            projectCode = 'P0' + projectsCount;
        } else {
            projectCode = 'P' + projectsCount;
        }
        if (files.documents) {
            var len = files.documents.length;
            var i = 0;
            while (i < len) {
                documents.push(files.documents[i].filename);
                i++;
            }
        }
        const newProject = new Project({
            projectCode: projectCode,
            projectName: projectName,
            dueDate: dueDate,
            description: description,
            projectCreatedBy: userId,
            isCompleted: false,
            completedDate: "",
            isArchieved: false,
            documents: documents || [],
            admin: admin,
            status: 1,
            tsCreatedAt: Number(moment().unix()),
            tsModifiedAt: null
        });
        let saveNewProject = await newProject.save();
        res.send({
            success: 1,
            statusCode: 200,
            projectId: saveNewProject._id,
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
exports.listProject = async (req, res) => {
    var bearer = req.headers['authorization'];
    var userData = req.identity.data;
    var search = req.query.search;
    var userType = userData.type;
    var userId = userData.userId;
    var params = req.query;
    var filters;
    var filterMemberProjects;
    var projectId;
    var i;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || projectsConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : projectsConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };
    if (params.findCriteriaProject) {
        filters = params.findCriteriaProject;
    } else {
        if (userType == 'Admin') {
            filters = {
                projectCreatedBy: userId,
                status: 1
            };
        } else {
            filters = {
                admin: userId,
                status: 1
            };
        };
    };
    if (params.findCriteriaProjectMember) {
        filterMemberProjects = params.findCriteriaProjectMember;
    }
    var queryProjection = {

    };
    var response;
    var searchObj = {};
    searchObj.$match = {};
    var itemsCount;
    try {
        if (userType == 'Admin' || userType == 'SubAdmin') {
            if (userType == 'SubAdmin') {
                // projectDataOfMembers(userId, page, perPage, searchObj, pageParams.skip, pageParams.limit).then(result => {
                //     response = result.memberDetailsArray;
                //     console.log('response top');
                //     console.log(response);
                //     console.log('response top');
                // });

                (async () => {
                    var result = await projectDataOfMembers(userId, page, perPage, searchObj, pageParams.skip, pageParams.limit);
                    response = result.memberDetailsArray;
                })()
            }
            let listProjects = await Project.find(filters, queryProjection, pageParams).limit(perPage);
            itemsCount = await Project.countDocuments(filters);
            let promiseArr = [];
            let items = [];
            for (i = 0; i < listProjects.length; i++) {
                var projectDetails = {};
                projectId = listProjects[i]._id;
                let countTasks = await Task.countDocuments({
                    projectId: projectId,
                    status: 1
                });
                let taskStatus = await Task.find({
                    projectId: projectId,
                    status: 1
                });
                let countMembers = await (await Task.distinct('memberId', {
                    projectId: projectId,
                    memberId: {
                        $ne: null
                    },
                    status: 1
                })).length;
                projectDetails.id = listProjects[i]._id;
                projectDetails.projectName = listProjects[i].projectName;
                projectDetails.projectCode = listProjects[i].projectCode;
                projectDetails.dueDate = listProjects[i].dueDate;
                projectDetails.isArchieved = listProjects[i].isArchieved;
                projectDetails.isCompleted = listProjects[i].isCompleted;
                projectDetails.completedDate = listProjects[i].completedDate;
                projectDetails.taskCount = countTasks;
                projectDetails.membersCount = countMembers;
                promiseArr.push(listProjects[i]);
                items.push(projectDetails);
            };
            var concatResult;
            var totalPages;
            var hasNextPage;
            if (userType == 'SubAdmin') {
                var ids = new Set(items.map(d => d.ID));
                concatResult = [...items, ...response.filter(d => !ids.has(d.ID))];
                itemsCount = concatResult.length;
                totalPages = itemsCount / perPage;
                totalPages = Math.ceil(totalPages);
                hasNextPage = page < totalPages;
            } else {
                concatResult = items;
                itemsCount = itemsCount;
                totalPages = itemsCount / perPage;
                totalPages = Math.ceil(totalPages);
                hasNextPage = page < totalPages;
            }
            //now execute promise all
            Promise.all(promiseArr)
                .then((result) => res.send({
                    success: 1,
                    statusCode: 200,
                    items: concatResult,
                    page: page,
                    perPage: perPage,
                    hasNextPage: hasNextPage,
                    totalItems: itemsCount,
                    totalPages: totalPages,
                    imageBase: membersConfig.imageBase,
                    message: 'Projects listed successfully'
                }))
                .catch((err) => res.send({
                    success: 0,
                    statusCode: 400,
                    message: err.message
                }));
        } else {
            let projectListReqObj = {
                filterMemberProjects,
                search,
                page,
                perPage,
                userId,
                filters,
                bearer,
                url: '/projects/membersProjectData',
            };
            getMembersProjectList(projectListReqObj, function (err, result) {
                var searchedProj = {
                    items: []
                };
                if (!err) {
                    searchedProj = JSON.parse(result);
                    res.send(searchedProj);
                }
            })
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
exports.getProjectDetail = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
    var userId = userData.userId;
    var projectId = req.params.id;
    var projectMembersData;
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
        isArchieved: 1,
        isCompleted: 1,
        completedDate: 1,
        documents: 1
    };
    var taskQueryProjection = {
        taskName: 1,
        dueDate: 1,
        isCompleted: 1,
        completedDate: 1
    };
    try {
        let projectData = await (await Project.findOne(filter, queryProjection).populate({
            path: 'admin',
            select: 'fullName image position type'
        }));
        let projectId = projectData.id;
        let projectMembersTasks = await Task.find({
            projectId: projectId,
            status: 1
        }, taskQueryProjection).populate({
            path: 'memberId',
            select: 'fullName image position type'
        }).limit(3);

        let projectMembers = await Task.aggregate([{
                $match: {
                    projectId: ObjectId(projectId),
                    status: 1
                }
            }, {
                $group: {
                    _id: null,
                    memberId: {
                        $addToSet: "$memberId"
                    }
                }
            },
            {
                $lookup: {
                    from: "Members",
                    localField: "memberId",
                    foreignField: "_id",
                    as: "memberId"
                }
            },
            {
                $unwind: "$memberId"
            },
            {
                $project: {
                    "memberId._id": 1,
                    "memberId.fullName": 1,
                    "memberId.image": 1,
                    "memberId.position": 1,
                    "memberId.type": 1,
                    taskName: 1,
                    dueDate: 1,
                    isCompleted: 1,
                    completedDate: 1
                }
            },
            {
                $limit: 3
            }
        ]);

        let countPorjectMembers = await (await Task.distinct('memberId', {
            projectId: projectId,
            memberId: {
                $ne: null
            },
            status: 1
        })).length;
        let countProjectsTasks = await Task.countDocuments({
            projectId: projectId,
            status: 1
        });
        let items = [];
        for (let i = 0; i < projectMembers.length; i++) {
            var projectMembersData = {};
            if (projectMembers[i].memberId) {
                projectMembersData.id = projectMembers[i].memberId._id;
                projectMembersData.fullName = projectMembers[i].memberId.fullName;
                projectMembersData.image = projectMembers[i].memberId.image;
                projectMembersData.position = projectMembers[i].memberId.position;
                projectMembersData.type = projectMembers[i].memberId.type;
                items.push(projectMembersData);
            } else {
                items = [];
            }
        };
        let projectDetails = {};
        projectDetails.id = projectData.id;
        projectDetails.projectName = projectData.projectName;
        projectDetails.dueDate = projectData.dueDate;
        projectDetails.description = projectData.description;
        projectDetails.isArchieved = projectData.isArchieved;
        projectDetails.isCompleted = projectData.isCompleted;
        projectDetails.completedDate = projectData.completedDate;
        projectDetails.documents = projectData.documents;
        projectDetails.admin = projectData.admin;
        projectDetails.projectMembersCount = countPorjectMembers;
        projectDetails.tasksCount = countProjectsTasks;
        projectDetails.members = items;
        projectDetails.membersTask = projectMembersTasks;
        res.send({
            success: 1,
            statusCode: 200,
            fileBase: projectsConfig.fileBase,
            imageBase: membersConfig.imageBase,
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

// *** Api for archieving a project ****  Author: Shefin S

exports.archieveProject = async (req, res) => {
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
        _id: projectId
    };
    var update = {
        isArchieved: true
    };
    try {
        let updateProjectData = await Project.findOneAndUpdate(filter, update, {
            new: true,
            useFindAndModify: false
        });
        res.send({
            success: 1,
            statusCode: 200,
            message: 'Project archieved successfully'
        })
    } catch (err) {
        res.send({
            success: 0,
            statusCode: 500,
            message: err.message
        });
    }
};

// *** Update Project Details ****   Author: Shefin S

exports.editProject = async (req, res) => {
    var projectId = req.params.id;
    var projectName = req.body.projectName;
    var dueDate = req.body.dueDate;
    var description = req.body.description;
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
    if (!projectName && !description && !dueDate) {
        return res.send({
            success: 0,
            statusCode: 401,
            message: 'Nothing to update'
        })
    };
    var update = {};
    if (projectName) {
        update.projectName = projectName;
    };
    if (dueDate) {
        update.dueDate = dueDate;
    };
    if (description) {
        update.description = description;
    };
    var filter = {
        _id: projectId,
        status: 1
    };
    try {
        var updateProject = await Project.findOneAndUpdate(filter, update, {
            new: true,
            useFindAndModify: false
        });
        res.send({
            success: 1,
            statusCode: 200,
            message: 'Project updated successfully'
        });
    } catch (err) {
        res.send({
            success: 0,
            statusCode: 500,
            message: err.message
        });
    }
};

// **** Append more files to array in a project ****  Author: Shefin S

exports.appendFilesArray = async (req, res) => {
    var projectId = req.body.projectId;
    var files = req.files;
    var documents = [];
    if (!files || !projectId) {
        var errors = [];
        if (!files) {
            errors.push({
                field: "files",
                message: "files array cannot be empty"
            });
        }
        if (!projectId) {
            errors.push({
                field: "projectId",
                message: "projectId cannot be empty"
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
                let appendFilesArray = await Project.update({
                    _id: projectId
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
                    message: 'More documents added successfully to the project'
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

// **** Remove files from array in a project  ****  Author: Shefin S

exports.removeDocs = async (req, res) => {
    var docIds = req.body.docIds;
    var projectId = req.body.projectId;
    if (!docIds || !projectId) {
        var errors = [];
        if (!docIds) {
            errors.push({
                field: "docIds",
                message: "docIds array cannot be empty"
            });
        }
        if (!projectId) {
            errors.push({
                field: "projectId",
                message: "projectId cannot be empty"
            });
        }
        return res.send({
            success: 0,
            statusCode: 400,
            errors: errors,
        });
    };
    try {
        let removeDoc = await Project.update({
            _id: projectId
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

// *** Api for listing project members list and project task list for a project ***  Author: Shefin S
// This api is called using super agent in project details api
exports.helperApi = async (req, res) => {
    var projectId = req.query.projectId;
    var search = req.query.search || '.*';
    search = search + '.*';
    var type = req.query.type;
    var page = req.query.page;
    var perPage = req.query.perPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };
    var matchObj = {};
    var searchObj = {};
    if (type == 'Members') {
        matchObj.$match = {
            projectId: ObjectId(projectId),
            memberId: {
                $ne: null
            },
            status: 1
        };
        searchObj.$match = {
            "member.fullName": {
                $regex: search,
                $options: 'i',
            }
        }
    } else {
        matchObj.$match = {
            projectId: ObjectId(projectId),
            status: 1
        };
        searchObj.$match = {
            taskName: {
                $regex: search,
                $options: 'i',
            }
        }
    };
    let projectMembers = await Task.aggregate([
        matchObj,
        {
            $lookup: {
                from: "Members",
                localField: "memberId",
                foreignField: "_id",
                as: "member"
            }
        },
        {
            $lookup: {
                from: "Projects",
                localField: "projectId",
                foreignField: "_id",
                as: "project"
            }
        },
        {
            $unwind: {
                path: "$member",
                "preserveNullAndEmptyArrays": true
            },
        },
        {
            $unwind: "$project"
        },
        searchObj,
        {
            $project: {
                taskName: 1,
                dueDate: 1,
                isCompleted: 1,
                completedDate: 1,
                "member._id": 1,
                "member.fullName": 1,
                "member.image": 1,
                "member.position": 1,
                "project._id": 1,
                "project.projectName": 1,
                "project.dueDate": 1
            }
        },
        {
            $skip: parseInt(pageParams.skip)
        },
        {
            $limit: parseInt(pageParams.limit)
        }
    ]);

    projectMembers = projectMembers.reduce((acc, current) => {
        const x = acc.find(item => item.member.fullName === current.member.fullName);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    let itemsCount = await Task.countDocuments({
        projectId: projectId,
        status: 1
    });
    let itemsCountMembers = await Task.countDocuments({
        projectId: projectId,
        memberId: {
            $ne: null
        },
        status: 1
    });
    var totalPagesMembers = itemsCountMembers / perPage;
    totalPagesMembers = Math.ceil(totalPagesMembers);
    var hasNextPageMembers = page < totalPagesMembers;
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    let items = [];
    for (let i = 0; i < projectMembers.length; i++) {
        var projectMembersData = {};
        if (projectMembers[i].member) {
            projectMembersData.id = projectMembers[i].member._id;
            projectMembersData.fullName = projectMembers[i].member.fullName;
            projectMembersData.image = projectMembers[i].member.image;
            projectMembersData.position = projectMembers[i].member.position;
            items.push(projectMembersData);
        }
    };
    let data = [];
    for (let j = 0; j < projectMembers.length; j++) {
        var projectTasksData = {};
        projectTasksData.member = {};
        projectTasksData.project = {};
        projectTasksData.id = projectMembers[j]._id;
        projectTasksData.taskName = projectMembers[j].taskName;
        projectTasksData.dueDate = projectMembers[j].dueDate;
        projectTasksData.isCompleted = projectMembers[j].isCompleted;
        projectTasksData.completedDate = projectMembers[j].completedDate;
        if (projectMembers[j].member) {
            projectTasksData.member.id = projectMembers[j].member._id;
            projectTasksData.member.fullName = projectMembers[j].member.fullName;
            projectTasksData.member.position = projectMembers[j].member.position;
            projectTasksData.member.image = projectMembers[j].member.image;
        } else {
            projectTasksData.member = null;
        }
        projectTasksData.project.id = projectMembers[j].project._id;
        projectTasksData.project.projectName = projectMembers[j].project.projectName;
        projectTasksData.project.dueDate = projectMembers[j].project.dueDate;
        data.push(projectTasksData);
    }
    if (type == 'Members') {
        res.send({
            success: 1,
            statusCode: 200,
            items: items,
            page: page,
            perPage: parseInt(perPage),
            hasNextPage: hasNextPageMembers,
            totalItems: itemsCountMembers,
            totalPages: totalPagesMembers,
            imageBase: membersConfig.imageBase,
            message: 'Project members listed successfully'
        })
    } else {
        res.send({
            success: 1,
            statusCode: 200,
            items: data,
            page: page,
            perPage: parseInt(perPage),
            hasNextPage: hasNextPage,
            totalPages: totalPages,
            totalItems: itemsCount,
            imageBase: membersConfig.imageBase,
            message: 'Project tasks listed successfully'
        })
    }
};

// *** Api for listing members  projects list ***  Author: Shefin S
// This api is called using superagent in search api in Accounts controller
exports.membersProjectData = async (req, res) => {
    var userId = req.query.userId;
    var search = req.query.search || '.*';
    search = search + '.*';
    var projectId;
    var page = req.query.page;
    var perPage = parseInt(req.query.perPage);
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };
    var value;
    var memberDetailsArray;
    var filterMemberProjects = req.query.filterMemberProjects;
    var searchObj = {};
    if (filterMemberProjects) {
        if (filterMemberProjects.isCompleted == 'true') {
            value = filterMemberProjects.isCompleted;
            searchObj.$match = {
                "Projects.projectName": {
                    $regex: search,
                    $options: 'i',
                },
                "Projects.isCompleted": Boolean(value)
            }
        } else if (filterMemberProjects.isCompleted == 'false') {
            searchObj.$match = {
                "Projects.projectName": {
                    $regex: search,
                    $options: 'i',
                },
                "Projects.isCompleted": Boolean(value)
            }
        } else if (filterMemberProjects.isArchieved == 'true') {
            value = filterMemberProjects.isArchieved;
            searchObj.$match = {
                "Projects.projectName": {
                    $regex: search,
                    $options: 'i',
                },
                "Projects.isArchieved": Boolean(value)
            }
        }
    } else {
        searchObj.$match = {
            "Projects.projectName": {
                $regex: search,
                $options: 'i',
            }
        }
    };
    projectDataOfMembers(userId, page, perPage, searchObj, pageParams.skip, pageParams.limit).then(result => {
        memberDetailsArray = result.memberDetailsArray;
        res.send({
            success: 1,
            statusCode: 200,
            page: page,
            perPage: perPage,
            hasNextPage: result.hasNextPage,
            totalItems: result.countProjectMemberData,
            totalPages: result.totalPages,
            items: memberDetailsArray,
            imageBase: membersConfig.imageBase,
            message: 'Project listed successfully'
        })
        // res.send(memberDetailsArray);
    })

    // Promise.all(promiseArr)
    //   .then((result) =>
    //     res.send({
    //       success: 1,
    //       statusCode: 200,
    //       page: page,
    //       perPage: perPage,
    //       hasNextPage: hasNextPage,
    //       totalItems: countProjectMemberData,
    //       totalPages: totalPages,
    //       items: memberDetailsArray,
    //       imageBase: membersConfig.imageBase,
    //       message: 'Project listed successfully'
    //     }))
    //   .catch((err) => res.send({
    //     success: 0,
    //     statusCode: 400,
    //     message: err.message
    //   }));
};


function getMembersProjectList(reqObj, callback) {
    let bearer = reqObj.bearer;
    let url = reqObj.url;
    delete reqObj.bearer;
    delete reqObj.url;
    gateway.getWithAuth(url, reqObj, bearer, function (err, result) {
        if (err) {
            console.log("Error while fetching project list..." + url);

        }
        callback(err, result);
    });
};

// *** Change admin for a project ***   Author: Shefin S

exports.changeAdmin = async (req, res) => {
    var projectId = req.body.projectId;
    var admin = req.body.admin;
    var filter = {
        _id: projectId,
        status: 1
    };
    var update = {
        admin: admin
    };
    try {
        let changeAdmin = await Project.findByIdAndUpdate(filter, update);
        res.send({
            success: 1,
            statusCode: 200,
            message: 'Admin changed successfully'
        })
    } catch (err) {
        res.send({
            success: 0,
            statusCode: 500,
            message: err.message
        });
    }
};

// *** Delete task from a project ***  Author: Shefin S
// When task deletes, member associated with the task also deletes

exports.deleteTask = async (req, res) => {
    var taskId = req.body.taskId;
    if (!taskId) {
        return res.send({
            success: 0,
            statusCode: 400,
            message: 'taskId cannot be empty'
        })
    };
    var filter = {
        _id: taskId,
        status: 1
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
        });
    } catch (err) {
        res.send({
            success: 0,
            statusCode: 500,
            message: err.message
        });
    }
};

exports.listProjectsUnderTasks = async (req, res) => {
    var userData = req.identity.data;
    var userType = userData.type;
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
    var findCriteria;
    try {
        if (userType == 'SubAdmin') {
            var findSuperAdmin = await Members.findOne({
                _id: userId,
                status: 1
            });
            var creator = findSuperAdmin.createdBy;
            findCriteria = {
                projectCreatedBy: creator,
                isArchieved: false,
                isCompleted: false,
                status: 1
            };
        } else if (userType == 'Admin') {
            findCriteria = {
                projectCreatedBy: userId,
                isArchieved: false,
                isCompleted: false,
                status: 1
            };
        }
        var queryProjection = {
            projectName: 1,
            projectCode: 1
        };
        var projectList = await Project.find(findCriteria, queryProjection, pageParams).limit(perPage);
        var itemsCount = await Project.countDocuments(findCriteria);
        var totalPages = itemsCount / perPage;
        totalPages = Math.ceil(totalPages);
        var hasNextPage = page < totalPages;
        res.send({
            success: 1,
            items: projectList,
            page: parseInt(page),
            perPage: parseInt(perPage),
            hasNextPage: hasNextPage,
            totalItems: itemsCount,
            totalPages: totalPages,
            statusCode: 200,
            message: 'Projects listed successfully'
        });
    } catch (err) {
        res.send({
            success: 0,
            statusCode: 500,
            message: err.message
        });
    }
}

async function projectDataOfMembers(userId, page, perPage, searchObj, skip, limit) {
    let listProjectMemberData = await Task.aggregate([{
            $match: {
                memberId: ObjectId(userId),
                status: 1
            }
        },
        {
            $group: {
                _id: null,
                projectId: {
                    $addToSet: "$projectId"
                }
            }
        },
        {
            $lookup: {
                from: "Projects",
                localField: "projectId",
                foreignField: "_id",
                as: "Projects"
            }
        },
        {
            $unwind: "$Projects"
        },
        searchObj,
        {
            $project: {
                "Projects._id": 1,
                "Projects.projectName": 1,
                "Projects.projectCode": 1,
                "Projects.dueDate": 1,
                "Projects.isCompleted": 1,
                "Projects.isArchieved": 1,
                "Projects.completedDate": 1,
                "Projects.admin": 1
            }
        },
        {
            $skip: parseInt(skip)
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    let countProjectMemberDatas = await Task.aggregate([{
            $match: {
                memberId: ObjectId(userId),
                status: 1
            }
        },
        {
            $group: {
                _id: null,
                projectId: {
                    $addToSet: "$projectId"
                }
            }
        }
    ]);
    let countProjectMemberData = countProjectMemberDatas[0] ? countProjectMemberDatas[0].projectId.length : 0;
    // let countProjectMemberData = listProjectMemberData.length;
    var totalPages = countProjectMemberData / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    let promiseArr = [];
    let memberDetailsArray = [];
    for (let i = 0; i < listProjectMemberData.length; i++) {
        var memberProjectDetails = {};
        projectId = listProjectMemberData[i].Projects._id;
        let countTasks = await Task.countDocuments({
            projectId: projectId,
            status: 1
        });
        let countMembers = await (await Task.distinct('memberId', {
            projectId: projectId,
            status: 1
        })).length;
        memberProjectDetails.id = listProjectMemberData[i].Projects._id;
        memberProjectDetails.projectName = listProjectMemberData[i].Projects.projectName;
        memberProjectDetails.projectCode = listProjectMemberData[i].Projects.projectCode;
        memberProjectDetails.dueDate = listProjectMemberData[i].Projects.dueDate;
        memberProjectDetails.isCompleted = listProjectMemberData[i].Projects.isCompleted;
        memberProjectDetails.isArchieved = listProjectMemberData[i].Projects.isArchieved;
        memberProjectDetails.completedDate = listProjectMemberData[i].Projects.completedDate;
        memberProjectDetails.taskCount = countTasks;
        memberProjectDetails.membersCount = countMembers;
        promiseArr.push(listProjectMemberData[i]);
        memberDetailsArray.push(memberProjectDetails);
    };
    var returnObj = {
        memberDetailsArray: memberDetailsArray,
        countProjectMemberData: countProjectMemberData,
        totalPages: totalPages,
        hasNextPage: hasNextPage
    };
    return returnObj;
}