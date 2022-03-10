const parsers = require("./parsers");
const GoogleCloudRunService = require("./cloud-run.service");

// auto complete helper methods

function generateAutocompleter(
  getResultFunc,
  parseFunc,
) {
  return async (query, pluginSettings, triggerParameters) => {
    const {
      credentials,
      project,
      region,
    } = GoogleCloudRunService.mergeInputs(
      mapToAutocompleteParams(triggerParameters),
      mapToAutocompleteParams(pluginSettings),
    );

    try {
      const result = await getResultFunc({
        query,
        credentials,
        project,
        region,
      });
      return parseAndFilterResult(result, parseFunc, query);
    } catch (err) {
      throw new Error(`Autocompleter generation failed: ${err.message}`);
    }
  };
}

function mapToAutocompleteParams(autocompleteParams) {
  const params = {};
  autocompleteParams.forEach((param) => {
    params[param.name] = parsers.autocomplete(param.value);
  });
  return params;
}

function parseAndFilterResult(result, parseFunc, query) {
  let list = [];
  const parsedItems = (result.list || result.items || result).map(parseFunc);
  list = list.concat(filterItems(parsedItems, query));

  if (query) {
    const exactMatch = list.find(
      (item) => (item.value.toLowerCase() === query.toLowerCase()
            || item.id.toLowerCase() === query.toLowerCase()),
    );
    if (exactMatch) {
      return [exactMatch];
    }
  }
  return list;
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

function getParseFromParam(idParamName, valParamName) {
  return (item) => getAutoResult(
    item[idParamName],
    valParamName ? item[valParamName] : null,
  );
}

function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id,
  };
}

module.exports = {
  listServicesAuto: generateAutocompleter(
    ({
      credentials,
      project,
      region,
    }) => GoogleCloudRunService.listServices(credentials, project, region),
    (service) => getAutoResult(service.metadata.name),
  ),
  listProjectsAuto: generateAutocompleter(
    async ({
      query,
      credentials,
    }) => GoogleCloudRunService.listProjects({ query: (query || "").trim() }, credentials),
    getParseFromParam("projectId", "name"),
  ),
  listRegionsAuto: generateAutocompleter(
    async ({
      credentials,
      project,
    }) => GoogleCloudRunService.listRegions(credentials, project),
    getParseFromParam("name"),
  ),
  listServiceAccountsAuto: generateAutocompleter(
    async ({
      credentials,
      project,
    }) => GoogleCloudRunService.listServiceAccounts(credentials, project),
    getParseFromParam("email", "displayName"),
  ),
};
