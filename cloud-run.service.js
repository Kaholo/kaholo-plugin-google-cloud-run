const { JWT } = require("google-auth-library");
const { google } = require("googleapis");
const { removeUndefinedAndEmpty } = require("./helpers");
const parsers = require("./parsers");

const runApi = google.run("v1");
const cloudresourcemanager = google.cloudresourcemanager("v1");
const iam = google.iam("v1");
const compute = google.compute("v1");

function mergeInputs(params, settings) {
  return {
    credentials: parsers.jsonString(params.creds || settings.creds),
    project: parsers.autocomplete(params.project) || parsers.string(settings.project),
    region: parsers.autocomplete(params.region) || parsers.string(settings.region),
  };
}

function getAuthClient(credentials) {
  return new JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/cloud-platform"],
  );
}

function getParent(project, region, service = "") {
  return `projects/${project}/locations/${region}${service && `/services/${service}`}`;
}

async function deployContainerService(
  credentials,
  project,
  region,
  {
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
  },
) {
  if (!name || !containerImageUrl || !port) {
    throw new Error("Didn't provide all required parameters.");
  }
  const result = {
    createService: (await runApi.projects.locations.services.create({
      requestBody: removeUndefinedAndEmpty({
        kind: "Service",
        apiVersion: "serving.knative.dev/v1",
        metadata: {
          name,
          namespace: project,
          labels: {
            "cloud.googleapis.com/location": region,
          },
          annotations: {
            "client.knative.dev/user-image": containerImageUrl,
            "run.googleapis.com/ingress": ingressRules || "all",
          },
        },
        spec: {
          template: {
            metadata: {
              annotations: {
                "run.googleapis.com/execution-environment": execEnv || "gen1",
                "autoscaling.knative.dev/minScale": String(minInstances || 0),
                "autoscaling.knative.dev/maxScale": String(maxInstances || 100),
                "run.googleapis.com/cpu-throttling": consistantCpuAllocation ? "false" : "true",
              },
            },
            spec: {
              containerConcurrency: maxConcurrency || 0,
              timeoutSeconds: timeout,
              serviceAccountName: serviceAccount,
              containers: [{
                image: containerImageUrl,
                args: args.length ? args : undefined,
                command: commands.length ? commands : undefined,
                ports: [{ containerPort: port }],
                env: envVariables ? Object.entries(envVariables).map(([_name, _value]) => ({
                  name: _name,
                  value: _value,
                })) : undefined,
                resources: {
                  limits: {
                    cpu: `${cpuCount * 1000}m`,
                    memory: `${memory}Mi`,
                  },
                },
              }],
            },
          },
        },
      }),
      auth: getAuthClient(credentials),
      parent: getParent(project, region),
    })).data,
  };
  if (dontRequireAuthentication) {
    try {
      result.setIamPolicy = (await runApi.projects.locations.services.setIamPolicy({
        resource: getParent(project, region, name),
        requestBody: {
          policy: {
            bindings: [
              {
                members: ["allUsers"],
                role: "roles/run.invoker",
              },
            ],
          },
        },
        auth: getAuthClient(credentials),
      })).data;
    } catch (error) {
      await deleteService({ service: name }, credentials, project, region);
      throw new Error(`Error during setting Iam permissions for this service. error: ${error.message || JSON.stringify(error)}`);
    }
  }
  return result;
}

async function deleteService({ service }, credentials, project, region) {
  return (await runApi.projects.locations.services.delete({
    name: getParent(project, region, service),
    auth: getAuthClient(credentials),
  })).data;
}

async function describeService({ service }, credentials, project, region) {
  return (await runApi.projects.locations.services.get({
    auth: getAuthClient(credentials),
    name: getParent(project, region, service),
  })).data;
}

async function listServices(credentials, project, region) {
  const request = {
    auth: getAuthClient(credentials),
    parent: getParent(project, region),
  };

  return (await runApi.projects.locations.services.list(request)).data.items || [];
}

async function listProjects({ query }, credentials) {
  const request = removeUndefinedAndEmpty({
    auth: getAuthClient(credentials),
  });
  if (query) {
    request.filter = `name:*${query}* id:*${query}*`;
  }

  return (await cloudresourcemanager.projects.list(request)).data.projects;
}

async function listRegions(credentials, project) {
  const request = removeUndefinedAndEmpty({
    auth: getAuthClient(credentials),
    maxResults: 500,
    project,
    fields: "items/name",
  });

  return (await compute.regions.list(request)).data;
}

async function listServiceAccounts(credentials, project) {
  const request = removeUndefinedAndEmpty({
    auth: getAuthClient(credentials),
    name: `projects/${project}`,
  });

  return (await iam.projects.serviceAccounts.list(request)).data.accounts;
}

module.exports = {
  mergeInputs,
  getAuthClient,
  getParent,
  deployContainerService,
  deleteService,
  describeService,
  listServices,
  listProjects,
  listRegions,
  listServiceAccounts,
};
