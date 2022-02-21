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

/** *
 * @returns {[{id, value}]} filtered result items
 ** */
function handleResult(result, query, parseFunc) {
  if (!parseFunc) { parseFunc = getParseFromParam("id", "name"); }
  const items = result.map(parseFunc);
  return filterItems(items, query);
}

function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id,
  };
}

function getParseFromParam(idParamName, valParamName) {
  if (valParamName) { return (item) => getAutoResult(item[idParamName], item[valParamName]); }
  return (item) => getAutoResult(item[idParamName]);
}

function filterItems(items, query) {
  if (query) {
    const qWords = query.split(/[. ]/g).map((word) => word.toLowerCase()); // split by '.' or ' ' and make lower case
    items = items.filter((item) => qWords.every((word) => item.value.toLowerCase().includes(word)));
    items = items.sort((word1, word2) => word1.value.toLowerCase().indexOf(qWords[0]) - word2.value.toLowerCase().indexOf(qWords[0]));
  }
  return items.splice(0, MAX_RESULTS);
}

function listAuto(listFunc, fields, paging, noProject, parseFunc) {
  if (!fields) { fields = ["id", "name"]; }
  if (!parseFunc && fields) { parseFunc = getParseFromParam(...fields); }
  return async (query, pluginSettings, triggerParameters) => {
    const settings = mapAutoParams(pluginSettings); const
      params = mapAutoParams(triggerParameters);
    const client = GoogleCloudRunService.from(params, settings, noProject);
    const items = [];
    let nextPageToken;
    query = (query || "").trim();
    params.query = query;
    while (true) {
      try {
        const result = await client[listFunc](params, fields, nextPageToken);
        items.push(...handleResult(result.items || result, query, parseFunc));
        if (!paging || !query || !result.nextPageToken || items.length >= MAX_RESULTS) { return items; }
        const exactMatch = items.find((item) => item.value.toLowerCase() === query.toLowerCase()
                                              || item.id.toLowerCase() === query.toLowerCase());
        if (exactMatch) { return [exactMatch]; }
        nextPageToken = result.nextPageToken;
      } catch (err) {
        throw `Problem with '${listFunc}': ${err.message}`;
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
