module.exports = (app,methods,options) => {
    const projects = methods.loadController('projects',options);
    projects.methods.post('/add',projects.addProject, {auth:true});
    projects.methods.post('/add-projectMember',projects.addProjectMember, {auth:true});
    projects.methods.get('/list',projects.listProject, {auth:true});
    projects.methods.get('/detail/:id',projects.getProjectDetail, {auth:true});
    projects.methods.post('/archieve/:id',projects.archieveProject, {auth:true});
    
}