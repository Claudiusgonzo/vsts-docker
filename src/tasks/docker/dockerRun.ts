/// <reference path="../../../typings/vsts-task-lib/vsts-task-lib.d.ts" />

import tl = require("vsts-task-lib/task");
import * as docker from "./dockerCommand";

export function dockerRun(): void {
    var cwd = tl.getInput("cwd");
    tl.cd(cwd);

    var dockerConnectionString = tl.getInput("dockerServiceEndpoint", true);
    var registryEndpoint = tl.getInput("dockerRegistryServiceEndpoint", true);
    var imageName = tl.getInput("imageName", true);
    var containerName = tl.getInput("containerName", false);
    var envVars = tl.getDelimitedInput("envVars", "\n", false);
    var ports = tl.getDelimitedInput("ports", "\n", false);
    var additionalArgs = tl.getInput("additionalArgs", false);

    var registryConnetionDetails = tl.getEndpointAuthorization(registryEndpoint, true);

    var loginCmd = new docker.DockerCommand("login");
    loginCmd.dockerConnectionString = dockerConnectionString;
    loginCmd.registryConnetionDetails = registryConnetionDetails;
    loginCmd.execSync();

    if (containerName) {
        removeConflictingContainersByName(containerName, dockerConnectionString);
    }

    if (ports.length > 0) {
        removeConflictingContainersByPort(ports, dockerConnectionString);
    }

    var cmd = new docker.DockerCommand("run");
    cmd.dockerConnectionString = dockerConnectionString;
    cmd.imageName = imageName;
    cmd.containerName = containerName;
    cmd.ports = ports;
    cmd.envVars = envVars;
    cmd.additionalArguments = additionalArgs;
    cmd.execSync();

    var logoutCmd = new docker.DockerCommand("logout");
    logoutCmd.dockerConnectionString = dockerConnectionString;
    logoutCmd.execSync();
}

function removeConflictingContainersByName(containerName: string, dockerConnectionString: string): void {
    var cmd = new docker.DockerCommand("removeContainerByName");
    cmd.dockerConnectionString = dockerConnectionString;
    cmd.containerName = containerName;
    cmd.execSync();
}

function removeConflictingContainersByPort(ports: string[], dockerConnectionString: string): void {
    // TODO We should be removing containers that have conflicting ports
    // For now, we are removing all
    var cmd = new docker.DockerCommand("ps -a -q");
    cmd.dockerConnectionString = dockerConnectionString;
    var containerIdList = cmd.execSync().stdout.toString();

    if ( (containerIdList) && (containerIdList.trim() != "")) {
        var containerIds = containerIdList.split("\n").join(" ").trim();
        var cmd = new docker.DockerCommand("rm -f " + containerIds);
        cmd.dockerConnectionString = dockerConnectionString;
        cmd.execSync();
    }
}