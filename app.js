const parsers = require("./parsers");
const GoogleCloudRunService = require("./cloud-run.service");
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
  const { credentials, project, region } = GoogleCloudRunService.mergeInputs(action.params, settings);

  return GoogleCloudRunService.deployContainerService(
      credentials,
      project,
      region, {
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
  const { credentials, project, region } = GoogleCloudRunService.mergeInputs(action.params, settings);
  return GoogleCloudRunService.deleteService(
      { service: parsers.autocomplete(service) },
      credentials,
      project,
      region
  );
}

async function describeService(action, settings) {
  const { service } = action.params;
  const { credentials, project, region } = GoogleCloudRunService.mergeInputs(action.params, settings);
  return GoogleCloudRunService.describeService(
    { service: parsers.autocomplete(service) },
    credentials,
    project,
    region
  );
}

async function listServices(action, settings) {
  const { credentials, project, region } = GoogleCloudRunService.mergeInputs(action.params, settings);
  const services = await GoogleCloudRunService.listServices(credentials, project, region)
  return services;
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
