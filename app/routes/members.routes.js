module.exports = (app,methods,options) => {
    const member = methods.loadController('members',options);
    member.methods.post('/add-member',member.addMember, {auth:true});
    member.methods.get('/list-member',member.listMember, {auth:true});
    member.methods.get('/personal-info/:id',member.personalInfo, {auth:true});
    member.methods.post('/add-task',member.addTask, {auth:true});
    member.methods.get('/list-task/:id',member.listTask, {auth:true});
    member.methods.patch('/update-task/:id',member.updateTask, {auth:true});
    member.methods.delete('/delete-task/:id',member.deleteTask, {auth:true});
}