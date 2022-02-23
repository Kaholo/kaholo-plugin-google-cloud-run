const parsers = require("./parsers");
const GoogleCloudRunService = require("./google.run.service");

// auto complete helper methods

const MAX_RESULTS = 10;

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
  return itemsToReturn.splice(0, MAX_RESULTS);
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
    let nextPageToken;
    params.query = (query || "").trim();
    while (true) {
      try {
        // TODO: fix this >while (true)< loop
        // eslint-disable-next-line no-await-in-loop
        const result = await client[listFunc](params, fieldsCopy, nextPageToken);
        items.push(...handleResult(result.items || result, query, parseFuncRef));
        if (!paging || !query || !result.nextPageToken || items.length >= MAX_RESULTS) {
          return items;
        }
        const exactMatch = items.find((item) => item.value.toLowerCase() === query.toLowerCase()
                    || item.id.toLowerCase() === query.toLowerCase());
        if (exactMatch) {
          return [exactMatch];
        }
        nextPageToken = result.nextPageToken;
      } catch (err) {
        throw new Error(`Problem with '${listFunc}': ${err.message}`);
      }
    }
  };
}

module.exports = {
  listServicesAuto: listAuto("listServices", null, false, false, (service) => getAutoResult(service.metadata.name)),
  listProjectsAuto: listAuto("listProjects", ["projectId", "name"], false, true),
  listRegionsAuto: listAuto("listRegions", ["name"]),
  listServiceAccountsAuto: listAuto("listServiceAccounts", ["email", "displayName"]),
};
