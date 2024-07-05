module.exports.getLastCode=async(model)=>{
    let lastDoc = await _getLastDocCode(model);
  let code = 1;
  if (lastDoc!=null) {
    code = lastDoc.code + 1;
  }
  return code;
}
_getLastDocCode =async(model)=>{
    let lastDoc = await model.find({}, { code: 1 })
    .sort({ code: -1 })
    .limit(1);
  if (lastDoc.length != 0) {
    return lastDoc[0];
  }
  return null;
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