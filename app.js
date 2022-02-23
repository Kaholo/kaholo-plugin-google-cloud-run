const parsers = require("./parsers");
const GoogleCloudRunService = require("./google.run.service");
const { listServicesAuto } = require("./autocomplete");
const { listProjectsAuto } = require("./autocomplete");
const { listRegionsAuto } = require("./autocomplete");
const { listServiceAccountsAuto } = require("./autocomplete");

async function deployContainerService(action, settings) {
  const {
    name,
    containerImageUrl,
    consistantCpuAllocation,
    minInstances,
    maxInstances,
    port,
    commands,
    args,
    memory,
    cpuCount,
    timeout,
    maxConcurrency,
    execEnv,
    envVariables,
    serviceAccount,
    ingressRules,
    dontRequireAuthentication,
  } = action.params;

  const client = GoogleCloudRunService.from(action.params, settings);
  return client.deployContainerService({
    name: parsers.string(name),
    containerImageUrl: parsers.string(containerImageUrl),
    consistantCpuAllocation: parsers.boolean(consistantCpuAllocation),
    minInstances: parsers.number(minInstances),
    maxInstances: parsers.number(maxInstances),
    port: parsers.number(port),
    commands: parsers.array(commands),
    args: parsers.array(args),
    memory: parsers.number(memory),
    timeout: parsers.number(timeout),
    maxConcurrency: parsers.number(maxConcurrency),
    envVariables: parsers.tags(envVariables),
    serviceAccount: parsers.autocomplete(serviceAccount),
    dontRequireAuthentication: parsers.boolean(dontRequireAuthentication),
    execEnv,
    ingressRules,
    cpuCount,
  });
}

async function deleteService(action, settings) {
  const { service } = action.params;
  const client = GoogleCloudRunService.from(action.params, settings);
  return client.deleteService({
    service: parsers.autocomplete(service),
  });
}

async function describeService(action, settings) {
  const { service } = action.params;
  const client = GoogleCloudRunService.from(action.params, settings);
  return client.describeService({
    service: parsers.autocomplete(service),
  });
}

async function listServices(action, settings) {
  const client = GoogleCloudRunService.from(action.params, settings);
  return client.listServices({});
}

module.exports = {
  deployContainerService,
  deleteService,
  describeService,
  listServices,
  listServicesAuto,
  listProjectsAuto,
  listRegionsAuto,
  listServiceAccountsAuto,
};
