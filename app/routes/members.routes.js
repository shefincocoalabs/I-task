module.exports = (app,methods,options) => {
    const member = methods.loadController('members',options);
    member.methods.post('/add-member',member.addMember, {auth:false});
    member.methods.get('/list-member',member.listMember, {auth:false});
    member.methods.get('/personal-info/:id',member.personalInfo, {auth:false});
    member.methods.post('/add-task',member.addTask, {auth:false});
    member.methods.get('/list-task/:id',member.listTask, {auth:false});
    
}