# kaholo-plugin-Google-Cloud-Run
Kaholo plugin for integration with Google Cloud Run API.

##  Settings
1. Service Account Credentials (Vault) **Required if not in action** - Default service account credentials
[Learn More](https://cloud.google.com/docs/authentication/production)
2. Default Project ID (String) **Required if not in action** - The ID of the default project to send requests to.
[Learn More](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
3. Default Region (String) **Required if not in action** - The default region to send requests to.
[Learn More](https://cloud.google.com/compute/docs/regions-zones)

## Method: Deploy Service From Container
Deploy a new service from a google container image.

## Parameters
1. Service Account Credentials (Vault) **Required if not in settings** - Service account credentials
[Learn More](https://cloud.google.com/docs/authentication/production)
2. Project (Autocomplete) **Required if not in settings** - Project name
[Learn More](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
3. Region (Autocomplete) **Required if not in settings** - The region to deploy the service in.
[Learn More](https://cloud.google.com/compute/docs/regions-zones)
4. Name (String) **Required** - Name of the new service to deploy. Service name may only start with a letter and contain up to 63 lowercase letters, numbers or hyphens.
[Learn More](https://cloud.google.com/run/docs/deploying)
5. Container Image URL (String) **Required** - Deploy the service using one revision from an existing container image. Only supports containers from Google Container 
[Learn More](https://cloud.google.com/run/docs/deploying)
6. Consistant CPU Allocation (Boolean) **Optional** - If true CPU for the container is always allocated. If false CPU is only allocated during request proccesing. Default value is false.
[Learn More](https://cloud.google.com/run/pricing)
7. Minimum Number Of Instances (String) **Optional** - For autoscaling. Default is 0. Set to 1 to reduce cold starts.
[Learn More](https://cloud.google.com/run/docs/configuring/min-instances)
8. Minimum Number Of Instances (String) **Optional** - For autoscaling. Default is 100. Possible values are 1-1000.
[Learn More](https://cloud.google.com/run/docs/configuring/max-instances)
9. Container Port (String) **Optional** - Requests will be sent to the container on this port. Saved as $PORT env variable.
10. Container Entry Commands (Text) **Optional** - Commands to run in the container on entry. Leave blank to use the entry point command defined in the container image. Can enter multiple values by seperating each with a new line.
[Learn More](https://cloud.google.com/run/docs/tutorials/gcloud)
11. Container Arguments (Text) **Optional** - Arguments passed to the entry point command. Can enter multiple values by seperating each with a new line.
[Learn More](https://cloud.google.com/run/docs/tutorials/gcloud)
12. Container Memory(in MB) (String) **Optional** - Memory to allocate to each container instance, in MB.
[Learn More](https://cloud.google.com/run/docs/configuring/memory-limits)
13. CPU Count (Options) **Optional** - Number of vCPUs allocated to each container instance. Possible values are: 1/2/4.Possible values: **1 | 2 | 4**
[Learn More](https://cloud.google.com/run/docs/configuring/cpu)
14. Request Timeout(In seconds) (String) **Optional** - Time within which a response must be returned. Value must be between 1-3600. Default is 300.
[Learn More](https://cloud.google.com/run/docs/configuring/request-timeout)
15. Maximum Requests Per Container (String) **Optional** - The maximum number of concurrent requests that can reach each container instance. Value must be between 1-1000. Default is 80.
[Learn More](https://cloud.google.com/run/docs/configuring/concurrency)
16. Execution Environment (Options) **Optional** - The execution environment your container runs in. Default is first generation.Possible values: **First Generation | Second Generation**
[Learn More](https://cloud.google.com/run/docs/about-execution-environments)
17. Environment variables (Text) **Optional** - Environment variables to pass to the container. Must be specified in a key=value format. Can enter multiple variables by seperating each with a new line.
[Learn More](https://cloud.google.com/run/docs/configuring/environment-variables)
18. Service Account (Autocomplete) **Optional** - Identity to be used by the created revision. Must have sufficent permissions(roles) to run commands on google run and any other google services used. If not specified will use the default service account of the project.
[Learn More](https://cloud.google.com/run/docs/securing/service-identity)
19. Ingress Rules (Options) **Optional** - Restrict network access to your Cloud Run service. Default is 'Allow all traffic'.Possible values: **Allow all traffic | Allow internal and from load balancing | Allow internal traffic only**
[Learn More](https://cloud.google.com/run/docs/securing/ingress)
20. Dont Require Authentication (Boolean) **Optional** - If true, allow unauthenticated invocations of the service(for creating a public API, or a website). If false, require google IAM authentication. Manage authorized users with Cloud IAM. Default value is false.
[Learn More](https://cloud.google.com/run/docs/securing/managing-access)

## Method: Delete Service
Delete the specified service.

## Parameters
1. Service Account Credentials (Vault) **Required if not in settings** - Service account credentials
[Learn More](https://cloud.google.com/docs/authentication/production)
2. Project (Autocomplete) **Required if not in settings** - Project name
[Learn More](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
3. Region (Autocomplete) **Required if not in settings** - The region to deploy the service in.
[Learn More](https://cloud.google.com/compute/docs/regions-zones)
4. Service (Autocomplete) **Required** - The service to delete.
[Learn More](https://cloud.google.com/run/docs/managing/services)

## Method: Describe Service
Describe the specified service.

## Parameters
1. Service Account Credentials (Vault) **Required if not in settings** - Service account credentials
[Learn More](https://cloud.google.com/docs/authentication/production)
2. Project (Autocomplete) **Required if not in settings** - Project name
[Learn More](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
3. Region (Autocomplete) **Required if not in settings** - The region to deploy the service in.
[Learn More](https://cloud.google.com/compute/docs/regions-zones)
4. Service (Autocomplete) **Required** - The service to describe.
[Learn More](https://cloud.google.com/run/docs/managing/services)

## Method: List Services
List all services from the specified region and project.

## Parameters
1. Service Account Credentials (Vault) **Required if not in settings** - Service account credentials
[Learn More](https://cloud.google.com/docs/authentication/production)
2. Project (Autocomplete) **Required if not in settings** - Project name
[Learn More](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
3. Region (Autocomplete) **Required if not in settings** - List services only from the specified region.
[Learn More](https://cloud.google.com/compute/docs/regions-zones)