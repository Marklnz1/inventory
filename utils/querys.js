module.exports.getLastCode=async(model)=>{
  let lastDoc = await model.find({}, { code: 1 })
  .sort({ code: -1 })
  .limit(1);

if (lastDoc.length != 0) {
  lastDoc= lastDoc[0];
}else{
  lastDoc =null;
}
  let code = 1;
  if (lastDoc!=null) {
    code = lastDoc.code + 1;
  }
  return code;
}
module.exports.getLastDoc =async(model,field,match={})=>{
  let sort = {};
  sort[field] = -1;
  let lastDoc = await model.find(match)
  .sort(sort)
  .limit(1);
if (lastDoc.length != 0) {
  return lastDoc[0];
}
return null;
}