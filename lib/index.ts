import { ChildProcess } from "./wrappers/child-process";
import { FileSystem } from "./wrappers/file-system";
import { SysInfo } from "./sys-info";
import { HostInfo } from "./host-info";
import { WinReg } from "./winreg";
import { Helpers } from "./helpers";
import { Doctor } from "./doctor";
import { AndroidLocalBuildRequirements } from "./local-build-requirements/android-local-build-requirements";
import { IosLocalBuildRequirements } from "./local-build-requirements/ios-local-build-requirements";

const childProcess = new ChildProcess();
const winreg = new WinReg();
const hostInfo = new HostInfo(winreg);
const fileSystem = new FileSystem();
const helpers = new Helpers();
const sysInfo = new SysInfo(childProcess, hostInfo, fileSystem, winreg, helpers);

const androidLocalBuildRequirements = new AndroidLocalBuildRequirements(sysInfo);
const iosLocalBuildRequirements = new IosLocalBuildRequirements(sysInfo, hostInfo);
const doctor = new Doctor(sysInfo, hostInfo, androidLocalBuildRequirements, iosLocalBuildRequirements, helpers);

export {
	sysInfo,
	doctor
};
