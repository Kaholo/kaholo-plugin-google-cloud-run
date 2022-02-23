const parsers = require("./parsers");
const GoogleCloudRunService = require("./google.run.service");

// auto complete helper methods

function mapAutoParams(autoParams) {
  const params = {};
  autoParams.forEach((param) => {
    params[param.name] = parsers.autocomplete(param.value);
  });
  return params;
}

function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id,
  };
}

function getParseFromParam(idParamName, valParamName) {
  if (valParamName) {
    return (item) => getAutoResult(item[idParamName], item[valParamName]);
  }
  return (item) => getAutoResult(item[idParamName]);
}

function filterItems(items, query) {
  let itemsToReturn = [...items];
  if (query) {
    const qWords = query.split(/[. ]/g).map((word) => word.toLowerCase()); // split by '.' or ' ' and make lower case
    itemsToReturn = itemsToReturn.filter(
      (item) => qWords.every((word) => item.value.toLowerCase().includes(word)),
    ).sort(
      (a, b) => a.value.toLowerCase().indexOf(qWords[0]) - b.value.toLowerCase().indexOf(qWords[0]),
    );
  }
  return itemsToReturn;
}

function handleResult(result, query, parseFunc) {
  let parseFuncRef = parseFunc;
  if (!parseFuncRef) {
    parseFuncRef = getParseFromParam("id", "name");
  }
  const items = result.map(parseFuncRef);
  return filterItems(items, query);
}

function listAuto(listFunc, fields, paging, noProject, parseFunc) {
  let fieldsCopy;
  let parseFuncRef = parseFunc;
  if (!fields) {
    fieldsCopy = ["id", "name"];
  } else {
    fieldsCopy = [...fields];
  }
  if (!parseFunc && fieldsCopy) {
    parseFuncRef = getParseFromParam(...fieldsCopy);
  }
  return async (query, pluginSettings, triggerParameters) => {
    const settings = mapAutoParams(pluginSettings);
    const
      params = mapAutoParams(triggerParameters);
    const client = GoogleCloudRunService.from(params, settings, noProject);
    const items = [];
    params.query = (query || "").trim();
    try {
      const result = await client[listFunc](params, fieldsCopy);
      items.push(...handleResult(result.items || result, query, parseFuncRef));
      if (query) {
        const exactMatch = items.find((item) => item.value.toLowerCase() === query.toLowerCase()
            || item.id.toLowerCase() === query.toLowerCase());
        if (exactMatch) {
          return [exactMatch];
        }
      }
      return items;
    } catch (err) {
      throw new Error(`Problem with '${listFunc}': ${err.message}`);
    }
  };
}

module.exports = {
  listServicesAuto: listAuto("listServices", null, false, false, (service) => getAutoResult(service.metadata.name)),
  listProjectsAuto: listAuto("listProjects", ["projectId", "name"], false, true),
  listRegionsAuto: listAuto("listRegions", ["name"]),
  listServiceAccountsAuto: listAuto("listServiceAccounts", ["email", "displayName"]),
};
