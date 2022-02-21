const { JWT } = require("google-auth-library");
const { google } = require("googleapis");
const { removeUndefinedAndEmpty } = require("./helpers");
const parsers = require("./parsers");

const runApi = google.run("v1");
const cloudresourcemanager = google.cloudresourcemanager("v1");
const iam = google.iam("v1");
const compute = google.compute("v1");

module.exports = class GoogleCloudRunService {
  constructor({ creds, project, region }) {
    if (!creds || !project) { throw "Must provide credentials, project and region for all requests!"; }
    this.creds = creds;
    this.project = project;
    this.region = region;
  }

  static from(params, settings) {
    return new GoogleCloudRunService({
      creds: parsers.jsonString(params.creds || settings.creds),
      project: parsers.autocomplete(params.project) || parsers.string(settings.project),
      region: parsers.autocomplete(params.region) || parsers.string(settings.region),
    });
  }

  getAuthClient() {
    return new JWT(
      this.creds.client_email,
      null,
      this.creds.private_key,
      ["https://www.googleapis.com/auth/cloud-platform"],
    );
  }

  getParent(service) {
    return `projects/${this.project}/locations/${this.region}${service ? `/services/${service}` : ""}`;
  }

  async deployContainerService({
    name, containerImageUrl, consistantCpuAllocation, minInstances, maxInstances, port, commands, args,
    memory, cpuCount, timeout, maxConcurrency, execEnv, envVariables, serviceAccount, ingressRules, dontRequireAuthentication,
  }) {
    if (!name || !containerImageUrl || !port || !this.region) {
      throw "Didn't provide all required parameters.";
    }
    const result = {
      createService: (await runApi.projects.locations.services.create({
        requestBody: removeUndefinedAndEmpty({
          kind: "Service",
          apiVersion: "serving.knative.dev/v1",
          metadata: {
            name,
            namespace: this.project,
            labels: {
              "cloud.googleapis.com/location": this.region,
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
                  env: envVariables ? Object.entries(envVariables).map(([name, value]) => ({ name, value })) : undefined,
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
        auth: this.getAuthClient(),
        parent: this.getParent(),
      })).data,
    };
    if (dontRequireAuthentication) {
      try {
        result.setIamPolicy = (await runApi.projects.locations.services.setIamPolicy({
          resource: this.getParent(name),
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
          auth: this.getAuthClient(),
        })).data;
      } catch (error) {
        await this.deleteService({ service: name });
        throw `Error during setting Iam permissions for this service. error: ${error.message || JSON.stringify(error)}`;
      }
    }
    return result;
  }

  async deleteService({ service }) {
    return (await runApi.projects.locations.services.delete({
      name: this.getParent(service),
      auth: this.getAuthClient(),
    })).data;
  }

  async describeService({ service }) {
    return (await runApi.projects.locations.services.get({
      name: this.getParent(service),
      auth: this.getAuthClient(),
    })).data;
  }

  async listServices() {
    return (await runApi.projects.locations.services.list({
      auth: this.getAuthClient(),
      parent: this.getParent(),
    })).data.items || [];
  }

  async listProjects({ query }) {
    const request = removeUndefinedAndEmpty({
      auth: this.getAuthClient(),
      filter: query ? `name:*${query}* id:*${query}*` : undefined,
    });
    return (await cloudresourcemanager.projects.list(request)).data.projects;
  }

  async listRegions({}) {
    const request = removeUndefinedAndEmpty({
      auth: this.getAuthClient(),
      maxResults: 500,
      project: this.project,
      fields: "items/name",
    });
    return (await compute.regions.list(request)).data;
  }

  async listServiceAccounts() {
    const request = removeUndefinedAndEmpty({
      auth: this.getAuthClient(),
      name: `projects/${this.project}`,
    });

    return (await iam.projects.serviceAccounts.list(request)).data.accounts;
  }
};
